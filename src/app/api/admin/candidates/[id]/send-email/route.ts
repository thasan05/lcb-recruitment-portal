import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getCandidateById, markEmailSent } from '@/lib/db';
import { sendCandidateStatusEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const candidate = await getCandidateById(id);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    if (!candidate.email || !candidate.email.includes('@')) {
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

    // Trigger email send via Gmail service
    const result = await sendCandidateStatusEmail({
      toEmail: candidate.email,
      candidateName: candidate.name,
      secureToken: candidate.secure_token,
      candidateStatus: candidate.status,
      templateType: (!templateType || templateType === 'auto')
        ? (candidate.status === 'accepted' ? 'accepted' : candidate.status === 'rejected' ? 'rejected' : 'decision_pending')
        : templateType,
      subject,
      headline,
      customMessage,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch email' },
        { status: 500 }
      );
    }

    // Mark email as sent in DB
    const updated = await markEmailSent(candidate.id);

    return NextResponse.json({
      success: true,
      simulated: result.simulated ?? false,
      messageId: result.messageId,
      candidate: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
