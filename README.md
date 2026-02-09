# OneStopMed 🏥

**AI-Powered Clinical Workbench & Prescription Generator**

OneStopMed is a modern, full-stack medical application designed to streamline the prescription workflow for doctors in India. It features an intelligent "Fuzzy Search" engine for instant drug retrieval, a medical-grade React interface, and a robust PDF generation engine that creates legally compliant, printable prescriptions.

---

## 🚀 Key Features

* **⚡ Zero-Latency Drug Search:**
    * Uses Levenshtein Distance (Fuzzy Logic) to handle typos instantly (e.g., "dolo" -> "DOLO 650").
    * Powered by `TheFuzz` and optimized Python dictionaries.
* **📄 Medical-Grade PDF Generation:**
    * Generates high-resolution, vector-based PDF prescriptions.
    * Uses `WeasyPrint` and `Jinja2` templating for pixel-perfect layouts.
    * Auto-formatted with Doctor credentials, Patient Vitals, and Rx Symbols.
* **🧠 Intelligent Auto-Complete:**
    * Smart dropdowns that suggest brands and auto-fill generic compositions.
    * Prevents prescription errors by validating drug names against a curated database.
* **🎨 Modern UI/UX:**
    * Built with React (Vite) + TypeScript.
    * Styled with Tailwind CSS and **Shadcn/ui** for a clean, accessibility-focused design.
    * Fully responsive grid layouts.

---

## 🛠️ Tech Stack

### **Frontend (The Face)**
* **Framework:** React 18 (Vite)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Components:** Shadcn/ui (Radix Primitives)
* **State Management:** React Hooks (`useState`, `useEffect`)
* **HTTP Client:** Axios

### **Backend (The Brain)**
* **Framework:** FastAPI (Python 3.11)
* **Server:** Uvicorn (ASGI)
* **Search Logic:** TheFuzz (Levenshtein Distance)
* **PDF Engine:** WeasyPrint + GTK3
* **Templating:** Jinja2

### **Infrastructure & Deployment**
* **Backend Hosting:** Render (Docker/Python Environment)
* **Frontend Hosting:** Vercel
* **Configuration:** `render.yaml` (Infrastructure as Code)

---

## 📂 Project Structure

```bash
OneStopMed/
├── backend/                 # Python/FastAPI Logic
│   ├── templates/           # HTML Templates for PDF Generation
│   │   └── prescription.html
│   └── main.py              # API Endpoints (Search, PDF Gen)
├── frontend/                # React Application
│   ├── src/
│   │   ├── components/ui/   # Shadcn Reusable Components
│   │   └── App.tsx          # Main UI Logic
│   └── vite.config.ts
├── data/                    # Data Layer
│   └── drugs.json           # JSON Database of Medicines
├── render.yaml              # Cloud Deployment Configuration
└── requirements.txt         # Python Dependencies

```

---

## ⚡ Local Development Setup

Follow these steps to run the project on your local machine.

### **1. Prerequisites**

* **Python 3.11+** installed.
* **Node.js v18+** installed.
* **GTK3 Runtime** (Required for WeasyPrint on Windows).

### **2. Backend Setup**

```bash
# Navigate to project root
cd OneStopMed

# Create Virtual Environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Run the Server
uvicorn backend.main:app --reload

```

*The API will be live at `http://127.0.0.1:8000*`

### **3. Frontend Setup**

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install Node Modules
npm install

# Run the Development Server
npm run dev

```

*The UI will be live at `http://localhost:5173*`

---

## ☁️ Deployment Guide

### **Backend (Render)**

This project includes a `render.yaml` file for automated deployment.

1. Push code to GitHub.
2. Create a new **Blueprint** on Render.
3. Connect the repository.
4. Render will automatically install Python dependencies and system-level packages (`pango`, `cairo`, `gdk-pixbuf`) required for PDF generation.

### **Frontend (Vercel)**

1. Import repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects Vite and deploys.
4. **Crucial:** Update the API URL in `App.tsx` to point to the Render Backend URL.

---

## 🔮 Roadmap

* [x] Phase 1: Fuzzy Search API
* [x] Phase 2: React Frontend & UI
* [x] Phase 3: PDF Generation
* [x] Phase 4: Cloud Deployment
* [ ] **Phase 5 (In Progress):** Doctor Authentication & Login
* [ ] **Phase 6:** Persistent Database (PostgreSQL/Supabase) integration for prescription history.

---

## 🛡️ License & Disclaimer

* **Status:** Private / Proprietary.
* **Disclaimer:** This tool is an assistive technology for registered medical practitioners. It does not replace professional medical judgment. Generated prescriptions must be physically signed/verified by a licensed doctor.

---

**Developed by Tejas D. Jaiprakash**
*AIML Student & Full Stack Developer*

```

```