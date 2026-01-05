import Dexie from 'dexie';
import { supabase } from '@/supabaseClient';

export const db = new Dexie('WorkoutAppDB');

// Bump to version 3 to clear the "Unable to patch indexes" error
db.version(3).stores({
  exercises: '++id, name, type, is_favorite', 
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

  async getHistory() {
    return await db.history.orderBy('date').reverse().toArray();
  },

  async getPlanByDay(day) {
    if (!day) return [];
    return await db.plans.where('day_of_week').equals(day.toLowerCase()).toArray();
  },

  async toggleFavorite(exerciseId, currentStatus) {
    const newStatus = !currentStatus;
    await db.exercises.update(exerciseId, { is_favorite: newStatus });
    return newStatus;
  },

  async associateLocalDataWithUser(userId) {
    if (!userId) return;
    await db.plans.toCollection().modify(p => { if (!p.user_id) p.user_id = userId; });
    await db.history.toCollection().modify(h => { if (!h.user_id) h.user_id = userId; });
  },

  async processSyncQueue() {
    if (!navigator.onLine) return;
    const pending = await db.sync_queue.where('status').equals('pending').toArray();
    for (const item of pending) {
      // Sync logic here
      await db.sync_queue.update(item.id, { status: 'synced' });
    }
  },

  async syncExercises() {
    const { data, error } = await supabase.from('exercises').select('*');
    if (error) throw error;
    if (data) {
      await db.exercises.clear();
      await db.exercises.bulkPut(data);
      return data;
    }
  },

  async addToQueue(table, action, data) {
    return await db.sync_queue.add({
      table, action, data, timestamp: new Date().toISOString(), status: 'pending'
    });
  }
};