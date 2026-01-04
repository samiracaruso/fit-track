import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Play, GripVertical, Loader2 } from 'lucide-react';
import ExerciseLibrary from '../components/ExerciseLibrary';
import ExerciseSetsEditor from '../components/ExerciseSetsEditor';
import { toast } from 'sonner';

export default function DayPlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const day = searchParams.get('day') || 'monday';
  
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    loadDayPlans();
  }, [day]);

  // HELPER: Keeps the local "cabinet" in sync for offline access
  const refreshLocalCache = (updatedPlans) => {
    const fullCache = JSON.parse(localStorage.getItem('weekly_workout_plans') || '[]');
    const otherDays = fullCache.filter(p => p.day_of_week !== day);
    const newCache = [...otherDays, ...updatedPlans];
    localStorage.setItem('weekly_workout_plans', JSON.stringify(newCache));
  };

  const loadDayPlans = async () => {
    try {
      // 1. Load from cache immediately
      const fullCache = JSON.parse(localStorage.getItem('weekly_workout_plans') || '[]');
      const localDayPlans = fullCache.filter(p => p.day_of_week === day)
                                     .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      if (localDayPlans.length > 0) {
        setWorkoutPlans(localDayPlans);
        setLoading(false);
      }

      // 2. Fetch fresh data
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('day_of_week', day)
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setWorkoutPlans(data || []);
      refreshLocalCache(data || []);
    } catch (error) {
      console.log('Running in offline mode');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExercise = async (exercises) => {
    const exerciseArray = Array.isArray(exercises) ? exercises : [exercises];
    const { data: { user } } = await supabase.auth.getUser();
    
    const maxOrder = workoutPlans.length > 0 
      ? Math.max(...workoutPlans.map(p => p.order_index || 0)) 
      : 0;

    const newPlans = exerciseArray.map((ex, i) => ({
      id: crypto.randomUUID(), // Temp ID for optimistic UI
      user_id: user.id,
      day_of_week: day,
      exercise_id: ex.id,
      exercise_name: ex.name,
      exercise_image_url: ex.image_url,
      order_index: maxOrder + i + 1,
      sets: [{ reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0 }]
    }));

    // Optimistic Update
    const updatedLocal = [...workoutPlans, ...newPlans];
    setWorkoutPlans(updatedLocal);
    refreshLocalCache(updatedLocal);
    setShowLibrary(false);

    // Cloud save
    const { error } = await supabase.from('workout_plans').insert(
      newPlans.map(({ id, ...rest }) => rest) // Remove temp ID for DB
    );

    if (error) {
      toast.error("Cloud sync failed, saved locally.");
    } else {
      loadDayPlans(); // Get real DB IDs
    }
  };

  const handleDeletePlan = async (planId) => {
    const updatedLocal = workoutPlans.filter(p => p.id !== planId);
    setWorkoutPlans(updatedLocal);
    refreshLocalCache(updatedLocal);

    const { error } = await supabase.from('workout_plans').delete().eq('id', planId);
    if (error) toast.error("Failed to delete from cloud.");
  };

  const handleUpdatePlan = async (planId, updatedData) => {
    const updatedLocal = workoutPlans.map(p => p.id === planId ? { ...p, ...updatedData } : p);
    setWorkoutPlans(updatedLocal);
    refreshLocalCache(updatedLocal);

    await supabase.from('workout_plans').update({
      sets: updatedData.sets,
      notes: updatedData.notes,
      order_index: updatedData.order_index
    }).eq('id', planId);
    
    setEditingPlan(null);
  };

  if (loading && workoutPlans.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      {/* Dynamic Header */}
      <div className="bg-zinc-900/80 backdrop-blur-xl px-6 pt-8 pb-6 sticky top-0 z-10 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-zinc-500">
          <ArrowLeft size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">{day}</h1>
            <p className="text-cyan-500 text-xs font-bold uppercase tracking-widest">
              {workoutPlans.length} Exercises Planned
            </p>
          </div>
          {workoutPlans.length > 0 && (
            <button 
              onClick={() => navigate(`/StartWorkout?day=${day}`)}
              className="w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 active:scale-90 transition-transform"
            >
              <Play className="w-6 h-6 text-black fill-current ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 mt-6 space-y-3">
        {workoutPlans.map((plan, index) => (
          <div key={plan.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex items-center gap-4 group">
            <div className="text-zinc-700 group-active:text-cyan-500 transition-colors">
              <GripVertical size={20} />
            </div>

            <div className="w-14 h-14 rounded-2xl bg-black border border-zinc-800 overflow-hidden flex-shrink-0">
              {plan.exercise_image_url ? (
                <img src={plan.exercise_image_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-black text-zinc-800">{index + 1}</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{plan.exercise_name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {plan.sets?.length || 0} Sets Configured
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setEditingPlan(plan)}
                className="p-3 bg-zinc-800 rounded-2xl text-cyan-500 active:bg-cyan-500 active:text-black transition-all"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDeletePlan(plan.id)}
                className="p-3 bg-zinc-800 rounded-2xl text-zinc-600 active:bg-red-500 active:text-white transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => setShowLibrary(true)}
          className="w-full border-2 border-dashed border-zinc-800 rounded-3xl p-8 text-zinc-600 flex flex-col items-center gap-2 active:bg-zinc-900 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <Plus size={24} />
          </div>
          <span className="font-black text-[10px] uppercase tracking-[0.2em]">Add Exercise</span>
        </button>
      </div>

      {showLibrary && (
        <ExerciseLibrary 
          onSelect={handleSelectExercise} 
          onClose={() => setShowLibrary(false)} 
        />
      )}
      
      {editingPlan && (
        <ExerciseSetsEditor 
          plan={editingPlan} 
          onSave={(data) => handleUpdatePlan(editingPlan.id, data)} 
          onClose={() => setEditingPlan(null)} 
        />
      )}
    </div>
  );
}