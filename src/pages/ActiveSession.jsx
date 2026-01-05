import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ArrowLeft, Timer, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const timerRef = useRef(null);

  // --- 1. INITIALIZE SESSION ---
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      const cachedActive = await localDB.getActiveSession();
      
      // If we have a cached session for THIS day, resume it
      if (cachedActive && cachedActive.day_of_week === day) {
        setSession(cachedActive);
        calculateElapsed(cachedActive.start_time);
        setLoading(false);
        return;
      }

      // Otherwise, Create New Session
      const { data: { user } } = await supabase.auth.getUser();
      const dayPlans = await localDB.getPlansByDay(day);

      const newSession = {
        id: crypto.randomUUID(), 
        date: new Date().toISOString().split('T')[0],
        day_of_week: day,
        status: 'in_progress',
        start_time: new Date().toISOString(),
        exercises: dayPlans.map(p => ({
          id: crypto.randomUUID(), // Unique ID for this specific session-exercise
          plan_id: p.id,
          exercise_id: p.exercise_id,
          exercise_name: p.exercise_name,
          completed: false,
          // Initialize empty sets based on the plan's set count
          sets: Array.from({ length: p.sets || 3 }, (_, i) => ({
            id: i + 1,
            weight: '',
            reps: p.reps || '',
            completed: false
          }))
        }))
      };
      
      setSession(newSession);
      await localDB.saveActiveSession(newSession);
      
      if (user) {
        // Fire and forget cloud sync
        supabase.from('workout_sessions').insert([{ ...newSession, user_id: user.id }]).then();
      }
      
      setLoading(false);
    };

    initSession();
  }, [day]);

  // --- 2. TIMER LOGIC ---
  const calculateElapsed = (startTime) => {
    const start = new Date(startTime).getTime();
    setElapsedTime(Math.floor((Date.now() - start) / 1000));
  };

  useEffect(() => {
    if (session && !loading) {
      timerRef.current = setInterval(() => {
        calculateElapsed(session.start_time);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [session, loading]);

  // --- 3. UPDATING EXERCISES ---
  const handleExerciseUpdate = async (updatedEx) => {
    const updatedExercises = session.exercises.map(ex => 
      ex.id === updatedEx.id ? updatedEx : ex
    );
    
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    
    // Dexie is primary for active sessions
    await localDB.saveActiveSession(updatedSession);

    // Sync to Supabase in background
    supabase.from('workout_sessions')
      .update({ exercises: updatedExercises })
      .eq('id', session.id)
      .then();
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
      await localDB.saveSession(finishedSession);
      await localDB.deleteActiveSession();

      // Cloud Sync
      await supabase.from('workout_sessions')
        .update({ 
          status: 'completed', 
          end_time: finishedSession.end_time,
          exercises: finishedSession.exercises,
          duration_seconds: elapsedTime
        })
        .eq('id', session.id);

      navigate('/');
    } catch (error) {
      console.error("Cloud sync failed, data saved to Dexie.");
      navigate('/');
    }
  };

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-cyan-500" size={48} />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500 w-4 h-4" />
        </div>
        <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Initializing Protocol</p>
      </div>
    );
  }

  const completedCount = session?.exercises?.filter(e => e.completed).length || 0;
  const totalCount = session?.exercises?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Dynamic Progress Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
                {dayNames[day]} <span className="text-cyan-500">Session</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                {completedCount} / {totalCount} Exercises
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                <Timer size={14} className="animate-pulse" />
                <span className="font-mono font-black text-sm">{formatTime(elapsedTime)}</span>
             </div>
          </div>
        </div>
        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-600 to-blue-500" 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 py-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {session?.exercises?.map((ex) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <SessionExerciseCard 
                exerciseData={ex} 
                onUpdate={handleExerciseUpdate} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-40">
        <Button 
          className="w-full h-16 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase italic tracking-tighter text-lg rounded-[2rem] shadow-2xl shadow-cyan-500/20 active:scale-[0.98] transition-all" 
          onClick={() => setShowFinishDialog(true)}
        >
          Finish Training Session
        </Button>
      </div>

      {/* Finish Dialog */}
      <AnimatePresence>
        {showFinishDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setShowFinishDialog(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 w-full max-w-sm relative z-10"
            >
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500 mb-6 mx-auto">
                <Zap size={32} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-black uppercase italic mb-2 text-center">Complete Session?</h2>
              <p className="text-zinc-500 text-sm mb-8 font-medium text-center">Your stats will be saved to your local history and synced to the cloud.</p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleFinishWorkout} className="h-14 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-cyan-500 transition-colors">End Workout</Button>
                <Button onClick={() => setShowFinishDialog(false)} variant="ghost" className="h-14 text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Go Back</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}