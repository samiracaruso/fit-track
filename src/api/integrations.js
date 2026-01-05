// [DEXIE-INTEGRATED] - Transitioning from Base44 to Supabase
import { base44 } from './base44Client';

/**
 * MIGRATION BRIDGE
 * This pulls all legacy data from Base44 so we can move it to Supabase/Dexie.
 */
export const migrateUserData = async () => {
  try {
    // We fetch everything from Base44 in parallel
    const [oldFavorites, oldPlans, oldHistory] = await Promise.all([
      base44.entities.UserFavoriteExercise.list(),
      base44.entities.WorkoutPlan.list(),
      base44.entities.WorkoutSession.list()
    ]);

    return { 
      oldFavorites: oldFavorites || [], 
      oldPlans: oldPlans || [], 
      oldHistory: oldHistory || [] 
    };
  } catch (error) {
    console.error("Migration bridge failed to pull data:", error);
    return null;
  }
};

/**
 * CORE INTEGRATIONS
 * We keep these exports so the rest of the app doesn't break.
 * They still point to Base44 for now (AI, Email, Files).
 */
export const Core = base44.integrations.Core;

// Storage
export const UploadFile = base44.integrations.Core.UploadFile;
export const UploadPrivateFile = base44.integrations.Core.UploadPrivateFile;
export const CreateFileSignedUrl = base44.integrations.Core.CreateFileSignedUrl;

// AI Features
export const InvokeLLM = base44.integrations.Core.InvokeLLM;
export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;

// Communication & Misc
export const SendEmail = base44.integrations.Core.SendEmail;
export const GenerateImage = base44.integrations.Core.GenerateImage;