from fastapi.responses import StreamingResponse
from fastapi import Body
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import io
from datetime import datetime
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from thefuzz import process
import json
from pathlib import Path

app = FastAPI()

# --- CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD DATA ---
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "drugs.json"

try:
    with open(DATA_FILE, "r") as f:
        DRUG_DB = json.load(f)
    print(f"✅ Loaded {len(DRUG_DB)} drugs.")
except FileNotFoundError:
    print("❌ ERROR: drugs.json not found.")
    DRUG_DB = {}

# --- INTELLIGENCE ENGINE V2 ---
@app.get("/search")
def search_drug(q: str = Query(..., min_length=2)):
    if not DRUG_DB:
        raise HTTPException(status_code=500, detail="Database error.")

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
    template_dir = BASE_DIR / "backend" / "templates"
    env = Environment(loader=FileSystemLoader(str(template_dir)))
    template = env.get_template("prescription.html")

    # Capture NEW fields
    context = {
        "patient_name": data.get("patientName", "Unknown"),
        "age": data.get("age", "--"),
        "gender": data.get("gender", "--"),
        "weight": data.get("weight", "--"),   
        "bp": data.get("bp", "--"),
        "allergies": data.get("allergies", "NKDA"), # NEW           
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