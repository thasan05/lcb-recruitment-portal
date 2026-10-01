import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCandidateBySecureToken } from '@/lib/db';
import { LCBNavbar } from '@/components/LCBNavbar';
import { Footer } from '@/components/Footer';
import { HeroCard } from '@/components/candidate/HeroCard';
import { TimelineStepper } from '@/components/candidate/TimelineStepper';
import { InterviewCard } from '@/components/candidate/InterviewCard';
import { UpdatesCard } from '@/components/candidate/UpdatesCard';
import { ContactCard } from '@/components/candidate/ContactCard';
import { CandidateViewRefresh } from '@/components/candidate/CandidateViewRefresh';
import { Briefcase, Building, Calendar, Layers, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface CandidatePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: CandidatePageProps): Promise<Metadata> {
  const { token } = await params;
  const candidate = await getCandidateBySecureToken(token);

  if (!candidate) {
    return {
      title: 'Application Not Found — LCB Recruitment Portal',
    };
  }

  return {
    title: `${candidate.full_name} — Application Status | LCB Recruitment Portal`,
    description: `Track your recruitment application for ${candidate.position} at LinkedIn Community Bangladesh.`,
  };
}

export default async function CandidatePortalPage({ params }: CandidatePageProps) {
  const { token } = await params;
  const candidate = await getCandidateBySecureToken(token);

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#040614] text-white flex flex-col justify-between">
        <LCBNavbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-5">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Application Not Found</h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              We could not find an application matching this link. The secure token may be incorrect or the link may have expired.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href="mailto:linkedincommunitybangladesh@gmail.com?subject=Application%20Link%20Help"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Contact LCB HR Support
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formattedAppDate = new Date(candidate.application_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#040614] text-white flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Client component that handles automatic or manual instant re-sync */}
      <CandidateViewRefresh token={token} />

      <LCBNavbar />

      <main className="flex-1 pb-24 pt-6 sm:pt-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Private Candidate Space
            </span>
            <span className="font-mono text-slate-500">{candidate.campaign}</span>
          </div>

          {/* 1. Candidate Hero & Status Card */}
          <HeroCard candidate={candidate} />

          {/* 2. Visual Recruitment Timeline Card */}
          <section className="rounded-3xl border border-white/[0.08] bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-400" />
                  Your Recruitment Journey
                </h2>
                <p className="text-xs text-slate-400">
                  Track the multi-stage evaluation process for your application
                </p>
              </div>
              <div className="text-xs text-cyan-400 font-medium">
                Live Status Tracker
              </div>
            </div>

            <TimelineStepper status={candidate.status} />
          </section>

          {/* 3. Interview Section (If Scheduled) */}
          {candidate.interview && (
            <InterviewCard interview={candidate.interview} candidate={candidate} />
          )}

          {/* 4. Application Details Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Briefcase className="h-4 w-4 text-cyan-400" />
                <span>Role Applied</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">{candidate.position}</p>
              <p className="text-[11px] text-slate-500">Position</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Building className="h-4 w-4 text-cyan-400" />
                <span>Department</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">{candidate.department}</p>
              <p className="text-[11px] text-slate-500">Division</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span>Applied On</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">{formattedAppDate}</p>
              <p className="text-[11px] text-slate-500">Application Date</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Application ID</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white font-mono">{candidate.application_id}</p>
              <p className="text-[11px] text-slate-500">Official Reference</p>
            </div>
          </section>

          {/* 5. Candidate Announcements & Updates */}
          <UpdatesCard updates={candidate.updates} />

          {/* 6. HR Support & Inquiries */}
          <ContactCard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
