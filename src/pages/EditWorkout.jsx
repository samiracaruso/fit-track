import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2, Circle, Edit3, Plus, X, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ExerciseLibrary from '../components/ExerciseLibrary';
import { toast } from 'sonner';

export default function EditWorkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    if (sessionId) loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (data) {
        setSession(data);
        setExercises(data.exercises || []);
      }
    } catch (error) {
      toast.error("Couldn't load session data");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const updateExercise = (index, updates) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], ...updates };
    setExercises(updated);
  };

  const handleAddExercise = (selected) => {
    const selectedArray = Array.isArray(selected) ? selected : [selected];
    const newItems = selectedArray.map(ex => ({
      exercise_id: ex.id,
      exercise_name: ex.name,
      completed: false,
      skipped: false,
      sets: [{ reps: 0, weight_kg: 0, completed: false }],
      notes: ''
    }));
    setExercises([...exercises, ...newItems]);
    setShowLibrary(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simple calorie estimation logic
      const totalCalories = exercises.reduce((acc, ex) => {
        if (!ex.completed) return acc;
        const setWeight = ex.sets?.length * 15 || 0; // Placeholder logic: 15 cals per exercise
        return acc + setWeight;
      }, 0);

      const { error } = await supabase
        .from('workout_sessions')
        .update({ 
          exercises,
          total_calories_burned: totalCalories 
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success("Workout updated successfully");
      navigate('/WorkoutHistory');
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-cyan-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl px-6 pt-8 pb-6 sticky top-0 z-10 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-zinc-500">
          <ArrowLeft size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Cancel</span>
        </button>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Edit Session</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
          {session && format(new Date(session.date), 'EEEE, MMM do')}
        </p>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {exercises.map((ex, idx) => (
          <div key={idx} className={`bg-zinc-900 border rounded-3xl p-5 transition-all ${ex.completed ? 'border-emerald-500/50' : 'border-zinc-800'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => updateExercise(idx, { completed: !ex.completed, skipped: false })}>
                  {ex.completed ? <CheckCircle2 className="text-emerald-500" /> : <Circle className="text-zinc-700" />}
                </button>
                <h3 className="font-bold text-lg">{ex.exercise_name}</h3>
              </div>
              <button onClick={() => setExercises(exercises.filter((_, i) => i !== idx))} className="text-zinc-700 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>

            {/* Set Summary View */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ex.sets?.map((set, sIdx) => (
                <div key={sIdx} className="bg-black px-3 py-1 rounded-lg border border-zinc-800 text-[10px] font-bold">
                  {set.weight_kg}kg x {set.reps}
                </div>
              ))}
            </div>

            <button 
              onClick={() => setEditingExercise({ index: idx, data: ex })}
              className="w-full bg-zinc-800 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-500"
            >
              <Edit3 size={14} /> Adjust Sets
            </button>
          </div>
        ))}

        <button 
          onClick={() => setShowLibrary(true)}
          className="w-full border-2 border-dashed border-zinc-800 rounded-3xl py-8 text-zinc-600 font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-2"
        >
          <Plus size={24} /> Add Exercise
        </button>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-cyan-500 text-black h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {saving ? 'Syncing...' : 'Save Changes'}
        </button>
      </div>

      {showLibrary && <ExerciseLibrary onSelect={handleAddExercise} onClose={() => setShowLibrary(false)} />}
      
      {editingExercise && (
        <ExerciseEditModal 
          exercise={editingExercise.data} 
          onSave={(data) => {
            updateExercise(editingExercise.index, data);
            setEditingExercise(null);
          }} 
          onClose={() => setEditingExercise(null)} 
        />
      )}
    </div>
  );
}

// Internal Modal for modifying specific sets
function ExerciseEditModal({ exercise, onSave, onClose }) {
  const [sets, setSets] = useState(exercise.sets || [{ reps: 0, weight_kg: 0, completed: true }]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-lg rounded-[2rem] border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50">
          <h2 className="font-black uppercase tracking-tighter italic">{exercise.exercise_name}</h2>
          <button onClick={onClose} className="p-2 bg-black rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {sets.map((set, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 items-center bg-black p-4 rounded-2xl border border-zinc-800">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-600 block mb-1">KG</label>
                <input 
                  type="number" 
                  value={set.weight_kg} 
                  onChange={(e) => {
                    const newSets = [...sets];
                    newSets[i].weight_kg = e.target.value;
                    setSets(newSets);
                  }}
                  className="bg-zinc-900 w-full text-center py-2 rounded-xl font-bold border border-zinc-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-600 block mb-1">Reps</label>
                <input 
                  type="number" 
                  value={set.reps} 
                  onChange={(e) => {
                    const newSets = [...sets];
                    newSets[i].reps = e.target.value;
                    setSets(newSets);
                  }}
                  className="bg-zinc-900 w-full text-center py-2 rounded-xl font-bold border border-zinc-800"
                />
              </div>
              <button onClick={() => setSets(sets.filter((_, idx) => idx !== i))} className="mt-4 text-red-500">
                <Trash2 size={16} className="mx-auto" />
              </button>
            </div>
          ))}
          <button 
            onClick={() => setSets([...sets, { reps: 0, weight_kg: 0, completed: true }])}
            className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs font-black uppercase"
          >
            + Add Set
          </button>
        </div>

        <div className="p-6 bg-black border-t border-zinc-800">
          <button 
            onClick={() => onSave({ ...exercise, sets })}
            className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest"
          >
            Update Exercise
          </button>
        </div>
      </div>
    </div>
  );
}