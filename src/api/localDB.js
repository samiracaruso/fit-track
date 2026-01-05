import Dexie from 'dexie';

export const db = new Dexie('WorkoutAppDB');

// Version 4 Schema
db.version(4).stores({
  plans: '++id, day_of_week, exercise_id',
  history: 'id, date, status',
  active_session: 'id',
  exercises: 'id, name, type',
  sync_queue: '++id, table, action, payload' 
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

    for (const item of queue) {
      try {
        let error;
        
        // IMPORTANT: Map local Dexie names to Supabase table names
        const remoteTable = item.table === 'plans' ? 'workout_plans' : 
                            item.table === 'history' ? 'workout_sessions' : 
                            item.table;

        if (item.action === 'INSERT') {
          ({ error } = await supabase.from(remoteTable).insert(item.payload));
        } else if (item.action === 'UPDATE') {
          ({ error } = await supabase.from(remoteTable).update(item.payload).eq('id', item.payload.id));
        } else if (item.action === 'DELETE') {
          ({ error } = await supabase.from(remoteTable).delete().eq('id', item.payload.id));
        }

        if (!error) {
          await db.sync_queue.delete(item.id);
          console.log(`Successfully synced ${remoteTable}`);
        }
      } catch (err) {
        console.error("Sync error:", err);
        break; 
      }
    }
  },

  // --- NEW: LINK DATA TO USER ---
  // Call this in App.jsx or Home.jsx right after login
  async associateLocalDataWithUser(userId) {
  if (!userId) return;
  
  try {
    // Check if there are any plans with no user_id first
    const guestPlans = await this.db.plans.where('user_id').equals('').toArray();
    
    if (guestPlans.length > 0) {
      await this.db.plans
        .where('user_id')
        .equals('')
        .modify({ user_id: userId });
      console.log("Fit-Track: Linked guest plans to user account.");
    }
  } catch (err) {
    // We catch the error here so the app keeps running even if sync fails
    console.warn("Fit-Track: No guest data to link or sync error:", err);
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
    // UsingequalsIgnoreCase to handle 'Monday' vs 'monday'
    return await db.plans.where('day_of_week').equalsIgnoreCase(day).toArray();
  },

  async savePlan(day, plans) {
    return await db.transaction('rw', db.plans, async () => {
      await db.plans.where('day_of_week').equalsIgnoreCase(day).delete();
      if (plans.length > 0) {
        await db.plans.bulkAdd(plans);
      }
    });
  },

  async getAllExercises() {
    return await db.exercises.toArray();
  },

  async syncExercises(exercises) {
    return await db.exercises.bulkPut(exercises);
  }
};