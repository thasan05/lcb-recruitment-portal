import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { updateCandidateStatus, deleteCandidate } from '@/lib/db';
import { CandidateStatus } from '@/types';

const VALID_STATUSES: CandidateStatus[] = ['decision_pending', 'accepted', 'rejected'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be decision_pending, accepted, or rejected.' },
        { status: 400 }
      );
    }

    const updated = await updateCandidateStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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

  const { id } = await params;

  try {
    const success = await deleteCandidate(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
