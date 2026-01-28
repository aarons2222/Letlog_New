"use client";

import { useState } from "react";
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

// Trade categories
const tradeCategories = {
  plumbing: { label: "Plumbing", icon: Droplets, color: "blue" },
  electrical: { label: "Electrical", icon: Zap, color: "yellow" },
  heating: { label: "Heating/Gas", icon: Wind, color: "orange" },
  carpentry: { label: "Carpentry", icon: Home, color: "amber" },
  general: { label: "General Repairs", icon: Wrench, color: "slate" },
};

// Mock tenders
const mockTenders = [
  {
    id: "1",
    title: "Boiler repair - E119 error",
    description: "Need a Gas Safe engineer to diagnose and repair boiler showing E119 error. No hot water for 2 days.",
    property_address: "42 Oak Lane, Flat 2, Lincoln",
    trade_required: "heating",
    budget_min: 100,
    budget_max: 300,
    deadline: "2026-01-30",
    status: "open",
    quotes_count: 3,
    posted_date: "2026-01-27",
    landlord_name: "John Smith",
    urgency: "high",
  },
  {
    id: "2",
    title: "Replace bathroom extractor fan",
    description: "Extractor fan in main bathroom has stopped working. Need replacement and installation.",
    property_address: "15 High Street, Lincoln",
    trade_required: "electrical",
    budget_min: 80,
    budget_max: 150,
    deadline: "2026-02-05",
    status: "open",
    quotes_count: 1,
    posted_date: "2026-01-26",
    landlord_name: "Jane Doe",
    urgency: "medium",
  },
  {
    id: "3",
    title: "Fix leaking kitchen tap",
    description: "Kitchen mixer tap is dripping constantly. May need washer replacement or new tap.",
    property_address: "8 Mill Road, Lincoln",
    trade_required: "plumbing",
    budget_min: 40,
    budget_max: 100,
    deadline: "2026-02-10",
    status: "open",
    quotes_count: 0,
    posted_date: "2026-01-28",
    landlord_name: "Bob Wilson",
    urgency: "low",
  },
  {
    id: "4",
    title: "Annual gas safety check",
    description: "Routine annual gas safety inspection required for rental property. 2-bed flat with combi boiler.",
    property_address: "22 Church Lane, Lincoln",
    trade_required: "heating",
    budget_min: 60,
    budget_max: 90,
    deadline: "2026-02-15",
    status: "open",
    quotes_count: 5,
    posted_date: "2026-01-25",
    landlord_name: "Sarah Brown",
    urgency: "low",
  },
];

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

export default function TendersPage() {
  const [tenders, setTenders] = useState(mockTenders);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrade, setFilterTrade] = useState<string | null>(null);
  const [filterUrgency, setFilterUrgency] = useState<string | null>(null);

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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
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

function TenderCard({ tender }: { tender: typeof mockTenders[0] }) {
  const trade = tradeCategories[tender.trade_required as keyof typeof tradeCategories];
  const Icon = trade?.icon || Wrench;

  const urgencyConfig = {
    high: { label: "Urgent", color: "bg-red-100 text-red-700" },
    medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
    low: { label: "Low", color: "bg-green-100 text-green-700" },
  };

  const urgency = urgencyConfig[tender.urgency as keyof typeof urgencyConfig];

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
              <div className={`w-14 h-14 rounded-xl ${colorClasses[trade?.color || "slate"]} flex items-center justify-center flex-shrink-0`}>
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
                    <Badge className={urgency?.color}>
                      {tender.urgency === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {urgency?.label}
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
                    {daysUntil > 0 ? `${daysUntil} days left` : "Deadline passed"}
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
