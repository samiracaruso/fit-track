import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, GripVertical, Timer, Dumbbell, Check, X } from "lucide-react";

export default function PlannedExerciseCard({ 
  plan, 
  exercise,
  onUpdate, 
  onDelete, 
  dragHandleProps = {} 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    target_sets: plan.target_sets || '',
    target_reps: plan.target_reps || '',
    target_weight_kg: plan.target_weight_kg || '',
    target_duration_minutes: plan.target_duration_minutes || '',
    target_distance_km: plan.target_distance_km || '',
    notes: plan.notes || ''
  });

  const isCardio = exercise?.is_cardio || exercise?.type === 'cardio';

  const handleSave = () => {
    onUpdate(plan.id, {
      target_sets: editData.target_sets ? Number(editData.target_sets) : null,
      target_reps: editData.target_reps ? Number(editData.target_reps) : null,
      target_weight_kg: editData.target_weight_kg ? Number(editData.target_weight_kg) : null,
      target_duration_minutes: editData.target_duration_minutes ? Number(editData.target_duration_minutes) : null,
      target_distance_km: editData.target_distance_km ? Number(editData.target_distance_km) : null,
      notes: editData.notes
    });
    setIsEditing(false);
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 p-4">
      <div className="flex items-start gap-3">
        <div {...dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-zinc-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white">{plan.exercise_name}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {isCardio ? (
                  <>
                    {plan.target_duration_minutes && (
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <Timer className="h-3 w-3 mr-1" />
                        {plan.target_duration_minutes} min
                      </Badge>
                    )}
                    {plan.target_distance_km && (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {plan.target_distance_km} km
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    {plan.target_sets && (
                      <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                        {plan.target_sets} sets
                      </Badge>
                    )}
                    {plan.target_reps && (
                      <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                        {plan.target_reps} reps
                      </Badge>
                    )}
                    {plan.target_weight_kg && (
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        <Dumbbell className="h-3 w-3 mr-1" />
                        {plan.target_weight_kg} kg
                      </Badge>
                    )}
                  </>
                )}
              </div>
              {plan.notes && !isEditing && (
                <p className="text-xs text-zinc-500 mt-2">{plan.notes}</p>
              )}
            </div>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(plan.id)}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 space-y-3 pt-3 border-t border-zinc-800">
              {isCardio ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Duration (min)</label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={editData.target_duration_minutes}
                      onChange={(e) => setEditData({ ...editData, target_duration_minutes: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Distance (km)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="5"
                      value={editData.target_distance_km}
                      onChange={(e) => setEditData({ ...editData, target_distance_km: e.target.value })}
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
                      placeholder="3"
                      value={editData.target_sets}
                      onChange={(e) => setEditData({ ...editData, target_sets: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Reps</label>
                    <Input
                      type="number"
                      placeholder="12"
                      value={editData.target_reps}
                      onChange={(e) => setEditData({ ...editData, target_reps: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="20"
                      value={editData.target_weight_kg}
                      onChange={(e) => setEditData({ ...editData, target_weight_kg: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 h-9"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Notes</label>
                <Input
                  placeholder="Any notes..."
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 h-9"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}