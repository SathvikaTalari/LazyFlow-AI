import React from 'react';
import { UploadCloud, Sparkles, FolderOpen, ArrowRight } from 'lucide-react';

interface SlothBannerProps {
  onQuickUpload: () => void;
  onOpenSamples: () => void;
  onOpenDigest: () => void;
}

export const SlothBanner: React.FC<SlothBannerProps> = ({
  onQuickUpload,
  onOpenSamples,
  onOpenDigest,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-6 md:p-8 shadow-xl mb-8">
      {/* Decorative gradient glow circles */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>100% Private On-Device AI</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Take it slow. <span className="text-emerald-300">Let local AI flow.</span>
          </h1>

          <p className="text-sm text-emerald-100/90 max-w-lg leading-relaxed">
            Summarize notes, extract tasks, and organize your work — running entirely on your machine.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
            <button
              onClick={onQuickUpload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-all hover:scale-105"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Process Document</span>
            </button>

            <button
              onClick={onOpenSamples}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm backdrop-blur-sm border border-white/20 transition-all"
            >
              <FolderOpen className="w-4 h-4 text-emerald-200" />
              <span>Sample Demos</span>
            </button>

            <button
              onClick={onOpenDigest}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-200 hover:text-white transition-colors"
            >
              <span>Today's Digest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mascot badge on right */}
        <div className="flex-shrink-0 relative group">
          <div className="absolute inset-0 bg-emerald-400/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-900/40 backdrop-blur-md">
            <img
              src="/mascot.jpg"
              alt="LazyFlow Mascot"
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
