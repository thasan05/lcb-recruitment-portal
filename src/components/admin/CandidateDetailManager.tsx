'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Candidate, CandidateStatus, STATUS_CONFIG, Interview } from '@/types';
import { StatusBadge } from '@/components/candidate/StatusBadge';
import { EmailModal } from '@/components/admin/EmailModal';
import { ScheduleInterviewModal } from '@/components/admin/ScheduleInterviewModal';
import { generateCandidatePortalUrl } from '@/lib/email-templates';
import {
  Copy,
  Check,
  ExternalLink,
  Mail,
  Calendar,
  Lock,
  Bell,
  History,
  FileText,
  UserCheck,
  Building,
  Briefcase,
  Phone,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface CandidateDetailManagerProps {
  initialCandidate: Candidate;
}

export function CandidateDetailManager({ initialCandidate }: CandidateDetailManagerProps) {
  const [candidate, setCandidate] = useState<Candidate>(initialCandidate);
  const [isCopied, setIsCopied] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  // Status updating
  const [statusLoading, setStatusLoading] = useState(false);

  // Candidate updates form
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Internal notes form
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('LCB HR Recruiter');
  const [noteLoading, setNoteLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'interview' | 'updates' | 'notes' | 'activity'>('overview');

  const portalUrl = generateCandidatePortalUrl(candidate.secure_token);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(portalUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setCandidate((prev) => ({
          ...prev,
          status: newStatus,
          activity_logs: data.candidate.activity_logs || prev.activity_logs,
          updates: data.candidate.updates || prev.updates,
        }));
      }
    } catch (err) {
      console.error('Failed to change status', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle.trim() || !updateMessage.trim()) return;

    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updateTitle.trim(),
          message: updateMessage.trim(),
          is_candidate_visible: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCandidate((prev) => ({
          ...prev,
          updates: [data.update, ...(prev.updates || [])],
        }));
        setUpdateTitle('');
        setUpdateMessage('');
      }
    } catch (err) {
      console.error('Failed to publish update', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setNoteLoading(true);
    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent.trim(),
          author: noteAuthor.trim() || 'LCB HR Team',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCandidate((prev) => ({
          ...prev,
          notes: [data.note, ...(prev.notes || [])],
        }));
        setNoteContent('');
      }
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setNoteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner with Candidate Info & Key Actions */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">
                {candidate.application_id}
              </span>
              <span className="text-xs text-slate-400">{candidate.campaign}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {candidate.full_name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="font-medium text-white">{candidate.position}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{candidate.department}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{candidate.email}</span>
            </div>
          </div>

          {/* Status Changer & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Status Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={candidate.status}
                disabled={statusLoading}
                onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
                className="rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
              >
                {Object.entries(STATUS_CONFIG).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              title="Copy Candidate Portal Link"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{isCopied ? 'Link Copied!' : 'Copy Portal Link'}</span>
            </button>

            {/* Open Portal */}
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>View Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            </a>

            {/* Email Generator */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Generate Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Candidate Profile', icon: FileText },
          { key: 'interview', label: 'Interview Management', icon: Calendar },
          { key: 'updates', label: 'Candidate Announcements', icon: Bell },
          { key: 'notes', label: 'Internal HR Notes (Private)', icon: Lock },
          { key: 'activity', label: 'Activity Audit Log', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Candidate Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight border-b border-white/10 pb-3">
              Application Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Position</span>
                <span className="font-semibold text-white">{candidate.position}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-white">{candidate.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Campaign</span>
                <span className="font-semibold text-white">{candidate.campaign}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Application Date</span>
                <span className="font-semibold text-white">
                  {new Date(candidate.application_date).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Last Modified</span>
                <span className="font-semibold text-white">
                  {new Date(candidate.last_updated).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight border-b border-white/10 pb-3">
              Candidate Contact & Access
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Full Name</span>
                <span className="font-semibold text-white">{candidate.full_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Email Address</span>
                <a href={`mailto:${candidate.email}`} className="font-semibold text-cyan-400 hover:underline">
                  {candidate.email}
                </a>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Phone Number</span>
                <a href={`tel:${candidate.phone}`} className="font-semibold text-white hover:underline">
                  {candidate.phone}
                </a>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Secure Access Token</span>
                <span className="font-mono text-cyan-300 truncate max-w-[200px]">
                  {candidate.secure_token}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interview Management */}
      {activeTab === 'interview' && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Interview Scheduling</h3>
              <p className="text-xs text-slate-400">
                Candidate will immediately see meeting links and calendar options on their portal
              </p>
            </div>

            <button
              onClick={() => setIsInterviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all"
            >
              <Calendar className="h-4 w-4" />
              <span>{candidate.interview ? 'Reschedule Interview' : 'Schedule Interview'}</span>
            </button>
          </div>

          {candidate.interview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-xs text-slate-400 block mb-1">Date & Time (BST)</span>
                <p className="text-base font-bold text-white">
                  {candidate.interview.date} · {candidate.interview.time}
                </p>
                <p className="text-[11px] text-slate-500">{candidate.interview.timezone}</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-xs text-slate-400 block mb-1">Platform</span>
                <p className="text-base font-bold text-white">{candidate.interview.meeting_platform}</p>
                <p className="text-[11px] text-slate-500">{candidate.interview.duration} minutes slot</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-xs text-slate-400 block mb-1">Interviewer Panel</span>
                <p className="text-sm font-bold text-white">{candidate.interview.interviewer}</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-xs text-slate-400 block mb-1">Meeting Link</span>
                {candidate.interview.meeting_link ? (
                  <a
                    href={candidate.interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline font-mono truncate block"
                  >
                    {candidate.interview.meeting_link}
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">Not provided</span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No interview scheduled yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Click &apos;Schedule Interview&apos; above to set up a slot and send meeting details.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Candidate Announcements (Public to Candidate) */}
      {activeTab === 'updates' && (
        <div className="space-y-6">
          {/* Create Announcement Form */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
            <h3 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-400" />
              Publish Candidate-Visible Announcement
            </h3>

            <form onSubmit={handlePublishUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="e.g. Portfolio Evaluation Review Passed"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Announcement Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Explain next steps or official message that the candidate should see on their status page..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all disabled:opacity-50"
                >
                  {updateLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Publish to Candidate</span>
                </button>
              </div>
            </form>
          </div>

          {/* Past Announcements */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Published Announcements</h3>
            {(candidate.updates || []).length === 0 ? (
              <p className="text-xs text-slate-500">No candidate announcements published yet.</p>
            ) : (
              <div className="space-y-3">
                {(candidate.updates || []).map((u) => (
                  <div key={u.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{u.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(u.date).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">{u.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Internal HR Notes (NEVER visible to candidate) */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-rose-500/20 bg-slate-950/70 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-rose-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Private Internal HR Notes
              </h3>
              <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                Candidate Cannot View
              </span>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <textarea
                  rows={3}
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record confidential interviewer feedback, red flags, scoring, compensation notes, or background checks..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Author:</span>
                  <input
                    type="text"
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={noteLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2 text-xs font-semibold text-white shadow-lg transition-all disabled:opacity-50"
                >
                  {noteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>Save Confidential Note</span>
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Confidential Notes History</h3>
            {(candidate.notes || []).length === 0 ? (
              <p className="text-xs text-slate-500">No confidential notes added yet.</p>
            ) : (
              <div className="space-y-3">
                {(candidate.notes || []).map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300">{n.author}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Activity / Audit History Log */}
      {activeTab === 'activity' && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl">
          <h3 className="text-base font-bold text-white tracking-tight mb-6 flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-400" />
            Audit & Activity Trail
          </h3>

          {(candidate.activity_logs || []).length === 0 ? (
            <p className="text-xs text-slate-500">No activity recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
              {(candidate.activity_logs || []).map((log) => (
                <div key={log.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-cyan-400 ring-4 ring-slate-950" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white">{log.details}</span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">By: {log.performed_by}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <EmailModal
        candidate={candidate}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      <ScheduleInterviewModal
        candidate={candidate}
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        onInterviewScheduled={(interview) => {
          setCandidate((prev) => ({
            ...prev,
            interview,
            status: 'INTERVIEW_SCHEDULED',
          }));
        }}
      />
    </div>
  );
}
