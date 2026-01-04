import React from 'react';
import { Card } from "@/components/ui/card";
import { Flame, TrendingUp, Scale, Timer } from "lucide-react";

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
      if (ex.actual_duration_minutes) {
        minutes = ex.actual_duration_minutes;
      } else if (ex.actual_sets && ex.actual_reps) {
        // Estimate ~3 seconds per rep + rest
        minutes = (ex.actual_sets * ex.actual_reps * 3 + ex.actual_sets * 60) / 60;
      } else {
        minutes = 5; // Default estimate
      }

      // Adjust for body weight (base is 70kg)
      const weightMultiplier = userMetrics.weight_kg / 70;
      totalCalories += caloriesPerMin * minutes * weightMultiplier;
      totalMinutes += minutes;
    });

    return {
      calories: Math.round(totalCalories),
      duration: Math.round(totalMinutes),
      fatBurned: (totalCalories / 7700 * 1000).toFixed(1), // grams of fat
    };
  };

  const stats = calculateCalories();

  if (!stats || !userMetrics?.weight_kg) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800 p-6">
        <div className="text-center">
          <Flame className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm">
            {!userMetrics?.weight_kg 
              ? "Add your metrics to see calorie estimates"
              : "Complete exercises to see your stats"}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-950/40 to-red-950/40 border-orange-500/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        Workout Summary
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
            <Flame className="h-6 w-6 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.calories}</p>
          <p className="text-xs text-zinc-400">calories</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
            <Timer className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.duration}</p>
          <p className="text-xs text-zinc-400">minutes</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
            <Scale className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.fatBurned}g</p>
          <p className="text-xs text-zinc-400">fat burned</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-orange-500/20">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span>Keep it up! Consistency is key to results.</span>
        </div>
      </div>
    </Card>
  );
}