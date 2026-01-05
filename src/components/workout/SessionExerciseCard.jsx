// [DEXIE-INTEGRATED]
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, ChevronUp, Plus, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SessionExerciseCard({ exerciseData, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const isCompleted = exerciseData.completed;

  // QUICK-TICK: Toggle entire exercise without filling inputs
  const handleMainToggle = () => {
    const newState = !isCompleted;
    const updatedSets = exerciseData.sets.map(s => ({
      ...s,
      completed: newState // Mark all sets done if exercise is checked
    }));

    onUpdate({
      ...exerciseData,
      sets: updatedSets,
      completed: newState
    });
  };

  const updateSet = (index, field, value) => {
    const newSets = [...exerciseData.sets];
    newSets[index] = { ...newSets[index], [field]: value };
    onUpdate({ ...exerciseData, sets: newSets });
  };

  const toggleSetComplete = (index) => {
    const newSets = [...exerciseData.sets];
    newSets[index].completed = !newSets[index].completed;
    
    // Auto-complete exercise only if ALL sets are checked
    const allDone = newSets.every(s => s.completed);
    onUpdate({ ...exerciseData, sets: newSets, completed: allDone });
  };

  return (
    <Card className={cn(
      "border transition-all duration-300 overflow-hidden",
      isCompleted ? "border-emerald-500/50 bg-emerald-950/10" : "border-zinc-800 bg-zinc-900/50"
    )}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* THE BIG CHECK: Allows "Just Ticking It Off" */}
          <button 
            onClick={handleMainToggle}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all active:scale-90",
              isCompleted 
                ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                : "border-zinc-700 text-zinc-700 hover:border-zinc-500"
            )}
          >
            <Check size={20} strokeWidth={4} />
          </button>
          
          <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
            <h3 className={cn(
              "font-black uppercase italic text-sm tracking-tight transition-colors",
              isCompleted ? "text-emerald-400" : "text-white"
            )}>
              {exerciseData.exercise_name}
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              {exerciseData.sets.filter(s => s.completed).length} / {exerciseData.sets.length} Sets
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-zinc-600">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 px-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
            <span>#</span>
            <span className="text-center">Weight</span>
            <span className="text-center">Reps</span>
            <span className="text-right">Status</span>
          </div>

          {exerciseData.sets.map((set, idx) => (
            <div key={set.id || idx} className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 items-center">
              <span className="text-xs font-black text-zinc-700 text-center">{idx + 1}</span>
              
              <Input
                type="number"
                value={set.weight}
                onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                className="h-10 bg-zinc-800/50 border-zinc-700/50 text-center font-bold text-cyan-500"
                placeholder="--"
              />
              
              <Input
                type="number"
                value={set.reps}
                onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                className="h-10 bg-zinc-800/50 border-zinc-700/50 text-center font-bold text-white"
                placeholder="--"
              />

              <button
                onClick={() => toggleSetComplete(idx)}
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                  set.completed ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-700"
                )}
              >
                <Check size={16} strokeWidth={4} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}