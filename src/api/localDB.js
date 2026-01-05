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
    if (!day) return []; 
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

  async getHistory() {
    return await db.history.orderBy('date').reverse().toArray();
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

  async processSyncQueue() {
    if (!navigator.onLine) return;
    const pending = await db.sync_queue.where('status').equals('pending').toArray();
    
    for (const item of pending) {
      try {
        const { table, action, data } = item;
        let error;
        const targetTable = table === 'history' ? 'workout_sessions' : 'workout_plans';

        if (action === 'INSERT') {
          ({ error } = await supabase.from(targetTable).insert([data]));
        } else if (action === 'DELETE') {
          ({ error } = await supabase.from(targetTable).delete().eq('id', data.id));
        }

        if (!error) {
          await db.sync_queue.update(item.id, { status: 'synced' });
        }
      } catch (err) {
        console.error("Sync failed:", err);
      }
    }
  },

  async associateLocalDataWithUser(userId) {
    if (!userId) return;
    try {
      await db.plans.toCollection().modify(plan => {
        if (!plan.user_id) plan.user_id = userId;
      });
      await db.history.toCollection().modify(h => {
        if (!h.user_id) h.user_id = userId;
      });
    } catch (err) {
      console.warn("Association skipped:", err);
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
  }
};