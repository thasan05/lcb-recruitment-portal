import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/lib/auth';
import { getCandidates } from '@/lib/db';
import { SlotScheduler } from '@/components/admin/SlotScheduler';
import { Clock } from 'lucide-react';

export const metadata = {
  title: 'Interview Slot Assistant — LCB HR Admin',
};

export default async function AdminSchedulerPage() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const candidates = await getCandidates({ includeArchived: false });

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-2">
          <Clock className="h-3.5 w-3.5" />
          <span>Productivity Accelerator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Interview Slot Generation Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Generate sequential interview time slots, set custom buffer periods, and assign them directly to applicants with 1-click.
        </p>
      </div>

      <SlotScheduler candidates={candidates} />
    </div>
  );
}
