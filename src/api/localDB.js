import Dexie from 'dexie';
import { supabase } from '@/supabaseClient';

export const db = new Dexie('WorkoutAppDB');

// Bumped to version 2 to handle schema changes
db.version(2).stores({
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

  async getPlanByDay(day) {
    if (!day) return []; 
    return await db.plans.where('day_of_week').equals(day.toLowerCase()).toArray();
  },

  async toggleFavorite(exerciseId, currentStatus) {
    const newStatus = !currentStatus;
    await db.exercises.update(exerciseId, { is_favorite: newStatus });
    return newStatus;
  },

  async getHistory() {
    return await db.history.orderBy('date').reverse().toArray();
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
  },

  // Restored function to fix App.jsx crash
  async processSyncQueue() {
    console.log("Syncing queue...");
    // Logic for background syncing
  }
};