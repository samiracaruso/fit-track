import React, { useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import Pages from './pages';
import { Toaster } from 'sonner';

function App() {
  useEffect(() => {
    // 1. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Link any guest data to the user ID
        await localDB.associateLocalDataWithUser(session.user.id);
        
        // Push pending data to Base 44
        if (navigator.onLine) {
          await localDB.processSyncQueue();
        }
      }
    });

    // 2. Periodic Background Sync (Every 30 seconds)
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        localDB.processSyncQueue();
      }
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(syncInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Pages />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}

export default App;