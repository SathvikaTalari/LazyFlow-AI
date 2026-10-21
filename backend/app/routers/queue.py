from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models import (
    QueueItemResponse,
    QueueBatchSampleRequest,
    QueueBatchCustomRequest
)
from app.services.queue_service import (
    enqueue_document,
    enqueue_samples,
    list_queue_items,
    get_queue_item,
    cancel_queue_item,
    retry_queue_item,
    delete_queue_item,
    clear_completed_queue
)

router = APIRouter(prefix="/api/queue", tags=["Background Queue"])

@router.get("", response_model=List[QueueItemResponse])
def get_queue(limit: int = Query(50, ge=1, le=200)):
    """Lists current documents in the background processing queue."""
    return list_queue_items(limit=limit)

@router.get("/{item_id}", response_model=QueueItemResponse)
def get_queue_single(item_id: str):
    """Retrieves progress and status of a specific queued item."""
    item = get_queue_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return item

@router.post("/batch-samples", response_model=List[QueueItemResponse])
def queue_samples_endpoint(payload: QueueBatchSampleRequest):
    """Batch enqueues multiple sample documents for background processing."""
    if not payload.sample_ids:
        raise HTTPException(status_code=400, detail="No sample IDs provided.")
    return enqueue_samples(payload.sample_ids, model=payload.model)

@router.post("/enqueue", response_model=QueueItemResponse)
def enqueue_document_endpoint(
    title: str,
    content: str,
    filename: Optional[str] = None,
    file_type: str = ".txt",
    model: Optional[str] = None
):
    """Enqueues a custom document for reliable background processing."""
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")
    return enqueue_document(
        title=title,
        content=content,
        original_filename=filename,
        file_type=file_type,
        model=model
    )

@router.post("/{item_id}/retry")
def retry_item_endpoint(item_id: str):
    """Retries a failed, cancelled, or interrupted queue item."""
    res = retry_queue_item(item_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.post("/{item_id}/cancel")
def cancel_item_endpoint(item_id: str):
    """Safely cancels a queued or in-progress item."""
    res = cancel_queue_item(item_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.delete("/{item_id}")
def delete_item_endpoint(item_id: str):
    """Removes a finished item from the queue list."""
    return delete_queue_item(item_id)

@router.delete("/clear")
def clear_completed_endpoint():
    """Removes all completed and cancelled queue items."""
    return clear_completed_queue()
