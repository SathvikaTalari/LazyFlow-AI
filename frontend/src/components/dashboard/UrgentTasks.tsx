import React from 'react';
import { CheckSquare, Calendar, User, ExternalLink } from 'lucide-react';
import type { ActionItem } from '../../types';

interface UrgentTasksProps {
  tasks: ActionItem[];
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onOpenDocument?: (docId: string) => void;
  onViewAll: () => void;
}

export const UrgentTasks: React.FC<UrgentTasksProps> = ({
  tasks,
  onToggleTask,
  onOpenDocument,
  onViewAll,
}) => {
  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 5);

  const priorityStyles: Record<string, string> = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <span>Urgent Tasks</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Extracted from your documents
          </p>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>All Tasks</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {pendingTasks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            🎉 All caught up! No pending urgent tasks.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Upload documents to extract deadlines and tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pendingTasks.map((task) => (
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

                    {task.document_title && (
                      <span
                        onClick={() => task.document_id && onOpenDocument?.(task.document_id)}
                        className={`text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs ${
                          task.document_id ? 'cursor-pointer hover:underline' : ''
                        }`}
                      >
                        from {task.document_title}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs font-semibold ${
                      task.completed
                        ? 'line-through text-slate-400 dark:text-slate-600'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {task.title}
                  </p>

                  {task.description && task.description !== task.title && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{task.assignee || 'Unassigned'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{task.due_date || 'TBD'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
