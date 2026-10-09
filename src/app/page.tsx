import Link from 'next/link';
import { LCBLogo } from '@/components/LCBLogo';
import { ShieldCheck, Sparkles, Activity, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#040614] text-white flex flex-col relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Graphic: Cyber Grid */}
      <div className="absolute inset-0 bg-grid-cyber pointer-events-none z-0 opacity-75" />

      {/* Floating Animated Ambient Glow Orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow z-0" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute top-1/3 -right-48 w-96 h-96 bg-indigo-600/15 rounded-full blur-[110px] pointer-events-none animate-float-reverse z-0" />

      {/* Header */}
      <header className="border-b border-white/[0.08] bg-[#040614]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Top-Left Brand: Fixed, Clean, Non-colliding */}
          <div className="flex items-center">
            <LCBLogo variant="full" />
          </div>

          {/* Top-Right: Protected HR Portal Link */}
          <Link
            href="/admin"
            className="group inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/40 shadow-sm transition-all duration-300"
          >
            <span>HR Portal</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative z-10 py-12 sm:py-20">
        <div className="max-w-3xl w-full text-center mx-auto animate-fade-in-up">
          {/* Shimmering Badge with Live Pulse */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-500/30 px-4 py-1.5 text-xs font-medium text-cyan-300 shimmer-badge shadow-lg shadow-cyan-950/40 mb-8 select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span>Official Recruitment Portal</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">LCB Season 2026</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Recruitment Management{' '}
            <span className="text-gradient-cyan block sm:inline">Portal</span>
          </h1>

          {/* Exact Required Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-2xl mx-auto font-normal">
            Welcome to the official recruitment management portal. Track your application status and evaluation milestones in real time.
          </p>

          {/* Interactive Visual Graphic: 3-Milestone Flow */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {/* Card 1 */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl border border-white/10 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3.5 group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Live Milestones
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Stay updated as your application progresses from interview to final review.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl border border-white/10 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3.5 group-hover:scale-110 transition-transform">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Private Token Access
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Direct, password-free status tracking via your encrypted personal link.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl border border-white/10 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3.5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Official Verification
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Validated recruitment outcomes issued by LinkedIn Community Bangladesh HR.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.06] py-6 px-4 text-center text-xs text-slate-500 relative z-10 bg-[#040614]/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} LinkedIn Community Bangladesh. All rights reserved.</span>
          <span className="text-[11px] text-slate-600">
            Empowering the Next Generation of Professionals
          </span>
        </div>
      </footer>
    </div>
  );
}
