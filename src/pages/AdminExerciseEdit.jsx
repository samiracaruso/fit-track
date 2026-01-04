import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const muscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body', 'neck'];
const exerciseTypes = ['weights', 'machine', 'bodyweight', 'cardio'];

export default function AdminExerciseEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exerciseId = searchParams.get('id');
  
  const [loading, setLoading] = useState(!!exerciseId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'weights',
    muscle_groups: [],
    equipment: '',
    description: '',
    image_url: '',
    video_url: '',
    calories_per_minute: 5,
    is_cardio: false,
    has_reps: true,
    has_weight: true,
    has_time: false,
    has_distance: false,
    has_floors: false,
    has_steps: false
  });

  useEffect(() => {
    if (exerciseId) {
      loadExercise();
    }
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();
      
      if (error) throw error;
      if (data) setFormData(data);
    } catch (error) {
      toast.error('Could not load exercise details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.muscle_groups.length === 0) {
      toast.error('Name and at least one muscle group required');
      return;
    }
    
    setSaving(true);
    try {
      if (exerciseId) {
        const { error } = await supabase
          .from('exercises')
          .update(formData)
          .eq('id', exerciseId);
        if (error) throw error;
        toast.success('Exercise updated');
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert([formData]);
        if (error) throw error;
        toast.success('Exercise created');
      }
      
      // Clear the local exercises cache so the app fetches the fresh list
      localStorage.removeItem('exercises_cache');
      navigate('/AdminExercises');
    } catch (error) {
      toast.error('Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const loadingToast = toast.loading(`Uploading ${type}...`);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('exercise-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('exercise-media')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [type === 'image' ? 'image_url' : 'video_url']: data.publicUrl
      }));
      
      toast.dismiss(loadingToast);
      toast.success('Upload complete');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Upload failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-cyan-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-12 text-white">
      {/* Sticky Header */}
      <div className="bg-black/80 backdrop-blur-md px-6 pt-8 pb-4 sticky top-0 z-20 border-b border-zinc-900">
        <button onClick={() => navigate('/AdminExercises')} className="mb-4 flex items-center gap-2 text-zinc-400">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">
          {exerciseId ? 'Edit Exercise' : 'New Exercise'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="px-6 mt-6 space-y-8">
        {/* Name Input */}
        <section className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-zinc-500">Exercise Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-zinc-900 border-zinc-800 h-12 text-lg focus:ring-cyan-500"
            placeholder="e.g. Incline DB Press"
          />
        </section>

        {/* Type Selection */}
        <section className="space-y-3">
          <Label className="uppercase text-[10px] font-black tracking-widest text-zinc-500">Category</Label>
          <div className="grid grid-cols-2 gap-2">
            {exerciseTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type, is_cardio: type === 'cardio' })}
                className={`py-3 rounded-xl text-sm font-bold capitalize transition-all border ${
                  formData.type === type ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* Tracking Options */}
        <section className="space-y-3">
          <Label className="uppercase text-[10px] font-black tracking-widest text-zinc-500">Trackable Metrics</Label>
          <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-900">
            {[
              { key: 'has_reps', label: 'Reps' },
              { key: 'has_weight', label: 'Weight' },
              { key: 'has_time', label: 'Time' },
              { key: 'has_distance', label: 'Distance' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData[key] || false}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                  className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-0"
                />
                <span className={`text-sm font-bold ${formData[key] ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Muscle Groups */}
        <section className="space-y-3">
          <Label className="uppercase text-[10px] font-black tracking-widest text-zinc-500">Target Muscles</Label>
          <div className="flex flex-wrap gap-2">
            {muscleGroups.map((muscle) => {
              const active = formData.muscle_groups.includes(muscle);
              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    muscle_groups: active ? prev.muscle_groups.filter(m => m !== muscle) : [...prev.muscle_groups, muscle]
                  }))}
                  className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-tight transition-all ${
                    active ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                  }`}
                >
                  {muscle.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </section>

        {/* Media Uploads */}
        <section className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
             <Label className="uppercase text-[10px] font-black text-zinc-500">Image</Label>
             <div className="aspect-square bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center relative overflow-hidden">
                {formData.image_url ? (
                  <>
                    <img src={formData.image_url} className="w-full h-full object-cover" />
                    <button onClick={() => setFormData({...formData, image_url: ''})} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"><X size={12}/></button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="text-zinc-700 mb-1" />
                    <span className="text-[10px] text-zinc-700 uppercase font-black">Upload</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
                  </label>
                )}
             </div>
          </div>
          <div className="space-y-2">
             <Label className="uppercase text-[10px] font-black text-zinc-500">Video</Label>
             <div className="aspect-square bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center relative overflow-hidden">
                {formData.video_url ? (
                  <>
                    <video src={formData.video_url} className="w-full h-full object-cover" muted loop autoPlay />
                    <button onClick={() => setFormData({...formData, video_url: ''})} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"><X size={12}/></button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="text-zinc-700 mb-1" />
                    <span className="text-[10px] text-zinc-700 uppercase font-black">Upload</span>
                    <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" />
                  </label>
                )}
             </div>
          </div>
        </section>

        {/* Description */}
        <section className="space-y-2">
          <Label className="uppercase text-[10px] font-black text-zinc-500">Instructions</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-zinc-900 border-zinc-800 min-h-[120px]"
            placeholder="Focus on the squeeze at the top..."
          />
        </section>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-cyan-500 text-black h-16 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg shadow-cyan-500/20"
        >
          {saving ? 'Synchronizing...' : exerciseId ? 'Update Exercise' : 'Create Exercise'}
        </Button>
      </form>
    </div>
  );
}