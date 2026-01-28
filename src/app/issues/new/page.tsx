"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { 
  ArrowLeft, Camera, Upload, X, CheckCircle2, 
  AlertTriangle, Droplets, Zap, Wind, Home,
  Wrench, Image as ImageIcon, Send
} from "lucide-react";

const categories = [
  { id: "plumbing", label: "Plumbing", icon: Droplets, description: "Leaks, drains, toilets, boilers" },
  { id: "electrical", label: "Electrical", icon: Zap, description: "Lights, sockets, fuse box" },
  { id: "heating", label: "Heating", icon: Wind, description: "Radiators, thermostat, boiler" },
  { id: "structural", label: "Structural", icon: Home, description: "Walls, ceilings, floors, damp" },
  { id: "appliances", label: "Appliances", icon: Wrench, description: "Provided appliances not working" },
  { id: "other", label: "Other", icon: AlertTriangle, description: "Anything else" },
];

const priorities = [
  { id: "low", label: "Low", description: "Minor issue, no rush", color: "border-slate-300 bg-slate-50" },
  { id: "medium", label: "Medium", description: "Needs attention soon", color: "border-yellow-300 bg-yellow-50" },
  { id: "high", label: "High", description: "Affecting daily life", color: "border-orange-300 bg-orange-50" },
  { id: "urgent", label: "Urgent", description: "Emergency situation", color: "border-red-300 bg-red-50" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function NewIssuePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    priority: "medium",
    photos: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, event.target?.result as string],
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const canProceed = () => {
    if (step === 1) return !!formData.category;
    if (step === 2) return formData.title.length > 5 && formData.description.length > 10;
    if (step === 3) return true;
    return false;
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Issue Reported!</h2>
          <p className="text-slate-600 mb-6">Your landlord will be notified and respond soon.</p>
          <Link href="/issues">
            <Button>View All Issues</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/issues">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Report an Issue</h1>
                <p className="text-sm text-slate-500">Step {step} of 3</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s <= step ? "bg-blue-600 w-8" : "bg-slate-200 w-4"
                  }`}
                  animate={{ width: s <= step ? 32 : 16 }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              variants={containerVariants}
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-800 mb-2">
                What type of issue?
              </motion.h2>
              <motion.p variants={itemVariants} className="text-slate-600 mb-6">
                Select the category that best describes your problem
              </motion.p>

              <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    variants={itemVariants}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      formData.category === cat.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      animate={formData.category === cat.id ? { scale: [1, 1.2, 1] } : {}}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        formData.category === cat.id
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <cat.icon className="w-5 h-5" />
                    </motion.div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{cat.label}</h3>
                    <p className="text-sm text-slate-500">{cat.description}</p>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              variants={containerVariants}
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-800 mb-2">
                Describe the issue
              </motion.h2>
              <motion.p variants={itemVariants} className="text-slate-600 mb-6">
                The more detail you provide, the faster we can help
              </motion.p>

              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <Label htmlFor="title">Short summary</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Boiler not heating water"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Full description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what's happening, when it started, and anything else relevant..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-2 min-h-[150px]"
                  />
                </div>

                <div>
                  <Label>Priority level</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {priorities.map((p) => (
                      <motion.button
                        key={p.id}
                        onClick={() => setFormData(prev => ({ ...prev, priority: p.id }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          formData.priority === p.id
                            ? `${p.color} border-current`
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="font-medium text-slate-800">{p.label}</span>
                        <span className="block text-xs text-slate-500">{p.description}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              variants={containerVariants}
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-800 mb-2">
                Add photos
              </motion.h2>
              <motion.p variants={itemVariants} className="text-slate-600 mb-6">
                Photos help us understand the issue better (optional)
              </motion.p>

              <motion.div variants={itemVariants}>
                {/* Upload area */}
                <label className="block">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <Camera className="w-8 h-8 text-slate-400" />
                    </motion.div>
                    <p className="font-medium text-slate-700">Tap to add photos</p>
                    <p className="text-sm text-slate-500">or drag and drop</p>
                  </motion.div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {/* Photo preview */}
                {formData.photos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-4 mt-6"
                  >
                    <AnimatePresence>
                      {formData.photos.map((photo, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-xl overflow-hidden group"
                        >
                          <img
                            src={photo}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Summary card */}
                <motion.div
                  variants={itemVariants}
                  className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
                >
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category</span>
                      <span className="font-medium text-slate-800 dark:text-white capitalize">{formData.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Title</span>
                      <span className="font-medium text-slate-800 dark:text-white truncate max-w-[200px]">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Priority</span>
                      <span className="font-medium text-slate-800 dark:text-white capitalize">{formData.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Photos</span>
                      <span className="font-medium text-slate-800 dark:text-white">{formData.photos.length}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between mt-8"
        >
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Issue
                </>
              )}
            </Button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
