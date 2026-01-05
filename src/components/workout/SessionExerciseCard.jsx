// [DEXIE-INTEGRATED] - Full Workout Tracker
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Plus, Trash2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SessionExerciseCard({ exerciseData, onUpdate }) {
  const updateSet = (index, field, value) => {
    const newSets = [...(exerciseData.sets || [])];
    newSets[index] = { ...newSets[index], [field]: value };
    
    onUpdate({ 
      ...exerciseData, 
      sets: newSets,
      // Exercise is complete if all sets are marked done
      completed: newSets.every(s => s.completed) 
    });
  };

  const toggleSetComplete = (index) => {
    const newSets = [...(exerciseData.sets || [])];
    newSets[index].completed = !newSets[index].completed;
    onUpdate({ 
      ...exerciseData, 
      sets: newSets,
      completed: newSets.every(s => s.completed)
    });
  };

  const addSet = () => {
    const lastSet = exerciseData.sets[exerciseData.sets.length - 1];
    const newSet = { 
      reps: lastSet?.reps || 0, 
      weight: lastSet?.weight || 0, 
      completed: false 
    };
    onUpdate({ ...exerciseData, sets: [...exerciseData.sets, newSet] });
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-black rounded-lg text-cyan-500">
          <Dumbbell size={18} />
        </div>
        <h3 className="font-black uppercase italic text-white">{exerciseData.exercise_name}</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 px-2 text-[10px] font-black uppercase text-zinc-600">
          <span>#</span>
          <span>Weight</span>
          <span>Reps</span>
          <span className="text-right">Done</span>
        </div>

        {exerciseData.sets?.map((set, idx) => (
          <div key={idx} className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 items-center">
            <span className="text-xs font-black text-zinc-700">{idx + 1}</span>
            
            <Input
              type="number"
              value={set.weight}
              onChange={(e) => updateSet(idx, 'weight', e.target.value)}
              className="h-10 bg-zinc-800/50 border-zinc-700/50 text-center font-bold text-cyan-500"
              placeholder="0"
            />
            
            <Input
              type="number"
              value={set.reps}
              onChange={(e) => updateSet(idx, 'reps', e.target.value)}
              className="h-10 bg-zinc-800/50 border-zinc-700/50 text-center font-bold text-white"
              placeholder="0"
            />

            <button
              onClick={() => toggleSetComplete(idx)}
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                set.completed ? "bg-cyan-500 text-black" : "bg-zinc-800 text-zinc-700"
              )}
            >
              <Check size={18} className={set.completed ? "opacity-100" : "opacity-20"} />
            </button>
          </div>
        ))}

        <button 
          onClick={addSet}
          className="w-full py-2 border border-dashed border-zinc-800 rounded-xl text-zinc-600 text-[10px] font-black uppercase mt-2"
        >
          + Add Set
        </button>
      </div>
    </Card>
  );
}