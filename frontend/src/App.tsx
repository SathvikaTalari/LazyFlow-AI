import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import type { NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { SlothBanner } from './components/layout/SlothBanner';
import { MetricCards } from './components/dashboard/MetricCards';
import { QuickUpload } from './components/dashboard/QuickUpload';
import { RecentDocuments } from './components/dashboard/RecentDocuments';
import { UrgentTasks } from './components/dashboard/UrgentTasks';
import { ProcessingModal } from './components/dashboard/ProcessingModal';
import { DocumentDetailModal } from './components/documents/DocumentDetailModal';
import { DocumentListView } from './components/documents/DocumentListView';
import { TaskManagerView } from './components/tasks/TaskManagerView';
import { DailyDigestView } from './components/digest/DailyDigestView';
import { SampleLibraryView } from './components/samples/SampleLibraryModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { DailyWorkflowView } from './components/workflow/DailyWorkflowView';
import { AutomationPreviewView } from './components/automation/AutomationPreviewView';
import { DeduplicationModal } from './components/tasks/DeduplicationModal';

// Phase 3 Components
import { SmartBriefingView } from './components/briefing/SmartBriefingView';
import { ProductivityInsightsView } from './components/insights/ProductivityInsightsView';
import { BackgroundQueueView } from './components/queue/BackgroundQueueView';
import { ModelComparisonView } from './components/comparison/ModelComparisonView';
import { PrivacyStatusView } from './components/privacy/PrivacyStatusView';
import { GuidedDemoModal } from './components/demo/GuidedDemoModal';

import type {
  HealthStatus,
  DocumentListItem,
  DocumentDetail,
  ActionItem,
  DailyDigest,
  SampleDoc,
  Priority,
  DailyWorkflow,
  DuplicateCluster,
  AutomationProposal,
  SmartBriefing,
  ProductivityInsights,
  QueueItem,
} from './types';
import {
  fetchHealth,
  fetchDocuments,
  fetchDocument,
  uploadDocument,
  pasteDocument,
  loadSampleDocument,
  reprocessDocument,
  retryDocument,
  deleteDocument,
  fetchActionItems,
  updateActionItem,
  createActionItem,
  deleteActionItem,
  fetchTodayDigest,
  generateDailyDigest,
  switchModel,
  fetchSamples,
  fetchDailyWorkflow,
  fetchDuplicates,
  mergeTasks,
  fetchAutomationProposals,
  applyAutomation,
  rejectAutomation,
  fetchQueue,
  fetchProductivityInsights,
  fetchSmartBriefing,
  generateSmartBriefing,
} from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [samples, setSamples] = useState<SampleDoc[]>([]);

  // Phase 2 state
  const [workflow, setWorkflow] = useState<DailyWorkflow | null>(null);
  const [duplicateClusters, setDuplicateClusters] = useState<DuplicateCluster[]>([]);
  const [automationProposals, setAutomationProposals] = useState<AutomationProposal[]>([]);
  const [isDeduplicationOpen, setIsDeduplicationOpen] = useState(false);
  const [isApplyingAutomation, setIsApplyingAutomation] = useState(false);

  // Phase 3 state
  const [briefing, setBriefing] = useState<SmartBriefing | null>(null);
  const [insights, setInsights] = useState<ProductivityInsights | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  // Modals state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocDetail, setSelectedDocDetail] = useState<DocumentDetail | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTitle, setProcessingTitle] = useState('');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [h, docs, t, d, s, wf, dupRes, proposals, brf, ins, q] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchDocuments().catch(() => []),
        fetchActionItems().catch(() => []),
        fetchTodayDigest().catch(() => null),
        fetchSamples().catch(() => []),
        fetchDailyWorkflow().catch(() => null),
        fetchDuplicates().catch(() => ({ count: 0, clusters: [] })),
        fetchAutomationProposals().catch(() => []),
        fetchSmartBriefing().catch(() => null),
        fetchProductivityInsights().catch(() => null),
        fetchQueue().catch(() => []),
      ]);

      if (h) setHealth(h);
      setDocuments(docs);
      setTasks(t);
      if (d) setDigest(d);
      setSamples(s);
      if (wf) setWorkflow(wf);
      setDuplicateClusters(dupRes?.clusters || []);
      setAutomationProposals(proposals || []);
      if (brf) setBriefing(brf);
      if (ins) setInsights(ins);
      setQueue(q || []);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleRegenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const b = await generateSmartBriefing();
      setBriefing(b);
    } catch (err) {
      console.error('Failed to regenerate briefing:', err);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Document Detail
  const handleOpenDocument = async (id: string) => {
    try {
      const doc = await fetchDocument(id);
      setSelectedDocDetail(doc);
      setSelectedDocId(id);
    } catch (err) {
      console.error('Failed to fetch document detail:', err);
    }
  };

  // Upload file
  const handleUploadFile = async (file: File, customTitle?: string) => {
    setIsProcessing(true);
    setProcessingTitle(customTitle || file.name);
    try {
      const doc = await uploadDocument(file, customTitle);
      await loadData();
      setSelectedDocDetail(doc);
      setSelectedDocId(doc.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Paste text
  const handlePasteText = async (content: string, title?: string) => {
    setIsProcessing(true);
    setProcessingTitle(title || 'Pasted Document');
    try {
      const doc = await pasteDocument(content, title);
      await loadData();
      setSelectedDocDetail(doc);
      setSelectedDocId(doc.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Sample selection
  const handleSelectSample = async (sampleId: string) => {
    const s = samples.find((x) => x.id === sampleId);
    setIsProcessing(true);
    setProcessingTitle(s?.title || 'Sample Document');
    try {
      const doc = await loadSampleDocument(sampleId);
      await loadData();
      setSelectedDocDetail(doc);
      setSelectedDocId(doc.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reprocess document
  const handleReprocess = async (docId: string) => {
    setIsReprocessing(true);
    try {
      const updated = await reprocessDocument(docId);
      await loadData();
      if (selectedDocId === docId) {
        setSelectedDocDetail(updated);
      }
    } finally {
      setIsReprocessing(false);
    }
  };

  // Retry document
  const handleRetryDocument = async (docId: string) => {
    setIsProcessing(true);
    setProcessingTitle('Retrying document processing...');
    try {
      const updated = await retryDocument(docId);
      await loadData();
      if (selectedDocId === docId) {
        setSelectedDocDetail(updated);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(docId);
      if (selectedDocId === docId) {
        setSelectedDocDetail(null);
        setSelectedDocId(null);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Toggle Action item
  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
      );
      if (selectedDocDetail) {
        setSelectedDocDetail((prev) =>
          prev
            ? {
                ...prev,
                action_items: prev.action_items.map((t) =>
                  t.id === taskId ? { ...t, completed } : t
                ),
              }
            : null
        );
      }
      await updateActionItem(taskId, { completed });
      const [h, wf] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchDailyWorkflow().catch(() => null),
      ]);
      if (h) setHealth(h);
      if (wf) setWorkflow(wf);
    } catch (err) {
      console.error('Failed to update task:', err);
      await loadData();
    }
  };

  // Add custom task
  const handleAddTask = async (task: {
    title: string;
    description?: string;
    priority?: Priority;
    assignee?: string;
    due_date?: string;
  }) => {
    try {
      await createActionItem(task);
      await loadData();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await deleteActionItem(taskId);
      const [h, wf, dupRes] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchDailyWorkflow().catch(() => null),
        fetchDuplicates().catch(() => ({ count: 0, clusters: [] })),
      ]);
      if (h) setHealth(h);
      if (wf) setWorkflow(wf);
      setDuplicateClusters(dupRes?.clusters || []);
    } catch (err) {
      console.error('Failed to delete task:', err);
      await loadData();
    }
  };

  // Task deduplication merge
  const handleMergeTasks = async (primaryId: string, duplicateIds: string[]) => {
    try {
      await mergeTasks(primaryId, duplicateIds);
      await loadData();
    } catch (err) {
      console.error('Failed to merge tasks:', err);
      alert('Failed to merge tasks. Please try again.');
    }
  };

  // Apply automation proposals
  const handleApplyAutomation = async (actionIds: string[]) => {
    setIsApplyingAutomation(true);
    try {
      await applyAutomation(actionIds);
      await loadData();
    } catch (err) {
      console.error('Failed to apply automation proposals:', err);
      throw err;
    } finally {
      setIsApplyingAutomation(false);
    }
  };

  // Reject automation proposals
  const handleRejectAutomation = async (actionIds: string[]) => {
    try {
      await rejectAutomation(actionIds);
      await loadData();
    } catch (err) {
      console.error('Failed to reject automation proposals:', err);
      throw err;
    }
  };

  // Regenerate Digest
  const handleRegenerateDigest = async () => {
    setIsGeneratingDigest(true);
    try {
      const d = await generateDailyDigest();
      setDigest(d);
    } catch (err) {
      console.error('Failed to regenerate digest:', err);
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  // Switch Model
  const handleSwitchModel = async (modelName: string) => {
    await switchModel(modelName);
    const h = await fetchHealth().catch(() => null);
    if (h) setHealth(h);
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const overdueCount =
    workflow?.metrics?.overdue_count ?? (health?.overdue_tasks_count ?? 0);
  const pendingProposalsCount = automationProposals.filter(
    (p) => p.status === 'pending'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        health={health}
        onOpenSettings={() => setShowSettings(true)}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          documentsCount={documents.length}
          pendingTasksCount={pendingTasksCount}
          overdueCount={overdueCount}
          proposalsCount={pendingProposalsCount}
          queueCount={queue.filter((i) => i.status === 'queued' || i.status === 'processing').length}
          onOpenDemo={() => setIsDemoOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'workflow' && (
              <DailyWorkflowView
                workflow={workflow}
                onToggleTask={handleToggleTask}
                onOpenDocument={handleOpenDocument}
                onOpenTasks={() => setActiveTab('tasks')}
                onOpenAutomation={() => setActiveTab('automation')}
              />
            )}

            {activeTab === 'briefing' && (
              <SmartBriefingView
                briefing={briefing}
                onRegenerate={handleRegenerateBriefing}
                isGenerating={isGeneratingBriefing}
                onOpenDocument={handleOpenDocument}
                onOpenTasks={() => setActiveTab('tasks')}
                onOpenAutomation={() => setActiveTab('automation')}
                currentModel={health?.current_model}
              />
            )}

            {activeTab === 'insights' && (
              <ProductivityInsightsView
                insights={insights}
                onRefresh={loadData}
                isRefreshing={isRefreshing}
              />
            )}

            {activeTab === 'queue' && (
              <BackgroundQueueView
                samples={samples}
                onOpenDocument={handleOpenDocument}
                onRefreshDocs={loadData}
                currentModel={health?.current_model}
              />
            )}

            {activeTab === 'comparison' && (
              <ModelComparisonView
                samples={samples}
                availableModels={health?.available_models || []}
                currentModel={health?.current_model}
              />
            )}

            {activeTab === 'privacy' && (
              <PrivacyStatusView />
            )}

            {activeTab === 'dashboard' && (
              <>
                <SlothBanner
                  onQuickUpload={() => {
                    const el = document.getElementById('upload-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onOpenSamples={() => setActiveTab('samples')}
                  onOpenDigest={() => setActiveTab('digest')}
                />

                <MetricCards
                  health={health}
                  onOpenDocs={() => setActiveTab('documents')}
                  onOpenTasks={() => setActiveTab('tasks')}
                  onOpenSettings={() => setShowSettings(true)}
                />

                <div id="upload-section">
                  <QuickUpload
                    onUploadFile={handleUploadFile}
                    onPasteText={handlePasteText}
                    onSelectSample={handleSelectSample}
                    samples={samples}
                    isProcessing={isProcessing}
                  />
                </div>

                <RecentDocuments
                  documents={documents}
                  onOpenDocument={handleOpenDocument}
                  onReprocess={handleReprocess}
                  onDeleteDocument={handleDeleteDocument}
                  onViewAll={() => setActiveTab('documents')}
                />

                <UrgentTasks
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onOpenDocument={handleOpenDocument}
                  onViewAll={() => setActiveTab('tasks')}
                />
              </>
            )}

            {activeTab === 'documents' && (
              <DocumentListView
                documents={documents}
                onOpenDocument={handleOpenDocument}
                onReprocess={handleReprocess}
                onRetry={handleRetryDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskManagerView
                tasks={tasks}
                duplicateClusters={duplicateClusters}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onOpenDocument={handleOpenDocument}
                onOpenDeduplication={() => setIsDeduplicationOpen(true)}
              />
            )}

            {activeTab === 'automation' && (
              <AutomationPreviewView
                proposals={automationProposals}
                onApply={handleApplyAutomation}
                onReject={handleRejectAutomation}
                onRefresh={loadData}
                isApplying={isApplyingAutomation}
              />
            )}

            {activeTab === 'digest' && (
              <DailyDigestView
                digest={digest}
                onRegenerate={handleRegenerateDigest}
                isGenerating={isGeneratingDigest}
                onOpenTasks={() => setActiveTab('tasks')}
              />
            )}

            {activeTab === 'samples' && (
              <SampleLibraryView
                samples={samples}
                onSelectSample={handleSelectSample}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </main>
      </div>

      <DocumentDetailModal
        document={selectedDocDetail}
        isOpen={Boolean(selectedDocId && selectedDocDetail)}
        onClose={() => {
          setSelectedDocId(null);
          setSelectedDocDetail(null);
        }}
        onToggleTask={handleToggleTask}
        onReprocess={handleReprocess}
        onRetry={handleRetryDocument}
        onDelete={handleDeleteDocument}
        isReprocessing={isReprocessing}
      />

      <DeduplicationModal
        isOpen={isDeduplicationOpen}
        onClose={() => setIsDeduplicationOpen(false)}
        clusters={duplicateClusters}
        onMerge={handleMergeTasks}
      />

      <GuidedDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onSelectTab={setActiveTab}
        onLoadSample={handleSelectSample}
        onOpenDeduplication={() => setIsDeduplicationOpen(true)}
        onOpenDocument={handleOpenDocument}
      />

      <ProcessingModal
        isOpen={isProcessing}
        documentTitle={processingTitle}
        modelName={health?.current_model}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        health={health}
        onSwitchModel={handleSwitchModel}
        onRefreshHealth={loadData}
      />
    </div>
  );
};

export default App;
