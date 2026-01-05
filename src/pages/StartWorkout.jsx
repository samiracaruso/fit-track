import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Dumbbell, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function StartWorkout() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const dayName = urlParams.get('day') || format(new Date(), 'EEEE').toLowerCase();
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutData();
  }, [dayName]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      
      // 1. Load from Dexie first (Immediate/Offline)
      const cachedPlan = await localDB.getPlanByDay(dayName);
      if (cachedPlan && cachedPlan.length > 0) {
        setExercises(cachedPlan.map(ex => ({ ...ex, completed: false })));
      }

      // 2. Refresh from Supabase to keep Dexie up to date
      const { data: { user } } = await supabase.auth.getUser();
      const { data: plans, error } = await supabase
        .from('workout_plans')
        .select(`*, exercises ( name, image_url )`)
        .eq('user_id', user.id)
        .eq('day_of_week', dayName);

      if (plans && !error) {
        const formatted = plans.map(p => ({
          exercise_id: p.exercise_id,
          name: p.exercises?.name,
          image: p.exercises?.image_url,
          sets: p.sets || 3,
          reps: p.reps || 10,
          completed: false
        }));
        
        setExercises(formatted);
        // Sync these to Dexie for next time
        await localDB.savePlan(dayName, formatted);
      }
    } catch (err) {
      console.log("Running in offline mode.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (index) => {
    const newExercises = [...exercises];
    newExercises[index].completed = !newExercises[index].completed;
    setExercises(newExercises);
    
    // Optional: Keep active session state in Dexie if user accidentally refreshes
    // localDB.sessions.put({ id: 'active', exercises: newExercises });
  };

  const completeWorkout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const sessionData = {
      user_id: user?.id,
      date: new Date().toISOString(),
      day_of_week: dayName,
      exercises: exercises,
      status: 'completed'
    };

    try {
      // 1. Save to Dexie immediately (History table)
      await localDB.saveSession(sessionData);

      // 2. Background Sync to Supabase
      const { error } = await supabase
        .from('workout_sessions')
        .insert([sessionData]);

      if (error) {
        toast.info("Saved locally. Will sync when online.");
      } else {
        toast.success("Workout saved and synced!");
      }

      navigate('/');
    } catch (err) {
      toast.error("Failed to save workout");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl px-6 pt-8 pb-6 border-b border-zinc-800">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-zinc-500">
          <ArrowLeft size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
          {dayName} <span className="text-cyan-500">Session</span>
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {exercises.length > 0 ? (
          exercises.map((ex, i) => (
            <div 
              key={i}
              onClick={() => toggleExercise(i)}
              className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                ex.completed 
                ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`transition-colors ${ex.completed ? 'text-cyan-500' : 'text-zinc-700'}`}>
                    {ex.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                  </div>
                  <div>
                    <p className={`font-black uppercase italic tracking-tight ${ex.completed ? 'text-white' : 'text-zinc-400'}`}>
                      {ex.name}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {ex.sets} sets • {ex.reps} reps
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-800">
            <Dumbbell className="mx-auto mb-4 text-zinc-700" size={48} />
            <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">No routine found</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {exercises.length > 0 && (
        <div className="fixed bottom-8 left-6 right-6">
          <button 
            onClick={completeWorkout}
            className="w-full bg-cyan-500 text-black h-16 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/20 active:scale-95 transition-transform"
          >
            <Save size={20} /> Finish Workout
          </button>
        </div>
      )}
    </div>
  );
}