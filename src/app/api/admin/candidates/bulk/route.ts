import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { bulkUpdateStatus } from '@/lib/db';
import { CandidateStatus } from '@/types';

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ids, status } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json(
        { error: 'Candidate IDs array and target status are required' },
        { status: 400 }
      );
    }

    const updatedCount = await bulkUpdateStatus(ids, status as CandidateStatus, 'LCB HR Admin');
    return NextResponse.json({
      success: true,
      count: updatedCount,
      message: `Updated status for ${updatedCount} candidates`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to perform bulk update', details: error.message },
      { status: 500 }
    );
  }
}
