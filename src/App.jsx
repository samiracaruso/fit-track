import React, { useEffect } from 'react';
import './App.css';
import Pages from "@/pages/index.jsx";
import { Toaster } from "sonner";
import { localDB } from '@/api/localDB';
import { supabase } from '@/supabaseClient';

function App() {
  useEffect(() => {
    // 1. Function to process sync queue
    const syncData = async () => {
      if (navigator.onLine) {
        await localDB.processSyncQueue(supabase);
      }
    };

    // 2. Event listener for coming back online
    window.addEventListener('online', syncData);

    // 3. Initial check on app load
    syncData();

    return () => window.removeEventListener('online', syncData);
  }, []);

  return (
    <>
      <Pages />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;