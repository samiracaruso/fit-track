import Dexie from 'dexie';
import { supabase } from '@/supabaseClient';

export const db = new Dexie('WorkoutAppDB');

db.version(1).stores({
  exercises: '++id, name, type',
  plans: '++id, day_of_week, user_id',
  history: '++id, date, user_id',
  sync_queue: '++id, status',
  active_session: 'id' 
});

export const localDB = {
  db: db,

  async getAllExercises() {
    return await db.exercises.toArray();
  },

  async getPlanByDay(day) {
    return await db.plans.where('day_of_week').equals(day.toLowerCase()).toArray();
  },

  async saveActiveSession(session) {
    return await db.active_session.put({ id: 'current', ...session });
  },

  async getActiveSession() {
    return await db.active_session.get('current');
  },

  async deleteActiveSession() {
    return await db.active_session.delete('current');
  },

  async saveSession(session) {
    return await db.history.add(session);
  },

  async addToQueue(table, action, data) {
    return await db.sync_queue.add({
      table,
      action,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
  },

  // THIS IS THE MISSING FUNCTION CAUSING THE CRASH
  async processSyncQueue() {
    if (!navigator.onLine) return;

    const pending = await db.sync_queue.where('status').equals('pending').toArray();
    
    for (const item of pending) {
      try {
        const { table, action, data } = item;
        let error;

        if (action === 'INSERT') {
          ({ error } = await supabase.from(table === 'history' ? 'workout_sessions' : 'workout_plans').insert([data]));
        } else if (action === 'DELETE') {
          ({ error } = await supabase.from(table === 'history' ? 'workout_sessions' : 'workout_plans').delete().eq('id', data.id));
        }

        if (!error) {
          await db.sync_queue.update(item.id, { status: 'synced' });
        }
      } catch (err) {
        console.error("Sync failed for item:", item.id, err);
      }
    }
  },

  async associateLocalDataWithUser(userId) {
    if (!userId) return;
    try {
      await db.plans.toCollection().modify(plan => {
        if (!plan.user_id) plan.user_id = userId;
      });
      await db.history.toCollection().modify(session => {
        if (!session.user_id) session.user_id = userId;
      });
    } catch (err) {
      console.warn("Fit-Track: Sync association skipped:", err);
    }
  },

  async syncExercises() {
    // Pull the full 300+ exercise list from Supabase
    const { data, error } = await supabase
      .from('exercises')
      .select('*');

    if (error) {
      console.error("Error fetching from Base 44:", error);
      return;
    }

    if (data) {
      // Clear the old 5 strings and put the real 300+ objects in Dexie
      await db.exercises.clear();
      await db.exercises.bulkPut(data);
      return data;
    }
  };