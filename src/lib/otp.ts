import { supabase } from './supabase';

const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = 'noreply@itsnouri.ca'; // Verified domain email

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in Supabase database temporarily
 */
export async function storeOTP(email: string, code: string) {
  try {
    // Store OTP with expiration (10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error } = await supabase
      .from('otp_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (error) {
      // If table doesn't exist, we'll handle it
      if (__DEV__) console.warn('Error storing OTP (falling back to memory):', error);
      // For now, we'll use in-memory storage as fallback
      return { success: true, useMemory: true };
    }

    return { success: true, useMemory: false };
  } catch (error) {
    if (__DEV__) console.warn('Error storing OTP (falling back to memory):', error);
    return { success: true, useMemory: true };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(email: string, code: string): Promise<boolean> {
  try {
    // Try database first
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      // Check in-memory storage as fallback
      return checkMemoryOTP(email, code);
    }

    // Delete used OTP
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email)
      .eq('code', code);

    return true;
  } catch (error) {
    if (__DEV__) console.warn('Error verifying OTP (falling back to memory):', error);
    return checkMemoryOTP(email, code);
  }
}

/**
 * Send OTP via Resend email
 */
export async function sendOTPEmail(email: string, code: string, name?: string) {
  try {
    if (!RESEND_API_KEY) {
      return {
        success: false,
        error: 'Email service is not configured (missing EXPO_PUBLIC_RESEND_API_KEY).',
      };
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject: 'Verify your email - Nouri',
        html: `
          <h2>Confirm your signup</h2>
          <p>Hi ${name || 'there'},</p>
          <p>Enter this code in the app to verify your email:</p>
          <h1 style="font-size: 32px; letter-spacing: 8px; text-align: center; margin: 20px 0;">${code}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return { success: true };
  } catch (error: any) {
    if (__DEV__) console.warn('Error sending OTP email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification email',
    };
  }
}

/**
 * Delete expired OTPs
 */
export async function cleanupExpiredOTPs() {
  try {
    await supabase
      .from('otp_codes')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch (error) {
    // Ignore errors
  }
}

// In-memory storage fallback (if database table doesn't exist)
const memoryOTPStore: Map<string, { code: string; expiresAt: Date }> = new Map();

function checkMemoryOTP(email: string, code: string): boolean {
  const stored = memoryOTPStore.get(email);
  if (!stored) return false;
  
  if (new Date() > stored.expiresAt) {
    memoryOTPStore.delete(email);
    return false;
  }
  
  if (stored.code === code) {
    memoryOTPStore.delete(email);
    return true;
  }
  
  return false;
}

export function storeOTPInMemory(email: string, code: string) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  memoryOTPStore.set(email, { code, expiresAt });
}
