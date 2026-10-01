import { Candidate, STATUS_CONFIG } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Clock, ShieldCheck, Briefcase, Calendar } from 'lucide-react';

interface HeroCardProps {
  candidate: Candidate;
}

export function HeroCard({ candidate }: HeroCardProps) {
  const meta = STATUS_CONFIG[candidate.status] || STATUS_CONFIG.APPLICATION_RECEIVED;

  const formattedDate = new Date(candidate.application_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedUpdated = new Date(candidate.last_updated).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-600/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          {/* Tagline / Subtitle */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Official Candidate Portal
          </div>

          <h1 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">{candidate.full_name}</span>
          </h1>

          <p className="mt-2 text-base text-slate-300 flex items-center gap-2 flex-wrap">
            <span>Applying for</span>
            <span className="font-semibold text-white px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
              {candidate.position}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{candidate.department}</span>
          </p>

          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-300/90">
            {meta.description}
          </p>
        </div>

        {/* Current Status Box */}
        <div className="flex flex-col items-start md:items-end justify-between shrink-0 gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium">
              Current Stage
            </span>
            <StatusBadge status={candidate.status} size="lg" />
          </div>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                App ID: <strong className="text-slate-200 font-mono">{candidate.application_id}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Applied: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Updated: {formattedUpdated}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
