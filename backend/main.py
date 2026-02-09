from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from thefuzz import process
from pathlib import Path
import json
import io
from datetime import datetime

app = FastAPI()

# --- CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROBUST DATA LOADING (Smart Search) ---
BASE_DIR = Path(__file__).resolve().parent
possible_paths = [
    BASE_DIR / "data" / "drugs.json",  # Priority 1: backend/data/drugs.json
    BASE_DIR / "drugs.json",           # Priority 2: backend/drugs.json
    Path("data/drugs.json"),           # Priority 3: Relative path from CWD
]

DRUG_DB = {}
found = False

print(f"🔍 Looking for database... (Base: {BASE_DIR})")

for path in possible_paths:
    if path.exists():
        print(f"✅ FOUND Database at: {path}")
        try:
            with open(path, "r") as f:
                DRUG_DB = json.load(f)
            print(f"✅ Loaded {len(DRUG_DB)} drugs.")
            found = True
            break
        except Exception as e:
            print(f"❌ Error reading {path}: {e}")

if not found:
    print("❌ CRITICAL: drugs.json NOT FOUND.")
    # Debug: List files so we can see where we are in the environment
    try:
        print(f"📂 Files in {BASE_DIR}: {[p.name for p in BASE_DIR.iterdir()]}")
        if (BASE_DIR / "data").exists():
            print(f"📂 Files in /data: {[p.name for p in (BASE_DIR / 'data').iterdir()]}")
    except Exception as e:
        print(f"⚠️ Could not list directory: {e}")

# --- INTELLIGENCE ENGINE V2 ---
@app.get("/search")
def search_drug(q: str = Query(..., min_length=2)):
    if not DRUG_DB:
        raise HTTPException(status_code=500, detail="Database error: drugs.json not loaded.")

    brands = list(DRUG_DB.keys())
    matches = process.extract(q, brands, limit=5)

    results = []
    for brand, score in matches:
        if score > 50: 
            results.append({
                "brand": brand,
                "generic": DRUG_DB[brand],
                "confidence": score
            })

    return {
        "query": q,
        "count": len(results),
        "results": results 
    }

# --- PDF GENERATOR ENDPOINT ---
@app.post("/generate_pdf")
async def generate_pdf(data: dict = Body(...)):
    """
    Receives clinical data and returns a PDF file.
    """
    # Since BASE_DIR is now /backend, we point directly to /templates
    template_dir = BASE_DIR / "templates"
    
    try:
        env = Environment(loader=FileSystemLoader(str(template_dir)))
        template = env.get_template("prescription.html")
    except Exception as e:
        print(f"❌ Template Error: {e}")
        raise HTTPException(status_code=500, detail="HTML Template not found.")

    context = {
        "patient_name": data.get("patientName", "Unknown"),
        "age": data.get("age", "--"),
        "gender": data.get("gender", "--"),
        "weight": data.get("weight", "--"),   
        "bp": data.get("bp", "--"),
        "allergies": data.get("allergies", "NKDA"),           
        "diagnosis": data.get("diagnosis", ""), 
        "follow_up_date": data.get("followUpDate", ""),
        "follow_up_reason": data.get("followUpReason", ""),
        "date": datetime.now().strftime("%d-%b-%Y"),
        "visit_id": datetime.now().strftime("%H%M%S"),
        "medicines": data.get("medicines", [])
    }

    html_content = template.render(context)

    pdf_file = io.BytesIO()
    HTML(string=html_content).write_pdf(pdf_file)
    pdf_file.seek(0)

    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=prescription.pdf"}
    )