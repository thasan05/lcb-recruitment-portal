export type CandidateStatus =
  | 'APPLICATION_RECEIVED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'FINAL_REVIEW'
  | 'SELECTED'
  | 'WAITLISTED'
  | 'NOT_SELECTED'
  | 'WITHDRAWN';

export interface StatusMeta {
  key: CandidateStatus;
  label: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
    dot: string;
    badgeBg: string;
  };
  stepIndex: number; // 0 to 5 for standard timeline steps
  isTerminal?: boolean;
  sentiment?: 'neutral' | 'in_progress' | 'positive' | 'warning' | 'negative';
}

export const STATUS_CONFIG: Record<CandidateStatus, StatusMeta> = {
  APPLICATION_RECEIVED: {
    key: 'APPLICATION_RECEIVED',
    label: 'Application Received',
    description: 'We have received your application and logged it into our recruitment database.',
    color: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400',
      badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
    },
    stepIndex: 0,
    sentiment: 'neutral',
  },
  UNDER_REVIEW: {
    key: 'UNDER_REVIEW',
    label: 'Under Review',
    description: 'The LCB HR and Department Leads are reviewing your profile, background, and submissions.',
    color: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      dot: 'bg-indigo-400',
      badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
    },
    stepIndex: 1,
    sentiment: 'in_progress',
  },
  SHORTLISTED: {
    key: 'SHORTLISTED',
    label: 'Shortlisted',
    description: 'Congratulations! Your profile has been shortlisted for the next evaluation stage.',
    color: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    },
    stepIndex: 2,
    sentiment: 'positive',
  },
  INTERVIEW_SCHEDULED: {
    key: 'INTERVIEW_SCHEDULED',
    label: 'Interview Scheduled',
    description: 'Your interview has been scheduled. Please check your interview details and meeting link below.',
    color: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    },
    stepIndex: 3,
    sentiment: 'positive',
  },
  INTERVIEW_COMPLETED: {
    key: 'INTERVIEW_COMPLETED',
    label: 'Interview Completed',
    description: 'Interview session conducted. The panel is currently compiling evaluation scores and feedback.',
    color: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/30',
      dot: 'bg-sky-400',
      badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    },
    stepIndex: 3,
    sentiment: 'in_progress',
  },
  FINAL_REVIEW: {
    key: 'FINAL_REVIEW',
    label: 'Final Review',
    description: 'Your application is in final leadership review for final placement decisions.',
    color: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      dot: 'bg-purple-400',
      badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    },
    stepIndex: 4,
    sentiment: 'in_progress',
  },
  SELECTED: {
    key: 'SELECTED',
    label: 'Selected',
    description: 'Welcome to LinkedIn Community Bangladesh! Your application has been approved and accepted.',
    color: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    },
    stepIndex: 5,
    isTerminal: true,
    sentiment: 'positive',
  },
  WAITLISTED: {
    key: 'WAITLISTED',
    label: 'Waitlisted',
    description: 'You are on the priority waitlist for upcoming positions and opening slots in this recruitment cohort.',
    color: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      dot: 'bg-yellow-400',
      badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
    },
    stepIndex: 5,
    isTerminal: true,
    sentiment: 'warning',
  },
  NOT_SELECTED: {
    key: 'NOT_SELECTED',
    label: 'Not Selected',
    description: 'Thank you for your interest and investment in LCB. We encourage you to participate in upcoming community programs and future recruitments.',
    color: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400',
      badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    },
    stepIndex: 5,
    isTerminal: true,
    sentiment: 'negative',
  },
  WITHDRAWN: {
    key: 'WITHDRAWN',
    label: 'Withdrawn',
    description: 'Application was marked as withdrawn upon candidate request.',
    color: {
      bg: 'bg-zinc-500/10',
      text: 'text-zinc-400',
      border: 'border-zinc-500/30',
      dot: 'bg-zinc-400',
      badgeBg: 'bg-zinc-500/15 text-zinc-300 border-zinc-400/30',
    },
    stepIndex: 5,
    isTerminal: true,
    sentiment: 'neutral',
  },
};

export const RECRUITMENT_STEPS = [
  { step: 0, label: 'Application Received', shortLabel: 'Received' },
  { step: 1, label: 'Under Review', shortLabel: 'Review' },
  { step: 2, label: 'Shortlisted', shortLabel: 'Shortlisted' },
  { step: 3, label: 'Interview Stage', shortLabel: 'Interview' },
  { step: 4, label: 'Final Review', shortLabel: 'Final Review' },
  { step: 5, label: 'Decision', shortLabel: 'Decision' },
];

export interface Interview {
  id: string;
  candidate_id: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:20 PM" or "21:20"
  timezone: string; // e.g. "Asia/Dhaka (BST, GMT+6)"
  duration: number; // minutes
  interview_type: 'Online' | 'In-Person' | 'Hybrid';
  meeting_platform: 'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'Office';
  meeting_link?: string;
  interviewer: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateUpdate {
  id: string;
  candidate_id: string;
  title: string;
  message: string;
  date: string;
  is_candidate_visible: boolean;
  created_at: string;
}

export interface InternalNote {
  id: string;
  candidate_id: string;
  content: string;
  author: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  candidate_id: string;
  action_type:
    | 'STATUS_CHANGE'
    | 'INTERVIEW_SCHEDULED'
    | 'INTERVIEW_UPDATED'
    | 'UPDATE_PUBLISHED'
    | 'NOTE_ADDED'
    | 'CANDIDATE_CREATED'
    | 'CANDIDATE_UPDATED';
  details: string;
  performed_by: string;
  timestamp: string;
}

export interface Candidate {
  id: string;
  application_id: string; // e.g. "LCB-2026-0001"
  secure_token: string; // random cryptographic token for private portal
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  campaign: string;
  status: CandidateStatus;
  application_date: string; // ISO
  last_updated: string; // ISO
  is_archived?: boolean;
  // Related records when loaded
  interview?: Interview | null;
  updates?: CandidateUpdate[];
  notes?: InternalNote[];
  activity_logs?: ActivityLog[];
}

export interface DashboardStats {
  total: number;
  underReview: number;
  shortlisted: number;
  interviewScheduled: number;
  selected: number;
  notSelected: number;
  recentCount: number;
}
