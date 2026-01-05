import Layout from "./Layout.jsx";

import ActiveSession from "./ActiveSession";

import ActiveWorkout from "./ActiveWorkout";

import Admin from "./Admin";

import AdminExerciseEdit from "./AdminExerciseEdit";

import AdminExercises from "./AdminExercises";

import Calendar from "./Calendar";

import DayPlan from "./DayPlan";

import EditWorkout from "./EditWorkout";

import Home from "./Home";

import Profile from "./Profile";

import Settings from "./Settings";

import StartWorkout from "./StartWorkout";

import WeeklyPlan from "./WeeklyPlan";

import WorkoutHistory from "./WorkoutHistory";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    ActiveSession: ActiveSession,
    
    ActiveWorkout: ActiveWorkout,
    
    Admin: Admin,
    
    AdminExerciseEdit: AdminExerciseEdit,
    
    AdminExercises: AdminExercises,
    
    Calendar: Calendar,
    
    DayPlan: DayPlan,
    
    EditWorkout: EditWorkout,
    
    Home: Home,
    
    Profile: Profile,
    
    Settings: Settings,
    
    StartWorkout: StartWorkout,
    
    WeeklyPlan: WeeklyPlan,
    
    WorkoutHistory: WorkoutHistory,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/ActiveSession" element={<ActiveSession />} />
                
                <Route path="/ActiveWorkout" element={<ActiveWorkout />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/AdminExerciseEdit" element={<AdminExerciseEdit />} />
                
                <Route path="/AdminExercises" element={<AdminExercises />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/DayPlan" element={<DayPlan />} />
                
                <Route path="/EditWorkout" element={<EditWorkout />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/StartWorkout" element={<StartWorkout />} />
                
                <Route path="/WeeklyPlan" element={<WeeklyPlan />} />
                
                <Route path="/WorkoutHistory" element={<WorkoutHistory />} />
                
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