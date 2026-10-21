import React from 'react';
import { FolderOpen, ArrowRight, Sparkles } from 'lucide-react';
import type { SampleDoc } from '../../types';

interface SampleLibraryViewProps {
  samples: SampleDoc[];
  onSelectSample: (sampleId: string) => Promise<void>;
  isProcessing: boolean;
}

export const SampleLibraryView: React.FC<SampleLibraryViewProps> = ({
  samples,
  onSelectSample,
  isProcessing,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Sample Document Test Bench
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              One-click demonstration files crafted for the Hacktoberfest AI Challenge
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
          Judges can select any real-world document below to test end-to-end local inference,
          intelligent text summarization, deadline identification, and folder classification.
        </p>
      </div>

      {/* Grid of Samples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {samples.map((sample) => (
          <div
            key={sample.id}
            className="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {sample.category}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {sample.file_type}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
                {sample.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {sample.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                {sample.filename}
              </span>

              <button
                onClick={() => onSelectSample(sample.id)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Process with AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
