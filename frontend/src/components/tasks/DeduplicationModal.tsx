import React, { useState } from 'react';
import { X, Sparkles, Merge, CheckCircle2 } from 'lucide-react';
import type { DuplicateCluster } from '../../types';

interface DeduplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: DuplicateCluster[];
  onMerge: (primaryId: string, duplicateIds: string[]) => Promise<void>;
}

export const DeduplicationModal: React.FC<DeduplicationModalProps> = ({
  isOpen,
  onClose,
  clusters,
  onMerge,
}) => {
  const [mergingClusterId, setMergingClusterId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMergeCluster = async (cluster: DuplicateCluster) => {
    setMergingClusterId(cluster.cluster_id);
    try {
      const primaryId = cluster.suggested_primary_id;
      const dupIds = cluster.tasks.map((t) => t.id).filter((id) => id !== primaryId);
      await onMerge(primaryId, dupIds);
    } finally {
      setMergingClusterId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Merge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Smart Task Deduplication</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {clusters.length} Cluster(s)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cross-document deliverable correlation and unified merge suggestions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational callout */}
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-200/60 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span>
            Merging consolidates duplicate action items while retaining all original document citations and quotes.
          </span>
        </div>

        {/* Scrollable Cluster List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {clusters.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Duplicate Tasks Found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Your action items across documents are distinct and cleanly separated.
              </p>
            </div>
          ) : (
            clusters.map((cluster) => {
              const isMerging = mergingClusterId === cluster.cluster_id;
              const primary = cluster.tasks.find((t) => t.id === cluster.suggested_primary_id) || cluster.tasks[0];
              const duplicates = cluster.tasks.filter((t) => t.id !== primary.id);

              return (
                <div
                  key={cluster.cluster_id}
                  className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {Math.round(cluster.similarity_score * 100)}% Match
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {cluster.reason}
                      </span>
                    </div>

                    <button
                      onClick={() => handleMergeCluster(cluster)}
                      disabled={isMerging}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-40"
                    >
                      <Merge className="w-3.5 h-3.5" />
                      <span>{isMerging ? 'Merging...' : 'Merge into Primary'}</span>
                    </button>
                  </div>

                  {/* Tasks Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Primary Task */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-xs relative">
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Primary Keep
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                        Source: {primary.document_title || 'Document'}
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {primary.title}
                      </p>
                      {primary.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {primary.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
                        <span>Priority: {primary.priority}</span>
                        <span>Assignee: {primary.assignee}</span>
                        <span>Due: {primary.due_date}</span>
                      </div>
                    </div>

                    {/* Duplicate Task(s) */}
                    {duplicates.map((dup) => (
                      <div
                        key={dup.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative opacity-80"
                      >
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          To be merged
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Source: {dup.document_title || 'Document'}
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {dup.title}
                        </p>
                        {dup.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {dup.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
                          <span>Priority: {dup.priority}</span>
                          <span>Assignee: {dup.assignee}</span>
                          <span>Due: {dup.due_date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
