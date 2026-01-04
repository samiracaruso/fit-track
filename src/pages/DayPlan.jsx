import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, GripVertical, Play } from 'lucide-react';
import ExerciseLibrary from '../components/ExerciseLibrary';
import ExerciseSetsEditor from '../components/ExerciseSetsEditor';

export default function DayPlan() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const day = urlParams.get('day') || 'monday';
  
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    loadDayPlans();
  }, [day]);

  const loadDayPlans = async () => {
    try {
      const currentUser = await base44.auth.me();
      const plans = await base44.entities.WorkoutPlan.filter({ 
        day_of_week: day,
        created_by: currentUser.email 
      });
      setWorkoutPlans(plans.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExercise = async (exercises) => {
      const exerciseArray = Array.isArray(exercises) ? exercises : [exercises];
      const maxOrder = workoutPlans.length > 0 ? Math.max(...workoutPlans.map(p => p.order || 0)) : 0;

      for (let i = 0; i < exerciseArray.length; i++) {
        const exercise = exerciseArray[i];
        
        // Ensure we have the full exercise data with image_url
        const fullExercise = await base44.entities.Exercise.filter({ id: exercise.id });
        const exerciseData = fullExercise[0] || exercise;
        
        await base44.entities.WorkoutPlan.create({
          day_of_week: day,
          exercise_id: exerciseData.id,
          exercise_name: exerciseData.name,
          exercise_image_url: exerciseData.image_url,
          order: maxOrder + i + 1,
          sets: [{ reps: 0, weight_kg: 0, duration_minutes: 0, distance_km: 0 }]
        });
      }

      setShowLibrary(false);
      loadDayPlans();
    };

  const handleDeletePlan = async (planId) => {
    if (confirm('Remove this exercise from your plan?')) {
      try {
        await base44.entities.WorkoutPlan.delete(planId);
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
      loadDayPlans();
    }
  };

  const handleUpdatePlan = async (planId, data) => {
    try {
      await base44.entities.WorkoutPlan.update(planId, data);
    } catch (error) {
      console.error('Error updating plan:', error);
    }
    setEditingPlan(null);
    loadDayPlans();
  };

  const renderSetSummary = (sets) => {
    if (!sets || sets.length === 0) return <span className="text-[#a0a0a0]">No sets configured</span>;
    
    return sets.map((set, idx) => (
      <div key={idx} className="text-[#a0a0a0] text-sm">
        Set {idx + 1}: {set.reps > 0 && `${set.reps} reps`}
        {set.weight_kg > 0 && ` × ${set.weight_kg}kg`}
        {set.duration_minutes > 0 && ` ${set.duration_minutes} min`}
        {set.distance_km > 0 && ` ${set.distance_km} km`}
      </div>
    ));
  };

  const startWorkout = () => {
    navigate(`/StartWorkout?day=${day}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00d4ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-[#a0a0a0]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white capitalize mb-2">{day}</h1>
            <p className="text-[#a0a0a0]">{workoutPlans.length} exercise{workoutPlans.length !== 1 ? 's' : ''} planned</p>
          </div>
          
          {workoutPlans.length > 0 && (
            <button
              onClick={startWorkout}
              className="w-14 h-14 bg-gradient-to-br from-[#00d4ff] to-[#0099cc] rounded-full flex items-center justify-center glow-strong active:scale-95 transition-transform"
            >
              <Play className="w-7 h-7 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-6 mt-6">
        {workoutPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-[#a0a0a0]" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">No exercises yet</h3>
            <p className="text-[#a0a0a0] mb-6">Add exercises to build your workout plan</p>
            <button
              onClick={() => setShowLibrary(true)}
              className="bg-gradient-to-r from-[#00d4ff] to-[#0099cc] text-white px-8 py-3 rounded-full font-medium glow active:scale-95 transition-transform"
            >
              Add Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workoutPlans.map((plan, index) => (
              <div
                key={plan.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  {plan.exercise_image_url ? (
                    <img
                      src={plan.exercise_image_url}
                      alt={plan.exercise_name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] font-bold text-xl flex-shrink-0">
                      {index + 1}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2">{plan.exercise_name}</h3>
                    
                    <div className="space-y-1 mb-3">
                      {renderSetSummary(plan.sets)}
                    </div>
                    
                    {plan.notes && (
                      <p className="text-[#a0a0a0] text-sm mb-3">{plan.notes}</p>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPlan(plan)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#242424] rounded-lg text-[#00d4ff] text-sm font-medium active:scale-95 transition-transform"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#242424] rounded-lg text-red-400 text-sm font-medium active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {workoutPlans.length > 0 && (
          <button
            onClick={() => setShowLibrary(true)}
            className="w-full mt-4 bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 flex items-center justify-center gap-3 text-[#a0a0a0] font-medium active:scale-98 transition-transform"
          >
            <Plus className="w-6 h-6" />
            Add Another Exercise
          </button>
        )}
      </div>

      {/* Exercise Library Modal */}
      {showLibrary && (
        <ExerciseLibrary
          onSelect={handleSelectExercise}
          onClose={() => setShowLibrary(false)}
        />
      )}

      {/* Edit Exercise Modal */}
      {editingPlan && (
        <ExerciseSetsEditor
          plan={editingPlan}
          onSave={handleUpdatePlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}