import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/lib/auth';
import { getCandidates } from '@/lib/db';
import { CandidatesTable } from '@/components/admin/CandidatesTable';
import { Users, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Candidates Directory — LCB HR Admin',
};

export default async function AdminCandidatesPage() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const candidates = await getCandidates({ includeArchived: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 mb-2">
          <Users className="h-3.5 w-3.5 text-cyan-400" />
          <span>Talent Database</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Candidate Pipeline & Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Search, update status, generate candidate communication links, and coordinate interview panels.
        </p>
      </div>

      {/* Main interactive table */}
      <CandidatesTable initialCandidates={candidates} />
    </div>
  );
}
