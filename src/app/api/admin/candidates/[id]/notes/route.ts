import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { addInternalNote } from '@/lib/db';

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

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: 'Note content cannot be empty' },
        { status: 400 }
      );
    }

    const note = await addInternalNote(id, body.content.trim(), body.author || 'LCB HR Team');
    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add internal note', details: error.message },
      { status: 500 }
    );
  }
}
