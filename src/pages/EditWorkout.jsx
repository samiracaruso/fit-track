import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function EditWorkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionId) loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const history = await localDB.getHistory();
      const match = history.find(s => s.id === sessionId || s.id === Number(sessionId));
      
      if (match) {
        setSession(match);
      } else {
        toast.error("Session not found");
        navigate('/Profile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    const updated = { ...session };
    updated.exercises[exIdx].sets[setIdx][field] = value;
    setSession(updated);
  };

  const addSet = (exIdx) => {
    const updated = { ...session };
    const lastSet = updated.exercises[exIdx].sets[updated.exercises[exIdx].sets.length - 1];
    updated.exercises[exIdx].sets.push({ 
      weight: lastSet?.weight || 0, 
      reps: lastSet?.reps || 0, 
      completed: true 
    });
    setSession(updated);
  };

  const removeSet = (exIdx, setIdx) => {
    const updated = { ...session };
    updated.exercises[exIdx].sets.splice(setIdx, 1);
    setSession(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await localDB.saveHistory(session);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('workout_sessions').upsert(session);
      }
      
      toast.success("Workout updated");
      navigate('/Profile');
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="p-6 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <button onClick={() => navigate(-1)} className="text-zinc-500"><ArrowLeft /></button>
        <h1 className="text-sm font-black uppercase italic tracking-widest">Edit Session</h1>
        <button onClick={handleSave} className="text-cyan-500">
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
        </button>
      </div>

      <div className="p-6 space-y-8">
        {session.exercises.map((ex, exIdx) => (
          <div key={ex.id} className="bg-zinc-900/50 rounded-[2rem] border border-zinc-800 p-6">
            <h3 className="text-lg font-black uppercase italic mb-4 text-cyan-500">{ex.exercise_name}</h3>
            
            <div className="space-y-3">
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className="grid grid-cols-[1fr_1fr_40px] gap-3 items-center">
                  <div className="bg-black/40 rounded-xl p-2 border border-zinc-800">
                    <label className="text-[8px] font-black uppercase text-zinc-600 ml-1">Weight</label>
                    <input 
                      type="number" 
                      value={set.weight} 
                      onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                      className="bg-transparent w-full text-center font-bold text-white outline-none"
                    />
                  </div>
                  <div className="bg-black/40 rounded-xl p-2 border border-zinc-800">
                    <label className="text-[8px] font-black uppercase text-zinc-600 ml-1">Reps</label>
                    <input 
                      type="number" 
                      value={set.reps} 
                      onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                      className="bg-transparent w-full text-center font-bold text-white outline-none"
                    />
                  </div>
                  <button onClick={() => removeSet(exIdx, setIdx)} className="text-zinc-700 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => addSet(exIdx)}
                className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-zinc-600 text-[10px] font-black uppercase"
              >
                + Add Set
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}