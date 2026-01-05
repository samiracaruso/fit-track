import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  History, 
  Plus, 
  LayoutGrid, 
  ChevronRight, 
  RefreshCcw,
  Trophy
} from "lucide-react";
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ workoutsThisWeek: 0, lastSession: null });
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Get the current logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. CLOUD-TO-LOCAL SYNC (The "New Device" Logic)
        // Check if local plans are empty. If they are, pull from Supabase.
        const localPlans = await localDB.getPlanByDay('monday'); // Quick check
        if (localPlans.length === 0 && navigator.onLine) {
          console.log("Fit-Track: New device detected. Pulling cloud data...");
          
          const { data: cloudPlans } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('user_id', user.id);

          if (cloudPlans?.length > 0) {
            // Save cloud plans to local Dexie so they work offline
            await localDB.db.plans.bulkPut(cloudPlans);
            toast.success("Routine synced from cloud!");
          }
        }

        // 3. Load Stats & History from Local (Dexie)
        // We always read from local first for speed/offline support
        const history = await localDB.getHistory();
        setRecentHistory(history.slice(0, 3));
        
        // Calculate weekly stats
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyWorkouts = history.filter(s => new Date(s.date) > oneWeekAgo).length;

        setStats({
          workoutsThisWeek: weeklyWorkouts,
          lastSession: history[0] || null
        });

      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 text-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            FIT-<span className="text-cyan-500">TRACK</span>
          </h1>
          <Link to="/Profile" className="w-10 h-10 bg-zinc-900 rounded-full border border-white/10 flex items-center justify-center">
            <Trophy size={18} className="text-cyan-500" />
          </Link>
        </div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Dashboard</p>
      </header>

      {/* Stats Grid */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-[2rem]">
          <span className="text-[10px] font-black uppercase text-zinc-500 block mb-1">Weekly Volume</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black italic">{stats.workoutsThisWeek}</span>
            <span className="text-zinc-600 font-bold text-xs uppercase">Sessions</span>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-[2rem]">
          <span className="text-[10px] font-black uppercase text-zinc-500 block mb-1">Last Lift</span>
          <div className="flex items-baseline gap-1 text-cyan-500">
            <span className="font-black italic text-sm uppercase">
              {stats.lastSession ? stats.lastSession.day_of_week : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Sections */}
      <div className="px-6 space-y-4">
        <Button 
          onClick={() => navigate('/WeeklyPlan')}
          className="w-full h-24 bg-white text-black hover:bg-cyan-500 hover:text-white transition-all rounded-[2rem] flex items-center justify-between px-8 group"
        >
          <div className="text-left">
            <span className="block text-[10px] font-black uppercase tracking-widest opacity-50">Manage</span>
            <span className="text-xl font-black italic uppercase tracking-tight">Weekly Plan</span>
          </div>
          <LayoutGrid size={28} className="group-hover:scale-110 transition-transform" />
        </Button>

        <Button 
          onClick={() => {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const today = days[new Date().getDay()];
            navigate(`/ActiveSession?day=${today}`);
          }}
          className="w-full h-24 bg-cyan-500 text-black hover:bg-white transition-all rounded-[2rem] flex items-center justify-between px-8 group"
        >
          <div className="text-left">
            <span className="block text-[10px] font-black uppercase tracking-widest opacity-70">Execute</span>
            <span className="text-xl font-black italic uppercase tracking-tight">Start Workout</span>
          </div>
          <Dumbbell size={28} fill="currentColor" className="group-hover:rotate-45 transition-transform" />
        </Button>
      </div>

      {/* Recent History */}
      <div className="mt-12 px-6">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Recent History</h2>
          <Link to="/WorkoutHistory" className="text-[10px] font-black uppercase text-cyan-500 hover:underline">View All</Link>
        </div>

        <div className="space-y-3">
          {recentHistory.length > 0 ? (
            recentHistory.map((session) => (
              <div key={session.id} className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                    <History size={18} />
                  </div>
                  <div>
                    <h3 className="font-black italic uppercase text-sm leading-none">{session.day_of_week} Session</h3>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-800" />
              </div>
            ))
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-zinc-900 rounded-[2rem]">
              <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">No history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}