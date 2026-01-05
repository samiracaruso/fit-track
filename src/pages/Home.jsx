import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Plus, 
  Dumbbell, 
  Activity, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Play, 
  Settings, 
  Flame, 
  Loader2,
  Clock
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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

      // 1. INSTANT LOAD: Get from Dexie
      const [cachedPlans, cachedHistory, cachedActive] = await Promise.all([
        localDB.getPlansByDay(todayName),
        localDB.getHistory(),
        localDB.getActiveSession()
      ]);

      if (cachedPlans.length) setWorkoutPlans(cachedPlans);
      if (cachedHistory.length) setRecentSessions(cachedHistory);
      if (cachedActive) setActiveSession(cachedActive);

      // 2. BACKGROUND SYNC: Fetch from Supabase
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        const [plansRes, sessionsRes] = await Promise.all([
          supabase.from('workout_plans').select('*').eq('user_id', currentUser.id),
          supabase.from('workout_sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('date', format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
            .order('date', { ascending: false })
        ]);

        if (plansRes.data) {
          const todaysPlans = plansRes.data.filter(p => p.day_of_week === todayName);
          setWorkoutPlans(todaysPlans);
          // Sync today's specific plans to Dexie
          await localDB.syncPlans(todayName, todaysPlans);
        }
        
        if (sessionsRes.data) {
          setRecentSessions(sessionsRes.data);
          // 3. Update History in Dexie
          for (const session of sessionsRes.data) {
            await localDB.saveSession(session);
          }
        }
      }
    } catch (error) {
      console.log('Using offline data for dashboard');
    } finally {
      setLoading(false);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      date,
      dateStr,
      dayName: format(date, 'EEEE').toLowerCase(),
      dayShort: format(date, 'EEE')[0],
      isToday: isSameDay(date, new Date()),
      hasSession: recentSessions.some(s => s.date === dateStr && s.status === 'completed')
    };
  });

  const stats = {
    workouts: recentSessions.filter(s => s.status === 'completed').length,
    calories: Math.round(recentSessions.reduce((sum, s) => sum + (s.total_calories_burned || 0), 0))
  };

  const todayName = format(new Date(), 'EEEE').toLowerCase();
  const todayExercisesCount = workoutPlans.length;

  if (loading && workoutPlans.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black italic border border-white/20">
            {user?.email?.[0].toUpperCase() || 'A'}
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Welcome Back</h1>
            <p className="text-sm font-bold">{user?.user_metadata?.full_name || 'Athlete'}</p>
          </div>
        </div>
        <button onClick={() => navigate('/Settings')} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-400">
          <Settings size={20} />
        </button>
      </div>

      {/* Weekly Stats Card */}
      <div className="px-6 mb-8">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Flame size={16} className="text-orange-500 fill-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Weekly Performance</span>
            </div>
            <div className="flex gap-10">
              <div>
                <p className="text-4xl font-black italic tracking-tighter mb-1">{stats.workouts}</p>
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Workouts</p>
              </div>
              <div className="w-px h-12 bg-zinc-800" />
              <div>
                <p className="text-4xl font-black italic tracking-tighter mb-1">{stats.calories}</p>
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Calories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="px-6 space-y-4">
        {/* Resume Active Session (Priority) */}
        {activeSession && (
          <button
            onClick={() => navigate('/ActiveWorkout')}
            className="w-full bg-orange-500 rounded-[2rem] p-6 flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-orange-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-orange-500">
                <Clock size={24} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-black/60 tracking-widest">In Progress</p>
                <h3 className="text-xl font-black text-black uppercase italic tracking-tighter">Resume Workout</h3>
                <p className="text-[10px] font-bold text-black/60 uppercase">Don't lose your gains!</p>
              </div>
            </div>
            <ChevronRight className="text-black/40 group-hover:text-black" />
          </button>
        )}

        {/* Start New Workout */}
        <button
          onClick={() => navigate(`/StartWorkout?day=${todayName}`)}
          className="w-full bg-cyan-500 rounded-[2rem] p-6 flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-cyan-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-cyan-500">
              <Play size={24} fill="currentColor" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-black/60 tracking-widest">Next Session</p>
              <h3 className="text-xl font-black text-black uppercase italic tracking-tighter">Start Training</h3>
              <p className="text-[10px] font-bold text-black/60 uppercase">{todayExercisesCount} Exercises Ready</p>
            </div>
          </div>
          <ChevronRight className="text-black/40 group-hover:text-black" />
        </button>

        {/* Calendar Strip */}
        <div className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Activity Calendar</h3>
            <button onClick={() => navigate('/Calendar')} className="text-[10px] font-black uppercase text-cyan-500">Full History</button>
          </div>
          <div className="flex justify-between items-center bg-zinc-900/40 p-4 rounded-3xl border border-zinc-800/50">
            {weekDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className={`text-[10px] font-black ${day.isToday ? 'text-cyan-500' : 'text-zinc-600'}`}>{day.dayShort}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  day.hasSession ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 
                  day.isToday ? 'border border-cyan-500 text-cyan-500' : 'text-zinc-500'
                }`}>
                  {format(day.date, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}