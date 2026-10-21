import pytest
from datetime import date
from app.services.deadline_service import parse_deadline

def test_explicit_calendar_dates():
    ref_date = date(2026, 10, 21)

    # Future date
    d1 = parse_deadline("October 24, 2026", reference_date=ref_date)
    assert d1["is_explicit"] is True
    assert d1["parsed_iso"] == "2026-10-24"
    assert d1["days_remaining"] == 3
    assert d1["status"] == "due_this_week"

    # Past / Overdue date
    d2 = parse_deadline("October 19, 2026", reference_date=ref_date)
    assert d2["is_explicit"] is True
    assert d2["parsed_iso"] == "2026-10-19"
    assert d2["days_remaining"] == -2
    assert d2["status"] == "overdue"
    assert d2["is_urgent"] is True

    # ISO format
    d3 = parse_deadline("2026-11-05", reference_date=ref_date)
    assert d3["is_explicit"] is True
    assert d3["parsed_iso"] == "2026-11-05"
    assert d3["status"] == "upcoming"

def test_due_today():
    ref_date = date(2026, 10, 21)
    d = parse_deadline("October 21, 2026", reference_date=ref_date)
    assert d["is_explicit"] is True
    assert d["status"] == "due_today"
    assert d["days_remaining"] == 0
    assert d["is_urgent"] is True

def test_inferred_and_fuzzy_dates():
    ref_date = date(2026, 10, 21)

    d_soon = parse_deadline("Soon", reference_date=ref_date)
    assert d_soon["is_explicit"] is False
    assert d_soon["status"] == "inferred"
    assert d_soon["parsed_iso"] is None

    d_tbd = parse_deadline("TBD", reference_date=ref_date)
    assert d_tbd["is_explicit"] is False
    assert d_tbd["status"] == "inferred"

    d_upcoming = parse_deadline("Upcoming", reference_date=ref_date)
    assert d_upcoming["is_explicit"] is False
    assert d_upcoming["status"] == "inferred"

def test_empty_and_none_deadlines():
    d_none = parse_deadline(None)
    assert d_none["status"] == "undated"
    assert d_none["is_explicit"] is False

    d_empty = parse_deadline("   ")
    assert d_empty["status"] == "undated"
    assert d_empty["is_explicit"] is False
