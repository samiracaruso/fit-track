// [DEXIE-INTEGRATED] - Updated for JSONB Sets Array
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
    // Fallback to empty array if sets doesn't exist
    sets: plan.sets || [],
    notes: plan.notes || ''
  });

  const isCardio = exercise?.type === 'cardio';

  const handleSave = () => {
    onUpdate(plan.id, {
      ...plan,
      sets: editData.sets,
      notes: editData.notes
    });
    setIsEditing(false);
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden mb-3">
      <div className="flex">
        {/* Drag Handle */}
        <div 
          {...dragHandleProps}
          className="w-10 flex items-center justify-center bg-zinc-900 border-r border-zinc-800 text-zinc-700 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </div>

        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-black uppercase italic text-sm text-white">
                {plan.exercise_name || exercise?.name}
              </h3>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 uppercase">
                  {plan.sets?.length || 0} Sets
                </Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500" onClick={() => setIsEditing(!isEditing)}>
                <Pencil size={14} />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-red-500" onClick={() => onDelete(plan.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          {isEditing ? (
            <div className="mt-4 space-y-4 border-t border-zinc-800 pt-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Internal Notes</label>
                <Input
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 h-10 text-white"
                  placeholder="Focus on tempo..."
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-cyan-500 text-black font-black uppercase text-xs" onClick={handleSave}>
                  Save Plan
                </Button>
                <Button size="sm" variant="outline" className="border-zinc-700 text-white font-black uppercase text-xs" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            plan.notes && (
              <p className="text-xs text-zinc-500 mt-2 italic">“{plan.notes}”</p>
            )
          )}
        </div>
      </div>
    </Card>
  );
}