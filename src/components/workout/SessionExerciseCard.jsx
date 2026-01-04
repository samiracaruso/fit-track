import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, SkipForward, Pencil, Timer, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SessionExerciseCard({ 
  exerciseData, 
  planData,
  exerciseInfo,
  onUpdate 
}) {
  const [expanded, setExpanded] = useState(false);
  const [editValues, setEditValues] = useState({
    actual_sets: exerciseData.actual_sets ?? planData?.target_sets ?? '',
    actual_reps: exerciseData.actual_reps ?? planData?.target_reps ?? '',
    actual_weight_kg: exerciseData.actual_weight_kg ?? planData?.target_weight_kg ?? '',
    actual_duration_minutes: exerciseData.actual_duration_minutes ?? planData?.target_duration_minutes ?? '',
    actual_distance_km: exerciseData.actual_distance_km ?? planData?.target_distance_km ?? '',
    notes: exerciseData.notes ?? ''
  });

  const isCardio = exerciseInfo?.is_cardio || exerciseInfo?.type === 'cardio';
  const isCompleted = exerciseData.completed;
  const isSkipped = exerciseData.skipped;

  const handleToggleComplete = () => {
    onUpdate({
      ...exerciseData,
      completed: !isCompleted,
      skipped: false,
      ...editValues
    });
  };

  const handleToggleSkip = () => {
    onUpdate({
      ...exerciseData,
      skipped: !isSkipped,
      completed: false
    });
  };

  const handleValueChange = (field, value) => {
    const newValues = { ...editValues, [field]: value };
    setEditValues(newValues);
    if (isCompleted) {
      onUpdate({
        ...exerciseData,
        completed: true,
        [field]: value ? Number(value) : null
      });
    }
  };

  return (
    <Card className={cn(
      "border transition-all duration-200",
      isCompleted && "bg-emerald-950/30 border-emerald-500/30",
      isSkipped && "bg-zinc-900/50 border-zinc-700 opacity-60",
      !isCompleted && !isSkipped && "bg-zinc-900/80 border-zinc-800"
    )}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggleComplete}
            disabled={isSkipped}
            className={cn(
              "h-6 w-6 rounded-full border-2",
              isCompleted && "bg-emerald-500 border-emerald-500"
            )}
          />
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold",
              isCompleted && "text-emerald-400",
              isSkipped && "text-zinc-500 line-through",
              !isCompleted && !isSkipped && "text-white"
            )}>
              {exerciseData.exercise_name}
            </h3>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {isCardio ? (
                <>
                  {(planData?.target_duration_minutes || editValues.actual_duration_minutes) && (
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      <Timer className="h-3 w-3 mr-1" />
                      {editValues.actual_duration_minutes || planData?.target_duration_minutes} min
                    </Badge>
                  )}
                  {(planData?.target_distance_km || editValues.actual_distance_km) && (
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      {editValues.actual_distance_km || planData?.target_distance_km} km
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  {(planData?.target_sets || editValues.actual_sets) && (
                    <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
                      {editValues.actual_sets || planData?.target_sets} sets
                    </Badge>
                  )}
                  {(planData?.target_reps || editValues.actual_reps) && (
                    <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
                      {editValues.actual_reps || planData?.target_reps} reps
                    </Badge>
                  )}
                  {(planData?.target_weight_kg || editValues.actual_weight_kg) && (
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      <Dumbbell className="h-3 w-3 mr-1" />
                      {editValues.actual_weight_kg || planData?.target_weight_kg} kg
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleSkip}
              className={cn(
                "h-8 w-8 p-0",
                isSkipped ? "text-amber-400" : "text-zinc-500"
              )}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0 text-zinc-400"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded && !isSkipped && (
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Actual Values</p>
            {isCardio ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Duration (min)</label>
                  <Input
                    type="number"
                    placeholder={planData?.target_duration_minutes?.toString() || "30"}
                    value={editValues.actual_duration_minutes}
                    onChange={(e) => handleValueChange('actual_duration_minutes', e.target.value)}
                    className="bg-zinc-800 border-zinc-700 h-9"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Distance (km)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={planData?.target_distance_km?.toString() || "5"}
                    value={editValues.actual_distance_km}
                    onChange={(e) => handleValueChange('actual_distance_km', e.target.value)}
                    className="bg-zinc-800 border-zinc-700 h-9"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Sets</label>
                  <Input
                    type="number"
                    placeholder={planData?.target_sets?.toString() || "3"}
                    value={editValues.actual_sets}
                    onChange={(e) => handleValueChange('actual_sets', e.target.value)}
                    className="bg-zinc-800 border-zinc-700 h-9"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Reps</label>
                  <Input
                    type="number"
                    placeholder={planData?.target_reps?.toString() || "12"}
                    value={editValues.actual_reps}
                    onChange={(e) => handleValueChange('actual_reps', e.target.value)}
                    className="bg-zinc-800 border-zinc-700 h-9"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder={planData?.target_weight_kg?.toString() || "20"}
                    value={editValues.actual_weight_kg}
                    onChange={(e) => handleValueChange('actual_weight_kg', e.target.value)}
                    className="bg-zinc-800 border-zinc-700 h-9"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Notes</label>
              <Input
                placeholder="How did it feel?"
                value={editValues.notes}
                onChange={(e) => {
                  setEditValues({ ...editValues, notes: e.target.value });
                  onUpdate({ ...exerciseData, notes: e.target.value });
                }}
                className="bg-zinc-800 border-zinc-700 h-9"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}