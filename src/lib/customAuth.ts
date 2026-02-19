import { supabase } from './supabase';
import { generateOTP, storeOTP, storeOTPInMemory, sendOTPEmail, verifyOTP } from './otp';
import { normalizeEmail } from './utils';

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

// Store password temporarily for sign-in after verification
const pendingSignIns: Map<string, { password: string; name?: string }> = new Map();

/**
 * Sign up with custom 6-digit OTP verification
 * Disables Supabase email confirmation and uses our custom system
 */
export async function signUpWithCustomOTP({ email, password, name }: SignUpData) {
  try {
    const normalizedEmail = normalizeEmail(email);
    // Store password temporarily for sign-in after verification
    pendingSignIns.set(normalizedEmail, { password, name });

    // First, sign up user in Supabase (but don't require email confirmation)
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      // Provide more helpful error messages
      if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
        throw new Error('Network error: Please check your internet connection and try again.');
      }
      throw error;
    }

    // Sign out immediately - user needs to verify before accessing app
    if (data.session) {
      await supabase.auth.signOut();
    }

    // Create unverified record in email_verifications table
    try {
      const { error: insertError } = await supabase
        .from('email_verifications')
        .insert({
          email: normalizedEmail,
          verified: false,
        });

      if (insertError) {
        // Duplicate record is fine (user re-signing up).
        if (insertError.code !== '23505' && __DEV__) {
          console.warn('Could not create verification record:', insertError);
        }
        // Try upsert instead in case record already exists
        await supabase
          .from('email_verifications')
          .upsert({
            email: normalizedEmail,
            verified: false,
          }, {
            onConflict: 'email',
          });
      }
    } catch (dbError) {
      // If table doesn't exist, continue (will use fallback)
      if (__DEV__) console.warn('Could not create/update verification record:', dbError);
    }

    // Generate 6-digit OTP
    const otpCode = generateOTP();

    // Store OTP
    const storeResult = await storeOTP(normalizedEmail, otpCode);
    if (storeResult.useMemory) {
      storeOTPInMemory(normalizedEmail, otpCode);
    }

    // Send OTP via Resend
    const emailResult = await sendOTPEmail(normalizedEmail, otpCode, name);

    if (!emailResult.success) {
      if (__DEV__) console.warn('Failed to send OTP email:', emailResult.error);
      // Still return success - user can request resend
    }

    return {
      success: true,
      user: data.user,
      needsVerification: true, // Always needs verification with custom OTP
    };
  } catch (error: any) {
    if (__DEV__) console.warn('Sign up error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign up',
    };
  }
}

/**
 * Verify custom 6-digit OTP and sign user in
 */
export async function verifyCustomOTP(email: string, code: string) {
  try {
    const normalizedEmail = normalizeEmail(email);
    // Verify OTP
    const isValid = await verifyOTP(normalizedEmail, code);

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid or expired verification code',
      };
    }

    // OTP is valid - mark email as verified in database
    try {
      const { error: upsertError } = await supabase
        .from('email_verifications')
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('email', normalizedEmail);

      if (upsertError) {
        // If update failed, try insert
        const { error: insertError } = await supabase
          .from('email_verifications')
          .insert({
            email: normalizedEmail,
            verified: true,
            verified_at: new Date().toISOString(),
          });

        if (insertError) {
          if (__DEV__) console.warn('Could not update verification status:', insertError);
        } else {
          if (__DEV__) console.log('✅ Email verification record created successfully for:', normalizedEmail);
        }
      } else {
        if (__DEV__) console.log('✅ Email verification record updated successfully for:', normalizedEmail);
      }
    } catch (dbError) {
      // If table doesn't exist, continue anyway
      if (__DEV__) console.warn('Could not update verification status (table may not exist):', dbError);
    }

    // Get stored password and sign user in
    const signInData = pendingSignIns.get(normalizedEmail);
    if (!signInData) {
      return {
        success: false,
        error: 'Session expired. Please sign up again.',
      };
    }

    // Sign user in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: signInData.password,
    });

    if (error) {
      // If sign-in fails, user might already be signed in or password changed
      if (__DEV__) console.warn('Sign in error after verification:', error);
      return {
        success: false,
        error: 'Verification successful, but sign in failed. Please try signing in manually.',
      };
    }

    // Clean up
    pendingSignIns.delete(normalizedEmail);

    return {
      success: true,
      user: data.user,
      session: data.session,
      verified: true,
    };
  } catch (error: any) {
    if (__DEV__) console.warn('OTP verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify code',
    };
  }
}

/**
 * Resend custom OTP
 */
export async function resendCustomOTP(email: string, name?: string) {
  try {
    const normalizedEmail = normalizeEmail(email);
    const otpCode = generateOTP();

    const storeResult = await storeOTP(normalizedEmail, otpCode);
    if (storeResult.useMemory) {
      storeOTPInMemory(normalizedEmail, otpCode);
    }

    const emailResult = await sendOTPEmail(normalizedEmail, otpCode, name);

    return emailResult;
  } catch (error: any) {
    if (__DEV__) console.warn('Resend OTP error:', error);
    return {
      success: false,
      error: error.message || 'Failed to resend verification code',
    };
  }
}
