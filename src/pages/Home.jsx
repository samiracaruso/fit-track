// [DEXIE-INTEGRATED] - Complete Home.jsx with Auto-Migration
import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { migrateUserData } from '@/api/integrations';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Settings, 
  Play, 
  Clock, 
  Zap,
  Loader2,
  Calendar as CalendarIcon,
  RefreshCw,
  Dumbbell
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const todayName = format(new Date(), 'EEEE').toLowerCase();

      // 1. INSTANT LOAD: Get from Dexie (Offline-First)
      const [cachedPlans, cachedHistory, cachedActive] = await Promise.all([
        localDB.getPlanByDay(todayName),
        localDB.getHistory(),
        localDB.getActiveSession()
      ]);

      if (cachedPlans?.length) setWorkoutPlans(cachedPlans);
      if (cachedHistory) setRecentSessions(cachedHistory);
      if (cachedActive) setActiveSession(cachedActive);

      // 2. AUTH & BACKGROUND SYNC
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user has any plans in Supabase
        const { data: existingPlans } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('user_id', currentUser.id)
          .limit(1);

        // TRIGGER MIGRATION: If Supabase is empty, pull from Base44
        if (!existingPlans || existingPlans.length === 0) {
          await handleMigration(currentUser);
        } else {
          await syncFromSupabase(currentUser, todayName);
        }
      }
    } catch (error) {
      console.error('Offline mode or Sync Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async (currentUser) => {
    setIsMigrating(true);
    try {
      const legacyData = await migrateUserData();
      if (!legacyData) return;

      const { oldPlans, oldFavorites, oldHistory } = legacyData;

      // Filter data by the current user's email to ensure privacy
      const myOldPlans = oldPlans.filter(p => p.created_by === currentUser.email);
      const myOldFavs = oldFavorites.filter(f => f.created_by === currentUser.email);
      const myOldHistory = oldHistory.filter(h => h.created_by === currentUser.email);

      // 1. Migrate Plans
      if (myOldPlans.length > 0) {
        const plansToInsert = myOldPlans.map(plan => ({
          user_id: currentUser.id,
          day_of_week: plan.day_of_week,
          exercise_id: plan.exercise_id,
          exercise_name: plan.exercise_name,
          sets: plan.sets || [],
          notes: plan.notes,
          order: plan.order || 0
        }));
        await supabase.from('workout_plans').insert(plansToInsert);
      }

      // 2. Migrate Favorites
      if (myOldFavs.length > 0) {
        const favsToInsert = myOldFavs.map(fav => ({
          user_id: currentUser.id,
          exercise_id: fav.exercise_id
        }));
        await supabase.from('user_favorites').insert(favsToInsert);
      }

      // 3. Migrate History
      if (myOldHistory.length > 0) {
        const historyToInsert = myOldHistory.map(session => ({
          user_id: currentUser.id,
          date: session.date,
          status: session.status,
          start_time: session.start_time,
          end_time: session.end_time,
          exercises: session.exercises || [],
          total_duration_seconds: session.total_duration_seconds || 0,
          notes: session.notes
        }));
        await supabase.from('workout_sessions').insert(historyToInsert);
      }

      const todayName = format(new Date(), 'EEEE').toLowerCase();
      await syncFromSupabase(currentUser, todayName);

    } catch (e) {
      console.error("Auto-migration failed:", e);
    } finally {
      setIsMigrating(false);
    }
  };

  const syncFromSupabase = async (currentUser, todayName) => {
    const [plansRes, sessionsRes] = await Promise.all([
      supabase.from('workout_plans').select('*').eq('user_id', currentUser.id),
      supabase.from('workout_sessions')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('date', format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
        .order('date', { ascending: false })
    ]);

    if (plansRes.data) {
      for (const day of daysOfWeek) {
        const dayExercises = plansRes.data.filter(p => p.day_of_week === day);
        await localDB.savePlan(day, dayExercises);
      }
      setWorkoutPlans(plansRes.data.filter(p => p.day_of_week === todayName));
    }
    
    if (sessionsRes.data) {
      setRecentSessions(sessionsRes.data);
      await localDB.history.clear();
      await localDB.history.bulkAdd(sessionsRes.data);
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
      hasSession: recentSessions.some(s => s.date?.split('T')[0] === dateStr && s.status === 'completed')
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
      <div className="flex items-center justify-center h-screen bg-black text-cyan-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      {/* Migration Alert */}
      {isMigrating && (
        <div className="bg-cyan-600 text-white py-2 px-6 flex items-center justify-center gap-2 animate-pulse font-black uppercase text-[10px] tracking-widest">
          <RefreshCw size={12} className="animate-spin" />
          Migrating your legacy data from Base44...
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black italic border border-white/20">
            {user?.email?.[0].toUpperCase() || 'A'}
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">System Active</h1>
            <p className="text-sm font-bold truncate max-w-[150px]">{user?.email || 'Elite Athlete'}</p>
          </div>
        </div>
        <button onClick={() => navigate('/Settings')} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-400">
          <Settings size={20} />
        </button>
      </div>

      {/* Stats Card */}
      <div className="px-6 mb-8">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Zap size={14} className="text-cyan-500 fill-cyan-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Weekly Performance</span>
            </div>
            <div className="flex gap-10">
              <div>
                <p className="text-4xl font-black italic tracking-tighter mb-1">{stats.workouts}</p>
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Sessions</p>
              </div>
              <div className="w-px h-12 bg-zinc-800" />
              <div>
                <p className="text-4xl font-black italic tracking-tighter mb-1">{stats.calories}</p>
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Kcal Burned</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 blur-[50px] rounded-full" />
        </div>
      </div>

      {/* Primary Actions */}
      <div className="px-6 space-y-4">
        {activeSession && (
          <button
            onClick={() => navigate('/ActiveWorkout')}
            className="w-full bg-orange-500 rounded-[2rem] p-6 flex items-center justify-between group shadow-xl shadow-orange-500/20"
          >
            <div className="flex items-center gap-4 text-black">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-orange-500">
                <Clock size={24} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-black/60">In Progress</p>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Resume Workout</h3>
              </div>
            </div>
            <ChevronRight className="text-black/40" />
          </button>
        )}

        <button
          onClick={() => navigate(`/StartWorkout?day=${todayName}`)}
          className="w-full bg-cyan-500 rounded-[2rem] p-6 flex items-center justify-between group shadow-xl shadow-cyan-500/20"
        >
          <div className="flex items-center gap-4 text-black">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-cyan-500">
              <Play size={24} fill="currentColor" className="ml-1" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-black/60">Today's Protocol</p>
              <h3 className="text-xl font-black uppercase italic tracking-tighter">{todayName} Session</h3>
              <p className="text-[10px] font-bold text-black/60 uppercase">{todayExercisesCount} Exercises</p>
            </div>
          </div>
          <ChevronRight className="text-black/40" />
        </button>

        {/* Calendar */}
        <div className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Activity Calendar</h3>
            <button onClick={() => navigate('/WorkoutHistory')} className="text-[10px] font-black uppercase text-cyan-500">Full History</button>
          </div>
          <div className="flex justify-between items-center bg-zinc-900/40 p-4 rounded-[2rem] border border-zinc-800/50">
            {weekDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className={`text-[10px] font-black ${day.isToday ? 'text-cyan-500' : 'text-zinc-600'}`}>{day.dayShort}</span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  day.hasSession ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 
                  day.isToday ? 'border-2 border-cyan-500 text-cyan-500' : 'text-zinc-500 border border-transparent'
                }`}>
                  {format(day.date, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => navigate('/WeeklyPlan')}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] p-5 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-cyan-500 transition-colors">
              <CalendarIcon size={18} />
            </div>
            <span className="font-black uppercase italic tracking-tighter text-sm">Edit Weekly Routine</span>
          </div>
          <ChevronRight size={18} className="text-zinc-700" />
        </button>
      </div>
    </div>
  );
}