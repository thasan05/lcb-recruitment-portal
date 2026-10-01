'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export function QuickTracker() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter your Application ID or secure token.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // If it looks like a token directly
      if (trimmed.startsWith('tok_lcb_') || trimmed.length > 20) {
        router.push(`/candidate/${trimmed}`);
        return;
      }

      // If it looks like an application ID e.g. LCB-2026-0001
      // Check our API for token lookup
      const res = await fetch(`/api/candidate/lookup?id=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (res.ok && data.token) {
        router.push(`/candidate/${data.token}`);
      } else {
        // Try direct lookup with query in case it's a direct token
        router.push(`/candidate/${trimmed}`);
      }
    } catch {
      router.push(`/candidate/${trimmed}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleTrack} className="w-full">
      <div className="relative flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-white/15 bg-slate-900/80 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-500/20">
        <div className="flex flex-1 items-center gap-3 pl-3 w-full">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter Application ID or Access Token (e.g. LCB-2026-0001)"
            className="w-full bg-transparent py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Track Application</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
