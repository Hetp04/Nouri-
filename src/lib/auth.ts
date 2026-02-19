import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { normalizeEmail } from './utils';

WebBrowser.maybeCompleteAuthSession();


export interface SignInData {
  email: string;
  password: string;
}

/**
 * Check if email is verified
 */
async function isEmailVerified(email: string): Promise<boolean> {
  try {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await supabase
      .from('email_verifications')
      .select('verified')
      .eq('email', normalizedEmail)
      .single();

    if (error) {
      if (__DEV__) console.log('Verification check error:', error);

      // FAIL CLOSED: If we can't verify status (error or not found), 
      // check if user is ALREADY logged in (safety net)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && normalizeEmail(user.email || '') === normalizedEmail) {
        return true;
      }

      // If no user session and table lookup failed, security first: block login.
      return false;
    }

    return data?.verified === true;
  } catch (error) {
    if (__DEV__) console.warn('Error checking verification status:', error);
    // FAIL CLOSED: Block on unexpected errors.
    return false;
  }
}

/**
 * Sign in an existing user
 * Only allows sign-in if email is verified
 */
export async function signInWithEmail({ email, password }: SignInData) {
  try {
    const normalizedEmail = normalizeEmail(email);
    if (__DEV__) console.log('🔐 Attempting sign in for:', normalizedEmail);

    // Check if email is verified first
    const verified = await isEmailVerified(normalizedEmail);
    if (__DEV__) console.log('✅ Email verification status:', verified);

    if (!verified) {
      if (__DEV__) console.log('❌ Email not verified, blocking sign in');
      return {
        success: false,
        error: 'Please verify your email before signing in. Check your inbox for the verification code.',
        needsVerification: true,
      };
    }

    if (__DEV__) console.log('🔓 Proceeding with Supabase sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const message = error.message || 'Failed to sign in';
      if (__DEV__) console.warn('❌ Supabase sign in error:', message);
      return {
        success: false,
        error: message.includes('Invalid login credentials')
          ? 'Incorrect email or password.'
          : message,
      };
    }

    if (__DEV__) console.log('✅ Sign in successful!');
    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error: any) {
    if (__DEV__) console.warn('Sign in error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign in',
    };
  }
}


/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign out',
    };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, session };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const redirectTo = makeRedirectUri({
      scheme: 'nouriok', // Should match your app.json scheme
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const { params, errorCode } = extractParamsFromUrl(result.url);

        if (errorCode) {
          throw new Error(`Auth error: ${errorCode}`);
        }

        const { access_token, refresh_token } = params;

        if (access_token && refresh_token) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) throw sessionError;

          // RELIABLE NEW USER DETECTION:
          // We check if a profile exists in DB. If no profile exists, they are "new" 
          // because they haven't completed onboarding, even if they've authorized with Google before.
          let isNewUser = false;
          const user = sessionData?.user;
          if (user) {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

              if (profileError && profileError.code === 'PGRST116') {
                // No row found — user needs onboarding
                isNewUser = true;
              }
            } catch {
              // Fail safe: if table query fails, don't assume they are new to avoid re-onboarding bugs
              isNewUser = false;
            }
          }

          return {
            success: true,
            user: sessionData?.user,
            session: sessionData?.session,
            isNewUser
          };
        }
      }
    }

    // If we reach here, the auth was cancelled or tokens were missing.
    await supabase.auth.signOut().catch(() => { });
    return { success: false, error: 'Authorization was cancelled or failed.' };
  } catch (error: any) {
    if (__DEV__) console.warn('Google sign-in error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign in with Google',
    };
  }
}

/**
 * Helper to extract tokens from the redirect URL
 */
function extractParamsFromUrl(url: string) {
  const params: any = {};
  const queryString = url.split('#')[1] || url.split('?')[1];

  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      params[key] = value;
    }
  }

  return { params, errorCode: params.error };
}
