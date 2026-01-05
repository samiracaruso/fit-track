import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { localDB, db } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, History, Plus, LayoutGrid, ChevronRight, 
  Settings, User, Calendar as CalendarIcon 
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const history = await localDB.getHistory();
        setRecentHistory(history.slice(0, 3));
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* RESTORED TOP BAR */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            Fit <span className="text-cyan-500">Track</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Base 44 <span className="text-green-500 ml-1">● Online</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/Profile')} className="bg-zinc-900 rounded-full w-10 h-10 border border-white/5">
            <Settings size={18} className="text-zinc-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/Profile')} className="bg-zinc-900 rounded-full w-10 h-10 border border-white/5">
            <User size={18} className="text-zinc-400" />
          </Button>
        </div>
      </header>

      {/* MAIN ACTIONS */}
      <div className="px-6 grid grid-cols-2 gap-3 mt-4">
        <Button 
          onClick={() => navigate('/ActiveSession')}
          className="h-32 bg-cyan-500 hover:bg-cyan-400 text-black rounded-[2rem] flex-col gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        >
          <Plus size={24} strokeWidth={3} />
          <span className="font-black uppercase italic text-xs">Start Lift</span>
        </Button>
        <Button 
          onClick={() => navigate('/WeeklyPlan')}
          className="h-32 bg-zinc-900 border border-white/5 rounded-[2rem] flex-col gap-2 text-white hover:bg-zinc-800"
        >
          <CalendarIcon size={24} className="text-cyan-500" />
          <span className="font-black uppercase italic text-xs">Weekly Plan</span>
        </Button>
      </div>

      {/* HISTORY SECTION */}
      <section className="mt-10 px-6">
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-sm font-black uppercase italic tracking-widest text-zinc-500">Recent History</h2>
          <Button variant="link" onClick={() => navigate('/WorkoutHistory')} className="text-cyan-500 text-[10px] uppercase font-black p-0 h-auto">View All</Button>
        </div>

        <div className="space-y-3">
          {recentHistory.length > 0 ? (
            recentHistory.map((session) => (
              <div key={session.id} className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/10">
                    <History size={18} className="text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-sm">{new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{session.day_of_week}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-800" />
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
              <Dumbbell size={32} className="mx-auto text-zinc-800 mb-2 opacity-20" />
              <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">No moves recorded yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}