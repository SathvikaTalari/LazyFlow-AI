import sqlite3
import json
from contextlib import contextmanager
from typing import Generator
from app.config import DATABASE_PATH

def init_db():
    """Initializes the SQLite database tables, columns, and indexes."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                original_filename TEXT,
                file_type TEXT,
                file_size INTEGER,
                raw_content TEXT,
                summary TEXT,
                key_points TEXT,       -- JSON array of strings
                tags TEXT,             -- JSON array of strings
                suggested_folder TEXT,
                sentiment TEXT,
                processing_time_ms INTEGER DEFAULT 0,
                model_used TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # Action items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS action_items (
                id TEXT PRIMARY KEY,
                document_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                priority TEXT DEFAULT 'medium',
                assignee TEXT,
                due_date TEXT,
                completed INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
        """)

        # Daily digests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_digests (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                title TEXT,
                summary TEXT,
                highlights TEXT,         -- JSON array
                pending_tasks_count INTEGER DEFAULT 0,
                documents_included TEXT, -- JSON array of document IDs
                created_at TEXT NOT NULL
            )
        """)

        # Automation actions table (Safe Preview & Approval)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS automation_actions (
                id TEXT PRIMARY KEY,
                document_id TEXT,
                current_folder TEXT,
                current_filename TEXT,
                proposed_folder TEXT,
                proposed_filename TEXT,
                reason TEXT,
                status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
                applied_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
        """)

        # Processing Queue table (Background Processing & Multi-Document Queue)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS processing_queue (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                original_filename TEXT,
                file_type TEXT,
                file_size INTEGER DEFAULT 0,
                content TEXT,
                status TEXT DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'cancelled'
                progress INTEGER DEFAULT 0,
                error_message TEXT,
                document_id TEXT,
                model_used TEXT,
                processing_time_ms INTEGER DEFAULT 0,
                retry_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
            )
        """)

        # Model Comparisons table (Model Comparison Feature)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_comparisons (
                id TEXT PRIMARY KEY,
                sample_id TEXT,
                sample_title TEXT NOT NULL,
                content_preview TEXT,
                model_a TEXT NOT NULL,
                model_b TEXT NOT NULL,
                model_a_result TEXT, -- JSON
                model_b_result TEXT, -- JSON
                model_a_metrics TEXT, -- JSON {latency_ms, summary_len, key_points_count, items_count, valid_schema}
                model_b_metrics TEXT, -- JSON {latency_ms, summary_len, key_points_count, items_count, valid_schema}
                created_at TEXT NOT NULL
            )
        """)

        # Settings key-value store
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        # Migrate action_items columns if not present
        cursor.execute("PRAGMA table_info(action_items)")
        columns = [row["name"] for row in cursor.fetchall()]

        if "parsed_due_date" not in columns:
            cursor.execute("ALTER TABLE action_items ADD COLUMN parsed_due_date TEXT")
        if "is_explicit_date" not in columns:
            cursor.execute("ALTER TABLE action_items ADD COLUMN is_explicit_date INTEGER DEFAULT 0")
        if "source_quote" not in columns:
            cursor.execute("ALTER TABLE action_items ADD COLUMN source_quote TEXT")
        if "merged_sources" not in columns:
            cursor.execute("ALTER TABLE action_items ADD COLUMN merged_sources TEXT")

        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_docs_created ON documents(created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_doc ON action_items(document_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_completed ON action_items(completed)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_due ON action_items(parsed_due_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_digests_date ON daily_digests(date DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_auto_status ON automation_actions(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_queue_status ON processing_queue(status, created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_comparisons_created ON model_comparisons(created_at DESC)")

        # Recovery after backend restart:
        # Any jobs left in 'processing' when the server stopped are safely recovered
        cursor.execute("""
            UPDATE processing_queue
            SET status = 'failed',
                error_message = 'Interrupted: Server restarted during processing. Ready to retry.'
            WHERE status = 'processing'
        """)

        conn.commit()

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for SQLite connections with WAL mode and foreign keys enabled."""
    conn = sqlite3.connect(str(DATABASE_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    try:
        yield conn
    finally:
        conn.close()

def get_setting(key: str, default: str = "") -> str:
    """Retrieve a setting value by key."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row["value"] if row else default

def set_setting(key: str, value: str):
    """Save or update a setting value."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """, (key, value))
        conn.commit()
