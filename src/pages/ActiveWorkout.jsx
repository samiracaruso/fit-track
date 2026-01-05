import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; // Import our service
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, Clock, Flame, ArrowLeft, Loader2 } from 'lucide-react';
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
      
      // 1. LOAD FROM DEXIE (Instant Access)
      const localHistory = await localDB.getHistory();
      const localActive = await localDB.getActiveSession();
      
      let initialSessions = [...localHistory];
      if (localActive) {
        // Ensure the active session shows at the very top
        initialSessions.unshift(localActive);
      }
      setSessions(initialSessions);

      // 2. FETCH FROM SUPABASE (To sync history)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(20);

        if (data && !error) {
          setSessions(data);
          // Sync fresh history to Dexie for future offline use
          for (const session of data) {
            if (session.status === 'completed') {
              await localDB.saveSession(session);
            }
          }
        }
      }
    } catch (error) {
      console.log('Running in offline mode: Using local history.');
    } finally {
      setLoading(false);
    }
  };

  const startNewWorkout = () => {
    const today = format(new Date(), 'EEEE').toLowerCase();
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
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] gap-4">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Loading History...</p>
      </div>
    );
  }

  // Filter sessions based on current state
  const inProgressSessions = sessions.filter(s => s.status === 'in_progress');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-zinc-500 font-bold uppercase text-xs tracking-widest active:text-cyan-500">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Sessions</h1>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Track your performance</p>
      </div>

      {/* Start Workout Button */}
      <div className="px-6 mt-6">
        <button
          onClick={startNewWorkout}
          className="w-full bg-cyan-500 rounded-[2rem] p-6 flex items-center justify-between shadow-xl shadow-cyan-500/10 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4 text-black text-left">
            <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
              <Play className="fill-current" />
            </div>
            <div>
              <p className="font-black text-2xl leading-none italic uppercase">Start Workout</p>
              <p className="text-black/60 text-[10px] font-bold uppercase tracking-widest">Begin Training Now</p>
            </div>
          </div>
        </button>
      </div>

      {/* Continue In Progress */}
      {inProgressSessions.map(session => (
        <div key={session.id || 'active'} className="px-6 mt-10">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Draft in Progress</h2>
          <button
            onClick={() => continueWorkout(session)}
            className="w-full bg-zinc-900 border border-cyan-500/50 rounded-[2rem] p-6 flex items-center justify-between group active:bg-zinc-800 transition-colors"
          >
            <div className="text-left">
              <p className="font-black text-lg uppercase italic text-cyan-500 leading-tight">{session.day_of_week} Session</p>
              <p className="text-xs text-zinc-500 font-bold uppercase">{session.exercises?.filter(e => e.completed).length || 0} exercises logged</p>
            </div>
            <div className="text-cyan-500 text-[10px] font-black uppercase px-4 py-2 rounded-xl border border-cyan-500/30 group-active:bg-cyan-500 group-active:text-black transition-all">
              RESUME
            </div>
          </button>
        </div>
      ))}

      {/* History */}
      <div className="px-6 mt-12">
        <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Recent History</h2>
        <div className="space-y-4">
          {completedSessions.length === 0 ? (
             <div className="text-center py-16 border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
                <Calendar className="mx-auto text-zinc-800 mb-4" size={40} />
                <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">No history synced yet</p>
             </div>
          ) : completedSessions.map(session => (
            <div key={session.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-[2rem] p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">{session.day_of_week}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {format(new Date(session.date), 'EEE, MMM do')}
                  </p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border tracking-tighter ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/40 p-3 rounded-2xl text-center">
                  <p className="text-cyan-500 font-black text-lg">{session.exercises?.filter(e => e.completed).length || 0}</p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase">Exers</p>
                </div>
                <div className="bg-black/40 p-3 rounded-2xl text-center">
                  <p className="text-orange-500 font-black text-lg">{Math.round(session.total_calories_burned || 0)}</p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase">Kcal</p>
                </div>
                <div className="bg-black/40 p-3 rounded-2xl text-center">
                  <p className="text-zinc-300 font-black text-lg">
                    {session.end_time ? Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000) : '--'}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase">Mins</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}