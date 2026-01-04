import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Dumbbell, Activity, TrendingUp, Calendar as CalendarIcon, Play, Settings, Flame, Loader2 } from 'lucide-react';
import { format, startOfWeek, addDays, endOfWeek, isSameDay } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Instant Cache Load
      const cachedPlans = localStorage.getItem('weekly_workout_plans');
      const cachedSessions = localStorage.getItem('workout_history');
      if (cachedPlans) setWorkoutPlans(JSON.parse(cachedPlans));
      if (cachedSessions) setRecentSessions(JSON.parse(cachedSessions));

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      // 2. Background Sync
      const [plansRes, sessionsRes] = await Promise.all([
        supabase.from('workout_plans').select('*').eq('user_id', currentUser.id),
        supabase.from('workout_sessions')
          .select('*')
          .eq('user_id', currentUser.id)
          .gte('date', format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
          .order('date', { ascending: false })
      ]);

      if (plansRes.data) {
        setWorkoutPlans(plansRes.data);
        localStorage.setItem('weekly_workout_plans', JSON.stringify(plansRes.data));
      }
      if (sessionsRes.data) {
        setRecentSessions(sessionsRes.data);
        localStorage.setItem('workout_history', JSON.stringify(sessionsRes.data));
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
      dayShort: format(date, 'EEE')[0], // Just 'M', 'T', 'W'...
      isToday: isSameDay(date, new Date()),
      hasSession: recentSessions.some(s => s.date === dateStr && s.status === 'completed')
    };
  });

  const stats = {
    workouts: recentSessions.filter(s => s.status === 'completed').length,
    calories: Math.round(recentSessions.reduce((sum, s) => sum + (s.total_calories_burned || 0), 0)),
    streak: 0 // Logic for streak can be added here
  };

  const todayName = format(new Date(), 'EEEE').toLowerCase();
  const todayExercises = workoutPlans.filter(p => p.day_of_week === todayName).length;

  if (loading && workoutPlans.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      {/* App Bar */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black italic border border-white/20">
            {user?.email?.[0].toUpperCase() || 'A'}
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Welcome Back</h1>
            <p className="text-sm font-bold">Athlete Session</p>
          </div>
        </div>
        <button onClick={() => navigate('/Settings')} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-400">
          <Settings size={20} />
        </button>
      </div>

      {/* Hero Stats */}
      <div className="px-6 mb-8">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity size={120} className="text-cyan-500" />
          </div>
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

      {/* Weekly Tracker */}
      <div className="px-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Weekly Progress</h2>
          <button onClick={() => navigate('/Calendar')} className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">History</button>
        </div>
        <div className="flex justify-between">
          {weekDays.map((day) => (
            <div key={day.dateStr} className="flex flex-col items-center gap-2">
              <span className={`text-[10px] font-black ${day.isToday ? 'text-cyan-500' : 'text-zinc-700'}`}>{day.dayShort}</span>
              <div 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  day.hasSession ? 'bg-emerald-500 text-black' : 
                  day.isToday ? 'bg-zinc-800 border-2 border-cyan-500 text-cyan-500' : 
                  'bg-zinc-900 border border-zinc-800 text-zinc-600'
                }`}
              >
                <span className="text-xs font-black">{day.date.getDate()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Cards */}
      <div className="px-6 space-y-4">
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
              <p className="text-[10px] font-bold text-black/60 uppercase">{todayExercises} Exercises Ready</p>
            </div>
          </div>
          <ChevronRight className="text-black/40 group-hover:text-black" />
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/WeeklyPlan')}
            className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 text-left active:scale-95 transition-all"
          >
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 mb-4">
              <CalendarIcon size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-1">Schedule</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Edit Routine</p>
          </button>

          <button
            onClick={() => navigate('/WorkoutHistory')}
            className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 text-left active:scale-95 transition-all"
          >
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 mb-4">
              <TrendingUp size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-1">Analysis</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">View Trends</p>
          </button>
        </div>
      </div>

      {/* Quick Add Button */}
      <button 
        onClick={() => navigate('/AdminExercises')}
        className="fixed bottom-8 right-6 w-16 h-16 bg-white text-black rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-20"
      >
        <Plus size={32} />
      </button>
    </div>
  );
}