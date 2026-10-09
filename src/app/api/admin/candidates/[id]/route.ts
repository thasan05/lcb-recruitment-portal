import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, verifyCsrfOrigin } from '@/lib/auth';
import { updateCandidateDetails, deleteCandidate } from '@/lib/db';
import { CandidateStatus } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_STATUSES: CandidateStatus[] = ['decision_pending', 'accepted', 'rejected'];

export async function PATCH(
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

  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 32768) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const body = await request.json();
    const { name, email, status } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be decision_pending, accepted, or rejected.' },
        { status: 400 }
      );
    }

    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()) || String(email).trim().length > 254)) {
      return NextResponse.json(
        { error: 'Invalid email address format or length exceeds 254 characters.' },
        { status: 400 }
      );
    }

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (cleanName.length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty.' },
          { status: 400 }
        );
      }
      if (cleanName.length > 100) {
        return NextResponse.json(
          { error: 'Name cannot exceed 100 characters.' },
          { status: 400 }
        );
      }
    }

    const updated = await updateCandidateDetails(id, {
      name: name !== undefined ? String(name).trim() : undefined,
      email: email !== undefined ? String(email).trim().toLowerCase() : undefined,
      status: status as CandidateStatus | undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

export async function DELETE(
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

  try {
    const success = await deleteCandidate(id);
    if (!success) {
      return NextResponse.json({ error: 'Candidate not found or already deleted.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}
