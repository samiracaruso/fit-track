import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { localDB, db } from '@/api/localDB'; // Added db import
import { Button } from "@/components/ui/button";
import { History, Plus, LayoutGrid, ChevronRight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check local plans
        const localPlans = await db.plans.toArray();
        
        // Use localDB object to get history
        const history = await localDB.getHistory();

        if (localPlans.length === 0 && navigator.onLine) {
          const { data: cloudPlans } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('user_id', user.id);
          
          if (cloudPlans?.length > 0) {
            await db.plans.bulkPut(cloudPlans);
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
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">
          Fit <span className="text-cyan-500">Track</span>
        </h1>
      </header>

      <div className="px-6 grid grid-cols-2 gap-3 mt-4">
        <Button onClick={() => navigate('/ActiveSession')} className="h-32 bg-cyan-500 text-black rounded-[2rem] flex-col gap-2">
          <Plus size={24} strokeWidth={3} />
          <span className="font-black uppercase italic text-xs">Start Lift</span>
        </Button>
        <Button onClick={() => navigate('/WeeklyPlan')} variant="outline" className="h-32 border-zinc-800 bg-zinc-900/50 rounded-[2rem] flex-col gap-2 text-white">
          <LayoutGrid size={24} />
          <span className="font-black uppercase italic text-xs">Weekly Plan</span>
        </Button>
      </div>

      <section className="mt-10 px-6">
        <h2 className="text-sm font-black uppercase italic tracking-widest text-zinc-500 mb-4 px-2">Recent History</h2>
        <div className="space-y-3">
          {recentHistory.map((session) => (
            <div key={session.id} className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <History size={18} className="text-cyan-500" />
                <div>
                  <p className="font-black uppercase italic text-sm">{new Date(session.date).toLocaleDateString()}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-800" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}