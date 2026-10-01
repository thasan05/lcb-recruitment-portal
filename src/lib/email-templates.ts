import { Candidate } from '@/types';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export function generateCandidatePortalUrl(token: string): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/candidate/${token}`;
}

export function generateEmailTemplates(candidate: Candidate): EmailTemplate[] {
  const portalUrl = generateCandidatePortalUrl(candidate.secure_token);
  const firstName = candidate.full_name.split(' ')[0] || candidate.full_name;

  let interviewSnippet = '';
  if (candidate.interview) {
    interviewSnippet = `
Interview Details:
- Date: ${candidate.interview.date}
- Time: ${candidate.interview.time} (${candidate.interview.timezone})
- Platform: ${candidate.interview.meeting_platform}
- Meeting Link: ${candidate.interview.meeting_link || 'Provided in portal'}
- Panel: ${candidate.interview.interviewer}
`;
  }

  return [
    {
      id: 'app_received',
      name: 'Application Received & Portal Access',
      subject: `Your Application for ${candidate.position} — LinkedIn Community Bangladesh`,
      body: `Dear ${candidate.full_name},

Thank you for your interest in joining LinkedIn Community Bangladesh (LCB) for the position of ${candidate.position} (${candidate.department}).

We have successfully logged your application (ID: ${candidate.application_id}).

You can monitor your live recruitment status, review timeline updates, and access interview details directly via your private candidate portal:

${portalUrl}

Please save this link for future updates. Our team is actively evaluating applications and will communicate subsequent stages through your portal.

Warm regards,

HR & Talent Team
LinkedIn Community Bangladesh (LCB)
https://linkedincommunitybangladesh.com`,
    },
    {
      id: 'shortlisted',
      name: 'Candidate Shortlisted',
      subject: `Update on your LCB Application: Shortlisted for ${candidate.position}`,
      body: `Dear ${candidate.full_name},

We are thrilled to share positive news regarding your application for the ${candidate.position} role at LinkedIn Community Bangladesh.

After an extensive review of your background and profile, you have been SHORTLISTED for the upcoming evaluation phase.

Please visit your personal portal to view updated notes and next steps:

${portalUrl}

Our recruitment coordinator will be updating your portal shortly with interview scheduling details.

Best regards,

HR & Talent Team
LinkedIn Community Bangladesh (LCB)`,
    },
    {
      id: 'interview_scheduled',
      name: 'Interview Scheduled',
      subject: `Interview Scheduled: ${candidate.position} — LinkedIn Community Bangladesh`,
      body: `Dear ${firstName},

Your interview for the ${candidate.position} role at LinkedIn Community Bangladesh has been officially scheduled.
${interviewSnippet}
Please open your private candidate portal to confirm your attendance, review instructions, and add the session to your Google Calendar:

${portalUrl}

Kindly join 5 minutes ahead of time in a quiet environment with a working webcam and microphone.

If you have any urgent scheduling conflicts, reply directly to this email.

Warm regards,

LCB Recruitment Committee
LinkedIn Community Bangladesh`,
    },
    {
      id: 'selected',
      name: 'Selection / Offer Extended',
      subject: `Congratulations! Welcome to LinkedIn Community Bangladesh (${candidate.position})`,
      body: `Dear ${candidate.full_name},

On behalf of the entire leadership and community at LinkedIn Community Bangladesh, we are excited to congratulate you on your selection as ${candidate.position}!

Your leadership potential, ambition, and passion truly resonated with our evaluation committee.

Please view your official selection announcement and onboarding instructions through your candidate portal:

${portalUrl}

Our community leadership will reach out with the onboarding schedule and team introductions. Welcome to the movement!

Warmest regards,

Central Leadership & HR Team
LinkedIn Community Bangladesh`,
    },
    {
      id: 'not_selected',
      name: 'Respectful Closure (Not Selected)',
      subject: `Update regarding your LCB application (${candidate.position})`,
      body: `Dear ${candidate.full_name},

Thank you for taking the time to apply for the ${candidate.position} position at LinkedIn Community Bangladesh and for sharing your journey with us.

We received a very high volume of competitive applications for this cohort. While we were impressed by your background, we have chosen to move forward with other candidates whose current profiles more closely match our specific opening needs.

We warmly encourage you to remain an active participant in our community sessions, open programs, and future recruitment cycles.

You may review your archived application details at your portal:

${portalUrl}

We wish you immense success in your professional endeavors.

Sincerely,

HR & Selection Committee
LinkedIn Community Bangladesh`,
    },
    {
      id: 'general_update',
      name: 'General Recruitment Update',
      subject: `Recruitment Update for your LCB Application (${candidate.application_id})`,
      body: `Dear ${candidate.full_name},

There is an important new update regarding your recruitment progress for ${candidate.position}.

Please log into your private candidate status portal to view the details:

${portalUrl}

Thank you for your patience and ongoing engagement with LinkedIn Community Bangladesh.

Warm regards,

HR Team
LinkedIn Community Bangladesh`,
    },
  ];
}
