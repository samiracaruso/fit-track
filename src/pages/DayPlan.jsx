import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { localDB, db } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Plus, Trash2, Dumbbell, X, 
  Search, Info, Star, Filter, Check 
} from "lucide-react";
import { toast } from 'sonner';

export default function DayPlan() {
  const { day } = useParams();
  const navigate = useNavigate();
  
  const [exercises, setExercises] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Selection Preview State
  const [selectedEx, setSelectedEx] = useState(null);
  const [config, setConfig] = useState({ sets: 3, reps: 10, weight: 0 });

  useEffect(() => {
    async function init() {
      const plan = await localDB.getPlanByDay(day);
      // Fetch and Sort Alphabetically
      const allEx = await localDB.getAllExercises();
      setCatalog(allEx.sort((a, b) => a.name.localeCompare(b.name)));
      setExercises(plan);
    }
    init();
  }, [day]);

  // Filter Logic
  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Cardio', 'Favorites'];
  const filteredCatalog = catalog.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Favorites') return matchesSearch && ex.is_favorite;
    return matchesSearch && ex.muscle_group === activeFilter;
  });

  const confirmAdd = async () => {
    const newEntry = {
      day_of_week: day.toLowerCase(),
      exercise_id: selectedEx.id,
      exercise_name: selectedEx.name,
      image_url: selectedEx.image_url,
      target_sets: config.sets,
      target_reps: config.reps,
      target_weight_kg: config.weight,
      // Restoring the "Feature Toggles" from your Supabase schema
      show_reps: selectedEx.show_reps ?? true,
      show_weight: selectedEx.show_weight ?? true,
      show_distance: selectedEx.show_distance ?? false,
      show_time: selectedEx.show_time ?? false
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
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <Button variant="ghost" size="icon" onClick={() => navigate('/WeeklyPlan')}><ChevronLeft /></Button>
        <h1 className="text-2xl font-black uppercase italic">{day} <span className="text-cyan-500">Plan</span></h1>
      </header>

      {/* Main List */}
      <div className="px-6 py-4 space-y-3">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-zinc-900/50 border border-white/5 p-5 rounded-[2rem] flex justify-between items-center">
             <div className="flex items-center gap-4">
                <img src={ex.image_url} className="w-12 h-12 rounded-xl object-cover bg-black" alt="" />
                <div>
                  <h3 className="font-black uppercase italic text-sm leading-none mb-1">{ex.exercise_name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {ex.target_sets} × {ex.target_reps} {ex.show_weight ? `• ${ex.target_weight_kg}kg` : ''}
                  </p>
                </div>
             </div>
             <Button variant="ghost" onClick={() => {
                db.plans.delete(ex.id);
                setExercises(exercises.filter(e => e.id !== ex.id));
             }} className="text-zinc-800 hover:text-red-500"><Trash2 size={18}/></Button>
          </div>
        ))}

        <Button onClick={() => setIsAdding(true)} className="w-full py-10 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[2.5rem] mt-4 font-black uppercase italic text-zinc-500">
          <Plus className="mr-2" /> Add Movement
        </Button>
      </div>

      {/* OVERLAY: Library & Filters */}
      {isAdding && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-6 bg-zinc-950 border-b border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase italic text-cyan-500">Movement Library</h2>
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-full bg-zinc-900"><X /></Button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                className="w-full bg-zinc-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold border border-white/5"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${
                    activeFilter === cat ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredCatalog.map(ex => (
              <div key={ex.id} className="bg-zinc-900/40 p-4 rounded-[2rem] flex items-center gap-4 border border-white/5">
                <img src={ex.image_url} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                <div className="flex-1">
                  <h4 className="font-black uppercase italic text-sm">{ex.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{ex.equipment || 'Bodyweight'}</p>
                </div>
                <div className="flex gap-1">
                  {ex.is_favorite && <Star size={16} className="fill-cyan-500 text-cyan-500 mr-2" />}
                  <Button variant="ghost" onClick={() => setSelectedEx(ex)} className="bg-cyan-500/10 text-cyan-500 rounded-full h-10 w-10 p-0">
                    <Plus size={20} strokeWidth={3} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OVERLAY: Configuration Modal (Add Sets/Reps) */}
      {selectedEx && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-end">
          <div className="w-full bg-zinc-900 rounded-t-[3rem] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-4 mb-8">
              <img src={selectedEx.image_url} className="w-20 h-20 rounded-[2rem] object-cover" alt="" />
              <div>
                <h3 className="text-xl font-black uppercase italic leading-none">{selectedEx.name}</h3>
                <p className="text-cyan-500 font-bold uppercase text-[10px] mt-2 tracking-widest">{selectedEx.muscle_group}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Sets</p>
                <input type="number" value={config.sets} onChange={e => setConfig({...config, sets: e.target.value})} className="w-full bg-black border border-white/5 rounded-2xl py-4 text-center font-black text-xl" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Reps</p>
                <input type="number" value={config.reps} onChange={e => setConfig({...config, reps: e.target.value})} className="w-full bg-black border border-white/5 rounded-2xl py-4 text-center font-black text-xl" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Weight</p>
                <input type="number" value={config.weight} onChange={e => setConfig({...config, weight: e.target.value})} className="w-full bg-black border border-white/5 rounded-2xl py-4 text-center font-black text-xl" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setSelectedEx(null)} className="flex-1 h-16 bg-zinc-800 rounded-2xl font-black uppercase italic">Cancel</Button>
              <Button onClick={confirmAdd} className="flex-2 h-16 bg-cyan-500 text-black rounded-2xl font-black uppercase italic flex-[2]">Add to Workout</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}