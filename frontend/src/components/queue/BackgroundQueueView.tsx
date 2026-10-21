import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  XCircle,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { QueueItem, SampleDoc } from '../../types';
import {
  fetchQueue,
  batchEnqueueSamples,
  enqueueDocument,
  retryQueueItem,
  cancelQueueItem,
  deleteQueueItem,
  clearCompletedQueue,
} from '../../services/api';

interface BackgroundQueueViewProps {
  samples: SampleDoc[];
  onOpenDocument?: (docId: string) => void;
  onRefreshDocs?: () => Promise<void>;
  currentModel?: string;
}

export const BackgroundQueueView: React.FC<BackgroundQueueViewProps> = ({
  samples,
  onOpenDocument,
  onRefreshDocs,
  currentModel: _currentModel,
}) => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [isEnqueueing, setIsEnqueueing] = useState(false);

  // Custom document paste tab
  const [showPasteForm, setShowPasteForm] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');

  const loadQueue = async () => {
    try {
      const items = await fetchQueue();
      setQueueItems(items);
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  };

  useEffect(() => {
    loadQueue();
    // Poll every 2.5 seconds if any item is active
    const interval = setInterval(() => {
      const hasActive = queueItems.some((i) => i.status === 'queued' || i.status === 'processing');
      if (hasActive) {
        loadQueue();
        onRefreshDocs?.();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [queueItems.length, queueItems.map((i) => i.status).join(',')]);

  const handleToggleSampleSelect = (id: string) => {
    setSelectedSamples((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllSamples = () => {
    if (selectedSamples.length === samples.length) {
      setSelectedSamples([]);
    } else {
      setSelectedSamples(samples.map((s) => s.id));
    }
  };

  const handleBatchEnqueue = async () => {
    if (selectedSamples.length === 0) return;
    setIsEnqueueing(true);
    try {
      await batchEnqueueSamples(selectedSamples);
      setSelectedSamples([]);
      await loadQueue();
    } catch (err) {
      console.error('Failed to batch enqueue:', err);
      alert('Failed to enqueue sample documents.');
    } finally {
      setIsEnqueueing(false);
    }
  };

  const handleEnqueueCustom = async () => {
    if (!pasteContent.trim()) return;
    setIsEnqueueing(true);
    try {
      await enqueueDocument(
        pasteTitle.trim() || 'Custom Document',
        pasteContent.trim(),
        `${pasteTitle.trim() || 'Custom'}.txt`
      );
      setPasteTitle('');
      setPasteContent('');
      setShowPasteForm(false);
      await loadQueue();
    } catch (err) {
      console.error('Failed to enqueue custom doc:', err);
      alert('Failed to enqueue document.');
    } finally {
      setIsEnqueueing(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryQueueItem(id);
      await loadQueue();
    } catch (err) {
      console.error('Failed to retry item:', err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelQueueItem(id);
      await loadQueue();
    } catch (err) {
      console.error('Failed to cancel item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQueueItem(id);
      setQueueItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompletedQueue();
      await loadQueue();
    } catch (err) {
      console.error('Failed to clear completed items:', err);
    }
  };

  const activeCount = queueItems.filter((i) => i.status === 'processing').length;
  const queuedCount = queueItems.filter((i) => i.status === 'queued').length;
  const completedCount = queueItems.filter((i) => i.status === 'completed').length;
  const failedCount = queueItems.filter((i) => i.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Local Background Queue
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Crash-Recoverable
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Document Ingestion & Background Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enqueue multiple documents for local AI processing with live progress, retry, cancellation, and restart recovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs transition-colors"
            >
              Clear Completed ({completedCount})
            </button>
          )}

          <button
            onClick={() => loadQueue()}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Stat Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queued</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{queuedCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-2">
            <span>{activeCount}</span>
            {activeCount > 0 && <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed / Interrupted</div>
          <div className={`text-2xl font-black mt-1 ${failedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
            {failedCount}
          </div>
        </div>
      </div>

      {/* Batch Ingestion Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Multi-Document Batch Ingestion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select preloaded samples or paste a custom text document to process sequentially.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasteForm(!showPasteForm)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {showPasteForm ? 'Hide Paste Form' : 'Paste Custom Document'}
            </button>
          </div>
        </div>

        {/* Custom Document Form */}
        {showPasteForm && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <input
              type="text"
              placeholder="Document Title (e.g. Sprint 14 Retrospective)"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <textarea
              placeholder="Paste document content, meeting notes, or specs here..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-y"
            />
            <button
              onClick={handleEnqueueCustom}
              disabled={isEnqueueing || !pasteContent.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
            >
              Enqueue Custom Document
            </button>
          </div>
        )}

        {/* Sample Selection Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Select Samples to Batch Process:</span>
            <button
              onClick={handleSelectAllSamples}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {selectedSamples.length === samples.length ? 'Deselect All' : 'Select All Samples'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {samples.map((s) => {
              const isSelected = selectedSamples.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => handleToggleSampleSelect(s.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {s.category}
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded-md text-emerald-600 pointer-events-none"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>

          {selectedSamples.length > 0 && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleBatchEnqueue}
                disabled={isEnqueueing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {isEnqueueing ? 'Enqueuing...' : `Enqueue ${selectedSamples.length} Selected Document(s)`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Queue Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Queue Status & History ({queueItems.length})
        </h3>

        {queueItems.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
            No documents in queue. Select sample documents above to start batch processing.
          </div>
        ) : (
          <div className="space-y-3">
            {queueItems.map((item) => {
              const isProcessing = item.status === 'processing';
              const isCompleted = item.status === 'completed';
              const isFailed = item.status === 'failed';
              const isCancelled = item.status === 'cancelled';
              const isQueued = item.status === 'queued';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : isProcessing
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                            : isQueued
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                            : isFailed
                            ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                            : 'bg-slate-500/15 text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                        {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {isQueued && <Clock className="w-3 h-3" />}
                        {isFailed && <AlertTriangle className="w-3 h-3" />}
                        {isCancelled && <XCircle className="w-3 h-3" />}
                        <span>{item.status}</span>
                      </span>

                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {item.original_filename}
                      </span>

                      {item.model_used && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                          {item.model_used}
                        </span>
                      )}

                      {item.processing_time_ms > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {item.processing_time_ms}ms
                        </span>
                      )}

                      {item.retry_count > 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          (Retried {item.retry_count}x)
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>

                    {/* Error message / restart indicator */}
                    {item.error_message && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.error_message}</span>
                      </p>
                    )}

                    {/* Progress Bar */}
                    {(isProcessing || isQueued) && (
                      <div className="w-full max-w-md bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(item.progress, 15)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(isFailed || isCancelled) && (
                      <button
                        onClick={() => handleRetry(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                        title="Retry processing"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    )}

                    {(isQueued || isProcessing) && (
                      <button
                        onClick={() => handleCancel(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                        title="Cancel processing"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {isCompleted && item.document_id && onOpenDocument && (
                      <button
                        onClick={() => onOpenDocument(item.document_id!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold text-xs hover:bg-emerald-100 transition-colors"
                      >
                        <span>Open Doc</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
