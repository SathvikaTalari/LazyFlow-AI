import re
from datetime import datetime, date, timedelta, timezone
from typing import Optional, Dict, Any, Tuple

MONTH_MAP = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}

WEEKDAY_MAP = {
    "monday": 0, "mon": 0,
    "tuesday": 1, "tue": 1,
    "wednesday": 2, "wed": 2,
    "thursday": 3, "thu": 3,
    "friday": 4, "fri": 4,
    "saturday": 5, "sat": 5,
    "sunday": 6, "sun": 6,
}

def get_current_date() -> date:
    """Returns today's date in UTC."""
    return datetime.now(timezone.utc).date()

def parse_deadline(
    due_date_str: Optional[str],
    reference_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Parses a due date string into structured deadline intelligence:
    - Distinguishes explicit calendar dates from AI-inferred/relative timelines.
    - Determines overdue, due_today, due_this_week, upcoming, or inferred status.
    - Calculates days remaining or days overdue.
    """
    today = reference_date or get_current_date()

    if not due_date_str or not due_date_str.strip():
        return {
            "raw": "Undated",
            "parsed_iso": None,
            "is_explicit": False,
            "status": "undated",
            "days_remaining": None,
            "badge_text": "Undated",
            "is_urgent": False,
        }

    raw = due_date_str.strip()
    raw_lower = raw.lower()

    # Check for non-explicit / fuzzy keywords
    fuzzy_keywords = ["soon", "upcoming", "tbd", "future", "asap", "q4", "q1", "q2", "q3", "later", "ongoing"]
    is_fuzzy = any(kw == raw_lower or f" {kw} " in f" {raw_lower} " for kw in fuzzy_keywords)

    parsed_date: Optional[date] = None
    is_explicit = False

    # 1. Match ISO date: YYYY-MM-DD or YYYY/MM/DD
    iso_match = re.search(r"\b(20\d\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b", raw)
    if iso_match:
        year, month, day = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
        try:
            parsed_date = date(year, month, day)
            is_explicit = True
        except ValueError:
            pass

    # 2. Match Month Name + Day + optional Year: e.g. "October 24, 2026", "Oct 24", "24 October 2026"
    if not parsed_date:
        month_regex = r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
        
        # Format: "October 24th, 2026" or "Oct 24"
        pattern1 = re.search(rf"\b{month_regex}\s+([0-3]?[0-9])(?:st|nd|rd|th)?(?:\s*,?\s*(20\d\d))?\b", raw_lower)
        if pattern1:
            month_str = pattern1.group(1)
            day = int(pattern1.group(2))
            year = int(pattern1.group(3)) if pattern1.group(3) else today.year
            month = MONTH_MAP.get(month_str, today.month)
            try:
                parsed_date = date(year, month, day)
                is_explicit = True
            except ValueError:
                pass

        # Format: "24th October 2026" or "24 Oct"
        if not parsed_date:
            pattern2 = re.search(rf"\b([0-3]?[0-9])(?:st|nd|rd|th)?\s+{month_regex}(?:\s*,?\s*(20\d\d))?\b", raw_lower)
            if pattern2:
                day = int(pattern2.group(1))
                month_str = pattern2.group(2)
                year = int(pattern2.group(3)) if pattern2.group(3) else today.year
                month = MONTH_MAP.get(month_str, today.month)
                try:
                    parsed_date = date(year, month, day)
                    is_explicit = True
                except ValueError:
                    pass

    # 3. Relative weekday matches: "by Friday", "this Friday", "Tomorrow"
    if not parsed_date:
        if "tomorrow" in raw_lower:
            parsed_date = today + timedelta(days=1)
            is_explicit = False
        elif "today" in raw_lower:
            parsed_date = today
            is_explicit = False
        else:
            for w_name, w_idx in WEEKDAY_MAP.items():
                if w_name in raw_lower:
                    days_ahead = (w_idx - today.weekday()) % 7
                    if days_ahead == 0:
                        days_ahead = 7  # Next week's weekday
                    parsed_date = today + timedelta(days=days_ahead)
                    is_explicit = False
                    break

    # If date resolved
    if parsed_date:
        diff_days = (parsed_date - today).days

        if diff_days < 0:
            status = "overdue"
            badge = f"Overdue by {abs(diff_days)}d" if abs(diff_days) > 1 else "Overdue by 1 day"
            is_urgent = True
        elif diff_days == 0:
            status = "due_today"
            badge = "Due Today"
            is_urgent = True
        elif diff_days <= 7:
            status = "due_this_week"
            badge = f"Due in {diff_days}d"
            is_urgent = diff_days <= 3
        else:
            status = "upcoming"
            badge = parsed_date.strftime("%b %d, %Y")
            is_urgent = False

        return {
            "raw": raw,
            "parsed_iso": parsed_date.isoformat(),
            "is_explicit": is_explicit,
            "status": status,
            "days_remaining": diff_days,
            "badge_text": badge,
            "is_urgent": is_urgent,
        }

    # If no date could be parsed
    status = "inferred" if is_fuzzy else "undated"
    return {
        "raw": raw,
        "parsed_iso": None,
        "is_explicit": False,
        "status": status,
        "days_remaining": None,
        "badge_text": raw if len(raw) < 20 else "Inferred Date",
        "is_urgent": False,
    }
