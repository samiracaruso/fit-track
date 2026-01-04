import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient'; // Swapped to Supabase
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet";
import { ArrowLeft, Plus, CheckCircle, Clock, Timer, X } from "lucide-react";
import { motion } from "framer-motion";
import SessionExerciseCard from '@/components/workout/SessionExerciseCard';
import CalorieEstimate from '@/components/workout/CalorieEstimate';
import ExerciseCard from '@/components/workout/ExerciseCard';
import ExerciseFilters from '@/components/workout/ExerciseFilters';

const dayNames = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export default function ActiveSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const day = urlParams.get('day') || 'monday';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [session, setSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);

  // 1. Fetch Workout Plans from Supabase
  const { data: workoutPlans = [] } = useQuery({
    queryKey: ['workoutPlans', day],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('day_of_week', day)
        .eq('user_id', user.id)
        .order('order_index');
      
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch Exercises from Supabase
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*');
      if (error) throw error;
      return data;
    }
  });

  // 3. Fetch User Metrics
  const { data: userMetrics } = useQuery({
    queryKey: ['userMetrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) return { weight_kg: 70 }; // Default if not found
      return data;
    }
  });

  // 4. Check for an "In Progress" session
  const { data: existingSession } = useQuery({
    queryKey: ['todaySession', day],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const todayDate = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('date', todayDate)
        .eq('day_of_week', day)
        .eq('status', 'in_progress')
        .eq('user_id', user.id)
        .single();
      return data;
    }
  });

  // 5. Create/Update Session Mutations
  const createSessionMutation = useMutation({
    mutationFn: async (newData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert([{ ...newData, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('workout_sessions')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    }
  });

  // Initialize or load session
  useEffect(() => {
    if (existingSession) {
      setSession(existingSession);
      if (existingSession.start_time) {
        const start = new Date(existingSession.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000));
      }
    } else if (workoutPlans.length > 0 && !session) {
      const sessionExercises = workoutPlans.map(plan => ({
        plan_id: plan.id,
        exercise_id: plan.exercise_id,
        exercise_name: plan.exercise_name,
        completed: false,
        skipped: false
      }));

      createSessionMutation.mutate({
        date: new Date().toISOString().split('T')[0],
        day_of_week: day,
        status: 'in_progress',
        exercises: sessionExercises, // Note: storing as JSONB in Supabase
        start_time: new Date().toISOString()
      }, {
        onSuccess: (data) => setSession(data)
      });
    }
  }, [existingSession, workoutPlans]);

  // Timer logic remains the same
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExerciseUpdate = (updatedExercise) => {
    if (!session) return;
    
    const updatedExercises = session.exercises.map((ex) => {
      if (ex.plan_id && updatedExercise.plan_id && ex.plan_id === updatedExercise.plan_id) {
        return updatedExercise;
      } else if (!ex.plan_id && !updatedExercise.plan_id && 
                 ex.exercise_id === updatedExercise.exercise_id && 
                 ex.exercise_name === updatedExercise.exercise_name) {
        return updatedExercise;
      }
      return ex;
    });
    
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    
    updateSessionMutation.mutate({
      id: session.id,
      data: { exercises: updatedExercises }
    });
  };

  const handleFinishWorkout = () => {
    if (!session) return;
    
    updateSessionMutation.mutate({
      id: session.id,
      data: {
        status: 'completed',
        end_time: new Date().toISOString(),
        total_calories_burned: calculateTotalCalories()
      }
    }, {
      onSuccess: () => {
        navigate(createPageUrl('Home'));
      }
    });
  };

  const calculateTotalCalories = () => {
    if (!session?.exercises || !userMetrics?.weight_kg) return 0;
    let total = 0;
    session.exercises.forEach(ex => {
      if (!ex.completed || ex.skipped) return;
      const exerciseInfo = exercises.find(e => e.id === ex.exercise_id);
      const caloriesPerMin = exerciseInfo?.calories_per_minute || 5;
      let minutes = ex.actual_duration_minutes || 5;
      const weightMultiplier = userMetrics.weight_kg / 70;
      total += caloriesPerMin * minutes * weightMultiplier;
    });
    return Math.round(total);
  };

  const completedCount = session?.exercises?.filter(e => e.completed).length || 0;
  const totalCount = session?.exercises?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getPlanForExercise = (exerciseData) => {
    return workoutPlans.find(p => p.id === exerciseData.plan_id);
  };

  const getExerciseInfo = (exerciseId) => {
    return exercises.find(e => e.id === exerciseId);
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(ex.type);
    const matchesMuscle = selectedMuscles.length === 0 || 
      ex.muscle_groups?.some(m => selectedMuscles.includes(m));
    return matchesSearch && matchesType && matchesMuscle;
  });

  const handleSelectExercise = (exercise) => {
    setSelectedExercises(prev => {
      const exists = prev.find(e => e.id === exercise.id);
      if (exists) return prev.filter(e => e.id !== exercise.id);
      return [...prev, exercise];
    });
  };

  const handleAddExercises = () => {
    if (!session) return;
    const newExercises = selectedExercises.map(exercise => ({
      plan_id: null,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      completed: false,
      skipped: false
    }));
    const updatedExercises = [...session.exercises, ...newExercises];
    setSession({ ...session, exercises: updatedExercises });
    updateSessionMutation.mutate({
      id: session.id,
      data: { exercises: updatedExercises }
    });
    setSelectedExercises([]);
    setSheetOpen(false);
  };

  // ... (UI section remains mostly the same, ensuring variables like 'dayNames' and 'progress' are used)
  return (
    <div className="min-h-screen bg-black text-white pb-32">
       {/* ... Same JSX as original ... */}
       <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('DayPlan') + `?day=${day}`}>
                <Button size="icon" variant="ghost" className="text-zinc-400">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{dayNames[day]} Workout</h1>
                <p className="text-sm text-zinc-400">
                  {completedCount} of {totalCount} completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 rounded-full px-4 py-2 flex items-center gap-2">
                <Timer className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-white">{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {session?.exercises?.map((exerciseData, index) => (
          <motion.div key={index}>
            <SessionExerciseCard
              exerciseData={exerciseData}
              planData={getPlanForExercise(exerciseData)}
              exerciseInfo={getExerciseInfo(exerciseData.exercise_id)}
              onUpdate={handleExerciseUpdate}
            />
          </motion.div>
        ))}
        {/* ... Sheet, CalorieEstimate, and Buttons ... */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full border-dashed border-zinc-700 text-zinc-400">
              <Plus className="h-4 w-4 mr-2" /> Add more exercises
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] bg-zinc-950">
             {/* Exercise selection UI */}
          </SheetContent>
        </Sheet>
        <CalorieEstimate session={session} exercises={exercises} userMetrics={userMetrics} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4">
        <Button className="w-full h-14 bg-emerald-500 text-black" onClick={() => setShowFinishDialog(true)}>
          Finish Workout
        </Button>
      </div>

      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Finish Workout?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishWorkout} className="bg-emerald-500 text-black">Finish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}