import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { X, Search, Filter, Info, Heart, Loader2, Dumbbell, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ExerciseDetailModal from './ExerciseDetailModal';

export default function ExerciseLibrary({ onSelect, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingExercise, setViewingExercise] = useState(null);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState(new Set());

  const exerciseTypes = ['cardio', 'weights', 'machine', 'bodyweight'];

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, selectedTypes, showFavoritesOnly, favoriteExerciseIds]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      
      // 1. Try to load from Dexie first (Instant UI)
      const cached = await localDB.exercises.toArray();
      if (cached.length > 0) setExercises(cached);

      const { data: { user } } = await supabase.auth.getUser();
      
      // 2. Fetch Fresh Exercises from Supabase
      const { data: exerciseData, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (!error && exerciseData) {
        setExercises(exerciseData);
        // Sync to Dexie for next offline use
        await localDB.exercises.bulkPut(exerciseData);
      }

      // 3. Fetch Favorites
      if (user) {
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('exercise_id')
          .eq('user_id', user.id);
        
        setFavoriteExerciseIds(new Set(favorites?.map(f => f.exercise_id) || []));
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = [...exercises];

    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(ex => favoriteExerciseIds.has(ex.id));
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(ex => selectedTypes.includes(ex.type));
    }

    setFilteredExercises(filtered);
  };

  const toggleFavorite = async (exerciseId, isCurrentlyFavorite) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isCurrentlyFavorite) {
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('exercise_id', exerciseId);
        setFavoriteExerciseIds(prev => {
          const next = new Set(prev);
          next.delete(exerciseId);
          return next;
        });
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, exercise_id: exerciseId });
        setFavoriteExerciseIds(prev => new Set([...prev, exerciseId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading && exercises.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-xl font-black italic uppercase">Exercise <span className="text-cyan-500">Library</span></h2>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-white"><X /></button>
      </div>

      {/* Search & Filters */}
      <div className="p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input 
            className="bg-zinc-900 border-zinc-800 pl-10 text-white" 
            placeholder="Search exercises..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Badge 
            variant={showFavoritesOnly ? "default" : "outline"}
            className={`cursor-pointer uppercase text-[10px] ${showFavoritesOnly ? 'bg-red-500' : 'border-zinc-700'}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            Favorites
          </Badge>
          {exerciseTypes.map(type => (
            <Badge 
              key={type}
              variant={selectedTypes.includes(type) ? "default" : "outline"}
              className={`cursor-pointer uppercase text-[10px] ${selectedTypes.includes(type) ? 'bg-cyan-500 text-black' : 'border-zinc-700 text-zinc-400'}`}
              onClick={() => {
                setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
              }}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">No exercises found</div>
        ) : (
          filteredExercises.map(ex => (
            <div 
              key={ex.id} 
              onClick={() => onSelect(ex)}
              className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl mb-3 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-cyan-500">
                  <Dumbbell size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase text-white">{ex.name}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase">{ex.type} • {ex.equipment || 'No Equipment'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setViewingExercise(ex); }} 
                  className="p-2 text-zinc-500 hover:text-white"
                >
                  <Info size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id, favoriteExerciseIds.has(ex.id)); }}
                  className={`p-2 ${favoriteExerciseIds.has(ex.id) ? 'text-red-500' : 'text-zinc-700'}`}
                >
                  <Heart size={18} fill={favoriteExerciseIds.has(ex.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {viewingExercise && (
        <ExerciseDetailModal 
          exercise={viewingExercise} 
          onClose={() => setViewingExercise(null)} 
        />
      )}
    </div>
  );
}