import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/lib/auth';
import { SimpleHRConsole } from '@/components/admin/SimpleHRConsole';

export const metadata = {
  title: 'LCB HR Portal — Recruitment Status Management',
};

export default async function AdminPage() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    redirect('/');
  }

  return <SimpleHRConsole />;
}
