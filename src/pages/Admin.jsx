import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Dumbbell, Settings } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="mb-4 flex items-center gap-2 text-[#a0a0a0]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-[#00d4ff]" />
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-[#a0a0a0]">Manage your workout data</p>
      </div>

      {/* Admin Options */}
      <div className="px-6 mt-6 space-y-3">
        <button
          onClick={() => navigate(createPageUrl('AdminExercises'))}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 flex items-center justify-between active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#00d4ff]/10 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-[#00d4ff]" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-lg">Exercise Library</h3>
              <p className="text-[#a0a0a0] text-sm">Add, edit, or remove exercises</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}