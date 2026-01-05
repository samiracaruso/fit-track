import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { localDB, db } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Plus, Trash2, Dumbbell, X, 
  Search, Info, Heart, Star 
} from "lucide-react";
import { toast } from 'sonner';

export default function DayPlan() {
  const { day } = useParams();
  const navigate = useNavigate();
  
  const [exercises, setExercises] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced Filtering State
  const [activeMuscle, setActiveMuscle] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);
  
  // Selection & Detail State
  const [selectedEx, setSelectedEx] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [config, setConfig] = useState({ reps: 10, sets: 3, weight: 0, time: 0, distance: 0, floors: 0, steps: 0 });

  // Match these exactly to your Supabase string values
  const MUSCLE_GROUPS = ['All', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body'];
  const EXERCISE_TYPES = ['All', 'machine', 'cardio', 'bodyweight', 'weights'];

  useEffect(() => {
    async function init() {
      const plan = await localDB.getPlanByDay(day);
      const allEx = await localDB.getAllExercises();
      // Alphabetical Sort
      setCatalog(allEx.sort((a, b) => a.name.localeCompare(b.name)));
      setExercises(plan);
    }
    init();
  }, [day]);

  // FIXED FILTER LOGIC: Handles string matching for muscle_groups
  const filteredCatalog = catalog.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeType === 'All' || ex.type === activeType;
    const matchesFav = !showOnlyFavs || ex.is_favorite;
    
    // Safety check for muscle_groups string
    const muscleValue = ex.muscle_groups || ex.muscle_group || '';
    const matchesMuscle = activeMuscle === 'All' || muscleValue.toLowerCase() === activeMuscle.toLowerCase();
    
    return matchesSearch && matchesType && matchesFav && matchesMuscle;
  });

  const toggleFavorite = async (e, ex) => {
    e.stopPropagation(); // Don't trigger the "Add" modal
    const newFavStatus = !ex.is_favorite;
    await db.exercises.update(ex.id, { is_favorite: newFavStatus });
    setCatalog(catalog.map(item => item.id === ex.id ? { ...item, is_favorite: newFavStatus } : item));
    toast.success(newFavStatus ? "Added to Favorites" : "Removed from Favorites");
  };

  const confirmAdd = async () => {
    const newEntry = {
      day_of_week: day.toLowerCase(),
      exercise_id: selectedEx.id,
      exercise_name: selectedEx.name,
      image_url: selectedEx.image_url,
      ...config,
      has_reps: selectedEx.has_reps,
      has_weight: selectedEx.has_weight,
      has_time: selectedEx.has_time,
      has_distance: selectedEx.has_distance,
      has_floors: selectedEx.has_floors,
      has_steps: selectedEx.has_steps
    };

    const id = await db.plans.add(newEntry);
    await localDB.addToQueue('plans', 'INSERT', { ...newEntry, id });
    setExercises([...exercises, { ...newEntry, id }]);
    setSelectedEx(null);
    setIsAdding(false);
    toast.success(`Added ${selectedEx.name}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-black/80 backdrop-blur-md z-30 flex items-center gap-4 border-b border-white/5">
        <Button variant="ghost" size="icon" onClick={() => navigate('/WeeklyPlan')}><ChevronLeft /></Button>
        <h1 className="text-2xl font-black uppercase italic">{day} <span className="text-cyan-500">Plan</span></h1>
      </header>

      {/* Planned Exercises */}
      <div className="px-6 py-6 space-y-3">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-zinc-900/50 border border-white/5 p-5 rounded-[2.5rem] flex justify-between items-center">
             <div className="flex items-center gap-4">
                <img src={ex.image_url} className="w-12 h-12 rounded-2xl object-cover bg-black border border-white/10" />
                <div>
                  <h3 className="font-black uppercase italic text-sm">{ex.exercise_name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {ex.has_reps && `${ex.sets}×${ex.reps}`} {ex.has_weight && `• ${ex.weight}kg`}
                  </p>
                </div>
             </div>
             <Button variant="ghost" onClick={() => { db.plans.delete(ex.id); setExercises(exercises.filter(e => e.id !== ex.id)); }} className="text-zinc-800 hover:text-red-500"><Trash2 size={18}/></Button>
          </div>
        ))}
        <Button onClick={() => setIsAdding(true)} className="w-full py-10 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[2.5rem] font-black uppercase italic text-zinc-500 hover:text-cyan-500 transition-all">
          <Plus className="mr-2" /> Add Movement
        </Button>
      </div>

      {/* MOVEMENT LIBRARY OVERLAY */}
      {isAdding && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-6 bg-zinc-950 border-b border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase italic text-cyan-500">Movement Library</h2>
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-full bg-zinc-900"><X /></Button>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input className="w-full bg-zinc-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold border border-white/5 focus:border-cyan-500/50 outline-none" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowOnlyFavs(!showOnlyFavs)} 
                  className={`rounded-full uppercase text-[9px] font-black transition-colors ${showOnlyFavs ? 'bg-cyan-500 text-black border-cyan-500' : 'border-white/10 text-white'}`}
                >
                  <Heart size={12} className={showOnlyFavs ? 'fill-black' : ''} /> <span className="ml-1">Favorites</span>
                </Button>
                {EXERCISE_TYPES.map(type => (
                  <button key={type} onClick={() => setActiveType(type)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border whitespace-nowrap transition-all ${activeType === type ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>{type}</button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {MUSCLE_GROUPS.map(m => (
                  <button key={m} onClick={() => setActiveMuscle(m)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border whitespace-nowrap transition-all ${activeMuscle === m ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>{m}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredCatalog.map(ex => (
              <div key={ex.id} className="bg-zinc-900/40 p-4 rounded-[2rem] flex items-center gap-4 border border-white/5 relative">
                <img src={ex.image_url} className="w-16 h-16 rounded-2xl object-cover bg-black" />
                <div className="flex-1">
                  <h4 className="font-black uppercase italic text-sm">{ex.name}</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase">{ex.type} • {ex.muscle_groups}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* RESTORED FAVORITE BUTTON ON TILE */}
                  <Button variant="ghost" size="icon" onClick={(e) => toggleFavorite(e, ex)} className="h-10 w-10 rounded-full bg-zinc-800/30">
                    <Heart size={18} className={ex.is_favorite ? "fill-cyan-500 text-cyan-500" : "text-zinc-600"} />
                  </Button>
                  
                  {/* RESTORED INFO BUTTON */}
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewingDetails(ex); }} className="h-10 w-10 rounded-full bg-zinc-800/30 text-zinc-400">
                    <Info size={18} />
                  </Button>

                  <Button variant="ghost" onClick={() => setSelectedEx(ex)} className="bg-cyan-500 text-black rounded-full h-10 w-10 p-0 shadow-lg shadow-cyan-500/20">
                    <Plus size={20} strokeWidth={3} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INFO OVERLAY (Details) */}
      {viewingDetails && (
        <div className="fixed inset-0 bg-black/95 z-[100] p-8 flex flex-col items-center justify-center">
          <img src={viewingDetails.image_url} className="w-full max-w-sm aspect-square rounded-[3rem] object-cover mb-8 border border-white/10" />
          <h2 className="text-3xl font-black uppercase italic mb-2">{viewingDetails.name}</h2>
          <p className="text-cyan-500 font-bold uppercase tracking-[0.3em] mb-6">{viewingDetails.muscle_groups}</p>
          <p className="text-zinc-400 text-center text-sm leading-relaxed mb-10 max-w-md italic">{viewingDetails.description || "No description available for this movement."}</p>
          <Button onClick={() => setViewingDetails(null)} className="w-full max-w-xs h-16 bg-zinc-900 rounded-2xl font-black uppercase tracking-widest border border-white/10">Close Details</Button>
        </div>
      )}

      {/* CONFIGURATION DRAWER */}
      {selectedEx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end">
          <div className="w-full bg-zinc-950 rounded-t-[3rem] p-8 border-t border-white/10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-4 mb-8">
              <img src={selectedEx.image_url} className="w-20 h-20 rounded-[2rem] object-cover border border-white/10" />
              <div>
                <h3 className="text-xl font-black uppercase italic leading-none">{selectedEx.name}</h3>
                <p className="text-cyan-500 font-bold uppercase text-[10px] mt-2 tracking-widest">{selectedEx.muscle_groups}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {selectedEx.has_reps && (
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 italic">Reps</p>
                  <input type="number" value={config.reps} onChange={e => setConfig({...config, reps: e.target.value})} className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 text-center font-black text-xl text-cyan-500" />
                </div>
              )}
              {selectedEx.has_weight && (
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 italic">Weight</p>
                  <input type="number" value={config.weight} onChange={e => setConfig({...config, weight: e.target.value})} className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 text-center font-black text-xl text-cyan-500" />
                </div>
              )}
              {selectedEx.has_time && (
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 italic">Time</p>
                  <input type="number" value={config.time} onChange={e => setConfig({...config, time: e.target.value})} className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 text-center font-black text-xl text-cyan-500" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setSelectedEx(null)} className="flex-1 h-16 bg-zinc-900 rounded-2xl font-black uppercase italic border border-white/5">Cancel</Button>
              <Button onClick={confirmAdd} className="flex-[2] h-16 bg-cyan-500 text-black rounded-2xl font-black uppercase italic shadow-lg shadow-cyan-500/20">Confirm Move</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}