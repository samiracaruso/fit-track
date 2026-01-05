import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { localDB, db } from '@/api/localDB';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Trash2, Dumbbell, X } from "lucide-react";
import { toast } from 'sonner';

export default function DayPlan() {
  const { day } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    // Safety check: if 'day' is missing, go back
    if (!day) {
      navigate('/WeeklyPlan');
      return;
    }

    async function init() {
      const plan = await localDB.getPlanByDay(day);
      const allEx = await localDB.getAllExercises();
      setExercises(plan);
      setCatalog(allEx);
    }
    init();
  }, [day, navigate]);

  const addExerciseToPlan = async (baseEx) => {
    const newEntry = {
      day_of_week: day.toLowerCase(),
      exercise_id: baseEx.id,
      exercise_name: baseEx.name,
      target_sets: 3,
      target_reps: 10,
      target_weight_kg: 0
    };

    const id = await db.plans.add(newEntry);
    await localDB.addToQueue('plans', 'INSERT', { ...newEntry, id });
    setExercises([...exercises, { ...newEntry, id }]);
    setIsAdding(false);
    toast.success(`Added ${baseEx.name}`);
  };

  // ... rest of removeExercise and return logic same as before ...
  // (Full file content remains aligned with the modal logic we built)
}