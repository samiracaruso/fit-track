import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { User, Activity, Target, TrendingUp, LogOut, Save, ArrowLeft, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState(null);
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
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const userMetrics = await base44.entities.UserMetrics.filter({ created_by: currentUser.email });
      if (userMetrics.length > 0) {
        setMetrics(userMetrics[0]);
        setFormData(userMetrics[0]);
      }

      const sessions = await base44.entities.WorkoutSession.filter(
        { created_by: currentUser.email, status: 'completed' },
        '-created_date',
        100
      );
      setWorkouts(sessions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (confirm('Delete this workout? This cannot be undone.')) {
      await base44.entities.WorkoutSession.delete(workoutId);
      loadData();
    }
  };

  const toggleWorkoutExpand = (workoutId) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (metrics) {
        await base44.entities.UserMetrics.update(metrics.id, formData);
      } else {
        await base44.entities.UserMetrics.create(formData);
      }
      await loadData();
    } catch (error) {
      console.error('Error saving metrics:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00d4ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-[#a0a0a0]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-red-400 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.full_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#00d4ff]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-white font-bold text-3xl">
              {user?.full_name?.[0] || 'U'}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h2>
            <p className="text-[#a0a0a0]">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {formData.weight_kg && (
        <div className="px-6 mt-6 grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <Activity className="w-6 h-6 text-[#00d4ff] mb-2" />
            <p className="text-2xl font-bold text-white">{calculateBMI()}</p>
            <p className="text-[#a0a0a0] text-sm">BMI</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <TrendingUp className="w-6 h-6 text-[#7c3aed] mb-2" />
            <p className="text-2xl font-bold text-white">{calculateBMR()}</p>
            <p className="text-[#a0a0a0] text-sm">BMR (kcal/day)</p>
          </div>
        </div>
      )}

      {/* Metrics Form */}
      <div className="px-6 mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Body Metrics</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#a0a0a0] mb-2 block">Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || '' })}
                placeholder="70"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
              />
            </div>
            <div>
              <Label className="text-[#a0a0a0] mb-2 block">Height (cm)</Label>
              <Input
                type="number"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || '' })}
                placeholder="175"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#a0a0a0] mb-2 block">Age</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseFloat(e.target.value) || '' })}
                placeholder="25"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
              />
            </div>
            <div>
              <Label className="text-[#a0a0a0] mb-2 block">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[#a0a0a0] mb-2 block">Activity Level</Label>
            <Select value={formData.activity_level} onValueChange={(value) => setFormData({ ...formData, activity_level: value })}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
                <SelectValue placeholder="Select your activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                <SelectItem value="very_active">Very Active (2x per day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[#a0a0a0] mb-2 block">Fitness Goal</Label>
            <Select value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value })}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lose_weight">Lose Weight</SelectItem>
                <SelectItem value="maintain">Maintain Weight</SelectItem>
                <SelectItem value="build_muscle">Build Muscle</SelectItem>
                <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 glow active:scale-98 transition-transform disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Metrics
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 mt-8">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
          <h4 className="text-white font-bold mb-2">About Calculations</h4>
          <p className="text-[#a0a0a0] text-sm leading-relaxed">
            BMI is a measure of body fat based on height and weight. BMR is your Basal Metabolic Rate - 
            the number of calories your body needs at rest. These metrics help estimate calories burned 
            during workouts for better tracking.
          </p>
        </div>
      </div>

      {/* Workout History */}
      <div className="px-6 mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Workout History</h3>
        
        {workouts.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 text-center">
            <p className="text-[#a0a0a0]">No workouts yet. Start tracking your fitness journey!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleWorkoutExpand(workout.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-bold text-lg capitalize">{workout.day_of_week}</h4>
                      <p className="text-[#a0a0a0] text-sm">{format(new Date(workout.date), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedWorkout === workout.id ? (
                        <ChevronUp className="w-6 h-6 text-[#a0a0a0]" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-[#a0a0a0]" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <span className="text-[#a0a0a0]">
                      {workout.exercises?.filter(e => e.completed).length || 0} exercises
                    </span>
                    {workout.total_calories_burned > 0 && (
                      <span className="text-[#00d4ff]">
                        {Math.round(workout.total_calories_burned)} kcal
                      </span>
                    )}
                  </div>
                </button>

                {expandedWorkout === workout.id && (
                  <div className="border-t border-[#2a2a2a] p-4 space-y-3">
                    {/* Exercises */}
                    {workout.exercises?.filter(e => e.completed).map((ex, idx) => (
                      <div key={idx} className="bg-[#242424] rounded-xl p-3">
                        <h5 className="text-white font-bold mb-2">{ex.exercise_name}</h5>
                        {ex.sets?.map((set, sidx) => (
                          <div key={sidx} className="text-[#a0a0a0] text-sm">
                            Set {sidx + 1}: {set.reps > 0 && `${set.reps} reps`}
                            {set.weight_kg > 0 && ` × ${set.weight_kg}kg`}
                            {set.duration_minutes > 0 && ` ${set.duration_minutes} min`}
                            {set.distance_km > 0 && ` ${set.distance_km} km`}
                          </div>
                        ))}
                        {ex.notes && (
                          <p className="text-[#a0a0a0] text-sm mt-2 italic">{ex.notes}</p>
                        )}
                      </div>
                    ))}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => navigate(createPageUrl(`EditWorkout?id=${workout.id}`))}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#242424] rounded-lg text-[#00d4ff] text-sm font-medium active:scale-95 transition-transform"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 rounded-lg text-red-400 text-sm font-medium active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
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