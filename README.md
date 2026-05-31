# 🧬 BioLens - AI Health Report Analyzer

BioLens is an advanced full-stack biotechnology health intelligence platform built as a **Biotech Mini-Project**. It is designed to ingest raw clinical laboratory report scans (PDF, PNG, JPEG) or live camera photographs, binarize and extract their data using a hybrid OCR pipeline, calculate comprehensive health scores, model disease risk probability margins, and provide RAG-grounded AI diagnostic consultations.

---

## 🚀 Core Features

### 1. Hybrid OCR Ingestion Pipeline
* **Adaptive Binarization:** Leverages OpenCV to dynamically apply Gaussian blur, grayscale conversions, and adaptive thresholding to clean noise and correct skewed scans.
* **Dual-Engine Extraction:** Combines **Tesseract OCR** and **EasyOCR** text extraction voting logic to parse values and reference bounds with absolute numeric precision.

### 2. circular SVG Health Score Gauge
* Calculates a weighted health score (0-100) based on 17 critical biological parameters (including Hemoglobin, HbA1c, TSH, Triglycerides, Creatinine, SGOT, and SGPT).
* Provides interactive feedback using a custom animated gauge colored dynamically by score category (*Excellent*, *Good*, *Moderate*, *Poor*).

### 3. Predictive ML Risk Assessment
* Processes extracted biomarker structures through machine learning rule-based classifiers to predict probability scores and confidence margins for:
  * **Diabetes**
  * **Anemia**
  * **Thyroid Disorders**
  * **Liver Disease**
  * **Kidney Disease**
  * **Cardiovascular Heart Disease**

### 4. Snap Photo Camera Ingestor
* Integrates a live camera scanning interface directly inside the web client.
* Features an animated green laser scanning overlay, framing alignment brackets, and camera-switching support (allowing users to choose rear cameras on smartphones for optimal document focus).

### 5. Grounded RAG AI Health Assistant
* Allows patients to converse directly with **Gemini 2.0 Flash** via a unified client router.
* Grounded strictly by the patient's parsed biomarker data and historical trends, preventing hallucinations, and accompanied by persistent regulatory medical compliance disclaimers.

### 6. Chronological Biotech Trends
* Renders premium interactive AreaCharts (using Recharts) mapping long-term changes in patient biomarkers over weekly, monthly, and yearly intervals.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | FastAPI (Python), SQLAlchemy, SQLite (Development), PyMySQL |
| **ML & OCR** | OpenCV, PyTesseract, EasyOCR, Scikit-Learn, PDF2Image |
| **AI Integration** | Google Gemini API (via OpenRouter and GenerativeAI SDK) |
| **Reporting** | ReportLab (Automated PDF Generator) |

---

## 📁 Project Architecture

```
BioLens/
├── .github/workflows/      # Automated GitHub Action CI/CD Pipelines
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── api/            # Route endpoints (Auth, Reports, Analytics, Chat, Admin)
│   │   ├── core/           # Security, Database connections, Configurations
│   │   ├── models/         # SQLAlchemy Schemas
│   │   ├── schemas/        # Pydantic Validators
│   │   └── services/       # OCR pipeline, Gemini client, PDF builder, ML risk models
│   ├── database/           # SQLite databases & database seeders
│   └── tests/              # PyTest Unit Tests
├── frontend/               # Next.js 15 Web Application
│   ├── public/             # Image assets and CDN-delivered clinical photos
│   └── src/
│       ├── app/            # App router paths (Auth, Landing Page, Dashboard views)
│       ├── components/     # UI components (Circular Gauge, Camera Uploader, Charts)
│       ├── lib/            # Axios API wrappers & styling utilities
│       └── types/          # TypeScript interface types
└── jane_doe_lab_report.pdf # Sample PDF report for testing
```

---

## ⚙️ Setup & Local Installation

### Prerequisites
Make sure you have the following installed on your system:
* **Python 3.11+**
* **Node.js 20+**
* **Tesseract OCR Binary** (Add to system path variables)
* **Poppler** (For PDF rendering support)

### Step 1: Clone the Repository
```bash
git clone https://github.com/adityasing9/BioLens.git
cd BioLens
```

### Step 2: Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=mysql+pymysql://root:pass@localhost:3306/biolens_db
GEMINI_API_KEY=your_google_ai_studio_api_key
OPENROUTER_API_KEY=your_openrouter_api_key # Recommended
```

### Step 3: Run the Backend Server
```bash
cd backend
python -m venv venv
# Windows powershell:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API Documentation: **http://localhost:8000/docs**

### Step 4: Run the Frontend Client
```bash
cd ../frontend
npm install
npm run dev
```
* Access the BioLens web dashboard at: **http://localhost:3000**

---

## ⚖️ Academic Project Note & Medical Disclaimer
*This project has been developed as an academic **Bio Mini-Project**. The AI summaries, diagnostic evaluations, and risk scores calculated by BioLens are synthesized strictly using algorithmic parameters and are for educational and informational purposes only. They do not constitute formal medical advice, diagnoses, or treatments. Always consult a licensed primary care provider or doctor for medical decisions.*
