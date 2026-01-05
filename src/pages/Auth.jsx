import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // --- GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Ensure this points to your production URL or localhost:5173
        redirectTo: window.location.origin + '/Home',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    if (error) toast.error(error.message);
  };

  // --- EMAIL/PASSWORD ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      
      if (isSignUp) {
        toast.success("Account created! Check your email for a confirmation link.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center px-8 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      
      <div className="mb-12 text-center relative z-10">
        <div className="w-20 h-20 bg-cyan-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/20">
          <Dumbbell size={40} className="text-black" />
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
          Iron<span className="text-cyan-500 text-stroke-thin">Tracker</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
          Authentication Required
        </p>
      </div>

      <div className="max-w-sm mx-auto w-full space-y-6 relative z-10">
        {/* Primary Action: Google */}
        <Button 
          onClick={handleGoogleLogin}
          className="w-full h-16 bg-white text-black hover:bg-cyan-500 hover:text-white transition-all rounded-[2rem] font-black uppercase italic tracking-widest flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black text-zinc-600">
            <span className="bg-black px-4">Or use credentials</span>
          </div>
        </div>

        {/* Fallback: Email/Password */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <Input 
              type="email" placeholder="Email Address" 
              className="bg-zinc-900 border-zinc-800 h-14 pl-12 rounded-2xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <Input 
              type="password" placeholder="Password" 
              className="bg-zinc-900 border-zinc-800 h-14 pl-12 rounded-2xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-14 bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800 rounded-2xl font-black uppercase tracking-widest transition-all">
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "Create Account" : "Sign In")}
          </Button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-cyan-500 transition-colors"
        >
          {isSignUp ? "Already have an account? Sign In" : "New here? Create an Account"}
        </button>
      </div>
    </div>
  );
}