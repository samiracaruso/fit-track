import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Dumbbell, ArrowLeft, Loader2 } from 'lucide-react';

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
      
      // 1. Try to load from Dexie for instant access
      const cachedPlans = await localDB.plans.toArray();
      if (cachedPlans.length > 0) {
        // Flatten the Dexie structure (which stores by day) back into a flat list for getDayPlans
        const flattened = cachedPlans.flatMap(dayEntry => 
          dayEntry.exercises.map(ex => ({ ...ex, day_of_week: dayEntry.day }))
        );
        setWorkoutPlans(flattened);
      }

      // 2. Fetch from Supabase to refresh
      const { data: { user } } = await supabase.auth.getUser();
      const { data: plans, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id);

      if (plans && !error) {
        setWorkoutPlans(plans);
        
        // 3. Update Dexie cache by grouping exercises by day
        for (const day of daysOfWeek) {
          const dayExercises = plans.filter(p => p.day_of_week === day);
          await localDB.savePlan(day, dayExercises);
        }
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
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-8 text-white">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl px-6 pt-8 pb-6 border-b border-zinc-800">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-zinc-500"
        >
          <ArrowLeft size={20} /> 
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Weekly <span className="text-cyan-500">Plan</span></h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Organize your training split</p>
      </div>

      {/* Days List */}
      <div className="px-6 mt-6 space-y-3">
        {daysOfWeek.map((day) => {
          const plans = getDayPlans(day);
          const exerciseCount = plans.length;
          const isRestDay = exerciseCount === 0;
          
          return (
            <button
              key={day}
              onClick={() => navigate(`/DayPlan?day=${day}`)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${
                    !isRestDay 
                      ? 'bg-cyan-500/10 border-cyan-500/20' 
                      : 'bg-black border-zinc-800'
                  }`}>
                    <Dumbbell className={`w-6 h-6 ${!isRestDay ? 'text-cyan-500' : 'text-zinc-700'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter group-active:text-cyan-500 transition-colors">
                      {day}
                    </h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      isRestDay ? 'text-zinc-600' : 'text-cyan-500/60'
                    }`}>
                      {isRestDay ? 'Rest Day' : `${exerciseCount} exercises scheduled`}
                    </p>
                  </div>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:border-zinc-600 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}