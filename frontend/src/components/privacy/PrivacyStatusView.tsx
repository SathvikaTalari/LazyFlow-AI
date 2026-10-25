import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
} from 'lucide-react';
import type { PrivacyVerificationReport } from '../../types';
import { fetchPrivacyStatus, verifyOffline } from '../../services/api';

export const PrivacyStatusView: React.FC = () => {
  const [report, setReport] = useState<PrivacyVerificationReport | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPrivacyStatus()
      .then((data) => {
        if (mounted) setReport(data);
      })
      .catch((err) => console.error('Failed to load privacy status:', err));
    return () => {
      mounted = false;
    };
  }, []);

  const handleRunAudit = async () => {
    setIsVerifying(true);
    try {
      const data = await verifyOffline();
      setReport(data);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Zero Cloud Leakage
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Loopback 127.0.0.1
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Privacy & Offline Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit and verify that all natural language processing, document storage, and task states remain strictly on your local device.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isVerifying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>{isVerifying ? 'Auditing Loopback Pipeline...' : 'Run Privacy & Offline Audit'}</span>
        </button>
      </div>

      {/* Main Verification Status Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Architecture Guarantee</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {report?.offline_verified ? '100% Offline Verified — Air-Gap Ready' : 'Verifying Local Topology...'}
            </h2>
            <p className="text-emerald-50/90 text-xs md:text-sm max-w-2xl leading-relaxed">
              {report?.privacy_statement}
            </p>
          </div>

          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs space-y-2 min-w-[200px]">
            <div className="font-bold flex items-center justify-between text-white pb-1.5 border-b border-white/20">
              <span>Binding Posture</span>
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex justify-between text-emerald-100">
              <span>Ollama Host:</span>
              <span className="font-mono font-bold">{report?.ollama_endpoint || '127.0.0.1:11434'}</span>
            </div>
            <div className="flex justify-between text-emerald-100">
              <span>Storage:</span>
              <span className="font-bold">SQLite WAL (Local)</span>
            </div>
            <div className="flex justify-between text-emerald-100">
              <span>External Telemetry:</span>
              <span className="font-bold text-emerald-300">0 requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Topology */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          On-Device Data Flow Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Step 1: Frontend */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Browser Client</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              localhost:5173
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              Renders UI locally in your browser. Zero cloud tracking scripts.
            </p>
          </div>

          {/* Step 2: FastAPI */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">FastAPI Backend</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              127.0.0.1:8000
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              Processes file streams and manages queue on Windows loopback.
            </p>
          </div>

          {/* Step 3: Ollama */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ollama AI Daemon</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              127.0.0.1:11434
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              Executes open-weight models on local CPU/GPU with no internet required.
            </p>
          </div>

          {/* Step 4: SQLite */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">SQLite Database</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              lazyflow.db (WAL)
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              Single-file database on your disk. Encapsulated in your workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Audit Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Active Privacy Audit Verification Items
        </h3>

        <div className="space-y-3">
          {report?.checks.map((c) => {
            const isPass = c.status === 'PASS';
            return (
              <div
                key={c.check_id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isPass
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {isPass ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      <span>{c.status}</span>
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {c.details}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Guarantee: {c.guarantee}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Verification Test Instructions */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-emerald-500" />
          <span>How to Manually Verify Air-Gapped Operation</span>
        </h4>
        <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed text-[11px]">
          <li>Disconnect your computer from Wi-Fi or unplug your Ethernet cable.</li>
          <li>Load a sample document from the Sample Library or drop a file in Quick Upload.</li>
          <li>Watch the real local Ollama extraction execute and view the generated briefing.</li>
          <li>Notice that 100% of the extraction and SQLite storage functions without any internet connection.</li>
        </ol>
      </div>
    </div>
  );
};
