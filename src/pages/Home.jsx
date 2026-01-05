import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Settings, 
  Play, 
  Clock, 
  Zap,
  Loader2,
  Calendar as CalendarIcon,
  Dumbbell
} from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const todayName = format(new Date(), 'EEEE').toLowerCase();

      // 1. INSTANT LOAD: From Dexie
      const [cachedPlans, cachedHistory, cachedActive] = await Promise.all([
        localDB.getPlanByDay(todayName),
        localDB.getHistory(),
        localDB.getActiveSession()
      ]);

      setWorkoutPlans(cachedPlans || []);
      setRecentSessions(cachedHistory?.slice(0, 3) || []);
      setActiveSession(cachedActive || null);
      
      // Stop spinner if we have cached data to show
      if (cachedPlans.length > 0 || cachedHistory.length > 0) {
        setLoading(false);
      }

      // 2. BACKGROUND SYNC: From Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: remotePlans } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('day_of_week', todayName);
          
        if (remotePlans) {
          await localDB.savePlan(todayName, remotePlans);
          setWorkoutPlans(remotePlans);
        }
      }
    } catch (error) {
      console.error("Home load error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Dashboard</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{format(new Date(), 'EEEE, MMM do')}</p>
        </div>
        <button onClick={() => navigate('/Settings')} className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
          <Settings size={20} />
        </button>
      </div>

      {activeSession && (
        <div onClick={() => navigate('/ActiveSession')} className="mb-6 p-5 bg-cyan-500 rounded-[2rem] text-black flex items-center justify-between shadow-lg shadow-cyan-500/20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Workout in Progress</p>
            <h2 className="text-xl font-black italic uppercase">Resume Session</h2>
          </div>
          <Zap size={24} fill="currentColor" />
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">Today's Routine</h3>
        {loading && workoutPlans.length === 0 ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-zinc-700" /></div>
        ) : workoutPlans.length > 0 ? (
          workoutPlans.map((plan, i) => (
            <div key={plan.id || i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-cyan-500">
                  <Dumbbell size={18} />
                </div>
                <div>
                  <p className="font-black italic uppercase text-sm">{plan.exercise_name}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{plan.target_sets || 0} Sets • {plan.target_reps || 0} Reps</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 p-8 rounded-[2rem] text-center">
            <p className="text-zinc-600 font-bold text-xs uppercase tracking-widest">Rest Day</p>
          </div>
        )}

        <button 
          onClick={() => navigate(`/ActiveSession?day=${format(new Date(), 'EEEE').toLowerCase()}`)}
          disabled={workoutPlans.length === 0}
          className="w-full bg-white text-black h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Play size={18} fill="currentColor" /> Start Workout
        </button>
      </div>
    </div>
  );
}