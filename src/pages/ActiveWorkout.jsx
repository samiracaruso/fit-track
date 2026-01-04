import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, Clock, Flame, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // 1. LOAD FROM LOCAL STORAGE (Immediate Offline Access)
      const localHistory = JSON.parse(localStorage.getItem('workout_history') || '[]');
      const localActive = localStorage.getItem('active_workout_session');
      
      let initialSessions = [...localHistory];
      if (localActive) {
        initialSessions.unshift(JSON.parse(localActive));
      }
      setSessions(initialSessions);

      // 2. FETCH FROM SUPABASE (To sync/update history)
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20);

      if (data && !error) {
        setSessions(data);
        // Update history cache with fresh data from cloud
        const completedOnly = data.filter(s => s.status === 'completed');
        localStorage.setItem('workout_history', JSON.stringify(completedOnly));
      }
    } catch (error) {
      console.log('Running in offline mode.');
    } finally {
      setLoading(false);
    }
  };

  const startNewWorkout = () => {
    const today = format(new Date(), 'EEEE').toLowerCase();
    // We navigate to ActiveSession (the tracker we just fixed)
    navigate(`/ActiveSession?day=${today}`);
  };

  const continueWorkout = (session) => {
    navigate(`/ActiveSession?day=${session.day_of_week}`);
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (status === 'in_progress') return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10';
    return 'text-zinc-500 border-zinc-800 bg-zinc-900';
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
      </div>
    );
  }

  const inProgressSessions = sessions.filter(s => s.status === 'in_progress');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-zinc-400">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-3xl font-bold mb-2">Workout Sessions</h1>
        <p className="text-zinc-400">Track and manage your progress</p>
      </div>

      {/* Start Workout Button */}
      <div className="px-6 mt-6">
        <button
          onClick={startNewWorkout}
          className="w-full bg-cyan-500 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-cyan-500/10 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4 text-black text-left">
            <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
              <Play className="fill-current" />
            </div>
            <div>
              <p className="font-black text-xl leading-tight">START WORKOUT</p>
              <p className="text-black/60 text-xs font-bold uppercase tracking-wider">Begin Training Now</p>
            </div>
          </div>
        </button>
      </div>

      {/* Continue In Progress */}
      {inProgressSessions.map(session => (
        <div key={session.id} className="px-6 mt-8">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">In Progress</h2>
          <button
            onClick={() => continueWorkout(session)}
            className="w-full bg-[#111] border border-cyan-500/50 rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-bold capitalize">{session.day_of_week} Session</p>
              <p className="text-sm text-zinc-500">{session.exercises?.filter(e => e.completed).length || 0} exercises done</p>
            </div>
            <div className="text-cyan-500 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/30">RESUME</div>
          </button>
        </div>
      ))}

      {/* History */}
      <div className="px-6 mt-10">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Recent History</h2>
        <div className="space-y-3">
          {completedSessions.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed border-zinc-900 rounded-2xl">
                <Calendar className="mx-auto text-zinc-800 mb-2" />
                <p className="text-zinc-600 text-sm">No history yet</p>
             </div>
          ) : completedSessions.map(session => (
            <div key={session.id} className="bg-[#161616] border border-zinc-800/50 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold capitalize">{session.day_of_week}</h3>
                  <p className="text-xs text-zinc-500">{format(new Date(session.date), 'EEE, MMM do')}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/20 p-2 rounded-xl text-center">
                  <p className="text-cyan-500 font-bold">{session.exercises?.filter(e => e.completed).length || 0}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Exercises</p>
                </div>
                <div className="bg-black/20 p-2 rounded-xl text-center">
                  <p className="text-orange-500 font-bold">{Math.round(session.total_calories_burned || 0)}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Kcal</p>
                </div>
                <div className="bg-black/20 p-2 rounded-xl text-center">
                  <p className="text-zinc-300 font-bold">
                    {session.end_time ? Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000) : '--'}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase">Mins</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}