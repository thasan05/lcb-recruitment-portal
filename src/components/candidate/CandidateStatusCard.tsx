'use client';

import React, { useState } from 'react';
import { CandidatePublicView, STATUS_CONFIG, normalizeCandidateStatus } from '@/types';
import { CheckCircle2, Clock, XCircle, Sparkles, Copy, Check, ShieldCheck, Share2, Mail } from 'lucide-react';
import { LCBLogo } from '@/components/LCBLogo';
import { formatLastUpdated } from '@/lib/date-format';

interface Props {
  candidate: CandidatePublicView;
}

export function CandidateStatusCard({ candidate }: Props) {
  const [copied, setCopied] = useState(false);
  const effectiveStatus = normalizeCandidateStatus(candidate.status);
  const meta = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.decision_pending;
  const isAccepted = effectiveStatus === 'accepted';
  const isPending = effectiveStatus === 'decision_pending';
  const isRejected = effectiveStatus === 'rejected';

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Define steps according to requirements
  const getSteps = () => {
    if (isAccepted) {
      return [
        { label: 'Application Received', state: 'done' },
        { label: 'Interview Completed', state: 'done' },
        { label: 'Final Decision', state: 'done' },
        { label: 'Accepted', state: 'accepted' },
      ];
    }
    if (isRejected) {
      return [
        { label: 'Application Received', state: 'done' },
        { label: 'Interview Completed', state: 'done' },
        { label: 'Final Decision', state: 'done' },
        { label: 'Not Selected', state: 'rejected' },
      ];
    }
    // Default: Decision Pending
    return [
      { label: 'Application Received', state: 'done' },
      { label: 'Interview Completed', state: 'done' },
      { label: 'Decision Pending', state: 'pending' },
      { label: 'Final Decision', state: 'upcoming' },
    ];
  };

  const steps = getSteps();

  if (candidate.is_expired) {
    return (
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
        <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden animate-scale-in">
          {/* Ambient Subtle Amber/Slate Glow */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-slate-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
            <div className="flex items-center gap-3">
              <LCBLogo variant="icon" href="" />
              <div className="border-l border-white/10 pl-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
                  LinkedIn Community Bangladesh
                </div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Recruitment Status Portal
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Link Expired (30 Days)</span>
              </span>
            </div>
          </div>

          {/* Expired Notification Content */}
          <div className="mt-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Recruitment Cycle Concluded
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Hello, <strong className="text-white">{candidate.name}</strong>. This private candidate tracking link has reached its 30-day security threshold and is now archived.
            </p>

            {/* Archived Status Info */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-900/60 border border-white/10">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Recorded Final Status
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border ${meta.badgeClass}`}>
                  {isAccepted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {isRejected && <XCircle className="h-4 w-4 text-rose-400" />}
                  {isPending && <Clock className="h-4 w-4 text-amber-400" />}
                  <span>{meta.label}</span>
                </span>
                <span className="text-xs text-slate-500">
                  Application cycle officially closed
                </span>
              </div>
            </div>

            {/* Privacy & Resource Preservation Notice */}
            <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-300">Why did this link expire?</strong> To safeguard applicant privacy, prevent unauthorized access to archived recruitment evaluations, and optimize portal resources, candidate tokens expire automatically after 30 days.
              </p>
            </div>

            {/* HR Contact Button */}
            <div className="mt-8">
              <a
                href="mailto:linkedincommunitybangladesh@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20"
              >
                <Mail className="h-4 w-4" />
                <span>Contact LCB HR Committee</span>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Official LCB Notification • Updated {formatLastUpdated(candidate.updated_at)}</span>
            </div>
            <span>Archived Record</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      {/* Brand Card with Entrance Animation */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden animate-scale-in">
        {/* Dynamic Glow Backdrops based on Status */}
        {isAccepted && (
          <>
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          </>
        )}
        {isPending && (
          <>
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          </>
        )}
        {isRejected && (
          <>
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-slate-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        {/* Clean Header: Logo Mark + Well-aligned Title without overlap */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <LCBLogo variant="icon" href="" />
            <div className="border-l border-white/10 pl-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
                LinkedIn Community Bangladesh
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Recruitment Status Portal
              </h1>
            </div>
          </div>

          {/* Live Status Tag */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/10 text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span>Live Portal</span>
            </span>
          </div>
        </div>

        {/* Greeting & Status Box */}
        <div className="mt-8 relative z-10">
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            Candidate Evaluation
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Hello, {candidate.name}
          </h2>

          {/* Status Banner */}
          <div
            className={`mt-6 p-6 rounded-2xl border transition-all duration-500 backdrop-blur-md ${
              isAccepted
                ? 'bg-emerald-950/30 border-emerald-500/30 shadow-lg shadow-emerald-950/50'
                : isRejected
                ? 'bg-rose-950/20 border-rose-500/20'
                : 'bg-amber-950/20 border-amber-500/30 shadow-lg shadow-amber-950/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Current Application Status
              </div>
              {isAccepted && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 animate-celebrate">
                  <Sparkles className="h-4 w-4" />
                  <span>Selected Candidate</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm sm:text-base font-bold border shadow-sm ${meta.badgeClass}`}
              >
                {isPending && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                  </span>
                )}
                {isAccepted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {isRejected && <XCircle className="h-4 w-4 text-rose-400" />}
                <span>{meta.label}</span>
              </span>
            </div>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {meta.message}
            </p>
          </div>
        </div>

        {/* Progress Stepper Visualization with Animated Connectors */}
        <div className="mt-10 pt-8 border-t border-white/[0.08] relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recruitment Progress
            </h3>
            <span className="text-[11px] text-slate-500">
              Stage {steps.findIndex((s) => s.state === 'pending' || s.state === 'accepted' || s.state === 'rejected') + 1} of 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-2 relative">
            {steps.map((st, index) => {
              const isDone = st.state === 'done';
              const isStepAccepted = st.state === 'accepted';
              const isStepRejected = st.state === 'rejected';
              const isStepPending = st.state === 'pending';
              const isStepUpcoming = st.state === 'upcoming';

              return (
                <div
                  key={st.label}
                  className={`flex sm:flex-col items-center text-left sm:text-center gap-3 sm:gap-2.5 p-3.5 sm:p-3 rounded-xl border transition-all duration-300 ${
                    isStepAccepted
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-500/10'
                      : isStepPending
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/20'
                      : isStepRejected
                      ? 'bg-rose-500/10 border-rose-500/20'
                      : isDone
                      ? 'bg-white/[0.03] border-white/[0.08]'
                      : 'bg-white/[0.01] border-white/[0.03] opacity-60'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isDone && (
                      <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    )}
                    {isStepPending && (
                      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40">
                        <span className="animate-ping absolute h-5 w-5 rounded-full bg-amber-400 opacity-75" />
                        <Clock className="h-4 w-4 text-amber-400 relative" />
                      </div>
                    )}
                    {isStepAccepted && (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-celebrate">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                    {isStepRejected && (
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <XCircle className="h-4 w-4" />
                      </div>
                    )}
                    {isStepUpcoming && (
                      <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900/80 flex items-center justify-center text-xs text-slate-500 font-semibold">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        isStepAccepted
                          ? 'text-emerald-400'
                          : isStepRejected
                          ? 'text-rose-400'
                          : isStepPending
                          ? 'text-amber-300'
                          : isDone
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {st.label}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize mt-0.5">
                      {isDone
                        ? 'Completed'
                        : isStepPending
                        ? 'In Progress'
                        : isStepAccepted
                        ? 'Selected'
                        : isStepRejected
                        ? 'Not Selected'
                        : 'Upcoming'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions & Metadata */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 relative z-10">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>Official LCB Notification • Updated {formatLastUpdated(candidate.updated_at)}</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Save Private Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
