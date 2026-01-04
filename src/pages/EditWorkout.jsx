import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Save, CheckCircle2, Circle, Edit3, Plus, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ExerciseLibrary from '../components/ExerciseLibrary';

export default function EditWorkout() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('id');
  
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const currentUser = await base44.auth.me();
      const sessions = await base44.entities.WorkoutSession.filter({ 
        id: sessionId,
        created_by: currentUser.email 
      });
      if (sessions[0]) {
        setSession(sessions[0]);
        setExercises(sessions[0].exercises || []);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateExercise = (index, updates) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = { ...updatedExercises[index], ...updates };
    setExercises(updatedExercises);
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

  const handleAddExercise = (exercises) => {
      const exerciseArray = Array.isArray(exercises) ? exercises : [exercises];

      const newExercises = exerciseArray.map(exercise => ({
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        completed: false,
        skipped: false,
        sets: [{ reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0, completed: false }],
        notes: ''
      }));

      setExercises([...exercises, ...newExercises]);
      setShowLibrary(false);
    };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let totalCalories = 0;
      for (const ex of exercises) {
        if (ex.completed && ex.sets) {
          const exerciseData = await base44.entities.Exercise.filter({ id: ex.exercise_id });
          if (exerciseData[0]) {
            const caloriesPerMin = exerciseData[0].calories_per_minute || 5;
            const completedSets = ex.sets.filter(s => s.completed).length;
            const duration = ex.sets.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || (completedSets * 2);
            totalCalories += caloriesPerMin * duration;
          }
        }
      }
      
      await base44.entities.WorkoutSession.update(sessionId, {
        exercises,
        total_calories_burned: totalCalories
      });
      
      navigate(createPageUrl('WorkoutHistory'));
    } catch (error) {
      console.error('Error saving workout:', error);
    } finally {
      setSaving(false);
    }
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
        <button
          onClick={() => navigate(createPageUrl('WorkoutHistory'))}
          className="mb-4 flex items-center gap-2 text-[#a0a0a0]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <h1 className="text-3xl font-bold text-white capitalize mb-2">
          Edit Workout
        </h1>
        <p className="text-[#a0a0a0]">
          {session?.day_of_week} • {format(new Date(session?.date), 'MMM d, yyyy')}
        </p>
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
        
        <button
          onClick={() => setShowLibrary(true)}
          className="w-full bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 flex items-center justify-center gap-3 text-[#a0a0a0] font-medium active:scale-98 transition-transform"
        >
          <Plus className="w-6 h-6" />
          Add Exercise
        </button>
      </div>

      {/* Save Button */}
      <div className="px-6 mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 glow active:scale-98 transition-transform disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
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
        <button onClick={onToggleComplete} className="mt-1">
          {exercise.completed ? (
            <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
          ) : (
            <Circle className="w-8 h-8 text-[#a0a0a0]" />
          )}
        </button>
        
        <div className="flex-1">
          <h3 className={`font-bold text-lg mb-2 ${exercise.completed ? 'text-[#10b981]' : 'text-white'}`}>
            {exercise.exercise_name}
          </h3>
          
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
                <div>
                  <label className="text-[#a0a0a0] text-xs block mb-1">Reps</label>
                  <input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(index, 'reps', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white"
                  />
                </div>
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
                <div>
                  <label className="text-[#a0a0a0] text-xs block mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={set.duration_minutes || ''}
                    onChange={(e) => updateSet(index, 'duration_minutes', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white"
                  />
                </div>
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