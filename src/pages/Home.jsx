import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, History, Plus, LayoutGrid, ChevronRight, RefreshCcw, Trophy 
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

        // Use the updated function names from localDB.js
        const localPlans = await localDB.db.plans.toArray();
        const history = await localDB.getHistory();

        // If local is empty and online, pull from Base 44
        if (localPlans.length === 0 && navigator.onLine) {
          console.log("Fit-Track: New device detected. Pulling cloud data...");
          const { data: cloudPlans } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('user_id', user.id);
          
          if (cloudPlans?.length > 0) {
            await localDB.db.plans.bulkPut(cloudPlans);
          }
        }

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
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
          Fit <span className="text-cyan-500">Track</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
          Base 44 Signal: <span className="text-green-500">Connected</span>
        </p>
      </header>

      <div className="px-6 grid grid-cols-2 gap-3 mt-4">
        <Button 
          onClick={() => navigate('/ActiveSession')}
          className="h-32 bg-cyan-500 hover:bg-white text-black rounded-[2rem] flex-col gap-2 transition-all active:scale-95"
        >
          <Plus size={24} strokeWidth={3} />
          <span className="font-black uppercase italic text-xs">Start Lift</span>
        </Button>
        <Button 
          onClick={() => navigate('/WeeklyPlan')}
          variant="outline"
          className="h-32 border-zinc-800 bg-zinc-900/50 rounded-[2rem] flex-col gap-2 text-white hover:bg-zinc-800"
        >
          <LayoutGrid size={24} />
          <span className="font-black uppercase italic text-xs tracking-tight">Weekly Plan</span>
        </Button>
      </div>

      <section className="mt-10 px-6">
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-sm font-black uppercase italic tracking-widest text-zinc-500">Recent History</h2>
          <Button variant="link" onClick={() => navigate('/WorkoutHistory')} className="text-cyan-500 text-[10px] uppercase font-black p-0 h-auto">View All</Button>
        </div>

        <div className="space-y-3">
          {recentHistory.length > 0 ? (
            recentHistory.map((session) => (
              <div key={session.id} className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5">
                    <History size={18} className="text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-sm">{new Date(session.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase">{session.day_of_week} Session</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-800" />
              </div>
            ))
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
              <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">No Recent Moves</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}