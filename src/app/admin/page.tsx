import { redirect } from 'next/navigation';
import Link from 'next/link';
import { checkAdminAuth } from '@/lib/auth';
import { getCandidates, getDashboardStats } from '@/lib/db';
import { STATUS_CONFIG } from '@/types';
import { StatusBadge } from '@/components/candidate/StatusBadge';
import {
  Users,
  Clock,
  UserCheck,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowRight,
  UserPlus,
  FileSpreadsheet,
  ExternalLink,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const metadata = {
  title: 'HR Dashboard — LCB Recruitment Portal',
};

export default async function AdminDashboardPage() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const [stats, candidates] = await Promise.all([
    getDashboardStats(),
    getCandidates({ includeArchived: false }),
  ]);

  const upcomingInterviews = candidates
    .filter((c) => c.interview && c.status === 'INTERVIEW_SCHEDULED')
    .slice(0, 5);

  const recentCandidates = candidates.slice(0, 5);

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      sub: `${stats.recentCount} this past week`,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Under Review',
      value: stats.underReview,
      sub: 'Awaiting evaluation',
      icon: Clock,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: 'Shortlisted',
      value: stats.shortlisted,
      sub: 'Passed initial screening',
      icon: UserCheck,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Interviews Scheduled',
      value: stats.interviewScheduled,
      sub: 'Panels & slots active',
      icon: Calendar,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Selected',
      value: stats.selected,
      sub: 'Accepted & offers',
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Not Selected',
      value: stats.notSelected,
      sub: 'Respectfully closed',
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Recruitment Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Talent Pipeline Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time management for LinkedIn Community Bangladesh recruitment cohorts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/candidates"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            <Users className="h-4 w-4" />
            <span>Manage Candidates</span>
          </Link>

          <Link
            href="/admin/import"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
            <span>Bulk CSV Import</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border ${card.border} bg-slate-950/70 p-4 backdrop-blur-xl shadow-lg flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 line-clamp-1">
                  {card.label}
                </span>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bg} ${card.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Applications & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Applications (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-white/[0.08] bg-slate-950/70 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Applications</h2>
              <p className="text-xs text-slate-400">Latest candidates registered in the portal</p>
            </div>
            <Link
              href="/admin/candidates"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View All ({candidates.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                <tr>
                  <th className="pb-3 font-semibold">Candidate</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/candidates/${c.id}`}
                        className="font-bold text-white hover:text-cyan-300 block text-xs sm:text-sm"
                      >
                        {c.full_name}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {c.application_id}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-xs font-medium text-slate-200">{c.position}</div>
                      <div className="text-[10px] text-slate-500">{c.department}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/candidates/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Interviews (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-white/[0.08] bg-slate-950/70 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Upcoming Interviews
                </h2>
              </div>
              <Link
                href="/admin/interviews"
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                View ({upcomingInterviews.length})
              </Link>
            </div>

            {upcomingInterviews.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No interviews scheduled yet</p>
                <Link
                  href="/admin/candidates"
                  className="mt-2 inline-block text-[11px] text-blue-400 hover:underline"
                >
                  Schedule for shortlisted candidate →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{c.full_name}</span>
                      <span className="text-[10px] font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        {c.interview?.time}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{c.position}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{c.interview?.date}</span>
                      <span className="text-cyan-400">{c.interview?.meeting_platform}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Link
              href="/admin/scheduler"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 py-2.5 text-xs font-semibold text-amber-300 transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Launch Slot Assistant</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
