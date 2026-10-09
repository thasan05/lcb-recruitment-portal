-- ====================================================================
-- LinkedIn Community Bangladesh (LCB) Recruitment Portal
-- Migration: 20261003_simplified_schema.sql
-- Simplified Recruitment Notification System & Security Hardening
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create candidates table if not exists
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'decision_pending',
    secure_token VARCHAR(64) NOT NULL UNIQUE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backwards-compatibility column upgrades if updating an existing table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'name') THEN
        ALTER TABLE public.candidates ADD COLUMN name VARCHAR(255);
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'full_name') THEN
            UPDATE public.candidates SET name = full_name WHERE name IS NULL;
        END IF;
        ALTER TABLE public.candidates ALTER COLUMN name SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'email_sent') THEN
        ALTER TABLE public.candidates ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'email_sent_at') THEN
        ALTER TABLE public.candidates ADD COLUMN email_sent_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'updated_at') THEN
        ALTER TABLE public.candidates ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'last_updated') THEN
            UPDATE public.candidates SET updated_at = last_updated WHERE updated_at IS NULL;
        END IF;
    END IF;
END $$;

-- Indexes for high-performance lookups
CREATE INDEX IF NOT EXISTS idx_candidates_token ON public.candidates(secure_token);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(lower(email));
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ====================================================================
-- Enable Row Level Security on the candidates table
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- 1. Remove all insecure policies that allowed anonymous users to list all candidates
DROP POLICY IF EXISTS "Candidates read own status via secure_token" ON public.candidates;
DROP POLICY IF EXISTS "Allow anon read" ON public.candidates;
DROP POLICY IF EXISTS "Public can view candidates" ON public.candidates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.candidates;

-- 2. Revoke direct SELECT / INSERT / UPDATE / DELETE access for public/anon/authenticated roles.
-- This prevents attackers from listing the candidates table using the client anon key.
REVOKE ALL ON TABLE public.candidates FROM anon;
REVOKE ALL ON TABLE public.candidates FROM authenticated;

-- 3. Grant full access strictly to service_role (used by the backend Next.js server)
GRANT ALL ON TABLE public.candidates TO service_role;

-- 4. Optional Security-Definer RPC for safe single-candidate status lookup by secret token
-- This function runs with elevated privileges but ONLY returns non-sensitive fields
-- for the single candidate matching the exact unguessable secret token.
CREATE OR REPLACE FUNCTION public.get_candidate_status_by_token(token_param text)
RETURNS TABLE (
    name VARCHAR,
    status VARCHAR,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT c.name, c.status, c.updated_at
    FROM public.candidates c
    WHERE c.secure_token = token_param
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_candidate_status_by_token(text) TO anon, authenticated, service_role;
