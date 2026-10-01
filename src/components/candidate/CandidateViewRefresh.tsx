'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

interface CandidateViewRefreshProps {
  token: string;
}

export function CandidateViewRefresh({ token }: CandidateViewRefreshProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={handleRefresh}
        title="Check for status updates"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 px-3.5 py-1.5 text-xs font-medium text-slate-300 shadow-xl backdrop-blur-md transition-all hover:bg-slate-800 hover:text-white"
      >
        <RefreshCw className={`h-3 w-3 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Check updates</span>
      </button>
    </div>
  );
}
