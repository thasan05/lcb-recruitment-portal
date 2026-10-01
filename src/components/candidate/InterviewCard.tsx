'use client';

import { Candidate, Interview } from '@/types';
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar';
import {
  Calendar,
  Clock,
  Video,
  UserCheck,
  ExternalLink,
  Download,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface InterviewCardProps {
  interview: Interview;
  candidate: Candidate;
}

export function InterviewCard({ interview, candidate }: InterviewCardProps) {
  const gCalUrl = generateGoogleCalendarUrl(interview, {
    full_name: candidate.full_name,
    position: candidate.position,
  });

  const handleDownloadIcs = () => {
    downloadIcsFile(interview, {
      full_name: candidate.full_name,
      position: candidate.position,
    });
  };

  const isCompleted = interview.status === 'COMPLETED';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      {/* Accent glow line at top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interview Information</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
            Evaluation & Discussion Session
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isCompleted
                ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isCompleted ? 'bg-sky-400' : 'bg-emerald-400 animate-ping'
              }`}
            />
            {interview.status}
          </span>
        </div>
      </div>

      {/* Grid of interview metrics */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <span>Date</span>
          </div>
          <p className="mt-2 text-base font-bold text-white">{interview.date}</p>
          <p className="text-[11px] text-slate-500">Scheduled Date</p>
        </div>

        {/* Time */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>Time</span>
          </div>
          <p className="mt-2 text-base font-bold text-white">{interview.time}</p>
          <p className="text-[11px] text-slate-500">{interview.timezone}</p>
        </div>

        {/* Platform */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Video className="h-4 w-4 text-cyan-400" />
            <span>Platform</span>
          </div>
          <p className="mt-2 text-base font-bold text-white">{interview.meeting_platform}</p>
          <p className="text-[11px] text-slate-500">{interview.duration} mins slot</p>
        </div>

        {/* Panel */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <UserCheck className="h-4 w-4 text-cyan-400" />
            <span>Panel</span>
          </div>
          <p className="mt-2 text-sm font-bold text-white truncate">{interview.interviewer}</p>
          <p className="text-[11px] text-slate-500">Evaluation Team</p>
        </div>
      </div>

      {/* Instructions */}
      {interview.instructions && (
        <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">
                Preparation Instructions:
              </span>
              <p className="text-slate-300 leading-relaxed">{interview.instructions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
        {interview.meeting_link && !isCompleted && (
          <a
            href={interview.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/50 active:scale-[0.98]"
          >
            <span>Join Meeting</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {/* Google Calendar Link */}
        <a
          href={gCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Calendar className="h-4 w-4 text-cyan-400" />
          <span>Add to Google Calendar</span>
        </a>

        {/* ICS Download */}
        <button
          type="button"
          onClick={handleDownloadIcs}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Download className="h-4 w-4 text-slate-400" />
          <span>Download .ICS file</span>
        </button>
      </div>
    </div>
  );
}
