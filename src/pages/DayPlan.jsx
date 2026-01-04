import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Play } from 'lucide-react';
import ExerciseLibrary from '../components/ExerciseLibrary';
import ExerciseSetsEditor from '../components/ExerciseSetsEditor';

export default function DayPlan() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const day = urlParams.get('day') || 'monday';
  
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    loadDayPlans();
  }, [day]);

  // HELPER: Update the local "cabinet" so other pages see changes offline
  const refreshLocalCache = async (updatedPlans) => {
    // 1. Get existing full weekly cache
    const fullCache = JSON.parse(localStorage.getItem('weekly_workout_plans') || '[]');
    
    // 2. Remove all plans for THIS day and replace them with the new ones
    const filteredCache = fullCache.filter(p => p.day_of_week !== day);
    const newCache = [...filteredCache, ...updatedPlans];
    
    // 3. Save back to localStorage
    localStorage.setItem('weekly_workout_plans', JSON.stringify(newCache));
  };

  const loadDayPlans = async () => {
    try {
      setLoading(true);
      
      // Try local first
      const fullCache = JSON.parse(localStorage.getItem('weekly_workout_plans') || '[]');
      const localDayPlans = fullCache.filter(p => p.day_of_week === day);
      if (localDayPlans.length > 0) setWorkoutPlans(localDayPlans);

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('day_of_week', day)
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setWorkoutPlans(data || []);
      refreshLocalCache(data || []); // Sync local with cloud
    } catch (error) {
      console.error('Offline or Error:', error);
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
      user_id: user.id,
      day_of_week: day,
      exercise_id: ex.id,
      exercise_name: ex.name,
      exercise_image_url: ex.image_url,
      order_index: maxOrder + i + 1,
      sets: [{ reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0 }]
    }));

    // Optimistic Update: Update UI and Local Cache immediately
    const updatedLocal = [...workoutPlans, ...newPlans];
    setWorkoutPlans(updatedLocal);
    refreshLocalCache(updatedLocal);

    // Then save to Supabase in background
    const { error } = await supabase.from('workout_plans').insert(newPlans);
    if (error) console.error('Cloud save failed, but kept locally');

    setShowLibrary(false);
    loadDayPlans(); // Final sync
  };

  const handleDeletePlan = async (planId) => {
    if (confirm('Remove this exercise?')) {
      // Optimistic delete
      const updatedLocal = workoutPlans.filter(p => p.id !== planId);
      setWorkoutPlans(updatedLocal);
      refreshLocalCache(updatedLocal);

      await supabase.from('workout_plans').delete().eq('id', planId);
    }
  };

  const handleUpdatePlan = async (planId, updatedData) => {
    const payload = {
      sets: updatedData.sets,
      notes: updatedData.notes,
      order_index: updatedData.order_index || updatedData.order
    };

    // Optimistic update
    const updatedLocal = workoutPlans.map(p => p.id === planId ? { ...p, ...payload } : p);
    setWorkoutPlans(updatedLocal);
    refreshLocalCache(updatedLocal);

    await supabase.from('workout_plans').update(payload).eq('id', planId);
    setEditingPlan(null);
    loadDayPlans();
  };

  // ... (renderSetSummary and startWorkout remain the same)
  const renderSetSummary = (sets) => {
    if (!sets || sets.length === 0) return <span className="text-[#a0a0a0]">No sets configured</span>;
    return sets.map((set, idx) => (
      <div key={idx} className="text-[#a0a0a0] text-sm">
        Set {idx + 1}: {set.reps > 0 && `${set.reps} reps`}
        {set.weight_kg > 0 && ` × ${set.weight_kg}kg`}
      </div>
    ));
  };

  const startWorkout = () => navigate(`/StartWorkout?day=${day}`);

  if (loading && workoutPlans.length === 0) {
    return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-t-2 border-cyan-500 rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6 sticky top-0 z-10 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-[#a0a0a0]">
          <ArrowLeft className="w-5 h-5" /> <span>Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white capitalize mb-1">{day}</h1>
            <p className="text-[#a0a0a0] text-sm">{workoutPlans.length} exercises</p>
          </div>
          {workoutPlans.length > 0 && (
            <button onClick={startWorkout} className="w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20 active:scale-90 transition-transform">
              <Play className="w-7 h-7 text-black fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-6 mt-6 space-y-3">
        {workoutPlans.map((plan, index) => (
          <div key={plan.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="flex gap-4">
              {plan.exercise_image_url ? (
                <img src={plan.exercise_image_url} className="w-16 h-16 rounded-xl object-cover" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 font-bold">{index + 1}</div>
              )}
              <div className="flex-1">
                <h3 className="text-white font-bold mb-1">{plan.exercise_name}</h3>
                {renderSetSummary(plan.sets)}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setEditingPlan(plan)} className="px-3 py-1.5 bg-[#242424] rounded-lg text-cyan-500 text-xs font-bold flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                  <button onClick={() => handleDeletePlan(plan.id)} className="px-3 py-1.5 bg-[#242424] rounded-lg text-red-400 text-xs font-bold flex items-center gap-1"><Trash2 size={12}/> Remove</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => setShowLibrary(true)}
          className="w-full border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 text-gray-500 flex flex-col items-center gap-2 active:bg-white/5"
        >
          <Plus />
          <span className="font-bold text-sm">Add Exercise</span>
        </button>
      </div>

      {showLibrary && <ExerciseLibrary onSelect={handleSelectExercise} onClose={() => setShowLibrary(false)} />}
      {editingPlan && <ExerciseSetsEditor plan={editingPlan} onSave={(data) => handleUpdatePlan(editingPlan.id, data)} onClose={() => setEditingPlan(null)} />}
    </div>
  );
}