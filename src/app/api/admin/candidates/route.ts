import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, verifyCsrfOrigin } from '@/lib/auth';
import { getCandidates, resetAllCandidates, createCandidate, updateCandidateDetails } from '@/lib/db';
import { CandidateStatus } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_STATUSES: CandidateStatus[] = ['decision_pending', 'accepted', 'rejected'];

export async function GET(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || undefined;

  try {
    const candidates = await getCandidates(q);
    return NextResponse.json(
      { candidates },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve candidates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
  }

  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 65536) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const body = await request.json();
    const { name, email, status } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Full name exceeds 100 character limit.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }
    if (email.trim().length > 254) {
      return NextResponse.json({ error: 'Email exceeds 254 character limit.' }, { status: 400 });
    }

    const validStatus: CandidateStatus = VALID_STATUSES.includes(status)
      ? status
      : 'decision_pending';

    const newCandidate = await createCandidate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      status: validStatus,
    });

    return NextResponse.json({
      success: true,
      message: `Candidate ${newCandidate.name} created successfully.`,
      candidate: newCandidate,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
  }

  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 524288) { // 512 KB
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const body = await request.json();
    const updates = Array.isArray(body?.updates) ? body.updates : [];

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    if (updates.length > 500) {
      return NextResponse.json({ error: 'Too many updates in a single request (max 500).' }, { status: 400 });
    }

    const updatedCandidates = [];
    for (const item of updates) {
      if (item && item.id && typeof item.id === 'string') {
        const itemStatus: CandidateStatus | undefined =
          item.status && VALID_STATUSES.includes(item.status) ? item.status : undefined;
        const itemName = typeof item.name === 'string' ? item.name.trim().slice(0, 100) : undefined;
        const itemEmail =
          typeof item.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email.trim())
            ? item.email.trim().toLowerCase().slice(0, 254)
            : undefined;

        const updated = await updateCandidateDetails(item.id, {
          name: itemName,
          email: itemEmail,
          status: itemStatus,
        });
        if (updated) {
          updatedCandidates.push(updated);
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedCandidates.length,
      candidates: updatedCandidates,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update candidates' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
  }

  try {
    const result = await resetAllCandidates();
    return NextResponse.json({
      success: true,
      message: 'Candidate list has been successfully reset.',
      count: result.count,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reset candidate database' }, { status: 500 });
  }
}
