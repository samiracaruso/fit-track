import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { localDB } from '@/api/localDB';
import { supabase } from '@/supabaseClient';
import { Button } from "@/components/ui/button";
import { Play, Square, Plus, CheckCircle2 } from "lucide-react";
import { toast } from 'sonner';

export default function ActiveSession() {
  const [searchParams] = useSearchParams();
  const day = searchParams.get('day');
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    const initSession = async () => {
      // 1. Check if there is an existing paused session
      const existing = await localDB.getActiveSession();
      if (existing) {
        setSession(existing);
      } else {
        // 2. Load the plan for today
        const plan = await localDB.getPlanByDay(day);
        const newSession = {
          id: crypto.randomUUID(),
          day_of_week: day,
          date: new Date().toISOString(),
          exercises: plan.map(p => ({ ...p, completed_sets: [] })),
          status: 'active'
        };
        await localDB.saveActiveSession(newSession);
        setSession(newSession);
      }
    };
    initSession();
  }, [day]);

  const handleFinish = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const finalSession = {
      ...session,
      total_duration: seconds,
      status: 'completed',
      user_id: user?.id // Vital for cloud sync
    };

    // 1. Save to History (Local)
    await localDB.saveSession(finalSession);
    
    // 2. Add to Cloud Sync Queue
    await localDB.addToQueue('history', 'INSERT', finalSession);
    
    // 3. Clear Active Session
    await localDB.deleteActiveSession();

    toast.success("Workout Saved!");
    navigate('/WorkoutHistory');
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black italic uppercase text-cyan-500">Active Lift</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase">{day} Session</p>
        </div>
        <div className="text-2xl font-mono font-black text-white bg-zinc-900 px-4 py-2 rounded-xl">
          {new Date(seconds * 1000).toISOString().substr(11, 8)}
        </div>
      </div>

      {/* Exercise List would go here - for now, we ensure the Finish works */}
      <div className="space-y-4">
        {session.exercises.map((ex, i) => (
          <div key={i} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
            <p className="font-bold uppercase italic text-cyan-500">{ex.exercise_name}</p>
          </div>
        ))}
      </div>

      <div className="fixed bottom-10 left-6 right-6 flex gap-4">
        <Button 
          onClick={() => navigate(`/SelectExercise?mode=active`)}
          className="flex-1 py-8 rounded-2xl bg-zinc-800 font-black uppercase italic"
        >
          <Plus className="mr-2" /> Add Move
        </Button>
        <Button 
          onClick={handleFinish}
          className="flex-1 py-8 rounded-2xl bg-cyan-500 text-black font-black uppercase italic hover:bg-white"
        >
          <CheckCircle2 className="mr-2" /> Finish
        </Button>
      </div>
    </div>
  );
}