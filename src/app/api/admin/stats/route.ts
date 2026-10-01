import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/db';

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve stats', details: error.message },
      { status: 500 }
    );
  }
}
