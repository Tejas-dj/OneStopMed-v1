import { useState } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom"; // <--- NEW IMPORT
import { Loader2, AlertCircle, Stethoscope, Activity } from "lucide-react"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } 
    // App.tsx handles the redirect automatically via onAuthStateChange
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT SIDE: The Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32">
        <div className="w-full max-w-sm mx-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-teal-600 mb-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Stethoscope size={24} />
              </div>
              <span className="font-bold tracking-tight text-lg text-slate-900">OneStopMed</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2 text-sm">Please enter your details to access the workstation.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="block w-full rounded-lg border-slate-200 bg-slate-50 border p-3 text-sm focus:border-teal-500 focus:ring-teal-500 focus:bg-white transition-all outline-none"
                placeholder="doctor@hospital.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="block w-full rounded-lg border-slate-200 bg-slate-50 border p-3 text-sm focus:border-teal-500 focus:ring-teal-500 focus:bg-white transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2 animate-pulse">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> 
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in to Dashboard"}
            </button>
          </form>
          
          {/* --- NEW SECTION: LINK TO REGISTER --- */}
          <div className="mt-6 text-center">
             <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-500 hover:underline">
                    Apply for Access
                </Link>
             </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Protected by HIPAA compliant encryption. <br/>
            Need help? Contact hospital IT support.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: The Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-0 -right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Content overlaid on background */}
        <div className="relative z-10 max-w-md px-8 text-center">
            <div className="mx-auto bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                <Activity className="text-teal-400 h-10 w-10 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold text-white mb-2">Streamlined Care</h3>
                <p className="text-slate-300 leading-relaxed">
                    "OneStopMed reduces clinical documentation time by 40%, allowing doctors to focus on what matters most—patient care."
                </p>
            </div>
            <div className="mt-8 flex justify-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-400"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-600"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-600"></div>
            </div>
        </div>
      </div>
    </div>
  );
}