import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { ChevronLeft, LogOut, RefreshCw, Database } from "lucide-react";
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/Auth');
  };

  const seedDatabase = async () => {
    toast.loading("Fetching 300+ movements from Base 44...");
    try {
      await localDB.syncExercises();
      toast.success("Library Synced Successfully!");
    } catch (err) {
      toast.error("Cloud sync failed. Check connection.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <header className="flex items-center gap-4 mb-12 pt-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ChevronLeft /></Button>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Settings</h1>
      </header>

      <div className="space-y-4">
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem]">
          <h2 className="text-xs font-black uppercase text-zinc-500 mb-4 tracking-widest">Database Tools</h2>
          <Button 
            onClick={seedDatabase}
            className="w-full bg-zinc-800 text-white rounded-xl h-14 font-bold uppercase italic"
          >
            <RefreshCw className="mr-2" size={18} /> Sync Movement List
          </Button>
        </div>

        <Button 
          onClick={handleLogout}
          variant="destructive" 
          className="w-full h-14 rounded-xl font-black uppercase italic"
        >
          <LogOut className="mr-2" size={18} /> Sign Out
        </Button>
      </div>
    </div>
  );
}