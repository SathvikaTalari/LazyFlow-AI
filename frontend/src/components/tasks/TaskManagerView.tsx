import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Search,
  Plus,
  Trash2,
  Calendar,
  User,
  Copy,
  Check,
  Folder,
  Merge,
  Sparkles,
  Quote,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ActionItem, Priority, DuplicateCluster } from '../../types';

interface TaskManagerViewProps {
  tasks: ActionItem[];
  duplicateClusters?: DuplicateCluster[];
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onAddTask: (task: {
    title: string;
    description?: string;
    priority?: Priority;
    assignee?: string;
    due_date?: string;
  }) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onOpenDocument?: (docId: string) => void;
  onOpenDeduplication?: () => void;
}

export const TaskManagerView: React.FC<TaskManagerViewProps> = ({
  tasks,
  duplicateClusters = [],
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenDocument,
  onOpenDeduplication,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const priorityStyles: Record<string, string> = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  const toggleSourceExpand = (id: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase()) ||
        (t.document_title && t.document_title.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? !t.completed
          : t.completed;

      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      const matchDeadline =
        deadlineFilter === 'all'
          ? true
          : deadlineFilter === 'overdue'
          ? t.deadline_status === 'overdue' && !t.completed
          : deadlineFilter === 'today'
          ? t.deadline_status === 'due_today' && !t.completed
          : deadlineFilter === 'this_week'
          ? t.deadline_status === 'due_this_week' && !t.completed
          : deadlineFilter === 'inferred'
          ? !t.is_explicit_date && !t.completed
          : true;

      return matchSearch && matchStatus && matchPriority && matchDeadline;
    });
  }, [tasks, search, statusFilter, priorityFilter, deadlineFilter]);

  const handleCopyPending = () => {
    const pending = tasks.filter((t) => !t.completed);
    let md = `# Pending Action Items Export (${pending.length})\n\n`;
    pending.forEach((t) => {
      md += `- [ ] **${t.title}** (Priority: ${t.priority.toUpperCase()} | Assigned: ${t.assignee || 'Unassigned'} | Due: ${t.due_date || 'TBD'})\n`;
      if (t.document_title) {
        md += `  *Source Document: ${t.document_title}*\n`;
      }
      if (t.source_quote) {
        md += `  *Evidence Quote: "${t.source_quote}"*\n`;
      }
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddTask({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      priority: newPriority,
      assignee: newAssignee.trim() || undefined,
      due_date: newDueDate.trim() || undefined,
    });
    setNewTitle('');
    setNewDesc('');
    setNewAssignee('');
    setNewDueDate('');
    setShowAddModal(false);
  };

  const overdueCount = tasks.filter((t) => !t.completed && t.deadline_status === 'overdue').length;
  const highCount = tasks.filter((t) => !t.completed && t.priority === 'high').length;
  const mediumCount = tasks.filter((t) => !t.completed && t.priority === 'medium').length;
  const lowCount = tasks.filter((t) => !t.completed && t.priority === 'low').length;

  return (
    <div className="space-y-6">
      {/* Smart Deduplication Alert Banner (if duplicates found) */}
      {duplicateClusters.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-500/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Merge className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {duplicateClusters.length} duplicate task group{duplicateClusters.length === 1 ? '' : 's'} found
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Merge related tasks to avoid duplicate work.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenDeduplication}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Review & Merge</span>
          </button>
        </div>
      )}

      {/* Overview stats & action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <span>Action Items</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tasks.length} total tasks across documents
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {duplicateClusters.length > 0 && (
            <button
              onClick={onOpenDeduplication}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <Merge className="w-3.5 h-3.5" />
              <span>Deduplicate ({duplicateClusters.length})</span>
            </button>
          )}

          <button
            onClick={handleCopyPending}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Export Markdown'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Action Item</span>
          </button>
        </div>
      </div>

      {/* Priority counters pill row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Overdue Card */}
        <div
          onClick={() => setDeadlineFilter(deadlineFilter === 'overdue' ? 'all' : 'overdue')}
          className={`cursor-pointer p-3.5 rounded-2xl border text-center transition-all ${
            deadlineFilter === 'overdue'
              ? 'bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300 ring-2 ring-red-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-500/30'
          }`}
        >
          <span className="text-xs font-bold uppercase text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
            <Flame className="w-3 h-3" />
            <span>Overdue</span>
          </span>
          <p className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">
            {overdueCount}
          </p>
        </div>

        {/* High Card */}
        <div
          onClick={() => setPriorityFilter(priorityFilter === 'high' ? 'all' : 'high')}
          className={`cursor-pointer p-3.5 rounded-2xl border text-center transition-all ${
            priorityFilter === 'high'
              ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300 ring-2 ring-red-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-500/30'
          }`}
        >
          <span className="text-xs font-bold uppercase text-red-600 dark:text-red-400">
            High Priority
          </span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {highCount}
          </p>
        </div>

        {/* Medium Card */}
        <div
          onClick={() => setPriorityFilter(priorityFilter === 'medium' ? 'all' : 'medium')}
          className={`cursor-pointer p-3.5 rounded-2xl border text-center transition-all ${
            priorityFilter === 'medium'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30'
          }`}
        >
          <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
            Medium Priority
          </span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {mediumCount}
          </p>
        </div>

        {/* Low Card */}
        <div
          onClick={() => setPriorityFilter(priorityFilter === 'low' ? 'all' : 'low')}
          className={`cursor-pointer p-3.5 rounded-2xl border text-center transition-all ${
            priorityFilter === 'low'
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/30'
          }`}
        >
          <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
            Low Priority
          </span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {lowCount}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action items, assignee, evidence quote, or document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Deadline Filter */}
          <select
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Deadlines</option>
            <option value="overdue">Overdue Only ({overdueCount})</option>
            <option value="today">Due Today</option>
            <option value="this_week">Due This Week</option>
            <option value="inferred">Inferred Dates</option>
          </select>

          {/* Status buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No action items match your filters
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Try switching status or clearing your search term.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isSourceExpanded = expandedSources.has(task.id);
            const isOverdue = task.deadline_status === 'overdue' && !task.completed;
            const hasMergedSources = task.merged_sources && task.merged_sources.length > 0;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-3xl border transition-all shadow-xs ${
                  isOverdue
                    ? 'bg-red-50/30 dark:bg-red-950/20 border-red-300 dark:border-red-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => onToggleTask(task.id, e.target.checked)}
                      className={`mt-1 w-4 h-4 rounded cursor-pointer accent-emerald-600 ${
                        isOverdue ? 'accent-red-600' : ''
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            priorityStyles[task.priority] || priorityStyles.medium
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Deadline Intelligence Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            isOverdue
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                              : task.deadline_status === 'due_today'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : task.is_explicit_date
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                          }`}
                          title={
                            task.is_explicit_date
                              ? 'Verified calendar date from document'
                              : 'Inferred timeline from context'
                          }
                        >
                          {isOverdue ? (
                            <Flame className="w-2.5 h-2.5" />
                          ) : task.is_explicit_date ? (
                            <Calendar className="w-2.5 h-2.5" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5" />
                          )}
                          <span>{task.badge_text || task.due_date}</span>
                        </span>

                        {/* Source Document Link */}
                        {task.document_title && (
                          <span
                            onClick={() => task.document_id && onOpenDocument?.(task.document_id)}
                            className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 cursor-pointer hover:underline truncate max-w-xs"
                          >
                            <Folder className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{task.document_title}</span>
                          </span>
                        )}

                        {/* Merged Sources Badge */}
                        {hasMergedSources && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            Merged ({task.merged_sources?.length} sources)
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <p
                        className={`text-sm font-semibold leading-snug ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-600'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>

                      {/* Description */}
                      {task.description && task.description !== task.title && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Supporting Source Quote Evidence */}
                      {task.source_quote && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                          <div className="flex items-center justify-between mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Quote className="w-3 h-3 text-emerald-500" />
                              <span>Source Evidence Excerpt</span>
                            </span>
                            {task.document_title && (
                              <span
                                onClick={() => task.document_id && onOpenDocument?.(task.document_id)}
                                className="cursor-pointer hover:underline normal-case font-normal text-emerald-600 dark:text-emerald-400"
                              >
                                View Doc
                              </span>
                            )}
                          </div>
                          <p className="italic leading-relaxed">"{task.source_quote}"</p>
                        </div>
                      )}

                      {/* Merged Sources Expandable Section */}
                      {hasMergedSources && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleSourceExpand(task.id)}
                            className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                          >
                            <span>
                              {isSourceExpanded ? 'Hide Merged Origins' : 'View Merged Origins'}
                            </span>
                            {isSourceExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {isSourceExpanded && (
                            <div className="mt-2 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-2 text-xs">
                              {task.merged_sources?.map((s, idx) => (
                                <div key={idx} className="space-y-0.5">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    • {s.original_title}
                                  </span>
                                  <p className="text-[10px] text-slate-400">
                                    From doc: {s.document_title}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Metadata Footer */}
                      <div className="flex items-center gap-5 mt-2.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>{task.assignee || 'Unassigned'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{task.due_date || 'Upcoming'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete action item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Action Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Add New Action Item
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit API error responses"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details or context"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oct 28"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
