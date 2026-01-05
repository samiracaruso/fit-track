import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, ChevronRight } from "lucide-react";

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function WeeklyPlan() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="text-zinc-500"
          >
            <ChevronLeft />
          </Button>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">
            Weekly <span className="text-cyan-500">Plan</span>
          </h1>
        </div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
          Select a day to modify your routine
        </p>
      </header>

      {/* Days List */}
      <div className="px-6 py-8 space-y-3">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => navigate(`/DayPlan/${day.toLowerCase()}`)}
            className="w-full group bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between hover:bg-zinc-800 transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-cyan-500/50 transition-colors">
                <Calendar size={20} className="text-zinc-500 group-hover:text-cyan-500" />
              </div>
              <span className="text-lg font-black italic uppercase tracking-tight">
                {day}
              </span>
            </div>
            <ChevronRight size={20} className="text-zinc-800 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="px-10 text-center">
        <p className="text-zinc-700 text-[10px] font-bold uppercase leading-relaxed">
          Changes are saved locally and synced to Base 44 automatically.
        </p>
      </div>
    </div>
  );
}