import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { localDB } from '@/api/localDB'; // Dexie sync
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval } from 'date-fns';

export default function Calendar() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [completedDays, setCompletedDays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load workout history from Dexie to mark completed days
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await localDB.getHistory();
        // Extract just the date strings (YYYY-MM-DD) for easy comparison
        const dates = history.map(entry => format(new Date(entry.date), 'yyyy-MM-dd'));
        setCompletedDays(dates);
      } catch (error) {
        console.error("Error loading calendar history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-6 pt-8 pb-4 bg-black">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-zinc-500">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-1">Training Log</span>
          <h2 className="text-xl font-black uppercase italic tracking-tighter">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>
    );
  };

  const renderDays = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
      <div className="grid grid-cols-7 mb-2 px-4">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-zinc-700 uppercase">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1 px-4">
        {calendarDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCompleted = completedDays.includes(dateStr);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={i}
              className={`aspect-square relative flex items-center justify-center rounded-xl transition-all ${
                !isCurrentMonth ? 'opacity-10' : 'opacity-100'
              } ${isCompleted ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-zinc-900/30'}`}
            >
              <span className={`text-sm font-bold ${isToday ? 'text-cyan-500' : isCompleted ? 'text-white' : 'text-zinc-600'}`}>
                {format(day, 'd')}
              </span>
              
              {isCompleted && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      {renderHeader()}
      
      <div className="mt-4">
        <div className="flex justify-center gap-8 mb-8">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-zinc-900 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-zinc-900 rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>

        {renderDays()}
        {renderCells()}
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-12 px-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500">
              <CalendarIcon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total Sessions</p>
              <p className="text-2xl font-black italic">{completedDays.length}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Consistency</p>
             <p className="text-sm font-bold text-white">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}