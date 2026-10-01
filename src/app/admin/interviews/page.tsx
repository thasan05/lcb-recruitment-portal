import { redirect } from 'next/navigation';
import Link from 'next/link';
import { checkAdminAuth } from '@/lib/auth';
import { getCandidates } from '@/lib/db';
import { Calendar, Video, Clock, ExternalLink, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Interviews Pipeline — LCB HR Admin',
};

export default async function AdminInterviewsPage() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const candidates = await getCandidates({ includeArchived: false });
  const candidatesWithInterviews = candidates.filter((c) => Boolean(c.interview));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Interview Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Scheduled Interviews & Panels
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor all live evaluation slots, Google Meet links, and panel allocations
          </p>
        </div>

        <Link
          href="/admin/scheduler"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-all"
        >
          <Clock className="h-4 w-4" />
          <span>Launch Slot Assistant</span>
        </Link>
      </div>

      {/* Grid of interview cards */}
      {candidatesWithInterviews.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-16 text-center backdrop-blur-xl">
          <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Interviews Scheduled Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Schedule interviews for shortlisted candidates from the candidate directory or generate slots using the Slot Assistant.
          </p>
          <Link
            href="/admin/candidates"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            <span>Go to Candidate Directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidatesWithInterviews.map((c) => {
            const iv = c.interview!;
            const isCompleted = iv.status === 'COMPLETED';

            return (
              <div
                key={c.id}
                className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isCompleted
                          ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-sky-400' : 'bg-emerald-400'}`} />
                      {iv.status}
                    </span>

                    <span className="font-mono text-xs text-slate-400">
                      {c.application_id}
                    </span>
                  </div>

                  <Link
                    href={`/admin/candidates/${c.id}`}
                    className="text-lg font-bold text-white hover:text-cyan-300 transition-colors block"
                  >
                    {c.full_name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">{c.position} · {c.department}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-300 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold text-white">
                        {iv.date} · {iv.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Video className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{iv.meeting_platform} ({iv.duration} mins)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>{iv.interviewer}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  {iv.meeting_link ? (
                    <a
                      href={iv.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <span>Open Meeting</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">No link set</span>
                  )}

                  <Link
                    href={`/admin/candidates/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <span>Manage</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
