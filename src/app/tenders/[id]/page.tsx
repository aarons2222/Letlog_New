"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/components/RoleGuard";
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
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  PoundSterling,
  Calendar,
  User,
  AlertTriangle,
  Send,
  CheckCircle,
  FileText,
  Star,
  Shield,
  Info,
  Wrench,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface TenderDetail {
  id: string;
  title: string;
  description: string;
  property_address: string;
  property_postcode: string;
  property_type: string;
  trade_required: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  status: string;
  quotes_count: number;
  posted_date: string;
  landlord_name: string;
  landlord_id: string;
  landlord_rating: number;
  landlord_jobs_posted: number;
  urgency: string;
  requirements: string[];
  photos: string[];
  // Linked issue details (for contractor context)
  issue?: {
    id: string;
    title: string;
    description: string;
    location_in_property: string;
    priority: string;
    access_instructions: string;
    preferred_times: string;
  } | null;
}

interface Quote {
  id: string;
  contractor_id: string;
  contractor_name: string;
  amount: number;
  message: string;
  rating: number;
  reviews: number;
  available_from: string;
}

type UserRole = "landlord" | "tenant" | "contractor";

function computeUrgency(deadline: string | null): string {
  if (!deadline) return "low";
  const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 2) return "high";
  if (daysUntil <= 7) return "medium";
  return "low";
}

export default function TenderDetailPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const router = useRouter();

  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("contractor");
  const [quoteData, setQuoteData] = useState({
    amount: "",
    description: "",
    available_from: "",
    warranty_months: "3",
  });

  useEffect(() => {
    async function fetchTender() {
      const supabase = createClient();
      try {
        // Get current user and role
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          setCurrentUserId(authUser.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authUser.id)
            .single();
          if (profile?.role) {
            setCurrentUserRole(profile.role as UserRole);
          }
        }

        // Fetch tender with property, landlord, and quotes
        const { data, error } = await supabase
          .from("tenders")
          .select(
            `
            *,
            properties(address_line_1, address_line_2, city, postcode, property_type, bedrooms),
            profiles:landlord_id(id, full_name),
            quotes(
              id, amount, message, status, available_start_date, created_at, contractor_id,
              profiles:contractor_id(id, full_name, contractor_profiles(average_rating, total_reviews))
            )
          `,
          )
          .eq("id", tenderId)
          .single();

        if (error || !data) {
          console.error("Error fetching tender:", error);
          toast.error("Failed to load job details");
          setIsLoading(false);
          return;
        }

        const prop = data.properties;
        const address = prop
          ? [prop.address_line_1, prop.address_line_2, prop.city, prop.postcode]
              .filter(Boolean)
              .join(", ")
          : "Unknown";
        const postcode = prop?.postcode || "";

        // Count landlord's total tenders
        const { count: jobsPosted } = await supabase
          .from("tenders")
          .select("*", { count: "exact", head: true })
          .eq("landlord_id", data.landlord_id);

        // Fetch linked issue details if issue_id exists (for contractor context)
        let issueData = null;
        if (data.issue_id) {
          const { data: issue } = await supabase
            .from("issues")
            .select(
              "id, title, description, location_in_property, priority, access_instructions, preferred_times",
            )
            .eq("id", data.issue_id)
            .single();
          if (issue) {
            issueData = {
              id: issue.id,
              title: issue.title || "",
              description: issue.description || "",
              location_in_property: issue.location_in_property || "",
              priority: issue.priority || "medium",
              access_instructions: issue.access_instructions || "",
              preferred_times: issue.preferred_times || "",
            };
          }
        }

        setTender({
          id: data.id,
          title: data.title,
          description: data.description || "",
          property_address: address,
          property_postcode: postcode,
          property_type: prop ? `${prop.bedrooms || 0}-bed ${prop.property_type}` : "Property",
          trade_required: data.trade_category || "general",
          budget_min: Number(data.budget_min) || 0,
          budget_max: Number(data.budget_max) || 0,
          deadline: data.deadline || "",
          status: data.status || "open",
          quotes_count: data.quotes?.length || 0,
          posted_date: data.created_at ? new Date(data.created_at).toISOString().split("T")[0] : "",
          landlord_name: data.profiles?.full_name || "Landlord",
          landlord_id: data.landlord_id,
          landlord_rating: 4.5,
          landlord_jobs_posted: jobsPosted || 0,
          urgency: computeUrgency(data.deadline),
          requirements: [],
          photos: data.photos || [],
          issue: issueData,
        });

        // Map quotes
        const mappedQuotes: Quote[] = (data.quotes || []).map((q: any) => ({
          id: q.id,
          contractor_id: q.contractor_id || "",
          contractor_name: q.profiles?.full_name || "Contractor",
          amount: Number(q.amount) || 0,
          message: q.message || "",
          rating: q.profiles?.contractor_profiles?.average_rating || 0,
          reviews: q.profiles?.contractor_profiles?.total_reviews || 0,
          available_from: q.available_start_date
            ? new Date(q.available_start_date).toLocaleDateString("en-GB")
            : "Flexible",
        }));

        setQuotes(mappedQuotes);
      } catch (err) {
        console.error("Error:", err);
        toast.error("Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTender();
  }, [tenderId]);

  const handleSubmitQuote = async () => {
    if (!quoteData.amount || !quoteData.description || !quoteData.available_from || !tender) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in to submit a quote");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("quotes").insert({
      tender_id: tenderId,
      contractor_id: user.id,
      amount: Number(quoteData.amount),
      message: quoteData.description,
      available_start_date: quoteData.available_from,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to submit quote");
      return;
    }

    setShowQuoteDialog(false);
    toast.success("Quote submitted! The landlord will review it soon.");
  };

  // --- Visibility helpers ---
  const isLandlord = currentUserRole === "landlord" && currentUserId === tender?.landlord_id;
  const isContractor = currentUserRole === "contractor";
  const isTenant = currentUserRole === "tenant";
  const isJobAwarded =
    tender?.status === "awarded" ||
    tender?.status === "in_progress" ||
    tender?.status === "completed";

  // #7: Quotes visibility rules
  // - Landlord: sees all quotes for their tender
  // - Contractor: sees only their own quote (not competitors')
  // - Tenant: should never see quotes
  const visibleQuotes = (() => {
    if (isTenant) return [];
    if (isLandlord) return quotes;
    if (isContractor && currentUserId) {
      return quotes.filter((q) => q.contractor_id === currentUserId);
    }
    return [];
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Job not found</p>
          <Link href="/tenders">
            <Button>Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const urgencyConfig: Record<string, { label: string; color: string }> = {
    high: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
    medium: { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
    low: { label: "Low Priority", color: "bg-green-100 text-green-700 border-green-200" },
  };

  const urgency = urgencyConfig[tender.urgency] || urgencyConfig.low;
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
          {/* Only show Submit Quote button for contractors */}
          {isContractor && (
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
                    Provide your quote for &quot;{tender.title}&quot;
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
                        onChange={(e) =>
                          setQuoteData((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Budget: £{tender.budget_min} - £{tender.budget_max}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Your Message *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your approach, experience with this type of work, and what's included in your quote..."
                      value={quoteData.description}
                      onChange={(e) =>
                        setQuoteData((prev) => ({ ...prev, description: e.target.value }))
                      }
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
                        onChange={(e) =>
                          setQuoteData((prev) => ({ ...prev, available_from: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warranty">Warranty (months)</Label>
                      <Input
                        id="warranty"
                        type="number"
                        placeholder="3"
                        value={quoteData.warranty_months}
                        onChange={(e) =>
                          setQuoteData((prev) => ({ ...prev, warranty_months: e.target.value }))
                        }
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
          )}
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    {tender.title}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {/* #1: Show area/postcode for contractors, full address for landlords */}
                    {isLandlord
                      ? tender.property_address
                      : tender.property_postcode
                        ? `${tender.property_postcode.split(" ")[0]} area`
                        : tender.property_address}
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
                      <h4 className="font-medium text-slate-800 dark:text-white mb-3">
                        Requirements
                      </h4>
                      <ul className="space-y-2">
                        {tender.requirements.map((req, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                          >
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

            {/* #1: Issue Details (visible to contractors & landlords — NOT tenant personal info) */}
            {tender.issue && (isContractor || isLandlord) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-500" />
                      Issue Details
                    </CardTitle>
                    <CardDescription>
                      Linked maintenance issue — review before quoting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Issue description */}
                    {tender.issue.description && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {tender.issue.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Property area / postcode */}
                      {tender.property_postcode && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Area / Postcode
                          </h4>
                          <p className="text-slate-700 dark:text-slate-300">
                            {tender.property_postcode}
                          </p>
                        </div>
                      )}

                      {/* Location in property */}
                      {tender.issue.location_in_property && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            Location in Property
                          </h4>
                          <p className="text-slate-700 dark:text-slate-300">
                            {tender.issue.location_in_property}
                          </p>
                        </div>
                      )}

                      {/* Priority */}
                      {tender.issue.priority && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1">Priority</h4>
                          <Badge
                            className={
                              tender.issue.priority === "urgent"
                                ? "bg-red-100 text-red-700"
                                : tender.issue.priority === "high"
                                  ? "bg-orange-100 text-orange-700"
                                  : tender.issue.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-slate-100 text-slate-600"
                            }
                          >
                            {tender.issue.priority.charAt(0).toUpperCase() +
                              tender.issue.priority.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Access constraints */}
                    {tender.issue.access_instructions && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Access Instructions
                        </h4>
                        <p className="text-sm text-amber-600 dark:text-amber-300">
                          {tender.issue.access_instructions}
                        </p>
                      </div>
                    )}

                    {/* Preferred times */}
                    {tender.issue.preferred_times && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Preferred Times
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          {tender.issue.preferred_times}
                        </p>
                      </div>
                    )}

                    {/* #1: Tenant personal details are intentionally hidden here.
                        Tenant name, email, phone are only revealed after the job is awarded. */}
                    {!isJobAwarded && isContractor && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Tenant contact details will be shared after the job is awarded.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quotes — #7: Visibility controlled by role */}
            {!isTenant && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isLandlord
                        ? `Quotes Received (${visibleQuotes.length})`
                        : `Your Quote${visibleQuotes.length > 0 ? "" : "s"}`}
                    </CardTitle>
                    <CardDescription>
                      {isLandlord
                        ? "Review all submitted quotes"
                        : visibleQuotes.length > 0
                          ? "Your submitted quote for this job"
                          : "You haven't submitted a quote yet"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {visibleQuotes.length === 0 && (
                      <p className="text-slate-500 text-sm">
                        {isLandlord
                          ? "No quotes yet — contractors will submit quotes soon."
                          : "No quote submitted yet. Be the first to submit!"}
                      </p>
                    )}
                    {visibleQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-white">
                              {isLandlord ? quote.contractor_name : "Your Quote"}
                            </h4>
                            {isLandlord && (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                {quote.rating} ({quote.reviews} reviews)
                              </div>
                            )}
                          </div>
                          <span className="text-xl font-bold text-green-600">£{quote.amount}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          &quot;{quote.message}&quot;
                        </p>
                        <p className="text-xs text-slate-400">Available: {quote.available_from}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
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
                      {tender.deadline
                        ? new Date(tender.deadline).toLocaleDateString("en-GB")
                        : "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Time Left</span>
                    <span
                      className={`font-medium ${daysUntil <= 2 ? "text-red-600" : "text-slate-800 dark:text-white"}`}
                    >
                      {tender.deadline ? (daysUntil > 0 ? `${daysUntil} days` : "Expired") : "N/A"}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CTA — only for contractors */}
            {isContractor && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button className="w-full gap-2" size="lg" onClick={() => setShowQuoteDialog(true)}>
                  <Send className="w-4 h-4" />
                  Submit Your Quote
                </Button>
                <p className="text-xs text-center text-slate-500 mt-2">
                  Free to quote • No obligation
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
