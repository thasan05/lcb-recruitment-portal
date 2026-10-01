'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Candidate, CandidateStatus, STATUS_CONFIG } from '@/types';
import { StatusBadge } from '@/components/candidate/StatusBadge';
import { EmailModal } from '@/components/admin/EmailModal';
import { ScheduleInterviewModal } from '@/components/admin/ScheduleInterviewModal';
import { CreateCandidateModal } from '@/components/admin/CreateCandidateModal';
import { generateCandidatePortalUrl } from '@/lib/email-templates';
import {
  Search,
  Filter,
  UserPlus,
  Mail,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Download,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Square,
} from 'lucide-react';

interface CandidatesTableProps {
  initialCandidates: Candidate[];
}

export function CandidatesTable({ initialCandidates }: CandidatesTableProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [selectedForEmail, setSelectedForEmail] = useState<Candidate | null>(null);
  const [selectedForInterview, setSelectedForInterview] = useState<Candidate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<CandidateStatus>('SHORTLISTED');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Departments list for filter
  const departments = Array.from(new Set(candidates.map((c) => c.department))).filter(Boolean);

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && c.department !== deptFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.full_name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchAppId = c.application_id.toLowerCase().includes(q);
      const matchPosition = c.position.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchAppId && !matchPosition) return false;
    }
    return true;
  });

  // Copy candidate link helper
  const handleCopyLink = async (candidate: Candidate) => {
    const url = generateCandidatePortalUrl(candidate.secure_token);
    await navigator.clipboard.writeText(url);
    setCopiedId(candidate.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick status update from table
  const handleQuickStatusChange = async (candidateId: string, newStatus: CandidateStatus) => {
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to change status to "${bulkStatus}" for ${selectedIds.length} candidate(s)?`)) {
      return;
    }

    setBulkUpdating(true);
    try {
      const res = await fetch('/api/admin/candidates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status: bulkStatus }),
      });

      if (res.ok) {
        setCandidates((prev) =>
          prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: bulkStatus } : c))
        );
        setSelectedIds([]);
      }
    } catch (err) {
      console.error('Failed bulk update', err);
    } finally {
      setBulkUpdating(false);
    }
  };

  // Delete candidate
  const handleDeleteCandidate = async (candidateId: string, name: string) => {
    if (!confirm(`Archive candidate "${name}"? They will be removed from the active view.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      }
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Application ID',
      'Full Name',
      'Email',
      'Phone',
      'Position',
      'Department',
      'Status',
      'Interview Date',
      'Interview Time',
      'Portal URL',
    ];

    const rows = filteredCandidates.map((c) => [
      `"${c.application_id}"`,
      `"${c.full_name}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.position}"`,
      `"${c.department}"`,
      `"${c.status}"`,
      `"${c.interview?.date || ''}"`,
      `"${c.interview?.time || ''}"`,
      `"${generateCandidatePortalUrl(c.secure_token)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lcb-candidates-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters, New Candidate, Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates, email, position, or ID..."
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Statuses ({candidates.length})</option>
            {Object.entries(STATUS_CONFIG).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Download candidates as CSV"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* New Candidate */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Candidate</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/40 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedIds.length} candidate(s) selected</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Change Status To:</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as CandidateStatus)}
              className="rounded-xl border border-cyan-500/40 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
            >
              {Object.entries(STATUS_CONFIG).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={bulkUpdating}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-1.5 text-xs font-bold transition-all disabled:opacity-50"
            >
              {bulkUpdating ? 'Updating...' : 'Apply Update'}
            </button>
          </div>
        </div>
      )}

      {/* Candidates Table */}
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/70 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="p-4 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-white"
                  >
                    {selectedIds.length === filteredCandidates.length && filteredCandidates.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Candidate
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Application ID
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Role & Department
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Interview
                </th>
                <th scope="col" className="px-4 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <p className="text-sm font-semibold">No candidates found</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Try adjusting your search query or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isCopied = copiedId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors hover:bg-white/[0.03] ${
                        isSelected ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleSelectOne(c.id)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-cyan-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Candidate Name & Contact */}
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/candidates/${c.id}`}
                          className="font-bold text-white hover:text-cyan-300 transition-colors block"
                        >
                          {c.full_name}
                        </Link>
                        <div className="text-xs text-slate-400">{c.email}</div>
                        <div className="text-[11px] text-slate-500">{c.phone}</div>
                      </td>

                      {/* Application ID */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-300 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                          {c.application_id}
                        </span>
                      </td>

                      {/* Role & Dept */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-200 text-xs">{c.position}</div>
                        <div className="text-[11px] text-slate-500">{c.department}</div>
                      </td>

                      {/* Interactive Status Dropdown */}
                      <td className="px-4 py-4">
                        <select
                          value={c.status}
                          onChange={(e) =>
                            handleQuickStatusChange(c.id, e.target.value as CandidateStatus)
                          }
                          className="rounded-xl border border-white/10 bg-slate-900 py-1 px-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Interview Info */}
                      <td className="px-4 py-4 text-xs">
                        {c.interview ? (
                          <div>
                            <span className="text-amber-300 font-semibold block">
                              {c.interview.date} · {c.interview.time}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {c.interview.meeting_platform}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedForInterview(c)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Schedule</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(c)}
                            title="Copy Candidate Portal Link"
                            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Email Template */}
                          <button
                            onClick={() => setSelectedForEmail(c)}
                            title="Generate Candidate Email"
                            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>

                          {/* Schedule Interview */}
                          <button
                            onClick={() => setSelectedForInterview(c)}
                            title="Manage Interview"
                            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>

                          {/* Candidate Detail Page */}
                          <Link
                            href={`/admin/candidates/${c.id}`}
                            title="Full Candidate Details"
                            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-blue-600 hover:text-white text-slate-300 transition-colors"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>

                          {/* Archive / Delete */}
                          <button
                            onClick={() => handleDeleteCandidate(c.id, c.full_name)}
                            title="Archive Candidate"
                            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedForEmail && (
        <EmailModal
          candidate={selectedForEmail}
          isOpen={Boolean(selectedForEmail)}
          onClose={() => setSelectedForEmail(null)}
        />
      )}

      {selectedForInterview && (
        <ScheduleInterviewModal
          candidate={selectedForInterview}
          isOpen={Boolean(selectedForInterview)}
          onClose={() => setSelectedForInterview(null)}
          onInterviewScheduled={(interview) => {
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === selectedForInterview.id
                  ? { ...c, interview, status: 'INTERVIEW_SCHEDULED' }
                  : c
              )
            );
          }}
        />
      )}

      <CreateCandidateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCandidateCreated={(newCand) => {
          setCandidates((prev) => [newCand, ...prev]);
        }}
      />
    </div>
  );
}
