import React from 'react';
import { Card } from "@/components/ui/card";
import { Flame, Scale, Timer } from "lucide-react";

export default function CalorieEstimate({ session, exercises, userMetrics }) {
  const calculateCalories = () => {
    if (!session?.exercises || !userMetrics?.weight_kg) return null;

    let totalCalories = 0;
    let totalMinutes = 0;

    session.exercises.forEach(ex => {
      if (ex.skipped || !ex.completed) return;

      const exerciseInfo = exercises.find(e => e.id === ex.exercise_id);
      const caloriesPerMin = exerciseInfo?.calories_per_minute || 5;
      
      let minutes = 0;
      // NEW LOGIC: Calculate duration based on the sets array
      if (ex.actual_duration_minutes) {
        minutes = ex.actual_duration_minutes;
      } else if (ex.sets && Array.isArray(ex.sets)) {
        const setCount = ex.sets.length;
        const totalReps = ex.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
        // Estimate ~3 seconds per rep + 60s rest per set
        minutes = (totalReps * 3 + setCount * 60) / 60;
      } else {
        minutes = 5; // Default fallback
      }

      const weightMultiplier = userMetrics.weight_kg / 70;
      totalCalories += caloriesPerMin * minutes * weightMultiplier;
      totalMinutes += minutes;
    });

    return {
      calories: Math.round(totalCalories),
      duration: Math.round(totalMinutes),
      fatBurned: (totalCalories / 7700).toFixed(2)
    };
  };

  const stats = calculateCalories();
  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
        <div className="text-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <Flame className="h-6 w-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.calories}</p>
          <p className="text-[10px] font-bold uppercase text-zinc-500">Kcal</p>
        </div>
        <div className="text-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <Timer className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.duration}</p>
          <p className="text-[10px] font-bold uppercase text-zinc-500">Mins</p>
        </div>
        <div className="text-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <Scale className="h-6 w-6 text-violet-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.fatBurned}g</p>
          <p className="text-[10px] font-bold uppercase text-zinc-500">Fat Loss</p>
        </div>
    </div>
  );
}