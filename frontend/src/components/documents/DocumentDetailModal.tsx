import React, { useState } from 'react';
import {
  X,
  Folder,
  Tag,
  CheckSquare,
  FileText,
  Clock,
  Cpu,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Calendar,
  Sparkles,
  Quote,
} from 'lucide-react';
import type { DocumentDetail } from '../../types';

interface DocumentDetailModalProps {
  document: DocumentDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onReprocess: (docId: string) => Promise<void>;
  onRetry?: (docId: string) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  isReprocessing: boolean;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  isOpen,
  onClose,
  onToggleTask,
  onReprocess,
  onRetry,
  onDelete,
  isReprocessing,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'raw'>('summary');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const handleCopyMarkdown = () => {
    let md = `# ${document.title}\n\n`;
    md += `**Suggested Folder:** ${document.suggested_folder || 'Documents'}\n`;
    md += `**Processed With:** ${document.model_used || 'Local AI'}\n\n`;
    md += `## Executive Summary\n${document.summary}\n\n`;
    
    if (document.key_points && document.key_points.length > 0) {
      md += `## Key Takeaways\n`;
      document.key_points.forEach((kp) => {
        md += `- ${kp}\n`;
      });
      md += `\n`;
    }

    if (document.action_items && document.action_items.length > 0) {
      md += `## Action Items\n`;
      document.action_items.forEach((item) => {
        const check = item.completed ? '[x]' : '[ ]';
        md += `- ${check} **${item.title}** (Priority: ${item.priority}, Assignee: ${item.assignee || 'Unassigned'}, Due: ${item.due_date || 'TBD'})\n`;
        if (item.source_quote) {
          md += `  > Source Quote: "${item.source_quote}"\n`;
        }
      });
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const priorityBadge: Record<string, string> = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Folder className="w-3.5 h-3.5" />
                <span>{document.suggested_folder || 'Documents'}</span>
              </span>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {document.original_filename || document.file_type}
              </span>

              {document.sentiment && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {document.sentiment}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {document.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar and Tab Switcher */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'summary'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Executive Summary & Tasks
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'raw'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Original Raw Document
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Copy Summary & Action Plan to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Plan'}</span>
            </button>

            <button
              onClick={() => onReprocess(document.id)}
              disabled={isReprocessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Reprocess with local Ollama"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin text-emerald-500' : ''}`} />
              <span>{isReprocessing ? 'Analyzing...' : 'Reprocess'}</span>
            </button>

            {onRetry && (
              <button
                onClick={() => onRetry(document.id)}
                disabled={isReprocessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                title="Retry processing with clean AI prompt"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}

            <button
              onClick={() => onDelete(document.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'summary' ? (
            <>
              {/* Executive Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Executive Summary</span>
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {document.summary}
                </p>
              </div>

              {/* Key Takeaways */}
              {document.key_points && document.key_points.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    Key Discussion Points & Findings
                  </h3>
                  <ul className="space-y-2">
                    {document.key_points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items List with Source Evidence & Deadline Intel */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                    <span>Structured Action Items ({document.action_items.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {document.action_items.filter((a) => a.completed).length} completed
                  </span>
                </div>

                {document.action_items.length === 0 ? (
                  <p className="text-xs text-slate-400">No action items identified for this document.</p>
                ) : (
                  <div className="space-y-3">
                    {document.action_items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => onToggleTask(item.id, e.target.checked)}
                            className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                  priorityBadge[item.priority] || priorityBadge.medium
                                }`}
                              >
                                {item.priority}
                              </span>

                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {item.is_explicit_date ? (
                                  <Calendar className="w-2.5 h-2.5" />
                                ) : (
                                  <Sparkles className="w-2.5 h-2.5" />
                                )}
                                <span>{item.badge_text || item.due_date}</span>
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                              {item.title}
                            </p>

                            {item.description && item.description !== item.title && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.description}
                              </p>
                            )}

                            {/* Supporting Source Quote Evidence */}
                            {item.source_quote && (
                              <div className="mt-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  <Quote className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>Document Evidence Excerpt</span>
                                </span>
                                <p className="italic">"{item.source_quote}"</p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                              <span>Assignee: {item.assignee || 'Unassigned'}</span>
                              <span>Due: {item.due_date || 'Upcoming'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags & Folder Suggestion Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Suggested File Organization</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    📂 {document.suggested_folder || 'Documents/General'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Automatically mapped based on topic, date, and document context.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Categorization Tags</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {document.tags && document.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Raw Original Content View */
            <div className="rounded-2xl bg-slate-900 text-slate-200 p-5 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {document.raw_content}
            </div>
          )}
        </div>

        {/* Footer info metadata */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span>Model: {document.model_used || 'Local AI'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Processed in {(document.processing_time_ms / 1000).toFixed(1)}s</span>
            </span>
            <span>Size: {(document.file_size / 1024).toFixed(1)} KB</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
