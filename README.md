# 🥛 IVRI Milk Quality Hub

A professional dairy management platform for automating milk quality analysis, quality control, and digital record keeping.

---

## ✨ Features

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS + Framer Motion |
| **Backend** | Python Flask REST API (modular blueprints) |
| **Database** | Supabase Postgres with SQLAlchemy ORM |
| **ML** | RandomForestClassifier + IsolationForest (scikit-learn) |
| **Auth** | JWT (access + refresh tokens) |
| **Exports** | Excel (openpyxl) + PDF (reportlab) |

### 🛠️ Decision Engine Rules (Source of Truth)

| Parameter | Range | Violation Meaning |
|-----------|-------|------------------|
| FAT % | 3.2 – 3.5 | Possible Adulteration |
| SNF % | 8.3 – 8.5 | Added Water |
| pH | 6.5 – 6.8 | Spoilage |
| Acidity | 0.10 – 0.15 | Souring |
| Temperature | ≤10 ideal / ≤15 acceptable | Spoilage Risk |
| Specific Gravity | 1.028 – 1.032 | Water Mixing |
| COB Test | Negative | Chemical Adulteration |
| Alcohol Test | Negative | Preservative Adulteration |
| Organoleptic | Normal | Smell/Color Defect |
| Sediment | Clean | Physical Contamination |
| MBRT | >3h Good / 2–3h Check / <2h Reject | Bacterial Load |
| Raw Milk Temp | 25 – 37°C | Quality Compromised |

---

## 📁 Project Structure

```text
smart-milk-system/
├── backend/
│   ├── app.py                    # Flask application entry point
│   ├── config.py                 # Configuration (env-based)
│   ├── requirements.txt
│   ├── .env                      # Environment variables
│   ├── models/
│   │   └── database.py           # SQLAlchemy ORM models
│   ├── routes/
│   │   ├── auth.py               # POST /login, /refresh, /me, /logout
│   │   ├── predict.py            # POST /predict  (manual entry)
│   │   ├── upload.py             # POST /upload   (batch xlsx/csv)
│   │   ├── records.py            # GET  /records, /dashboard, /farmers
│   │   ├── export.py             # GET  /export/excel, /export/pdf
│   │   └── settings.py          # GET/POST /settings
│   ├── services/
│   │   ├── decision_engine.py    # Core rule-based quality engine
│   │   ├── file_processor.py     # xlsx/csv parser with column aliasing
│   │   └── ml_service.py        # ML model wrapper
│   └── ml/
│       ├── train_models.py       # Train & save ML models
│       └── saved_models/         # joblib model files (auto-generated)
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx               # Router setup
│       ├── main.jsx
│       ├── index.css
│       ├── context/
│       │   └── AuthContext.jsx   # JWT auth state
│       ├── utils/
│       │   └── api.js            # Axios with auto-refresh
│       ├── components/
│       │   └── common/
│       │       └── Layout.jsx    # Sidebar + topbar layout
│       └── pages/
│           ├── LoginPage.jsx
│           ├── DashboardPage.jsx
│           ├── UploadPage.jsx
│           ├── ManualEntryPage.jsx
│           ├── RecordsPage.jsx
│           ├── FarmersPage.jsx
│           ├── FarmerDetailPage.jsx
│           ├── ReportsPage.jsx
│           └── SettingsPage.jsx
└── database/
    ├── schema.sql                # Database schema (reference)
    └── sample_data.csv           # 20 sample rows for testing
```

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase (Postgres)

---

### Step 1 — Supabase Database

Create the tables in your Supabase project (SQL editor or migrations).

---

### Step 2 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
# Windows: venv\Scripts\activate
# Unix: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train ML models
python ml/train_models.py

# Start server
python app.py
```
Backend runs at: **http://localhost:5001**

### Environment Variables (Backend)

Create `backend/.env` with:

```dotenv
SUPABASE_DB_URL=postgresql://user:password@db.your-project.supabase.co:5432/postgres
JWT_SECRET_KEY=smartmilksecret
FLASK_ENV=production
```

---

### Step 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

### Step 4 — Login

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `Admin@123` |

---

## 🧪 Testing the System

### Manual Entry Test
1. Go to **Manual Entry**
2. Enter valid parameters (e.g., FAT=3.3, SNF=8.4)
3. Click **VERIFY NOW** → Status: **ACCEPT**

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authentication |
| POST | `/api/predict` | Single sample decision |
| POST | `/api/upload` | Batch data processing |
| GET | `/api/dashboard` | KPI analytics |

---

## 🔒 Security
- Bcrypt password hashing
- JWT access/refresh tokens
- SQLAlchemy ORM protection
- Role-based access control

---

## 🤝 Support
Built for professional dairy quality management.

# SMART_MILK_SYSTEM-UPDATE-ML
