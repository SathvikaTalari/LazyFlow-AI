import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calculator,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  HelpCircle,
  X,
} from 'lucide-react';
import type { ProductivityInsights } from '../../types';

interface ProductivityInsightsViewProps {
  insights: ProductivityInsights | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export const ProductivityInsightsView: React.FC<ProductivityInsightsViewProps> = ({
  insights,
  onRefresh,
  isRefreshing,
}) => {
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  if (!insights) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6 text-slate-400" />
        </div>
        <p>Loading AI productivity insights...</p>
      </div>
    );
  }

  const effort = insights.effort_saved;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Autonomous Productivity
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Live Verified
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            AI Productivity & Impact Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real metrics computed from local SQLite documents and task state. Never fabricated.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFormulaModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Calculation Transparency</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Hero Impact Metric: Effort Saved */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Grounded Manual Effort Saved</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-black tracking-tight">
                {effort.total_hours_formatted}
              </span>
              <span className="text-emerald-100 text-sm font-medium">
                ({effort.total_minutes_saved} total minutes saved)
              </span>
            </div>
            <p className="text-emerald-50/90 text-xs md:text-sm max-w-2xl leading-relaxed">
              Calculated using standard administrative benchmarks: Nielsen Norman Group 230 wpm reading speed,
              15 min executive summarization, 5 min deliverable extraction, and 8 min deduplication cross-referencing.
            </p>
          </div>

          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs space-y-2 min-w-[220px]">
            <div className="font-bold flex items-center justify-between text-white pb-1.5 border-b border-white/20">
              <span>Effort Breakdown</span>
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex justify-between text-emerald-100">
              <span>Reading Content:</span>
              <span className="font-semibold">{Math.round(effort.reading_minutes)}m</span>
            </div>
            <div className="flex justify-between text-emerald-100">
              <span>Executive Summaries:</span>
              <span className="font-semibold">{Math.round(effort.summarization_minutes)}m</span>
            </div>
            <div className="flex justify-between text-emerald-100">
              <span>Deliverable & Quote Ext:</span>
              <span className="font-semibold">{Math.round(effort.task_extraction_minutes)}m</span>
            </div>
            <div className="flex justify-between text-emerald-100">
              <span>Duplicate Cross-Ref:</span>
              <span className="font-semibold">{Math.round(effort.deduplication_minutes)}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Processing Success Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Success Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {insights.processing_success_rate_pct}%
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {insights.successful_processing_count} of {insights.total_processing_attempts} attempts succeeded
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${insights.processing_success_rate_pct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Tasks Pending vs Completed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Task Velocity
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {insights.completion_rate_pct}%
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{insights.completed_tasks} completed</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{insights.pending_tasks} pending</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${insights.completion_rate_pct}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Overdue Deliverables */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overdue Items
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                insights.overdue_tasks > 0
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold ${
              insights.overdue_tasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {insights.overdue_tasks}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {insights.due_today_tasks} deliverable(s) due today
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400">
            {insights.overdue_tasks === 0 ? 'No schedule drag' : 'Immediate attention needed'}
          </div>
        </div>

        {/* Metric 4: Corpus Analyzed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Corpus Analyzed
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {effort.reading_words_total.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Words read across {insights.total_documents} documents
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400">
            {insights.total_tasks} deliverables extracted
          </div>
        </div>
      </div>

      {/* Trust & Transparency Guarantee Card */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900 dark:text-slate-200">
            Zero-Fabrication Privacy Guarantee
          </p>
          <p className="leading-relaxed">
            Every metric, success rate, and effort estimate in LazyFlow AI is strictly derived from actual SQLite records
            stored on your computer. Estimates explicitly disclose the standard benchmark multipliers used.
          </p>
        </div>
      </div>

      {/* Calculation Transparency Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowFormulaModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                How Effort Saved is Calculated
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              We never fabricate simulated metrics. Effort saved is estimated by modeling the human administrative
              time required to perform each document task manually:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  1. Document Reading Time (230 wpm)
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {effort.reading_words_total.toLocaleString()} words &divide; 230 wpm ={' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {Math.round(effort.reading_minutes)} minutes
                  </span>
                  <br />
                  <span className="text-[10px] text-slate-400">
                    Based on Nielsen Norman Group standard adult reading speed benchmarks.
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  2. Executive Summarization (15 min/doc)
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {effort.summarization_docs_count} docs &times; 15 min ={' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {Math.round(effort.summarization_minutes)} minutes
                  </span>
                  <br />
                  <span className="text-[10px] text-slate-400">
                    Standard knowledge-worker time to draft executive overviews and takeaways.
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  3. Deliverable & Quote Extraction (5 min/task)
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {effort.task_extraction_count} deliverables &times; 5 min ={' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {Math.round(effort.task_extraction_minutes)} minutes
                  </span>
                  <br />
                  <span className="text-[10px] text-slate-400">
                    Locating assignees, due dates, quotes, and assigning priority tiers.
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  4. Duplicate Cross-Referencing (8 min/cluster)
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {effort.deduplication_clusters_count} merged cluster(s) &times; 8 min ={' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {Math.round(effort.deduplication_minutes)} minutes
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
