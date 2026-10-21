import type {
  HealthStatus,
  DocumentListItem,
  DocumentDetail,
  ActionItem,
  DailyDigest,
  SampleDoc,
  Priority,
  DuplicateCluster,
  AutomationProposal,
  DailyWorkflow,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModels(): Promise<{ active_model: string; models: string[]; count: number }> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error('Failed to fetch Ollama models');
  return res.json();
}

export async function switchModel(modelName: string): Promise<{ status: string; active_model: string }> {
  const res = await fetch(`${API_BASE}/settings/model`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model_name: modelName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to switch model' }));
    throw new Error(err.detail || 'Failed to switch model');
  }
  return res.json();
}

export async function fetchSamples(): Promise<SampleDoc[]> {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) throw new Error('Failed to fetch sample documents');
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentListItem[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function fetchDocument(id: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/documents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch document details');
  return res.json();
}

export async function uploadDocument(
  file: File,
  customTitle?: string,
  model?: string
): Promise<DocumentDetail> {
  const formData = new FormData();
  formData.append('file', file);
  if (customTitle?.trim()) {
    formData.append('custom_title', customTitle.trim());
  }
  if (model?.trim()) {
    formData.append('model', model.trim());
  }

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload processing failed' }));
    throw new Error(err.detail || 'Upload processing failed');
  }
  return res.json();
}

export async function pasteDocument(
  content: string,
  title?: string,
  model?: string
): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/documents/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, title, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Text processing failed' }));
    throw new Error(err.detail || 'Text processing failed');
  }
  return res.json();
}

export async function loadSampleDocument(sampleId: string, model?: string): Promise<DocumentDetail> {
  const url = model
    ? `${API_BASE}/documents/sample/${sampleId}?model=${encodeURIComponent(model)}`
    : `${API_BASE}/documents/sample/${sampleId}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Sample processing failed' }));
    throw new Error(err.detail || 'Sample processing failed');
  }
  return res.json();
}

export async function reprocessDocument(id: string, model?: string): Promise<DocumentDetail> {
  const url = model
    ? `${API_BASE}/documents/${id}/reprocess?model=${encodeURIComponent(model)}`
    : `${API_BASE}/documents/${id}/reprocess`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Reprocessing failed' }));
    throw new Error(err.detail || 'Reprocessing failed');
  }
  return res.json();
}

export async function retryDocument(id: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/documents/${id}/retry`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Retry failed' }));
    throw new Error(err.detail || 'Retry failed');
  }
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function fetchActionItems(params?: {
  completed?: boolean;
  priority?: Priority;
  document_id?: string;
  status?: string;
}): Promise<ActionItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.completed !== undefined) searchParams.append('completed', String(params.completed));
  if (params?.priority) searchParams.append('priority', params.priority);
  if (params?.document_id) searchParams.append('document_id', params.document_id);
  if (params?.status) searchParams.append('status', params.status);

  const query = searchParams.toString();
  const url = query ? `${API_BASE}/action-items?${query}` : `${API_BASE}/action-items`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch action items');
  return res.json();
}

export async function updateActionItem(
  id: string,
  updates: Partial<{
    completed: boolean;
    title: string;
    description: string;
    priority: Priority;
    assignee: string;
    due_date: string;
    source_quote: string;
  }>
): Promise<ActionItem> {
  const res = await fetch(`${API_BASE}/action-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update action item');
  return res.json();
}

export async function createActionItem(item: {
  title: string;
  description?: string;
  priority?: Priority;
  assignee?: string;
  due_date?: string;
  document_id?: string;
  source_quote?: string;
}): Promise<ActionItem> {
  const res = await fetch(`${API_BASE}/action-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to create action item');
  return res.json();
}

export async function deleteActionItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/action-items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete action item');
}

export async function fetchDuplicates(): Promise<{ count: number; clusters: DuplicateCluster[] }> {
  const res = await fetch(`${API_BASE}/action-items/duplicates`);
  if (!res.ok) throw new Error('Failed to scan for duplicate action items');
  return res.json();
}

export async function mergeTasks(primaryId: string, duplicateIds: string[]): Promise<any> {
  const res = await fetch(`${API_BASE}/action-items/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ primary_task_id: primaryId, duplicate_task_ids: duplicateIds }),
  });
  if (!res.ok) throw new Error('Failed to merge duplicate action items');
  return res.json();
}

export async function fetchAutomationProposals(): Promise<AutomationProposal[]> {
  const res = await fetch(`${API_BASE}/automation/proposals`);
  if (!res.ok) throw new Error('Failed to fetch automation proposals');
  return res.json();
}

export async function applyAutomation(actionIds: string[]): Promise<{ status: string; applied_count: number }> {
  const res = await fetch(`${API_BASE}/automation/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_ids: actionIds }),
  });
  if (!res.ok) throw new Error('Failed to apply automation proposals');
  return res.json();
}

export async function rejectAutomation(actionIds: string[]): Promise<{ status: string; rejected_count: number }> {
  const res = await fetch(`${API_BASE}/automation/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_ids: actionIds }),
  });
  if (!res.ok) throw new Error('Failed to reject automation proposals');
  return res.json();
}

export async function fetchDailyWorkflow(): Promise<DailyWorkflow> {
  const res = await fetch(`${API_BASE}/workflow/daily`);
  if (!res.ok) throw new Error('Failed to fetch daily workflow');
  return res.json();
}

export async function fetchTodayDigest(): Promise<DailyDigest> {
  const res = await fetch(`${API_BASE}/digest/today`);
  if (!res.ok) throw new Error('Failed to fetch daily digest');
  return res.json();
}

export async function generateDailyDigest(model?: string): Promise<DailyDigest> {
  const url = model ? `${API_BASE}/digest/generate?model=${encodeURIComponent(model)}` : `${API_BASE}/digest/generate`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate daily digest');
  return res.json();
}

// Phase 3 API methods: Background Queue, Insights, Briefing, Model Comparison, and Privacy

export async function fetchQueue(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/queue`);
  if (!res.ok) throw new Error('Failed to fetch processing queue');
  return res.json();
}

export async function batchEnqueueSamples(sampleIds: string[], model?: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/queue/batch-samples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_ids: sampleIds, model }),
  });
  if (!res.ok) throw new Error('Failed to batch enqueue samples');
  return res.json();
}

export async function enqueueDocument(
  title: string,
  content: string,
  filename?: string,
  model?: string
): Promise<any> {
  const params = new URLSearchParams({ title, content });
  if (filename) params.append('filename', filename);
  if (model) params.append('model', model);

  const res = await fetch(`${API_BASE}/queue/enqueue?${params.toString()}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to enqueue document');
  return res.json();
}

export async function retryQueueItem(itemId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/queue/${itemId}/retry`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry queue item');
  return res.json();
}

export async function cancelQueueItem(itemId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/queue/${itemId}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to cancel queue item');
  return res.json();
}

export async function deleteQueueItem(itemId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/queue/${itemId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete queue item');
}

export async function clearCompletedQueue(): Promise<{ status: string; cleared_count: number }> {
  const res = await fetch(`${API_BASE}/queue/clear`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear completed queue');
  return res.json();
}

export async function fetchProductivityInsights(): Promise<any> {
  const res = await fetch(`${API_BASE}/insights`);
  if (!res.ok) throw new Error('Failed to fetch productivity insights');
  return res.json();
}

export async function fetchSmartBriefing(model?: string): Promise<any> {
  const url = model ? `${API_BASE}/briefing/today?model=${encodeURIComponent(model)}` : `${API_BASE}/briefing/today`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch smart daily briefing');
  return res.json();
}

export async function generateSmartBriefing(model?: string): Promise<any> {
  const url = model ? `${API_BASE}/briefing/generate?model=${encodeURIComponent(model)}` : `${API_BASE}/briefing/generate`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate smart daily briefing');
  return res.json();
}

export async function compareModels(payload: {
  model_a: string;
  model_b: string;
  sample_id?: string;
  content?: string;
  title?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/models/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to run model comparison' }));
    throw new Error(err.detail || 'Failed to run model comparison');
  }
  return res.json();
}

export async function fetchComparisonHistory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/models/comparisons`);
  if (!res.ok) throw new Error('Failed to fetch model comparison history');
  return res.json();
}

export async function fetchPrivacyStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/privacy/status`);
  if (!res.ok) throw new Error('Failed to fetch privacy status');
  return res.json();
}

export async function verifyOffline(): Promise<any> {
  const res = await fetch(`${API_BASE}/privacy/verify-offline`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run offline verification');
  return res.json();
}

