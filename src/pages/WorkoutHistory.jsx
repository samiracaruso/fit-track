import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient'; // Swapped to Supabase
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Activity, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ExerciseDetailModal from '../components/ExerciseDetailModal';

export default function WorkoutHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [viewingExercise, setViewingExercise] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // 2. Fetch completed sessions from Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('date', { ascending: false });

      if (sessionError) throw sessionError;
      
      // 3. Get exercise library to fetch the latest images
      const { data: allExercises, error: exError } = await supabase
        .from('exercises')
        .select('id, image_url');

      if (exError) throw exError;

      const exerciseMap = new Map();
      allExercises.forEach(ex => exerciseMap.set(ex.id, ex));
      
      // 4. Update session exercises with fresh images from the library
      const sessionsWithImages = sessionData.map(session => ({
        ...session,
        exercises: (session.exercises || []).map(ex => ({
          ...ex,
          exercise_image_url: exerciseMap.get(ex.exercise_id)?.image_url || ex.exercise_image_url || ''
        }))
      }));
      
      setSessions(sessionsWithImages);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const handleExerciseClick = async (exerciseId) => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();
      
      if (data) {
        setViewingExercise(data);
      }
    } catch (error) {
      console.error('Error loading exercise detail:', error);
    }
  };

  const handleEditSession = (session) => {
    navigate(createPageUrl(`EditWorkout?sessionId=${session.id}`));
  };

  const handleDeleteSession = async (sessionId) => {
    if (confirm('Delete this workout from your history? This cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('workout_sessions')
          .delete()
          .eq('id', sessionId);
        
        if (error) throw error;
        loadSessions(); // Refresh list
      } catch (error) {
        alert('Could not delete workout. Please try again.');
        console.error('Error deleting session:', error);
      }
    }
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
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-[#a0a0a0]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <h1 className="text-3xl font-bold text-white mb-2">Workout History</h1>
        <p className="text-[#a0a0a0]">{sessions.length} completed workouts</p>
      </div>

      {/* Sessions List */}
      <div className="px-6 mt-6 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-10 h-10 text-[#a0a0a0]" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">No workouts yet</h3>
            <p className="text-[#a0a0a0]">Complete your first workout to see it here</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isExpanded = expandedSessions[session.id];
            const completedExercises = session.exercises?.filter(e => e.completed) || [];
            
            return (
              <div
                key={session.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden"
              >
                {/* Session Header */}
                <div className="p-4 flex items-start gap-3">
                  <button
                    onClick={() => toggleExpanded(session.id)}
                    className="flex-1 flex items-start active:opacity-70 transition-opacity text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg capitalize">{session.day_of_week}</h3>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#a0a0a0]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#a0a0a0]" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[#a0a0a0] text-sm mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(session.date), 'EEEE, MMM d, yyyy')}</span>
                      </div>
                      
                      <div className="flex gap-4">
                        <div>
                          <span className="text-white font-bold">{completedExercises.length}</span>
                          <span className="text-[#a0a0a0] text-sm ml-1">exercises</span>
                        </div>
                        {session.total_calories_burned > 0 && (
                          <div>
                            <span className="text-[#00d4ff] font-bold">{Math.round(session.total_calories_burned)}</span>
                            <span className="text-[#a0a0a0] text-sm ml-1">kcal</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === session.id ? null : session.id);
                      }}
                      className="w-8 h-8 rounded-lg bg-[#242424] flex items-center justify-center text-[#a0a0a0] hover:text-white active:scale-95 transition-all"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {menuOpen === session.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="fixed right-6 mt-2 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-20 overflow-hidden">
                          <button
                            onClick={() => {
                              handleEditSession(session);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#242424] transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Workout
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteSession(session.id);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-[#242424] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Workout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Exercise List */}
                {isExpanded && completedExercises.length > 0 && (
                  <div className="border-t border-[#2a2a2a] px-4 py-3 space-y-3">
                    {completedExercises.map((exercise, idx) => {
                      const allSets = exercise.sets || [];
                      const totalSets = allSets.length;
                      const totalReps = allSets.reduce((sum, s) => sum + (s.reps || 0), 0);
                      const maxWeight = Math.max(...allSets.map(s => s.weight_kg || 0), 0);
                      
                      return (
                        <div key={idx} className="bg-[#242424] rounded-xl p-3">
                          <div className="flex gap-3">
                            {exercise.exercise_image_url ? (
                              <img
                                src={exercise.exercise_image_url}
                                alt={exercise.exercise_name}
                                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[#a0a0a0] font-bold flex-shrink-0">
                                {exercise.exercise_name[0]}
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <button
                                onClick={() => handleExerciseClick(exercise.exercise_id)}
                                className="text-left w-full mb-2"
                              >
                                <h4 className="text-white font-bold hover:text-[#00d4ff] transition-colors">
                                  {exercise.exercise_name}
                                </h4>
                              </button>

                              <div className="flex flex-wrap gap-2 mb-2">
                                {totalSets > 0 && (
                                  <span className="px-2 py-1 bg-[#1a1a1a] rounded-lg text-xs text-[#00d4ff]">
                                    {totalSets} set{totalSets !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {totalReps > 0 && (
                                  <span className="px-2 py-1 bg-[#1a1a1a] rounded-lg text-xs text-[#00d4ff]">
                                    {totalReps} reps
                                  </span>
                                )}
                                {maxWeight > 0 && (
                                  <span className="px-2 py-1 bg-[#1a1a1a] rounded-lg text-xs text-[#00d4ff]">
                                    {maxWeight}kg max
                                  </span>
                                )}
                              </div>

                              {allSets.length > 0 && (
                                <div className="space-y-1">
                                  {allSets.map((set, setIdx) => (
                                    <div key={setIdx} className="text-[#a0a0a0] text-sm">
                                      Set {setIdx + 1}:
                                      {set.reps > 0 && ` ${set.reps} reps`}
                                      {set.weight_kg > 0 && ` × ${set.weight_kg}kg`}
                                      {set.duration_minutes > 0 && ` ${set.duration_minutes} min`}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Exercise Detail Modal */}
      {viewingExercise && (
        <ExerciseDetailModal
          exercise={viewingExercise}
          onClose={() => setViewingExercise(null)}
        />
      )}
    </div>
  );
}