import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { localDB, db } from '@/api/localDB';
import { supabase } from '@/supabaseClient';
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, X } from "lucide-react";
import { toast } from 'sonner';

export default function ActiveSession() {
  const [searchParams] = useSearchParams();
  const dayFromUrl = searchParams.get('day') || 'Monday'; 
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function init() {
      const allEx = await localDB.getAllExercises();
      setCatalog(allEx);

      const existing = await localDB.getActiveSession();
      if (existing) {
        setSession(existing);
      } else {
        const plan = await localDB.getPlanByDay(dayFromUrl);
        const newSession = {
          id: crypto.randomUUID(),
          day_of_week: dayFromUrl,
          exercises: plan.map(p => ({ ...p, sets: [] })),
          status: 'active'
        };
        await localDB.saveActiveSession(newSession);
        setSession(newSession);
      }
    }
    init();
  }, [dayFromUrl]);

  const handleFinish = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const final = { ...session, total_duration: seconds, user_id: user?.id, date: new Date().toISOString() };
    await localDB.saveSession(final);
    await localDB.addToQueue('history', 'INSERT', final);
    await localDB.deleteActiveSession();
    toast.success("Workout Saved!");
    navigate('/');
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
       <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic uppercase text-cyan-500">Active</h1>
        <div className="font-mono bg-zinc-900 px-3 py-1 rounded-lg">
          {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="space-y-4">
        {session.exercises.map((ex, i) => (
          <div key={i} className="bg-zinc-900 p-4 rounded-2xl border border-white/5">
            <p className="font-bold uppercase italic text-sm">{ex.exercise_name}</p>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 left-6 right-6 flex gap-3">
        <Button onClick={() => setIsAdding(true)} className="flex-1 h-16 bg-zinc-800 rounded-2xl font-black uppercase">
          <Plus className="mr-2" /> Add
        </Button>
        <Button onClick={handleFinish} className="flex-1 h-16 bg-cyan-500 text-black rounded-2xl font-black uppercase">
          <CheckCircle2 className="mr-2" /> Finish
        </Button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/95 z-50 p-6 overflow-y-auto">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-black uppercase italic">Add Move</h2>
            <Button variant="ghost" onClick={() => setIsAdding(false)}><X /></Button>
          </div>
          <div className="grid gap-2">
            {catalog.map(ex => (
              <button key={ex.id} onClick={() => {
                const updated = { ...session, exercises: [...session.exercises, { exercise_name: ex.name, sets: [] }] };
                setSession(updated);
                localDB.saveActiveSession(updated);
                setIsAdding(false);
              }} className="w-full bg-zinc-900 p-4 rounded-xl text-left uppercase font-bold text-sm">
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}