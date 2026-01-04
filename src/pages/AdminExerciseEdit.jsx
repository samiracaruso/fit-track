import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const muscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body', 'neck'];
const exerciseTypes = ['weights', 'machine', 'bodyweight', 'cardio'];

export default function AdminExerciseEdit() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const exerciseId = urlParams.get('id');
  
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
    has_reps: false,
    has_weight: false,
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
      const exercises = await base44.entities.Exercise.filter({ id: exerciseId });
      if (exercises[0]) {
        setFormData(exercises[0]);
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
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
        await base44.entities.Exercise.update(exerciseId, formData);
        toast.success('Exercise updated');
      } else {
        await base44.entities.Exercise.create(formData);
        toast.success('Exercise created');
      }
      navigate(createPageUrl('AdminExercises'));
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast.error('Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const toggleMuscleGroup = (muscle) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.includes(muscle)
        ? prev.muscle_groups.filter(m => m !== muscle)
        : [...prev.muscle_groups, muscle]
    }));
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        [type === 'image' ? 'image_url' : 'video_url']: file_url
      }));
      toast.success(`${type === 'image' ? 'Image' : 'Video'} uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    }
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
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-6 pt-8 pb-6 sticky top-0 z-10">
        <button
          onClick={() => navigate(createPageUrl('AdminExercises'))}
          className="mb-4 flex items-center gap-2 text-[#a0a0a0]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <h1 className="text-3xl font-bold text-white">
          {exerciseId ? 'Edit Exercise' : 'New Exercise'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 mt-6 space-y-6">
        {/* Name */}
        <div>
          <Label className="text-white mb-2">Exercise Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            placeholder="e.g., Bench Press"
            required
          />
        </div>

        {/* Type */}
        <div>
          <Label className="text-white mb-2">Exercise Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {exerciseTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type, is_cardio: type === 'cardio' })}
                className={`px-4 py-3 rounded-xl font-medium capitalize ${
                  formData.type === type
                    ? 'bg-[#00d4ff] text-white'
                    : 'bg-[#1a1a1a] text-[#a0a0a0] border border-[#2a2a2a]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Input Types - Checkboxes */}
        <div>
          <Label className="text-white mb-2">Tracking Inputs</Label>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
            {[
              { key: 'has_reps', label: 'Reps' },
              { key: 'has_weight', label: 'Weight (kg)' },
              { key: 'has_time', label: 'Time (minutes)' },
              { key: 'has_distance', label: 'Distance (km)' },
              { key: 'has_floors', label: 'Floors' },
              { key: 'has_steps', label: 'Steps' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[key] || false}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                  className="w-5 h-5 rounded border-[#2a2a2a] bg-[#1a1a1a] text-[#00d4ff] focus:ring-[#00d4ff]"
                />
                <span className="text-white">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Muscle Groups */}
        <div>
          <Label className="text-white mb-2">Muscle Groups *</Label>
          <div className="grid grid-cols-3 gap-2">
            {muscleGroups.map((muscle) => (
              <button
                key={muscle}
                type="button"
                onClick={() => toggleMuscleGroup(muscle)}
                className={`px-3 py-2 rounded-xl text-sm font-medium capitalize ${
                  formData.muscle_groups.includes(muscle)
                    ? 'bg-[#00d4ff] text-white'
                    : 'bg-[#1a1a1a] text-[#a0a0a0] border border-[#2a2a2a]'
                }`}
              >
                {muscle.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <Label className="text-white mb-2">Equipment</Label>
          <Input
            value={formData.equipment}
            onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            placeholder="e.g., Barbell, Dumbbells, None"
          />
        </div>

        {/* Description */}
        <div>
          <Label className="text-white mb-2">Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-24"
            placeholder="How to perform the exercise..."
          />
        </div>

        {/* Calories */}
        <div>
          <Label className="text-white mb-2">Calories per Minute</Label>
          <Input
            type="number"
            step="0.5"
            value={formData.calories_per_minute}
            onChange={(e) => setFormData({ ...formData, calories_per_minute: parseFloat(e.target.value) })}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
          />
        </div>

        {/* Image Upload */}
        <div>
          <Label className="text-white mb-2">Image</Label>
          {formData.image_url && (
            <div className="relative w-full h-48 mb-2 rounded-xl overflow-hidden">
              <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image_url: '' })}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
          <label className="w-full bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-8 h-8 text-[#a0a0a0] mb-2" />
            <span className="text-[#a0a0a0] text-sm">Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'image')}
              className="hidden"
            />
          </label>
        </div>

        {/* Video Upload */}
        <div>
          <Label className="text-white mb-2">Video</Label>
          {formData.video_url && (
            <div className="relative w-full h-48 mb-2 rounded-xl overflow-hidden">
              <video src={formData.video_url} className="w-full h-full object-cover" loop muted playsInline />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, video_url: '' })}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
          <label className="w-full bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-8 h-8 text-[#a0a0a0] mb-2" />
            <span className="text-[#a0a0a0] text-sm">Upload Video</span>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleFileUpload(e, 'video')}
              className="hidden"
            />
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] text-white py-6 rounded-xl font-bold text-lg"
        >
          {saving ? 'Saving...' : exerciseId ? 'Update Exercise' : 'Create Exercise'}
        </Button>
      </form>
    </div>
  );
}