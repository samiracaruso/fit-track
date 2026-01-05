import Dexie from 'dexie';

// 1. Initialize the Database
export const db = new Dexie('WorkoutAppDB');

// 2. Define Schema
// '++id' means auto-incrementing primary key
// Fields listed here are "indexed" so searching them is lightning fast
db.version(1).stores({
  plans: '++id, day_of_week, exercise_name',
  history: '++id, date, status',
  exercises: '++id, name, category'
});

// 3. The Service Wrapper
export const localDB = {
  // Methods for DayPlan.jsx
  getPlansByDay: async (day) => {
    return await db.plans.where('day_of_week').equals(day).toArray();
  },
  
  syncPlans: async (day, plans) => {
    return await db.transaction('rw', db.plans, async () => {
      // Clear old local plans for this specific day and replace with new ones
      await db.plans.where('day_of_week').equals(day).delete();
      await db.plans.bulkAdd(plans);
    });
  },

  // Methods for Home.jsx & History
  saveSession: async (session) => await db.history.put(session),
  
  getHistory: async () => {
    return await db.history.orderBy('date').reverse().toArray();
  }
};