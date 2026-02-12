import React, { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js"; // Added 'type' keyword here
import { supabase } from "./supabaseClient";
import Login from "./Login";
import axios from "axios";
import { 
  Plus, Trash2, FileDown, Search, Loader2, Activity, 
  CalendarClock, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";


// --- TYPES ---
interface DrugSuggestion {
  brand: string;
  generic: string;
  confidence: number;
}

interface Medicine {
  id: number;
  name: string;
  generic: string;
  dosage: string;
  frequency: string;
  duration: string; 
  timing: string;
  remarks: string;
  suggestions: DrugSuggestion[];
  showSuggestions: boolean;
  activeSuggestionIndex: number; // NEW: Tracks keyboard selection
}

export default function App() {

  // --- BOUNCER LOGIC START ---
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1. While checking, show a simple loading screen
  if (loadingSession) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  // 2. If NO session, show the Login screen instead of the Dashboard
  if (!session) {
    return <Login />;
  }
  // --- BOUNCER LOGIC END ---

  // --- PATIENT STATE ---
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [weight, setWeight] = useState(""); 
  
  // BP STATE & VALIDATION
  const [bp, setBp] = useState("");          
  const [bpError, setBpError] = useState(false);

  const [allergies, setAllergies] = useState("NKDA (No Known Drug Allergies)");
  const [diagnosis, setDiagnosis] = useState(""); 
  
  // --- FOLLOW UP STATE ---
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  const [medicines, setMedicines] = useState<Medicine[]>([
    { 
      id: 1, 
      name: "", 
      generic: "---", 
      dosage: "1 Tablet", 
      frequency: "1-0-1", 
      duration: "5", 
      timing: "After Food", 
      remarks: "", 
      suggestions: [], 
      showSuggestions: false,
      activeSuggestionIndex: -1 // Default: No selection
    },
  ]);

  // --- CLICK OUTSIDE TO CLOSE DROPDOWNS ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest(".suggestion-box")) return;
      setMedicines(prev => prev.map(m => ({ ...m, showSuggestions: false })));
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addRow = () => {
    setMedicines([
      ...medicines,
      {
        id: medicines.length + 1,
        name: "",
        generic: "---",
        dosage: "1 Tablet",
        frequency: "1-0-1",
        duration: "3",
        timing: "After Food",
        remarks: "",
        suggestions: [],
        showSuggestions: false,
        activeSuggestionIndex: -1
      },
    ]);
  };

  const removeRow = (id: number) => {
    setMedicines(medicines.filter((med) => med.id !== id));
  };

  // --- BP HANDLER ---
  const handleBpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(" ", "/");
    val = val.replace(/[^0-9/]/g, "");
    setBp(val);

    if (val.includes("/")) {
        const parts = val.split("/");
        const sys = Number(parts[0]);
        const dia = Number(parts[1]);
        if ((sys && sys > 250) || (dia && dia > 150)) {
            setBpError(true);
        } else {
            setBpError(false);
        }
    } else {
        setBpError(false);
    }
  };

  // --- DRUG SEARCH HANDLER ---
  const handleDrugInput = async (id: number, value: string) => {
    setMedicines((prev) =>
      prev.map((med) =>
        med.id === id 
          ? { ...med, name: value, showSuggestions: true, activeSuggestionIndex: -1 } 
          : med
      )
    );

    if (value.length < 2) {
      setMedicines((prev) =>
        prev.map((med) =>
          med.id === id ? { ...med, suggestions: [], generic: "---" } : med
        )
      );
      return;
    }

    try {
      const response = await axios.get(`https://onestopmed-v1-api.onrender.com/search?q=${value}`);
      if (response.data.results && response.data.results.length > 0) {
        setMedicines((prev) =>
          prev.map((med) =>
            med.id === id
              ? { ...med, suggestions: response.data.results } 
              : med
          )
        );
      }
    } catch (error) {
      console.error("API Error");
    }
  };

  // --- KEYBOARD NAVIGATION (NEW) ---
  const handleKeyDown = (id: number, e: React.KeyboardEvent) => {
    const med = medicines.find(m => m.id === id);
    if (!med || !med.showSuggestions || med.suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        setMedicines(prev => prev.map(m => 
            m.id === id 
            ? { ...m, activeSuggestionIndex: Math.min(m.activeSuggestionIndex + 1, m.suggestions.length - 1) } 
            : m
        ));
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMedicines(prev => prev.map(m => 
            m.id === id 
            ? { ...m, activeSuggestionIndex: Math.max(m.activeSuggestionIndex - 1, 0) } 
            : m
        ));
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (med.activeSuggestionIndex >= 0) {
            selectDrug(id, med.suggestions[med.activeSuggestionIndex]);
        }
    } else if (e.key === "Escape") {
        setMedicines(prev => prev.map(m => m.id === id ? { ...m, showSuggestions: false } : m));
    }
  };

  const selectDrug = (id: number, suggestion: DrugSuggestion) => {
    setMedicines((prev) =>
      prev.map((med) =>
        med.id === id
          ? {
              ...med,
              name: suggestion.brand,      
              generic: suggestion.generic, 
              showSuggestions: false,       
              suggestions: [],
              activeSuggestionIndex: -1
            }
          : med
      )
    );
  };

  // --- PDF GENERATION ---
  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        patientName,
        age,
        gender,
        weight,      
        bp,
        allergies,      
        diagnosis,
        followUpDate,   
        followUpReason, 
        medicines: medicines.map(m => ({
            name: m.name,
            generic: m.generic,
            dosage: m.dosage, 
            frequency: m.frequency,
            duration: m.duration ? `${m.duration} Days` : "",
            timing: m.timing,
            remarks: m.remarks 
        }))
      };

      const response = await axios.post("https://onestopmed-v1-api.onrender.com/generate_pdf", payload, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${patientName || 'prescription'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove(); 

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Check backend console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl mb-8 shadow-2xl">
            <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
                OneStopMed ⚡
                </h1>
                <p className="text-slate-400 font-mono text-sm mt-1">v1.6 // Keyboard Pro</p>
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Dr. Tejas
            </Button>
        </div>

        {/* SECTION 1: VITALS & DIAGNOSIS */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-100/50 pb-4 flex flex-row items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600"/>
            <CardTitle className="text-lg text-slate-700">Clinical Vitals & Diagnosis</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Full Name</label>
              <Input placeholder="Patient Name" value={patientName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)}/>
            </div>
            
            <div className="md:col-span-1 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Age</label>
              <Input placeholder="45" value={age} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAge(e.target.value)}/>
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Gender</label>
              <select 
                className={selectClass}
                value={gender}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider text-emerald-600">Weight (kg)</label>
              <Input placeholder="70" value={weight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)}/>
            </div>
            
            {/* UPDATED: BP with Logic */}
            <div className="md:col-span-2 space-y-2">
               <label className="text-xs font-bold uppercase text-slate-500 tracking-wider text-emerald-600">BP (mmHg)</label>
              <Input 
                placeholder="120 80" 
                value={bp} 
                onChange={handleBpChange}
                className={bpError ? "border-red-500 focus-visible:ring-red-500 bg-red-50" : ""}
              />
              {bpError && <span className="text-[10px] text-red-500 font-bold">Check Value!</span>}
            </div>

             {/* NEW: Allergies Row */}
             <div className="md:col-span-12 space-y-2">
              <label className="text-xs font-bold uppercase text-red-600 tracking-wider flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Known Allergies
              </label>
              <Input 
                value={allergies} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAllergies(e.target.value)}
                className="border-red-200 text-red-700 font-semibold focus-visible:ring-red-500 bg-red-50/30"
              />
            </div>

            <div className="md:col-span-12 space-y-2 pt-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Diagnosis / Chief Complaints</label>
              <Textarea 
                placeholder="Ex: Acute Pharyngitis, Fever (3 days)..." 
                className="resize-none"
                value={diagnosis}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDiagnosis(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: PRESCRIPTION PAD */}
        <Card className="shadow-lg border-slate-200 min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between bg-slate-800 text-white rounded-t-lg">
            <CardTitle className="text-xl">Rx Prescription</CardTitle>
            <Button onClick={addRow} variant="secondary" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Medicine
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 mb-4 text-xs font-bold uppercase text-slate-500 border-b pb-2 tracking-wider">
              <div className="col-span-3">Medicine (Brand)</div>
              <div className="col-span-2">Generic</div>
              <div className="col-span-2">Dosage</div>
              <div className="col-span-1">Freq</div>
              <div className="col-span-2">Timing</div>
              <div className="col-span-1">Dur</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
            
            <div className="space-y-6">
              {medicines.map((med) => (
                <div key={med.id} className="group relative bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-blue-200 transition-all">
                  
                  <div className="grid grid-cols-12 gap-4 items-start">
                    
                    {/* Brand Name */}
                    <div className="col-span-3 relative">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          className="pl-8 font-bold text-slate-800"
                          placeholder="Search..."
                          value={med.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDrugInput(med.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(med.id, e)} // NEW KEYBOARD HANDLER
                          autoComplete="off"
                        />
                      </div>
                      
                      {/* DROPDOWN LOGIC */}
                      {med.showSuggestions && med.suggestions.length > 0 && (
                        <div className="suggestion-box absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-2xl z-[9999] max-h-60 overflow-y-auto">
                          {med.suggestions.map((suggestion, idx) => (
                            <div 
                              key={idx}
                              // NEW: Conditional Styling for Keyboard Highlight
                              className={`p-3 cursor-pointer border-b last:border-0 transition-colors ${
                                  idx === med.activeSuggestionIndex 
                                  ? "bg-blue-100 border-l-4 border-l-blue-500" // Highlight Style
                                  : "hover:bg-blue-50"
                              }`}
                              onClick={() => selectDrug(med.id, suggestion)}
                              onMouseEnter={() => {
                                  // Sync mouse hover with state
                                  setMedicines(prev => prev.map(m => m.id === med.id ? {...m, activeSuggestionIndex: idx} : m));
                              }}
                            >
                              <div className="font-bold text-slate-800">{suggestion.brand}</div>
                              <div className="text-xs text-blue-600 font-mono">{suggestion.generic}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Generic */}
                    <div className="col-span-2 pt-2 text-slate-600 font-mono text-xs truncate" title={med.generic}>
                      {med.generic}
                    </div>

                    {/* Dosage Options */}
                    <div className="col-span-2">
                        <select 
                        className={selectClass}
                        value={med.dosage}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const newMeds = medicines.map(m => m.id === med.id ? {...m, dosage: e.target.value} : m);
                            setMedicines(newMeds);
                        }}
                        >
                          <option value="1 Tablet">1 Tablet</option>
                          <option value="1/2 Tablet">1/2 (Half)</option>
                          <option value="1/4 Tablet">1/4 (Quarter)</option>
                          <option value="3/4 Tablet">3/4 (Three Qtr)</option>
                          <option value="1 & 1/4 Tablet">1 & 1/4 Tablet</option>
                          <option value="1 & 1/2 Tablet">1 & 1/2 Tablet</option>
                          <option value="2 Tablets">2 Tablets</option>
                        </select>
                    </div>

                    {/* Frequency */}
                    <div className="col-span-1">
                      <Input 
                        value={med.frequency} 
                        className="text-center font-mono px-1"
                        placeholder="1-0-1"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const val = e.target.value.replace(/[^0-9-]/g, '');
                            const newMeds = medicines.map(m => m.id === med.id ? {...m, frequency: val} : m);
                            setMedicines(newMeds);
                        }}
                      />
                    </div>

                    {/* Timing */}
                    <div className="col-span-2">
                        <select 
                        className={selectClass}
                        value={med.timing}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const newMeds = medicines.map(m => m.id === med.id ? {...m, timing: e.target.value} : m);
                            setMedicines(newMeds);
                        }}
                        >
                          <option value="-">-</option>
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                          <option value="With Food">With Food</option>
                        </select>
                    </div>

                    {/* Duration */}
                    <div className="col-span-1">
                        <div className="flex items-center gap-1">
                            <Input 
                                type="number"
                                min="1"
                                value={med.duration} 
                                className="text-center px-1"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const newMeds = medicines.map(m => m.id === med.id ? {...m, duration: e.target.value} : m);
                                    setMedicines(newMeds);
                                }}
                            />
                        </div>
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 flex justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => removeRow(med.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Remarks Row */}
                  <div className="mt-3 grid grid-cols-12 gap-4">
                      <div className="col-span-12">
                        <Input 
                            placeholder="Additional Remarks..." 
                            className="bg-transparent border-0 border-b border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-500 px-0 text-xs text-slate-500"
                            value={med.remarks}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newMeds = medicines.map(m => m.id === med.id ? {...m, remarks: e.target.value} : m);
                                setMedicines(newMeds);
                            }}
                        />
                      </div>
                  </div>

                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FOLLOW UP */}
        <Card className="shadow-sm border-slate-200 bg-blue-50/50">
          <CardHeader className="pb-4 flex flex-row items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600"/>
            <CardTitle className="text-lg text-slate-700">Next Visit / Follow Up</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Date of Return</label>
              <Input 
                type="date"
                value={followUpDate} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFollowUpDate(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="md:col-span-9 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Reason for Visit</label>
              <Input 
                placeholder="Ex: Blood Test Review..." 
                value={followUpReason} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFollowUpReason(e.target.value)}
                className="bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <div className="flex justify-end pt-4 pb-12">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xl shadow-blue-200 w-full md:w-auto"
            onClick={handleGeneratePDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <FileDown className="h-5 w-5" />
                    Sign & Generate PDF
                </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
