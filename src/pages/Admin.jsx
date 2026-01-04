import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Settings, ChevronRight } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-zinc-400 active:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Settings className="w-8 h-8 text-cyan-500" />
          </div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-zinc-400">Manage global exercise data and library</p>
      </div>

      {/* Admin Options */}
      <div className="px-6 mt-6 space-y-3">
        <button
          onClick={() => navigate('/AdminExercises')}
          className="w-full bg-[#161616] border border-zinc-800/50 rounded-2xl p-5 flex items-center justify-between active:scale-95 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center group-active:bg-cyan-500 group-active:text-black transition-colors">
              <Dumbbell className="w-7 h-7 text-cyan-500 group-active:text-black" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-lg">Exercise Library</h3>
              <p className="text-zinc-500 text-sm">Add, edit, or remove global exercises</p>
            </div>
          </div>
          <ChevronRight className="text-zinc-600" />
        </button>

        {/* Placeholder for future admin stats/management */}
        <div className="mt-8 p-4 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl text-center">
          <p className="text-zinc-600 text-xs uppercase font-black tracking-widest">System Info</p>
          <p className="text-zinc-500 text-sm mt-2">v1.0.4 - Local Cache Active</p>
        </div>
      </div>
    </div>
  );
}