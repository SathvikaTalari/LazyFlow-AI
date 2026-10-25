# 🎬 LazyFlow AI — 60–120 Second Demo Video Script

**Target Duration:** 90 seconds (Range: 60–120 seconds)  
**Tone:** Calm, confident, focused, and steady. Embracing the Sloth mindset.  
**Video Recording Target:** Desktop screen capture of browser (`http://localhost:5173`) and terminal (`ollama list` & `pytest`).

---

## ⏱️ Video Timeline & Scene Breakdown

### **0:00 – 0:15 | Hook & Core Problem**
- **Visual:** Browser showing the LazyFlow AI Dashboard in Dark Mode. Sloth mascot visible, metric cards displayed.
- **Narration:**  
  *"We all know the feeling of drowning in 90-minute meeting transcripts, dense incident postmortems, and chaotic folders. Cloud AI tools promise help, but they demand your sensitive company data, charge per token, and hallucinate ungrounded summaries. Welcome to LazyFlow AI: a 100% private, on-device AI productivity agent built for the Hacktoberfest 'Slow and Steady' challenge."*

---

### **0:15 – 0:35 | 1-Click Local Ingestion & Source Evidence**
- **Visual:** Click on **Interactive Demo Mode** or open **Sample Library**, select the **Q4 Roadmap Meeting**, click Ingest. Progress modal shows local pipeline steps.
- **Narration:**  
  *"With one click, LazyFlow ingests documents locally. It runs strictly on-device through Ollama using open weights like Gemma 3. Notice: zero tokens leave your computer. In seconds, LazyFlow extracts a structured executive summary, high-impact deliverables, and key insights. And unlike black-box AI, every single action item is anchored directly to its exact source quote in the text for 100% verification."*

---

### **0:35 – 0:50 | Smart Deduplication & Deadline Intelligence**
- **Visual:** Switch to **Daily Flow** and **Action Items**. Show the Overdue badge and Due Today indicators. Click **Deduplicate Tasks** to show semantic cluster matching and 1-click merge.
- **Narration:**  
  *"LazyFlow's deadline intelligence automatically distinguishes explicit calendar dates from fuzzy timelines like 'in 2 weeks,' highlighting overdue blockers. When related deliverables exist across multiple documents, our smart deduplication engine identifies semantic overlap and merges them into a single consolidated task—retaining full multi-source citations."*

---

### **0:50 – 1:05 | Smart Morning Briefing & Safe Automation**
- **Visual:** Navigate to **Smart Briefing**. Show executive summary, urgent actions, cross-document risks, and grounded recommendations. Then navigate to **Safe Automation**.
- **Narration:**  
  *"Every morning, the Smart Briefing synthesizes your top priorities, flags cross-document risks, and recommends grounded next steps. Next, LazyFlow proposes intelligent folder hierarchies and clean ISO filenames. But here's our safety promise: LazyFlow NEVER touches your filesystem without your explicit human approval."*

---

### **1:05 – 1:20 | Privacy Audit & Impact Metrics**
- **Visual:** Click on **Privacy & Offline** view. Show the live audit passing (Loopback Binding, Local SQLite, Zero Telemetry). Show **AI Insights** with Nielsen Norman Group reading speed benchmarks.
- **Narration:**  
  *"LazyFlow includes a built-in privacy audit proving loopback isolation and zero remote telemetry. Our Productivity Insights transparently calculate manual hours saved using established knowledge-work benchmarks—never fabricated metrics."*

---

### **1:20 – 1:30 | Call to Action & Conclusion**
- **Visual:** Terminal showing `python -m pytest tests -v` passing 24 tests in under 1 second. Return to the dashboard.
- **Narration:**  
  *"24 unit and regression tests pass in under a second. Take it slow. Protect your privacy. And let local AI flow. Check out LazyFlow AI on GitHub today!"*

---

## 📋 Presenter Checklist Before Recording

1. Ensure Ollama is running (`ollama list` confirms `gemma3:4b` installed).
2. Start the backend: `python run_backend.py`.
3. Start the frontend: `npm run dev`.
4. Open `http://localhost:5173` in a clean browser window (1080p / 16:9 ratio recommended).
5. Pre-warm Ollama by loading a sample document once before recording to eliminate cold-start lag.
6. Verify audio levels are crisp and clear.
