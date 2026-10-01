import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { addCandidateUpdate } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'Announcement title and message are required' },
        { status: 400 }
      );
    }

    const update = await addCandidateUpdate(id, body, 'LCB HR Admin');
    return NextResponse.json({ success: true, update });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to publish candidate update', details: error.message },
      { status: 500 }
    );
  }
}
