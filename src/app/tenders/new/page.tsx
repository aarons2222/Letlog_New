"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { 
  ArrowLeft, Camera, X, CheckCircle2, 
  Droplets, Zap, Wind, Home, Wrench, AlertTriangle,
  Send, PoundSterling, Calendar, MapPin, Building2
} from "lucide-react";

const tradeCategories = [
  { id: "plumbing", label: "Plumbing", icon: Droplets, description: "Leaks, drains, toilets, pipes" },
  { id: "electrical", label: "Electrical", icon: Zap, description: "Lights, sockets, wiring" },
  { id: "heating", label: "Heating / Gas", icon: Wind, description: "Boilers, radiators, gas work" },
  { id: "carpentry", label: "Carpentry", icon: Home, description: "Doors, windows, flooring" },
  { id: "general", label: "General Repairs", icon: Wrench, description: "Handyman, misc repairs" },
  { id: "other", label: "Other", icon: AlertTriangle, description: "Anything else" },
];

const urgencyLevels = [
  { id: "low", label: "Low", description: "Within 2 weeks", color: "border-green-300 bg-green-50" },
  { id: "medium", label: "Medium", description: "Within a week", color: "border-amber-300 bg-amber-50" },
  { id: "high", label: "Urgent", description: "Within 48 hours", color: "border-red-300 bg-red-50" },
];

// Mock properties - would come from Supabase
const mockProperties = [
  { id: "1", address: "42 Oak Lane, Flat 2, Lincoln LN1 3BT" },
  { id: "2", address: "15 High Street, Lincoln LN2 1HN" },
  { id: "3", address: "8 Mill Road, Lincoln LN3 4JP" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function NewTenderPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    property_id: "",
    trade: "",
    title: "",
    description: "",
    urgency: "medium",
    budget_min: "",
    budget_max: "",
    deadline: "",
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
    if (step === 1) return !!formData.property_id && !!formData.trade;
    if (step === 2) return formData.title.length > 5 && formData.description.length > 10;
    if (step === 3) return !!formData.budget_min && !!formData.budget_max && !!formData.deadline;
    return true;
  };

  const selectedProperty = mockProperties.find(p => p.id === formData.property_id);
  const selectedTrade = tradeCategories.find(t => t.id === formData.trade);

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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Job Posted!</h2>
          <p className="text-slate-600 mb-6">Contractors will start submitting quotes soon.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/tenders">
              <Button variant="outline">View All Jobs</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
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
              <Link href="/tenders">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Post a Job</h1>
                <p className="text-sm text-slate-500">Step {step} of 4</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
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
          {/* Step 1: Property & Trade */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              variants={containerVariants}
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-800 mb-2">
                Property & Trade
              </motion.h2>
              <motion.p variants={itemVariants} className="text-slate-600 mb-6">
                Select the property and type of work needed
              </motion.p>

              <motion.div variants={itemVariants} className="space-y-6">
                {/* Property Selection */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Which property?</Label>
                  <div className="space-y-3">
                    {mockProperties.map((property) => (
                      <motion.button
                        key={property.id}
                        onClick={() => setFormData(prev => ({ ...prev, property_id: property.id }))}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          formData.property_id === property.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.property_id === property.id ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-slate-800">{property.address}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Trade Selection */}
                <div>
                  <Label className="text-base font-medium mb-3 block">What type of work?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {tradeCategories.map((trade) => (
                      <motion.button
                        key={trade.id}
                        onClick={() => setFormData(prev => ({ ...prev, trade: trade.id }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.trade === trade.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                            formData.trade === trade.id
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <trade.icon className="w-5 h-5" />
                        </motion.div>
                        <h3 className="font-medium text-slate-800">{trade.label}</h3>
                        <p className="text-xs text-slate-500">{trade.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              variants={containerVariants}
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-800 mb-2">
                Describe the job
              </motion.h2>
              <motion.p variants={itemVariants} className="text-slate-600 mb-6">
                Help contractors understand what needs doing
              </motion.p>

              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <Label htmlFor="title">Job title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Fix leaking tap in bathroom"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-2 h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Full description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the problem, what you've tried, access details, any specific requirements..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-2 min-h-[150px]"
                  />
                </div>

                <div>
                  <Label>Urgency</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {urgencyLevels.map((level) => (
                      <motion.button
                        key={level.id}
                        onClick={() => setFormData(prev => ({ ...prev, urgency: level.id }))}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          formData.urgency === level.id
                            ? `${level.color} border-current`
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="font-medium text-slate-800 block">{level.label}</span>
                        <span className="text-xs text-slate-500">{level.description}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 3: Budget & Deadline */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              variants={containerVariants}
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-800 mb-2">
                Budget & Timeline
              </motion.h2>
              <motion.p variants={itemVariants} className="text-slate-600 mb-6">
                Set your budget range and deadline
              </motion.p>

              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Budget range</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="budget_min" className="text-sm text-slate-500">Minimum</Label>
                      <div className="relative mt-1">
                        <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="budget_min"
                          type="number"
                          placeholder="50"
                          value={formData.budget_min}
                          onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                    <span className="text-slate-400 mt-6">to</span>
                    <div className="flex-1">
                      <Label htmlFor="budget_max" className="text-sm text-slate-500">Maximum</Label>
                      <div className="relative mt-1">
                        <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="budget_max"
                          type="number"
                          placeholder="200"
                          value={formData.budget_max}
                          onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline for quotes</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      className="pl-10 h-12"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Contractors can submit quotes until this date</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              variants={containerVariants}
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-800 mb-2">
                Add photos
              </motion.h2>
              <motion.p variants={itemVariants} className="text-slate-600 mb-6">
                Photos help contractors provide accurate quotes (optional)
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
                  className="mt-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
                >
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Job Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500">Property</span>
                      <span className="font-medium text-slate-800 text-right max-w-[200px]">
                        {selectedProperty?.address || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trade</span>
                      <span className="font-medium text-slate-800 capitalize">{selectedTrade?.label || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Title</span>
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">{formData.title || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Budget</span>
                      <span className="font-medium text-green-600">
                        {formData.budget_min && formData.budget_max 
                          ? `£${formData.budget_min} - £${formData.budget_max}`
                          : "—"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deadline</span>
                      <span className="font-medium text-slate-800">{formData.deadline || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Photos</span>
                      <span className="font-medium text-slate-800">{formData.photos.length}</span>
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

          {step < 4 ? (
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
                  Post Job
                </>
              )}
            </Button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
