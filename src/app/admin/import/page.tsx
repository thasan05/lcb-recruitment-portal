import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/lib/auth';
import { BulkImporter } from '@/components/admin/BulkImporter';
import { FileSpreadsheet } from 'lucide-react';

export const metadata = {
  title: 'Bulk Candidate Import — LCB HR Admin',
};

export default async function AdminImportPage() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 mb-2">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Batch Data Ingestion</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Bulk Candidate CSV Import
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Import large candidate lists from external forms and spreadsheets. System automatically issues human-friendly application IDs and private access tokens.
        </p>
      </div>

      <BulkImporter />
    </div>
  );
}
