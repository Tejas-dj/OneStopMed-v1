import csv
import sqlite3
import os

# CONFIG
CSV_PATH = "data/medicine_data.csv"
DB_PATH = "data/drugs.db"

def determine_type(pack_label, name):
    """
    Robust Type Detection.
    """
    # Combine them and lower case for easier matching
    text = f"{pack_label} {name}".lower()
    
    # 1. Check for liquids (Syrups, Suspensions)
    # We check these BEFORE tablets to catch things like "Dry Syrup" or "Suspension"
    if any(x in text for x in ["syrup", "suspension", "liquid", "solution", "linctus", "elixir", "oral drops"]):
        return "Syrup"
    
    # 2. Check for Drops (Eye/Ear/Nasal) - specifically if 'oral' wasn't caught above
    if "drop" in text:
        return "Drops"
        
    # 3. Check for Injections
    if any(x in text for x in ["injection", "vial", "ampoule", "pfs", "iv fluid", "infusion"]):
        return "Injection"
        
    # 4. Check for Topicals (Creams, Gels)
    if any(x in text for x in ["cream", "gel", "ointment", "lotion", "topical"]):
        return "Gel"
        
    # 5. Check for Inhalers
    if any(x in text for x in ["inhaler", "respules", "rotacaps", "transcaps"]):
        return "Inhaler"
    
    # 6. Check for Capsules
    if "capsule" in text or "cap " in text:
        return "Capsule"
        
    # 7. Check for Tablets (Most common, so checked last to avoid false positives)
    if any(x in text for x in ["tablet", "tab ", "strip of"]):
        return "Tablet"
    
    # 8. Powders/Sachets
    if "sachet" in text or "granules" in text or "powder" in text:
        return "Powder"
        
    return "Tablet" # Fallback is usually Tablet if unspecified

def ingest():
    print("🚀 Starting Robust Ingestion...")
    
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH) 
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create Table
    cursor.execute("""
        CREATE VIRTUAL TABLE drugs USING fts5(
            name, 
            generic, 
            type, 
            manufacturer,
            tokenize = 'porter'
        )
    """)
    
    with open(CSV_PATH, 'r', encoding='utf-8', errors='replace') as f:
        # Use standard reader (index-based) instead of DictReader
        reader = csv.reader(f)
        
        # Skip the Header Row
        next(reader, None)
        
        batch = []
        count = 0
        
        for row in reader:
            if len(row) < 5: continue # Skip malformed rows
            
            # MAPPING BASED ON YOUR CSV STRUCTURE:
            # 0: id
            # 1: name
            # 2: manufacturer_name
            # 3: pack_size_label  <-- Critical for Type
            # 4: short_composition1
            # 5: short_composition2
            
            name = row[1].strip()
            manufacturer = row[2].strip()
            pack_label = row[3].strip()
            
            # Handle Composition (Combine Col 4 and 5)
            comp1 = row[4].strip() if len(row) > 4 else ""
            comp2 = row[5].strip() if len(row) > 5 else ""
            generic = f"{comp1} + {comp2}".strip(" +")
            
            # Determine Type
            drug_type = determine_type(pack_label, name)
            
            # DEBUG: Print first 10 rows to console so user can verify
            if count < 10:
                print(f"[{count+1}] Found: {name[:20]}... | Pack: {pack_label[:15]}... -> DETECTED: {drug_type}")
            
            if name:
                batch.append((name, generic, drug_type, manufacturer))
                count += 1
            
            if len(batch) >= 1000:
                cursor.executemany("INSERT INTO drugs (name, generic, type, manufacturer) VALUES (?, ?, ?, ?)", batch)
                batch = []
                print(f"Processed {count} rows...", end='\r')
        
        if batch:
            cursor.executemany("INSERT INTO drugs (name, generic, type, manufacturer) VALUES (?, ?, ?, ?)", batch)
            
    conn.commit()
    conn.close()
    print(f"\n✅ SUCCESS! Database created at {DB_PATH} with {count} medicines.")

if __name__ == "__main__":
    ingest()