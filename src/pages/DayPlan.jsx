import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { ChevronLeft, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';

export default function DayPlan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const day = searchParams.get('day') || 'monday';
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [day]);

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Load from Dexie
      const cached = await localDB.getPlanByDay(day);
      setExercises(cached || []);
      
      // 2. Refresh from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: remote } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('day_of_week', day);
        
        if (remote) {
          await localDB.savePlan(day, remote);
          setExercises(remote);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeExercise = async (id) => {
    // Pessimistic UI for safety, but updating LocalDB first
    try {
      const original = [...exercises];
      setExercises(exercises.filter(ex => ex.id !== id));
      
      await localDB.deletePlanExercise(id);
      
      const { error } = await supabase.from('workout_plans').delete().eq('id', id);
      if (error) {
        setExercises(original);
        alert("Could not sync deletion with cloud.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-zinc-900 to-black">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4">
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">{day}</h1>
        <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">{exercises.length} Exercises Scheduled</p>
      </div>

      <div className="px-6 space-y-3 mt-4">
        {loading && exercises.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-800" /></div>
        ) : (
          exercises.map((ex) => (
            <div key={ex.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GripVertical size={20} className="text-zinc-700" />
                <div>
                  <h3 className="font-black uppercase italic text-sm">{ex.exercise_name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{ex.target_sets} Sets Configured</p>
                </div>
              </div>
              <button onClick={() => removeExercise(ex.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

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