import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import Layout from "./Layout.jsx";

// Import all your pages
import Auth from "./Auth";
import Home from "./Home";
import ActiveSession from "./ActiveSession";
import DayPlan from "./DayPlan";
import Profile from "./Profile";
import WorkoutHistory from "./WorkoutHistory";
import WeeklyPlan from "./WeeklyPlan";
// ... (import other pages as needed)

function PagesContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* If NO session, everything redirects to Auth */}
        {!session ? (
          <>
            <Route path="/Auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/Auth" replace />} />
          </>
        ) : (
          /* If YES session, allow all routes and redirect Auth to Home */
          <>
            <Route path="/Auth" element={<Navigate to="/Home" replace />} />
            <Route path="/" element={<Home />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/ActiveSession" element={<ActiveSession />} />
            <Route path="/DayPlan" element={<DayPlan />} />
            <Route path="/Profile" element={<Profile />} />
            <Route path="/WeeklyPlan" element={<WeeklyPlan />} />
            <Route path="/WorkoutHistory" element={<WorkoutHistory />} />
            {/* Catch-all for logged in users */}
            <Route path="*" element={<Navigate to="/Home" replace />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}