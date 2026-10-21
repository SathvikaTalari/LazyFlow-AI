import os
import io
import json
import csv
from pathlib import Path
from typing import Tuple

def extract_text_from_file(file_bytes: bytes, filename: str) -> Tuple[str, str, str]:
    """
    Extracts plain text and metadata from file bytes.
    Returns: (extracted_text, file_type, suggested_title)
    """
    ext = Path(filename).suffix.lower()
    extracted_text = ""
    file_type = ext if ext else ".txt"

    if ext in [".txt", ".log"]:
        extracted_text = file_bytes.decode("utf-8", errors="replace")
    elif ext in [".md", ".markdown"]:
        extracted_text = file_bytes.decode("utf-8", errors="replace")
    elif ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages.append(f"--- Page {i + 1} ---\n{text}")
            extracted_text = "\n\n".join(pages)
        except Exception as e:
            extracted_text = f"[Error reading PDF: {str(e)}]\n" + file_bytes.decode("latin1", errors="replace")[:1000]
    elif ext == ".docx":
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            extracted_text = "\n\n".join(paragraphs)
        except Exception as e:
            extracted_text = f"[Error reading DOCX: {str(e)}]"
    elif ext == ".json":
        try:
            raw_str = file_bytes.decode("utf-8", errors="replace")
            parsed = json.loads(raw_str)
            extracted_text = json.dumps(parsed, indent=2)
        except Exception:
            extracted_text = file_bytes.decode("utf-8", errors="replace")
    elif ext == ".csv":
        try:
            raw_str = file_bytes.decode("utf-8", errors="replace")
            reader = csv.reader(raw_str.splitlines())
            rows = [", ".join(row) for row in list(reader)[:150]]
            extracted_text = "\n".join(rows)
        except Exception:
            extracted_text = file_bytes.decode("utf-8", errors="replace")
    else:
        # Fallback to UTF-8 / replacement decode
        extracted_text = file_bytes.decode("utf-8", errors="replace")

    # Clean text
    extracted_text = extracted_text.strip()
    
    # Infer suggested title
    suggested_title = Path(filename).stem.replace("_", " ").replace("-", " ").title()
    for line in extracted_text.splitlines()[:5]:
        line_clean = line.strip("# \t\r\n*")
        if line_clean and len(line_clean) > 3 and len(line_clean) < 100:
            suggested_title = line_clean
            break

    return extracted_text, file_type, suggested_title
