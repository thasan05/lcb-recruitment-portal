'use client';

import Link from 'next/link';
import { LCBLogo } from './LCBLogo';
import { Lock, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface LCBNavbarProps {
  isAdmin?: boolean;
}

export function LCBNavbar({ isAdmin = false }: LCBNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#040614]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <LCBLogo />

        <div className="flex items-center gap-3">
          <a
            href="https://linkedincommunitybangladesh.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <span>LCB Main Site</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          {isAdmin ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>HR Admin Console</span>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Lock className="h-3 w-3 text-cyan-400" />
              <span>HR Portal</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
