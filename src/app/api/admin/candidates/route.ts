import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getCandidates, createCandidate } from '@/lib/db';

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const department = searchParams.get('department') || undefined;
  const position = searchParams.get('position') || undefined;
  const search = searchParams.get('search') || undefined;
  const includeArchived = searchParams.get('includeArchived') === 'true';

  try {
    const candidates = await getCandidates({
      status,
      department,
      position,
      search,
      includeArchived,
    });
    return NextResponse.json({ candidates });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch candidates', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.full_name || !body.email) {
      return NextResponse.json(
        { error: 'Candidate name and email are required' },
        { status: 400 }
      );
    }

    const candidate = await createCandidate(body, 'LCB HR Admin');
    return NextResponse.json({ success: true, candidate }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create candidate', details: error.message },
      { status: 500 }
    );
  }
}
