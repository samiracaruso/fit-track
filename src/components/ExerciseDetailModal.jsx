import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, TrendingUp, Calendar, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExerciseDetailModal({ exercise, onClose }) {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, [exercise.id]);

  const loadUserStats = async () => {
    try {
      const sessions = await base44.entities.WorkoutSession.list('-created_date', 100);
      
      const exerciseHistory = [];
      sessions.forEach(session => {
        const exerciseData = session.exercises?.find(e => e.exercise_id === exercise.id);
        if (exerciseData && exerciseData.completed) {
          exerciseHistory.push({
            date: session.date,
            ...exerciseData
          });
        }
      });

      if (exerciseHistory.length > 0) {
        const totalSets = exerciseHistory.reduce((sum, h) => sum + (h.sets?.length || 0), 0);
        const totalReps = exerciseHistory.reduce((sum, h) => {
          return sum + h.sets?.reduce((s, set) => s + (set.reps || 0), 0);
        }, 0);
        const maxWeight = Math.max(...exerciseHistory.flatMap(h => 
          h.sets?.map(s => s.weight_kg || 0) || [0]
        ));
        const maxDistance = Math.max(...exerciseHistory.flatMap(h => 
          h.sets?.map(s => s.distance_km || 0) || [0]
        ));
        const totalDistance = exerciseHistory.reduce((sum, h) => {
          return sum + h.sets?.reduce((s, set) => s + (set.distance_km || 0), 0);
        }, 0);
        const totalDuration = exerciseHistory.reduce((sum, h) => {
          return sum + h.sets?.reduce((s, set) => s + (set.duration_minutes || 0), 0);
        }, 0);

        // Chart data for weight progression
        const weightChartData = exerciseHistory.slice(0, 10).reverse().map(h => ({
          date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: Math.max(...(h.sets?.map(s => s.weight_kg || 0) || [0]))
        })).filter(d => d.weight > 0);

        // Chart data for reps progression
        const repsChartData = exerciseHistory.slice(0, 10).reverse().map(h => ({
          date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          reps: h.sets?.reduce((sum, s) => sum + (s.reps || 0), 0) || 0
        })).filter(d => d.reps > 0);

        // Chart data for distance progression
        const distanceChartData = exerciseHistory.slice(0, 10).reverse().map(h => ({
          date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          distance: h.sets?.reduce((sum, s) => sum + (s.distance_km || 0), 0) || 0
        })).filter(d => d.distance > 0);

        // Chart data for duration progression
        const durationChartData = exerciseHistory.slice(0, 10).reverse().map(h => ({
          date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          duration: h.sets?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
        })).filter(d => d.duration > 0);

        setUserStats({
          timesPerformed: exerciseHistory.length,
          totalSets,
          totalReps,
          maxWeight,
          maxDistance,
          totalDistance,
          totalDuration,
          recentSessions: exerciseHistory.slice(0, 5),
          weightChartData,
          repsChartData,
          distanceChartData,
          durationChartData
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMuscleColor = (muscle) => {
    const colors = {
      chest: 'bg-red-500/20 text-red-400 border-red-500/30',
      back: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      shoulders: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      biceps: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      triceps: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      core: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      quads: 'bg-green-500/20 text-green-400 border-green-500/30',
      hamstrings: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      glutes: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      calves: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return colors[muscle] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end">
      <div className="bg-[#0a0a0a] w-full h-[95vh] rounded-t-3xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video */}
          {exercise.video_url && (
            <div className="rounded-2xl overflow-hidden bg-[#1a1a1a]">
              <video
                src={exercise.video_url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {/* Exercise Info */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="mb-3">
              <span className="text-[#a0a0a0] text-sm">Type</span>
              <p className="text-white font-bold capitalize">{exercise.type}</p>
            </div>
            
            {exercise.equipment && (
              <div className="mb-3">
                <span className="text-[#a0a0a0] text-sm">Equipment</span>
                <p className="text-white font-bold">{exercise.equipment}</p>
              </div>
            )}

            <div>
              <span className="text-[#a0a0a0] text-sm block mb-2">Muscle Groups</span>
              <div className="flex flex-wrap gap-2">
                {exercise.muscle_groups?.map(mg => (
                  <Badge
                    key={mg}
                    className={`px-3 py-1 border ${getMuscleColor(mg)}`}
                  >
                    {mg}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          {exercise.description && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
              <h3 className="text-white font-bold mb-2">How to Perform</h3>
              <p className="text-[#a0a0a0] leading-relaxed">{exercise.description}</p>
            </div>
          )}

          {/* User Stats */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#00d4ff]"></div>
            </div>
          ) : userStats ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Your Stats</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                  <TrendingUp className="w-6 h-6 text-[#00d4ff] mb-2" />
                  <p className="text-2xl font-bold text-white">{userStats.timesPerformed}</p>
                  <p className="text-[#a0a0a0] text-sm">Times Performed</p>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                  <TrendingUp className="w-6 h-6 text-[#7c3aed] mb-2" />
                  <p className="text-2xl font-bold text-white">{userStats.totalSets}</p>
                  <p className="text-[#a0a0a0] text-sm">Total Sets</p>
                </div>

                {userStats.totalReps > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-2xl font-bold text-white">{userStats.totalReps}</p>
                    <p className="text-[#a0a0a0] text-sm">Total Reps</p>
                  </div>
                )}

                {userStats.maxWeight > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <Award className="w-6 h-6 text-[#f59e0b] mb-2" />
                    <p className="text-2xl font-bold text-white">{userStats.maxWeight}kg</p>
                    <p className="text-[#a0a0a0] text-sm">Heaviest Weight</p>
                  </div>
                )}

                {userStats.maxDistance > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <Award className="w-6 h-6 text-[#10b981] mb-2" />
                    <p className="text-2xl font-bold text-white">{userStats.maxDistance.toFixed(1)}km</p>
                    <p className="text-[#a0a0a0] text-sm">Longest Distance</p>
                  </div>
                )}

                {userStats.totalDistance > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-2xl font-bold text-white">{userStats.totalDistance.toFixed(1)}km</p>
                    <p className="text-[#a0a0a0] text-sm">Total Distance</p>
                  </div>
                )}

                {userStats.totalDuration > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-2xl font-bold text-white">{Math.round(userStats.totalDuration)}min</p>
                    <p className="text-[#a0a0a0] text-sm">Total Duration</p>
                  </div>
                )}
              </div>

              {/* Charts */}
              {userStats.weightChartData?.length > 1 && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-4">Weight Progression</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={userStats.weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="date" stroke="#a0a0a0" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#a0a0a0" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {userStats.repsChartData?.length > 1 && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-4">Reps Progression</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userStats.repsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="date" stroke="#a0a0a0" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#a0a0a0" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="reps" fill="#00d4ff" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {userStats.distanceChartData?.length > 1 && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-4">Distance Progression</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={userStats.distanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="date" stroke="#a0a0a0" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#a0a0a0" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="distance" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {userStats.durationChartData?.length > 1 && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-4">Duration Progression</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userStats.durationChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="date" stroke="#a0a0a0" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#a0a0a0" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="duration" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent Sessions */}
              {userStats.recentSessions.length > 0 && (
                <div>
                  <h4 className="text-white font-bold mb-3">Recent Sessions</h4>
                  <div className="space-y-2">
                    {userStats.recentSessions.map((session, idx) => (
                      <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{new Date(session.date).toLocaleDateString()}</span>
                          <span className="text-[#a0a0a0] text-sm">{session.sets?.length || 0} sets</span>
                        </div>
                        <div className="space-y-1">
                          {session.sets?.map((set, sidx) => (
                            <div key={sidx} className="text-[#a0a0a0] text-sm">
                              Set {sidx + 1}: {set.reps > 0 && `${set.reps} reps`}
                              {set.weight_kg > 0 && ` × ${set.weight_kg}kg`}
                              {set.duration_minutes > 0 && ` ${set.duration_minutes} min`}
                              {set.distance_km > 0 && ` ${set.distance_km} km`}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 text-center">
              <Calendar className="w-12 h-12 text-[#a0a0a0] mx-auto mb-3" />
              <p className="text-white font-bold mb-1">No History Yet</p>
              <p className="text-[#a0a0a0] text-sm">Start using this exercise to see your stats</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}