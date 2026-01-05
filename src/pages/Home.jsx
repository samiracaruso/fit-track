// [DEXIE-INTEGRATED] with Migration Bridge
import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB'; 
import { migrateUserData } from '@/api/integrations'; // Import our bridge
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Settings, 
  Play, 
  Clock, 
  Zap,
  Loader2,
  Calendar as CalendarIcon,
  RefreshCw // For migration icon
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const todayName = format(new Date(), 'EEEE').toLowerCase();

      // 1. INSTANT LOAD: Get from Dexie (Offline-First)
      const [cachedPlans, cachedHistory, cachedActive] = await Promise.all([
        localDB.getPlanByDay(todayName),
        localDB.getHistory(),
        localDB.getActiveSession()
      ]);

      if (cachedPlans?.length) setWorkoutPlans(cachedPlans);
      if (cachedHistory) setRecentSessions(cachedHistory);
      if (cachedActive) setActiveSession(cachedActive);

      // 2. AUTH & MIGRATION CHECK
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch current Supabase data
        const { data: existingPlans } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('user_id', currentUser.id);

        // TRIGGER MIGRATION: If no plans exist in Supabase, try to pull from Base44
        if (!existingPlans || existingPlans.length === 0) {
          await handleMigration(currentUser);
        } else {
          await syncFromSupabase(currentUser, todayName);
        }
      }
    } catch (error) {
      console.error('Offline mode or Sync Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async (currentUser) => {
    setIsMigrating(true);
    try {
      // Use the bridge we built in integrations.js
      const legacyData = await migrateUserData(currentUser.id);
      
      if (legacyData && (legacyData.oldPlans?.length || legacyData.oldFavorites?.length)) {
        console.log("Found legacy data. Migrating...");
        
        // 1. Prepare Plans for Supabase (Mapping Base44 fields to our new SQL schema)
        const plansToInsert = legacyData.oldPlans.map(plan => ({
          user_id: currentUser.id,
          day_of_week: plan.day_of_week,
          exercise_id: plan.exercise_id,
          exercise_name: plan.exercise_name,
          sets: plan.sets || [], // Our new JSONB column
          notes: plan.notes,
          order: plan.order || 0
        }));

        if (plansToInsert.length > 0) {
          await supabase.from('workout_plans').insert(plansToInsert);
        }

        // 2. After inserting into Supabase, trigger a normal sync to fill Dexie
        const todayName = format(new Date(), 'EEEE').toLowerCase();
        await syncFromSupabase(currentUser, todayName);
      }
    } catch (e) {
      console.error("Migration failed:", e);
    } finally {
      setIsMigrating(false);
    }
  };

  const syncFromSupabase = async (currentUser, todayName) => {
    const [plansRes, sessionsRes] = await Promise.all([
      supabase.from('workout_plans').select('*').eq('user_id', currentUser.id),
      supabase.from('workout_sessions')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('date', format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
        .order('date', { ascending: false })
    ]);

    if (plansRes.data) {
      for (const day of daysOfWeek) {
        const dayExercises = plansRes.data.filter(p => p.day_of_week === day);
        await localDB.savePlan(day, dayExercises);
      }
      setWorkoutPlans(plansRes.data.filter(p => p.day_of_week === todayName));
    }
    
    if (sessionsRes.data) {
      setRecentSessions(sessionsRes.data);
      await localDB.history.clear();
      await localDB.history.bulkAdd(sessionsRes.data);
    }
  };

  // ... (Keep weekDays, stats, and return UI logic from your original file)
  // ADD THIS inside your return statement right above the "Weekly Stats Card"
  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      {/* Migration Status Overlay */}
      {isMigrating && (
        <div className="bg-cyan-500 text-black py-2 px-6 flex items-center justify-center gap-2 animate-pulse font-black uppercase text-[10px] tracking-widest">
          <RefreshCw size={12} className="animate-spin" />
          Syncing Legacy Data from Base44...
        </div>
      )}

      {/* Rest of your Header and UI code... */}