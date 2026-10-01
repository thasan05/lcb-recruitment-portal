'use client';

import { useState } from 'react';
import { Candidate } from '@/types';
import { generateEmailTemplates, EmailTemplate } from '@/lib/email-templates';
import { Mail, Copy, Check, X, FileText, Send, Sparkles } from 'lucide-react';

interface EmailModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailModal({ candidate, isOpen, onClose }: EmailModalProps) {
  const templates = generateEmailTemplates(candidate);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    candidate.status === 'INTERVIEW_SCHEDULED'
      ? 'interview_scheduled'
      : candidate.status === 'SHORTLISTED'
      ? 'shortlisted'
      : candidate.status === 'SELECTED'
      ? 'selected'
      : candidate.status === 'NOT_SELECTED'
      ? 'not_selected'
      : 'app_received'
  );

  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const [subject, setSubject] = useState(currentTemplate.subject);
  const [body, setBody] = useState(currentTemplate.body);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // When switching templates
  const handleSelectTemplate = (t: EmailTemplate) => {
    setSelectedTemplateId(t.id);
    setSubject(t.subject);
    setBody(t.body);
  };

  const handleCopySubject = async () => {
    await navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = async () => {
    await navigator.clipboard.writeText(body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleCopyAll = async () => {
    const full = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(full);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950 p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Candidate Email Generator
                <span className="text-xs font-normal text-slate-400">
                  for {candidate.full_name}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Personal portal link and interview parameters are automatically injected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Template Selectors */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select Template
          </label>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedTemplateId === t.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Subject Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Email Subject</label>
              <button
                type="button"
                onClick={handleCopySubject}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                {copiedSubject ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSubject ? 'Copied Subject' : 'Copy Subject'}</span>
              </button>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Body Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Message Body (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopyBody}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                {copiedBody ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedBody ? 'Copied Body' : 'Copy Body'}</span>
              </button>
            </div>
            <textarea
              rows={11}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs sm:text-sm font-mono text-slate-200 focus:border-cyan-400 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Click &apos;Copy Full Email&apos; then paste directly into Gmail, Outlook, or mail client.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              {copiedAll ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedAll ? 'Copied Full Email!' : 'Copy Entire Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
