import {
  Candidate,
  CandidateStatus,
  CandidateUpdate,
  DashboardStats,
  InternalNote,
  Interview,
  ActivityLog,
} from '@/types';
import { isSupabaseConfigured, supabaseAdmin, supabaseClient } from '../supabase';

// Helper to generate IDs and secure access tokens
export function generateApplicationId(sequenceNum?: number): string {
  const year = new Date().getFullYear();
  const num = sequenceNum ?? Math.floor(1000 + Math.random() * 9000);
  return `LCB-${year}-${String(num).padStart(4, '0')}`;
}

export function generateSecureToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'tok_lcb_';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// In-Memory Fallback Store (used when Supabase is not configured or during local evaluation)
let memoryCandidates: Candidate[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    application_id: 'LCB-2026-0001',
    secure_token: 'tok_lcb_tanvir_h_2026',
    full_name: 'Tanvir Hasan',
    email: 'tanvir.hasan@example.com',
    phone: '+880 1711-234567',
    position: 'Campus Lead',
    department: 'Campus Division',
    campaign: 'LCB Campus Lead Recruitment — 2026',
    status: 'INTERVIEW_SCHEDULED',
    application_date: '2026-09-28T10:00:00Z',
    last_updated: '2026-10-01T15:30:00Z',
    is_archived: false,
    interview: {
      id: 'f6666666-6666-6666-6666-666666666666',
      candidate_id: 'a1111111-1111-1111-1111-111111111111',
      status: 'SCHEDULED',
      date: '2026-10-02',
      time: '09:20 PM',
      timezone: 'Asia/Dhaka (BST, GMT+6)',
      duration: 20,
      interview_type: 'Online',
      meeting_platform: 'Google Meet',
      meeting_link: 'https://meet.google.com/lcb-lead-sync',
      interviewer: 'LCB Campus Leadership Panel',
      instructions:
        'Please join 5 minutes early with your camera enabled. Be ready to share your vision for leading your campus community.',
      created_at: '2026-10-01T15:30:00Z',
      updated_at: '2026-10-01T15:30:00Z',
    },
    updates: [
      {
        id: 'u1',
        candidate_id: 'a1111111-1111-1111-1111-111111111111',
        title: 'Interview Scheduled',
        message:
          'Your online leadership evaluation interview has been confirmed for October 2, 2026 at 9:20 PM (BST). Check the interview section below for the Google Meet link.',
        date: '2026-10-01T15:30:00Z',
        is_candidate_visible: true,
        created_at: '2026-10-01T15:30:00Z',
      },
      {
        id: 'u2',
        candidate_id: 'a1111111-1111-1111-1111-111111111111',
        title: 'Application Shortlisted',
        message:
          'Your application for Campus Lead has been reviewed and shortlisted by the selection committee.',
        date: '2026-09-30T12:00:00Z',
        is_candidate_visible: true,
        created_at: '2026-09-30T12:00:00Z',
      },
    ],
    notes: [
      {
        id: 'n1',
        candidate_id: 'a1111111-1111-1111-1111-111111111111',
        content:
          'Strong campus leadership track record. Active on LinkedIn with consistent engagement.',
        author: 'Head of Campus Outreach',
        created_at: '2026-09-30T11:45:00Z',
      },
    ],
    activity_logs: [
      {
        id: 'l1',
        candidate_id: 'a1111111-1111-1111-1111-111111111111',
        action_type: 'CANDIDATE_CREATED',
        details: 'Candidate profile registered via application portal',
        performed_by: 'System',
        timestamp: '2026-09-28T10:00:00Z',
      },
      {
        id: 'l2',
        candidate_id: 'a1111111-1111-1111-1111-111111111111',
        action_type: 'STATUS_CHANGE',
        details: 'Status changed: Application Received -> Under Review',
        performed_by: 'Lead Recruiter',
        timestamp: '2026-09-29T10:00:00Z',
      },
      {
        id: 'l3',
        candidate_id: 'a1111111-1111-1111-1111-111111111111',
        action_type: 'STATUS_CHANGE',
        details: 'Status changed: Under Review -> Shortlisted',
        performed_by: 'HR Manager',
        timestamp: '2026-09-30T12:00:00Z',
      },
      {
        id: 'l4',
        candidate_id: 'a1111111-1111-1111-1111-111111111111',
        action_type: 'INTERVIEW_SCHEDULED',
        details:
          'Interview scheduled for Oct 2, 2026 at 09:20 PM on Google Meet',
        performed_by: 'Interview Coordinator',
        timestamp: '2026-10-01T15:30:00Z',
      },
    ],
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    application_id: 'LCB-2026-0002',
    secure_token: 'tok_lcb_sadia_a_2026',
    full_name: 'Sadia Akter',
    email: 'sadia.akter@example.com',
    phone: '+880 1812-987654',
    position: 'Communication Executive',
    department: 'Marketing & PR',
    campaign: 'LCB Central Team Recruitment — 2026',
    status: 'SHORTLISTED',
    application_date: '2026-09-29T14:15:00Z',
    last_updated: '2026-10-01T11:00:00Z',
    is_archived: false,
    interview: null,
    updates: [
      {
        id: 'u3',
        candidate_id: 'b2222222-2222-2222-2222-222222222222',
        title: 'Application Shortlisted',
        message:
          'We are pleased to inform you that your portfolio and answers have advanced you to the shortlist.',
        date: '2026-10-01T11:00:00Z',
        is_candidate_visible: true,
        created_at: '2026-10-01T11:00:00Z',
      },
    ],
    notes: [
      {
        id: 'n2',
        candidate_id: 'b2222222-2222-2222-2222-222222222222',
        content:
          'Excellent writing samples. Needs to verify availability for weekly core syncs.',
        author: 'Lead HR Recruiter',
        created_at: '2026-10-01T10:30:00Z',
      },
    ],
    activity_logs: [
      {
        id: 'l5',
        candidate_id: 'b2222222-2222-2222-2222-222222222222',
        action_type: 'CANDIDATE_CREATED',
        details: 'Candidate profile registered via application portal',
        performed_by: 'System',
        timestamp: '2026-09-29T14:15:00Z',
      },
      {
        id: 'l6',
        candidate_id: 'b2222222-2222-2222-2222-222222222222',
        action_type: 'STATUS_CHANGE',
        details: 'Status changed: Under Review -> Shortlisted',
        performed_by: 'Lead Recruiter',
        timestamp: '2026-10-01T11:00:00Z',
      },
    ],
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    application_id: 'LCB-2026-0003',
    secure_token: 'tok_lcb_rahim_a_2026',
    full_name: 'Rahim Ahmed',
    email: 'rahim.ahmed@example.com',
    phone: '+880 1913-456789',
    position: 'HR Executive',
    department: 'Human Resources',
    campaign: 'LCB Central Team Recruitment — 2026',
    status: 'SELECTED',
    application_date: '2026-09-25T09:30:00Z',
    last_updated: '2026-10-01T16:00:00Z',
    is_archived: false,
    interview: {
      id: 'i2',
      candidate_id: 'c3333333-3333-3333-3333-333333333333',
      status: 'COMPLETED',
      date: '2026-09-30',
      time: '04:00 PM',
      timezone: 'Asia/Dhaka (BST, GMT+6)',
      duration: 30,
      interview_type: 'Online',
      meeting_platform: 'Google Meet',
      meeting_link: 'https://meet.google.com/lcb-hr-sync',
      interviewer: 'HR Director',
      instructions: 'Completed successfully.',
      created_at: '2026-09-29T10:00:00Z',
      updated_at: '2026-09-30T17:00:00Z',
    },
    updates: [
      {
        id: 'u4',
        candidate_id: 'c3333333-3333-3333-3333-333333333333',
        title: 'Offer Extended: Selected for LCB Central Team',
        message:
          'Congratulations! Based on your interviews and performance, you have been selected as HR Executive for LinkedIn Community Bangladesh.',
        date: '2026-10-01T16:00:00Z',
        is_candidate_visible: true,
        created_at: '2026-10-01T16:00:00Z',
      },
    ],
    notes: [
      {
        id: 'n3',
        candidate_id: 'c3333333-3333-3333-3333-333333333333',
        content:
          'Outstanding interview. Scored 9.5/10 on communication and structured thinking. Highly recommended.',
        author: 'Panel Chair',
        created_at: '2026-10-01T15:00:00Z',
      },
    ],
    activity_logs: [
      {
        id: 'l7',
        candidate_id: 'c3333333-3333-3333-3333-333333333333',
        action_type: 'STATUS_CHANGE',
        details: 'Status changed: Final Review -> Selected',
        performed_by: 'HR Director',
        timestamp: '2026-10-01T16:00:00Z',
      },
    ],
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    application_id: 'LCB-2026-0004',
    secure_token: 'tok_lcb_nusrat_j_2026',
    full_name: 'Nusrat Jahan',
    email: 'nusrat.jahan@example.com',
    phone: '+880 1614-112233',
    position: 'Event Management Lead',
    department: 'Operations',
    campaign: 'LCB Central Team Recruitment — 2026',
    status: 'UNDER_REVIEW',
    application_date: '2026-10-01T08:20:00Z',
    last_updated: '2026-10-01T08:20:00Z',
    is_archived: false,
    interview: null,
    updates: [],
    notes: [],
    activity_logs: [
      {
        id: 'l8',
        candidate_id: 'd4444444-4444-4444-4444-444444444444',
        action_type: 'CANDIDATE_CREATED',
        details: 'Application submitted',
        performed_by: 'System',
        timestamp: '2026-10-01T08:20:00Z',
      },
    ],
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    application_id: 'LCB-2026-0005',
    secure_token: 'tok_lcb_mehedi_h_2026',
    full_name: 'Mehedi Hasan',
    email: 'mehedi.h@example.com',
    phone: '+880 1515-998877',
    position: 'Content Creator',
    department: 'Media & Design',
    campaign: 'LCB Central Team Recruitment — 2026',
    status: 'NOT_SELECTED',
    application_date: '2026-09-22T11:00:00Z',
    last_updated: '2026-09-30T17:45:00Z',
    is_archived: false,
    interview: null,
    updates: [],
    notes: [
      {
        id: 'n4',
        candidate_id: 'e5555555-5555-5555-5555-555555555555',
        content: 'Design portfolio not aligned with current video focus.',
        author: 'Lead Recruiter',
        created_at: '2026-09-30T17:00:00Z',
      },
    ],
    activity_logs: [
      {
        id: 'l9',
        candidate_id: 'e5555555-5555-5555-5555-555555555555',
        action_type: 'STATUS_CHANGE',
        details: 'Status changed: Under Review -> Not Selected',
        performed_by: 'Lead Recruiter',
        timestamp: '2026-09-30T17:45:00Z',
      },
    ],
  },
];

export async function getCandidates(filters?: {
  status?: string;
  department?: string;
  position?: string;
  search?: string;
  includeArchived?: boolean;
}): Promise<Candidate[]> {
  if (isSupabaseConfigured() && supabaseAdmin) {
    let query = supabaseAdmin
      .from('candidates')
      .select('*, interviews(*), candidate_updates(*), internal_notes(*), activity_logs(*)')
      .order('application_date', { ascending: false });

    if (!filters?.includeArchived) {
      query = query.eq('is_archived', false);
    }
    if (filters?.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }
    if (filters?.department && filters.department !== 'ALL') {
      query = query.eq('department', filters.department);
    }
    if (filters?.position && filters.position !== 'ALL') {
      query = query.eq('position', filters.position);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase getCandidates query error, falling back to local store:', error.message);
    } else if (data) {
      return data.map((row: any) => ({
        ...row,
        interview: row.interviews?.[0] || null,
        updates: row.candidate_updates || [],
        notes: row.internal_notes || [],
        activity_logs: row.activity_logs || [],
      }));
    }
  }

  // Memory fallback
  return memoryCandidates.filter((c) => {
    if (!filters?.includeArchived && c.is_archived) return false;
    if (filters?.status && filters.status !== 'ALL' && c.status !== filters.status) return false;
    if (filters?.department && filters.department !== 'ALL' && c.department !== filters.department)
      return false;
    if (filters?.position && filters.position !== 'ALL' && c.position !== filters.position)
      return false;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const matchName = c.full_name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchAppId = c.application_id.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchPosition = c.position.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchAppId && !matchPhone && !matchPosition) return false;
    }
    return true;
  });
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  if (isSupabaseConfigured() && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('candidates')
      .select('*, interviews(*), candidate_updates(*), internal_notes(*), activity_logs(*)')
      .eq('id', id)
      .single();

    if (!error && data) {
      return {
        ...data,
        interview: data.interviews?.[0] || null,
        updates: data.candidate_updates || [],
        notes: data.internal_notes || [],
        activity_logs: data.activity_logs || [],
      };
    }
  }

  const candidate = memoryCandidates.find((c) => c.id === id);
  return candidate ? JSON.parse(JSON.stringify(candidate)) : null;
}

// Candidate-facing lookup: strictly strips internal notes and activity logs for privacy!
export async function getCandidateBySecureToken(token: string): Promise<Candidate | null> {
  if (isSupabaseConfigured() && (supabaseClient || supabaseAdmin)) {
    const client = supabaseClient || supabaseAdmin!;
    const { data, error } = await client
      .from('candidates')
      .select('*, interviews(*), candidate_updates(*)')
      .eq('secure_token', token)
      .single();

    if (!error && data) {
      const publicUpdates = (data.candidate_updates || []).filter(
        (u: CandidateUpdate) => u.is_candidate_visible
      );
      return {
        id: data.id,
        application_id: data.application_id,
        secure_token: data.secure_token,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        campaign: data.campaign,
        status: data.status,
        application_date: data.application_date,
        last_updated: data.last_updated,
        interview: data.interviews?.[0] || null,
        updates: publicUpdates,
        // STRICT PRIVACY: notes and activity logs are omitted for candidate portal
        notes: [],
        activity_logs: [],
      };
    }
  }

  const candidate = memoryCandidates.find((c) => c.secure_token === token);
  if (!candidate) return null;

  // Clone and sanitize candidate view
  return {
    ...JSON.parse(JSON.stringify(candidate)),
    notes: [],
    activity_logs: [],
    updates: (candidate.updates || []).filter((u) => u.is_candidate_visible),
  };
}

export async function createCandidate(data: Partial<Candidate>, performedBy: string = 'LCB HR Admin'): Promise<Candidate> {
  const newId = crypto.randomUUID();
  const appId = data.application_id || generateApplicationId();
  const secureToken = data.secure_token || generateSecureToken();
  const now = new Date().toISOString();

  const newCandidate: Candidate = {
    id: newId,
    application_id: appId,
    secure_token: secureToken,
    full_name: data.full_name || 'Candidate',
    email: data.email || '',
    phone: data.phone || '',
    position: data.position || 'Campus Lead',
    department: data.department || 'Campus Division',
    campaign: data.campaign || 'LCB Central Team Recruitment — 2026',
    status: data.status || 'APPLICATION_RECEIVED',
    application_date: data.application_date || now,
    last_updated: now,
    is_archived: false,
    interview: null,
    updates: [],
    notes: data.notes && typeof data.notes === 'string' ? [
      {
        id: crypto.randomUUID(),
        candidate_id: newId,
        content: data.notes,
        author: performedBy,
        created_at: now,
      }
    ] : [],
    activity_logs: [
      {
        id: crypto.randomUUID(),
        candidate_id: newId,
        action_type: 'CANDIDATE_CREATED',
        details: `Candidate profile created manually (${appId})`,
        performed_by: performedBy,
        timestamp: now,
      },
    ],
  };

  if (isSupabaseConfigured() && supabaseAdmin) {
    const { error } = await supabaseAdmin.from('candidates').insert({
      id: newCandidate.id,
      application_id: newCandidate.application_id,
      secure_token: newCandidate.secure_token,
      full_name: newCandidate.full_name,
      email: newCandidate.email,
      phone: newCandidate.phone,
      position: newCandidate.position,
      department: newCandidate.department,
      campaign: newCandidate.campaign,
      status: newCandidate.status,
      application_date: newCandidate.application_date,
      last_updated: newCandidate.last_updated,
    });

    if (error) {
      console.warn('Supabase insert error, falling back to memory store:', error.message);
    }
  }

  memoryCandidates.unshift(newCandidate);
  return newCandidate;
}

export async function updateCandidate(
  id: string,
  updates: Partial<Candidate>,
  performedBy: string = 'LCB HR Admin'
): Promise<Candidate | null> {
  const existing = memoryCandidates.find((c) => c.id === id);
  const now = new Date().toISOString();

  if (existing) {
    const oldStatus = existing.status;
    const newStatus = updates.status;

    if (newStatus && newStatus !== oldStatus) {
      existing.activity_logs = existing.activity_logs || [];
      existing.activity_logs.unshift({
        id: crypto.randomUUID(),
        candidate_id: id,
        action_type: 'STATUS_CHANGE',
        details: `Status changed: ${oldStatus} -> ${newStatus}`,
        performed_by: performedBy,
        timestamp: now,
      });

      // Also publish an automatic candidate-facing notification update
      existing.updates = existing.updates || [];
      existing.updates.unshift({
        id: crypto.randomUUID(),
        candidate_id: id,
        title: `Status Updated to ${newStatus.replace(/_/g, ' ')}`,
        message: `Your application stage has advanced to ${newStatus.replace(/_/g, ' ')}.`,
        date: now,
        is_candidate_visible: true,
        created_at: now,
      });
    }

    Object.assign(existing, updates);
    existing.last_updated = now;
  }

  if (isSupabaseConfigured() && supabaseAdmin) {
    await supabaseAdmin
      .from('candidates')
      .update({
        ...updates,
        last_updated: now,
      })
      .eq('id', id);
  }

  return existing ? JSON.parse(JSON.stringify(existing)) : null;
}

export async function scheduleInterview(
  candidateId: string,
  interviewData: Partial<Interview>,
  performedBy: string = 'LCB HR Admin'
): Promise<Interview> {
  const now = new Date().toISOString();
  const newInterview: Interview = {
    id: interviewData.id || crypto.randomUUID(),
    candidate_id: candidateId,
    status: interviewData.status || 'SCHEDULED',
    date: interviewData.date || new Date().toISOString().split('T')[0],
    time: interviewData.time || '09:00 PM',
    timezone: interviewData.timezone || 'Asia/Dhaka (BST, GMT+6)',
    duration: interviewData.duration || 20,
    interview_type: interviewData.interview_type || 'Online',
    meeting_platform: interviewData.meeting_platform || 'Google Meet',
    meeting_link: interviewData.meeting_link || 'https://meet.google.com/lcb-interview',
    interviewer: interviewData.interviewer || 'LCB Recruitment Committee',
    instructions: interviewData.instructions || 'Please join on time with camera enabled.',
    created_at: now,
    updated_at: now,
  };

  const candidate = memoryCandidates.find((c) => c.id === candidateId);
  if (candidate) {
    candidate.interview = newInterview;
    candidate.status = 'INTERVIEW_SCHEDULED';
    candidate.last_updated = now;

    // Add activity log
    candidate.activity_logs = candidate.activity_logs || [];
    candidate.activity_logs.unshift({
      id: crypto.randomUUID(),
      candidate_id: candidateId,
      action_type: 'INTERVIEW_SCHEDULED',
      details: `Interview scheduled on ${newInterview.date} at ${newInterview.time} (${newInterview.meeting_platform})`,
      performed_by: performedBy,
      timestamp: now,
    });

    // Add candidate-visible update
    candidate.updates = candidate.updates || [];
    candidate.updates.unshift({
      id: crypto.randomUUID(),
      candidate_id: candidateId,
      title: 'Interview Scheduled',
      message: `Your interview is scheduled for ${newInterview.date} at ${newInterview.time} (${newInterview.timezone}). Platform: ${newInterview.meeting_platform}. Check interview details below.`,
      date: now,
      is_candidate_visible: true,
      created_at: now,
    });
  }

  if (isSupabaseConfigured() && supabaseAdmin) {
    await supabaseAdmin.from('interviews').upsert(newInterview);
    await supabaseAdmin
      .from('candidates')
      .update({ status: 'INTERVIEW_SCHEDULED', last_updated: now })
      .eq('id', candidateId);
  }

  return newInterview;
}

export async function addCandidateUpdate(
  candidateId: string,
  updateData: { title: string; message: string; is_candidate_visible?: boolean },
  performedBy: string = 'LCB HR Admin'
): Promise<CandidateUpdate> {
  const now = new Date().toISOString();
  const newUpdate: CandidateUpdate = {
    id: crypto.randomUUID(),
    candidate_id: candidateId,
    title: updateData.title,
    message: updateData.message,
    date: now,
    is_candidate_visible: updateData.is_candidate_visible ?? true,
    created_at: now,
  };

  const candidate = memoryCandidates.find((c) => c.id === candidateId);
  if (candidate) {
    candidate.updates = candidate.updates || [];
    candidate.updates.unshift(newUpdate);
    candidate.last_updated = now;

    candidate.activity_logs = candidate.activity_logs || [];
    candidate.activity_logs.unshift({
      id: crypto.randomUUID(),
      candidate_id: candidateId,
      action_type: 'UPDATE_PUBLISHED',
      details: `Announcement published: "${newUpdate.title}"`,
      performed_by: performedBy,
      timestamp: now,
    });
  }

  if (isSupabaseConfigured() && supabaseAdmin) {
    await supabaseAdmin.from('candidate_updates').insert(newUpdate);
  }

  return newUpdate;
}

export async function addInternalNote(
  candidateId: string,
  content: string,
  author: string = 'LCB HR Team'
): Promise<InternalNote> {
  const now = new Date().toISOString();
  const newNote: InternalNote = {
    id: crypto.randomUUID(),
    candidate_id: candidateId,
    content,
    author,
    created_at: now,
  };

  const candidate = memoryCandidates.find((c) => c.id === candidateId);
  if (candidate) {
    candidate.notes = candidate.notes || [];
    candidate.notes.unshift(newNote);

    candidate.activity_logs = candidate.activity_logs || [];
    candidate.activity_logs.unshift({
      id: crypto.randomUUID(),
      candidate_id: candidateId,
      action_type: 'NOTE_ADDED',
      details: `Internal note added by ${author}`,
      performed_by: author,
      timestamp: now,
    });
  }

  if (isSupabaseConfigured() && supabaseAdmin) {
    await supabaseAdmin.from('internal_notes').insert(newNote);
  }

  return newNote;
}

export async function deleteCandidate(id: string, softDelete = true): Promise<boolean> {
  const index = memoryCandidates.findIndex((c) => c.id === id);
  if (index === -1) return false;

  if (softDelete) {
    memoryCandidates[index].is_archived = true;
    memoryCandidates[index].last_updated = new Date().toISOString();
    if (isSupabaseConfigured() && supabaseAdmin) {
      await supabaseAdmin.from('candidates').update({ is_archived: true }).eq('id', id);
    }
  } else {
    memoryCandidates.splice(index, 1);
    if (isSupabaseConfigured() && supabaseAdmin) {
      await supabaseAdmin.from('candidates').delete().eq('id', id);
    }
  }
  return true;
}

export async function bulkUpdateStatus(
  candidateIds: string[],
  status: CandidateStatus,
  performedBy: string = 'LCB HR Admin'
): Promise<number> {
  let count = 0;
  for (const id of candidateIds) {
    const updated = await updateCandidate(id, { status }, performedBy);
    if (updated) count++;
  }
  return count;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const candidates = await getCandidates({ includeArchived: false });
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const stats: DashboardStats = {
    total: candidates.length,
    underReview: candidates.filter((c) => c.status === 'UNDER_REVIEW').length,
    shortlisted: candidates.filter((c) => c.status === 'SHORTLISTED').length,
    interviewScheduled: candidates.filter((c) => c.status === 'INTERVIEW_SCHEDULED').length,
    selected: candidates.filter((c) => c.status === 'SELECTED').length,
    notSelected: candidates.filter((c) => c.status === 'NOT_SELECTED').length,
    recentCount: candidates.filter((c) => new Date(c.application_date) >= oneWeekAgo).length,
  };

  return stats;
}
