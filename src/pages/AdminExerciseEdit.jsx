import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter, Edit2, Trash2, Dumbbell, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminExercises() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      
      // 1. Load from Dexie first (Instant UI)
      const cached = await localDB.getAllExercises();
      if (cached.length > 0) {
        setExercises(cached);
        setLoading(false); // Stop showing spinner if we have data
      }

      // 2. Fetch fresh from Supabase
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data) {
        setExercises(data);
        // 3. Sync to Dexie for next time
        await localDB.syncExercises(data);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast.error('Could not refresh exercises from cloud');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will remove the exercise globally.')) return;

    try {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;

      // Update Local State & Dexie
      setExercises(prev => prev.filter(ex => ex.id !== id));
      await localDB.db.exercises.delete(id);
      
      toast.success('Exercise deleted');
    } catch (error) {
      toast.error('Failed to delete exercise');
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || ex.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-md sticky top-0 z-10 px-6 pt-8 pb-4 border-b border-zinc-900">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/Admin')} className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
            <ArrowLeft size={16} /> Admin
          </button>
          <button 
            onClick={() => navigate('/AdminExerciseEdit')}
            className="bg-cyan-500 text-black px-4 py-2 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
          >
            <Plus size={14} /> New Exercise
          </button>
        </div>
        
        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Library</h1>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <Input 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['all', 'weights', 'machine', 'bodyweight', 'cardio'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${
                  filterType === type ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-6 py-4 space-y-3">
        {loading && exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-cyan-500" size={32} />
            <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-[0.2em]">Syncing Library...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl">
            <p className="text-zinc-600 font-bold uppercase text-xs">No exercises found</p>
          </div>
        ) : (
          filteredExercises.map(ex => (
            <div key={ex.id} className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                  {ex.image_url ? (
                    <img src={ex.image_url} className="w-full h-full object-cover rounded-xl" alt={ex.name} />
                  ) : (
                    <Dumbbell className="text-zinc-600" size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">{ex.name}</h3>
                  <p className="text-[10px] font-black uppercase text-zinc-600 tracking-tighter">{ex.type} • {ex.muscle_groups?.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => navigate(`/AdminExerciseEdit?id=${ex.id}`)}
                  className="p-2 text-zinc-400 hover:text-cyan-500 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(ex.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}