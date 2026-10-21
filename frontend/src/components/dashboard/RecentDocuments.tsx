import React from 'react';
import {
  FileText,
  Folder,
  Tag,
  CheckCircle2,
  Trash2,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import type { DocumentListItem } from '../../types';

interface RecentDocumentsProps {
  documents: DocumentListItem[];
  onOpenDocument: (id: string) => void;
  onReprocess: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onViewAll: () => void;
}

export const RecentDocuments: React.FC<RecentDocumentsProps> = ({
  documents,
  onOpenDocument,
  onReprocess,
  onDeleteDocument,
  onViewAll,
}) => {
  if (documents.length === 0) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          No documents processed yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Upload a Markdown, text, or PDF file, or try one of the 1-click samples above to see LazyFlow AI in action!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span>Recent Documents</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Summarized and categorized by your on-device AI agent
          </p>
        </div>

        {documents.length > 3 && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({documents.length})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.slice(0, 6).map((doc) => {
          const completedTasks = doc.action_items_completed;
          const totalTasks = doc.action_items_total;

          return (
            <div
              key={doc.id}
              className="group relative flex flex-col justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-800 p-5 transition-all shadow-xs hover:shadow-md"
            >
              <div>
                {/* Header tags & folder */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md truncate">
                    <Folder className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{doc.suggested_folder || 'Documents'}</span>
                  </div>

                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex-shrink-0">
                    {doc.file_type || '.txt'}
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => onOpenDocument(doc.id)}
                  className="cursor-pointer text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2"
                >
                  {doc.title}
                </h3>

                {/* Summary snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {doc.summary}
                </p>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {doc.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer info & actions */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                {/* Action Items status pill */}
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      totalTasks > 0 && completedTasks === totalTasks
                        ? 'text-emerald-500'
                        : 'text-amber-500'
                    }`}
                  />
                  <span className="font-medium text-[11px]">
                    {totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'No tasks'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onReprocess(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    title="Reprocess with Local AI"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="ml-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
