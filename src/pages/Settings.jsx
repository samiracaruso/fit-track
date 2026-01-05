import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { localDB } from '@/api/localDB';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Scale, Ruler, Calendar, Target, Activity, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    weight_kg: '',
    height_cm: '',
    age: '',
    gender: '',
    activity_level: '',
    goal: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Check Supabase for metrics
      const { data: metrics, error } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (metrics) {
        setFormData({
          weight_kg: metrics.weight_kg?.toString() || '',
          height_cm: metrics.height_cm?.toString() || '',
          age: metrics.age?.toString() || '',
          gender: metrics.gender || '',
          activity_level: metrics.activity_level || '',
          goal: metrics.goal || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const cleanedData = {
      user_id: user.id,
      weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
      height_cm: formData.height_cm ? Number(formData.height_cm) : null,
      age: formData.age ? Number(formData.age) : null,
      gender: formData.gender || null,
      activity_level: formData.activity_level || null,
      goal: formData.goal || null,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Save to Supabase
      const { error } = await supabase
        .from('user_metrics')
        .upsert(cleanedData);

      if (error) throw error;

      // 2. Note: If you choose to add a 'settings' table to Dexie, 
      // you would also update it here for offline calc access.
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error saving settings');
    } finally {
      setIsSaving(false);
    }
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
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (val < 25) return { label: 'Normal', color: 'text-emerald-400' };
    if (val < 30) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'Obese', color: 'text-red-400' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-zinc-400"
            onClick={() => navigate('/Home')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold uppercase italic tracking-tighter">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <User className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Body Metrics</h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">For precise tracking</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Weight (kg)</Label>
                  <Input
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="bg-black border-zinc-800 text-white h-12 rounded-xl focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Height (cm)</Label>
                  <Input
                    type="number"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    className="bg-black border-zinc-800 text-white h-12 rounded-xl focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="bg-black border-zinc-800 text-white h-12 rounded-xl focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger className="bg-black border-zinc-800 h-12 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Activity Level</Label>
                <Select value={formData.activity_level} onValueChange={(v) => setFormData({ ...formData, activity_level: v })}>
                  <SelectTrigger className="bg-black border-zinc-800 h-12 rounded-xl">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light (1-3 days)</SelectItem>
                    <SelectItem value="moderate">Moderate (3-5 days)</SelectItem>
                    <SelectItem value="active">Active (6-7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Fitness Goal</Label>
                <Select value={formData.goal} onValueChange={(v) => setFormData({ ...formData, goal: v })}>
                  <SelectTrigger className="bg-black border-zinc-800 h-12 rounded-xl">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain</SelectItem>
                    <SelectItem value="build_muscle">Build Muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </motion.div>

        {bmi && (
          <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-3xl">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Current BMI</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black italic">{bmi}</span>
              <span className={`text-xs font-black uppercase tracking-wider ${bmiCategory.color}`}>
                {bmiCategory.label}
              </span>
            </div>
          </Card>
        )}

        <Button 
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-emerald-500/20"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}