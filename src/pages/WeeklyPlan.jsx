import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus, ChevronRight, Dumbbell, ArrowLeft } from 'lucide-react';

export default function WeeklyPlan() {
  const navigate = useNavigate();
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const currentUser = await base44.auth.me();
      const plans = await base44.entities.WorkoutPlan.filter({ created_by: currentUser.email });
      setWorkoutPlans(plans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayPlans = (day) => {
    return workoutPlans.filter(p => p.day_of_week === day).sort((a, b) => a.order - b.order);
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
        <h1 className="text-3xl font-bold text-white mb-2">Weekly Plan</h1>
        <p className="text-[#a0a0a0]">Plan your workout routine for the week</p>
      </div>

      {/* Days List */}
      <div className="px-6 mt-6 space-y-4">
        {daysOfWeek.map((day) => {
          const plans = getDayPlans(day);
          const exerciseCount = plans.length;
          
          return (
            <button
              key={day}
              onClick={() => navigate(createPageUrl(`DayPlan?day=${day}`))}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 active:scale-98 transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    exerciseCount > 0 ? 'bg-[#00d4ff]/10' : 'bg-[#2a2a2a]'
                  }`}>
                    <Dumbbell className={`w-7 h-7 ${exerciseCount > 0 ? 'text-[#00d4ff]' : 'text-[#a0a0a0]'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-bold text-lg capitalize">{day}</h3>
                    <p className="text-[#a0a0a0] text-sm">
                      {exerciseCount === 0 ? 'Rest day' : `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {exerciseCount > 0 && (
                    <div className="flex -space-x-2 mr-2">
                      {plans.slice(0, 3).map((plan, idx) => (
                        plan.exercise_image_url ? (
                          <img
                            key={idx}
                            src={plan.exercise_image_url}
                            alt={plan.exercise_name}
                            className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] object-cover"
                          />
                        ) : (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-full bg-[#242424] border-2 border-[#1a1a1a] flex items-center justify-center text-xs text-[#a0a0a0]"
                          >
                            {plan.exercise_name[0]}
                          </div>
                        )
                      ))}
                      {exerciseCount > 3 && (
                        <div className="w-8 h-8 rounded-full bg-[#242424] border-2 border-[#1a1a1a] flex items-center justify-center text-xs text-[#00d4ff]">
                          +{exerciseCount - 3}
                        </div>
                      )}
                    </div>
                  )}
                  <ChevronRight className="w-6 h-6 text-[#a0a0a0]" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}