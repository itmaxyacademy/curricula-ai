# 🎓 Curricula AI — Next-Gen AI Multi-Role Course Generator

> **Enterprise-Grade AI Curriculum Engineering Platform** — Transform single prompts and reference documents into pedagogically-rich, production-ready courses across 3 distinct stakeholder perspectives: **Creator**, **Student**, and **Educator**.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8+-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Overview & Value Proposition

**Curricula AI** is an advanced instructional design and curriculum generation system. Moving beyond simple text summaries, Curricula AI employs an **8-Step Grounded Generation Pipeline** powered by OpenAI GPT-4o to construct modular, verified, and multi-perspective learning experiences.

### 🎭 3-Role Persona Studio
1. **Creator View** — Comprehensive pedagogical breakdowns, core concepts, runnable code blocks, fact-based quizzes, hands-on exercises, and prompt engineering templates.
2. **Student View** — Interactive learning journeys, *"Why This Matters"* real-world motivations, sandbox practice templates, debugging walk-throughs, and ethical considerations.
3. **Educator View** — Facilitator guides, time-allocation lesson plans, evaluation rubrics, and discussion prompts for classroom orchestration.

---

## 🚀 Key Architectural Highlights

- **🧠 Universal Contextual Translation & Title Normalization**: User inputs in any language/slang are intelligently translated to 100% professional English with standardized Title Casing.
- **🛡️ Zero-Boilerplate Procedural Custom Sections**: Generates rich, step-by-step instructional guides (materials, procedures, safety mitigation, verification checklists) without generic template filler.
- **🔒 Post-Generation QA Validation Layer**: Scans and guarantees zero empty/null states or missing sections before completion.
- **⚡ Real-Time SSE Progress & Auto-Resume**: Non-blocking asynchronous generator with Server-Sent Events (SSE) and automatic recovery for interrupted sessions.
- **📱 Fully Responsive Mobile Architecture**: Additive CSS layer with collapsible TOC drawers, fluid modals, and $\ge 44\times 44\text{px}$ touch targets.
- **🛡️ Robust Error Boundaries**: Granular React Error Boundaries and defensive parsing preventing white-screen crashes.

---

## 🗺️ The 8-Step Curriculum Pipeline

| Step | Stage | Description |
| :---: | :--- | :--- |
| **1** | **Prompt & Reference** | Input course topic with real-time character counter (0/2000) and optional reference document (PDF/DOCX/TXT). |
| **2** | **Context & Config** | Configure lesson count, duration per lesson (5–180 min), difficulty, audience, and extracted tech tags. |
| **3** | **Grounding** | Review and edit AI-extracted prerequisites, boundaries (out-of-scope), and learning outcomes. |
| **4** | **Proposals** | Select from 3 pedagogical architectures: *Practical Boot Camp*, *Balanced Foundations*, or *Advanced Pipeline*. |
| **5** | **Structure Builder** | Drag, drop, add custom sections with instructions, rename, or reorder lesson modules. |
| **6** | **Review Summary** | Final validation of curriculum structure, custom modules, and estimated duration. |
| **7** | **Live Generation** | Real-time SSE streaming with live progress bar and status telemetry. |
| **8** | **Interactive Studio** | Full WYSIWYG studio with persona switching, AI Magic Wand rewriters, TOC Scrollspy, and multi-format exports. |

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS Design System, Responsive Media Queries |
| **Backend** | FastAPI, SQLAlchemy 2.0 (WAL SQLite & MySQL support), Uvicorn |
| **AI Orchestration** | OpenAI GPT-4o / GPT-4o-mini, OpenRouter integration |
| **Document Parsing** | PyPDF, python-docx, openpyxl, pptx |
| **Typography & Theme** | Google Fonts (Outfit, Plus Jakarta Sans), Modern Glassmorphism & Gold Accent |

---

## ⚙️ Quick Start & Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- pip & npm

### 1. Clone & Setup Repository
```bash
git clone https://github.com/lealeloio/curricula-ai.git
cd curricula-ai
```

### 2. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and fill in your OPENAI_API_KEY
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

### 4. Access the Application
- **Frontend UI**: `http://localhost:5173`
- **Interactive API Docs**: `http://127.0.0.1:8000/docs`

---

## 🔑 Environment Configuration (`backend/.env`)

```env
# AI Model Configuration
OPENAI_API_KEY=sk-...your-openai-api-key...
OPENAI_MODEL=gpt-4o-mini

# Optional OpenRouter Configuration
# OPENROUTER_API_KEY=sk-or-v1-...
# OPENROUTER_MODEL=openai/gpt-4o-mini

# Database Configuration (Defaults to local SQLite with WAL & NullPool)
# DATABASE_URL=mysql+pymysql://user:password@127.0.0.1:3306/curricula_ai
```

---

## 📄 License

MIT © 2025–2026 Maxy Academy. All rights reserved.
