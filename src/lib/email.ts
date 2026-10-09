import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EMAIL_TEMPLATES, TemplateType, EmailTemplateMeta } from './email-templates';

export { EMAIL_TEMPLATES };
export type { TemplateType, EmailTemplateMeta };

export interface SendStatusEmailOptions {
  toEmail: string;
  candidateName: string;
  secureToken: string;
  templateType?: TemplateType;
  subject?: string;
  headline?: string;
  customMessage?: string;
  candidateStatus?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

const SENDER_EMAIL = process.env.GMAIL_USER || 'linkedincommunitybangladesh@gmail.com';
const SENDER_NAME = 'LinkedIn Community Bangladesh';

export async function sendCandidateStatusEmail({
  toEmail,
  candidateName,
  secureToken,
  templateType = 'decision_pending',
  subject,
  headline,
  customMessage,
  candidateStatus,
}: SendStatusEmailOptions): Promise<EmailSendResult> {
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  const baseUrl = (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1'))
    ? envUrl
    : 'https://recruitment.linkedincommunitybangladesh.com';
  const cleanToken = (secureToken || '').trim().slice(0, 24);
  const statusUrl = `${baseUrl.replace(/\/$/, '')}/status/${cleanToken}`;

  // Resolve active template based on templateType and candidateStatus
  let resolvedType: 'decision_pending' | 'status_update' = 'decision_pending';
  if (templateType === 'status_update') {
    resolvedType = 'status_update';
  } else if (templateType === 'auto' || !templateType) {
    if (candidateStatus && candidateStatus !== 'decision_pending') {
      resolvedType = 'status_update';
    } else {
      resolvedType = 'decision_pending';
    }
  } else {
    resolvedType = 'decision_pending';
  }

  const activeTemplate = EMAIL_TEMPLATES[resolvedType] || EMAIL_TEMPLATES.decision_pending;

  const finalSubject = subject && subject.trim() ? subject.trim() : activeTemplate.subject;
  const finalHeadline = headline && headline.trim() ? headline.trim() : activeTemplate.headline;
  const messageBody =
    customMessage && customMessage.trim() ? customMessage.trim() : activeTemplate.defaultMessage;
  const buttonText = activeTemplate.buttonText;

  // Format message lines for HTML
  const formattedHtmlParagraphs = messageBody
    .split(/\n\s*\n/)
    .map(
      (para) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #cbd5e1;">${para
          .replace(/\n/g, '<br />')
          .replace(/{name}/g, candidateName)}</p>`
    )
    .join('');

  const plainText = `Dear ${candidateName},

${messageBody.replace(/{name}/g, candidateName)}

Access your private recruitment status link below:
${statusUrl}

Note: You do not need to create an account or remember a password. This secure link gives you direct access to your personal candidate progress.

Best regards,
Human Resources
LinkedIn Community Bangladesh
${SENDER_EMAIL}
`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${finalSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #040614; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040614; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0b1120; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 26px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, rgba(10, 102, 194, 0.22) 0%, rgba(11, 17, 32, 0) 100%);">
              <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.16em; color: #38bdf8; text-transform: uppercase;">
                LinkedIn Community Bangladesh
              </div>
              <h1 style="margin: 8px 0 0 0; font-size: 21px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                ${finalHeadline}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px;">
              <p style="margin: 0 0 18px 0; font-size: 17px; line-height: 26px; color: #f8fafc; font-weight: 600;">
                Dear ${candidateName},
              </p>

              ${formattedHtmlParagraphs}

              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #0a66c2;">
                    <a href="${statusUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #0a66c2; letter-spacing: -0.01em;">
                      ${buttonText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; line-height: 20px;">
                You do not need a password or login credentials. Your unique link provides instant, confidential access.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #64748b; word-break: break-all;">
                Direct URL: <a href="${statusUrl}" style="color: #38bdf8; text-decoration: underline;">${statusUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 28px 0;" />

              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #94a3b8;">
                Warm regards,<br />
                <strong style="color: #ffffff;">Human Resources Committee</strong><br />
                LinkedIn Community Bangladesh (LCB)<br />
                <a href="mailto:${SENDER_EMAIL}" style="color: #38bdf8; text-decoration: none;">${SENDER_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // Helper to clean API keys (strips quotes, whitespace, Bearer prefix, and dummy placeholders)
  const cleanApiKey = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    let key = raw.trim();
    key = key.replace(/^["'`]+|["'`]+$/g, '').trim();
    key = key.replace(/^Bearer\s+/i, '').trim();
    if (!key || key.includes('your_api_key') || key.includes('placeholder')) {
      return undefined;
    }
    return key;
  };

  // Check configured email dispatch providers in priority order:
  // 1. Resend API (Direct HTTP API, ideal for custom domain & high deliverability without SMTP restrictions)
  // 2. Custom Domain SMTP (e.g. cPanel, Brevo, SendGrid)
  // 3. Official Gmail App Password / OAuth2
  const resendApiKey = cleanApiKey(process.env.RESEND_API_KEY);
  const smtpHost = process.env.SMTP_HOST;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const gmailClientId = process.env.GMAIL_CLIENT_ID;
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
  const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const forceTestMode = process.env.EMAIL_TEST_MODE === 'true';

  const isConfigured = Boolean(
    resendApiKey ||
    smtpHost ||
    gmailAppPassword ||
    (gmailClientId && gmailClientSecret && gmailRefreshToken)
  );

  // Safe dev fallback if no provider credentials are set
  if (forceTestMode || !isConfigured) {
    console.log('\n======================================================');
    console.log('📨 [EMAIL SIMULATED - DEV MODE]');
    console.log(`To: ${toEmail} (${candidateName})`);
    console.log(`From: "${SENDER_NAME}" <${SENDER_EMAIL}>`);
    console.log(`Subject: ${finalSubject}`);
    console.log(`Template: ${templateType}`);
    console.log(`Candidate Link: ${statusUrl}`);
    console.log('======================================================\n');

    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  try {
    // Provider 1: Resend HTTP API (No port/SMTP blocking, perfect for Vercel + custom domain)
    if (resendApiKey) {
      const fromAddress = (process.env.RESEND_FROM || '').trim().replace(/^["']|["']$/g, '') ||
        `LinkedIn Community Bangladesh <recruitment@linkedincommunitybangladesh.com>`;
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          reply_to: SENDER_EMAIL,
          subject: finalSubject,
          text: plainText,
          html: htmlContent,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        const errorMsg = resendData.message || resendData.error || 'Failed to dispatch email via Resend';
        if (
          resendRes.status === 401 ||
          resendRes.status === 400 ||
          errorMsg.toLowerCase().includes('api key')
        ) {
          throw new Error(
            `Resend API Key Error: "${errorMsg}". Please check Vercel Settings > Environment Variables: Ensure RESEND_API_KEY is configured with your active Resend key (with no surrounding quotes or whitespace), and trigger a Redeploy.`
          );
        }
        throw new Error(errorMsg);
      }

      console.log(`✅ [RESEND SENT]: Message dispatched to ${toEmail} (ID: ${resendData.id})`);
      return {
        success: true,
        messageId: resendData.id,
        simulated: false,
      };
    }

    // Provider 2: Custom SMTP or Gmail
    let transporter: Transporter;

    if (smtpHost) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: SENDER_EMAIL,
          clientId: gmailClientId,
          clientSecret: gmailClientSecret,
          refreshToken: gmailRefreshToken,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SENDER_EMAIL,
          pass: (gmailAppPassword || '').trim().replace(/\s+/g, ''),
        },
      });
    }

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: toEmail,
      subject: finalSubject,
      text: plainText,
      html: htmlContent,
    });

    console.log(`✅ [EMAIL DISPATCHED]: Sent to ${toEmail} (ID: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
    };
  } catch (error: any) {
    console.error('❌ Failed to send status email:', error);
    return {
      success: false,
      error: error?.message || 'Failed to dispatch email notification.',
    };
  }
}

export function isGmailConfigured(): boolean {
  const cleanKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["'`]+|["'`]+$/g, '');
  const isResendValid = cleanKey.length > 10 && !cleanKey.includes('your_api_key');
  return Boolean(
    isResendValid ||
    process.env.SMTP_HOST ||
    process.env.GMAIL_APP_PASSWORD ||
    (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN)
  );
}

export function getSenderEmail(): string {
  return process.env.GMAIL_USER || 'linkedincommunitybangladesh@gmail.com';
}
