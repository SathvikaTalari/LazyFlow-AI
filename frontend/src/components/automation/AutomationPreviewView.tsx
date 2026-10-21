import React, { useState } from 'react';
import {
  ShieldCheck,
  Folder,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { AutomationProposal } from '../../types';

interface AutomationPreviewViewProps {
  proposals: AutomationProposal[];
  onApply: (actionIds: string[]) => Promise<void>;
  onReject: (actionIds: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
  isApplying: boolean;
}

export const AutomationPreviewView: React.FC<AutomationPreviewViewProps> = ({
  proposals,
  onApply,
  onReject,
  onRefresh,
  isApplying,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const appliedProposals = proposals.filter((p) => p.status === 'applied');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === pendingProposals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingProposals.map((p) => p.id)));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedIds.size === 0) return;
    setMessage(null);
    try {
      await onApply(Array.from(selectedIds));
      setMessage({
        type: 'success',
        text: `Successfully applied ${selectedIds.size} approved file organization action(s).`,
      });
      setSelectedIds(new Set());
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to apply actions' });
    }
  };

  const handleRejectSelected = async () => {
    if (selectedIds.size === 0) return;
    setMessage(null);
    try {
      await onReject(Array.from(selectedIds));
      setMessage({
        type: 'success',
        text: `Dismissed ${selectedIds.size} automation action(s).`,
      });
      setSelectedIds(new Set());
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reject actions' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy & Trust Guarantee Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Safe Automation Preview & Approval</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Zero Surprise Moves
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review suggested folder organization and standardized file renames before committing.
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rescan Workspace</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            🔒 Core Trust Rule:
          </p>
          <p>
            LazyFlow AI will <strong>never</strong> modify, rename, or move files on your computer
            without explicit user approval. Check the proposals below and click "Approve Selected" to execute.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-2xl text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Action Controls Bar */}
      {pendingProposals.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size > 0 && selectedIds.size === pendingProposals.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${pendingProposals.length} selected`
                : 'Select All Proposals'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRejectSelected}
              disabled={isApplying || selectedIds.size === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Dismiss Selected
            </button>

            <button
              onClick={handleApproveSelected}
              disabled={isApplying || selectedIds.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Apply Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="space-y-4">
        {pendingProposals.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              All Files Cleanly Organized
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No pending file organization or rename proposals. When you upload or paste new documents,
              LazyFlow AI will prepare safe organization recommendations here.
            </p>
          </div>
        ) : (
          pendingProposals.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border transition-all ${
                  isSelected
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/50 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Pending Approval
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.document_title}
                        </h3>
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {item.reason}
                      </span>
                    </div>

                    {/* Path comparison breadcrumbs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      {/* Current */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Current Location
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 truncate">
                          📄 {item.current_filename}
                        </p>
                      </div>

                      {/* Proposed */}
                      <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                        <span className="text-[10px] font-sans font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                          Proposed Clean Filing
                        </span>
                        <p className="truncate flex items-center gap-1.5 font-bold">
                          <Folder className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{item.proposed_folder}/</span>
                          <span className="text-emerald-600 dark:text-emerald-400 truncate">
                            {item.proposed_filename}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Applied Audit History */}
      {appliedProposals.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Audit History: Approved & Applied ({appliedProposals.length})</span>
          </h3>

          <div className="space-y-2">
            {appliedProposals.map((ap) => (
              <div
                key={ap.id}
                className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{ap.proposed_folder}/</span>
                  <span className="truncate">{ap.proposed_filename}</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">
                  Applied
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
