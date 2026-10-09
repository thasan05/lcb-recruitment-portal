export type TemplateType = 'auto' | 'decision_pending' | 'status_update' | 'custom';

export interface EmailTemplateMeta {
  name: string;
  subject: string;
  headline: string;
  buttonText: string;
  defaultMessage: string;
}

export const EMAIL_TEMPLATES: Record<
  'decision_pending' | 'status_update',
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
  status_update: {
    name: 'General Status Update Notification',
    subject: 'Official Update: Your Recruitment Status with LCB',
    headline: 'Recruitment Status Update',
    buttonText: 'View Recruitment Status',
    defaultMessage:
      'There has been an official update to your recruitment application with LinkedIn Community Bangladesh (LCB).\n\nOur committee has finalized the evaluation for your application. Please access your private candidate portal below to view your updated status and next steps.',
  },
};
