import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Folder,
  CheckCircle2,
  Trash2,
  RotateCw,
} from 'lucide-react';
import type { DocumentListItem } from '../../types';

interface DocumentListViewProps {
  documents: DocumentListItem[];
  onOpenDocument: (id: string) => void;
  onReprocess: (id: string) => void;
  onRetry?: (id: string) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  onOpenDocument,
  onReprocess,
  onRetry: _onRetry,
  onDeleteDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'tasks'>('newest');

  // Extract unique folders
  const folders = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.suggested_folder) set.add(d.suggested_folder);
    });
    return Array.from(set);
  }, [documents]);

  // Filter and sort
  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const matchesSearch =
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFolder =
          selectedFolder === 'all' || doc.suggested_folder === selectedFolder;

        return matchesSearch && matchesFolder;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'tasks') {
          return b.action_items_total - a.action_items_total;
        }
        return 0;
      });
  }, [documents, searchQuery, selectedFolder, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title, tags, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Folder filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-1 md:flex-none">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Folders ({documents.length})</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="tasks">Most Action Items</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No matching documents found
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search terms or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 p-5 shadow-xs hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md truncate flex items-center gap-1.5">
                    <Folder className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{doc.suggested_folder || 'Documents'}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {doc.file_type}
                  </span>
                </div>

                <h3
                  onClick={() => onOpenDocument(doc.id)}
                  className="cursor-pointer text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2"
                >
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {doc.summary}
                </p>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {doc.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {doc.action_items_completed}/{doc.action_items_total} tasks
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onReprocess(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="Reprocess"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="ml-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
