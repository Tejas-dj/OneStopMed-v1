import { useState } from "react";
import { Link } from "react-router-dom"; // Assuming you use React Router
import { Loader2, CheckCircle2, ShieldCheck, Activity } from "lucide-react"; 
import axios from "axios";

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    nmc_reg_number: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Adjust URL if your backend port differs
      await axios.post("http://127.0.0.1:8000/register", formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Received</h2>
          <p className="text-slate-500 mb-6">
            Thanks, Dr. {formData.full_name}. We are verifying your NMC credentials. 
            <br />Access is usually granted within 24-48 hours.
          </p>
          <Link to="/" className="text-teal-600 font-semibold hover:text-teal-700 hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 py-12">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
             <div className="flex items-center gap-2 text-teal-600 mb-2">
                <div className="p-2 bg-teal-100 rounded-lg">
                    <ShieldCheck size={24} />
                </div>
                <span className="font-bold tracking-tight text-lg text-slate-900">OneStopMed</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Apply for Access</h2>
            <p className="text-slate-500 mt-2 text-sm">Join the clinical network. Verification required.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name</label>
              <input name="full_name" required onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-slate-50 border p-2.5 text-sm focus:border-teal-500 focus:ring-teal-500 outline-none" placeholder="Dr. John Doe" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">NMC Reg No</label>
                    <input name="nmc_reg_number" required onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-slate-50 border p-2.5 text-sm focus:border-teal-500 focus:ring-teal-500 outline-none" placeholder="KMC-12345" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone</label>
                    <input name="phone" required onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-slate-50 border p-2.5 text-sm focus:border-teal-500 focus:ring-teal-500 outline-none" placeholder="9876543210" />
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
              <input type="email" name="email" required onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-slate-50 border p-2.5 text-sm focus:border-teal-500 focus:ring-teal-500 outline-none" placeholder="doctor@hospital.com" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
              <input type="password" name="password" required onChange={handleChange} className="block w-full rounded-lg border-slate-200 bg-slate-50 border p-2.5 text-sm focus:border-teal-500 focus:ring-teal-500 outline-none" placeholder="••••••••" />
            </div>

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition-all disabled:opacity-70 flex justify-center">
              {loading ? <Loader2 className="animate-spin" /> : "Submit Application"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an ID? <Link to="/" className="text-teal-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>

      {/* RIGHT: Visuals */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 -right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 max-w-md px-8 text-center">
             <div className="mx-auto bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                <Activity className="text-teal-400 h-10 w-10 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold text-white mb-2">Secure & Verified</h3>
                <p className="text-slate-300 leading-relaxed">
                    "We verify every practitioner to ensure the integrity of the OneStopMed network."
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}