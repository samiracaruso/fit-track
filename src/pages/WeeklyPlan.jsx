import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Dumbbell, ArrowLeft } from 'lucide-react';

export default function WeeklyPlan() {
  const navigate = useNavigate();
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      
      // 1. Try to load from Local Storage first for instant offline access
      const localCache = localStorage.getItem('weekly_workout_plans');
      if (localCache) {
        setWorkoutPlans(JSON.parse(localCache));
      }

      // 2. Fetch from Supabase to get the latest
      const { data: { user } } = await supabase.auth.getUser();
      const { data: plans, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id);

      if (plans && !error) {
        setWorkoutPlans(plans);
        // Update the local cache with the fresh data
        localStorage.setItem('weekly_workout_plans', JSON.stringify(plans));
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayPlans = (day) => {
    return workoutPlans.filter(p => p.day_of_week === day);
  };

  if (loading && workoutPlans.length === 0) {
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
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-[#a0a0a0]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Weekly Plan</h1>
        <p className="text-[#a0a0a0]">Plan your workout routine for the week</p>
      </div>

      {/* Days List */}
      <div className="px-6 mt-6 space-y-4">
        {daysOfWeek.map((day) => {
          const plans = getDayPlans(day);
          const exerciseCount = plans.length;
          
          return (
            <button
              key={day}
              // This goes to the specific day to add/remove exercises
              onClick={() => navigate(`/DayPlan?day=${day}`)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 active:scale-95 transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    exerciseCount > 0 ? 'bg-[#00d4ff]/10' : 'bg-[#2a2a2a]'
                  }`}>
                    <Dumbbell className={`w-7 h-7 ${exerciseCount > 0 ? 'text-[#00d4ff]' : 'text-[#a0a0a0]'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-bold text-lg capitalize">{day}</h3>
                    <p className="text-[#a0a0a0] text-sm">
                      {exerciseCount === 0 ? 'Rest day' : `${exerciseCount} exercises`}
                    </p>
                  </div>
                </div>
                
                <ChevronRight className="w-6 h-6 text-[#a0a0a0]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}