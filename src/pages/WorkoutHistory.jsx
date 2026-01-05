import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Activity, MoreVertical, Edit2, Trash2, Loader2, Trophy } from 'lucide-react';
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
      
      // 1. Load from Dexie first (Instant UI)
      const localSessions = await localDB.history
        .orderBy('date')
        .reverse()
        .toArray();
      setSessions(localSessions);

      // 2. Refresh from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const { data: remoteSessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (remoteSessions && !error) {
        setSessions(remoteSessions);
        // Sync Dexie to match Supabase
        await localDB.history.clear();
        await localDB.history.bulkAdd(remoteSessions);
      }
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
    const { data } = await supabase.from('exercises').select('*').eq('id', exerciseId).single();
    if (data) setViewingExercise(data);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Delete this workout permanently?')) return;
    try {
      await localDB.history.delete(sessionId);
      await supabase.from('workout_sessions').delete().eq('id', sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl px-6 pt-8 pb-6 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-zinc-500">
          <ArrowLeft size={20} /> 
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Activity <span className="text-cyan-500">Log</span></h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{sessions.length} Sessions Completed</p>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-800">
             <Activity className="mx-auto mb-4 text-zinc-800" size={48} />
             <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">No history found</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isExpanded = expandedSessions[session.id];
            const completedExercises = session.exercises || [];
            
            return (
              <div key={session.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden transition-all">
                <div className="p-5 flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => toggleExpanded(session.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black uppercase italic tracking-tighter">{session.day_of_week}</h3>
                      {isExpanded ? <ChevronUp size={16} className="text-cyan-500"/> : <ChevronDown size={16} className="text-zinc-600"/>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                      <Calendar size={12} />
                      {format(new Date(session.date), 'MMM d, yyyy')}
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800">
                        <span className="text-cyan-500 font-black mr-1">{completedExercises.length}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Exercises</span>
                      </div>
                      {session.total_volume && (
                         <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800">
                            <span className="text-emerald-500 font-black mr-1">{session.total_volume}</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">kg</span>
                         </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3 border-t border-zinc-800/50 pt-4">
                    {completedExercises.map((ex, idx) => (
                      <div key={idx} className="bg-black/30 rounded-2xl p-4 border border-zinc-800">
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-black uppercase italic text-sm text-zinc-300">{ex.name || ex.exercise_name}</h4>
                           <Trophy size={14} className="text-amber-500/50" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <div className="text-center">
                              <p className="text-[10px] text-zinc-600 font-black uppercase">Sets</p>
                              <p className="text-sm font-bold">{ex.sets?.length || 0}</p>
                           </div>
                           <div className="text-center">
                              <p className="text-[10px] text-zinc-600 font-black uppercase">Best</p>
                              <p className="text-sm font-bold">{Math.max(...(ex.sets?.map(s => s.weight_kg) || [0]))}kg</p>
                           </div>
                           <div className="text-center">
                              <p className="text-[10px] text-zinc-600 font-black uppercase">Status</p>
                              <p className="text-[10px] font-black text-emerald-500 uppercase">Done</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {viewingExercise && (
        <ExerciseDetailModal
          exercise={viewingExercise}
          onClose={() => setViewingExercise(null)}
        />
      )}
    </div>
  );
}