import os
import sqlite3
import io
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Query, HTTPException, Body, Depends, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from supabase import create_client, Client

# --- SUPABASE CONFIG ---
# (Keep your keys secure in production!)
SUPABASE_URL = "https://nplxmgrnkhffutppkqrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbHhtZ3Jua2hmZnV0cHBrcXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgwMDA5MywiZXhwIjoyMDg2Mzc2MDkzfQ.FJdqOleoAscQUUWJPcKmu0_Emma3m75IXgjvwxNDMUM"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- APP SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PASSWORD HASHING CONFIG ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- DATA MODELS ---
class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    nmc_reg_number: str
    phone: str

# --- HELPER FUNCTIONS ---
def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Token")
    try:
        token = authorization.split(" ")[1]
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid Token")

# --- DATABASE CONNECTION (SQLITE) ---
def get_db_connection():
    # Points to backend/data/drugs.db
    db_path = Path(__file__).resolve().parent / "data" / "drugs.db"
    
    if not db_path.exists():
        print(f"❌ CRITICAL: Database not found at {db_path}")
        
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row 
    return conn

# ==========================================
#               ENDPOINTS
# ==========================================

@app.post("/register", status_code=201)
async def register_doctor(req: RegisterRequest):
    try:
        existing = supabase.table("pending_registrations").select("email").eq("email", req.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Application already pending.")
    except Exception as e:
        print(f"Check Error: {e}")

    hashed_pw = get_password_hash(req.password)
    user_data = {
        "full_name": req.full_name,
        "email": req.email,
        "password_hash": hashed_pw,
        "nmc_reg_number": req.nmc_reg_number,
        "phone": req.phone,
        "status": "pending"
    }

    try:
        supabase.table("pending_registrations").insert(user_data).execute()
        return {"message": "Application submitted successfully."}
    except Exception as e:
        print(f"Registration Error: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# --- NEW SQL SEARCH ENDPOINT ---
@app.get("/search")
def search_drug(q: str = Query(..., min_length=2)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # FTS5 Search Query
        search_query = f"{q}*" 
        
        cursor.execute("""
            SELECT name as brand, generic, type, manufacturer 
            FROM drugs 
            WHERE drugs MATCH ? 
            ORDER BY rank 
            LIMIT 20
        """, (search_query,))
        
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            results.append({
                "brand": row['brand'],
                "generic": row['generic'],
                "type": row['type'], 
                "manufacturer": row['manufacturer'],
                "confidence": 100 
            })
            
        return {"query": q, "results": results}
        
    except Exception as e:
        print(f"Search Error: {e}")
        return {"query": q, "results": []}


@app.post("/generate_pdf")
async def generate_pdf(
    data: dict = Body(...),
    user = Depends(get_current_user)
):
    meds_list = data.get("medicines", [])
    meds_summary = ", ".join([f"{m.get('name')} ({m.get('frequency')})" for m in meds_list if m.get('name')])

    try:
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
    except Exception as e:
        print(f"⚠️ DATABASE ERROR: {e}")

    # Generate PDF
    BASE_DIR = Path(__file__).resolve().parent
    template_dir = BASE_DIR / "templates"
    
    try:
        env = Environment(loader=FileSystemLoader(str(template_dir)))
        template = env.get_template("prescription.html")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Template error.")

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
        
        # --- Flags for Chronic Conditions ---
        "isHypertensive": data.get("isHypertensive", False),
        "isDiabetic": data.get("isDiabetic", False),
        
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