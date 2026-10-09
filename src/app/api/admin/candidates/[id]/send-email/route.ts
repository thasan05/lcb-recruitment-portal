import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, verifyCsrfOrigin } from '@/lib/auth';
import { getCandidateById, markEmailSent } from '@/lib/db';
import { sendCandidateStatusEmail } from '@/lib/email';

// Rate limiting for email dispatch (protects against quota exhaustion / accidental spamming)
const emailSendCooldown = new Map<string, number>();
const CANDIDATE_EMAIL_COOLDOWN_MS = 10 * 1000; // 10s cooldown per candidate to prevent rapid double-clicks

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
  }

  const { id } = await params;
  if (!id || typeof id !== 'string' || id.length > 64) {
    return NextResponse.json({ error: 'Invalid candidate ID.' }, { status: 400 });
  }

  // Prevent rapid duplicate sends to the same candidate
  const lastSent = emailSendCooldown.get(id);
  const now = Date.now();
  if (lastSent && now - lastSent < CANDIDATE_EMAIL_COOLDOWN_MS) {
    return NextResponse.json(
      { error: 'Email dispatch is on cooldown for this candidate. Please wait a few seconds.' },
      { status: 429 }
    );
  }

  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 32768) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const candidate = await getCandidateById(id);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    if (!candidate.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
      return NextResponse.json(
        { error: 'Candidate does not have a valid email address.' },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable; fallback to template defaults
    }

    const { templateType, subject, headline, customMessage } = body;

    // Validate inputs with length limits
    const validTemplate = (['auto', 'decision_pending', 'status_update'].includes(templateType))
      ? templateType
      : 'auto';

    const cleanSubject = typeof subject === 'string' ? subject.trim().slice(0, 200) : undefined;
    const cleanHeadline = typeof headline === 'string' ? headline.trim().slice(0, 200) : undefined;
    const cleanCustomMessage = typeof customMessage === 'string' ? customMessage.trim().slice(0, 5000) : undefined;

    // Trigger email send via email service (recipient strictly derived from candidate record)
    const result = await sendCandidateStatusEmail({
      toEmail: candidate.email,
      candidateName: candidate.name,
      secureToken: candidate.secure_token,
      candidateStatus: candidate.status,
      templateType: validTemplate === 'auto'
        ? (candidate.status !== 'decision_pending' ? 'status_update' : 'decision_pending')
        : validTemplate,
      subject: cleanSubject,
      headline: cleanHeadline,
      customMessage: cleanCustomMessage,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch email' },
        { status: 500 }
      );
    }

    // Set cooldown timestamp
    emailSendCooldown.set(id, now);

    // Mark email as sent in DB
    const updated = await markEmailSent(candidate.id);

    return NextResponse.json({
      success: true,
      simulated: result.simulated ?? false,
      messageId: result.messageId,
      candidate: updated,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to process email dispatch request' }, { status: 500 });
  }
}
