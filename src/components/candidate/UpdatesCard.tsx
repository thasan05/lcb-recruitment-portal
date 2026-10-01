import { CandidateUpdate } from '@/types';
import { Bell, Calendar, MessageSquare } from 'lucide-react';

interface UpdatesCardProps {
  updates?: CandidateUpdate[];
}

export function UpdatesCard({ updates = [] }: UpdatesCardProps) {
  const visibleUpdates = updates.filter((u) => u.is_candidate_visible);

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/60 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Recruitment Announcements & Updates
            </h2>
            <p className="text-xs text-slate-400">
              Official messages published directly by the LCB HR Team
            </p>
          </div>
        </div>
      </div>

      {visibleUpdates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-3">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No new announcements yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            When the HR team posts notifications or scheduling updates regarding your application, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleUpdates.map((update, idx) => {
            const formattedDate = new Date(update.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={update.id || idx}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                    {update.title}
                  </h3>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed whitespace-pre-line pl-4 border-l-2 border-slate-800">
                  {update.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
