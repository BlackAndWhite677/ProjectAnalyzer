# RepoLens 🔍

**Local AI-Powered GitHub Project Analyzer**

Enter any public GitHub repository URL and get an instant AI-generated analysis: tech stack, folder structure, modules, workflow, and improvement suggestions.

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS  |
| Backend   | Node.js, Express              |
| Database  | MongoDB                       |
| AI        | OpenAI / Groq (via REST API)  |

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally (`mongod`)
- An **LLM API key** — OpenAI _or_ Groq (Groq has a free tier)

---

## Setup

### 1. Clone or open the project

```bash
cd d:\fs\RepoLens
```

### 2. Configure backend environment variables

```bash
cd backend
copy .env.example .env
```

Open `backend/.env` and fill in your values:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/repolens
FRONTEND_URL=http://localhost:5173

# Option A – OpenAI
OPENAI_API_KEY=sk-...
OPENAI_URL=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-4o-mini

# Option B – Groq (free tier, fast)
# OPENAI_API_KEY=gsk_...
# OPENAI_URL=https://api.groq.com/openai/v1/chat/completions
# OPENAI_MODEL=llama-3.3-70b-versatile
```

### 3. Install dependencies

**Backend:**
```bash
cd d:\fs\RepoLens\backend
npm install
```

**Frontend:**
```bash
cd d:\fs\RepoLens\frontend
npm install
```

---

## Running the Project

Open **two terminals**:

**Terminal 1 – Backend:**
```bash
cd d:\fs\RepoLens\backend
npm run dev
```
You should see:
```
Server running on port 4000
MongoDB connected: localhost
```

**Terminal 2 – Frontend:**
```bash
cd d:\fs\RepoLens\frontend
npm run dev
```
You should see:
```
  Local:   http://localhost:5173/
```

Then open **http://localhost:5173** in your browser.

---

## How It Works

```
User enters GitHub URL
        ↓
React Frontend (http://localhost:5173)
        ↓
POST /api/analyze → Express Backend (port 4000)
        ↓
Download repo ZIP from GitHub (no auth needed for public repos)
        ↓
Extract ZIP to system temp folder
        ↓
Detect languages (by file extension)
Build project context:
  - Directory tree (depth 4)
  - README.md content
  - package.json / requirements.txt / go.mod etc.
  - Entry points (index.js, app.py, main.go ...)
  - Config files (tsconfig, vite.config, Dockerfile ...)
        ↓
Send context to LLM API (OpenAI / Groq)
        ↓
LLM returns structured JSON analysis
        ↓
Save analysis to MongoDB
Delete temp folder
        ↓
Return JSON to React frontend
        ↓
Display dashboard: Overview / Tech Stack / Structure / Modules / How It Works / Suggestions
```

---

## API Endpoints

| Method | Path                  | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/analyze`        | Analyze a GitHub repo          |
| GET    | `/api/analyses`       | Get all past analyses          |
| GET    | `/api/analyses/:id`   | Get a single analysis by ID    |

### POST `/api/analyze`

Request:
```json
{ "githubUrl": "https://github.com/expressjs/express" }
```

Response:
```json
{
  "success": true,
  "projectName": "Express",
  "summary": "...",
  "technologies": { "backend": ["Node.js", "Express"], "languages": ["JavaScript"] },
  "structure": "express/\n├── lib/\n...",
  "modules": [{ "name": "lib/router", "description": "..." }],
  "workflow": "Client → Express Router → Middleware → Response",
  "suggestions": ["Add TypeScript support", "..."],
  "languageStats": { "javascript": 452000, "markdown": 12000 }
}
```

---

## Pages

| Route        | Description                              |
|--------------|------------------------------------------|
| `/`          | Home — enter GitHub URL, start analysis  |
| `/analysis`  | Analysis dashboard with 6 tabs           |
| `/history`   | List of all previously analyzed repos    |

---

## Limitations

- Only works with **public** repositories
- Repositories over ~500 MB may be slow or fail
- Analysis takes **15–30 seconds** (download + LLM call)
- LLM quality depends on your chosen model and API key
- Temporary files are always cleaned up after analysis

---

## Project Structure

```
RepoLens/
├── backend/
│   ├── Controllers/
│   │   └── analyze.controller.js   ← Main analysis orchestrator
│   ├── models/
│   │   └── Analysis.js             ← MongoDB schema
│   ├── routes/
│   │   └── analyze.routes.js       ← API routes
│   ├── services/
│   │   ├── llm.service.js          ← LLM API calls
│   │   ├── promptBuilder.service.js← Prompt construction
│   │   └── repoAnalyzer.service.js ← Tree builder, context extractor
│   ├── utils/
│   │   ├── githubFetch.js          ← Download repo ZIP
│   │   ├── unZip.js                ← Extract ZIP
│   │   ├── langDetect.js           ← Detect languages
│   │   └── cleanup.js              ← Delete temp files
│   ├── config/db.js                ← MongoDB connection
│   ├── index.js                    ← Express app entry point
│   └── .env.example                ← Environment template
└── frontend/
    └── src/
        ├── pages/
        │   ├── HomePage.jsx         ← URL input form
        │   ├── AnalysisPage.jsx     ← Analysis dashboard
        │   └── HistoryPage.jsx      ← Past analyses
        ├── api/
        │   ├── analyze.api.js       ← API calls
        │   └── client.js            ← Axios instance
        └── App.jsx                  ← Routing
```