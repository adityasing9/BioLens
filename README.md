# 🧬 BioLens - AI Health Report Analyzer

<p align="center">
  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80" alt="BioLens Clinical Data Analytics Banner" width="100%" style="border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />
</p>

BioLens is an advanced full-stack biotechnology health intelligence platform built as a **Biotech Mini-Project**. It is designed to ingest raw clinical laboratory report scans (PDF, PNG, JPEG) or live camera photographs, binarize and extract their data using a hybrid OCR pipeline, calculate comprehensive health scores, model disease risk probability margins, and provide RAG-grounded AI diagnostic consultations.

---

## 🖥️ Platform Showcase

<p align="center">
  <img src="frontend/public/dashboard_mockup.png" alt="BioLens Patient Dashboard" width="49%" style="border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 8px 24px rgba(0,0,0,0.12);" />
  <img src="frontend/public/ai_assistant_mockup.png" alt="BioLens RAG AI Assistant" width="49%" style="border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 8px 24px rgba(0,0,0,0.12);" />
</p>

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

## 🔬 Deep Technical Dive

### A. Hybrid OCR & Image Ingestion Pipeline
When a user uploads a scan or snaps a photo of a laboratory document, it goes through a multi-stage computer vision cleaning pipeline before text parsing:
1. **Grayscale Binarization:** OpenCV converts the image to grayscale to discard color noise.
2. **Gaussian Blurring:** Applies a $5 \times 5$ Gaussian kernel filter to smooth pixel transitions and remove scan noise.
3. **Adaptive Thresholding:** Uses adaptive Gaussian thresholding (`cv2.ADAPTIVE_THRESH_GAUSSIAN_C`) which calculates local thresholds for $11 \times 11$ neighborhood pixels. This cleans shadows, folds, and highlights dynamically.
4. **OCR Engine Voting:** The binarized image is parsed by PyTesseract, while EasyOCR processes the original high-resolution scan. A decision-tree merger aligns their extractions, whitelisting clinical biomarker keywords and prioritizing PyTesseract numeric values, falling back to EasyOCR for low-confidence characters.

### B. Weighted Health Index Algorithm
The Circular Health Score is computed mathematically by evaluating 17 biomarkers against their normal clinical reference bounds $[Ref_{min}, Ref_{max}]$:
1. **Individual Parameter Score ($S_p$):**
   * If value is normal: $S_p = 100$
   * If value is borderline LOW/HIGH: $S_p \in [60, 80]$ (calculated by distance from the normal range center)
   * If value is far from bounds: $S_p \in [20, 40]$
   * If value is CRITICAL: $S_p \in [0, 20]$
2. **Aggregate Health Index Score:**
   $$\text{Health Score} = \frac{\sum (S_p \times W_p)}{\sum W_p}$$
   Where $W_p$ is the clinical weight assigned to each biomarker (e.g., Hemoglobin: 8, HbA1c: 8, Creatinine: 6, LDL: 7, TSH: 5, SGPT: 6).
3. **Clinical Grade Classification:**
   * $\ge 85$: **EXCELLENT**
   * $\ge 70$: **GOOD**
   * $\ge 50$: **MODERATE**
   * $< 50$: **POOR**

### C. ML Classifier Risk Assessment Models
BioLens implements rule-based classifiers simulating Scikit-Learn models to predict probability scores:
* **Diabetes Risk:** Assesses $HbA1c$ ($\ge 6.5\%$ triggers HIGH, $5.7\%-6.4\%$ triggers MEDIUM) and fasting blood glucose levels ($\ge 126\text{ mg/dL}$ triggers HIGH risk).
* **Anemia Risk:** Evaluates $Hemoglobin$ ($<10.0\text{ g/dL}$ triggers HIGH) and $RBC$ counts (scaled by patient gender/age).
* **Thyroid Risk:** Monitors $TSH$ ($<0.4$ or $>4.0\text{ \mu IU/mL}$ triggers HIGH) and borderline deviations in $T3$ and $T4$ hormone levels.
* **Kidney Risk:** Assesses glomerular function through $Creatinine$ ($>1.3\text{ mg/dL}$ triggers HIGH) and $Uric\text{ }Acid$ ($\ge 7.0\text{ mg/dL}$ triggers HIGH).
* **Liver Risk:** Monitors active enzymes $SGOT$ ($>40\text{ U/L}$) and $SGPT$ ($>40\text{ U/L}$). Double elevations flag HIGH risk margins.
* **Cardiovascular Risk:** Assesses lipid panels by combining elevated $LDL$ ($>160\text{ mg/dL}$), $Triglycerides$ ($>200\text{ mg/dL}$), $Cholesterol$ ($>240\text{ mg/dL}$), and low protective $HDL$ ($<40\text{ mg/dL}$).

### D. Grounded RAG Chatbot Integration
The interactive medical AI consultant utilizes a Retrieval-Augmented Generation (RAG) framework:
1. **Context Construction:** On user message submission, BioLens queries the SQL database for the patient's recent parsed parameters, health scores, risk assessments, and demographics.
2. **Prompts Grounding:** The Gemini model is initialized with a clinical system instruction block:
   > *"You are BioLens AI. You explain parsed biomarker trends in simple terms. You must strictly ground your advice using the provided context. You must never diagnose diseases. You must always output the legal medical disclaimer."*
3. **Safe Inference:** By wrapping the conversation with contextual parameters, the assistant provides highly personalized support without hallucinating standard medical advice.

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
