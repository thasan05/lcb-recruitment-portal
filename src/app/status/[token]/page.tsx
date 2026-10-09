import { notFound, redirect } from 'next/navigation';
import { getCandidateBySecureToken } from '@/lib/db';
import { CandidateStatusCard } from '@/components/candidate/CandidateStatusCard';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const candidate = await getCandidateBySecureToken(token);
  if (!candidate) {
    return { title: 'Recruitment Status — LinkedIn Community Bangladesh' };
  }
  if (candidate.is_expired) {
    return {
      title: `Recruitment Notice (Expired) — ${candidate.name} | LCB`,
    };
  }
  return {
    title: `Recruitment Status — ${candidate.name} | LCB`,
  };
}

export default async function CandidateStatusPage({ params }: Props) {
  const { token } = await params;
  const candidate = await getCandidateBySecureToken(token);

  if (candidate && candidate.canonicalToken && (candidate.isLegacyToken || !/^[a-f0-9]{24}$/i.test(token))) {
    redirect(`/status/${candidate.canonicalToken}`);
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#040614] text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Grid Background */}
        <div className="absolute inset-0 bg-grid-cyber pointer-events-none opacity-60 z-0" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="glass-panel max-w-md w-full p-8 rounded-3xl text-center border border-white/10 relative z-10 shadow-2xl animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            We could not locate an active recruitment record with this secure link. Please check your email or contact the LCB HR team.
          </p>
          <a
            href="mailto:linkedincommunitybangladesh@gmail.com"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-white/10 transition-all"
          >
            Contact LCB HR Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040614] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Graphic: Cyber Grid */}
      <div className="absolute inset-0 bg-grid-cyber pointer-events-none opacity-70 z-0" />

      {/* Floating Animated Orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[110px] pointer-events-none animate-pulse-glow z-0" />
      <div className="absolute bottom-10 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none animate-float-slow z-0" />

      <main className="flex-1 flex items-center justify-center relative z-10 py-6">
        <CandidateStatusCard candidate={candidate} />
      </main>
    </div>
  );
}
