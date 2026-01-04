import React, { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';

export default function ExerciseSetsEditor({ plan, onSave, onClose }) {
  const [sets, setSets] = useState(plan.sets?.length > 0 ? plan.sets : [{ reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0 }]);
  const [notes, setNotes] = useState(plan.notes || '');
  const [exercise, setExercise] = useState(null);

  React.useEffect(() => {
    const loadExercise = async () => {
      try {
        const exercises = await base44.entities.Exercise.filter({ id: plan.exercise_id });
        if (exercises[0]) {
          setExercise(exercises[0]);
        }
      } catch (error) {
        console.error('Error loading exercise:', error);
      }
    };
    loadExercise();
  }, [plan.exercise_id]);

  const addSet = () => {
    setSets([...sets, { reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0 }]);
  };

  const removeSet = (index) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (index, field, value) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: parseFloat(value) || 0 };
    setSets(newSets);
  };

  const handleSave = () => {
    onSave(plan.id, { sets, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-[#1a1a1a] w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">Edit Exercise</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{plan.exercise_name}</h3>
            <p className="text-[#a0a0a0] text-sm">Configure each set individually</p>
          </div>

          {/* Sets */}
          <div className="space-y-3">
            {sets.map((set, index) => (
              <div key={index} className="bg-[#242424] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-bold">Set {index + 1}</span>
                  {sets.length > 1 && (
                    <button
                      onClick={() => removeSet(index)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {exercise?.has_reps && (
                    <div>
                      <Label className="text-[#a0a0a0] text-xs mb-1 block">Reps</Label>
                      <Input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(index, 'reps', e.target.value)}
                        placeholder="0"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
                      />
                    </div>
                  )}
                  {exercise?.has_weight && (
                    <div>
                      <Label className="text-[#a0a0a0] text-xs mb-1 block">Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={set.weight_kg || ''}
                        onChange={(e) => updateSet(index, 'weight_kg', e.target.value)}
                        placeholder="0"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
                      />
                    </div>
                  )}
                  {exercise?.has_time && (
                    <div>
                      <Label className="text-[#a0a0a0] text-xs mb-1 block">Duration (min)</Label>
                      <Input
                        type="number"
                        value={set.duration_minutes || ''}
                        onChange={(e) => updateSet(index, 'duration_minutes', e.target.value)}
                        placeholder="0"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
                      />
                    </div>
                  )}
                  {exercise?.has_distance && (
                    <div>
                      <Label className="text-[#a0a0a0] text-xs mb-1 block">Distance (km)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={set.distance_km || ''}
                        onChange={(e) => updateSet(index, 'distance_km', e.target.value)}
                        placeholder="0"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
                      />
                    </div>
                  )}
                  {exercise?.has_floors && (
                    <div>
                      <Label className="text-[#a0a0a0] text-xs mb-1 block">Floors</Label>
                      <Input
                        type="number"
                        value={set.floors || ''}
                        onChange={(e) => updateSet(index, 'floors', e.target.value)}
                        placeholder="0"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
                      />
                    </div>
                  )}
                  {exercise?.has_steps && (
                    <div>
                      <Label className="text-[#a0a0a0] text-xs mb-1 block">Steps</Label>
                      <Input
                        type="number"
                        value={set.steps || ''}
                        onChange={(e) => updateSet(index, 'steps', e.target.value)}
                        placeholder="0"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Set Button */}
          <button
            onClick={addSet}
            className="w-full bg-[#242424] border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 flex items-center justify-center gap-2 text-[#a0a0a0] active:scale-98 transition-transform"
          >
            <Plus className="w-5 h-5" />
            Add Set
          </button>

          {/* Notes */}
          <div>
            <Label className="text-[#a0a0a0] mb-2 block">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or reminders..."
              className="bg-[#242424] border-[#2a2a2a] text-white min-h-24"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#2a2a2a] px-6 py-4">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 glow-strong active:scale-98 transition-transform"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}