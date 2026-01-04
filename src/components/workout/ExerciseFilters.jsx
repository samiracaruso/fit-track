import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const exerciseTypes = [
  { value: 'cardio', label: 'Cardio', color: 'bg-emerald-500' },
  { value: 'weights', label: 'Weights', color: 'bg-violet-500' },
  { value: 'machine', label: 'Machine', color: 'bg-blue-500' },
  { value: 'bodyweight', label: 'Bodyweight', color: 'bg-amber-500' }
];

const muscleGroups = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'core', label: 'Core' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
  { value: 'full_body', label: 'Full Body' }
];

export default function ExerciseFilters({ 
  searchQuery, 
  setSearchQuery, 
  selectedTypes, 
  setSelectedTypes,
  selectedMuscles,
  setSelectedMuscles 
}) {
  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleMuscle = (muscle) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedMuscles([]);
  };

  const hasFilters = searchQuery || selectedTypes.length > 0 || selectedMuscles.length > 0;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Type filters */}
      <div>
        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Type</p>
        <div className="flex flex-wrap gap-2">
          {exerciseTypes.map(type => (
            <Button
              key={type.value}
              size="sm"
              variant="outline"
              onClick={() => toggleType(type.value)}
              className={cn(
                "h-8 text-xs transition-all",
                selectedTypes.includes(type.value)
                  ? `${type.color} text-white border-transparent`
                  : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Muscle filters */}
      <div>
        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Muscle Group</p>
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map(muscle => (
            <Button
              key={muscle.value}
              size="sm"
              variant="outline"
              onClick={() => toggleMuscle(muscle.value)}
              className={cn(
                "h-7 text-xs transition-all",
                selectedMuscles.includes(muscle.value)
                  ? "bg-red-500 text-white border-transparent"
                  : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {muscle.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-zinc-400 hover:text-white"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}