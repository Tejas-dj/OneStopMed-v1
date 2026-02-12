import { useState } from "react";
import { supabase } from "./supabaseClient";
import { Loader2, Lock } from "lucide-react"; 
// DJ: If you don't have lucide-react, run: npm install lucide-react
// Or just remove the Icon components if you want to move fast.

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
    // If successful, Supabase updates the session automatically.
    // App.tsx will detect this and switch screens.
};

return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">OneStopMed ⚡</h1>
        <p className="text-slate-500 mt-2">Doctor Clinical Workstation</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
        <div>
            <label className="text-xs font-bold uppercase text-slate-500">Email</label>
            <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
            placeholder="doctor@example.com"
            required
            />
        </div>
        <div>
            <label className="text-xs font-bold uppercase text-slate-500">Password</label>
            <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
            placeholder="••••••••"
            required
            />
        </div>

        {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2">
            <Lock className="h-4 w-4" /> {error}
            </div>
        )}

        <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-all"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Secure Login"}
        </button>
        </form>
    </div>
    </div>
);
}