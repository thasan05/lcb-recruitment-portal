import { NextRequest, NextResponse } from 'next/server';
import { getCandidateBySecureToken } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

    // Only return public-safe recruitment status data with no-store cache headers
    return NextResponse.json(
      {
        candidate: {
          name: candidate.name,
          status: candidate.status,
          updated_at: candidate.updated_at,
          is_expired: candidate.is_expired,
          expired_at: candidate.expired_at,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve application', details: error.message },
      { status: 500 }
    );
  }
}
