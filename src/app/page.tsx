import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/lib/auth';
import { HRLoginPage } from '@/components/auth/HRLoginPage';

export const metadata = {
  title: 'HR Portal Login — LinkedIn Community Bangladesh',
  description: 'Internal Recruitment & Candidate Management System for LinkedIn Community Bangladesh HR personnel.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const isAuth = await checkAdminAuth();
  if (isAuth) {
    redirect('/admin');
  }

  return <HRLoginPage />;
}
