# 📸 LazyFlow AI — Screenshot & Evidence Capture Checklist

Use this checklist to ensure all essential visual proof and technical evidence are compiled for the Hacktoberfest AI Challenge submission.

---

## 🖼️ UI Screenshots Checklist

| # | Screen / State | Description | File Path Recommendation |
|---|---|---|---|
| 1 | **Dashboard (Dark Mode)** | Main dashboard with sloth mascot banner, live metric cards, quick document ingestion, and urgent tasks. | `docs/screenshots/01_dashboard_dark.png` |
| 2 | **Dashboard (Light Mode)** | Clean light theme demonstrating responsive design and theme toggle. | `docs/screenshots/02_dashboard_light.png` |
| 3 | **Document Detail & Quotes** | Document inspection showing 2-paragraph summary, key takeaways, suggested folder, and **exact source quotes** anchoring action items. | `docs/screenshots/03_document_detail_evidence.png` |
| 4 | **Smart Task Deduplication** | Deduplication modal scanning for semantic clusters with similarity percentages and 1-click merge with multi-source citations. | `docs/screenshots/04_task_deduplication.png` |
| 5 | **Deadline Intelligence** | Action items board highlighting Overdue badges, Due Today badges, and days-remaining counters. | `docs/screenshots/05_deadline_intelligence.png` |
| 6 | **Daily Flow Workspace** | Unified daily workspace with today's priorities, overdue bottlenecks, cross-document risks, and daily sloth tip. | `docs/screenshots/06_daily_flow.png` |
| 7 | **Smart Morning Briefing** | Grounded daily briefing with executive summary, urgent actions, cross-document risks, and recommended next steps. | `docs/screenshots/07_smart_briefing.png` |
| 8 | **Safe Automation Proposals** | Proposed folder paths (`Projects/Roadmap`) and standardized ISO filenames with Approve/Reject buttons. | `docs/screenshots/08_safe_automation.png` |
| 9 | **Background Processing Queue** | Local queue view showing batch processing progress bars, retry button, and safe cancellation. | `docs/screenshots/09_background_queue.png` |
| 10 | **Side-by-Side Model Comparison** | Practical side-by-side evaluation between two Ollama models (`gemma3:4b` vs `gemma3:focused`) showing latency, token count, and schema validity. | `docs/screenshots/10_model_comparison.png` |
| 11 | **Privacy & Offline Audit Panel** | Live audit panel confirming Loopback Binding, Local SQLite Persistence, Zero Cloud Telemetry, and Offline Readiness. | `docs/screenshots/11_privacy_audit.png` |
| 12 | **Guided Demo Modal** | 6-stage interactive walkthrough modal showing Stage 1 (Multi-Format Ingestion). | `docs/screenshots/12_guided_demo_modal.png` |

---

## 💻 Technical Evidence & Terminal Logs

### 1. Automated Test Suite Output
- Command:
  ```powershell
  cd backend
  python -m pytest tests -v
  ```
- Evidence to capture: All 24 unit, integration, and E2E regression tests passing in ~0.8s.

### 2. Ollama Local Runtime Verification
- Command:
  ```powershell
  ollama list
  ```
- Evidence to capture: `gemma3:4b` and `gemma3:focused` installed locally with sizes ~3.4 GB.

### 3. Loopback & Network Isolation Audit
- Command:
  ```powershell
  # Verify backend loopback binding
  Test-NetConnection -ComputerName 127.0.0.1 -Port 8000
  # Verify Ollama loopback binding
  Test-NetConnection -ComputerName 127.0.0.1 -Port 11434
  ```
- Evidence to capture: `TcpTestSucceeded : True` exclusively on `127.0.0.1`.

### 4. Database On-Device Storage
- Command:
  ```powershell
  Get-Item backend\lazyflow.db | Select-Object Name, Length, LastWriteTime
  ```
- Evidence to capture: Local SQLite database file on disk, zero cloud database connections.
