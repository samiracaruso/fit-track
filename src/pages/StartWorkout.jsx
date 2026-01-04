import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, CheckCircle2, Circle, Edit3, Plus, X, Trash2, Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ExerciseLibrary from '../components/ExerciseLibrary';
import { offlineStorage } from '../components/OfflineStorage';

export default function StartWorkout() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const selectedDate = dateParam ? new Date(dateParam) : new Date();
  const day = format(selectedDate, 'EEEE').toLowerCase();
  
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    initializeWorkout();
    
    // Setup offline storage
    offlineStorage.init();
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing changes...');
      syncOfflineChanges();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.info('Offline mode - changes will sync when online');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [day]);

  const initializeWorkout = async () => {
    try {
      const currentUser = await base44.auth.me();
      const workoutDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Check if there's already an in-progress session for this date
      const existingSessions = await base44.entities.WorkoutSession.filter({
        created_by: currentUser.email,
        date: workoutDate,
        status: 'in_progress'
      });
      
      if (existingSessions.length > 0) {
        // Resume existing session
        const existingSession = existingSessions[0];
        setSession(existingSession);
        setExercises(existingSession.exercises || []);
        setLoading(false);
        return;
      }
      
      // Create new session from plans
      const plans = await base44.entities.WorkoutPlan.filter({ 
        day_of_week: day,
        created_by: currentUser.email 
      });
      const sortedPlans = plans.sort((a, b) => a.order - b.order);
      setWorkoutPlans(sortedPlans);
      
      // Get all exercises (from cache if offline)
      let allExercises;
      try {
        allExercises = await base44.entities.Exercise.list();
        // Cache for offline use
        await offlineStorage.cacheExercises(allExercises);
      } catch (error) {
        // Fallback to cached exercises if offline
        allExercises = await offlineStorage.getCachedExercises();
        if (allExercises.length === 0) {
          toast.error('No cached exercises available offline');
        }
      }
      
      // Create exercise map
      const exerciseMap = new Map();
      allExercises.forEach(ex => exerciseMap.set(ex.id, ex));
      
      // Map plans to exercises with images from library
      const exercisesWithData = sortedPlans.map(plan => {
        const exerciseData = exerciseMap.get(plan.exercise_id);
        return {
          plan_id: plan.id,
          exercise_id: plan.exercise_id,
          exercise_name: exerciseData?.name || plan.exercise_name,
          exercise_image_url: exerciseData?.image_url || '',
          completed: false,
          skipped: false,
          sets: plan.sets?.map(s => ({ ...s, completed: false })) || [],
          notes: ''
        };
      });
      
      const newSession = await base44.entities.WorkoutSession.create({
        date: workoutDate,
        day_of_week: day,
        status: 'in_progress',
        start_time: new Date().toISOString(),
        exercises: exercisesWithData
      });
      
      setSession(newSession);
      setExercises(exercisesWithData);
    } catch (error) {
      console.error('Error initializing workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateExercise = async (index, updates) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = { ...updatedExercises[index], ...updates };
    setExercises(updatedExercises);
    
    // Save locally first
    const updatedSession = { ...session, exercises: updatedExercises };
    await offlineStorage.saveWorkoutLocally(updatedSession);
    
    // Try to sync to server if online
    if (isOnline) {
      try {
        await base44.entities.WorkoutSession.update(session.id, {
          exercises: updatedExercises
        });
      } catch (error) {
        console.error('Failed to sync update:', error);
        await offlineStorage.addToSyncQueue('updateSession', {
          sessionId: session.id,
          exercises: updatedExercises
        });
        toast.error('Saved offline - will sync when online');
      }
    } else {
      await offlineStorage.addToSyncQueue('updateSession', {
        sessionId: session.id,
        exercises: updatedExercises
      });
    }
  };

  const toggleComplete = (index) => {
    const exercise = exercises[index];
    updateExercise(index, { completed: !exercise.completed, skipped: false });
  };

  const toggleSkip = (index) => {
    const exercise = exercises[index];
    updateExercise(index, { skipped: !exercise.skipped, completed: false });
  };

  const saveExerciseEdit = (index, data) => {
    updateExercise(index, data);
    setEditingExercise(null);
  };

  const handleAddExercise = async (selectedExercises) => {
    const exerciseArray = Array.isArray(selectedExercises) ? selectedExercises : [selectedExercises];

    const newExercises = exerciseArray.map(exercise => ({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      exercise_image_url: exercise.image_url,
      completed: false,
      skipped: false,
      sets: [{ reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0, completed: false }],
      notes: ''
    }));

    const updatedExercises = [...exercises, ...newExercises];
    setExercises(updatedExercises);

    // Save locally first
    const updatedSession = { ...session, exercises: updatedExercises };
    await offlineStorage.saveWorkoutLocally(updatedSession);

    // Try to sync if online
    if (isOnline) {
      try {
        await base44.entities.WorkoutSession.update(session.id, {
          exercises: updatedExercises
        });
      } catch (error) {
        await offlineStorage.addToSyncQueue('updateSession', {
          sessionId: session.id,
          exercises: updatedExercises
        });
      }
    } else {
      await offlineStorage.addToSyncQueue('updateSession', {
        sessionId: session.id,
        exercises: updatedExercises
      });
    }

    setShowLibrary(false);
  };

  const removeExercise = async (index) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
    
    // Save locally
    const updatedSession = { ...session, exercises: updatedExercises };
    await offlineStorage.saveWorkoutLocally(updatedSession);
    
    if (isOnline) {
      try {
        await base44.entities.WorkoutSession.update(session.id, {
          exercises: updatedExercises
        });
      } catch (error) {
        await offlineStorage.addToSyncQueue('updateSession', {
          sessionId: session.id,
          exercises: updatedExercises
        });
      }
    } else {
      await offlineStorage.addToSyncQueue('updateSession', {
        sessionId: session.id,
        exercises: updatedExercises
      });
    }
  };

  const syncOfflineChanges = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      const pendingItems = await offlineStorage.getPendingSyncItems();
      
      for (const item of pendingItems) {
        try {
          if (item.action === 'updateSession') {
            await base44.entities.WorkoutSession.update(
              item.data.sessionId,
              { exercises: item.data.exercises }
            );
          } else if (item.action === 'completeSession') {
            await base44.entities.WorkoutSession.update(
              item.data.sessionId,
              {
                status: 'completed',
                end_time: item.data.end_time,
                total_calories_burned: item.data.total_calories_burned,
                exercises: item.data.exercises
              }
            );
          }
          
          await offlineStorage.removeFromSyncQueue(item.queueId);
        } catch (error) {
          console.error('Failed to sync item:', error);
        }
      }
      
      if (pendingItems.length > 0) {
        toast.success(`Synced ${pendingItems.length} change(s)`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const completeWorkout = async () => {
    let totalCalories = 0;
    
    // Calculate calories from cached or online data
    try {
      const exercisesData = isOnline 
        ? await base44.entities.Exercise.list()
        : await offlineStorage.getCachedExercises();
      
      const exerciseMap = new Map(exercisesData.map(ex => [ex.id, ex]));
      
      for (const ex of exercises) {
        if (ex.completed && ex.sets) {
          const exerciseData = exerciseMap.get(ex.exercise_id);
          if (exerciseData) {
            const caloriesPerMin = exerciseData.calories_per_minute || 5;
            const completedSets = ex.sets.filter(s => s.completed).length;
            const duration = ex.sets.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || (completedSets * 2);
            totalCalories += caloriesPerMin * duration;
          }
        }
      }
    } catch (error) {
      console.error('Error calculating calories:', error);
    }
    
    const completionData = {
      status: 'completed',
      end_time: new Date().toISOString(),
      total_calories_burned: totalCalories,
      exercises: exercises
    };
    
    // Save locally
    await offlineStorage.saveWorkoutLocally({ ...session, ...completionData });
    
    // Try to sync if online
    if (isOnline) {
      try {
        await base44.entities.WorkoutSession.update(session.id, completionData);
        toast.success('Workout completed!');
      } catch (error) {
        await offlineStorage.addToSyncQueue('completeSession', {
          sessionId: session.id,
          ...completionData
        });
        toast.success('Workout saved offline - will sync when online');
      }
    } else {
      await offlineStorage.addToSyncQueue('completeSession', {
        sessionId: session.id,
        ...completionData
      });
      toast.success('Workout saved offline - will sync when online');
    }
    
    navigate(createPageUrl('Home'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00d4ff]"></div>
      </div>
    );
  }

  const completedCount = exercises.filter(e => e.completed).length;
  const skippedCount = exercises.filter(e => e.skipped).length;
  const totalCount = exercises.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#a0a0a0]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full">
                <WifiOff className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-orange-500">Offline</span>
              </div>
            )}
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white capitalize mb-2">{day} Workout</h1>
        <p className="text-[#a0a0a0] text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        
        {/* Progress */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#a0a0a0] text-sm">Progress</span>
            <span className="text-white font-bold">{completedCount}/{totalCount}</span>
          </div>
          <div className="w-full h-2 bg-[#242424] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          {skippedCount > 0 && (
            <p className="text-[#a0a0a0] text-xs mt-2">{skippedCount} skipped</p>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-6 mt-6 space-y-3">
        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            index={index}
            onToggleComplete={() => toggleComplete(index)}
            onToggleSkip={() => toggleSkip(index)}
            onEdit={() => setEditingExercise({ index, data: exercise })}
            onRemove={() => removeExercise(index)}
          />
        ))}
        
        {/* Add Exercise Button */}
        <button
          onClick={() => setShowLibrary(true)}
          className="w-full bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 flex items-center justify-center gap-3 text-[#a0a0a0] font-medium active:scale-98 transition-transform"
        >
          <Plus className="w-6 h-6" />
          Add Exercise
        </button>
      </div>

      {/* Complete Button */}
      <div className="px-6 mt-8">
        <button
          onClick={completeWorkout}
          disabled={completedCount === 0}
          className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] text-white py-4 rounded-xl font-bold text-lg glow active:scale-98 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Workout
        </button>
      </div>

      {/* Exercise Library Modal */}
      {showLibrary && (
        <ExerciseLibrary
          onSelect={handleAddExercise}
          onClose={() => setShowLibrary(false)}
        />
      )}

      {/* Edit Modal */}
      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise.data}
          onSave={(data) => saveExerciseEdit(editingExercise.index, data)}
          onClose={() => setEditingExercise(null)}
        />
      )}
    </div>
  );
}

function ExerciseCard({ exercise, index, onToggleComplete, onToggleSkip, onEdit, onRemove }) {
  return (
    <div
      className={`bg-[#1a1a1a] border rounded-2xl p-4 transition-all ${
        exercise.completed
          ? 'border-[#10b981] bg-[#10b981]/5'
          : exercise.skipped
          ? 'border-[#f59e0b] bg-[#f59e0b]/5 opacity-50'
          : 'border-[#2a2a2a]'
      }`}
    >
      <div className="flex items-start gap-3">
        {exercise.exercise_image_url ? (
          <img
            src={exercise.exercise_image_url}
            alt={exercise.exercise_name}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] font-bold text-xl flex-shrink-0">
            {index + 1}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <button onClick={onToggleComplete} className="mt-1">
              {exercise.completed ? (
                <CheckCircle2 className="w-6 h-6 text-[#10b981]" />
              ) : (
                <Circle className="w-6 h-6 text-[#a0a0a0]" />
              )}
            </button>
            <h3 className={`font-bold text-lg flex-1 ${exercise.completed ? 'text-[#10b981]' : 'text-white'}`}>
              {exercise.exercise_name}
            </h3>
          </div>
          
          {/* Sets Display */}
          {exercise.sets?.length > 0 && (
            <div className="space-y-1 mb-3">
              {exercise.sets.map((set, idx) => (
                <div key={idx} className="text-[#a0a0a0] text-sm">
                  Set {idx + 1}: {set.reps > 0 && `${set.reps} reps`}
                  {set.weight_kg > 0 && ` × ${set.weight_kg}kg`}
                  {set.duration_minutes > 0 && ` ${set.duration_minutes} min`}
                  {set.distance_km > 0 && ` ${set.distance_km} km`}
                  {set.completed && <span className="text-[#10b981] ml-2">✓</span>}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#242424] rounded-lg text-[#00d4ff] text-sm active:scale-95 transition-transform"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onToggleSkip}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                exercise.skipped
                  ? 'bg-[#f59e0b] text-white'
                  : 'bg-[#242424] text-[#a0a0a0]'
              }`}
            >
              {exercise.skipped ? 'Skipped' : 'Skip'}
            </button>
            <button
              onClick={onRemove}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg text-red-400 text-sm active:scale-95 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseEditModal({ exercise, onSave, onClose }) {
  const [sets, setSets] = useState(exercise.sets?.length > 0 ? exercise.sets : [{ reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0, completed: false }]);
  const [notes, setNotes] = useState(exercise.notes || '');
  const [exerciseData, setExerciseData] = useState(null);

  React.useEffect(() => {
    const loadExercise = async () => {
      try {
        const exercises = await base44.entities.Exercise.filter({ id: exercise.exercise_id });
        if (exercises[0]) {
          setExerciseData(exercises[0]);
        }
      } catch (error) {
        console.error('Error loading exercise:', error);
      }
    };
    loadExercise();
  }, [exercise.exercise_id]);

  const addSet = () => {
    setSets([...sets, { reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0, completed: false }]);
  };

  const removeSet = (index) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (index, field, value) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: field === 'completed' ? value : (parseFloat(value) || 0) };
    setSets(newSets);
  };

  const handleSave = () => {
    onSave({ sets, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-[#1a1a1a] w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{exercise.exercise_name}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Sets */}
          {sets.map((set, index) => (
            <div key={index} className="bg-[#242424] border border-[#2a2a2a] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">Set {index + 1}</span>
                  <button
                    onClick={() => updateSet(index, 'completed', !set.completed)}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      set.completed ? 'bg-[#10b981] text-white' : 'bg-[#1a1a1a] text-[#a0a0a0]'
                    }`}
                  >
                    {set.completed ? 'Completed' : 'Mark Complete'}
                  </button>
                </div>
                {sets.length > 1 && (
                  <button
                    onClick={() => removeSet(index)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {exerciseData?.has_reps && (
                  <div>
                    <label className="text-[#a0a0a0] text-xs block mb-1">Reps</label>
                    <input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(index, 'reps', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
                {exerciseData?.has_weight && (
                  <div>
                    <label className="text-[#a0a0a0] text-xs block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={set.weight_kg || ''}
                      onChange={(e) => updateSet(index, 'weight_kg', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
                {exerciseData?.has_time && (
                  <div>
                    <label className="text-[#a0a0a0] text-xs block mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={set.duration_minutes || ''}
                      onChange={(e) => updateSet(index, 'duration_minutes', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
                {exerciseData?.has_distance && (
                  <div>
                    <label className="text-[#a0a0a0] text-xs block mb-1">Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={set.distance_km || ''}
                      onChange={(e) => updateSet(index, 'distance_km', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
                {exerciseData?.has_floors && (
                  <div>
                    <label className="text-[#a0a0a0] text-xs block mb-1">Floors</label>
                    <input
                      type="number"
                      value={set.floors || ''}
                      onChange={(e) => updateSet(index, 'floors', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
                {exerciseData?.has_steps && (
                  <div>
                    <label className="text-[#a0a0a0] text-xs block mb-1">Steps</label>
                    <input
                      type="number"
                      value={set.steps || ''}
                      onChange={(e) => updateSet(index, 'steps', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addSet}
            className="w-full bg-[#242424] border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 flex items-center justify-center gap-2 text-[#a0a0a0]"
          >
            <Plus className="w-5 h-5" />
            Add Set
          </button>

          <div>
            <label className="text-[#a0a0a0] text-sm block mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#242424] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white h-20"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#2a2a2a] px-6 py-4">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] text-white py-4 rounded-xl font-bold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}