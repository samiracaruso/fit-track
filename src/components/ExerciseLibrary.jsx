import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Search, Filter, ChevronDown, Info, Check, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ExerciseDetailModal from './ExerciseDetailModal';

export default function ExerciseLibrary({ onSelect, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [viewingExercise, setViewingExercise] = useState(null);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState(new Set());

  const exerciseTypes = ['cardio', 'weights', 'machine', 'bodyweight'];
  const muscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body'];

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, selectedTypes, selectedMuscles, showFavoritesOnly, favoriteExerciseIds]);

  const loadExercises = async () => {
    try {
      const currentUser = await base44.auth.me();
      const data = await base44.entities.Exercise.list();
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setExercises(sorted);
      setFilteredExercises(sorted);
      
      // Load user's favorites
      const favorites = await base44.entities.UserFavoriteExercise.filter({
        created_by: currentUser.email
      });
      const favoriteIds = new Set(favorites.map(f => f.exercise_id));
      setFavoriteExerciseIds(favoriteIds);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.equipment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(ex => favoriteExerciseIds.has(ex.id));
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(ex => selectedTypes.includes(ex.type));
    }

    if (selectedMuscles.length > 0) {
      filtered = filtered.filter(ex =>
        ex.muscle_groups?.some(mg => selectedMuscles.includes(mg))
      );
    }

    // Sort alphabetically by name
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredExercises(filtered);
  };

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleMuscle = (muscle) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedMuscles([]);
    setSearchTerm('');
    setShowFavoritesOnly(false);
  };

  const toggleFavorite = async (exerciseId, isFavorite) => {
    try {
      const currentUser = await base44.auth.me();
      
      if (isFavorite) {
        // Remove from favorites
        const favorites = await base44.entities.UserFavoriteExercise.filter({
          created_by: currentUser.email,
          exercise_id: exerciseId
        });
        if (favorites.length > 0) {
          await base44.entities.UserFavoriteExercise.delete(favorites[0].id);
        }
        setFavoriteExerciseIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(exerciseId);
          return newSet;
        });
      } else {
        // Add to favorites
        await base44.entities.UserFavoriteExercise.create({
          exercise_id: exerciseId
        });
        setFavoriteExerciseIds(prev => new Set([...prev, exerciseId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getMuscleColor = (muscle) => {
    const colors = {
      chest: 'bg-red-500/20 text-red-400 border-red-500/30',
      back: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      shoulders: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      biceps: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      triceps: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      core: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      quads: 'bg-green-500/20 text-green-400 border-green-500/30',
      hamstrings: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      glutes: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      calves: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return colors[muscle] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const toggleExerciseSelection = (exercise) => {
    setSelectedExercises(prev => {
      const isSelected = prev.find(e => e.id === exercise.id);
      if (isSelected) {
        return prev.filter(e => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleAddSelected = () => {
    onSelect(selectedExercises);
    setSelectedExercises([]);
  };

  const isExerciseSelected = (exerciseId) => {
    return selectedExercises.some(e => e.id === exerciseId);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00d4ff]"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Exercise Library</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0a0]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises..."
            className="pl-12 bg-[#242424] border-[#2a2a2a] text-white h-12 rounded-xl"
          />
        </div>

        {/* Filter Toggle */}
        {/* Favorites Toggle */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`w-full flex items-center justify-between border rounded-xl px-4 py-3 transition-all ${
            showFavoritesOnly 
              ? 'bg-[#ff006e]/10 border-[#ff006e]' 
              : 'bg-[#242424] border-[#2a2a2a]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${showFavoritesOnly ? 'fill-[#ff006e] text-[#ff006e]' : 'text-[#a0a0a0]'}`} />
            <span className="text-white font-medium">Favorites Only</span>
          </div>
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between bg-[#242424] border border-[#2a2a2a] rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#00d4ff]" />
            <span className="text-white font-medium">Filters</span>
            {(selectedTypes.length + selectedMuscles.length) > 0 && (
              <Badge className="bg-[#00d4ff] text-black">
                {selectedTypes.length + selectedMuscles.length}
              </Badge>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-[#a0a0a0] transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 space-y-4">
            <div>
              <label className="text-sm text-[#a0a0a0] mb-2 block">Exercise Type</label>
              <div className="flex flex-wrap gap-2">
                {exerciseTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedTypes.includes(type)
                        ? 'bg-[#00d4ff] text-black'
                        : 'bg-[#242424] text-[#a0a0a0] border border-[#2a2a2a]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-[#a0a0a0] mb-2 block">Muscle Groups</label>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map(muscle => (
                  <button
                    key={muscle}
                    onClick={() => toggleMuscle(muscle)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedMuscles.includes(muscle)
                        ? 'bg-[#00d4ff] text-black border-[#00d4ff]'
                        : `${getMuscleColor(muscle)}`
                    }`}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
            </div>

            {(selectedTypes.length + selectedMuscles.length + (showFavoritesOnly ? 1 : 0)) > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#00d4ff] font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
        <p className="text-[#a0a0a0] text-sm mb-4">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
        </p>
        
        <div className="space-y-3">
          {filteredExercises.map(exercise => {
            const isSelected = isExerciseSelected(exercise.id);
            return (
              <div
                key={exercise.id}
                className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden transition-all ${
                  isSelected ? 'border-[#00d4ff] bg-[#00d4ff]/5' : 'border-[#2a2a2a]'
                }`}
              >
                <div className="flex gap-4 p-4">
                  <button
                    onClick={() => toggleExerciseSelection(exercise)}
                    className="flex-shrink-0"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-[#00d4ff] border-[#00d4ff]' : 'border-[#a0a0a0]'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-black" />}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => toggleExerciseSelection(exercise)}
                    className="flex-1 flex gap-4 text-left"
                  >
                    <img
                      src={exercise.image_url || 'https://via.placeholder.com/80'}
                      alt={exercise.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">{exercise.name}</h3>
                      <p className="text-[#a0a0a0] text-sm mb-2">{exercise.equipment}</p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.muscle_groups?.slice(0, 3).map(mg => (
                          <span
                            key={mg}
                            className={`px-2 py-0.5 rounded-full text-xs border ${getMuscleColor(mg)}`}
                          >
                            {mg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingExercise(exercise);
                      }}
                      className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#242424] flex items-center justify-center text-[#00d4ff] active:scale-95 transition-transform"
                    >
                      <Info className="w-5 h-5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(exercise.id, favoriteExerciseIds.has(exercise.id));
                      }}
                      className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#242424] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Heart className={`w-5 h-5 ${favoriteExerciseIds.has(exercise.id) ? 'fill-[#ff006e] text-[#ff006e]' : 'text-[#a0a0a0]'}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Selected Button */}
      {selectedExercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] p-6 z-10">
          <button
            onClick={handleAddSelected}
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 glow active:scale-98 transition-transform"
          >
            Add {selectedExercises.length} Exercise{selectedExercises.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {viewingExercise && (
        <ExerciseDetailModal
          exercise={viewingExercise}
          onClose={() => setViewingExercise(null)}
        />
      )}
    </div>
  );
}