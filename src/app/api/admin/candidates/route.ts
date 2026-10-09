import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getCandidates, resetAllCandidates } from '@/lib/db';

export async function GET(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || undefined;

  try {
    const candidates = await getCandidates(q);
    return NextResponse.json({ candidates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await resetAllCandidates();
    return NextResponse.json({
      success: true,
      message: 'Candidate list has been successfully reset.',
      count: result.count,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
