from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ActionItemBase(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = Field(default="medium", pattern="^(high|medium|low)$")
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    source_quote: Optional[str] = None

class ActionItemCreate(ActionItemBase):
    document_id: Optional[str] = None

class ActionItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = Field(default=None, pattern="^(high|medium|low)$")
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None
    source_quote: Optional[str] = None

class ActionItemResponse(ActionItemBase):
    id: str
    document_id: Optional[str] = None
    document_title: Optional[str] = None
    suggested_folder: Optional[str] = None
    completed: bool = False
    parsed_due_date: Optional[str] = None
    is_explicit_date: bool = False
    deadline_status: Optional[str] = "undated"
    days_remaining: Optional[int] = None
    badge_text: Optional[str] = None
    merged_sources: List[Dict[str, Any]] = []
    created_at: str

class DocumentPasteRequest(BaseModel):
    title: Optional[str] = None
    content: str
    model: Optional[str] = None

class DocumentListItem(BaseModel):
    id: str
    title: str
    original_filename: Optional[str] = None
    file_type: str
    file_size: int
    summary: str
    tags: List[str] = []
    suggested_folder: Optional[str] = None
    sentiment: Optional[str] = None
    action_items_total: int = 0
    action_items_completed: int = 0
    processing_time_ms: int = 0
    model_used: Optional[str] = None
    created_at: str

class DocumentResponse(DocumentListItem):
    raw_content: str
    key_points: List[str] = []
    action_items: List[ActionItemResponse] = []

class DailyDigestResponse(BaseModel):
    id: str
    date: str
    title: str
    summary: str
    highlights: List[str] = []
    pending_tasks_count: int
    documents_included: List[str] = []
    created_at: str

class OllamaModelInfo(BaseModel):
    name: str
    size_bytes: Optional[int] = None
    parameter_size: Optional[str] = None
    quantization: Optional[str] = None
    modified_at: Optional[str] = None

class HealthStatus(BaseModel):
    status: str
    ollama_connected: bool
    ollama_url: str
    current_model: str
    available_models: List[str] = []
    database_ok: bool
    documents_count: int = 0
    tasks_count: int = 0
    completed_tasks_count: int = 0
    overdue_tasks_count: int = 0

class ModelSwitchRequest(BaseModel):
    model_name: str

class SampleDocInfo(BaseModel):
    id: str
    title: str
    filename: str
    file_type: str
    description: str
    category: str

# Phase 2 Models
class MergeTasksRequest(BaseModel):
    primary_task_id: str
    duplicate_task_ids: List[str]

class AutomationProposal(BaseModel):
    id: str
    document_id: str
    document_title: str
    current_folder: str
    current_filename: str
    proposed_folder: str
    proposed_filename: str
    reason: str
    status: str
    created_at: str

class ApplyAutomationRequest(BaseModel):
    action_ids: List[str]

class DailyWorkflowResponse(BaseModel):
    date: str
    today_priorities: List[Dict[str, Any]] = []
    overdue_tasks: List[Dict[str, Any]] = []
    upcoming_deadlines: List[Dict[str, Any]] = []
    cross_document_risks: List[Dict[str, Any]] = []
    metrics: Dict[str, Any] = {}
    daily_sloth_tip: str
    generated_at: str

# Phase 3 Models: Autonomous Productivity & Impact

class QueueItemResponse(BaseModel):
    id: str
    title: str
    original_filename: Optional[str] = None
    file_type: Optional[str] = ".txt"
    file_size: int = 0
    status: str = "queued" # queued, processing, completed, failed, cancelled
    progress: int = 0
    error_message: Optional[str] = None
    document_id: Optional[str] = None
    model_used: Optional[str] = None
    processing_time_ms: int = 0
    retry_count: int = 0
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class QueueBatchSampleRequest(BaseModel):
    sample_ids: List[str]
    model: Optional[str] = None

class QueueBatchCustomRequest(BaseModel):
    items: List[Dict[str, Any]]
    model: Optional[str] = None

class EffortSavedBreakdown(BaseModel):
    reading_minutes: float
    reading_words_total: int
    reading_speed_wpm: int = 230
    summarization_minutes: float
    summarization_docs_count: int
    summarization_mins_per_doc: float = 15.0
    task_extraction_minutes: float
    task_extraction_count: int
    task_extraction_mins_per_item: float = 5.0
    deduplication_minutes: float
    deduplication_clusters_count: int
    total_minutes_saved: int
    total_hours_formatted: str
    calculation_notes: str

class ProductivityInsightsResponse(BaseModel):
    total_documents: int
    total_tasks: int
    pending_tasks: int
    completed_tasks: int
    completion_rate_pct: float
    overdue_tasks: int
    due_today_tasks: int
    processing_success_rate_pct: float
    total_processing_attempts: int
    successful_processing_count: int
    failed_processing_count: int
    effort_saved: EffortSavedBreakdown
    generated_at: str

class SmartBriefingUrgentAction(BaseModel):
    task_id: str
    title: str
    priority: str
    due_date: str
    document_title: str
    document_id: Optional[str] = None
    assignee: str
    source_quote: Optional[str] = None
    urgency_reason: str

class SmartBriefingDeadline(BaseModel):
    task_id: str
    title: str
    due_date: str
    days_remaining: Optional[int] = None
    is_explicit_date: bool = False
    document_title: str
    badge_text: str

class SmartBriefingRisk(BaseModel):
    id: str
    severity: str
    title: str
    source_document: str
    description: str
    action_plan: str
    affected_items: List[str] = []

class SmartBriefingNextStep(BaseModel):
    step_number: int
    title: str
    action_type: str
    details: str
    grounded_source: str

class SmartBriefingResponse(BaseModel):
    date: str
    headline: str
    executive_summary: str
    urgent_actions: List[SmartBriefingUrgentAction] = []
    upcoming_deadlines: List[SmartBriefingDeadline] = []
    cross_document_risks: List[SmartBriefingRisk] = []
    recommended_next_steps: List[SmartBriefingNextStep] = []
    data_grounding: List[Dict[str, Any]] = []
    sloth_focus_quote: str
    generated_at: str

class ModelComparisonRequest(BaseModel):
    sample_id: Optional[str] = None
    content: Optional[str] = None
    title: Optional[str] = None
    model_a: str
    model_b: str

class ModelComparisonMetrics(BaseModel):
    model_name: str
    latency_ms: int
    summary_word_count: int
    summary_char_count: int
    key_points_count: int
    action_items_count: int
    tags_count: int
    suggested_folder: str
    sentiment: str
    schema_valid: bool
    schema_score_pct: int
    missing_schema_fields: List[str] = []

class ModelComparisonResponse(BaseModel):
    id: str
    sample_title: str
    content_snippet: str
    model_a: str
    model_b: str
    model_a_metrics: ModelComparisonMetrics
    model_b_metrics: ModelComparisonMetrics
    model_a_result: Dict[str, Any]
    model_b_result: Dict[str, Any]
    latency_difference_ms: int
    faster_model: str
    more_action_items_model: str
    practical_disclaimer: str
    created_at: str

class PrivacyCheckItem(BaseModel):
    check_id: str
    name: str
    status: str # PASS, WARN, FAIL
    details: str
    guarantee: str

class PrivacyVerificationResponse(BaseModel):
    offline_verified: bool
    timestamp: str
    ollama_endpoint: str
    ollama_is_local: bool
    database_is_local: bool
    external_telemetry_active: bool
    checks: List[PrivacyCheckItem] = []
    privacy_statement: str

