import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
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

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, email, status } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be decision_pending, accepted, or rejected.' },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return NextResponse.json(
        { error: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    if (name !== undefined && String(name).trim().length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty.' },
        { status: 400 }
      );
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
