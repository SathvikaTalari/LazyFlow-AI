import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, ClipboardList, Sparkles, AlertCircle } from 'lucide-react';
import type { SampleDoc } from '../../types';

interface QuickUploadProps {
  onUploadFile: (file: File, customTitle?: string) => Promise<void>;
  onPasteText: (content: string, title?: string) => Promise<void>;
  onSelectSample: (sampleId: string) => Promise<void>;
  samples: SampleDoc[];
  isProcessing: boolean;
}

export const QuickUpload: React.FC<QuickUploadProps> = ({
  onUploadFile,
  onPasteText,
  onSelectSample,
  samples,
  isProcessing,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sample'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage('');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      try {
        await onUploadFile(files[0], customTitle);
        setCustomTitle('');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to upload document');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        await onUploadFile(files[0], customTitle);
        setCustomTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to upload document');
      }
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteContent.trim()) {
      setErrorMessage('Please paste or type some text first.');
      return;
    }
    setErrorMessage('');
    try {
      await onPasteText(pasteContent, customTitle || undefined);
      setPasteContent('');
      setCustomTitle('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze text');
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span>Process New Document</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Summarize content, extract action items, and organize files locally.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>File Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Text</span>
          </button>

          <button
            onClick={() => setActiveTab('sample')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sample'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Try Sample</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab 1: Upload */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Optional: Custom document title (e.g. Q4 Executive Briefing)"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[0.99]'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/50 dark:bg-slate-800/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.pdf,.docx,.json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag & Drop your document here, or <span className="text-emerald-600 dark:text-emerald-400 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports Markdown (.md), Text (.txt), PDF (.pdf), Word (.docx), JSON (.json), CSV (.csv)
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Paste */}
      {activeTab === 'paste' && (
        <form onSubmit={handlePasteSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Document title (e.g. Team Standup Notes)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />

          <textarea
            rows={5}
            placeholder="Paste your meeting transcript, spec sheet, email thread, or action plan here..."
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            className="w-full p-4 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none font-mono"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {pasteContent.length} characters
            </span>
            <button
              type="submit"
              disabled={isProcessing || !pasteContent.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze with Local AI</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Sample Documents */}
      {activeTab === 'sample' && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Click any pre-configured sample to immediately test the local Ollama summarization and task extraction pipeline:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {samples.map((sample) => (
              <div
                key={sample.id}
                onClick={() => onSelectSample(sample.id)}
                className="cursor-pointer group p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {sample.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sample.file_type}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {sample.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {sample.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
