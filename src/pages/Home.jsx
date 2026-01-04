import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronRight, Plus, Dumbbell, Activity, TrendingUp, Calendar as CalendarIcon, Play, Settings } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

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
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const plans = await base44.entities.WorkoutPlan.filter({ created_by: currentUser.email });
      setWorkoutPlans(plans);
      
      const sessions = await base44.entities.WorkoutSession.filter({ created_by: currentUser.email }, '-created_date', 5);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error loading data:', error);
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
    const thisWeekSessions = recentSessions.filter(s => {
      const sessionDate = new Date(s.date);
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      return sessionDate >= weekStart;
    });
    
    const completed = thisWeekSessions.filter(s => s.status === 'completed').length;
    const totalCalories = thisWeekSessions.reduce((sum, s) => sum + (s.total_calories_burned || 0), 0);
    
    return { workouts: completed, calories: Math.round(totalCalories) };
  };

  const stats = getWeekStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
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
                  <p className="text-[#a0a0a0]">Welcome back, {user?.full_name?.split(' ')[0] || 'Athlete'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => navigate(createPageUrl('Admin'))}
                      className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#a0a0a0] active:scale-95 transition-transform"
                    >
                      <Settings className="w-6 h-6" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(createPageUrl('Profile'))}
                    className="active:scale-95 transition-transform"
                  >
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#00d4ff]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-white font-bold text-lg">
                        {user?.full_name?.[0] || 'U'}
                      </div>
                    )}
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
            <p className="text-xs text-[#a0a0a0] mt-1">Workouts</p>
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
          <h2 className="text-xl font-bold text-white">This Week</h2>
          <button
            onClick={() => navigate(createPageUrl('Calendar'))}
            className="text-[#00d4ff] text-sm font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            return (
              <button
                key={day.dateStr}
                onClick={() => navigate(createPageUrl(`StartWorkout?date=${day.dateStr}`))}
                className={`aspect-square rounded-2xl border ${
                  day.isToday
                    ? 'border-[#00d4ff] bg-[#00d4ff]/10 glow'
                    : day.hasSession
                    ? 'border-[#10b981] bg-[#10b981]/10'
                    : 'border-[#2a2a2a] bg-transparent'
                } flex flex-col items-center justify-center transition-all active:scale-95`}
              >
                <span className={`text-xs mb-1 ${day.isToday ? 'text-[#00d4ff]' : 'text-[#a0a0a0]'}`}>
                  {day.dayShort}
                </span>
                <span className={`text-lg font-bold ${day.isToday ? 'text-[#00d4ff]' : 'text-white'}`}>
                  {day.dayNum}
                </span>
                {day.hasSession && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              const today = format(new Date(), 'EEEE').toLowerCase();
              navigate(createPageUrl(`StartWorkout?day=${today}`));
            }}
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] rounded-2xl p-4 flex items-center justify-between glow-strong active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white text-lg">Start Today's Workout</p>
                <p className="text-white/70 text-sm">
                  {workoutPlans.filter(p => p.day_of_week === format(new Date(), 'EEEE').toLowerCase()).length} exercises planned
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => navigate(createPageUrl('WeeklyPlan'))}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#7c3aed]/10 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-[#7c3aed]" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Edit Weekly Plan</p>
                <p className="text-[#a0a0a0] text-sm">Customize your routine</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#a0a0a0]" />
          </button>

          <button
            onClick={() => navigate(createPageUrl('WorkoutHistory'))}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#10b981]" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Workout History</p>
                <p className="text-[#a0a0a0] text-sm">View past workouts</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#a0a0a0]" />
          </button>
          </div>
          </div>

      </div>
      );
      }