import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LCBLogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  showSubtitle?: boolean;
  showBadge?: boolean;
  href?: string;
}

export function LCBLogo({
  className = '',
  variant = 'full',
  showSubtitle = true,
  showBadge = true,
  href = '/',
}: LCBLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {/* LCB 3-Letter Block Mark */}
      <div className="relative flex-shrink-0 flex items-center justify-center p-1 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm shadow-blue-500/10 group-hover:border-blue-400/40 group-hover:shadow-blue-500/20 transition-all duration-300">
        <Image
          src="/logo.svg"
          alt="LinkedIn Community Bangladesh"
          width={84}
          height={25}
          className="h-6 sm:h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>

      {variant === 'full' && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap group-hover:text-cyan-300 transition-colors">
              Recruitment Portal
            </span>
            {showBadge && (
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 tracking-wide">
                2026
              </span>
            )}
          </div>
          {showSubtitle && (
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-normal whitespace-nowrap mt-0.5">
              LinkedIn Community Bangladesh
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl transition-opacity hover:opacity-95"
      >
        {content}
      </Link>
    );
  }

  return content;
}
