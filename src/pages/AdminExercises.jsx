import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; // Use Dexie service
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Loader2, Dumbbell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminExercises() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      
      // 1. Try to load from Dexie first for instant UI
      const cached = await localDB.getAllExercises();
      if (cached && cached.length > 0) {
        setExercises(cached);
        // We set loading to false here because we have data to show
        setLoading(false);
      }

      // 2. Fetch fresh data from Supabase to sync
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setExercises(data);
        // 3. Sync the fresh data to Dexie
        await localDB.syncExercises(data);
      }
    } catch (error) {
      console.error('Offline or Error:', error);
      // Even if cloud fails, the cached Dexie data remains on screen
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm('Delete this exercise? This will affect all workout plans using it.');
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Exercise deleted from cloud');
      
      // 4. Update Dexie and Local State immediately
      await localDB.db.exercises.delete(id);
      const updatedList = exercises.filter(ex => ex.id !== id);
      setExercises(updatedList);
      
    } catch (error) {
      toast.error('Failed to delete. Check your connection.');
    }
  };

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.muscle_groups?.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-md px-6 pt-8 pb-6 sticky top-0 z-10 border-b border-zinc-900">
        <button
          onClick={() => navigate('/Admin')}
          className="mb-4 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Admin Hub</span>
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Library</h1>
            <p className="text-cyan-500 text-xs font-bold uppercase tracking-widest">
              {loading ? 'Syncing...' : `${exercises.length} Exercises Total`}
            </p>
          </div>
          
          <button
            onClick={() => navigate('/AdminExerciseEdit')}
            className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20 active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search name or muscle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border-zinc-800 rounded-2xl pl-11 h-12 text-white focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-6 mt-6 space-y-3">
        {loading && exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
            <Loader2 className="animate-spin mb-2" />
            <p className="text-xs font-bold uppercase">Loading Library...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-900 rounded-3xl">
            <p className="text-xs font-bold uppercase tracking-widest">No exercises found</p>
          </div>
        ) : (
          filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-4 group"
            >
              {/* Image Preview */}
              <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
                {exercise.image_url ? (
                  <img 
                    src={exercise.image_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold truncate">{exercise.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {exercise.muscle_groups?.slice(0, 2).map((muscle) => (
                    <span key={muscle} className="text-[10px] font-black uppercase tracking-tighter text-cyan-500">
                      {muscle.replace('_', ' ')}
                    </span>
                  ))}
                  {exercise.muscle_groups?.length > 2 && (
                    <span className="text-[10px] text-zinc-600">+{exercise.muscle_groups.length - 2}</span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/AdminExerciseEdit?id=${exercise.id}`)}
                  className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-cyan-500 active:text-black transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(exercise.id)}
                  className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-500 active:bg-red-500 active:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}