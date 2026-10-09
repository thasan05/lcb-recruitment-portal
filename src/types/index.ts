export type CandidateStatus = 'decision_pending' | 'accepted' | 'rejected';

export interface StatusMeta {
  key: CandidateStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  message: string;
}

export const STATUS_CONFIG: Record<CandidateStatus, StatusMeta> = {
  decision_pending: {
    key: 'decision_pending',
    label: 'Decision Pending',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
    message:
      'Your interview has been completed and your application is currently under final consideration. We will update you once a final decision has been made.',
  },
  accepted: {
    key: 'accepted',
    label: 'Accepted',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    message:
      'Congratulations! You have been selected to move forward with LinkedIn Community Bangladesh.',
  },
  rejected: {
    key: 'rejected',
    label: 'Rejected',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400',
    message:
      'Thank you for your time and participation in the LCB recruitment process. After careful consideration, we will not be moving forward with your application at this time.',
  },
};

export interface Candidate {
  id: string;
  name: string;
  email: string;
  status: CandidateStatus;
  secure_token: string;
  email_sent: boolean;
  email_sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidatePublicView {
  name: string;
  status: CandidateStatus;
  updated_at: string;
  created_at?: string;
  is_expired?: boolean;
  expired_at?: string;
  canonicalToken?: string;
  isLegacyToken?: boolean;
}
