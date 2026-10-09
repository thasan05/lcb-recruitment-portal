'use client';

import React, { useState } from 'react';
import { Candidate } from '@/types';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onDeleted: (candidateId: string) => void;
}

export function DeleteCandidateModal({
  isOpen,
  onClose,
  candidate,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !candidate) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete candidate');
      }

      onDeleted(candidate.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-rose-500/30 p-6 sm:p-8 shadow-2xl relative">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
          <Trash2 className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-white tracking-tight">
          Delete Candidate Record?
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Are you sure you want to remove <strong>{candidate.name}</strong> ({candidate.email})?
        </p>

        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
          <strong>Notice:</strong> This candidate's private recruitment tracking link will be permanently revoked immediately.
        </p>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md shadow-rose-600/30"
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Candidate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
