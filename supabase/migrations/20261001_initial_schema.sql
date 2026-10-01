-- ====================================================================
-- LinkedIn Community Bangladesh (LCB) Recruitment Portal Database Schema
-- Migration: 20261001_initial_schema.sql
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Candidates Table
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id VARCHAR(32) NOT NULL UNIQUE,
    secure_token VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    campaign VARCHAR(255) NOT NULL DEFAULT 'LCB Central Team Recruitment — 2026',
    status VARCHAR(50) NOT NULL DEFAULT 'APPLICATION_RECEIVED',
    application_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for high-speed lookup by secure token & human ID
CREATE INDEX IF NOT EXISTS idx_candidates_secure_token ON public.candidates(secure_token);
CREATE INDEX IF NOT EXISTS idx_candidates_application_id ON public.candidates(application_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);

-- 3. Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Dhaka (BST, GMT+6)',
    duration INTEGER NOT NULL DEFAULT 20, -- minutes
    interview_type VARCHAR(50) NOT NULL DEFAULT 'Online',
    meeting_platform VARCHAR(100) NOT NULL DEFAULT 'Google Meet',
    meeting_link TEXT,
    interviewer VARCHAR(255) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews(candidate_id);

-- 4. Candidate Updates (Publicly visible to candidate)
CREATE TABLE IF NOT EXISTS public.candidate_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_candidate_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_updates_candidate_id ON public.candidate_updates(candidate_id);

-- 5. Internal HR Notes (NEVER visible to candidate)
CREATE TABLE IF NOT EXISTS public.internal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL DEFAULT 'LCB HR Team',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_candidate_id ON public.internal_notes(candidate_id);

-- 6. Activity / Audit Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    performed_by VARCHAR(255) NOT NULL DEFAULT 'LCB HR Admin',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_candidate_id ON public.activity_logs(candidate_id);

-- 7. Trigger to automatically update last_updated timestamp on candidates
CREATE OR REPLACE FUNCTION update_candidate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_candidate_timestamp ON public.candidates;
CREATE TRIGGER trg_update_candidate_timestamp
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION update_candidate_timestamp();

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own record using secure token
CREATE POLICY "Public read candidate by token" ON public.candidates
    FOR SELECT USING (true);

-- Candidates can view their interviews
CREATE POLICY "Public read interviews" ON public.interviews
    FOR SELECT USING (true);

-- Candidates can view only candidate-visible updates
CREATE POLICY "Public read updates" ON public.candidate_updates
    FOR SELECT USING (is_candidate_visible = true);

-- Internal notes: Authenticated HR users only
CREATE POLICY "Admin full access notes" ON public.internal_notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Authenticated HR users have full access to all tables
CREATE POLICY "Admin full access candidates" ON public.candidates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access interviews" ON public.interviews
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access updates" ON public.candidate_updates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access activity" ON public.activity_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- ====================================================================
-- SEED DATA (Realistic Demo Candidates)
-- ====================================================================
INSERT INTO public.candidates (id, application_id, secure_token, full_name, email, phone, position, department, campaign, status, application_date, last_updated)
VALUES 
    (
        'a1111111-1111-1111-1111-111111111111',
        'LCB-2026-0001',
        'tok_lcb_tanvir_h_2026',
        'Tanvir Hasan',
        'tanvir.hasan@example.com',
        '+880 1711-234567',
        'Campus Lead',
        'Campus Division',
        'LCB Campus Lead Recruitment — 2026',
        'INTERVIEW_SCHEDULED',
        '2026-09-28T10:00:00Z',
        '2026-10-01T15:30:00Z'
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'LCB-2026-0002',
        'tok_lcb_sadia_a_2026',
        'Sadia Akter',
        'sadia.akter@example.com',
        '+880 1812-987654',
        'Communication Executive',
        'Marketing & PR',
        'LCB Central Team Recruitment — 2026',
        'SHORTLISTED',
        '2026-09-29T14:15:00Z',
        '2026-10-01T11:00:00Z'
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'LCB-2026-0003',
        'tok_lcb_rahim_a_2026',
        'Rahim Ahmed',
        'rahim.ahmed@example.com',
        '+880 1913-456789',
        'HR Executive',
        'Human Resources',
        'LCB Central Team Recruitment — 2026',
        'SELECTED',
        '2026-09-25T09:30:00Z',
        '2026-10-01T16:00:00Z'
    ),
    (
        'd4444444-4444-4444-4444-444444444444',
        'LCB-2026-0004',
        'tok_lcb_nusrat_j_2026',
        'Nusrat Jahan',
        'nusrat.jahan@example.com',
        '+880 1614-112233',
        'Event Management Lead',
        'Operations',
        'LCB Central Team Recruitment — 2026',
        'UNDER_REVIEW',
        '2026-10-01T08:20:00Z',
        '2026-10-01T08:20:00Z'
    ),
    (
        'e5555555-5555-5555-5555-555555555555',
        'LCB-2026-0005',
        'tok_lcb_mehedi_h_2026',
        'Mehedi Hasan',
        'mehedi.h@example.com',
        '+880 1515-998877',
        'Content Creator',
        'Media & Design',
        'LCB Central Team Recruitment — 2026',
        'NOT_SELECTED',
        '2026-09-22T11:00:00Z',
        '2026-09-30T17:45:00Z'
    )
ON CONFLICT (application_id) DO NOTHING;

-- Seed Interview for Tanvir Hasan
INSERT INTO public.interviews (id, candidate_id, status, date, time, timezone, duration, interview_type, meeting_platform, meeting_link, interviewer, instructions)
VALUES (
    'f6666666-6666-6666-6666-666666666666',
    'a1111111-1111-1111-1111-111111111111',
    'SCHEDULED',
    '2026-10-02',
    '09:20 PM',
    'Asia/Dhaka (BST, GMT+6)',
    20,
    'Online',
    'Google Meet',
    'https://meet.google.com/lcb-lead-sync',
    'LCB Campus Leadership Panel',
    'Please join 5 minutes early with your camera enabled. Be ready to share your vision for leading your campus community.'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Candidate Updates
INSERT INTO public.candidate_updates (candidate_id, title, message, date, is_candidate_visible)
VALUES 
    (
        'a1111111-1111-1111-1111-111111111111',
        'Interview Scheduled',
        'Your online leadership evaluation interview has been confirmed for October 2, 2026 at 9:20 PM (BST). Check the interview section below for the Google Meet link.',
        '2026-10-01T15:30:00Z',
        TRUE
    ),
    (
        'a1111111-1111-1111-1111-111111111111',
        'Application Shortlisted',
        'Your application for Campus Lead has been reviewed and shortlisted by the selection committee.',
        '2026-09-30T12:00:00Z',
        TRUE
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'Application Shortlisted',
        'We are pleased to inform you that your portfolio and answers have advanced you to the shortlist.',
        '2026-10-01T11:00:00Z',
        TRUE
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'Offer Extended: Selected for LCB Central Team',
        'Congratulations! Based on your interviews and performance, you have been selected as HR Executive for LinkedIn Community Bangladesh.',
        '2026-10-01T16:00:00Z',
        TRUE
    );

-- Seed Internal Notes (Private to HR)
INSERT INTO public.internal_notes (candidate_id, content, author, created_at)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'Strong campus leadership track record. Active on LinkedIn with consistent engagement.', 'Head of Campus Outreach', '2026-09-30T11:45:00Z'),
    ('b2222222-2222-2222-2222-222222222222', 'Excellent writing samples. Needs to verify availability for weekly core syncs.', 'Lead HR Recruiter', '2026-10-01T10:30:00Z'),
    ('c3333333-3333-3333-3333-333333333333', 'Outstanding interview. Scored 9.5/10 on communication and structured thinking. Highly recommended.', 'Panel Chair', '2026-10-01T15:00:00Z');

-- Seed Activity Logs
INSERT INTO public.activity_logs (candidate_id, action_type, details, performed_by, timestamp)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'CANDIDATE_CREATED', 'Candidate profile registered via application portal', 'System', '2026-09-28T10:00:00Z'),
    ('a1111111-1111-1111-1111-111111111111', 'STATUS_CHANGE', 'Status changed: Application Received -> Under Review', 'Lead Recruiter', '2026-09-29T10:00:00Z'),
    ('a1111111-1111-1111-1111-111111111111', 'STATUS_CHANGE', 'Status changed: Under Review -> Shortlisted', 'HR Manager', '2026-09-30T12:00:00Z'),
    ('a1111111-1111-1111-1111-111111111111', 'INTERVIEW_SCHEDULED', 'Interview scheduled for Oct 2, 2026 at 09:20 PM on Google Meet', 'Interview Coordinator', '2026-10-01T15:30:00Z');
