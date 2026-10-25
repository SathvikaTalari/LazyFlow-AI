import React from 'react';
import { Sparkles, Calendar, RotateCw, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import type { DailyDigest } from '../../types';

interface DailyDigestViewProps {
  digest: DailyDigest | null;
  onRegenerate: () => Promise<void>;
  isGenerating: boolean;
  onOpenTasks: () => void;
}

export const DailyDigestView: React.FC<DailyDigestViewProps> = ({
  digest,
  onRegenerate,
  isGenerating,
  onOpenTasks,
}) => {
  return (
    <div className="space-y-6">
      {/* Digest Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Daily Digest</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {digest?.title || 'Daily Digest'}
            </h1>

            <div className="flex items-center gap-4 text-xs text-indigo-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{digest?.date || 'Today'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Local AI</span>
              </span>
            </div>
          </div>

          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-white' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Executive Overview */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span>Overview</span>
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {digest?.summary ||
            'Upload documents to generate today’s digest.'}
        </p>

        {/* Highlights */}
        {digest?.highlights && digest.highlights.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Key Highlights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {digest.highlights.map((hl, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {hl}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Callout */}
        <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {digest?.pending_tasks_count ?? 0} Pending Action Items
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Focus on high-priority deliverables first to maintain steady momentum.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTasks}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
          >
            <span>Review Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
