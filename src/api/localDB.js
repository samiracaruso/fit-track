import Dexie from 'dexie';

// 1. Initialize the Database
export const db = new Dexie('WorkoutAppDB');

// 2. Define Schema
// The order here is crucial for the database structure
db.version(1).stores({
  plans: '++id, day_of_week, exercise_name',
  history: '++id, date, status',
  exercises: '++id, name, category',
  active_workout: 'id, date, exercises' // Add this for ActiveSession.jsx
});

// 3. The Service Wrapper
// All helper functions MUST go inside this "localDB" object
export const localDB = {
  // --- DayPlan.jsx Methods ---
  getPlansByDay: async (day) => {
    return await db.plans.where('day_of_week').equals(day).toArray();
  },
  
  syncPlans: async (day, plans) => {
    return await db.transaction('rw', db.plans, async () => {
      await db.plans.where('day_of_week').equals(day).delete();
      await db.plans.bulkAdd(plans);
    });
  },

  // --- Home.jsx & History Methods ---
  saveSession: async (session) => await db.history.put(session),
  
  getHistory: async () => {
    return await db.history.orderBy('date').reverse().toArray();
  },

  // --- ActiveSession.jsx Methods (New) ---
  async saveActiveSession(session) {
    // We use a fixed ID 'current_session' so it overwrites itself 
    // instead of creating 100 drafts.
    return await db.active_workout.put({ id: 'current_session', ...session });
  },

  async getActiveSession() {
    return await db.active_workout.get('current_session');
  },

  async deleteActiveSession() {
    return await db.active_workout.delete('current_session');
  }
};