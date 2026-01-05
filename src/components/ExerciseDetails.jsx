import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ExerciseDetails({ plan, onSave, onClose }) {
  // We initialize with the new JSONB array format
  const [formData, setFormData] = useState({
    sets: Array.isArray(plan.sets) ? plan.sets : [],
    notes: plan.notes || ''
  });

  const handleSave = () => {
    onSave(plan.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end">
      <div className="bg-zinc-900 w-full rounded-t-[2.5rem] p-8 border-t border-zinc-800">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">Edit Protocol</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full"><X size={20}/></button>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Notes & Cues</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Focus on the squeeze..."
              className="bg-black border-zinc-800 text-white min-h-[120px] rounded-2xl"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-cyan-500 text-black py-4 rounded-2xl font-black uppercase italic shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            Update Exercise
          </button>
        </div>
      </div>
    </div>
  );
}