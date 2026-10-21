import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Quote,
  ArrowRight,
  User,
  Coffee,
} from 'lucide-react';
import type { SmartBriefing } from '../../types';

interface SmartBriefingViewProps {
  briefing: SmartBriefing | null;
  onRegenerate: () => Promise<void>;
  isGenerating: boolean;
  onOpenDocument?: (docId: string) => void;
  onOpenTasks?: () => void;
  onOpenAutomation?: () => void;
  currentModel?: string;
}

export const SmartBriefingView: React.FC<SmartBriefingViewProps> = ({
  briefing,
  onRegenerate,
  isGenerating,
  onOpenDocument,
  onOpenTasks,
  onOpenAutomation: _onOpenAutomation,
  currentModel,
}) => {
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const [showGrounding, setShowGrounding] = useState(false);

  const toggleQuote = (taskId: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  if (!briefing && !isGenerating) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <Coffee className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Your Morning Sloth Briefing Awaits
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
          LazyFlow synthesizes urgent deliverables, upcoming deadlines, cross-document risks, and grounded next steps.
        </p>
        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Morning Briefing</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-7 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5" />
                Smart Morning Briefing
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                {briefing?.date}
              </span>
              {currentModel && (
                <span className="text-xs text-white/80 bg-black/20 px-2.5 py-0.5 rounded-md font-mono">
                  {currentModel}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {briefing?.headline || 'Morning Sloth Briefing: Clear Bottlenecks First'}
            </h1>
            <p className="mt-2 text-emerald-50/90 text-sm md:text-base max-w-3xl leading-relaxed">
              {briefing?.executive_summary}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing...' : 'Refresh Briefing'}</span>
            </button>
          </div>
        </div>

        {/* Sloth Mindset Banner */}
        {briefing?.sloth_focus_quote && (
          <div className="mt-6 pt-5 border-t border-white/15 flex items-center gap-3 text-xs text-emerald-100">
            <Quote className="w-4 h-4 flex-shrink-0 text-emerald-300" />
            <span className="italic font-medium">
              &ldquo;{briefing.sloth_focus_quote}&rdquo;
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Urgent Actions & Cross-Document Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Urgent Actions & Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Actions Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Urgent Actions ({briefing?.urgent_actions.length || 0})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Grounded high-priority and overdue deliverables
                  </p>
                </div>
              </div>
              {onOpenTasks && (
                <button
                  onClick={onOpenTasks}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Tasks Board</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {briefing?.urgent_actions.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No urgent or overdue deliverables. Clear horizon for steady progress!
              </div>
            ) : (
              <div className="space-y-3">
                {briefing?.urgent_actions.map((act) => {
                  const isExpanded = expandedQuotes[act.task_id];
                  return (
                    <div
                      key={act.task_id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                act.priority === 'high'
                                  ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {act.priority}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {act.due_date}
                            </span>
                            {act.assignee && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {act.assignee}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {act.title}
                          </h4>
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                            {act.urgency_reason}
                          </p>
                        </div>

                        {act.document_id && onOpenDocument && (
                          <button
                            onClick={() => onOpenDocument(act.document_id!)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                            title={`Inspect source document: ${act.document_title}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Source Grounding Quote */}
                      {act.source_quote && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                          <button
                            onClick={() => toggleQuote(act.task_id)}
                            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1"
                          >
                            <Quote className="w-3 h-3" />
                            <span>
                              {isExpanded ? 'Hide source quote' : 'View grounded source excerpt'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs italic text-slate-700 dark:text-slate-300">
                              &ldquo;{act.source_quote}&rdquo;
                              <span className="block mt-1 font-sans text-[10px] text-slate-400 not-italic">
                                Source: {act.document_title}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Upcoming Deadlines (Next 14 Days)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Explicit calendar dates vs inferred fuzzy timelines
                </p>
              </div>
            </div>

            {briefing?.upcoming_deadlines.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
                No immediate deadlines in the next 14 days.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {briefing?.upcoming_deadlines.map((dl) => (
                  <div
                    key={dl.task_id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          {dl.badge_text}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            dl.is_explicit_date
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          }`}
                        >
                          {dl.is_explicit_date ? 'Calendar Date' : 'Inferred'}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                        {dl.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                      {dl.document_title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cross-Document Risks & Recommended Steps */}
        <div className="space-y-6">
          {/* Recommended Next Steps Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recommended Next Steps
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Prioritized sequence of execution
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {briefing?.recommended_next_steps.map((st) => (
                <div
                  key={st.step_number}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {st.step_number}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {st.title}
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                    {st.details}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pl-7 mt-1.5 font-medium truncate">
                    Grounded: {st.grounded_source}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Document Risks */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cross-Document Risks ({briefing?.cross_document_risks.length || 0})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Blockers, SLAs, and unassigned critical items
                </p>
              </div>
            </div>

            {briefing?.cross_document_risks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 p-3 text-center">
                No active cross-document bottlenecks detected.
              </p>
            ) : (
              <div className="space-y-3">
                {briefing?.cross_document_risks.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {risk.title}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                      {risk.description}
                    </p>
                    <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                      Action: {risk.action_plan}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grounding Transparency Drawer Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowGrounding(!showGrounding)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Source Grounding Citations ({briefing?.data_grounding.length || 0})</span>
              </div>
              {showGrounding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGrounding && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                {briefing?.data_grounding.map((g, idx) => (
                  <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      [{g.document_title}]
                    </span>{' '}
                    &ldquo;{g.quote}&rdquo;
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
