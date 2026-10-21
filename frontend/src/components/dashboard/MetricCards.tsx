import React from 'react';
import { FileText, CheckCircle2, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import type { HealthStatus } from '../../types';

interface MetricCardsProps {
  health: HealthStatus | null;
  onOpenTasks: () => void;
  onOpenDocs: () => void;
  onOpenSettings: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  health,
  onOpenTasks,
  onOpenDocs,
  onOpenSettings,
}) => {
  const docsCount = health?.documents_count ?? 0;
  const tasksCount = health?.tasks_count ?? 0;
  const completedTasks = health?.completed_tasks_count ?? 0;
  const pendingTasks = Math.max(0, tasksCount - completedTasks);

  // Time saved formula: ~18 mins reading/organizing per document + 5 mins per task
  const minutesSaved = docsCount * 18 + completedTasks * 5;
  const hoursSaved = (minutesSaved / 60).toFixed(1);

  const completionPercentage = tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Documents Card */}
      <div
        onClick={onOpenDocs}
        className="cursor-pointer group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all hover:border-emerald-500/40"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Documents Processed
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {docsCount}
          </h2>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Stored Locally
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Markdown, PDF, DOCX, Text
        </p>
      </div>

      {/* Action Items Card */}
      <div
        onClick={onOpenTasks}
        className="cursor-pointer group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all hover:border-amber-500/40"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Pending Action Items
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {pendingTasks}
          </h2>
          <span className="text-[11px] font-medium text-slate-500">
            of {tasksCount} total
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Time Saved Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            Estimated
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Productivity Saved
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {hoursSaved} hrs
          </h2>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            ≈ {minutesSaved} mins
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Skipped repetitive skimming
        </p>
      </div>

      {/* Local AI Engine Card */}
      <div
        onClick={onOpenSettings}
        className="cursor-pointer group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all hover:border-emerald-500/40"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              health?.ollama_connected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {health?.ollama_connected ? 'Active' : 'Offline'}
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Local Open-Weight Model
        </p>
        <div className="flex items-baseline gap-2 mt-1 truncate">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {health?.current_model || 'Ollama LLM'}
          </h2>
        </div>
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
          100% On-Device • Zero Leakage
        </p>
      </div>
    </div>
  );
};
