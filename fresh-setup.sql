-- Complete Setup for Nouri Auth System
-- Copy and paste this entire file into Supabase SQL Editor and click Run

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- NOTE (DEV/MVP):
-- We intentionally do NOT enable RLS for these tables right now.
-- Your app writes/reads OTP + verification from the client (anon key),
-- so enabling RLS without an Edge Function will cause permission errors/noisy logs.
--
-- Production recommendation:
-- Move OTP generation + sending + verification into a server (Supabase Edge Function),
-- then enable RLS and lock these tables down to service_role only.

-- Grant permissions
GRANT ALL ON public.email_verifications TO service_role;
GRANT ALL ON public.otp_codes TO service_role;
GRANT SELECT ON public.email_verifications TO authenticated;

-- Function to delete expired OTPs (optional cleanup)
CREATE OR REPLACE FUNCTION public.delete_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < NOW();
END;
$$;
