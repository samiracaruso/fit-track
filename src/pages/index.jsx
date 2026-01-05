import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

import Home from './Home';
import Auth from './Auth';
import DayPlan from './DayPlan';
import WeeklyPlan from './WeeklyPlan';
import ActiveSession from './ActiveSession';
import WorkoutHistory from './WorkoutHistory';
import Profile from './Profile';

export default function Pages() {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/Auth" element={!session ? <Auth /> : <Navigate to="/" />} />
      <Route path="/" element={session ? <Home /> : <Navigate to="/Auth" />} />
      <Route path="/WeeklyPlan" element={session ? <WeeklyPlan /> : <Navigate to="/Auth" />} />
      <Route path="/DayPlan/:day" element={session ? <DayPlan /> : <Navigate to="/Auth" />} />
      <Route path="/ActiveSession" element={session ? <ActiveSession /> : <Navigate to="/Auth" />} />
      <Route path="/WorkoutHistory" element={session ? <WorkoutHistory /> : <Navigate to="/Auth" />} />
      <Route path="/Profile" element={session ? <Profile /> : <Navigate to="/Auth" />} />
    </Routes>
  );
}