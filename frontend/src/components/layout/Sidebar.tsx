import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Sparkles,
  FolderOpen,
  ShieldCheck,
  Zap,
  Calendar,
  FolderSync,
  TrendingUp,
  Layers,
  GitCompare,
  Coffee,
  PlayCircle,
  Lock,
} from 'lucide-react';

export type NavTab =
  | 'workflow'
  | 'briefing'
  | 'insights'
  | 'queue'
  | 'comparison'
  | 'privacy'
  | 'dashboard'
  | 'documents'
  | 'tasks'
  | 'automation'
  | 'digest'
  | 'samples';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  documentsCount: number;
  pendingTasksCount: number;
  overdueCount?: number;
  proposalsCount?: number;
  queueCount?: number;
  onOpenDemo?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  documentsCount,
  pendingTasksCount,
  overdueCount = 0,
  proposalsCount = 0,
  queueCount = 0,
  onOpenDemo,
}) => {
  const mainWorkspaceItems = [
    {
      id: 'workflow' as NavTab,
      label: 'Daily Flow',
      icon: Calendar,
      badge: overdueCount > 0 ? `${overdueCount} overdue` : 'Today',
      badgeColor:
        overdueCount > 0
          ? 'bg-red-500/20 text-red-600 dark:text-red-400'
          : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'briefing' as NavTab,
      label: 'Smart Briefing',
      icon: Coffee,
      badge: 'AI Morning',
      badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'insights' as NavTab,
      label: 'AI Insights',
      icon: TrendingUp,
      badge: 'Impact',
      badgeColor: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
    },
    {
      id: 'queue' as NavTab,
      label: 'Batch Queue',
      icon: Layers,
      badge: queueCount > 0 ? queueCount : null,
      badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'comparison' as NavTab,
      label: 'Model Compare',
      icon: GitCompare,
      badge: 'Bench',
      badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'privacy' as NavTab,
      label: 'Privacy & Offline',
      icon: Lock,
      badge: 'Verified',
      badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const standardItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'documents' as NavTab,
      label: 'Documents',
      icon: FileText,
      badge: documentsCount > 0 ? documentsCount : null,
    },
    {
      id: 'tasks' as NavTab,
      label: 'Action Items',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'automation' as NavTab,
      label: 'Safe Automation',
      icon: FolderSync,
      badge: proposalsCount > 0 ? `${proposalsCount} review` : null,
      badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'digest' as NavTab,
      label: 'Daily Digest',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'samples' as NavTab,
      label: 'Sample Library',
      icon: FolderOpen,
      badge: 'Demo',
      badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    },
  ];

  const renderNavButton = (item: any) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
          isActive
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            className={`w-4 h-4 ${
              isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
            }`}
          />
          <span>{item.label}</span>
        </div>
        {item.badge !== null && item.badge !== undefined && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              item.badgeColor ||
              'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-3.5 transition-colors overflow-y-auto">
      <div>
        {/* Interactive Guided Walkthrough Banner */}
        {onOpenDemo && (
          <div className="mb-4">
            <button
              onClick={onOpenDemo}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-xs hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 fill-white/20" />
                <span>Guided Demo Mode</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 uppercase tracking-wider font-extrabold">
                Tour
              </span>
            </button>
          </div>
        )}

        {/* Phase 3 Autonomous Features */}
        <div className="space-y-1 mb-4">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Phase 3: Autonomous AI
          </p>
          {mainWorkspaceItems.map(renderNavButton)}
        </div>

        {/* Core Documents & Tasks */}
        <div className="space-y-1 mb-4">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Workspace Tools
          </p>
          {standardItems.map(renderNavButton)}
        </div>

        {/* Zero Cloud Leakage */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero Cloud Leakage</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            All AI runs on localhost:11434. SQLite database stores data strictly on your device.
          </p>
        </div>
      </div>

      {/* Footer challenge badge */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
              Hacktoberfest 2026
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Phase 3: Impact & Autonomy
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

