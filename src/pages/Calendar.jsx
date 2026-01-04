import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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
      const currentUser = await base44.auth.me();
      const data = await base44.entities.WorkoutSession.filter(
        { created_by: currentUser.email },
        '-created_date',
        500
      );
      setSessions(data.filter(s => s.status === 'completed'));
    } catch (error) {
      console.error('Error loading sessions:', error);
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

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    navigate(createPageUrl(`StartWorkout?date=${dateStr}`));
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

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
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 mt-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-[#a0a0a0] text-xs font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, idx) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, today);
            const hasWorkout = hasSession(date);
            
            return (
              <button
                key={idx}
                onClick={() => handleDateClick(date)}
                disabled={!isCurrentMonth}
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all ${
                  !isCurrentMonth
                    ? 'border-transparent opacity-30'
                    : isToday
                    ? 'border-[#00d4ff] bg-[#00d4ff]/10 glow'
                    : hasWorkout
                    ? 'border-[#10b981] bg-[#10b981]/10'
                    : 'border-[#2a2a2a] bg-transparent active:scale-95'
                }`}
              >
                <span className={`text-sm font-bold ${
                  isToday ? 'text-[#00d4ff]' : isCurrentMonth ? 'text-white' : 'text-[#a0a0a0]'
                }`}>
                  {format(date, 'd')}
                </span>
                {hasWorkout && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00d4ff]" />
            <span className="text-[#a0a0a0]">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-[#a0a0a0]">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}