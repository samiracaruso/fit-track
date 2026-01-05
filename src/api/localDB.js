import Dexie from 'dexie';

export const db = new Dexie('WorkoutAppDB');

// We use "++" for auto-incrementing IDs 
// and no symbol for keys we provide (like Supabase UUIDs)
db.version(2).stores({
  plans: '++id, day_of_week, exercise_name',
  history: 'id, date, status', // id is the Supabase session UUID
  exercises: 'id, name, target_muscle_group', 
  active_workout: 'id' // static ID 'current_session'
});

export const localDB = {
  // --- Plan Methods ---
  // Note: Home.jsx called 'getPlanByDay', so we'll provide both or alias it
  getPlanByDay: async (day) => {
    return await db.plans.where('day_of_week').equals(day).toArray();
  },

  getPlansByDay: async (day) => {
    return await db.plans.where('day_of_week').equals(day).toArray();
  },
  
  savePlan: async (day, plans) => {
    return await db.transaction('rw', db.plans, async () => {
      // Clear existing for that specific day before updating
      await db.plans.where('day_of_week').equals(day).delete();
      if (plans.length > 0) {
        await db.plans.bulkAdd(plans);
      }
    });
  },

  syncPlans: async (day, plans) => {
    return await localDB.savePlan(day, plans);
  },

  // --- History Methods ---
  // put() handles both create and update
  saveSession: async (session) => {
    return await db.history.put(session);
  },
  
  getHistory: async () => {
    return await db.history.orderBy('date').reverse().toArray();
  },

  // --- Exercise Library Methods ---
  async saveSingleExercise(exercise) {
    return await db.exercises.put(exercise);
  },

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
    // We use a fixed ID so there is only ever ONE active session at a time
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