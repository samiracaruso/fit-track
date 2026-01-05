import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { localDB, db } from '@/api/localDB'; // Import Dexie instance
import { ArrowLeft, Dumbbell, Settings, ChevronRight, Database, RefreshCw } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ exercises: 0, plans: 0, history: 0 });

  // Quick check of local database health
  useEffect(() => {
    const getLocalStats = async () => {
      const exCount = await db.exercises.count();
      const planCount = await db.plans.count();
      const historyCount = await db.history.count();
      setStats({ exercises: exCount, plans: planCount, history: historyCount });
    };
    getLocalStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest active:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Settings className="w-8 h-8 text-cyan-500" />
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Admin <span className="text-cyan-500">Panel</span></h1>
        </div>
        <p className="text-zinc-500 font-medium text-sm">System management & exercise library</p>
      </div>

      {/* Admin Options */}
      <div className="px-6 mt-6 space-y-4">
        <button
          onClick={() => navigate('/AdminExercises')}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6 flex items-center justify-between active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center group-active:bg-cyan-500 group-active:text-black transition-colors">
              <Dumbbell className="w-7 h-7 text-cyan-500 group-active:text-black" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-black uppercase italic text-lg leading-tight">Exercise Library</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight">Manage global movements</p>
            </div>
          </div>
          <ChevronRight className="text-zinc-700 group-hover:text-cyan-500 transition-colors" />
        </button>

        {/* Database Health Card */}
        <div className="mt-8 p-8 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Database size={14} className="text-cyan-500" />
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Local Cache Status</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xl font-black italic text-white">{stats.exercises}</p>
              <p className="text-[9px] font-bold text-zinc-600 uppercase">Library</p>
            </div>
            <div className="text-center border-x border-zinc-800/50">
              <p className="text-xl font-black italic text-white">{stats.plans}</p>
              <p className="text-[9px] font-bold text-zinc-600 uppercase">Plans</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black italic text-white">{stats.history}</p>
              <p className="text-[9px] font-bold text-zinc-600 uppercase">History</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Dexie Engine Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}