import React, { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ExerciseSetsEditor({ plan, onSave, onClose }) {
  // Use the new array format from our Dexie/Supabase schema
  const [sets, setSets] = useState(plan.sets?.length > 0 ? plan.sets : [{ reps: 0, weight_kg: 0 }]);
  const [notes, setNotes] = useState(plan.notes || '');

  const addSet = () => {
    setSets([...sets, { reps: 0, weight_kg: 0 }]);
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
    // This calls the handleSave in DayPlan.jsx which does the Dexie + Supabase sync
    onSave(plan.id, { ...plan, sets, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-zinc-900 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold uppercase italic">{plan.exercise_name}</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="space-y-4">
          {sets.map((set, index) => (
            <div key={index} className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl">
              <span className="font-black text-cyan-500 w-6">{index + 1}</span>
              <Input 
                type="number" 
                placeholder="Reps" 
                value={set.reps} 
                onChange={(e) => updateSet(index, 'reps', e.target.value)}
                className="bg-black border-zinc-700"
              />
              <Input 
                type="number" 
                placeholder="KG" 
                value={set.weight_kg} 
                onChange={(e) => updateSet(index, 'weight_kg', e.target.value)}
                className="bg-black border-zinc-700"
              />
              <button onClick={() => removeSet(index)} className="text-zinc-500"><Trash2 size={18}/></button>
            </div>
          ))}

          <button onClick={addSet} className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 font-bold">
            + ADD SET
          </button>

          <button onClick={handleSave} className="w-full bg-cyan-500 text-black py-4 rounded-xl font-black uppercase mt-4">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}