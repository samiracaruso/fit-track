import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Plus, Timer } from "lucide-react";
import { motion } from "framer-motion";

// Components
import SessionExerciseCard from '@/components/workout/SessionExerciseCard';
import CalorieEstimate from '@/components/workout/CalorieEstimate';

const dayNames = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', 
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

export default function ActiveSession() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const day = urlParams.get('day') || 'monday';

  // --- STATE ---
  const [session, setSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 1. INITIALIZE SESSION (Offline First) ---
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      
      // A. Check Local Storage first (did we leave a workout in progress?)
      const localActive = localStorage.getItem('active_workout_session');
      if (localActive) {
        const parsed = JSON.parse(localActive);
        // Only resume if it's the same day
        if (parsed.day_of_week === day) {
          setSession(parsed);
          calculateElapsed(parsed.start_time);
          setLoading(false);
          return;
        }
      }

      // B. If nothing local, check Supabase (as backup)
      const { data: { user } } = await supabase.auth.getUser();
      const todayDate = new Date().toISOString().split('T')[0];
      
      const { data: existing } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('date', todayDate)
        .eq('status', 'in_progress')
        .single();

      if (existing) {
        setSession(existing);
        localStorage.setItem('active_workout_session', JSON.stringify(existing));
        calculateElapsed(existing.start_time);
      } else {
        // C. Create New Session from Weekly Plan Cache
        const plans = JSON.parse(localStorage.getItem('weekly_workout_plans') || '[]');
        const dayPlans = plans.filter(p => p.day_of_week === day);

        const newSession = {
          id: crypto.randomUUID(), // Temp ID for offline
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
        localStorage.setItem('active_workout_session', JSON.stringify(newSession));
        
        // Background sync to Supabase (don't wait for it)
        supabase.from('workout_sessions').insert([{ ...newSession, user_id: user.id }]);
      }
      setLoading(false);
    };

    initSession();
  }, [day]);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateElapsed = (startTime) => {
    const start = new Date(startTime).getTime();
    setElapsedTime(Math.floor((Date.now() - start) / 1000));
  };

  // --- 3. UPDATING EXERCISES (Save Locally Immediately) ---
  const handleExerciseUpdate = (updatedEx) => {
    const updatedExercises = session.exercises.map(ex => 
      ex.exercise_id === updatedEx.exercise_id ? updatedEx : ex
    );
    
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    
    // Save to local storage so progress is never lost
    localStorage.setItem('active_workout_session', JSON.stringify(updatedSession));

    // Background sync to Supabase
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

    // 1. Save to History Cache
    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    localStorage.setItem('workout_history', JSON.stringify([finishedSession, ...history]));

    // 2. Clear Active Session Cache
    localStorage.removeItem('active_workout_session');

    // 3. Try to save to Supabase
    const { error } = await supabase.from('workout_sessions')
      .update({ 
        status: 'completed', 
        end_time: finishedSession.end_time,
        exercises: finishedSession.exercises 
      })
      .eq('id', session.id);

    navigate(createPageUrl('Home'));
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-zinc-500">Loading Session...</div>;

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
              <h1 className="text-xl font-bold">{dayNames[day]}</h1>
              <p className="text-sm text-zinc-400">{completedCount} of {totalCount} completed</p>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-full px-4 py-2 flex items-center gap-2">
            <Timer className="h-4 w-4 text-emerald-400" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-4 h-1 bg-zinc-800 rounded-full">
          <motion.div className="h-full bg-emerald-500" animate={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 py-6 space-y-4">
        {session?.exercises?.map((ex, i) => (
          <SessionExerciseCard 
            key={i} 
            exerciseData={ex} 
            onUpdate={handleExerciseUpdate} 
          />
        ))}
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
        <Button className="w-full h-14 bg-emerald-500 text-black font-bold" onClick={() => setShowFinishDialog(true)}>
          Finish Workout
        </Button>
      </div>

      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Workout?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white">Continue</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishWorkout} className="bg-emerald-500 text-black">Finish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}