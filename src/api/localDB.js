import Dexie from 'dexie';

// 1. Initialize the Database
export const db = new Dexie('WorkoutAppDB');

// 2. Define Schema
db.version(1).stores({
  exercises: '++id, name, type',
  plans: '++id, day_of_week, user_id',
  history: '++id, date, user_id',
  sync_queue: '++id, status',
  active_session: 'id' 
});

// 3. Abstraction Layer for easy use in Components
export const localDB = {
  db: db,

  async getAllExercises() {
    return await db.exercises.toArray();
  },

  async getPlanByDay(day) {
    // Force lowercase to prevent "Monday" vs "monday" mismatch
    return await db.plans.where('day_of_week').equals(day.toLowerCase()).toArray();
  },

  async saveSession(session) {
    return await db.history.add(session);
  },

  async getHistory() {
    return await db.history.orderBy('date').reverse().toArray();
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

  async addToQueue(table, action, data) {
    return await db.sync_queue.add({
      table,
      action,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
  },

  async associateLocalDataWithUser(userId) {
    if (!userId) return;
    try {
      await db.plans.toCollection().modify(plan => {
        if (!plan.user_id) plan.user_id = userId;
      });
    } catch (err) {
      console.warn("Fit-Track: No guest data to link:", err);
    }
  },

  async syncExercises(exerciseList) {
    return await db.exercises.bulkPut(exerciseList);
  }
};