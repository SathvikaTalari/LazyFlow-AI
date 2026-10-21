import React from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Folder,
  ArrowRight,
  Flame,
  User,
  Quote,
} from 'lucide-react';
import type { DailyWorkflow } from '../../types';

interface DailyWorkflowViewProps {
  workflow: DailyWorkflow | null;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onOpenDocument?: (docId: string) => void;
  onOpenTasks: () => void;
  onOpenAutomation: () => void;
}

export const DailyWorkflowView: React.FC<DailyWorkflowViewProps> = ({
  workflow,
  onToggleTask,
  onOpenDocument,
  onOpenTasks,
  onOpenAutomation,
}) => {
  if (!workflow) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <Sparkles className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Loading your daily workspace...
        </p>
      </div>
    );
  }

  const {
    today_priorities = [],
    overdue_tasks = [],
    upcoming_deadlines = [],
    cross_document_risks = [],
    metrics,
    daily_sloth_tip,
    date,
  } = workflow;

  const priorityStyles: Record<string, string> = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Hero Daily Briefing Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>Unified Daily Workspace • {date}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Today's Flow: Slow, Steady & Focused
            </h1>

            <p className="text-xs md:text-sm text-emerald-100 max-w-xl leading-relaxed">
              Synthesized from across your documents. Tackle overdue items first, review today's top
              deliverables, and navigate cross-document dependencies without context overload.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="text-center px-2">
              <p className="text-xs text-emerald-200 uppercase tracking-wider font-bold">Active</p>
              <p className="text-xl font-extrabold text-white">{metrics?.total_active ?? 0}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <p className="text-xs text-red-300 uppercase tracking-wider font-bold">Overdue</p>
              <p className="text-xl font-extrabold text-red-400">{metrics?.overdue_count ?? 0}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <p className="text-xs text-emerald-300 uppercase tracking-wider font-bold">Progress</p>
              <p className="text-xl font-extrabold text-emerald-400">{metrics?.completion_rate ?? 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sloth Daily Focus Tip */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/20 text-xs">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
          🦥
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-slate-900 dark:text-white mr-1.5">
            Sloth Focus Principle:
          </span>
          <span className="text-slate-700 dark:text-slate-300">{daily_sloth_tip}</span>
        </div>
      </div>

      {/* Overdue Deliverables Warning Card (if any) */}
      {overdue_tasks.length > 0 && (
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
                  {overdue_tasks.length} Overdue Deliverable(s)
                </h3>
                <p className="text-[11px] text-red-600/80 dark:text-red-400/80">
                  Deadlines that passed their explicit calendar date
                </p>
              </div>
            </div>
            <button
              onClick={onOpenTasks}
              className="text-xs font-semibold text-red-700 dark:text-red-300 hover:underline flex items-center gap-1"
            >
              <span>View in Action Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {overdue_tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 shadow-xs"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => onToggleTask(task.id, e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        {task.badge_text || 'Overdue'}
                      </span>
                      {task.document_title && (
                        <span
                          onClick={() => task.document_id && onOpenDocument?.(task.document_id)}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline cursor-pointer truncate max-w-xs"
                        >
                          {task.document_title}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {task.title}
                    </p>
                    {task.source_quote && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1 flex items-start gap-1">
                        <Quote className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-400" />
                        <span className="line-clamp-1">"{task.source_quote}"</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Today Priorities & Cross-Document Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Priorities & Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Priorities */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Today's Top Focus Deliverables</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-priority tasks due today or requiring immediate attention
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {today_priorities.length} active
              </span>
            </div>

            {today_priorities.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400">
                No immediate deliverables pending for today. Smooth sailing! 🦥
              </div>
            ) : (
              <div className="space-y-3">
                {today_priorities.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => onToggleTask(task.id, e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              priorityStyles[task.priority] || priorityStyles.medium
                            }`}
                          >
                            {task.priority}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {task.is_explicit_date ? (
                              <Calendar className="w-2.5 h-2.5" />
                            ) : (
                              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                            )}
                            <span>{task.badge_text || 'Upcoming'}</span>
                          </span>

                          {task.document_title && (
                            <span
                              onClick={() => task.document_id && onOpenDocument?.(task.document_id)}
                              className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline cursor-pointer truncate max-w-xs"
                            >
                              from {task.document_title}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {task.title}
                        </p>

                        {task.source_quote && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1 flex items-start gap-1">
                            <Quote className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-400" />
                            <span className="line-clamp-1">"{task.source_quote}"</span>
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{task.assignee || 'Unassigned'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.due_date || 'Upcoming'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines (Next 7 Days) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Upcoming Deadlines (Next 7 Days)</span>
            </h2>

            {upcoming_deadlines.length === 0 ? (
              <p className="text-xs text-slate-400">No deadlines scheduled in the next 7 days.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcoming_deadlines.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {task.badge_text || 'Due soon'}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 mt-1">
                        {task.title}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{task.assignee || 'Team'}</span>
                      <span className="truncate max-w-[120px]">{task.document_title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Cross-Document Risks & Automation Callout */}
        <div className="space-y-6">
          {/* Cross-Document Risks */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Cross-Document Risks</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Correlations, incident blockers, and compliance clauses detected across your library.
            </p>

            {cross_document_risks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>No high-severity risks identified across documents.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {cross_document_risks.map((risk) => (
                  <div
                    key={risk.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      risk.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-100'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{risk.title}</span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">{risk.description}</p>
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                      💡 {risk.action_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safe Automation Action Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2">
              <Folder className="w-4 h-4" />
              <span>Safe Organization Automation</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Review Proposed File Actions
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              LazyFlow AI detected unfiled files and generated normalized folder paths and filenames.
              Review proposals and explicitly approve them before changes are committed.
            </p>
            <button
              onClick={onOpenAutomation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <span>Open Safe Automation Preview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
