import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { localDB, db } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Plus, Trash2, Dumbbell, X, 
  Search, Info, Star 
} from "lucide-react";
import { toast } from 'sonner';

export default function DayPlan() {
  const { day } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [exercises, setExercises] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Initial Load
  useEffect(() => {
    if (!day) {
      navigate('/WeeklyPlan');
      return;
    }

    async function init() {
      try {
        const plan = await localDB.getPlanByDay(day);
        const allEx = await localDB.getAllExercises();
        setExercises(plan);
        setCatalog(allEx);
      } catch (err) {
        console.error("Failed to load DayPlan:", err);
        toast.error("Error loading workout data");
      }
    }
    init();
  }, [day, navigate]);

  // Logic: Add Exercise to Local DB and Sync Queue
  const addExerciseToPlan = async (baseEx) => {
    const newEntry = {
      day_of_week: day.toLowerCase(),
      exercise_id: baseEx.id,
      exercise_name: baseEx.name,
      image_url: baseEx.image_url,
      muscle_group: baseEx.muscle_group,
      target_sets: 3,
      target_reps: 10,
      target_weight_kg: 0
    };

    try {
      const id = await db.plans.add(newEntry);
      // Push to sync queue for Base 44
      await localDB.addToQueue('plans', 'INSERT', { ...newEntry, id });
      
      setExercises([...exercises, { ...newEntry, id }]);
      setIsAdding(false);
      setSearchQuery("");
      toast.success(`Added ${baseEx.name} to ${day}`);
    } catch (err) {
      toast.error("Failed to save exercise");
    }
  };

  // Logic: Remove Exercise
  const removeExercise = async (id) => {
    try {
      await db.plans.delete(id);
      await localDB.addToQueue('plans', 'DELETE', { id });
      setExercises(exercises.filter(ex => ex.id !== id));
      toast.info("Exercise removed");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Filter Catalog based on Search
  const filteredCatalog = catalog.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscle_group?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/WeeklyPlan')}
            className="text-zinc-500 hover:text-white"
          >
            <ChevronLeft />
          </Button>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">
            {day} <span className="text-cyan-500">Plan</span>
          </h1>
        </div>
      </header>

      {/* Current Exercises in Plan */}
      <div className="px-6 py-8 space-y-4">
        {exercises.length > 0 ? (
          exercises.map((ex) => (
            <div 
              key={ex.id} 
              className="group bg-zinc-900/40 border border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-white/10">
                  <Dumbbell size={20} className="text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-black uppercase italic text-sm">{ex.exercise_name}</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    {ex.target_sets} Sets • {ex.target_reps} Reps
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeExercise(ex.id)}
                className="text-zinc-800 hover:text-red-500 hover:bg-red-500/10 rounded-full"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-zinc-900 rounded-[3rem]">
            <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">No movements assigned</p>
          </div>
        )}

        {/* Add Trigger */}
        <Button 
          onClick={() => setIsAdding(true)} 
          className="w-full py-10 bg-zinc-900/20 border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-900/40 rounded-[2.5rem] transition-all group"
        >
          <Plus className="mr-2 text-zinc-600 group-hover:text-cyan-500" /> 
          <span className="font-black uppercase italic text-xs text-zinc-500 group-hover:text-white">Add Movement</span>
        </Button>
      </div>

      {/* FULL UI MOVEMENT LIBRARY OVERLAY */}
      {isAdding && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Overlay Header */}
          <div className="p-6 border-b border-white/5 bg-zinc-950">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase italic text-cyan-500">Movement Library</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="rounded-full bg-zinc-900">
                <X size={20} />
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text"
                placeholder="Search 300+ exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredCatalog.length > 0 ? (
              filteredCatalog.map(ex => (
                <div 
                  key={ex.id} 
                  onClick={() => addExerciseToPlan(ex)}
                  className="group bg-zinc-900/40 border border-white/5 p-4 rounded-[2rem] flex items-center gap-4 active:scale-95 transition-all hover:border-cyan-500/50 hover:bg-zinc-800/50"
                >
                  {/* Premium Preview */}
                  <div className="w-16 h-16 bg-black rounded-2xl overflow-hidden border border-white/10 shrink-0 relative">
                    {ex.image_url ? (
                      <img src={ex.image_url} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Dumbbell className="text-zinc-800" /></div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black uppercase italic text-sm group-hover:text-cyan-400 transition-colors leading-none">{ex.name}</h3>
                      {ex.is_favorite && <Star size={10} className="fill-cyan-500 text-cyan-500" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 italic">
                      {ex.muscle_group || 'General'}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="text-zinc-700 hover:text-cyan-500 rounded-full h-8 w-8">
                      <Info size={16} />
                    </Button>
                    <div className="bg-cyan-500/10 text-cyan-500 p-2 rounded-full group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                      <Plus size={16} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-zinc-700 text-xs font-black uppercase italic tracking-widest">No movements match "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}