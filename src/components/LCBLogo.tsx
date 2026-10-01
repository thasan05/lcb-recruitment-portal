import Image from 'next/image';
import Link from 'next/link';

interface LCBLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function LCBLogo({ className = '', showSubtitle = true }: LCBLogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 group focus:outline-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <Image
          src="/logo.svg"
          alt="LCB — LinkedIn Community Bangladesh"
          width={88}
          height={26}
          className="h-6 w-auto transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
          Recruitment Portal
          <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            2026
          </span>
        </span>
        {showSubtitle && (
          <span className="text-[11px] text-slate-400 tracking-tight">
            LinkedIn Community Bangladesh
          </span>
        )}
      </div>
    </Link>
  );
}
