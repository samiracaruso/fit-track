import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';

export default function Calendar() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      // 1. Instant Load from Local Storage
      const cachedSessions = localStorage.getItem('workout_history');
      if (cachedSessions) {
        setSessions(JSON.parse(cachedSessions));
        setLoading(false); // Stop spinner early if we have data
      }

      // 2. Background Sync with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('date, status')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (error) throw error;

      if (data) {
        setSessions(data);
        localStorage.setItem('workout_history', JSON.stringify(data));
      }
    } catch (error) {
      console.log('Using offline calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const hasSession = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.some(s => s.date === dateStr);
  };

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'EEEE').toLowerCase();
    // Navigate to the specific day's plan
    navigate(`/DayPlan?day=${dayName}&date=${dateStr}`);
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="min-h-screen bg-black pb-12 text-white">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl px-6 pt-8 pb-6 sticky top-0 z-10 border-b border-zinc-800">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Activity</h1>
          <div className="flex items-center gap-1 bg-black p-1 rounded-full border border-zinc-800">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-zinc-800 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest min-w-[100px] text-center">
              {format(currentMonth, 'MMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-zinc-800 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-4 mt-8">
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-4">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-black text-zinc-600 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, today);
            const isCompleted = hasSession(date);
            
            return (
              <button
                key={idx}
                onClick={() => handleDateClick(date)}
                disabled={!isCurrentMonth}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-90 ${
                  !isCurrentMonth ? 'opacity-0 pointer-events-none' : ''
                } ${
                  isToday 
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                  : isCompleted 
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-500' 
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}
              >
                <span className="text-sm font-black">
                  {format(date, 'd')}
                </span>
                {isCompleted && !isToday && (
                  <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Stats Summary Card */}
        <div className="mt-10 p-6 bg-zinc-900 rounded-3xl border border-zinc-800">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Monthly Intensity</h3>
              <span className="text-cyan-500 font-black italic">{sessions.filter(s => isSameMonth(new Date(s.date), currentMonth)).length} Sessions</span>
           </div>
           <div className="h-2 w-full bg-black rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000" 
                style={{ width: `${Math.min((sessions.length / 20) * 100, 100)}%` }}
              />
           </div>
           <p className="text-[10px] text-zinc-600 mt-2 uppercase font-bold text-center">Goal: 20 sessions / month</p>
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-2 shadow-2xl">
          <Loader2 className="animate-spin text-cyan-500" size={16} />
          <span className="text-[10px] font-black uppercase">Syncing...</span>
        </div>
      )}
    </div>
  );
}