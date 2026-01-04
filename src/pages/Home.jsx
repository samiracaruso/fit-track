import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Dumbbell, Activity, TrendingUp, Calendar as CalendarIcon, Play, Settings } from 'lucide-react';
import { format, startOfWeek, addDays, isWithinInterval, endOfWeek } from 'date-fns';

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
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      // Fetch all plans for this user to count exercises for today
      const { data: plans } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', currentUser.id);
      setWorkoutPlans(plans || []);
      
      // Fetch sessions for the current week to show stats and calendar dots
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      setRecentSessions(sessions || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      // A day is "completed" if there is a session with status completed on that date
      const hasSession = recentSessions.some(s => s.date === dateStr && s.status === 'completed');
      return {
        date,
        dateStr,
        dayName: format(date, 'EEEE').toLowerCase(),
        dayShort: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        isToday: dateStr === format(today, 'yyyy-MM-dd'),
        hasSession
      };
    });
  };

  const weekDays = getWeekDays();

  const getWeekStats = () => {
    const completed = recentSessions.filter(s => s.status === 'completed').length;
    const totalCalories = recentSessions.reduce((sum, s) => sum + (s.total_calories_burned || 0), 0);
    
    return { 
      workouts: completed, 
      calories: Math.round(totalCalories) 
    };
  };

  const stats = getWeekStats();
  const todayName = format(new Date(), 'EEEE').toLowerCase();
  const todayExercises = workoutPlans.filter(p => p.day_of_week === todayName).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00d4ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Workout Planner</h1>
            <p className="text-[#a0a0a0]">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Athlete'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/Settings')}
              className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#a0a0a0] active:scale-95 transition-transform"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigate('/Profile')}
              className="active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-white font-bold text-lg border-2 border-[#00d4ff]/20">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0].toUpperCase() || 'U'}
              </div>
            </button>
          </div>
        </div>

        {/* Week Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-[#00d4ff]" />
              <span className="text-[#a0a0a0] text-sm">This Week</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.workouts}</p>
            <p className="text-xs text-[#a0a0a0] mt-1">Workouts Completed</p>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-[#7c3aed]" />
              <span className="text-[#a0a0a0] text-sm">Calories</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.calories}</p>
            <p className="text-xs text-[#a0a0a0] mt-1">kcal burned</p>
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Weekly Progress</h2>
          <button
            onClick={() => navigate('/Calendar')}
            className="text-[#00d4ff] text-sm font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <button
              key={day.dateStr}
              onClick={() => navigate(`/DayPlan?day=${day.dayName}`)}
              className={`aspect-square rounded-2xl border ${
                day.isToday
                  ? 'border-[#00d4ff] bg-[#00d4ff]/10 shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                  : day.hasSession
                  ? 'border-[#10b981] bg-[#10b981]/10'
                  : 'border-[#2a2a2a] bg-transparent'
              } flex flex-col items-center justify-center transition-all active:scale-95`}
            >
              <span className={`text-[10px] uppercase font-bold mb-1 ${day.isToday ? 'text-[#00d4ff]' : 'text-[#a0a0a0]'}`}>
                {day.dayShort}
              </span>
              <span className={`text-lg font-bold ${day.isToday ? 'text-[#00d4ff]' : 'text-white'}`}>
                {day.dayNum}
              </span>
              {day.hasSession && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/StartWorkout?day=${todayName}`)}
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-[#00d4ff]/20 active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white text-lg">Start Today's Workout</p>
                <p className="text-white/70 text-sm">
                  {todayExercises} exercise{todayExercises !== 1 ? 's' : ''} planned for today
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => navigate('/WeeklyPlan')}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#7c3aed]/10 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-[#7c3aed]" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Edit Weekly Plan</p>
                <p className="text-[#a0a0a0] text-sm">Adjust your routine</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#a0a0a0]" />
          </button>

          <button
            onClick={() => navigate('/WorkoutHistory')}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#10b981]" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Workout History</p>
                <p className="text-[#a0a0a0] text-sm">Review your progress</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#a0a0a0]" />
          </button>
        </div>
      </div>
    </div>
  );
}