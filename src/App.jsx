import React, { useEffect } from 'react';
import './App.css';
import Pages from "@/pages/index.jsx";
import { Toaster } from "sonner";
import { localDB } from '@/api/localDB';
import { supabase } from '@/supabaseClient';

/**
 * Fit-Track Main Entry Point
 * Handles global authentication state changes and 
 * the background synchronization engine.
 */
function App() {
  useEffect(() => {
    // 1. Setup the Auth Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        console.log(`Fit-Track: User ${event} - ID: ${session.user.id}`);
        
        // When a user logs in, link any local "guest" data to their Google ID
        await localDB.associateLocalDataWithUser(session.user.id);
        
        // If we are online, immediately try to push pending data to the cloud
        if (navigator.onLine) {
          await localDB.processSyncQueue(supabase);
        }
      }
    });

    // 2. Setup the Online/Offline Sync Trigger
    const handleOnlineStatus = async () => {
      if (navigator.onLine) {
        console.log("Fit-Track: Connection restored. Processing sync queue...");
        await localDB.processSyncQueue(supabase);
      }
    };

    window.addEventListener('online', handleOnlineStatus);

    // 3. Initial Sync Check on App Load
    if (navigator.onLine) {
      localDB.processSyncQueue(supabase);
    }

    // Cleanup listeners on unmount
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnlineStatus);
    };
  }, []);

  return (
    <>
      <Pages />
      {/* RichColors enabled for better "Success/Error" visual feedback */}
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

export default App;