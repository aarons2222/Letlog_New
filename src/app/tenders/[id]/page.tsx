"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, Clock, PoundSterling, Calendar, User,
  AlertTriangle, Send, CheckCircle, FileText, Star, Shield
} from "lucide-react";
import { toast } from "sonner";

// Mock tender detail
const mockTender = {
  id: "1",
  title: "Boiler repair - E119 error",
  description: "Need a Gas Safe engineer to diagnose and repair boiler showing E119 error. No hot water for 2 days. The boiler is a Worcester Bosch Greenstar 30i, installed in 2019. Error code appeared suddenly, tried resetting but issue persists. Need someone who can diagnose and fix ASAP.",
  property_address: "42 Oak Lane, Flat 2, Lincoln LN1 3BT",
  property_type: "2-bed flat",
  trade_required: "heating",
  budget_min: 100,
  budget_max: 300,
  deadline: "2026-01-30",
  status: "open",
  quotes_count: 3,
  posted_date: "2026-01-27",
  landlord_name: "John Smith",
  landlord_rating: 4.8,
  landlord_jobs_posted: 12,
  urgency: "high",
  requirements: [
    "Gas Safe registered",
    "Experience with Worcester Bosch boilers",
    "Available within 48 hours",
  ],
  photos: [],
};

// Mock existing quotes
const mockQuotes = [
  {
    id: "1",
    contractor_name: "QuickFix Plumbing",
    amount: 175,
    message: "I can diagnose and repair. E119 usually indicates pressure or pump issue.",
    rating: 4.9,
    reviews: 45,
    available_from: "Tomorrow",
  },
  {
    id: "2", 
    contractor_name: "Heat Solutions Ltd",
    amount: 200,
    message: "Worcester Bosch specialist. Can attend same day if needed.",
    rating: 4.7,
    reviews: 32,
    available_from: "Today",
  },
];

export default function TenderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteData, setQuoteData] = useState({
    amount: "",
    description: "",
    available_from: "",
    warranty_months: "3",
  });

  const tender = mockTender; // In production, fetch by params.id

  const handleSubmitQuote = async () => {
    if (!quoteData.amount || !quoteData.description || !quoteData.available_from) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setShowQuoteDialog(false);
    toast.success("Quote submitted! The landlord will review it soon.");
  };

  const urgencyConfig = {
    high: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
    medium: { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
    low: { label: "Low Priority", color: "bg-green-100 text-green-700 border-green-200" },
  };

  const urgency = urgencyConfig[tender.urgency as keyof typeof urgencyConfig];

  // Calculate days until deadline
  const deadline = new Date(tender.deadline);
  const today = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/tenders">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Jobs
              </Button>
            </Link>
          </div>
          <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Send className="w-4 h-4" />
                Submit Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Submit Your Quote</DialogTitle>
                <DialogDescription>
                  Provide your quote for "{tender.title}"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Your Price (£) *</Label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="175"
                      value={quoteData.amount}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, amount: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Budget: £{tender.budget_min} - £{tender.budget_max}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Your Message *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your approach, experience with this type of work, and what's included in your quote..."
                    value={quoteData.description}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="available_from">Available From *</Label>
                    <Input
                      id="available_from"
                      type="date"
                      value={quoteData.available_from}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, available_from: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty">Warranty (months)</Label>
                    <Input
                      id="warranty"
                      type="number"
                      placeholder="3"
                      value={quoteData.warranty_months}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, warranty_months: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitQuote} disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Quote
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    {tender.title}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {tender.property_address}
                  </p>
                </div>
                <Badge className={`${urgency.color} border`}>
                  {tender.urgency === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {urgency.label}
                </Badge>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {tender.description}
                  </p>
                  
                  {tender.requirements.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-slate-800 dark:text-white mb-3">Requirements</h4>
                      <ul className="space-y-2">
                        {tender.requirements.map((req, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Other Quotes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Quotes Received ({mockQuotes.length})</CardTitle>
                  <CardDescription>See what others have quoted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockQuotes.map((quote) => (
                    <div 
                      key={quote.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-slate-800 dark:text-white">
                            {quote.contractor_name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            {quote.rating} ({quote.reviews} reviews)
                          </div>
                        </div>
                        <span className="text-xl font-bold text-green-600">
                          £{quote.amount}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        "{quote.message}"
                      </p>
                      <p className="text-xs text-slate-400">
                        Available: {quote.available_from}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Budget</span>
                    <span className="font-semibold text-green-600">
                      £{tender.budget_min} - £{tender.budget_max}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Deadline</span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {new Date(tender.deadline).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Time Left</span>
                    <span className={`font-medium ${daysUntil <= 2 ? "text-red-600" : "text-slate-800 dark:text-white"}`}>
                      {daysUntil > 0 ? `${daysUntil} days` : "Expired"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Property</span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {tender.property_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Quotes</span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {tender.quotes_count} received
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Landlord Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Posted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">
                        {tender.landlord_name}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {tender.landlord_rating} rating
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <p>{tender.landlord_jobs_posted} jobs posted</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={() => setShowQuoteDialog(true)}
              >
                <Send className="w-4 h-4" />
                Submit Your Quote
              </Button>
              <p className="text-xs text-center text-slate-500 mt-2">
                Free to quote • No obligation
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
