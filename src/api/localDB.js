import Dexie from 'dexie';

export const db = new Dexie('WorkoutAppDB');

// Version 2 Schema
db.version(2).stores({
  plans: '++id, day_of_week, exercise_name',
  history: 'id, date, status', 
  exercises: 'id, name, target_muscle_group', 
  active_workout: 'id' 
});

export const localDB = {
  // --- Plan Methods ---
  getPlanByDay: async (day) => {
    return await db.plans.where('day_of_week').equals(day).toArray();
  },

  savePlan: async (day, plans) => {
    return await db.transaction('rw', db.plans, async () => {
      // Clear existing records for this day to avoid duplicates on sync
      await db.plans.where('day_of_week').equals(day).delete();
      if (plans && plans.length > 0) {
        const prepared = plans.map(p => ({ 
          ...p, 
          day_of_week: day,
          // Remove internal Dexie ++id if it exists to let it auto-gen fresh ones
          id: typeof p.id === 'string' ? p.id : undefined 
        }));
        await db.plans.bulkAdd(prepared);
      }
    });
  },

  deletePlanExercise: async (id) => {
    return await db.plans.delete(id);
  },

  // --- History Methods ---
  saveSession: async (session) => {
    return await db.history.put(session);
  },
  
  getHistory: async () => {
    return await db.history.orderBy('date').reverse().toArray();
  },

  // --- Exercise Library Methods ---
  async getAllExercises() {
    return await db.exercises.toArray();
  },

  async syncExercises(exercises) {
    return await db.transaction('rw', db.exercises, async () => {
      await db.exercises.clear();
      if (exercises.length > 0) {
        await db.exercises.bulkAdd(exercises);
      }
    });
  },

  // --- Active Session Methods ---
  async saveActiveSession(session) {
    return await db.active_workout.put({ 
      ...session, 
      id: 'current_session',
      last_updated: new Date().toISOString() 
    });
  },

  async getActiveSession() {
    return await db.active_workout.get('current_session');
  },

  async deleteActiveSession() {
    return await db.active_workout.delete('current_session');
  }
};