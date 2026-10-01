import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { scheduleInterview } from '@/lib/db';

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

    if (!body.date || !body.time) {
      return NextResponse.json(
        { error: 'Interview date and time are required' },
        { status: 400 }
      );
    }

    const interview = await scheduleInterview(id, body, 'LCB HR Admin');
    return NextResponse.json({ success: true, interview });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to schedule interview', details: error.message },
      { status: 500 }
    );
  }
}
