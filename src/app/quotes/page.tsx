/**
 * #7 — Quotes visibility rules:
 * - Contractor view (this page): shows ONLY their own quotes (filtered by contractor_id)
 * - Landlord view: sees all quotes on their tenders (handled in tenders/[id]/page.tsx)
 * - Tenant: should NEVER see quotes (no nav link, and tenders/[id] hides quotes for tenants)
 *
 * #4 — Document access (TODO):
 * When quote attachments (e.g. itemised breakdowns, certifications) are added,
 * only the quote author and the tender's landlord should be able to view them.
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  ArrowLeft, FileText, PoundSterling, Clock, CheckCircle, 
  XCircle, AlertCircle, MapPin, Calendar, ChevronRight, Briefcase
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

interface QuoteItem {
  id: string;
  tender_id: string;
  tender_title: string;
  property_address: string;
  amount: number;
  description: string;
  status: string;
  submitted_date: string;
  landlord_name: string;
  warranty_months: number;
  accepted_date?: string;
  rejection_reason?: string;
  completed_date?: string;
  paid?: boolean;
  review_rating?: number;
  review_text?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; description: string }> = {
  pending: { 
    label: "Pending", 
    color: "bg-amber-100 text-amber-700", 
    icon: Clock,
    description: "Awaiting landlord response"
  },
  submitted: { 
    label: "Pending", 
    color: "bg-amber-100 text-amber-700", 
    icon: Clock,
    description: "Awaiting landlord response"
  },
  accepted: { 
    label: "Accepted", 
    color: "bg-green-100 text-green-700", 
    icon: CheckCircle,
    description: "Ready to start work"
  },
  rejected: { 
    label: "Not Selected", 
    color: "bg-slate-100 text-slate-600", 
    icon: XCircle,
    description: "Another quote was chosen"
  },
  withdrawn: { 
    label: "Withdrawn", 
    color: "bg-slate-100 text-slate-500", 
    icon: XCircle,
    description: "Quote withdrawn"
  },
  completed: { 
    label: "Completed", 
    color: "bg-blue-100 text-blue-700", 
    icon: CheckCircle,
    description: "Job finished"
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Map DB status to UI status
function mapQuoteStatus(dbStatus: string): string {
  if (dbStatus === 'submitted') return 'pending';
  return dbStatus;
}

export default function QuotesPage() {
  const { userId, role } = useRole();
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotes() {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('quotes')
          .select(`
            *,
            tenders(
              id, title, landlord_id,
              properties(address_line_1, address_line_2, city, postcode),
              profiles:landlord_id(full_name)
            )
          `)
          .eq('contractor_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching quotes:', error);
          toast.error('Failed to load quotes');
          setIsLoading(false);
          return;
        }

        const mapped: QuoteItem[] = (data || []).map((q: any) => {
          const tender = q.tenders;
          const prop = tender?.properties;
          const address = prop
            ? [prop.address_line_1, prop.address_line_2, prop.city, prop.postcode].filter(Boolean).join(', ')
            : 'Unknown';

          return {
            id: q.id,
            tender_id: q.tender_id,
            tender_title: tender?.title || 'Job',
            property_address: address,
            amount: Number(q.amount) || 0,
            description: q.message || q.breakdown || '',
            status: mapQuoteStatus(q.status),
            submitted_date: q.created_at ? new Date(q.created_at).toISOString().split('T')[0] : '',
            landlord_name: tender?.profiles?.full_name || 'Landlord',
            warranty_months: 0,
          };
        });

        setQuotes(mapped);
      } catch (err) {
        console.error('Error:', err);
        toast.error('Failed to load quotes');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuotes();
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function fetchQuotes() {
      const supabase = createClient();
      try {
        let query = supabase
          .from("quotes")
          .select(`
            *,
            tenders (
              id, title, property_id,
              properties (
                address_line_1, address_line_2, city, postcode
              )
            ),
            profiles!quotes_contractor_id_fkey (
              full_name
            )
          `)
          .order("created_at", { ascending: false });

        // Contractors see their quotes, landlords see quotes on their tenders
        if (role === "contractor") {
          query = query.eq("contractor_id", userId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const mapped: QuoteItem[] = (data || []).map((q: any) => {
          const tender = q.tenders;
          const prop = tender?.properties;
          const address = prop
            ? [prop.address_line_1, prop.address_line_2, prop.city, prop.postcode]
                .filter(Boolean)
                .join(", ")
            : "Unknown property";

          return {
            id: q.id,
            tender_id: q.tender_id || "",
            tender_title: tender?.title || "Unknown Job",
            property_address: address,
            amount: q.amount || 0,
            description: q.description || q.message || "",
            status: q.status || "pending",
            submitted_date: q.created_at ? new Date(q.created_at).toISOString().split("T")[0] : "",
            landlord_name: q.profiles?.full_name || "Unknown",
            warranty_months: q.warranty_months || 0,
            accepted_date: q.accepted_date,
            rejection_reason: q.rejection_reason,
            completed_date: q.completed_date,
            paid: q.paid || false,
            review_rating: q.review_rating,
            review_text: q.review_text,
          };
        });

        setQuotes(mapped);
      } catch (err) {
        console.error("Error fetching quotes:", err);
        toast.error("Failed to load quotes");
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuotes();
  }, [userId, role]);

  const filteredQuotes = filterStatus 
    ? quotes.filter(q => q.status === filterStatus)
    : quotes;

  // Stats
  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === "pending").length,
    accepted: quotes.filter(q => q.status === "accepted").length,
    completed: quotes.filter(q => q.status === "completed").length,
  };

  // Calculate totals
  const totalEarnings = quotes
    .filter(q => q.status === "completed" && q.paid)
    .reduce((sum, q) => sum + q.amount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 py-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Quotes</h1>
            </div>
          </div>
          <Link href="/tenders">
            <Button className="gap-2">
              <Briefcase className="w-4 h-4" />
              Find Jobs
            </Button>
          </Link>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Quotes</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
              <p className="text-sm text-slate-500">Active Jobs</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">£{totalEarnings}</p>
              <p className="text-sm text-green-100">Earned</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {[
            { value: null, label: "All" },
            { value: "pending", label: "Pending" },
            { value: "accepted", label: "Accepted" },
            { value: "completed", label: "Completed" },
            { value: "rejected", label: "Not Selected" },
          ].map((filter) => (
            <Button
              key={filter.value || "all"}
              variant={filterStatus === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </motion.div>

        {/* Quotes List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredQuotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </AnimatePresence>

          {filteredQuotes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No quotes found</p>
              <Link href="/tenders">
                <Button className="gap-2">
                  <Briefcase className="w-4 h-4" />
                  Browse Available Jobs
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function QuoteCard({ quote }: { quote: QuoteItem }) {
  const status = statusConfig[quote.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ y: -2 }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Status Icon */}
            <div className={`w-12 h-12 rounded-xl ${status.color.replace("text-", "bg-").split(" ")[0]} flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className={`w-6 h-6 ${status.color.split(" ")[1]}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">
                    {quote.tender_title}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {quote.property_address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">£{quote.amount}</p>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                &quot;{quote.description}&quot;
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Submitted {quote.submitted_date}
                </span>
                <span>For: {quote.landlord_name}</span>
                {quote.warranty_months > 0 && (
                  <span>{quote.warranty_months}mo warranty</span>
                )}
              </div>

              {/* Status-specific info */}
              {quote.status === "accepted" && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    ✅ Quote accepted! Contact the landlord to arrange the work.
                  </p>
                </div>
              )}

              {quote.status === "rejected" && quote.rejection_reason && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Feedback: {quote.rejection_reason}
                  </p>
                </div>
              )}

              {quote.status === "completed" && quote.review_text && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(quote.review_rating || 0)].map((_, i) => (
                      <span key={i} className="text-amber-500">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    &quot;{quote.review_text}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              <Link href={`/tenders/${quote.tender_id}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  View Job
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
