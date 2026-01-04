import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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

  const { data: workoutPlans = [] } = useQuery({
    queryKey: ['workoutPlans', day],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WorkoutPlan.filter({ 
        day_of_week: day,
        created_by: user.email 
      }, 'order');
    }
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list()
  });

  const { data: userMetrics } = useQuery({
    queryKey: ['userMetrics'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const metrics = await base44.entities.UserMetrics.filter({ created_by: user.email });
      return metrics[0];
    }
  });

  const { data: existingSession } = useQuery({
    queryKey: ['todaySession', day],
    queryFn: async () => {
      const user = await base44.auth.me();
      const todayDate = new Date().toISOString().split('T')[0];
      const sessions = await base44.entities.WorkoutSession.filter({ 
        date: todayDate, 
        day_of_week: day,
        status: 'in_progress',
        created_by: user.email
      });
      return sessions[0];
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutSession.create(data)
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkoutSession.update(id, data)
  });

  // Initialize or load session
  useEffect(() => {
    if (existingSession) {
      setSession(existingSession);
      // Calculate elapsed time from start
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
        exercises: sessionExercises,
        start_time: new Date().toISOString()
      }, {
        onSuccess: (data) => setSession(data)
      });
    }
  }, [existingSession, workoutPlans]);

  // Timer
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
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExerciseUpdate = (updatedExercise) => {
    if (!session) return;
    
    const updatedExercises = session.exercises.map((ex, idx) => {
      // Match by index in session to handle duplicates and added exercises
      const exKey = `${ex.plan_id || 'none'}-${ex.exercise_id}-${idx}`;
      const updatedKey = `${updatedExercise.plan_id || 'none'}-${updatedExercise.exercise_id}-${session.exercises.findIndex(e => e === ex)}`;
      
      if (ex.plan_id && updatedExercise.plan_id && ex.plan_id === updatedExercise.plan_id) {
        return updatedExercise;
      } else if (!ex.plan_id && !updatedExercise.plan_id && 
                 ex.exercise_id === updatedExercise.exercise_id && 
                 ex.exercise_name === updatedExercise.exercise_name) {
        // For added exercises without plan_id, match by exercise_id and name
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

    const completedCount = session.exercises.filter(e => e.completed).length;
    
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
      if (exists) {
        return prev.filter(e => e.id !== exercise.id);
      }
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
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    
    updateSessionMutation.mutate({
      id: session.id,
      data: { exercises: updatedExercises }
    });

    setSelectedExercises([]);
    setSheetOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
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

          {/* Progress bar */}
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

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {session?.exercises?.map((exerciseData, index) => (
          <motion.div
            key={`${exerciseData.plan_id || exerciseData.exercise_id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <SessionExerciseCard
              exerciseData={exerciseData}
              planData={getPlanForExercise(exerciseData)}
              exerciseInfo={getExerciseInfo(exerciseData.exercise_id)}
              onUpdate={handleExerciseUpdate}
            />
          </motion.div>
        ))}

        {/* Add more exercises button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add more exercises
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] bg-zinc-950 border-zinc-800">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-white">Add Exercises</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-shrink-0 pb-4">
                <ExerciseFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedTypes={selectedTypes}
                  setSelectedTypes={setSelectedTypes}
                  selectedMuscles={selectedMuscles}
                  setSelectedMuscles={setSelectedMuscles}
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pb-24">
                {filteredExercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    selected={selectedExercises.some(e => e.id === exercise.id)}
                    onSelect={handleSelectExercise}
                  />
                ))}
              </div>
              {selectedExercises.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800">
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black h-12"
                    onClick={handleAddExercises}
                  >
                    Add {selectedExercises.length} Exercise{selectedExercises.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Calorie Estimate */}
        <CalorieEstimate 
          session={session}
          exercises={exercises}
          userMetrics={userMetrics}
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent pt-8">
        <Button 
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-lg"
          onClick={() => setShowFinishDialog(true)}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Finish Workout
        </Button>
      </div>

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Finish Workout?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              You've completed {completedCount} of {totalCount} exercises.
              {completedCount < totalCount && " Are you sure you want to finish?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Continue Workout
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinishWorkout}
              className="bg-emerald-500 text-black hover:bg-emerald-600"
            >
              Finish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}