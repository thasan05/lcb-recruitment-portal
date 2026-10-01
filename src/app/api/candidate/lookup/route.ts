import { NextRequest, NextResponse } from 'next/server';
import { getCandidates } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idQuery = searchParams.get('id')?.trim();

  if (!idQuery) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    const candidates = await getCandidates();
    const match = candidates.find(
      (c) =>
        c.application_id.toLowerCase() === idQuery.toLowerCase() ||
        c.secure_token.toLowerCase() === idQuery.toLowerCase()
    );

    if (match) {
      return NextResponse.json({ token: match.secure_token, found: true });
    }

    return NextResponse.json({ error: 'Candidate not found', found: false }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Lookup failed', details: error.message },
      { status: 500 }
    );
  }
}
