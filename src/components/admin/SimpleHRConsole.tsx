'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Candidate, CandidateStatus, STATUS_CONFIG } from '@/types';
import {
  Upload,
  Send,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Sparkles,
  Clock,
  KeyRound,
  Trash2,
  UserPlus,
  Pencil,
} from 'lucide-react';
import { LCBLogo } from '@/components/LCBLogo';
import { EmailComposeModal } from '@/components/admin/EmailComposeModal';
import { CandidateFormModal } from '@/components/admin/CandidateFormModal';
import { DeleteCandidateModal } from '@/components/admin/DeleteCandidateModal';
import { BatchEmailModal } from '@/components/admin/BatchEmailModal';
import { formatLastUpdated } from '@/lib/date-format';

export function SimpleHRConsole() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email modal state
  const [selectedCandidateForEmail, setSelectedCandidateForEmail] = useState<Candidate | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [lastEmailToast, setLastEmailToast] = useState<string | null>(null);

  // Candidate Add / Edit modal state
  const [candidateFormOpen, setCandidateFormOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Single candidate delete modal state
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);

  // Batch Email modal state
  const [batchEmailModalOpen, setBatchEmailModalOpen] = useState(false);

  // Reset candidate database state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleOpenAddCandidate = () => {
    setEditingCandidate(null);
    setCandidateFormOpen(true);
  };

  const handleOpenEditCandidate = (cand: Candidate) => {
    setEditingCandidate(cand);
    setCandidateFormOpen(true);
  };

  const handleCandidateSaved = (saved: Candidate, isNew: boolean) => {
    if (isNew) {
      setCandidates((prev) => [saved, ...prev]);
      setLastEmailToast(`✅ Successfully added candidate "${saved.name}".`);
    } else {
      setCandidates((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      setLastEmailToast(`✅ Successfully updated details for "${saved.name}".`);
    }
    setTimeout(() => setLastEmailToast(null), 5000);
  };

  const handleCandidateDeleted = (id: string) => {
    const deleted = candidates.find((c) => c.id === id);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    if (deleted) {
      setLastEmailToast(`🗑️ Removed candidate "${deleted.name}".`);
      setTimeout(() => setLastEmailToast(null), 5000);
    }
  };

  const handleBatchCandidateUpdated = (updatedId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === updatedId
          ? {
              ...c,
              email_sent: true,
              email_sent_at: new Date().toISOString(),
            }
          : c
      )
    );
  };

  // Clear / Reset candidate database
  const handleResetList = async () => {
    try {
      setResetting(true);
      const res = await fetch('/api/admin/candidates', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setCandidates([]);
        setShowResetConfirm(false);
        setImportMessage(null);
        setLastEmailToast('Candidate database successfully reset. You can now import a fresh candidate batch.');
        setTimeout(() => setLastEmailToast(null), 5000);
      } else {
        alert(data.error || 'Failed to reset candidate database.');
      }
    } catch (err: any) {
      alert('Failed to reset candidate list: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  // Fetch candidates from API
  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/candidates${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (data.candidates) {
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [search]);

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  // Intelligent column & multi-sheet detection for Excel / CSV (supports Google Sheets Username, Full Name :, etc.)
  const parseSpreadsheetFile = async (file: File) => {
    setImporting(true);
    setImportMessage(null);

    try {
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setImportMessage({ type: 'error', text: 'The uploaded file contains no sheets or readable data.' });
        setImporting(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanHeaderStr = (val: any) =>
        String(val ?? '')
          .trim()
          .toLowerCase()
          .replace(/[:_\-–—*?#$|()[\]{}]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      const isEmailHeader = (h: string) => {
        return (
          h === 'username' ||
          h === 'user name' ||
          h === 'user' ||
          h === 'userid' ||
          h === 'user id' ||
          h.includes('email') ||
          h.includes('mail') ||
          h.includes('gmail') ||
          h.startsWith('user') ||
          h.endsWith('username')
        );
      };

      const isNameHeader = (h: string) => {
        // Exclude headers that represent organizations, universities, departments, parents, etc.
        if (
          h.includes('university') ||
          h.includes('dept') ||
          h.includes('department') ||
          h.includes('institute') ||
          h.includes('college') ||
          h.includes('school') ||
          h.includes('company') ||
          h.includes('father') ||
          h.includes('mother')
        ) {
          return false;
        }
        return (
          h === 'full name' ||
          h === 'fullname' ||
          h === 'name' ||
          h === 'candidate name' ||
          h === 'candidate' ||
          h === 'applicant name' ||
          h === 'applicant' ||
          h === 'participant name' ||
          h === 'participant' ||
          h === 'student name' ||
          h === 'student' ||
          h.startsWith('name') ||
          h.endsWith('name')
        );
      };

      interface SheetCandidateParseResult {
        sheetName: string;
        candidates: { name: string; email: string }[];
        detectedEmailHeader: string;
        detectedNameHeader: string;
        totalRawRows: number;
      }

      const sheetResults: SheetCandidateParseResult[] = [];

      // Scan each sheet in the workbook to handle multi-tab Google Sheets or Excel files
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        // Convert to 2D array of rows
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          blankrows: false,
          defval: '',
        });

        if (!rawGrid || rawGrid.length === 0) continue;

        // 1. Attempt to find the header row among the first 15 rows
        let headerRowIdx = -1;
        let emailColIdx = -1;
        let nameColIdx = -1;
        let detectedEmailTitle = '';
        let detectedNameTitle = '';

        const maxHeaderSearchRows = Math.min(rawGrid.length, 15);
        for (let r = 0; r < maxHeaderSearchRows; r++) {
          const row = rawGrid[r];
          if (!Array.isArray(row)) continue;

          let foundEmailCol = -1;
          let foundNameCol = -1;
          let tempEmailTitle = '';
          let tempNameTitle = '';

          for (let c = 0; c < row.length; c++) {
            const rawCell = String(row[c] ?? '').trim();
            const clean = cleanHeaderStr(rawCell);
            if (!clean) continue;

            if (foundEmailCol === -1 && isEmailHeader(clean)) {
              foundEmailCol = c;
              tempEmailTitle = rawCell;
            } else if (foundNameCol === -1 && isNameHeader(clean)) {
              foundNameCol = c;
              tempNameTitle = rawCell;
            }
          }

          // If this row contains both or at least the email header
          if (foundEmailCol !== -1 && foundNameCol !== -1) {
            headerRowIdx = r;
            emailColIdx = foundEmailCol;
            nameColIdx = foundNameCol;
            detectedEmailTitle = tempEmailTitle;
            detectedNameTitle = tempNameTitle;
            break;
          } else if (foundEmailCol !== -1 && headerRowIdx === -1) {
            // Found email column, keep searching for name or save as fallback
            headerRowIdx = r;
            emailColIdx = foundEmailCol;
            detectedEmailTitle = tempEmailTitle;
          }
        }

        // 2. If email column or name column was not found from headers, try value-based heuristic
        if (emailColIdx === -1 || nameColIdx === -1) {
          const sampleRows = rawGrid.slice(Math.max(0, headerRowIdx + 1), Math.max(0, headerRowIdx + 1) + 25);
          const maxCols = Math.max(...sampleRows.map((row) => (Array.isArray(row) ? row.length : 0)), 0);

          // Find column with the most valid emails
          if (emailColIdx === -1 && maxCols > 0) {
            let bestEmailCol = -1;
            let bestEmailCount = 0;

            for (let c = 0; c < maxCols; c++) {
              let emailCount = 0;
              for (const row of sampleRows) {
                if (!Array.isArray(row)) continue;
                const cellVal = String(row[c] ?? '').trim();
                if (emailRegex.test(cellVal)) {
                  emailCount++;
                }
              }
              if (emailCount > bestEmailCount) {
                bestEmailCount = emailCount;
                bestEmailCol = c;
              }
            }

            if (bestEmailCol !== -1 && bestEmailCount > 0) {
              emailColIdx = bestEmailCol;
              detectedEmailTitle = `Column ${String.fromCharCode(65 + (bestEmailCol % 26))} (Auto-detected Emails)`;
            }
          }

          // Find column with plausible names if not found yet
          if (nameColIdx === -1 && maxCols > 0) {
            let bestNameCol = -1;
            let bestNameScore = 0;

            for (let c = 0; c < maxCols; c++) {
              if (c === emailColIdx) continue;
              let nameScore = 0;
              for (const row of sampleRows) {
                if (!Array.isArray(row)) continue;
                const cellVal = String(row[c] ?? '').trim();
                // Check if looks like a person's name (letters, spaces, dots, length between 2 and 60, not pure digits or phone)
                const isNumeric = /^[0-9+\-\s()]+$/.test(cellVal);
                const isUrl = cellVal.startsWith('http') || cellVal.includes('www.');
                if (cellVal.length >= 2 && cellVal.length <= 60 && !isNumeric && !isUrl && /[a-zA-Z]/.test(cellVal)) {
                  nameScore++;
                }
              }
              if (nameScore > bestNameScore) {
                bestNameScore = nameScore;
                bestNameCol = c;
              }
            }

            if (bestNameCol !== -1 && bestNameScore > 0) {
              nameColIdx = bestNameCol;
              detectedNameTitle = `Column ${String.fromCharCode(65 + (bestNameCol % 26))} (Auto-detected Names)`;
            }
          }
        }

        // If we still couldn't detect email column in this sheet, skip it
        if (emailColIdx === -1) continue;

        // Parse candidate rows
        const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
        const validCandidates: { name: string; email: string }[] = [];
        const seenEmails = new Set<string>();

        for (let r = startRow; r < rawGrid.length; r++) {
          const row = rawGrid[r];
          if (!Array.isArray(row)) continue;

          const rawEmail = String(row[emailColIdx] ?? '').trim().toLowerCase();
          if (!rawEmail || !emailRegex.test(rawEmail)) continue;

          let rawName = nameColIdx !== -1 ? String(row[nameColIdx] ?? '').trim() : '';
          // Clean up name
          rawName = rawName.replace(/[:_\-*]/g, ' ').replace(/\s+/g, ' ').trim();

          // Fallback name if missing but valid email
          if (!rawName) {
            const prefix = rawEmail.split('@')[0].replace(/[._-]/g, ' ');
            rawName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
          }

          if (seenEmails.has(rawEmail)) continue;
          seenEmails.add(rawEmail);

          validCandidates.push({
            name: rawName,
            email: rawEmail,
          });
        }

        if (validCandidates.length > 0) {
          sheetResults.push({
            sheetName,
            candidates: validCandidates,
            detectedEmailHeader: detectedEmailTitle || 'Email',
            detectedNameHeader: detectedNameTitle || 'Name',
            totalRawRows: rawGrid.length,
          });
        }
      }

      // Find the best sheet with the highest number of valid candidates
      if (sheetResults.length === 0) {
        setImportMessage({
          type: 'error',
          text: `Could not identify candidate data in the uploaded file. Scanned sheet(s): [${workbook.SheetNames.join(', ')}]. Please ensure your file has valid email addresses and candidate names (e.g. columns 'Username' or 'Email', and 'Full Name').`,
        });
        setImporting(false);
        return;
      }

      // Pick sheet with maximum valid candidate rows
      sheetResults.sort((a, b) => b.candidates.length - a.candidates.length);
      const best = sheetResults[0];

      // Send to server import API
      const res = await fetch('/api/admin/candidates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: best.candidates }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setImportMessage({ type: 'error', text: resData.error || 'Import failed on server.' });
      } else {
        setImportMessage({
          type: 'success',
          text: `Success: Imported ${best.candidates.length} candidate(s) from sheet "${best.sheetName}" (${resData.result.inserted} newly added, ${resData.result.updated} updated). All new candidates default to 'Decision Pending'. [Columns used: ${best.detectedEmailHeader} & ${best.detectedNameHeader}]`,
        });
        loadCandidates();
      }
    } catch (err: any) {
      setImportMessage({ type: 'error', text: `Failed to process spreadsheet: ${err.message}` });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Change Status immediately
  const handleStatusChange = async (id: string, newStatus: CandidateStatus) => {
    const nowIso = new Date().toISOString();
    // Optimistic UI update with current save timestamp
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus, updated_at: nowIso } : c))
    );

    try {
      const res = await fetch(`/api/admin/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Failed to update status: ${errorData.error || 'Server error'}`);
        loadCandidates();
      } else {
        const data = await res.json();
        if (data.candidate) {
          setCandidates((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...data.candidate } : c))
          );
        }
        // Find updated candidate
        const updatedCandidate = candidates.find((c) => c.id === id);
        if (updatedCandidate) {
          // Notify HR that they can now send the status update email
          setLastEmailToast(
            `Status updated to "${STATUS_CONFIG[newStatus].label}" for ${updatedCandidate.name}. You can now send the Status Update email.`
          );
          setTimeout(() => setLastEmailToast(null), 6000);
        }
      }
    } catch (err) {
      alert('Network error while updating status');
      loadCandidates();
    }
  };

  // Open compose modal for a candidate
  const handleOpenEmailModal = (candidate: Candidate) => {
    setSelectedCandidateForEmail(candidate);
    setEmailModalOpen(true);
  };

  // Callback when email is successfully sent
  const handleEmailSent = (candidateId: string, isSimulated: boolean) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              email_sent: true,
              email_sent_at: new Date().toISOString(),
            }
          : c
      )
    );

    const cand = candidates.find((c) => c.id === candidateId);
    if (cand) {
      setLastEmailToast(
        isSimulated
          ? `[Dev Mode] Email simulated for ${cand.name} (${cand.email}). Token link logged to console.`
          : `✅ Official recruitment email dispatched to ${cand.name}! (Replies to: linkedincommunitybangladesh@gmail.com)`
      );
      setTimeout(() => setLastEmailToast(null), 6000);
    }
  };

  // Helper to ensure clean shortened 24-character token
  const getCleanToken = (token: string, id: string) => {
    const raw = (token || '').trim().toLowerCase();
    if (/^[a-f0-9]{24}$/.test(raw)) return raw;
    if (/^[a-f0-9]{25,}$/.test(raw)) return raw.slice(0, 24);
    return (token || '').replace(/^tok_.*_/, '').slice(0, 24);
  };

  // Copy private URL helper
  const handleCopyLink = (token: string, id: string) => {
    const origin = window.location.origin;
    const cleanToken = getCleanToken(token, id);
    const url = `${origin}/status/${cleanToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#040614] text-white selection:bg-blue-600 selection:text-white relative">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#040614]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LCBLogo variant="icon" href="/admin" />
            <div className="border-l border-white/10 pl-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                LCB HR Portal
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Recruitment Status Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <Mail className="h-3.5 w-3.5 text-cyan-400" />
              <span>linkedincommunitybangladesh@gmail.com</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Toast / Notification Banner */}
        {lastEmailToast && (
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-cyan-950/50 animate-fade-in-up">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <span>{lastEmailToast}</span>
            </div>
            <button
              onClick={() => setLastEmailToast(null)}
              className="text-xs text-cyan-400 hover:text-white ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload Excel / CSV Section */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
                Upload Candidates
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Supported formats: <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong>. Automatically detects Google Sheets columns (<strong>Username</strong>, <strong>Full Name :</strong>, multi-tab sheets, etc.).
              </p>
            </div>

            <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm cursor-pointer shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Upload className="h-4 w-4" />
              <span>{importing ? 'Processing File...' : 'Upload Excel / CSV'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                disabled={importing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) parseSpreadsheetFile(file);
                }}
              />
            </label>
          </div>

          {importMessage && (
            <div
              className={`mt-4 p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 border ${
                importMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {importMessage.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
              )}
              <div className="flex-1">{importMessage.text}</div>
            </div>
          )}
        </section>

        {/* Candidate List Table Section */}
        <section className="glass-panel rounded-3xl border border-white/10 shadow-xl overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 sm:p-6 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Imported Candidates
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 border border-blue-500/25 text-cyan-300">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  <span>30-Day Auto-Expiry Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'} enrolled &bull;{' '}
                <span className="text-cyan-400 font-medium">
                  {candidates.filter((c) => !c.email_sent).length} unsent
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="relative max-w-xs w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Manually Add Candidate */}
              <button
                type="button"
                onClick={handleOpenAddCandidate}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]"
                title="Manually add a single candidate"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Candidate</span>
              </button>

              {/* Send All Emails in Batch */}
              <button
                type="button"
                disabled={candidates.length === 0}
                onClick={() => setBatchEmailModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
                title="Dispatch recruitment emails to all candidates automatically"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send All Emails</span>
                {candidates.filter((c) => !c.email_sent).length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
                    {candidates.filter((c) => !c.email_sent).length}
                  </span>
                )}
              </button>

              {/* Reset List */}
              <button
                type="button"
                disabled={candidates.length === 0 || resetting}
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Reset candidate list to start a fresh batch"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Reset List</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-white/[0.08] bg-slate-900/40 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Candidate Name</th>
                  <th className="py-3.5 px-4 sm:px-6">Email</th>
                  <th className="py-3.5 px-4 sm:px-6">Status / Decision</th>
                  <th className="py-3.5 px-4 sm:px-6">Email Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Email Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Loading candidates...
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No candidates found. Upload an Excel or CSV file to get started.
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate) => {
                    const meta = STATUS_CONFIG[candidate.status] || STATUS_CONFIG.decision_pending;
                    const isPending = candidate.status === 'decision_pending';
                    const hasUpdatedDecision = candidate.status === 'accepted' || candidate.status === 'rejected';

                    return (
                      <tr
                        key={candidate.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Name + Link Actions */}
                        <td className="py-4 px-4 sm:px-6 font-medium text-white">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white mr-1">{candidate.name}</span>
                            <button
                              onClick={() => handleCopyLink(candidate.secure_token, candidate.id)}
                              title="Copy candidate's private tracking link"
                              className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-colors"
                            >
                              {copiedId === candidate.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <a
                              href={`/status/${getCleanToken(candidate.secure_token, candidate.id)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Preview candidate status page"
                              className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleOpenEditCandidate(candidate)}
                              title="Edit candidate name, email, or status"
                              className="p-1 rounded text-slate-500 hover:text-blue-400 hover:bg-white/[0.04] transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCandidate(candidate)}
                              title="Delete candidate from database"
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/[0.04] transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 sm:px-6 text-slate-300 font-mono text-xs">
                          {candidate.email}
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-4 px-4 sm:px-6">
                          <select
                            value={candidate.status}
                            onChange={(e) =>
                              handleStatusChange(candidate.id, e.target.value as CandidateStatus)
                            }
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors cursor-pointer ${meta.badgeClass}`}
                          >
                            <option value="decision_pending" className="bg-slate-900 text-amber-300">
                              Decision Pending
                            </option>
                            <option value="accepted" className="bg-slate-900 text-emerald-300">
                              Accepted
                            </option>
                            <option value="rejected" className="bg-slate-900 text-rose-300">
                              Rejected
                            </option>
                          </select>
                          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate">Updated {formatLastUpdated(candidate.updated_at)}</span>
                          </div>
                        </td>

                        {/* Email Status */}
                        <td className="py-4 px-4 sm:px-6">
                          {candidate.email_sent ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>
                                Sent
                                {candidate.email_sent_at && (
                                  <span className="text-slate-500 text-[11px] ml-1">
                                    ({new Date(candidate.email_sent_at).toLocaleDateString([], {
                                      month: 'short',
                                      day: 'numeric',
                                    })})
                                  </span>
                                )}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                              <span>Not Sent</span>
                            </span>
                          )}
                        </td>

                        {/* Email Action Buttons */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => handleOpenEmailModal(candidate)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              hasUpdatedDecision
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-blue-600/30 ring-1 ring-cyan-400/40'
                                : candidate.email_sent
                                ? 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                            }`}
                          >
                            {hasUpdatedDecision ? (
                              <>
                                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                                <span>Send Status Update</span>
                              </>
                            ) : candidate.email_sent ? (
                              <>
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span>Resend Pending Mail</span>
                              </>
                            ) : (
                              <>
                                <Mail className="h-3.5 w-3.5" />
                                <span>Send 'Pending' Mail</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Email Compose & Template Customization Modal */}
      {emailModalOpen && selectedCandidateForEmail && (
        <EmailComposeModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          candidate={selectedCandidateForEmail}
          onEmailSent={handleEmailSent}
        />
      )}

      {/* Reset Candidate Database Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-rose-500/30 p-6 sm:p-8 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Reset Candidate List?
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              This will permanently delete all <strong>{candidates.length}</strong> candidate record(s) from the portal and invalidate their private tracking links.
            </p>

            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
              <strong>Notice:</strong> This clears the database completely so you can upload a fresh Excel/CSV batch for a new recruitment cohort.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleResetList}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md shadow-rose-600/30"
              >
                {resetting ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Yes, Reset Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Add / Edit Form Modal */}
      {candidateFormOpen && (
        <CandidateFormModal
          isOpen={candidateFormOpen}
          onClose={() => setCandidateFormOpen(false)}
          candidate={editingCandidate}
          onSaved={handleCandidateSaved}
        />
      )}

      {/* Delete Single Candidate Modal */}
      {deletingCandidate && (
        <DeleteCandidateModal
          isOpen={Boolean(deletingCandidate)}
          onClose={() => setDeletingCandidate(null)}
          candidate={deletingCandidate}
          onDeleted={handleCandidateDeleted}
        />
      )}

      {/* Batch Email Dispatch Modal */}
      {batchEmailModalOpen && (
        <BatchEmailModal
          isOpen={batchEmailModalOpen}
          onClose={() => setBatchEmailModalOpen(false)}
          candidates={candidates}
          onCandidateUpdated={handleBatchCandidateUpdated}
        />
      )}
    </div>
  );
}
