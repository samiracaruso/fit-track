import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Scale, Ruler, Calendar, Target, Activity, Save, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    weight_kg: '',
    height_cm: '',
    age: '',
    gender: '',
    activity_level: '',
    goal: ''
  });

  const { data: userMetrics, isLoading } = useQuery({
    queryKey: ['userMetrics'],
    queryFn: async () => {
      const metrics = await base44.entities.UserMetrics.list();
      return metrics[0];
    }
  });

  useEffect(() => {
    if (userMetrics) {
      setFormData({
        weight_kg: userMetrics.weight_kg?.toString() || '',
        height_cm: userMetrics.height_cm?.toString() || '',
        age: userMetrics.age?.toString() || '',
        gender: userMetrics.gender || '',
        activity_level: userMetrics.activity_level || '',
        goal: userMetrics.goal || ''
      });
    }
  }, [userMetrics]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const cleanedData = {
        weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
        height_cm: data.height_cm ? Number(data.height_cm) : null,
        age: data.age ? Number(data.age) : null,
        gender: data.gender || null,
        activity_level: data.activity_level || null,
        goal: data.goal || null
      };

      if (userMetrics?.id) {
        return base44.entities.UserMetrics.update(userMetrics.id, cleanedData);
      } else {
        return base44.entities.UserMetrics.create(cleanedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMetrics'] });
      toast.success('Settings saved successfully');
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    await saveMutation.mutateAsync(formData);
    setIsSaving(false);
  };

  const calculateBMI = () => {
    if (formData.weight_kg && formData.height_cm) {
      const heightM = Number(formData.height_cm) / 100;
      const bmi = Number(formData.weight_kg) / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (bmi < 25) return { label: 'Normal', color: 'text-emerald-400' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'Obese', color: 'text-red-400' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-4 py-4 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button size="icon" variant="ghost" className="text-zinc-400">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-zinc-900/80 border-zinc-800 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <User className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Your Metrics</h2>
                <p className="text-sm text-zinc-400">Used for calorie calculations</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Weight */}
              <div>
                <Label className="text-zinc-400 flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Weight (kg)
                </Label>
                <Input
                  type="number"
                  placeholder="70"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Height */}
              <div>
                <Label className="text-zinc-400 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Height (cm)
                </Label>
                <Input
                  type="number"
                  placeholder="175"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Age */}
              <div>
                <Label className="text-zinc-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Age
                </Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Gender */}
              <div>
                <Label className="text-zinc-400">Gender</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Activity Level */}
              <div>
                <Label className="text-zinc-400 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Level
                </Label>
                <Select 
                  value={formData.activity_level} 
                  onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
                >
                  <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                    <SelectItem value="very_active">Very Active (intense daily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Goal */}
              <div>
                <Label className="text-zinc-400 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Fitness Goal
                </Label>
                <Select 
                  value={formData.goal} 
                  onValueChange={(value) => setFormData({ ...formData, goal: value })}
                >
                  <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="build_muscle">Build Muscle</SelectItem>
                    <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* BMI Card */}
        {bmi && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700 p-6">
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-2">Body Mass Index</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">{bmi}</span>
                {bmiCategory && (
                  <span className={`text-sm font-medium mb-1 ${bmiCategory.color}`}>
                    {bmiCategory.label}
                  </span>
                )}
              </div>
              <div className="mt-4 h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-red-500"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-zinc-500">
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </span>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}