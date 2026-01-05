import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Target, TrendingUp, LogOut, Save, ArrowLeft, ChevronDown, ChevronUp, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [formData, setFormData] = useState({
    weight_kg: '',
    height_cm: '',
    age: '',
    gender: '',
    activity_level: '',
    goal: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Auth User
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // 2. Load History from Dexie (Instant)
      const cachedHistory = await localDB.getHistory();
      if (cachedHistory.length > 0) {
        setWorkouts(cachedHistory);
      }

      // 3. Load Metrics from Supabase/Local
      // Note: If you want to store body metrics in Dexie too, 
      // you could add a 'user_metrics' table to localDB.js
      const { data: metrics, error } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (metrics) {
        setFormData(metrics);
      }

      // 4. Background sync history from Supabase
      const { data: cloudSessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'completed')
        .order('date', { ascending: false });

      if (cloudSessions) {
        setWorkouts(cloudSessions);
        // Update Dexie cache
        for (const s of cloudSessions) {
          await localDB.saveSession(s);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (confirm('Delete this workout? This cannot be undone.')) {
      try {
        await supabase.from('workout_sessions').delete().eq('id', workoutId);
        await localDB.history.delete(workoutId);
        setWorkouts(workouts.filter(w => w.id !== workoutId));
        toast.success("Workout deleted");
      } catch (err) {
        toast.error("Failed to delete workout");
      }
    }
  };

  const toggleWorkoutExpand = (workoutId) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_metrics')
        .upsert({ 
          user_id: user.id, 
          ...formData,
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;
      toast.success("Metrics updated");
    } catch (error) {
      toast.error('Error saving metrics');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const calculateBMI = () => {
    if (formData.weight_kg && formData.height_cm) {
      const heightM = formData.height_cm / 100;
      return (formData.weight_kg / (heightM * heightM)).toFixed(1);
    }
    return '-';
  };

  const calculateBMR = () => {
    if (formData.weight_kg && formData.height_cm && formData.age && formData.gender) {
      let bmr;
      if (formData.gender === 'male') {
        bmr = 10 * formData.weight_kg + 6.25 * formData.height_cm - 5 * formData.age + 5;
      } else {
        bmr = 10 * formData.weight_kg + 6.25 * formData.height_cm - 5 * formData.age - 161;
      }
      return Math.round(bmr);
    }
    return '-';
  };

  if (loading && workouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-8 text-white">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl px-6 pt-8 pb-6 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-zinc-500">
          <ArrowLeft size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Profile</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/');
            }}
            className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black italic text-3xl border-4 border-black">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">{user?.user_metadata?.full_name || 'Athlete'}</h2>
            <p className="text-zinc-500 text-xs font-bold">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 mt-6 grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
          <Activity className="text-cyan-500 mb-2" size={20} />
          <p className="text-2xl font-black italic">{calculateBMI()}</p>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">BMI Index</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
          <TrendingUp className="text-purple-500 mb-2" size={20} />
          <p className="text-2xl font-black italic">{calculateBMR()}</p>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">BMR (kcal)</p>
        </div>
      </div>

      {/* Metrics Form */}
      <div className="px-6 mt-8">
        <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.2em] mb-4">Body Metrics</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-black uppercase text-zinc-600 ml-1 mb-1 block">Weight (kg)</Label>
              <Input
                type="number"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || '' })}
                className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl font-bold"
              />
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase text-zinc-600 ml-1 mb-1 block">Height (cm)</Label>
              <Input
                type="number"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || '' })}
                className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-black uppercase text-zinc-600 ml-1 mb-1 block">Age</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseFloat(e.target.value) || '' })}
                className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl font-bold"
              />
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase text-zinc-600 ml-1 mb-1 block">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl font-bold">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-cyan-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            Save Metrics
          </button>
        </div>
      </div>

      {/* Workout History */}
      <div className="px-6 mt-10">
        <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.2em] mb-4">Workout History</h3>
        
        {workouts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase">No history found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <div key={workout.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <button
                  onClick={() => toggleWorkoutExpand(workout.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-black uppercase italic tracking-tighter">{workout.day_of_week}</h4>
                      <p className="text-zinc-500 text-xs font-bold">{format(new Date(workout.date), 'MMM d, yyyy')}</p>
                    </div>
                    {expandedWorkout === workout.id ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                  </div>
                </button>

                {expandedWorkout === workout.id && (
                  <div className="px-5 pb-5 space-y-3 border-t border-zinc-800 pt-4">
                    {workout.exercises?.filter(e => e.completed).map((ex, idx) => (
                      <div key={idx} className="bg-black p-3 rounded-xl border border-zinc-800">
                        <h5 className="text-xs font-black uppercase tracking-wider text-cyan-500 mb-1">{ex.exercise_name}</h5>
                        {ex.sets?.map((set, sidx) => (
                          <p key={sidx} className="text-xs font-bold text-zinc-400">
                            Set {sidx + 1}: {set.weight_kg}kg x {set.reps}
                          </p>
                        ))}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => navigate(`/EditWorkout?id=${workout.id}`)}
                        className="flex-1 bg-zinc-800 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-cyan-500 flex items-center justify-center gap-2"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="flex-1 bg-red-500/10 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}