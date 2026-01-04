import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Dumbbell, Save } from 'lucide-react';
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
      
      // 1. TRY LOCAL STORAGE FIRST (Offline Goal)
      const cachedPlan = localStorage.getItem(`plan_${dayName}`);
      if (cachedPlan) {
        setExercises(JSON.parse(cachedPlan));
        setLoading(false);
        // We still fetch from Supabase in background to update the cache for next time
      }

      // 2. FETCH FROM SUPABASE (To refresh cache)
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
        // Update the offline cache
        localStorage.setItem(`plan_${dayName}`, JSON.stringify(formatted));
      }
    } catch (err) {
      console.log("Working offline using cached data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (index) => {
    const newExercises = [...exercises];
    newExercises[index].completed = !newExercises[index].completed;
    setExercises(newExercises);
    
    // Save current session state locally so you don't lose progress if the app closes
    localStorage.setItem(`active_session`, JSON.stringify(newExercises));
  };

  const completeWorkout = async () => {
    const sessionData = {
      date: format(new Date(), 'yyyy-MM-dd'),
      exercises: exercises,
      status: 'completed'
    };

    // 1. SAVE LOCALLY (Immediate)
    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    history.push(sessionData);
    localStorage.setItem('workout_history', JSON.stringify(history));

    // 2. ATTEMPT CLOUD SYNC (Background)
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('workout_sessions').insert([{
      user_id: user.id,
      date: sessionData.date,
      status: 'completed',
      exercises: sessionData.exercises
    }]);

    if (error) {
      toast.info("Saved locally. Will sync to cloud when online.");
    } else {
      toast.success("Workout synced to cloud!");
    }

    localStorage.removeItem('active_session');
    navigate('/');
  };

  if (loading) return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-t-2 border-cyan-500 rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')}><ArrowLeft /></button>
        <h1 className="text-2xl font-bold capitalize">{dayName} Routine</h1>
      </header>

      <div className="space-y-4 mb-24">
        {exercises.length > 0 ? exercises.map((ex, i) => (
          <div 
            key={i}
            onClick={() => toggleExercise(i)}
            className={`p-4 rounded-2xl border transition-all ${ex.completed ? 'bg-green-500/10 border-green-500' : 'bg-[#1a1a1a] border-[#2a2a2a]'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {ex.completed ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-gray-500" />}
                <div>
                  <p className="font-bold">{ex.name}</p>
                  <p className="text-sm text-gray-400">{ex.sets} sets × {ex.reps} reps</p>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 text-gray-500">
            <Dumbbell className="mx-auto mb-4 opacity-20" size={48} />
            <p>No exercises found for today.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-6 right-6">
        <button 
          onClick={completeWorkout}
          className="w-full bg-cyan-500 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={20} /> Finish & Save
        </button>
      </div>
    </div>
  );
}