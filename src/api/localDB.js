import Dexie from 'dexie';

export const db = new Dexie('WorkoutAppDB');

db.version(1).stores({
  plans: '++id, day_of_week, exercise_name',
  history: '++id, date, status',
  exercises: 'id, name, type', // 'id' is the primary key from Supabase
  active_workout: 'id, date, exercises'
});

export const localDB = {
  // --- Plan Methods ---
  getPlansByDay: async (day) => {
    return await db.plans.where('day_of_week').equals(day).toArray();
  },
  
  syncPlans: async (day, plans) => {
    return await db.transaction('rw', db.plans, async () => {
      await db.plans.where('day_of_week').equals(day).delete();
      await db.plans.bulkAdd(plans);
    });
  },

  // --- History Methods ---
  saveSession: async (session) => await db.history.put(session),
  
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
      await db.exercises.bulkAdd(exercises);
    });
  },

  // --- Active Session Methods ---
  async saveActiveSession(session) {
    return await db.active_workout.put({ id: 'current_session', ...session });
  },

  async getActiveSession() {
    return await db.active_workout.get('current_session');
  },

  async deleteActiveSession() {
    return await db.active_workout.delete('current_session');
  }
};