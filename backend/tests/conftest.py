import pytest
from app.database import init_db

@pytest.fixture(autouse=True)
def run_db_init():
    """Ensure database schema and migrations are initialized for all tests."""
    init_db()
