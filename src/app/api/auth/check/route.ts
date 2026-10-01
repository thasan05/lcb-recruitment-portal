import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';

export async function GET() {
  const isAuth = await checkAdminAuth();
  return NextResponse.json({ authenticated: isAuth });
}
