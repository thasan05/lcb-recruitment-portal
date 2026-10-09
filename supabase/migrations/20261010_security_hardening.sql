-- ====================================================================
-- LinkedIn Community Bangladesh (LCB) Recruitment Portal
-- Migration: 20261010_security_hardening.sql
-- Comprehensive Database Security Hardening, RLS Isolation & Least Privilege
-- ====================================================================

-- 1. Ensure all expected columns exist (handles schemas with either full_name/last_updated or name/updated_at)
DO $$ 
BEGIN
    -- Ensure 'name' exists alongside 'full_name'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'name') THEN
        ALTER TABLE public.candidates ADD COLUMN name VARCHAR(255);
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'full_name') THEN
            UPDATE public.candidates SET name = full_name WHERE name IS NULL;
        END IF;
    END IF;

    -- Ensure 'updated_at' exists alongside 'last_updated'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'updated_at') THEN
        ALTER TABLE public.candidates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'last_updated') THEN
            UPDATE public.candidates SET updated_at = last_updated WHERE updated_at IS NULL;
        END IF;
    END IF;

    -- Ensure 'email_sent' column exists for HR console email tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'email_sent') THEN
        ALTER TABLE public.candidates ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Ensure 'email_sent_at' column exists for timestamping email dispatches
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'email_sent_at') THEN
        ALTER TABLE public.candidates ADD COLUMN email_sent_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Enable RLS on all candidate & recruitment tables
ALTER TABLE IF EXISTS public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop all insecure / overly permissive policies from any prior migrations
DROP POLICY IF EXISTS "Public read candidate by token" ON public.candidates;
DROP POLICY IF EXISTS "Candidates read own status via secure_token" ON public.candidates;
DROP POLICY IF EXISTS "Allow anon read" ON public.candidates;
DROP POLICY IF EXISTS "Public can view candidates" ON public.candidates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.candidates;
DROP POLICY IF EXISTS "Admin full access candidates" ON public.candidates;

DROP POLICY IF EXISTS "Public read interviews" ON public.interviews;
DROP POLICY IF EXISTS "Admin full access interviews" ON public.interviews;

DROP POLICY IF EXISTS "Public read updates" ON public.candidate_updates;
DROP POLICY IF EXISTS "Admin full access updates" ON public.candidate_updates;

DROP POLICY IF EXISTS "Admin full access notes" ON public.internal_notes;
DROP POLICY IF EXISTS "Admin full access activity" ON public.activity_logs;

-- 4. Grant table access strictly to service_role (used by secure Next.js server backend)
GRANT ALL ON TABLE public.candidates TO service_role;
GRANT ALL ON TABLE public.interviews TO service_role;
GRANT ALL ON TABLE public.candidate_updates TO service_role;
GRANT ALL ON TABLE public.internal_notes TO service_role;
GRANT ALL ON TABLE public.activity_logs TO service_role;

-- 5. Harden Security-Definer RPC with fixed search_path to prevent Search Path Hijacking (CWE-426)
-- Handles both full_name and name, and both last_updated and updated_at seamlessly
CREATE OR REPLACE FUNCTION public.get_candidate_status_by_token(token_param text)
RETURNS TABLE (
    name VARCHAR,
    status VARCHAR,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
    SELECT 
        COALESCE(c.full_name, c.name)::VARCHAR AS name,
        c.status::VARCHAR AS status,
        COALESCE(c.last_updated, c.updated_at, c.created_at) AS updated_at
    FROM public.candidates c
    WHERE c.secure_token = token_param
      AND token_param IS NOT NULL
      AND length(token_param) >= 12
    LIMIT 1;
$$;

-- Grant EXECUTE on RPC function to anon and service_role
REVOKE ALL ON FUNCTION public.get_candidate_status_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_candidate_status_by_token(text) TO anon, service_role;

-- 6. Add indexes for high-speed exact token and email lookups
CREATE INDEX IF NOT EXISTS idx_candidates_token_exact ON public.candidates(secure_token);
CREATE INDEX IF NOT EXISTS idx_candidates_email_lower ON public.candidates(lower(email));
