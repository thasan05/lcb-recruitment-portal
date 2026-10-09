'use client';

import React, { useState, useRef } from 'react';
import { Candidate } from '@/types';
import { EMAIL_TEMPLATES, TemplateType } from '@/lib/email-templates';
import {
  Send,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Loader2,
  StopCircle,
  Users,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  onCandidateUpdated: (updatedId: string) => void;
}

interface DispatchLogItem {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'sending' | 'success' | 'error';
  error?: string;
}

export function BatchEmailModal({
  isOpen,
  onClose,
  candidates,
  onCandidateUpdated,
}: Props) {
  const unsentCount = candidates.filter((c) => !c.email_sent).length;

  const [targetMode, setTargetMode] = useState<'unsent' | 'all'>('unsent');
  const [templateType, setTemplateType] = useState<TemplateType>('auto');
  const [customSubject, setCustomSubject] = useState('');
  const [customHeadline, setCustomHeadline] = useState('');

  // Execution states
  const [isSending, setIsSending] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLogItem[]>([]);

  const stopRequestedRef = useRef(false);

  if (!isOpen) return null;

  const targetList =
    targetMode === 'unsent'
      ? candidates.filter((c) => !c.email_sent)
      : candidates;

  const acceptedInTarget = targetList.filter((c) => c.status === 'accepted').length;
  const rejectedInTarget = targetList.filter((c) => c.status === 'rejected').length;
  const pendingInTarget = targetList.filter((c) => c.status === 'decision_pending').length;

  const activeTemplate =
    templateType === 'status_update'
      ? EMAIL_TEMPLATES.status_update
      : templateType === 'auto'
      ? {
          name: 'Smart Match Candidate Status (Recommended)',
          subject: 'Auto-matched to candidate status (Review / Update)',
          headline: 'Official Recruitment Notification',
          buttonText: 'View Candidate Portal',
          defaultMessage: '',
        }
      : EMAIL_TEMPLATES.decision_pending;

  const handleStartBatch = async () => {
    if (targetList.length === 0) return;

    setIsSending(true);
    setIsFinished(false);
    setProgressCount(0);
    setSuccessCount(0);
    setErrorCount(0);
    stopRequestedRef.current = false;

    const initialLogs: DispatchLogItem[] = targetList.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      status: 'pending',
    }));
    setDispatchLogs(initialLogs);

    let succ = 0;
    let err = 0;

    for (let i = 0; i < targetList.length; i++) {
      if (stopRequestedRef.current) {
        break;
      }

      const cand = targetList[i];
      setCurrentCandidate(cand);
      setProgressCount(i + 1);

      // Update log item to 'sending'
      setDispatchLogs((prev) =>
        prev.map((item) => (item.id === cand.id ? { ...item, status: 'sending' } : item))
      );

      try {
        const res = await fetch(`/api/admin/candidates/${cand.id}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateType,
            subject: customSubject.trim() || undefined,
            headline: customHeadline.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Server dispatch error');
        }

        succ++;
        setSuccessCount(succ);
        onCandidateUpdated(cand.id);

        setDispatchLogs((prev) =>
          prev.map((item) =>
            item.id === cand.id ? { ...item, status: 'success' } : item
          )
        );
      } catch (e: any) {
        err++;
        setErrorCount(err);
        setDispatchLogs((prev) =>
          prev.map((item) =>
            item.id === cand.id
              ? { ...item, status: 'error', error: e.message || 'Failed' }
              : item
          )
        );
      }

      // Small delay between requests to comfortably adhere to Resend rate limits
      if (i < targetList.length - 1 && !stopRequestedRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    setIsSending(false);
    setIsFinished(true);
    setCurrentCandidate(null);
  };

  const handleStop = () => {
    stopRequestedRef.current = true;
  };

  const handleReset = () => {
    setIsSending(false);
    setIsFinished(false);
    setProgressCount(0);
    setSuccessCount(0);
    setErrorCount(0);
    setCurrentCandidate(null);
    setDispatchLogs([]);
  };

  const totalTarget = targetList.length;
  const progressPercent =
    totalTarget > 0 ? Math.round((progressCount / totalTarget) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-cyan-500/30 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Batch Email Dispatch
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  Resend Custom Domain
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Send recruitment emails to all candidates automatically with live tracking.
              </p>
            </div>
          </div>

          {!isSending && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {!isSending && !isFinished ? (
            <>
              {/* Recipient Audience Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Recipients:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetMode('unsent')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      targetMode === 'unsent'
                        ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500/50'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Unsent Only</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                        {unsentCount} candidates
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Skip candidates who already received an email. Recommended for new batches.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetMode('all')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      targetMode === 'all'
                        ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500/50'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">All Candidates</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
                        {candidates.length} candidates
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Send to every candidate in the current list, including previous recipients.
                    </p>
                  </button>
                </div>

                {/* Target Breakdown Stats */}
                <div className="flex flex-wrap items-center gap-2.5 mt-2.5 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300">Recipient Breakdown:</span>
                  <span className="text-emerald-400 font-semibold">{acceptedInTarget} Accepted</span>
                  <span>&bull;</span>
                  <span className="text-rose-400 font-semibold">{rejectedInTarget} Rejected</span>
                  <span>&bull;</span>
                  <span className="text-amber-400 font-semibold">{pendingInTarget} Decision Pending</span>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Email Template:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Smart Match (Auto) */}
                  {/* Option 1: Smart Match (Auto) */}
                  <button
                    type="button"
                    onClick={() => setTemplateType('auto')}
                    className={`sm:col-span-2 p-3.5 rounded-2xl border text-left transition-all ${
                      templateType === 'auto'
                        ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-950/50'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">
                          Smart Match Candidate Status (Recommended)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                        Auto Match
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Dispatches <strong>Status Decision Update</strong> to evaluated candidates (Accepted/Rejected) to view their portal result, and <strong>Under Review notice</strong> to Decision Pending candidates.
                    </p>
                  </button>

                  {/* Option 2: Status Decision Update */}
                  <button
                    type="button"
                    onClick={() => setTemplateType('status_update')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      templateType === 'status_update'
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/50'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">
                        Status Decision Update
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Notifies candidates that a decision has been finalized and invites them to view results in the portal.
                    </p>
                  </button>

                  {/* Option 3: Decision Pending */}
                  <button
                    type="button"
                    onClick={() => setTemplateType('decision_pending')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      templateType === 'decision_pending'
                        ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/50'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        Initial Decision Pending Notice
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Welcome email containing private tracking link and review ongoing notice.
                    </p>
                  </button>
                </div>
              </div>

              {/* Subject line (optional override) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Subject Line (Default or Custom):
                </label>
                <input
                  type="text"
                  placeholder={activeTemplate.subject}
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Dispatch Info Banner */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-200/90 flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Official Sending Configuration:</strong> Dispatched from{' '}
                  <code className="text-cyan-300">recruitment@linkedincommunitybangladesh.com</code>{' '}
                  with candidate replies sent directly to{' '}
                  <code className="text-cyan-300">linkedincommunitybangladesh@gmail.com</code>.
                </div>
              </div>
            </>
          ) : (
            /* Progress & Live Log View */
            <div className="space-y-4">
              {/* Progress Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-2">
                    {isSending && <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />}
                    {isSending
                      ? `Dispatching ${progressCount} of ${totalTarget}...`
                      : isFinished
                      ? 'Batch Dispatch Finished'
                      : 'Dispatch Paused'}
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Live Stats */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Sent: {successCount}
                  </span>
                  {errorCount > 0 && (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Errors: {errorCount}
                    </span>
                  )}
                  <span>Remaining: {Math.max(0, totalTarget - progressCount)}</span>
                </div>
              </div>

              {/* Current candidate ticker */}
              {isSending && currentCandidate && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin flex-shrink-0" />
                  <span className="truncate">
                    Sending to <strong>{currentCandidate.name}</strong> ({currentCandidate.email})...
                  </span>
                </div>
              )}

              {/* Scrollable Live Dispatch Log */}
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Dispatch Log ({dispatchLogs.length})
                </h4>
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-white/10 font-mono text-[11px]">
                  {dispatchLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {log.status === 'success' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        ) : log.status === 'error' ? (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                        ) : log.status === 'sending' ? (
                          <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                        )}
                        <span className="text-white font-medium truncate">{log.name}</span>
                        <span className="text-slate-500 truncate">({log.email})</span>
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {log.status === 'success' && (
                          <span className="text-emerald-400 font-semibold text-[10px]">
                            Sent
                          </span>
                        )}
                        {log.status === 'error' && (
                          <span className="text-rose-400 font-semibold text-[10px]" title={log.error}>
                            Failed
                          </span>
                        )}
                        {log.status === 'sending' && (
                          <span className="text-cyan-400 text-[10px]">Sending...</span>
                        )}
                        {log.status === 'pending' && (
                          <span className="text-slate-600 text-[10px]">Queued</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          {!isSending && !isFinished ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={targetList.length === 0}
                onClick={handleStartBatch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="h-4 w-4" />
                <span>Dispatch {targetList.length} Emails</span>
              </button>
            </>
          ) : isSending ? (
            <>
              <div className="text-xs text-slate-400">
                Please keep this window open while emails are dispatching.
              </div>

              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 text-xs font-semibold transition-colors"
              >
                <StopCircle className="h-4 w-4" />
                <span>Stop Dispatch</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                Send Another Batch
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-600/30"
              >
                Done ({successCount} Sent)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
