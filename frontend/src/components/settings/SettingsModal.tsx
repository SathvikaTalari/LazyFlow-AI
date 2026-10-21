import React, { useState } from 'react';
import {
  X,
  Cpu,
  HardDrive,
  ShieldCheck,
  Check,
  AlertCircle,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import type { HealthStatus } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthStatus | null;
  onSwitchModel: (modelName: string) => Promise<void>;
  onRefreshHealth: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  health,
  onSwitchModel,
  onRefreshHealth,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(health?.current_model || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedModel) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await onSwitchModel(selectedModel);
      setMessage({ type: 'success', text: `Switched active model to ${selectedModel}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to switch model' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Local AI & System Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ollama runtime configuration & privacy verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
            }`}
          >
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Ollama Status Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Ollama Local Daemon
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    health?.ollama_connected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      health?.ollama_connected ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span>{health?.ollama_connected ? 'Connected' : 'Offline'}</span>
                </span>

                <button
                  onClick={onRefreshHealth}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title="Refresh Connection"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Endpoint: {health?.ollama_url || 'http://localhost:11434'}
            </p>

            {/* Model Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Active Open-Weight Model
              </label>
              {health?.available_models && health.available_models.length > 0 ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {health.available_models.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === health.current_model ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSave}
                    disabled={isSaving || selectedModel === health.current_model}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors"
                  >
                    {isSaving ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No models detected in Ollama. Run <code className="font-mono bg-black/10 px-1 rounded">ollama run gemma3:4b</code> in your terminal.
                </p>
              )}
            </div>
          </div>

          {/* Quick Terminal Guide */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recommended Open-Weight Models</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pull lightweight models tested for fast on-device inference:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-emerald-300 bg-black/40 p-2.5 rounded-xl">
              <p>ollama pull gemma3:4b</p>
              <p>ollama pull llama3.2</p>
              <p>ollama pull mistral</p>
            </div>
          </div>

          {/* Storage & Privacy Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span>Local SQLite Database</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Database status: {health?.database_ok ? 'Healthy (WAL mode)' : 'Degraded'}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Privacy Guarantee: Zero telemetry or document content leaves this machine.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
