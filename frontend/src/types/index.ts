export type Priority = 'high' | 'medium' | 'low';

export type DeadlineStatus =
  | 'overdue'
  | 'due_today'
  | 'due_this_week'
  | 'upcoming'
  | 'inferred'
  | 'undated'
  | 'completed';

export interface MergedSourceRef {
  task_id: string;
  document_id: string;
  document_title: string;
  original_title: string;
  source_quote?: string;
}

export interface ActionItem {
  id: string;
  document_id?: string;
  document_title?: string;
  suggested_folder?: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  due_date: string;
  source_quote?: string;
  parsed_due_date?: string;
  is_explicit_date?: boolean;
  deadline_status?: DeadlineStatus;
  days_remaining?: number;
  badge_text?: string;
  merged_sources?: MergedSourceRef[];
  completed: boolean;
  created_at: string;
}

export interface DuplicateCluster {
  cluster_id: string;
  similarity_score: number;
  reason: string;
  suggested_primary_id: string;
  tasks: ActionItem[];
}

export interface AutomationProposal {
  id: string;
  document_id: string;
  document_title: string;
  current_folder: string;
  current_filename: string;
  proposed_folder: string;
  proposed_filename: string;
  reason: string;
  status: 'pending' | 'applied' | 'rejected';
  created_at: string;
}

export interface CrossDocumentRisk {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action_text: string;
  document_id?: string;
  affected_task_ids?: string[];
}

export interface DailyWorkflow {
  date: string;
  today_priorities: ActionItem[];
  overdue_tasks: ActionItem[];
  upcoming_deadlines: ActionItem[];
  cross_document_risks: CrossDocumentRisk[];
  metrics: {
    total_active: number;
    overdue_count: number;
    today_count: number;
    upcoming_count: number;
    completed_count: number;
    completion_rate: number;
  };
  daily_sloth_tip: string;
  generated_at: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  original_filename?: string;
  file_type: string;
  file_size: number;
  summary: string;
  tags: string[];
  suggested_folder?: string;
  sentiment?: string;
  action_items_total: number;
  action_items_completed: number;
  processing_time_ms: number;
  model_used?: string;
  created_at: string;
}

export interface DocumentDetail extends DocumentListItem {
  raw_content: string;
  key_points: string[];
  action_items: ActionItem[];
}

export interface DailyDigest {
  id: string;
  date: string;
  title: string;
  summary: string;
  highlights: string[];
  pending_tasks_count: number;
  documents_included: string[];
  created_at: string;
}

export interface HealthStatus {
  status: string;
  ollama_connected: boolean;
  ollama_url: string;
  current_model: string;
  available_models: string[];
  database_ok: boolean;
  documents_count: number;
  tasks_count: number;
  completed_tasks_count: number;
  overdue_tasks_count?: number;
}

export interface SampleDoc {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  category: string;
  description: string;
}

// Phase 3 Types: Autonomous Productivity & Impact

export interface QueueItem {
  id: string;
  title: string;
  original_filename?: string;
  file_type?: string;
  file_size: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error_message?: string;
  document_id?: string;
  model_used?: string;
  processing_time_ms: number;
  retry_count: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface EffortSavedBreakdown {
  reading_minutes: floatNumber;
  reading_words_total: number;
  reading_speed_wpm: number;
  summarization_minutes: number;
  summarization_docs_count: number;
  summarization_mins_per_doc: number;
  task_extraction_minutes: number;
  task_extraction_count: number;
  task_extraction_mins_per_item: number;
  deduplication_minutes: number;
  deduplication_clusters_count: number;
  total_minutes_saved: number;
  total_hours_formatted: string;
  calculation_notes: string;
}

type floatNumber = number;

export interface ProductivityInsights {
  total_documents: number;
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  completion_rate_pct: number;
  overdue_tasks: number;
  due_today_tasks: number;
  processing_success_rate_pct: number;
  total_processing_attempts: number;
  successful_processing_count: number;
  failed_processing_count: number;
  effort_saved: EffortSavedBreakdown;
  generated_at: string;
}

export interface SmartBriefingUrgentAction {
  task_id: string;
  title: string;
  priority: Priority;
  due_date: string;
  document_title: string;
  document_id?: string;
  assignee: string;
  source_quote?: string;
  urgency_reason: string;
}

export interface SmartBriefingDeadline {
  task_id: string;
  title: string;
  due_date: string;
  days_remaining?: number;
  is_explicit_date: boolean;
  document_title: string;
  badge_text: string;
}

export interface SmartBriefingRisk {
  id: string;
  severity: 'critical' | 'warning' | 'notice';
  title: string;
  source_document: string;
  description: string;
  action_plan: string;
  affected_items: string[];
}

export interface SmartBriefingNextStep {
  step_number: number;
  title: string;
  action_type: 'complete_task' | 'review_doc' | 'assign_owner' | 'approve_automation';
  details: string;
  grounded_source: string;
}

export interface SmartBriefing {
  date: string;
  headline: string;
  executive_summary: string;
  urgent_actions: SmartBriefingUrgentAction[];
  upcoming_deadlines: SmartBriefingDeadline[];
  cross_document_risks: SmartBriefingRisk[];
  recommended_next_steps: SmartBriefingNextStep[];
  data_grounding: Array<{
    type: string;
    document_title: string;
    task_title?: string;
    quote?: string;
    priority?: string;
  }>;
  sloth_focus_quote: string;
  generated_at: string;
}

export interface ModelComparisonMetrics {
  model_name: string;
  latency_ms: number;
  summary_word_count: number;
  summary_char_count: number;
  key_points_count: number;
  action_items_count: number;
  tags_count: number;
  suggested_folder: string;
  sentiment: string;
  schema_valid: boolean;
  schema_score_pct: number;
  missing_schema_fields: string[];
}

export interface ModelComparisonResult {
  id: string;
  sample_title: string;
  content_snippet: string;
  model_a: string;
  model_b: string;
  model_a_metrics: ModelComparisonMetrics;
  model_b_metrics: ModelComparisonMetrics;
  model_a_result: any;
  model_b_result: any;
  latency_difference_ms: number;
  faster_model: string;
  more_action_items_model: string;
  practical_disclaimer: string;
  created_at: string;
}

export interface PrivacyCheckItem {
  check_id: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  guarantee: string;
}

export interface PrivacyVerificationReport {
  offline_verified: boolean;
  timestamp: string;
  ollama_endpoint: string;
  ollama_is_local: boolean;
  database_is_local: boolean;
  external_telemetry_active: boolean;
  checks: PrivacyCheckItem[];
  privacy_statement: string;
}

