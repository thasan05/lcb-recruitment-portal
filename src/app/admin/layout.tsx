import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/lib/auth';
import { AdminNav } from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isAuth = await checkAdminAuth();

  // If path is login, layout will still wrap it, but we handle in subpages or check path
  // In Next.js App Router, if this layout wraps /admin/login, we shouldn't redirect loop.
  // We can pass isAuth down or handle redirect in page / middleware.
  // Better approach: Let AdminNav render if authenticated, or render minimal layout.

  return (
    <div className="min-h-screen bg-[#040614] text-white flex flex-col antialiased">
      <AdminNav isAuthenticated={isAuth} />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
