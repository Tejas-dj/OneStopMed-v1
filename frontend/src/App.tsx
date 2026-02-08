import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, FileDown, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  frequency: string;
  duration: string;
  suggestions: DrugSuggestion[];
  showSuggestions: boolean;
}

export default function App() {
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [isGenerating, setIsGenerating] = useState(false); // Loading state

  const [medicines, setMedicines] = useState<Medicine[]>([
    { 
      id: 1, 
      name: "", 
      generic: "---", 
      frequency: "1-0-1", 
      duration: "5 Days", 
      suggestions: [], 
      showSuggestions: false 
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
        frequency: "1-0-1",
        duration: "3 Days",
        suggestions: [],
        showSuggestions: false
      },
    ]);
  };

  const removeRow = (id: number) => {
    setMedicines(medicines.filter((med) => med.id !== id));
  };

  const handleDrugInput = async (id: number, value: string) => {
    setMedicines((prev) =>
      prev.map((med) =>
        med.id === id ? { ...med, name: value, showSuggestions: true } : med
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
      const response = await axios.get(`http://127.0.0.1:8000/search?q=${value}`);
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

  const selectDrug = (id: number, suggestion: DrugSuggestion) => {
    setMedicines((prev) =>
      prev.map((med) =>
        med.id === id
          ? {
              ...med,
              name: suggestion.brand,      
              generic: suggestion.generic, 
              showSuggestions: false,       
              suggestions: []
            }
          : med
      )
    );
  };

  // --- NEW: PDF GENERATION HANDSHAKE ---
  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // 1. Prepare the payload
      const payload = {
        patientName,
        age,
        gender,
        medicines: medicines.map(m => ({
            name: m.name,
            generic: m.generic,
            frequency: m.frequency,
            duration: m.duration
        }))
      };

      // 2. Send POST request (Expect a BLOB/File response)
      const response = await axios.post("http://127.0.0.1:8000/generate_pdf", payload, {
        responseType: 'blob', // IMPORTANT: This tells Axios to treat the result as binary data
      });

      // 3. Create a download link and click it programmatically
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${patientName || 'prescription'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove(); // Cleanup

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Check backend console.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl mb-8 shadow-2xl">
            <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
                OneStopMed ⚡
                </h1>
                <p className="text-slate-400 font-mono text-sm mt-1">v1.0 // Dr. Tejas Protocol</p>
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                System Settings
            </Button>
        </div>

        {/* PATIENT DETAILS */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-100/50 pb-4">
            <CardTitle className="text-lg text-slate-700">Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Full Name</label>
              <Input 
                placeholder="Ex: Rajesh Kumar" 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Age</label>
              <Input 
                placeholder="Ex: 45" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Gender</label>
              <Input 
                placeholder="Ex: Male" 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* PRESCRIPTION PAD */}
        <Card className="shadow-lg border-slate-200 min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between bg-slate-800 text-white rounded-t-lg">
            <CardTitle className="text-xl">Rx Prescription</CardTitle>
            <Button onClick={addRow} variant="secondary" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Medicine
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            
            <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-medium text-slate-500 border-b pb-2">
              <div className="col-span-5">Brand Name (Search)</div>
              <div className="col-span-4">Generic Name</div>
              <div className="col-span-2">Frequency</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            <div className="space-y-4">
              {medicines.map((med) => (
                <div key={med.id} className="grid grid-cols-12 gap-4 items-start relative">
                  
                  <div className="col-span-5 relative">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        className="pl-8 font-medium"
                        placeholder="Type brand name..."
                        value={med.name}
                        onChange={(e) => handleDrugInput(med.id, e.target.value)}
                        autoComplete="off"
                      />
                    </div>

                    {med.showSuggestions && med.suggestions.length > 0 && (
                      <div className="suggestion-box absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-2xl z-[9999] max-h-60 overflow-y-auto">
                        {med.suggestions.map((suggestion, idx) => (
                          <div 
                            key={idx}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                            onClick={() => selectDrug(med.id, suggestion)}
                          >
                            <div className="font-bold text-slate-800">{suggestion.brand}</div>
                            <div className="text-xs text-blue-600 font-mono">{suggestion.generic}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-4 pt-2 text-slate-600 font-mono text-sm font-semibold truncate">
                    {med.generic}
                  </div>

                  <div className="col-span-2">
                    <Input 
                      value={med.frequency} 
                      onChange={(e) => {
                           const newMeds = medicines.map(m => m.id === med.id ? {...m, frequency: e.target.value} : m);
                           setMedicines(newMeds);
                      }}
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeRow(med.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                </div>
              ))}
            </div>

          </CardContent>
        </Card>

        {/* FOOTER - NOW CONNECTED */}
        <div className="flex justify-end pt-4">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xl shadow-blue-200"
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
                    Generate PDF Prescription
                </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}