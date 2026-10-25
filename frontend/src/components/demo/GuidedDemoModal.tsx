import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  Quote,
  Copy,
  Clock,
  Calendar,
  FolderSync,
  Play,
} from 'lucide-react';
import type { NavTab } from '../layout/Sidebar';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onLoadSample: (sampleId: string) => Promise<void>;
  onOpenDeduplication: () => void;
  onOpenDocument?: (docId: string) => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onLoadSample,
  onOpenDeduplication,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      stage: 1,
      title: 'Multi-Format Ingestion',
      icon: FileText,
      color: 'text-blue-500 bg-blue-500/10',
      description:
        'LazyFlow accepts Markdown, Text, PDF, DOCX, JSON, and CSV files or direct text paste. Every document is processed strictly on-device through Ollama with zero cloud leakage.',
      actionLabel: '1-Click Ingest Q4 Roadmap Sample',
      actionHelp: 'Triggers real local AI ingestion of the preloaded Roadmap meeting transcript.',
      executeAction: async () => {
        setIsExecuting(true);
        try {
          await onLoadSample('sample-roadmap');
        } finally {
          setIsExecuting(false);
        }
      },
    },
    {
      stage: 2,
      title: 'Evidence-Backed Extraction',
      icon: Quote,
      color: 'text-emerald-500 bg-emerald-500/10',
      description:
        'Unlike black-box summaries, LazyFlow anchors every single extracted task to the exact supporting excerpt quote from the source text for 100% transparency.',
      actionLabel: 'Inspect Processed Documents & Quotes',
      actionHelp: 'Navigates to the Documents tab where you can click into any document to see exact excerpt citations.',
      executeAction: async () => {
        onSelectTab('documents');
      },
    },
    {
      stage: 3,
      title: 'Smart Task Deduplication',
      icon: Copy,
      color: 'text-purple-500 bg-purple-500/10',
      description:
        'When deliverables overlap across meeting notes, outage postmortems, and specs, LazyFlow detects semantic clusters and merges them with a single click while preserving multi-source citations.',
      actionLabel: 'Launch Task Deduplication Scanner',
      actionHelp: 'Scans all active action items for semantic overlap and suggests 1-click consolidations.',
      executeAction: async () => {
        onSelectTab('tasks');
        onOpenDeduplication();
      },
    },
    {
      stage: 4,
      title: 'Deadline Intelligence',
      icon: Clock,
      color: 'text-amber-500 bg-amber-500/10',
      description:
        'LazyFlow distinguishes explicit calendar dates (YYYY-MM-DD) from AI-inferred fuzzy timelines ("in 2 weeks", "next sprint"), providing overdue and days-remaining counters.',
      actionLabel: 'View Action Items & Deadlines',
      actionHelp: 'Navigates to the Action Items workspace filtered by timeline urgency.',
      executeAction: async () => {
        onSelectTab('tasks');
      },
    },
    {
      stage: 5,
      title: 'Smart Daily Briefing & Flow',
      icon: Calendar,
      color: 'text-teal-500 bg-teal-500/10',
      description:
        'Synthesizes an actionable morning briefing: today\'s top priorities, overdue deliverables, cross-document risks, and grounded next steps. Every claim is substantiated by source quotes.',
      actionLabel: 'Open Smart Morning Briefing',
      actionHelp: 'Opens the unified morning briefing workspace.',
      executeAction: async () => {
        onSelectTab('briefing');
      },
    },
    {
      stage: 6,
      title: 'Safe Automation & File Approval',
      icon: FolderSync,
      color: 'text-indigo-500 bg-indigo-500/10',
      description:
        'LazyFlow suggests standardized file renames and organized folder hierarchies (e.g. Projects/Roadmap, Operations/Incidents) — but NEVER writes to your filesystem without your explicit human approval.',
      actionLabel: 'Review Safe Automation Proposals',
      actionHelp: 'Inspect pending file reorganization proposals awaiting your review.',
      executeAction: async () => {
        onSelectTab('automation');
      },
    },
  ];

  const current = steps[currentStep];
  const Icon = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Exit Demo Mode"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-6">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? 'w-8 bg-emerald-500'
                  : idx < currentStep
                  ? 'w-3 bg-emerald-500/40'
                  : 'w-3 bg-slate-200 dark:bg-slate-800'
              }`}
              title={`Step ${idx + 1}: ${steps[idx].title}`}
            />
          ))}
          <span className="ml-2 text-xs font-mono font-bold text-slate-400">
            {currentStep + 1}/{steps.length}
          </span>
        </div>

        {/* Step Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${current.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Stage {current.stage} of 6
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {current.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {current.description}
        </p>

        {/* Real Action Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 mb-6 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Interactive Live Feature
          </span>
          <button
            onClick={async () => {
              await current.executeAction();
            }}
            disabled={isExecuting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm disabled:opacity-50"
          >
            {isExecuting ? (
              <span>Executing Live Action...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{current.actionLabel}</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            {current.actionHelp}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
