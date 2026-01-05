import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Timer, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SessionExerciseCard from '@/components/SessionExerciseCard';

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
  const timerRef = useRef(null);

  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      const cachedActive = await localDB.getActiveSession();
      
      if (cachedActive && cachedActive.day_of_week === day) {
        setSession(cachedActive);
        const startTime = new Date(cachedActive.start_time).getTime();
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      } else {
        const plans = await localDB.getPlanByDay(day);
        const newSession = {
          id: crypto.randomUUID(),
          day_of_week: day,
          start_time: new Date().toISOString(),
          status: 'active',
          exercises: plans.map(p => ({
            id: crypto.randomUUID(),
            exercise_id: p.exercise_id,
            exercise_name: p.exercise_name,
            sets: p.sets || [{ weight: 0, reps: 0, completed: false }],
            completed: false,
            notes: p.notes || ''
          }))
        };
        await localDB.setActiveSession(newSession);
        setSession(newSession);
      }
      setLoading(false);
    };

    initSession();

    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [day]);

  const updateExercise = async (updatedEx) => {
    const updatedExercises = session.exercises.map(ex => 
      ex.id === updatedEx.id ? updatedEx : ex
    );
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    await localDB.setActiveSession(updatedSession);
  };

  const handleFinishWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalSession = {
        ...session,
        status: 'completed',
        end_time: new Date().toISOString(),
        total_duration: Math.round(elapsedTime / 60),
        user_id: user?.id
      };

      await localDB.saveHistory(finalSession);
      await localDB.clearActiveSession();

      if (user) {
        await supabase.from('workout_sessions').insert(finalSession);
      }

      navigate('/ActiveWorkout');
    } catch (error) {
      console.error("Failed to save workout:", error);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-zinc-900 p-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate(-1)} className="text-zinc-500"><ArrowLeft /></button>
          <div className="text-center">
            <h1 className="text-xs font-black uppercase tracking-widest text-zinc-500">{dayNames[day]} Session</h1>
            <div className="flex items-center gap-2 justify-center text-cyan-500">
              <Timer size={14} />
              <span className="font-mono font-bold text-xl">{formatTime(elapsedTime)}</span>
            </div>
          </div>
          <Button onClick={() => setShowFinishDialog(true)} className="bg-cyan-500 text-black font-black uppercase italic text-xs px-4 py-2 rounded-xl">Finish</Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {session?.exercises.map(ex => (
          <SessionExerciseCard key={ex.id} exerciseData={ex} onUpdate={updateExercise} />
        ))}
      </div>

      <AnimatePresence>
        {showFinishDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowFinishDialog(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 text-center">
              <Zap size={48} className="text-cyan-500 mx-auto mb-4" fill="currentColor" />
              <h2 className="text-2xl font-black uppercase italic mb-2">Complete?</h2>
              <p className="text-zinc-500 text-sm mb-8">Save your progress to history and the cloud.</p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleFinishWorkout} className="h-14 bg-white text-black font-black uppercase rounded-2xl">End Workout</Button>
                <Button onClick={() => setShowFinishDialog(false)} variant="ghost" className="h-14 text-zinc-500 font-bold uppercase">Resume</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}