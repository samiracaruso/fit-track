import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { localDB, db } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Trash2, X, Search, Info, Heart } from "lucide-react";
import { toast } from 'sonner';

export default function DayPlan() {
  const { day } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMuscle, setActiveMuscle] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);
  const [selectedEx, setSelectedEx] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [config, setConfig] = useState({ reps: 10, sets: 3, weight: 0 });

  const MUSCLE_GROUPS = ['All', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body'];
  const EXERCISE_TYPES = ['All', 'machine', 'cardio', 'bodyweight', 'weights'];

  useEffect(() => {
    async function init() {
      const plan = await localDB.getPlanByDay(day);
      const allEx = await localDB.getAllExercises();
      setCatalog(allEx.sort((a, b) => a.name.localeCompare(b.name)));
      setExercises(plan);
    }
    init();
  }, [day]);

  // FIXED FILTER LOGIC: Correctly handles muscle_groups text array
  const filteredCatalog = catalog.filter(ex => {
  const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesType = activeType === 'All' || ex.type === activeType;
  const matchesFav = !showOnlyFavs || ex.is_favorite;
  
  // FIXED ARRAY LOGIC:
  const muscleArray = Array.isArray(ex.muscle_groups) ? ex.muscle_groups : [];
  const matchesMuscle = activeMuscle === 'All' || 
    muscleArray.some(m => String(m).toLowerCase() === activeMuscle.toLowerCase());
  
  return matchesSearch && matchesType && matchesFav && matchesMuscle;
});

  const handleToggleFavorite = async (e, ex) => {
    e.stopPropagation();
    const newStatus = await localDB.toggleFavorite(ex.id, ex.is_favorite);
    setCatalog(prev => prev.map(item => item.id === ex.id ? { ...item, is_favorite: newStatus } : item));
    toast.success(newStatus ? "Added to Favorites" : "Removed from Favorites");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 font-sans">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <Button variant="ghost" size="icon" onClick={() => navigate('/WeeklyPlan')}><ChevronLeft /></Button>
        <h1 className="text-2xl font-black uppercase italic">{day} <span className="text-cyan-500">Plan</span></h1>
      </header>

      {/* Library Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-6 bg-zinc-950 border-b border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase italic text-cyan-500">Movement Library</h2>
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-full bg-zinc-900"><X /></Button>
            </div>
            
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <Button 
                  onClick={() => setShowOnlyFavs(!showOnlyFavs)} 
                  className={`rounded-full uppercase text-[9px] font-black h-9 px-4 transition-colors ${showOnlyFavs ? 'bg-cyan-500 text-black' : 'bg-zinc-900 text-white border border-white/10'}`}
                >
                  <Heart size={12} className={showOnlyFavs ? 'fill-black' : ''} /> <span className="ml-1 text-inherit">Favorites</span>
                </Button>
                {EXERCISE_TYPES.map(type => (
                  <button key={type} onClick={() => setActiveType(type)} className={`px-4 h-9 rounded-full text-[9px] font-black uppercase border transition-all ${activeType === type ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>{type}</button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {MUSCLE_GROUPS.map(m => (
                  <button key={m} onClick={() => setActiveMuscle(m)} className={`px-4 h-9 rounded-full text-[9px] font-black uppercase border transition-all ${activeMuscle === m ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>{m}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredCatalog.map(ex => (
              <div key={ex.id} className="bg-zinc-900/40 p-4 rounded-[2rem] flex items-center gap-4 border border-white/5 relative">
                <img src={ex.image_url} className="w-16 h-16 rounded-2xl object-cover bg-black" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-black uppercase italic text-sm truncate">{ex.name}</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">{ex.muscle_groups?.join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={(e) => handleToggleFavorite(e, ex)} className="h-10 w-10 rounded-full bg-zinc-800/30">
                    <Heart size={18} className={ex.is_favorite ? "fill-cyan-500 text-cyan-500" : "text-zinc-600"} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setViewingDetails(ex)} className="h-10 w-10 rounded-full bg-zinc-800/30 text-zinc-400">
                    <Info size={18} />
                  </Button>
                  <Button onClick={() => setSelectedEx(ex)} className="bg-cyan-500 text-black rounded-full h-10 w-10 p-0 shadow-lg shadow-cyan-500/20"><Plus size={20} /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Detail Overlay */}
      {viewingDetails && (
        <div className="fixed inset-0 bg-black/98 z-[100] p-8 flex flex-col items-center justify-center">
          <img src={viewingDetails.image_url} className="w-full max-w-xs aspect-square rounded-[2.5rem] object-cover mb-8 border border-white/10" />
          <h2 className="text-3xl font-black uppercase italic text-center leading-none mb-2">{viewingDetails.name}</h2>
          <p className="text-cyan-500 font-bold uppercase tracking-widest text-xs mb-8">{viewingDetails.muscle_groups?.join(' • ')}</p>
          <p className="text-zinc-400 text-center text-sm italic mb-12 max-w-sm">{viewingDetails.description || "Premium movement data."}</p>
          <Button onClick={() => setViewingDetails(null)} className="w-full max-w-xs h-16 bg-zinc-900 rounded-2xl font-black uppercase tracking-widest border border-white/10">Close</Button>
        </div>
      )}
    </div>
  );
}