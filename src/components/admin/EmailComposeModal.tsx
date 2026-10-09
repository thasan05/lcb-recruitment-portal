'use client';

import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStatus, STATUS_CONFIG } from '@/types';
import { EMAIL_TEMPLATES, TemplateType } from '@/lib/email-templates';
import { Mail, Send, X, Eye, Edit3, Sparkles, Clock, Check, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { LCBLogo } from '@/components/LCBLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onEmailSent: (candidateId: string, isSimulated: boolean) => void;
}

export function EmailComposeModal({ isOpen, onClose, candidate, onEmailSent }: Props) {
  // Determine template based on candidate's current status
  const defaultTemplateType: TemplateType =
    candidate?.status === 'decision_pending' ? 'decision_pending' : 'status_update';

  const [templateType, setTemplateType] = useState<TemplateType>(defaultTemplateType);
  const [subject, setSubject] = useState(
    EMAIL_TEMPLATES[defaultTemplateType]?.subject || ''
  );
  const [message, setMessage] = useState(
    EMAIL_TEMPLATES[defaultTemplateType]?.defaultMessage || ''
  );
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when candidate or modal opens
  useEffect(() => {
    if (candidate && isOpen) {
      const type: TemplateType =
        candidate.status === 'decision_pending' ? 'decision_pending' : 'status_update';
      setTemplateType(type);
      setSubject(EMAIL_TEMPLATES[type]?.subject || '');
      setMessage(EMAIL_TEMPLATES[type]?.defaultMessage || '');
      setError(null);
      setActiveTab('compose');
    }
  }, [candidate?.id, candidate?.status, isOpen]);

  // Sync template fields when template selection changes
  useEffect(() => {
    if (templateType === 'decision_pending') {
      setSubject(EMAIL_TEMPLATES.decision_pending.subject);
      setMessage(EMAIL_TEMPLATES.decision_pending.defaultMessage);
    } else if (templateType === 'status_update') {
      setSubject(EMAIL_TEMPLATES.status_update.subject);
      setMessage(EMAIL_TEMPLATES.status_update.defaultMessage);
    }
  }, [templateType]);

  // Early return ONLY after all hooks have been declared
  if (!isOpen || !candidate) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  // Enforce shortened 24-character hex hash with strictly zero names
  const cleanToken = (() => {
    const raw = (candidate.secure_token || '').trim().toLowerCase();
    if (/^[a-f0-9]{24}$/.test(raw)) return raw;
    if (/^[a-f0-9]{25,}$/.test(raw)) return raw.slice(0, 24);
    // Deterministic 24-character hex hash fallback
    let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
    const str = 'lcb_cand_' + (candidate.id || candidate.email || 'token');
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return (p1 + p2 + '8a2b3c4d').slice(0, 24);
  })();
  const statusUrl = `${origin}/status/${cleanToken}`;
  const statusMeta = STATUS_CONFIG[candidate.status] || STATUS_CONFIG.decision_pending;

  const handleSend = async () => {
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          subject,
          customMessage: message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch email via Gmail');
      }

      onEmailSent(candidate.id, Boolean(data.simulated));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while sending email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in-up">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-slate-900/60 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Send Recruitment Email</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                From: <span className="text-cyan-400 font-mono">recruitment@linkedincommunitybangladesh.com</span>
                <span className="text-slate-500 text-[11px] ml-1.5">(Replies to: linkedincommunitybangladesh@gmail.com)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Recipient Details Card */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400">Recipient Candidate: </span>
              <strong className="text-white ml-1">{candidate.name}</strong>
              <span className="text-slate-400 ml-2 font-mono">({candidate.email})</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Token: {candidate.secure_token.slice(0, 14)}...</span>
            </div>
          </div>

          {/* Template Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Email Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Decision Pending */}
              <button
                type="button"
                onClick={() => setTemplateType('decision_pending')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  templateType === 'decision_pending'
                    ? 'bg-blue-600/15 border-blue-500/50 ring-1 ring-blue-500/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <Clock className={`h-4 w-4 mt-0.5 flex-shrink-0 ${templateType === 'decision_pending' ? 'text-blue-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white">1. Decision Pending Email</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Interview completed notice with private tracking link.
                  </div>
                </div>
              </button>

              {/* Option 2: Status Update Notification */}
              <button
                type="button"
                onClick={() => setTemplateType('status_update')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  templateType === 'status_update'
                    ? 'bg-cyan-600/15 border-cyan-500/50 ring-1 ring-cyan-500/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <Sparkles className={`h-4 w-4 mt-0.5 flex-shrink-0 ${templateType === 'status_update' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white">2. Status Update Notification</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Alerts candidate to check updated Accepted/Rejected status.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* View Mode Toggle: Edit vs Live Preview */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 pt-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Email Customization
            </span>
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'compose' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit Fields</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {activeTab === 'compose' ? (
            <div className="space-y-4">
              {/* Subject Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject line..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Message Body Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Message Body
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Supports <code className="text-cyan-400 font-mono">&#123;name&#125;</code> placeholder
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter customized email message..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-sans leading-relaxed"
                />
              </div>
            </div>
          ) : (
            /* Live Email Preview */
            <div className="rounded-2xl border border-white/10 bg-[#080d1a] p-5 sm:p-6 space-y-4 shadow-inner">
              <div className="text-xs text-slate-400 border-b border-white/[0.08] pb-3 space-y-1">
                <div>
                  <span className="text-slate-500">From: </span>
                  <span className="text-slate-200">LinkedIn Community Bangladesh &lt;recruitment@linkedincommunitybangladesh.com&gt;</span>
                </div>
                <div>
                  <span className="text-slate-500">Reply-To: </span>
                  <span className="text-slate-200">linkedincommunitybangladesh@gmail.com</span>
                </div>
                <div>
                  <span className="text-slate-500">To: </span>
                  <span className="text-slate-200">{candidate.name} &lt;{candidate.email}&gt;</span>
                </div>
                <div>
                  <span className="text-slate-500">Subject: </span>
                  <strong className="text-white">{subject}</strong>
                </div>
              </div>

              {/* Branded Template Header Preview */}
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                  LinkedIn Community Bangladesh
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {templateType === 'decision_pending'
                    ? 'Interview Completed — Application Under Review'
                    : 'Recruitment Status Update'}
                </h3>
              </div>

              {/* Body Preview */}
              <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p className="font-semibold text-white">Dear {candidate.name},</p>
                {message.split(/\n\s*\n/).map((p, idx) => (
                  <p key={idx}>{p.replace(/{name}/g, candidate.name)}</p>
                ))}
              </div>

              {/* Button Preview */}
              <div className="py-2">
                <div className="inline-block px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-600/30">
                  {templateType === 'decision_pending' ? 'Track Application Status →' : 'View Recruitment Status →'}
                </div>
              </div>

              {/* Link Info */}
              <div className="text-[11px] text-slate-500 border-t border-white/[0.06] pt-3">
                <span>Private candidate URL: </span>
                <span className="text-cyan-400 font-mono break-all">{statusUrl}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-white/[0.08] bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>Sends from recruitment@linkedincommunitybangladesh.com</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {sending ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Official Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
