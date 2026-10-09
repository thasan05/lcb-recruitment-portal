'use client';

import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStatus, STATUS_CONFIG } from '@/types';
import {
  UserPlus,
  Edit3,
  X,
  Mail,
  User,
  Clock,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate | null; // null or undefined means creating new
  onSaved: (savedCandidate: Candidate, isNew: boolean) => void;
}

export function CandidateFormModal({
  isOpen,
  onClose,
  candidate,
  onSaved,
}: Props) {
  const isEditing = Boolean(candidate);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<CandidateStatus>('decision_pending');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (candidate) {
        setName(candidate.name);
        setEmail(candidate.email);
        setStatus(candidate.status);
      } else {
        setName('');
        setEmail('');
        setStatus('decision_pending');
      }
      setError(null);
      setCopied(false);
    }
  }, [isOpen, candidate]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!candidate) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanToken = (candidate.secure_token || '').slice(0, 24);
    navigator.clipboard.writeText(`${origin}/status/${cleanToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter the candidate full name.');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSaving(true);

    try {
      if (isEditing && candidate) {
        // Update existing candidate
        const res = await fetch(`/api/admin/candidates/${candidate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            status,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update candidate');
        }

        onSaved(data.candidate, false);
        onClose();
      } else {
        // Create new candidate
        const res = await fetch('/api/admin/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            status,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create candidate');
        }

        onSaved(data.candidate, true);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                isEditing
                  ? 'bg-blue-600/30 border border-blue-500/40 text-blue-400'
                  : 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-400'
              }`}
            >
              {isEditing ? <Edit3 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isEditing ? 'Edit Candidate Details' : 'Add New Candidate'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update candidate information and recruitment decision.'
                  : 'Manually add a candidate to the recruitment portal database.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="e.g. Tanvir Hasan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="e.g. tanvir@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Application Decision Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CandidateStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              <option value="decision_pending" className="bg-slate-900 text-amber-300">
                Decision Pending (Under Consideration)
              </option>
              <option value="accepted" className="bg-slate-900 text-emerald-300">
                Accepted (Selected)
              </option>
              <option value="rejected" className="bg-slate-900 text-rose-300">
                Rejected (Not Selected)
              </option>
            </select>
          </div>

          {/* Token link preview (if editing) */}
          {isEditing && candidate && (
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Private Tracking URL:</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-300 truncate">
                /status/{(candidate.secure_token || '').slice(0, 24)}
              </div>
            </div>
          )}

          {!isEditing && (
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300/80">
              💡 A secure shortened 24-character hex link will be generated automatically for this candidate.
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-600/30"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Candidate'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
