import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; // Import Dexie
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Timer, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Components
import SessionExerciseCard from '@/components/workout/SessionExerciseCard';

const dayNames = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', 
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

export default function ActiveSession() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const day = urlParams.get('day') || 'monday';

  const [session, setSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 1. INITIALIZE SESSION (Dexie First) ---
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      
      // A. Check Dexie first for a persistent draft
      const cachedActive = await localDB.getActiveSession();
      
      if (cachedActive && cachedActive.day_of_week === day) {
        setSession(cachedActive);
        const start = new Date(cachedActive.start_time).getTime();
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
        setLoading(false);
        return;
      }

      // B. Create New Session if no local draft exists
      const { data: { user } } = await supabase.auth.getUser();
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Load plans from Dexie (synced in DayPlan.jsx)
      const dayPlans = await localDB.getPlansByDay(day);

      const newSession = {
        id: crypto.randomUUID(), 
        date: todayDate,
        day_of_week: day,
        status: 'in_progress',
        start_time: new Date().toISOString(),
        exercises: dayPlans.map(p => ({
          plan_id: p.id,
          exercise_id: p.exercise_id,
          exercise_name: p.exercise_name,
          completed: false,
          sets: p.sets || []
        }))
      };
      
      setSession(newSession);
      await localDB.saveActiveSession(newSession);
      
      // Background sync to Supabase (Optional, as Dexie is our primary safety)
      if (user) {
        supabase.from('workout_sessions').insert([{ ...newSession, user_id: user.id }]);
      }
      
      setLoading(false);
    };

    initSession();
  }, [day]);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 3. UPDATING EXERCISES (Save to Dexie on every change) ---
  const handleExerciseUpdate = async (updatedEx) => {
    const updatedExercises = session.exercises.map(ex => 
      ex.exercise_id === updatedEx.exercise_id ? updatedEx : ex
    );
    
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    
    // Instant Dexie Save - prevents data loss if app closes
    await localDB.saveActiveSession(updatedSession);

    // Background cloud update
    supabase.from('workout_sessions')
      .update({ exercises: updatedExercises })
      .eq('id', session.id);
  };

  // --- 4. FINISH WORKOUT ---
  const handleFinishWorkout = async () => {
    const finishedSession = {
      ...session,
      status: 'completed',
      end_time: new Date().toISOString(),
      duration_seconds: elapsedTime
    };

    try {
      // 1. Save to History Table in Dexie
      await localDB.saveSession(finishedSession);

      // 2. Clear Active Session from Dexie
      await localDB.deleteActiveSession();

      // 3. Try to sync to Supabase
      await supabase.from('workout_sessions')
        .update({ 
          status: 'completed', 
          end_time: finishedSession.end_time,
          exercises: finishedSession.exercises 
        })
        .eq('id', session.id);

      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error("Sync failed, but session is saved locally.");
      navigate(createPageUrl('Home'));
    }
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Resuming Session...</p>
      </div>
    );
  }

  const completedCount = session?.exercises?.filter(e => e.completed).length || 0;
  const totalCount = session?.exercises?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-lg border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/DayPlan?day=${day}`}>
              <Button size="icon" variant="ghost" className="text-zinc-400"><ArrowLeft /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase italic italic">{dayNames[day]}</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{completedCount} of {totalCount} completed</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg shadow-emerald-500/5">
            <Timer className="h-4 w-4 text-emerald-400" />
            <span className="font-mono font-bold text-emerald-500">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 py-6 space-y-4">
        {session?.exercises?.map((ex, i) => (
          <SessionExerciseCard 
            key={ex.exercise_id || i} 
            exerciseData={ex} 
            onUpdate={handleExerciseUpdate} 
          />
        ))}
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
        <Button 
          className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic tracking-tighter text-lg rounded-2xl shadow-xl shadow-emerald-500/20" 
          onClick={() => setShowFinishDialog(true)}
        >
          Finish Workout
        </Button>
      </div>

      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        {/* ... existing AlertDialog content ... */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 w-full max-w-sm">
             <h2 className="text-2xl font-black uppercase italic mb-2">End Session?</h2>
             <p className="text-zinc-500 text-sm mb-8 font-medium">Have you finished all your sets for today?</p>
             <div className="flex flex-col gap-3">
                <Button onClick={handleFinishWorkout} className="h-14 bg-emerald-500 text-black font-black uppercase italic rounded-2xl">Finish Now</Button>
                <Button onClick={() => setShowFinishDialog(false)} variant="ghost" className="h-14 text-zinc-500 font-bold uppercase text-xs tracking-widest">Continue Training</Button>
             </div>
          </div>
        </div>
      </AlertDialog>
    </div>
  );
}