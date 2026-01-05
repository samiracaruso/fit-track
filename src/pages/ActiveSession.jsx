import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Timer, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';

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
      try {
        const cachedActive = await localDB.getActiveSession();
        
        if (cachedActive && cachedActive.day_of_week === day) {
          // Resume existing session
          setSession(cachedActive);
          const start = new Date(cachedActive.start_time);
          const now = new Date();
          setElapsedTime(Math.floor((now - start) / 1000));
        } else {
          // Start New Session: Load plan for this day
          const planExercises = await localDB.getPlanByDay(day);
          
          const newSession = {
            id: Date.now(), // Local temporary ID
            day_of_week: day,
            start_time: new Date().toISOString(),
            status: 'active',
            exercises: planExercises.map(ex => ({
              exercise_id: ex.exercise_id,
              exercise_name: ex.exercise_name,
              completed: false,
              sets: Array.from({ length: ex.target_sets || 1 }, (_, i) => ({
                id: i,
                weight: ex.target_weight_kg || 0,
                reps: ex.target_reps || 0,
                completed: false
              }))
            }))
          };
          
          await localDB.saveActiveSession(newSession);
          setSession(newSession);
        }
      } catch (err) {
        console.error("Failed to init session", err);
        toast.error("Could not load workout plan.");
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [day]);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    if (session && !loading) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [session, loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- 3. UPDATE LOGIC (Auto-saves to Dexie) ---
  const handleUpdateExercise = async (updatedExercise) => {
    const newExercises = session.exercises.map(ex => 
      ex.exercise_id === updatedExercise.exercise_id ? updatedExercise : ex
    );
    
    const updatedSession = { ...session, exercises: newExercises };
    setSession(updatedSession);
    await localDB.saveActiveSession(updatedSession);
  };

  // --- 4. FINISH WORKOUT (The Sync Engine) ---
  const handleFinishWorkout = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const finalSession = {
        ...session,
        user_id: user?.id,
        end_time: new Date().toISOString(),
        status: 'completed',
        total_duration: Math.floor(elapsedTime / 60), // in minutes
        date: new Date().toISOString()
      };

      // A. Save to Local History Immediately
      await localDB.saveSession(finalSession);
      
      // B. Clear the "Active" state so user doesn't resume a finished workout
      await localDB.deleteActiveSession();

      // C. Attempt Cloud Sync
      const { error } = await supabase.from('workout_sessions').insert(finalSession);

      if (error) {
        // D. Offline Fallback: Add to Sync Queue
        await localDB.addToQueue('workout_sessions', 'INSERT', finalSession);
        toast.info("Saved locally. Will sync to cloud when online.");
      } else {
        toast.success("Workout saved and synced!");
      }

      navigate('/Home');
    } catch (err) {
      console.error("Error ending workout:", err);
      toast.error("Something went wrong saving your workout.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-cyan-500 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-md sticky top-0 z-30 px-6 pt-8 pb-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <Link to="/Home" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Live Session</span>
            <h1 className="text-xl font-black italic uppercase italic tracking-tighter text-white">
              {dayNames[day]} Routine
            </h1>
          </div>
          <div className="w-6" /> {/* Spacer */}
        </div>

        <div className="flex items-center justify-center gap-2 bg-zinc-900/50 py-3 rounded-2xl border border-white/5">
          <Timer size={18} className="text-cyan-500" />
          <span className="text-2xl font-black tabular-nums tracking-tight text-white">
            {formatTime(elapsedTime)}
          </span>
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-6 mt-8 space-y-6">
        {session?.exercises.map((ex) => (
          <SessionExerciseCard 
            key={ex.exercise_id} 
            exerciseData={ex} 
            onUpdate={handleUpdateExercise}
          />
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-40">
        <Button 
          onClick={() => setShowFinishDialog(true)}
          className="w-full h-16 bg-white text-black hover:bg-cyan-500 hover:text-white transition-all rounded-[2rem] font-black uppercase italic tracking-widest shadow-xl shadow-white/5"
        >
          Finish Workout
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showFinishDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
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
              <p className="text-zinc-500 text-sm mb-8 font-medium text-center">
                Your stats will be saved to your local history and synced to the cloud.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleFinishWorkout} 
                  className="h-14 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-cyan-500 transition-colors"
                >
                  End Workout
                </Button>
                <Button 
                  onClick={() => setShowFinishDialog(false)} 
                  variant="ghost" 
                  className="h-14 text-zinc-500 font-bold uppercase tracking-widest hover:text-white"
                >
                  Keep Going
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}