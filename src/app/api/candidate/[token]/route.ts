import { NextRequest, NextResponse } from 'next/server';
import { getCandidateBySecureToken } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const candidate = await getCandidateBySecureToken(token);
    if (!candidate) {
      return NextResponse.json(
        { error: 'Application not found or link has expired' },
        { status: 404 }
      );
    }

    // Double check privacy guarantees
    const safeCandidate = {
      ...candidate,
      notes: undefined,
      activity_logs: undefined,
    };

    return NextResponse.json({ candidate: safeCandidate });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve application', details: error.message },
      { status: 500 }
    );
  }
}
