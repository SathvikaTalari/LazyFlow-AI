import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Play,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import type { SampleDoc, ModelComparisonResult } from '../../types';
import { compareModels, fetchComparisonHistory } from '../../services/api';

interface ModelComparisonViewProps {
  samples: SampleDoc[];
  availableModels: string[];
  currentModel?: string;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  samples,
  availableModels,
  currentModel: _currentModel,
}) => {
  // Ensure we have two distinct defaults if possible
  const defaultA = availableModels[0] || 'gemma3:4b';
  const defaultB = availableModels.length > 1 ? availableModels[1] : availableModels[0] || 'gemma3:focused';

  const [modelA, setModelA] = useState(defaultA);
  const [modelB, setModelB] = useState(defaultB);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(samples[0]?.id || 'roadmap-meeting');
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<ModelComparisonResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (availableModels.length > 0) {
      if (!modelA || !availableModels.includes(modelA)) setModelA(availableModels[0]);
      if (!modelB || !availableModels.includes(modelB)) {
        setModelB(availableModels.length > 1 ? availableModels[1] : availableModels[0]);
      }
    }
  }, [availableModels]);

  const loadHistory = async () => {
    try {
      const hist = await fetchComparisonHistory();
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load comparison history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRunComparison = async () => {
    if (!modelA || !modelB) return;
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const res = await compareModels({
        model_a: modelA,
        model_b: modelB,
        sample_id: useCustomText ? undefined : selectedSampleId,
        content: useCustomText ? customText : undefined,
        title: useCustomText ? 'Custom Document' : undefined,
      });
      setCurrentResult(res);
      await loadHistory();
    } catch (err: any) {
      console.error('Comparison failed:', err);
      setErrorMsg(err.message || 'Comparison failed. Verify local Ollama service.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            Model Evaluation
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            Practical Comparison
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Local Model Comparison
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Run the exact same document through two installed Ollama models to compare real-world latency, extraction completeness, and schema validity.
        </p>
      </div>

      {/* Prominent Practical Comparison Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">⚠️ Practical Comparison Notice (Not a Scientific Benchmark)</p>
          <p className="leading-relaxed text-[11px] text-amber-800 dark:text-amber-300">
            This side-by-side evaluation reflects practical, on-device execution on your current local hardware
            and background load. It is designed to help you select the best local model for your workflow, not as an
            academic benchmark. Performance varies with local RAM/VRAM, temperature, and quantization.
          </p>
        </div>
      </div>

      {/* Setup & Selection Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-500" />
          <span>Select Comparison Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model A */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Model A (Baseline)
            </label>
            <select
              value={modelA}
              onChange={(e) => setModelA(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Model B */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Model B (Candidate)
            </label>
            <select
              value={modelB}
              onChange={(e) => setModelB(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Document Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Sample Document</span>
            <button
              onClick={() => setUseCustomText(!useCustomText)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {useCustomText ? 'Use Preloaded Sample' : 'Paste Custom Text'}
            </button>
          </div>

          {!useCustomText ? (
            <select
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.category})
                </option>
              ))}
            </select>
          ) : (
            <textarea
              placeholder="Paste text to compare across models..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunComparison}
            disabled={isRunning || !modelA || !modelB}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Side-by-Side Comparison...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Practical Comparison</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Results Card */}
      {currentResult && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          {/* Comparison Header Summary */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Evaluation Outcome: {currentResult.sample_title}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {currentResult.faster_model}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Extraction density: {currentResult.more_action_items_model}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-center">
                <span className="block text-[10px] text-slate-400">Difference</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentResult.latency_difference_ms}ms
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model A Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Model A</span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {currentResult.model_a}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {currentResult.model_a_metrics.latency_ms}ms
                  </span>
                  <span className="block text-[10px] text-slate-400">Latency</span>
                </div>
              </div>

              {/* Schema & Completeness Score */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400">Schema Valid</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {currentResult.model_a_metrics.schema_valid ? '100% Valid' : 'Partial'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400">Words</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentResult.model_a_metrics.summary_word_count}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400">Action Items</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentResult.model_a_metrics.action_items_count}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Executive Summary
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                  {currentResult.model_a_result.summary}
                </p>
              </div>

              {/* Extracted Deliverables */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Extracted Deliverables ({currentResult.model_a_metrics.action_items_count})
                </span>
                <div className="space-y-2">
                  {currentResult.model_a_result.action_items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-red-500">
                          {item.priority}
                        </span>
                      </div>
                      {item.source_quote && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-1">
                          &ldquo;{item.source_quote}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Model B Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Model B</span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {currentResult.model_b}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {currentResult.model_b_metrics.latency_ms}ms
                  </span>
                  <span className="block text-[10px] text-slate-400">Latency</span>
                </div>
              </div>

              {/* Schema & Completeness Score */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400">Schema Valid</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {currentResult.model_b_metrics.schema_valid ? '100% Valid' : 'Partial'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400">Words</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentResult.model_b_metrics.summary_word_count}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400">Action Items</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentResult.model_b_metrics.action_items_count}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Executive Summary
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                  {currentResult.model_b_result.summary}
                </p>
              </div>

              {/* Extracted Deliverables */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Extracted Deliverables ({currentResult.model_b_metrics.action_items_count})
                </span>
                <div className="space-y-2">
                  {currentResult.model_b_result.action_items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-red-500">
                          {item.priority}
                        </span>
                      </div>
                      {item.source_quote && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-1">
                          &ldquo;{item.source_quote}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Comparison History ({history.length})
          </h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {h.sample_title}
                  </span>
                  <span className="text-slate-400 ml-2 font-mono">
                    {h.model_a} vs {h.model_b}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {h.model_a_metrics?.latency_ms}ms vs {h.model_b_metrics?.latency_ms}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
