import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { localDB, db } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Trash2, Dumbbell, X } from "lucide-react";
import { toast } from 'sonner';

export default function DayPlan() {
  const { day } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    if (!day) return; // Prevention for the toLowerCase crash

    async function init() {
      const plan = await localDB.getPlanByDay(day);
      const allEx = await localDB.getAllExercises();
      setExercises(plan);
      setCatalog(allEx);
    }
    init();
  }, [day]);

  const addExerciseToPlan = async (baseEx) => {
    const newEntry = {
      day_of_week: day.toLowerCase(),
      exercise_id: baseEx.id,
      exercise_name: baseEx.name,
      target_sets: 3,
      target_reps: 10,
      target_weight_kg: 0
    };

    const id = await db.plans.add(newEntry);
    await localDB.addToQueue('plans', 'INSERT', { ...newEntry, id });
    setExercises([...exercises, { ...newEntry, id }]);
    setIsAdding(false);
    toast.success(`Added ${baseEx.name}`);
  };

  const removeExercise = async (id) => {
    await db.plans.delete(id);
    await localDB.addToQueue('plans', 'DELETE', { id });
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/WeeklyPlan')}><ChevronLeft /></Button>
        <h1 className="text-2xl font-black uppercase italic">{day} Plan</h1>
      </header>

      <div className="space-y-3">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-zinc-900 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Dumbbell className="text-cyan-500" />
              <span className="font-bold uppercase text-sm">{ex.exercise_name}</span>
            </div>
            <Button variant="ghost" onClick={() => removeExercise(ex.id)}><Trash2 size={16}/></Button>
          </div>
        ))}
        <Button onClick={() => setIsAdding(true)} className="w-full py-8 bg-zinc-900 border-dashed border-2 border-zinc-800 rounded-2xl">
          <Plus className="mr-2" /> Add Exercise
        </Button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/95 z-50 p-6 overflow-y-auto">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-black uppercase italic">Select Movement</h2>
            <Button variant="ghost" onClick={() => setIsAdding(false)}><X /></Button>
          </div>
          <div className="space-y-2">
            {catalog.map(ex => (
              <button key={ex.id} onClick={() => addExerciseToPlan(ex)} className="w-full bg-zinc-900 p-4 rounded-xl text-left font-bold uppercase hover:bg-cyan-500">
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}