import { redirect } from 'next/navigation';
import Link from 'next/link';
import { checkAdminAuth } from '@/lib/auth';
import { getCandidateById } from '@/lib/db';
import { CandidateDetailManager } from '@/components/admin/CandidateDetailManager';
import { ArrowLeft, UserX } from 'lucide-react';

interface CandidatePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CandidatePageProps) {
  const { id } = await params;
  const candidate = await getCandidateById(id);
  if (!candidate) return { title: 'Candidate Not Found — LCB HR' };
  return {
    title: `${candidate.full_name} (${candidate.application_id}) — LCB HR Admin`,
  };
}

export default async function AdminCandidateDetailPage({ params }: CandidatePageProps) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const candidate = await getCandidateById(id);

  if (!candidate) {
    return (
      <div className="py-16 text-center">
        <UserX className="h-12 w-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Candidate Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">
          This candidate record does not exist or may have been removed.
        </p>
        <Link
          href="/admin/candidates"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Candidates</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/candidates"
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Candidate Directory</span>
      </Link>

      <CandidateDetailManager initialCandidate={candidate} />
    </div>
  );
}
