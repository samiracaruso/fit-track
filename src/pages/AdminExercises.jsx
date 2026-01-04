import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminExercises() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      // This asks Supabase for everything in the 'exercises' table, ordered by name
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this exercise? This cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('exercises')
          .delete()
          .eq('id', id);

        if (error) throw error;
        loadExercises();
      } catch (error) {
        console.error('Error deleting exercise:', error);
        alert('Failed to delete exercise.');
      }
    }
  };

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onClick={() => navigate(createPageUrl('Admin'))}
          className="mb-4 flex items-center gap-2 text-[#a0a0a0]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Exercise Library</h1>
            <p className="text-[#a0a0a0]">{exercises.length} exercises</p>
          </div>
          
          <button
            onClick={() => navigate(createPageUrl('AdminExerciseEdit'))}
            className="w-14 h-14 bg-gradient-to-br from-[#00d4ff] to-[#0099cc] rounded-full flex items-center justify-center glow-strong active:scale-95 transition-transform"
          >
            <Plus className="w-7 h-7 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0a0]" />
          <Input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 pr-4 py-3 text-white"
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-6 mt-6 space-y-3">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              {exercise.image_url ? (
                <img 
                  src={exercise.image_url} 
                  alt={exercise.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#242424] flex items-center justify-center">
                  <span className="text-2xl text-[#a0a0a0]">{exercise.name[0]}</span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">{exercise.name}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {exercise.muscle_groups?.map((muscle) => (
                    <span key={muscle} className="px-2 py-1 bg-[#00d4ff]/10 text-[#00d4ff] text-xs rounded-lg">
                      {muscle}
                    </span>
                  ))}
                </div>
                <p className="text-[#a0a0a0] text-sm">{exercise.equipment || 'No equipment'}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(createPageUrl(`AdminExerciseEdit?id=${exercise.id}`))}
                  className="w-10 h-10 bg-[#242424] rounded-lg flex items-center justify-center text-[#00d4ff] active:scale-95 transition-transform"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(exercise.id)}
                  className="w-10 h-10 bg-[#242424] rounded-lg flex items-center justify-center text-red-400 active:scale-95 transition-transform"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}