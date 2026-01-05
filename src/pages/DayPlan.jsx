// [DEXIE-INTEGRATED] - Complete DayPlan.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { 
  ChevronLeft, 
  GripVertical, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Dumbbell
} from 'lucide-react';

export default function DayPlan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const day = searchParams.get('day') || 'monday';
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [day]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Instant Load: Get from local Dexie DB
      const cachedPlans = await localDB.getPlanByDay(day);
      if (cachedPlans && cachedPlans.length > 0) {
        setExercises(cachedPlans);
      }

      // 2. Background Sync: Fetch from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: remotePlans } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('day_of_week', day)
          .order('order', { ascending: true }); // Matches SQL schema

        if (remotePlans) {
          setExercises(remotePlans);
          // 3. Update Dexie cache
          await localDB.savePlan(day, remotePlans);
        }
      }
    } catch (error) {
      console.error("Offline mode: Using local cache.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Prepare data for Supabase & Dexie
      const updatedExercises = exercises.map((ex, index) => ({
        ...ex,
        user_id: user.id,
        day_of_week: day,
        order: index, // Matches SQL 'order' column
        // Ensure sets is saved as a JSON array for our JSONB column
        sets: Array.isArray(ex.sets) ? ex.sets : (typeof ex.sets === 'string' ? JSON.parse(ex.sets) : [])
      }));

      // 1. Save to Supabase (Cloud)
      const { error } = await supabase
        .from('workout_plans')
        .upsert(updatedExercises, { onConflict: 'id' });

      if (error) throw error;

      // 2. Save to Dexie (Local)
      await localDB.savePlan(day, updatedExercises);
      alert("Plan synced successfully!");
    } catch (error) {
      console.error("Save error:", error);
      // Fallback: Save locally even if cloud fails
      await localDB.savePlan(day, exercises);
      alert("Saved locally (Offline). Changes will sync next time you're online.");
    } finally {
      setSaving(false);
    }
  };

  const removeExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  if (loading && exercises.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 rounded-xl">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tighter italic">
            {day} <span className="text-cyan-500">Plan</span>
          </h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Exercise List */}
      <div className="px-6 space-y-3">
        {exercises.length === 0 ? (
          <div className="py-20 text-center">
            <Dumbbell size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">No exercises planned</p>
          </div>
        ) : (
          exercises.map((exercise, index) => (
            <div 
              key={exercise.id || index}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="text-zinc-600">
                  <GripVertical size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase italic text-sm">{exercise.exercise_name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">
                    {Array.isArray(exercise.sets) ? exercise.sets.length : 0} Sets Configured
                  </p>
                </div>
              </div>
              <button 
                onClick={() => removeExercise(exercise.id)}
                className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6">
        <button 
          onClick={() => navigate(`/ExerciseLibrary?day=${day}`)}
          className="w-full bg-zinc-900 border border-zinc-700 py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest active:scale-95 transition-transform"
        >
          <Plus size={18} /> Add Exercise
        </button>
      </div>
    </div>
  );
}