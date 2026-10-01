'use client';

import { useState } from 'react';
import Link from 'next/link';
import { generateCandidatePortalUrl } from '@/lib/email-templates';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  FileText,
} from 'lucide-react';

export function BulkImporter() {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    imported: number;
    failed: number;
    errors: string[];
    candidates: any[];
  } | null>(null);

  const sampleCsv = `Name,Email,Phone,Position,Department,Status,Notes
Altaf Hossain Raju,altaf.raju@example.com,+880 1711-123456,Campus Lead,Campus Division,UNDER_REVIEW,Strong community background
Zarin Tasnim,zarin.tasnim@example.com,+880 1812-234567,Communication Executive,Marketing & PR,SHORTLISTED,Editorial & copy skills
Fahim Morshed,fahim.morshed@example.com,+880 1913-345678,Event Lead,Operations,APPLICATION_RECEIVED,Experienced in university summits`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lcb-candidates-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text || '');
    };
    reader.readAsText(file);
  };

  const parseCsvToObjects = (text: string) => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      // Split taking commas into account
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push(obj);
    }

    return rows;
  };

  const handleExecuteImport = async () => {
    const rows = parseCsvToObjects(csvText);
    if (rows.length === 0) {
      alert('Please upload a valid CSV file or paste rows below.');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const res = await fetch('/api/admin/candidates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResults(data);
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload & Paste Section */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
              CSV Candidate Importer
            </h2>
            <p className="text-xs text-slate-400">
              Bulk register candidates from Google Forms, spreadsheets, or ATS exports
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadSample}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>

        {/* Upload Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-8 text-center bg-white/[0.01] hover:border-cyan-500/40 transition-colors">
            <Upload className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-sm font-semibold text-white">Choose a CSV File</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Supports .csv formatted files from Excel, Google Sheets, or form responses
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-4 text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Or Paste CSV Data Directly:
            </label>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Name,Email,Phone,Position,Department,Status..."
              className="w-full rounded-2xl border border-white/10 bg-slate-900/90 p-3.5 text-xs font-mono text-slate-200 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Import Action */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            type="button"
            disabled={loading || !csvText.trim()}
            onClick={handleExecuteImport}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Bulk Import...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Execute Bulk Import</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {results && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            Bulk Import Results Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20">
              <span className="text-xs text-emerald-400 font-semibold block">Successfully Imported</span>
              <p className="text-3xl font-bold text-white mt-1">{results.imported}</p>
              <p className="text-xs text-slate-400 mt-1">Unique candidate portal links generated</p>
            </div>

            <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-950/20">
              <span className="text-xs text-rose-400 font-semibold block">Failed / Skipped</span>
              <p className="text-3xl font-bold text-white mt-1">{results.failed}</p>
              <p className="text-xs text-slate-400 mt-1">Rows with invalid or missing required fields</p>
            </div>
          </div>

          {/* Errors list if any */}
          {results.errors.length > 0 && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 space-y-1">
              <span className="text-xs font-bold text-rose-300 block mb-2">Import Errors:</span>
              {results.errors.map((err, i) => (
                <p key={i} className="text-xs text-rose-200">
                  • {err}
                </p>
              ))}
            </div>
          )}

          {/* Generated candidate portals */}
          {results.candidates.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Generated Portals
              </span>
              <div className="space-y-2">
                {results.candidates.map((c) => {
                  const url = generateCandidatePortalUrl(c.secure_token);
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.name}</span>
                        <span className="font-mono text-[11px] text-cyan-300 bg-white/5 px-2 py-0.5 rounded">
                          {c.application_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-400 truncate max-w-xs">{url}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <Link
              href="/admin/candidates"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg"
            >
              <span>View Candidate Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
