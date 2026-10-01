import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#02040c] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="LCB Logo"
              width={70}
              height={22}
              className="h-5 w-auto opacity-80"
            />
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-medium">Recruitment Management Portal</span>
          </div>

          <p className="text-xs text-slate-500 text-center md:text-right">
            Where Bangladesh&apos;s future leaders connect · Built for ambitious professionals
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} LinkedIn Community Bangladesh. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a
              href="https://linkedincommunitybangladesh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              Official Website
            </a>
            <a
              href="https://www.linkedin.com/company/linkedin-community-bangladesh-lcb"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              LinkedIn Page
            </a>
            <Link href="/admin/login" className="hover:text-slate-300 transition-colors">
              HR Administration
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
