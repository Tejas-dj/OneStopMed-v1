import os
from fastapi import FastAPI, Query, HTTPException, Body, Depends, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from thefuzz import process
from pathlib import Path
import json
import io
from datetime import datetime
from supabase import create_client, Client

# --- SUPABASE CONFIG ---
SUPABASE_URL = "https://nplxmgrnkhffutppkqrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbHhtZ3Jua2hmZnV0cHBrcXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgwMDA5MywiZXhwIjoyMDg2Mzc2MDkzfQ.FJdqOleoAscQUUWJPcKmu0_Emma3m75IXgjvwxNDMUM"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROBUST DATA LOADING ---
BASE_DIR = Path(__file__).resolve().parent
possible_paths = [
    BASE_DIR / "data" / "drugs.json",
    BASE_DIR / "drugs.json",
    Path("data/drugs.json"),
]

DRUG_DB = {}
found = False

print(f"🔍 Looking for database... (Base: {BASE_DIR})")

for path in possible_paths:
    if path.exists():
        try:
            with open(path, "r") as f:
                DRUG_DB = json.load(f)
            print(f"✅ Loaded {len(DRUG_DB)} drugs from {path}")
            found = True
            break
        except Exception as e:
            print(f"❌ Error reading {path}: {e}")

if not found:
    print("❌ CRITICAL: drugs.json NOT FOUND.")

# --- AUTH HELPER (MISSING IN YOUR CODE) ---
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Token")
    
    try:
        token = authorization.split(" ")[1] # Remove "Bearer "
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid Token")

# --- SEARCH ENDPOINT ---
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
            
    return {"query": q, "results": results}

# --- PDF GENERATOR + SAVE ---
@app.post("/generate_pdf")
async def generate_pdf(
    data: dict = Body(...),
    user = Depends(get_current_user)
):
    # 1. PREPARE SUMMARY
    meds_list = data.get("medicines", [])
    meds_summary = ", ".join([f"{m.get('name')} ({m.get('frequency')})" for m in meds_list if m.get('name')])

    # 2. SAVE TO DATABASE
    try:
        print(f"📝 Saving record for Dr. {user.email}...")
        
        prescription_record = {
            "doctor_id": user.id,
            "patient_name": data.get("patientName", "Unknown"),
            "age": data.get("age", ""),
            "gender": data.get("gender", ""),
            "weight": data.get("weight", ""),
            "bp": data.get("bp", ""),
            "allergies": data.get("allergies", ""),
            "diagnosis": data.get("diagnosis", ""),
            "follow_up_date": data.get("followUpDate", ""),
            "follow_up_reason": data.get("followUpReason", ""),
            "medicines_summary": meds_summary,
            "full_data": data 
        }
        
        supabase.table("prescriptions").insert(prescription_record).execute()
        print("✅ Prescription saved to Supabase!")
        
    except Exception as e:
        print(f"⚠️ DATABASE ERROR: {e}")

    # 3. GENERATE PDF
    template_dir = BASE_DIR / "templates"
    
    try:
        env = Environment(loader=FileSystemLoader(str(template_dir)))
        template = env.get_template("prescription.html")
    except Exception as e:
        print(f"❌ Template Error: {e}")
        raise HTTPException(status_code=500, detail="Template missing.")

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