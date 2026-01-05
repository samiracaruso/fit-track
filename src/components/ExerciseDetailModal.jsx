import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { X, TrendingUp, Calendar, Award, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ExerciseDetailModal({ exercise, onClose }) {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, [exercise.id]);

  const loadUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch sessions containing this exercise
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .order('date', { ascending: false });

      const exerciseHistory = [];
      sessions.forEach(session => {
        // Search inside the JSONB 'exercises' array
        const exerciseData = session.exercises?.find(e => e.exercise_id === exercise.id);
        if (exerciseData && exerciseData.completed) {
          exerciseHistory.push({
            date: session.date,
            ...exerciseData
          });
        }
      });

      if (exerciseHistory.length > 0) {
        // Calculation logic remains the same
        setUserStats({
          timesPerformed: exerciseHistory.length,
          recentSessions: exerciseHistory.slice(0, 5),
          maxWeight: Math.max(...exerciseHistory.flatMap(h => h.sets?.map(s => s.weight_kg || 0) || [0]))
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black italic uppercase">{exercise.name}</h2>
        <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full"><X /></button>
      </div>
      
      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        userStats ? (
          <div className="space-y-4">
             <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <p className="text-zinc-500 text-xs font-bold uppercase">Personal Best</p>
                <p className="text-3xl font-black text-cyan-500">{userStats.maxWeight} KG</p>
             </div>
             {/* Render History List */}
          </div>
        ) : <p className="text-zinc-500 text-center py-10">No history yet.</p>
      )}
    </div>
  );
}