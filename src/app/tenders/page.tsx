"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { 
  ArrowLeft, Briefcase, Search, MapPin, Clock, PoundSterling,
  Wrench, Zap, Droplets, Wind, Home, Filter, Star, Calendar,
  ChevronRight, AlertTriangle, Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

// Trade categories
const tradeCategories: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  plumbing: { label: "Plumbing", icon: Droplets, color: "blue" },
  electrical: { label: "Electrical", icon: Zap, color: "yellow" },
  heating: { label: "Heating/Gas", icon: Wind, color: "orange" },
  carpentry: { label: "Carpentry", icon: Home, color: "amber" },
  general_maintenance: { label: "General Repairs", icon: Wrench, color: "slate" },
};

interface Tender {
  id: string;
  title: string;
  description: string;
  property_address: string;
  trade_required: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  status: string;
  quotes_count: number;
  posted_date: string;
  landlord_name: string;
  urgency: string;
}

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

function computeUrgency(deadline: string | null): string {
  if (!deadline) return 'low';
  const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 2) return 'high';
  if (daysUntil <= 7) return 'medium';
  return 'low';
}

export default function TendersPage() {
  const { userId, role } = useRole();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrade, setFilterTrade] = useState<string | null>(null);
  const [filterUrgency, setFilterUrgency] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTenders() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('tenders')
          .select(`
            *,
            properties(address_line_1, address_line_2, city, postcode),
            profiles:landlord_id(full_name),
            quotes(id)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tenders:', error);
          toast.error('Failed to load jobs');
          setIsLoading(false);
          return;
        }

        const mapped: Tender[] = (data || []).map((t: any) => {
          const prop = t.properties;
          const address = prop
            ? [prop.address_line_1, prop.address_line_2, prop.city, prop.postcode].filter(Boolean).join(', ')
            : 'Unknown location';

          return {
            id: t.id,
            title: t.title,
            description: t.description || '',
            property_address: address,
            trade_required: t.trade_category || 'general_maintenance',
            budget_min: Number(t.budget_min) || 0,
            budget_max: Number(t.budget_max) || 0,
            deadline: t.deadline || '',
            status: t.status || 'open',
            quotes_count: t.quotes?.length || 0,
            posted_date: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '',
            landlord_name: t.profiles?.full_name || 'Landlord',
            urgency: computeUrgency(t.deadline),
          };
        });

        setTenders(mapped);
      } catch (err) {
        console.error('Error:', err);
        toast.error('Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenders();
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function fetchTenders() {
      const supabase = createClient();
      try {
        let query = supabase
          .from("tenders")
          .select(`
            *,
            properties (
              id, address_line_1, address_line_2, city, postcode
            ),
            profiles!tenders_landlord_id_fkey (
              full_name
            )
          `)
          .order("created_at", { ascending: false });

        // Contractors see only open tenders, landlords see their own
        if (role === "contractor") {
          query = query.eq("status", "open");
        } else if (role === "landlord") {
          query = query.eq("landlord_id", userId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // For each tender, count quotes
        const enriched: Tender[] = await Promise.all(
          (data || []).map(async (t: any) => {
            const { count: quotesCount } = await supabase
              .from("quotes")
              .select("*", { count: "exact", head: true })
              .eq("tender_id", t.id);

            const prop = t.properties;
            const address = prop
              ? [prop.address_line_1, prop.address_line_2, prop.city, prop.postcode]
                  .filter(Boolean)
                  .join(", ")
              : "Unknown property";

            return {
              id: t.id,
              title: t.title || "Untitled Job",
              description: t.description || "",
              property_address: address,
              trade_required: t.trade_required || "general",
              budget_min: t.budget_min || 0,
              budget_max: t.budget_max || 0,
              deadline: t.deadline || "",
              status: t.status || "open",
              quotes_count: quotesCount || 0,
              posted_date: t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : "",
              landlord_name: t.profiles?.full_name || "Unknown",
              urgency: t.urgency || "medium",
            };
          })
        );

        setTenders(enriched);
      } catch (err) {
        console.error("Error fetching tenders:", err);
        toast.error("Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenders();
  }, [userId, role]);

  const filteredTenders = tenders.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.property_address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTrade = !filterTrade || t.trade_required === filterTrade;
    const matchesUrgency = !filterUrgency || t.urgency === filterUrgency;
    
    return matchesSearch && matchesTrade && matchesUrgency;
  });

  // Stats
  const stats = {
    total: tenders.length,
    heating: tenders.filter(t => t.trade_required === "heating").length,
    plumbing: tenders.filter(t => t.trade_required === "plumbing").length,
    electrical: tenders.filter(t => t.trade_required === "electrical").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 py-8 space-y-4">
          {[...Array(4)].map((_, i) => (
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
              <Briefcase className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Available Jobs</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/tenders/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Post Job
              </Button>
            </Link>
            <Link href="/quotes">
              <Button variant="outline" className="gap-2">
                My Quotes
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
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
              <p className="text-sm text-slate-500">Open Jobs</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.heating}</p>
              <p className="text-sm text-slate-500">Heating/Gas</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.plumbing}</p>
              <p className="text-sm text-slate-500">Plumbing</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.electrical}</p>
              <p className="text-sm text-slate-500">Electrical</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTrade || "all"} onValueChange={(v) => setFilterTrade(v === "all" ? null : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Trades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {Object.entries(tradeCategories).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterUrgency || "all"} onValueChange={(v) => setFilterUrgency(v === "all" ? null : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">Urgent</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Tender List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredTenders.map((tender) => (
              <TenderCard key={tender.id} tender={tender} />
            ))}
          </AnimatePresence>

          {filteredTenders.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No jobs match your filters</p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function TenderCard({ tender }: { tender: Tender }) {
  const trade = tradeCategories[tender.trade_required] || { label: tender.trade_required, icon: Wrench, color: "slate" };
  const Icon = trade.icon;

  const urgencyConfig: Record<string, { label: string; color: string }> = {
    high: { label: "Urgent", color: "bg-red-100 text-red-700" },
    medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
    low: { label: "Low", color: "bg-green-100 text-green-700" },
  };

  const urgency = urgencyConfig[tender.urgency] || urgencyConfig.low;

  // Calculate days until deadline
  const deadline = new Date(tender.deadline);
  const today = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600",
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ y: -2 }}
    >
      <Link href={`/tenders/${tender.id}`}>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/70 dark:bg-slate-900/70 backdrop-blur cursor-pointer group">
          <CardContent className="p-5">
            <div className="flex gap-4">
              {/* Trade Icon */}
              <div className={`w-14 h-14 rounded-xl ${colorClasses[trade.color] || colorClasses.slate} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                      {tender.title}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {tender.property_address}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={urgency.color}>
                      {tender.urgency === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {urgency.label}
                    </Badge>
                    <span className="text-xs text-slate-400">{tender.quotes_count} quotes</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                  {tender.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                    <PoundSterling className="w-4 h-4" />
                    £{tender.budget_min} - £{tender.budget_max}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    {tender.deadline ? (daysUntil > 0 ? `${daysUntil} days left` : "Deadline passed") : "No deadline"}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-4 h-4" />
                    Posted {tender.posted_date}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex items-center">
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
