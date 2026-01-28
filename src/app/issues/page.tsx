"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Plus, AlertCircle, Clock, CheckCircle2, Wrench,
  ChevronRight, Filter, Search, Home, ArrowLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

type IssueStatus = "open" | "in_progress" | "resolved";
type IssuePriority = "low" | "medium" | "high" | "urgent";

interface Issue {
  id: string;
  title: string;
  description: string;
  property: string;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: string;
  updatedAt: string;
  category: string;
  photos: number;
}

// Mock data
const mockIssues: Issue[] = [
  {
    id: "1",
    title: "Boiler not heating water",
    description: "Hot water stopped working yesterday evening. Tried resetting but no luck.",
    property: "42 Oak Lane, Flat 2",
    status: "in_progress",
    priority: "high",
    createdAt: "2026-01-25",
    updatedAt: "2026-01-27",
    category: "Plumbing",
    photos: 2,
  },
  {
    id: "2", 
    title: "Broken window latch",
    description: "Bedroom window won't close properly, latch mechanism is broken.",
    property: "42 Oak Lane, Flat 2",
    status: "open",
    priority: "medium",
    createdAt: "2026-01-26",
    updatedAt: "2026-01-26",
    category: "Windows & Doors",
    photos: 1,
  },
  {
    id: "3",
    title: "Damp patch on ceiling",
    description: "Small damp patch appeared in bathroom ceiling after heavy rain.",
    property: "15 High Street",
    status: "resolved",
    priority: "medium",
    createdAt: "2026-01-20",
    updatedAt: "2026-01-24",
    category: "Damp & Mould",
    photos: 3,
  },
];

const statusConfig = {
  open: { label: "Open", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

export default function IssuesPage() {
  const [filter, setFilter] = useState<IssueStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIssues = mockIssues.filter(issue => {
    const matchesFilter = filter === "all" || issue.status === filter;
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.property.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: mockIssues.length,
    open: mockIssues.filter(i => i.status === "open").length,
    inProgress: mockIssues.filter(i => i.status === "in_progress").length,
    resolved: mockIssues.filter(i => i.status === "resolved").length,
  };

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
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Issues</h1>
                <p className="text-sm text-slate-500">Manage maintenance requests</p>
              </div>
            </div>
            <Link href="/issues/new">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="gap-2 shadow-lg shadow-blue-500/25">
                  <Plus className="w-4 h-4" />
                  Report Issue
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard label="Total Issues" value={stats.total} icon={Wrench} color="blue" />
          <StatCard label="Open" value={stats.open} icon={AlertCircle} color="orange" />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="blue" />
          <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="green" />
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "open", "in_progress", "resolved"] as const).map((status) => (
              <motion.button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {status === "all" ? "All" : status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Issues List */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredIssues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-5xl mb-4"
                >
                  🔍
                </motion.div>
                <p className="text-slate-500">No issues found</p>
                <p className="text-sm text-slate-400">Try adjusting your filters</p>
              </motion.div>
            ) : (
              filteredIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType;
  color: "blue" | "orange" | "green";
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    orange: "from-orange-500 to-orange-600", 
    green: "from-emerald-500 to-emerald-600",
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <motion.p 
                className="text-2xl font-bold text-slate-800 dark:text-white"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                {value}
              </motion.p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const StatusIcon = statusConfig[issue.status].icon;
  
  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ y: -2 }}
    >
      <Link href={`/issues/${issue.id}`}>
        <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur hover:shadow-xl transition-all cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <motion.div 
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusConfig[issue.status].color} border`}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <StatusIcon className="w-5 h-5" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                    {issue.title}
                  </h3>
                  <Badge className={priorityConfig[issue.priority].color}>
                    {issue.priority}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-500 line-clamp-1 mb-2">
                  {issue.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    {issue.property}
                  </span>
                  <span>{issue.category}</span>
                  {issue.photos > 0 && (
                    <span>📷 {issue.photos} photos</span>
                  )}
                </div>
              </div>
              
              <motion.div
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: -10 }}
                animate={{ x: 0 }}
              >
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
