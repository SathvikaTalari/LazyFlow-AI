import React from 'react';
import { Sun, Moon, Settings, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { HealthStatus } from '../../types';

interface HeaderProps {
  health: HealthStatus | null;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onOpenSettings,
  onRefresh,
  isRefreshing = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3.5 transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative group flex items-center gap-2.5">
          <img
            src="/mascot.jpg"
            alt="LazyFlow Sloth"
            className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-emerald-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                LazyFlow <span className="text-emerald-500 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Local Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Private On-Device AI
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Ollama Connection Pill */}
        <div
          onClick={onOpenSettings}
          className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            health?.ollama_connected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:border-amber-400'
          }`}
          title="Click to view Ollama settings and models"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health?.ollama_connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                health?.ollama_connected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <Cpu className="w-3.5 h-3.5 opacity-80" />
          <span className="font-semibold">
            {health?.ollama_connected
              ? health.current_model || 'Ollama Online'
              : 'Ollama Offline'}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 hidden md:inline">
            Local
          </span>
        </div>

        {/* Database Stats Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
          <HardDrive className="w-3.5 h-3.5 opacity-70 text-indigo-500" />
          <span>SQLite:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {health?.documents_count ?? 0} docs
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Open AI Model & System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
