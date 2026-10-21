import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  documentTitle?: string;
  modelName?: string;
}

const STEPS = [
  'Reading document bytes & extracting text structure',
  'Initializing on-device Ollama local model',
  'Analyzing document semantics & key insights',
  'Extracting structured action items, deadlines & priorities',
  'Generating folder organization path & saving to SQLite'
];

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  documentTitle,
  modelName,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl text-center overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />

        {/* Mascot badge */}
        <div className="relative mx-auto w-24 h-24 mb-5">
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/30 blur-lg animate-pulse" />
          <img
            src="/mascot.jpg"
            alt="LazyFlow Mascot"
            className="relative w-full h-full rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-lg"
          />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Local AI Working Steady
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto truncate font-medium">
          {documentTitle || 'Processing Document...'}
        </p>

        {/* Local model badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold my-4">
          <Cpu className="w-3.5 h-3.5 text-emerald-500" />
          <span>Running locally on {modelName || 'gemma3:4b'}</span>
        </div>

        {/* Step indicator */}
        <div className="space-y-2.5 text-left my-5 px-2">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-xs transition-colors ${
                    isDone
                      ? 'text-slate-700 dark:text-slate-300 line-through opacity-70'
                      : isCurrent
                      ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Privacy reassurance footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Zero cloud tokens • Strictly private localhost</span>
        </div>
      </div>
    </div>
  );
};
