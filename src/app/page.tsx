import Link from 'next/link';
import Image from 'next/image';
import { LCBNavbar } from '@/components/LCBNavbar';
import { Footer } from '@/components/Footer';
import { QuickTracker } from '@/components/QuickTracker';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Users,
  Compass,
  Briefcase,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#040614] text-white flex flex-col selection:bg-blue-600 selection:text-white overflow-hidden">
      <LCBNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28">
          {/* Ambient Lighting Gradients */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-full max-w-6xl rounded-full bg-gradient-to-b from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl -z-10" />

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Shimmer Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/80 shadow-lg backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400" />
                <span className="relative h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              <span>LinkedIn Community Bangladesh</span>
            </div>

            <h1 className="mt-8 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Where ambition finds <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-white">
                its people.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-xl text-slate-300 leading-relaxed">
              Welcome to the official recruitment management portal. Track your application status, interview schedules, and evaluation milestones in real time.
            </p>

            {/* Quick Candidate Application Tracker */}
            <div className="mt-10 max-w-xl mx-auto">
              <QuickTracker />
            </div>

            {/* Explore Demo Profiles */}
            <div className="mt-12 pt-8 border-t border-white/10 max-w-2xl mx-auto">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                Try Live Demo Candidate Portals
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/candidate/tok_lcb_tanvir_h_2026"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-slate-900/60 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Tanvir Hasan (Interview Stage)</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </Link>

                <Link
                  href="/candidate/tok_lcb_sadia_a_2026"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-slate-900/60 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Sadia Akter (Shortlisted)</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </Link>

                <Link
                  href="/candidate/tok_lcb_rahim_a_2026"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-slate-900/60 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Rahim Ahmed (Selected)</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: How LCB Recruitment Works */}
        <section className="py-16 border-t border-white/[0.08] bg-[#020512]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Engineered for Transparency & Excellence
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                A modern hiring experience for Bangladesh&apos;s most ambitious youth and leadership talent.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Private Candidate Portals</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Every applicant receives a dedicated, secure tracking portal accessible with their personal token. No accounts or passwords required.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-5">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Direct Interview Coordination</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Review time slots in Bangladesh Standard Time (BST), launch Google Meet calls with one click, and export invites directly to Google Calendar.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Real-Time Progression</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Instant visual stepper updates as your application advances through screening, evaluation, panel interview, and selection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HR Gateway Banner */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/70 via-slate-950 to-indigo-950/70 p-8 sm:p-12 text-center sm:text-left backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-3">
                  <Lock className="h-3.5 w-3.5" />
                  Internal HR Administration
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  LCB Talent & HR Team Access
                </h2>
                <p className="mt-2 text-sm text-slate-300 max-w-xl leading-relaxed">
                  Access the internal recruitment pipeline, evaluate applicants, coordinate panels, and generate candidate communication links.
                </p>
              </div>

              <Link
                href="/admin"
                className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98]"
              >
                <span>Open HR Console</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
