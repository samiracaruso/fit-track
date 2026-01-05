import Dexie from 'dexie';

export const db = new Dexie('WorkoutAppDB');

// Update version to include sync_queue
db.version(4).stores({
  plans: '++id, day_of_week, exercise_id',
  history: 'id, date, status',
  active_session: 'id',
  exercises: 'id, name, type',
  sync_queue: '++id, table, action, payload' // Store pending cloud updates
});

export const localDB = {
  // --- SYNC QUEUE LOGIC ---
  async addToQueue(table, action, payload) {
    return await db.sync_queue.add({
      table,
      action,
      payload,
      timestamp: new Date().toISOString()
    });
  },

  async processSyncQueue(supabase) {
    const queue = await db.sync_queue.toArray();
    if (queue.length === 0) return;

    console.log(`Checking sync queue: ${queue.length} items pending...`);

    for (const item of queue) {
      try {
        let error;
        // Map the action to Supabase calls
        if (item.action === 'INSERT') {
          ({ error } = await supabase.from(item.table).insert(item.payload));
        } else if (item.action === 'UPDATE') {
          ({ error } = await supabase.from(item.table).update(item.payload).eq('id', item.payload.id));
        } else if (item.action === 'DELETE') {
          ({ error } = await supabase.from(item.table).delete().eq('id', item.payload.id));
        }

        if (!error) {
          await db.sync_queue.delete(item.id);
          console.log(`Successfully synced ${item.table} ${item.action}`);
        } else {
          console.error("Supabase sync error:", error);
        }
      } catch (err) {
        console.error("Network error during sync attempt:", err);
        break; // Stop processing if we're still offline
      }
    }
  },

  // --- HISTORY METHODS ---
  async saveSession(session) {
    return await db.history.put(session);
  },

  async getHistory() {
    return await db.history.orderBy('date').reverse().toArray();
  },

  // --- ACTIVE SESSION METHODS ---
  async getActiveSession() {
    return await db.active_session.toCollection().first();
  },

  async saveActiveSession(session) {
    return await db.active_session.put(session);
  },

  async deleteActiveSession() {
    return await db.active_session.clear();
  },

  // --- PLANS & EXERCISES ---
  async getPlanByDay(day) {
    return await db.plans.where('day_of_week').equalsIgnoreCase(day).toArray();
  },

  async getAllExercises() {
    return await db.exercises.toArray();
  },

  async syncExercises(exercises) {
    return await db.exercises.bulkPut(exercises);
  }
};