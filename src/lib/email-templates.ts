export type TemplateType = 'auto' | 'decision_pending' | 'accepted' | 'rejected' | 'status_update' | 'custom';

export interface EmailTemplateMeta {
  name: string;
  subject: string;
  headline: string;
  buttonText: string;
  defaultMessage: string;
}

export const EMAIL_TEMPLATES: Record<
  'decision_pending' | 'accepted' | 'rejected' | 'status_update',
  EmailTemplateMeta
> = {
  decision_pending: {
    name: 'Decision Pending (Initial Notification)',
    subject: 'Application Under Final Review — LinkedIn Community Bangladesh',
    headline: 'Interview Completed — Under Final Review',
    buttonText: 'Track Application Status',
    defaultMessage:
      'Thank you for participating in the LinkedIn Community Bangladesh (LCB) recruitment interview process.\n\nYour interview evaluation is complete, and your application is currently under final review by our selection committee. We appreciate your patience while decisions are finalized.\n\nYou can track your recruitment status, timeline milestones, and final decision in real time through your private candidate link below.',
  },
  accepted: {
    name: 'Offer & Acceptance (Congratulations)',
    subject: 'Congratulations! Official Offer from LinkedIn Community Bangladesh',
    headline: 'Congratulations — You Have Been Selected!',
    buttonText: 'View Selection & Onboarding Steps',
    defaultMessage:
      'Congratulations! We are delighted to inform you that following your interview and committee review, you have been selected to join LinkedIn Community Bangladesh (LCB).\n\nYour passion and experience impressed our selection team, and we are excited to have you onboard.\n\nPlease click your private candidate link below to view your acceptance details and upcoming onboarding next steps.',
  },
  rejected: {
    name: 'Application Decision (Not Selected)',
    subject: 'Recruitment Application Update — LinkedIn Community Bangladesh',
    headline: 'Recruitment Application Status',
    buttonText: 'View Recruitment Notice',
    defaultMessage:
      'Thank you for taking the time to apply and interview with LinkedIn Community Bangladesh (LCB).\n\nAfter careful consideration among a highly competitive pool of applicants, our committee is unable to offer you a position for this recruitment cycle.\n\nWe genuinely appreciate your time, effort, and interest in LCB, and we warmly invite you to stay connected and apply for future leadership opportunities.',
  },
  status_update: {
    name: 'General Status Update Notification',
    subject: 'Official Update: Your Recruitment Status with LCB',
    headline: 'Recruitment Status Update',
    buttonText: 'View Recruitment Status',
    defaultMessage:
      'There has been an official update to your recruitment application with LinkedIn Community Bangladesh (LCB).\n\nOur committee has finalized the evaluation for your application. Please access your private candidate portal below to view your updated status and next steps.',
  },
};
