import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Play, Calendar, Clock, Flame } from 'lucide-react';
import { format, startOfWeek, isToday } from 'date-fns';

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await base44.entities.WorkoutSession.list('-created_date', 20);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewWorkout = () => {
    const today = format(new Date(), 'EEEE').toLowerCase();
    navigate(createPageUrl(`StartWorkout?day=${today}`));
  };

  const continueWorkout = (session) => {
    navigate(createPageUrl(`StartWorkout?sessionId=${session.id}`));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-[#10b981] border-[#10b981]';
      case 'in_progress':
        return 'text-[#00d4ff] border-[#00d4ff]';
      case 'cancelled':
        return 'text-[#a0a0a0] border-[#a0a0a0]';
      default:
        return 'text-[#a0a0a0] border-[#a0a0a0]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00d4ff]"></div>
      </div>
    );
  }

  const inProgressSessions = sessions.filter(s => s.status === 'in_progress');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Workout Sessions</h1>
        <p className="text-[#a0a0a0]">Track and manage your workouts</p>
      </div>

      {/* Start Workout Button */}
      <div className="px-6 mt-6">
        <button
          onClick={startNewWorkout}
          className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] rounded-2xl p-6 flex items-center justify-between glow-strong active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-xl">Start New Workout</p>
              <p className="text-white/70 text-sm">Begin today's training session</p>
            </div>
          </div>
        </button>
      </div>

      {/* In Progress Sessions */}
      {inProgressSessions.length > 0 && (
        <div className="px-6 mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Continue Workout</h2>
          <div className="space-y-3">
            {inProgressSessions.map(session => (
              <button
                key={session.id}
                onClick={() => continueWorkout(session)}
                className="w-full bg-[#1a1a1a] border-2 border-[#00d4ff] rounded-2xl p-4 active:scale-98 transition-transform"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold capitalize">{session.day_of_week}</h3>
                  <span className="px-3 py-1 bg-[#00d4ff]/10 border border-[#00d4ff] rounded-full text-[#00d4ff] text-sm">
                    In Progress
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#a0a0a0]">
                  <span>{session.exercises?.length || 0} exercises</span>
                  <span>•</span>
                  <span>{session.exercises?.filter(e => e.completed).length || 0} completed</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Workout History */}
      <div className="px-6 mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Recent History</h2>
        
        {completedSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-[#a0a0a0]" />
            </div>
            <p className="text-[#a0a0a0]">No workout history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedSessions.map(session => (
              <div
                key={session.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold capitalize mb-1">{session.day_of_week}</h3>
                    <p className="text-[#a0a0a0] text-sm">{format(new Date(session.date), 'MMMM d, yyyy')}</p>
                  </div>
                  <span className={`px-3 py-1 border rounded-full text-sm capitalize ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[#2a2a2a]">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-[#00d4ff]" />
                    </div>
                    <p className="text-white font-bold">
                      {session.exercises?.filter(e => e.completed).length || 0}
                    </p>
                    <p className="text-[#a0a0a0] text-xs">Completed</p>
                  </div>
                  
                  {session.total_calories_burned > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Flame className="w-4 h-4 text-[#f59e0b]" />
                      </div>
                      <p className="text-white font-bold">
                        {Math.round(session.total_calories_burned)}
                      </p>
                      <p className="text-[#a0a0a0] text-xs">Calories</p>
                    </div>
                  )}
                  
                  {session.end_time && session.start_time && (
                    <div className="text-center">
                      <p className="text-white font-bold">
                        {Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000)}
                      </p>
                      <p className="text-[#a0a0a0] text-xs">Minutes</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}