import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Timer, Plus, Check } from "lucide-react";
import MuscleHighlight from "./MuscleHighlight";

const typeIcons = {
  cardio: Timer,
  weights: Dumbbell,
  machine: Dumbbell,
  bodyweight: Dumbbell
};

const typeColors = {
  cardio: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  weights: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  machine: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bodyweight: "bg-amber-500/20 text-amber-400 border-amber-500/30"
};

export default function ExerciseCard({ exercise, onSelect, selected = false, showAddButton = true }) {
  const Icon = typeIcons[exercise.type] || Dumbbell;

  return (
    <Card 
      className={`bg-zinc-900/80 border-zinc-800 p-4 transition-all duration-200 ${
        selected ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : 'hover:bg-zinc-800/80'
      }`}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <MuscleHighlight muscles={exercise.muscle_groups || []} size="sm" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white truncate">{exercise.name}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{exercise.equipment || 'No equipment'}</p>
            </div>
            {showAddButton && (
              <Button
                size="sm"
                variant={selected ? "default" : "outline"}
                className={selected 
                  ? "bg-emerald-600 hover:bg-emerald-700 h-8 w-8 p-0" 
                  : "border-zinc-700 h-8 w-8 p-0"
                }
                onClick={() => onSelect?.(exercise)}
              >
                {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className={`text-xs ${typeColors[exercise.type]}`}>
              <Icon className="h-3 w-3 mr-1" />
              {exercise.type}
            </Badge>
            {exercise.muscle_groups?.slice(0, 2).map(muscle => (
              <Badge key={muscle} variant="outline" className="text-xs bg-zinc-800/50 text-zinc-300 border-zinc-700">
                {muscle.replace('_', ' ')}
              </Badge>
            ))}
            {exercise.muscle_groups?.length > 2 && (
              <Badge variant="outline" className="text-xs bg-zinc-800/50 text-zinc-400 border-zinc-700">
                +{exercise.muscle_groups.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}