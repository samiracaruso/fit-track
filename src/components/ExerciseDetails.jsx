import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ExerciseDetails({ plan, onSave, onClose }) {
  const [formData, setFormData] = useState({
    target_sets: plan.target_sets || '',
    target_reps: plan.target_reps || '',
    target_weight_kg: plan.target_weight_kg || '',
    target_duration_minutes: plan.target_duration_minutes || '',
    target_distance_km: plan.target_distance_km || '',
    notes: plan.notes || ''
  });

  const handleSave = () => {
    onSave(plan.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-[#1a1a1a] w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
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
            <p className="text-[#a0a0a0] text-sm">Set your target values for this exercise</p>
          </div>

          {/* Weight Training Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#a0a0a0] mb-2 block">Sets</Label>
                <Input
                  type="number"
                  value={formData.target_sets}
                  onChange={(e) => setFormData({ ...formData, target_sets: parseFloat(e.target.value) || '' })}
                  placeholder="0"
                  className="bg-[#242424] border-[#2a2a2a] text-white h-14 text-lg"
                />
              </div>
              <div>
                <Label className="text-[#a0a0a0] mb-2 block">Reps</Label>
                <Input
                  type="number"
                  value={formData.target_reps}
                  onChange={(e) => setFormData({ ...formData, target_reps: parseFloat(e.target.value) || '' })}
                  placeholder="0"
                  className="bg-[#242424] border-[#2a2a2a] text-white h-14 text-lg"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#a0a0a0] mb-2 block">Weight (kg)</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.target_weight_kg}
                onChange={(e) => setFormData({ ...formData, target_weight_kg: parseFloat(e.target.value) || '' })}
                placeholder="0"
                className="bg-[#242424] border-[#2a2a2a] text-white h-14 text-lg"
              />
            </div>
          </div>

          {/* Cardio Fields */}
          <div className="border-t border-[#2a2a2a] pt-6 space-y-4">
            <p className="text-[#a0a0a0] text-sm font-medium">Cardio Targets</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#a0a0a0] mb-2 block">Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.target_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, target_duration_minutes: parseFloat(e.target.value) || '' })}
                  placeholder="0"
                  className="bg-[#242424] border-[#2a2a2a] text-white h-14 text-lg"
                />
              </div>
              <div>
                <Label className="text-[#a0a0a0] mb-2 block">Distance (km)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.target_distance_km}
                  onChange={(e) => setFormData({ ...formData, target_distance_km: parseFloat(e.target.value) || '' })}
                  placeholder="0"
                  className="bg-[#242424] border-[#2a2a2a] text-white h-14 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-[#a0a0a0] mb-2 block">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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