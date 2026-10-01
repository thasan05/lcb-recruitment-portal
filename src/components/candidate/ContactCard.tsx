import { Mail, HelpCircle, ArrowUpRight, MessageCircle } from 'lucide-react';

export function ContactCard() {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/60 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            <HelpCircle className="h-4 w-4" />
            Support & Inquiries
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Have questions about your recruitment process?
          </h3>
          <p className="mt-1 text-sm text-slate-400 max-w-xl">
            Our talent acquisition and community leadership teams are here to assist you with scheduling, queries, or technical difficulties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="mailto:linkedincommunitybangladesh@gmail.com?subject=Recruitment%20Inquiry"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-semibold text-white border border-white/10 transition-colors"
          >
            <Mail className="h-4 w-4 text-cyan-400" />
            <span>Email HR Team</span>
          </a>

          <a
            href="https://linkedincommunitybangladesh.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-transparent hover:bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <span>Visit LCB Website</span>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
