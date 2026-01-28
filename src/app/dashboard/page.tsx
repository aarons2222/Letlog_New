"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { type Role } from "@/lib/roles";
import { containerVariants, itemVariants, fadeInUp } from "@/lib/animations";
import {
  Home,
  Wrench,
  AlertTriangle,
  FileText,
  Briefcase,
  Star,
  Plus,
  ClipboardList,
  Calendar,
  Receipt,
  Users,
} from "lucide-react";

interface DashboardStats {
  properties: number;
  tenancies: number;
  openIssues: number;
  pendingQuotes: number;
  complianceAlerts: number;
  // Tenant-specific
  myIssues: number;
  // Contractor-specific
  availableJobs: number;
  activeJobs: number;
  myQuotes: number;
  avgRating: number;
}

interface Activity {
  id: string;
  type: string;
  text: string;
  time: string;
  icon: string;
}

// #5: Upcoming events for tenants
interface UpcomingEvent {
  id: string;
  type: "contractor_visit" | "inspection" | "tenancy_end";
  title: string;
  date: string;
  description: string;
  icon: string;
  urgency: "normal" | "warning" | "urgent";
}

export default function DashboardPage() {
  const { role, isLoading: roleLoading, fullName, email, userId } = useRole();
  const [stats, setStats] = useState<DashboardStats>({
    properties: 0,
    tenancies: 0,
    openIssues: 0,
    pendingQuotes: 0,
    complianceAlerts: 0,
    myIssues: 0,
    availableJobs: 0,
    activeJobs: 0,
    myQuotes: 0,
    avgRating: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleLoading) return;

    async function loadDashboard() {
      const supabase = createClient();

      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setIsLoading(false);
          return;
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, role")
          .eq("id", authUser.id)
          .single();

        const userRole = (profile?.role as Role) || role || "landlord";

        // Fetch stats based on role
        await loadStats(supabase, authUser.id, userRole);

        // Fetch recent activity
        await loadActivity(supabase, authUser.id);

        // #5: Load upcoming events for tenants
        if (userRole === "tenant") {
          await loadUpcomingEvents(supabase, authUser.id);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [role, roleLoading]);

  async function loadStats(supabase: ReturnType<typeof createClient>, uid: string, userRole: Role) {
    try {
      if (userRole === "landlord") {
        const { count: propCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("landlord_id", uid);

        const { count: tenancyCount } = await supabase
          .from("tenancies")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        const { count: issueCount } = await supabase
          .from("issues")
          .select("*", { count: "exact", head: true })
          .in("status", ["open", "in_progress"]);

        const { count: quoteCount } = await supabase
          .from("quotes")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const { count: complianceCount } = await supabase
          .from("compliance_items")
          .select("*", { count: "exact", head: true })
          .lt("expiry_date", thirtyDaysFromNow.toISOString())
          .eq("status", "valid");

        setStats((prev) => ({
          ...prev,
          properties: propCount || 0,
          tenancies: tenancyCount || 0,
          openIssues: issueCount || 0,
          pendingQuotes: quoteCount || 0,
          complianceAlerts: complianceCount || 0,
        }));
      } else if (userRole === "tenant") {
        // #2: Tenant stats - NO rent references. Only show maintenance issues.
        const { count: issueCount } = await supabase
          .from("issues")
          .select("*", { count: "exact", head: true })
          .eq("reported_by", userId)
          .in("status", ["open", "in_progress"]);

        setStats((prev) => ({
          ...prev,
          myIssues: issueCount || 0,
        }));
      }
    } catch (err) {
      console.error("Stats load error:", err);
    }
  }

  async function loadActivity(supabase: ReturnType<typeof createClient>, uid: string) {
    try {
      const { data: recentIssues } = await supabase
        .from("issues")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: recentTenancies } = await supabase
        .from("tenancies")
        .select("id, status, start_date, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      const activityItems: Activity[] = [];

      recentIssues?.forEach((issue) => {
        activityItems.push({
          id: `issue-${issue.id}`,
          type: "issue",
          text: `Issue: ${issue.title}`,
          time: formatTimeAgo(issue.created_at),
          icon: issue.status === "open" ? "🔧" : "✅",
        });
      });

      recentTenancies?.forEach((tenancy) => {
        activityItems.push({
          id: `tenancy-${tenancy.id}`,
          type: "tenancy",
          text: `Tenancy ${tenancy.status === "active" ? "started" : "updated"}`,
          time: formatTimeAgo(tenancy.created_at),
          icon: "🏠",
        });
      });

      activityItems.sort((a, b) => a.time.localeCompare(b.time));
      setActivities(activityItems.slice(0, 5));
    } catch (err) {
      console.error("Activity load error:", err);
    }
  }

  // #5: Load upcoming events for tenant dashboard
  async function loadUpcomingEvents(supabase: ReturnType<typeof createClient>, userId: string) {
    try {
      const events: UpcomingEvent[] = [];
      const now = new Date();
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(now.getDate() + 60);

      // Scheduled contractor visits - issues with a scheduled_date in the future
      const { data: scheduledIssues } = await supabase
        .from("issues")
        .select("id, title, scheduled_date, status")
        .gte("scheduled_date", now.toISOString())
        .lte("scheduled_date", sixtyDaysFromNow.toISOString())
        .in("status", ["open", "in_progress", "acknowledged"])
        .order("scheduled_date", { ascending: true })
        .limit(5);

      scheduledIssues?.forEach((issue) => {
        const date = new Date(issue.scheduled_date);
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        events.push({
          id: `visit-${issue.id}`,
          type: "contractor_visit",
          title: `Contractor Visit: ${issue.title}`,
          date: issue.scheduled_date,
          description: daysUntil <= 1 ? "Tomorrow" : `In ${daysUntil} days`,
          icon: "🔧",
          urgency: daysUntil <= 2 ? "urgent" : daysUntil <= 7 ? "warning" : "normal",
        });
      });

      // Upcoming inspections - issues with category/type of 'inspection'
      const { data: inspections } = await supabase
        .from("issues")
        .select("id, title, scheduled_date, status")
        .gte("scheduled_date", now.toISOString())
        .lte("scheduled_date", sixtyDaysFromNow.toISOString())
        .eq("category", "inspection")
        .order("scheduled_date", { ascending: true })
        .limit(3);

      inspections?.forEach((insp) => {
        // Avoid duplicates with contractor visits
        if (!events.find((e) => e.id === `visit-${insp.id}`)) {
          const date = new Date(insp.scheduled_date);
          const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          events.push({
            id: `inspection-${insp.id}`,
            type: "inspection",
            title: `Inspection: ${insp.title}`,
            date: insp.scheduled_date,
            description: daysUntil <= 1 ? "Tomorrow" : `In ${daysUntil} days`,
            icon: "🏠",
            urgency: daysUntil <= 2 ? "urgent" : daysUntil <= 7 ? "warning" : "normal",
          });
        }
      });

      // Tenancy end date approaching
      const { data: tenancies } = await supabase
        .from("tenancies")
        .select("id, end_date, status")
        .eq("tenant_id", userId)
        .eq("status", "active")
        .not("end_date", "is", null);

      tenancies?.forEach((tenancy) => {
        if (!tenancy.end_date) return;
        const endDate = new Date(tenancy.end_date);
        const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0 && daysUntil <= 90) {
          events.push({
            id: `tenancy-end-${tenancy.id}`,
            type: "tenancy_end",
            title: "Tenancy End Date",
            date: tenancy.end_date,
            description:
              daysUntil <= 7
                ? `Ending in ${daysUntil} day${daysUntil === 1 ? "" : "s"}!`
                : `${daysUntil} days remaining`,
            icon: "📅",
            urgency: daysUntil <= 14 ? "urgent" : daysUntil <= 30 ? "warning" : "normal",
          });
        }
      });

      // Sort by date
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setUpcomingEvents(events);
    } catch (err) {
      console.error("Upcoming events load error:", err);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading || roleLoading ? (
          <LoadingSkeleton key="loading" />
        ) : (
          <motion.div key="content" initial="hidden" animate="visible" variants={containerVariants}>
            {/* Welcome Section */}
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <motion.span
                  className="text-3xl"
                  animate={{ rotate: [0, 14, -8, 14, 0] }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                >
                  👋
                </motion.span>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  Welcome back, {fullName?.split(" ")[0] || "there"}!
                </h1>
              </div>
              <p className="text-slate-600">
                {role === "tenant"
                  ? "Here's your tenancy overview."
                  : role === "contractor"
                    ? "Here's your jobs overview."
                    : "Here's your property management overview."}
              </p>
            </motion.div>

            {/* Stats Grid - role-aware */}
            {role === "landlord" && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                variants={containerVariants}
              >
                <StatCard
                  title="Properties"
                  value={stats.properties.toString()}
                  icon={Home}
                  color="blue"
                />
                <StatCard
                  title="Active Tenancies"
                  value={stats.tenancies.toString()}
                  icon={ClipboardList}
                  color="green"
                />
                <StatCard
                  title="Open Issues"
                  value={stats.openIssues.toString()}
                  icon={Wrench}
                  color="orange"
                />
                <StatCard
                  title="Compliance Alerts"
                  value={stats.complianceAlerts.toString()}
                  icon={AlertTriangle}
                  color="red"
                />
              </motion.div>
            )}

            {/* #2: Tenant stats - NO rent status / rent history / "pays rent" references.
                     Only show maintenance-related stats until payments feature ships. */}
            {role === "tenant" && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
                variants={containerVariants}
              >
                <StatCard
                  title="Open Issues"
                  value={stats.openIssues.toString()}
                  icon={Wrench}
                  color="orange"
                />
              </motion.div>
            )}

            {role === "contractor" && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
                variants={containerVariants}
              >
                <StatCard
                  title="Pending Quotes"
                  value={stats.pendingQuotes.toString()}
                  icon={FileText}
                  color="orange"
                />
                <StatCard title="Active Jobs" value="-" icon={Briefcase} color="blue" />
                <StatCard title="Reviews" value="-" icon={Star} color="green" />
              </motion.div>
            )}

            {/* #5: Upcoming Events section for tenants */}
            {role === "tenant" && (
              <motion.div variants={itemVariants} className="mb-8">
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>Scheduled visits, inspections, and key dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingEvents.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-3xl mb-2">📅</p>
                        <p>No upcoming events</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Scheduled contractor visits, inspections, and tenancy dates will appear
                          here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border ${
                              event.urgency === "urgent"
                                ? "border-red-200 bg-red-50"
                                : event.urgency === "warning"
                                  ? "border-amber-200 bg-amber-50"
                                  : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <span className="text-xl">{event.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700">{event.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500">
                                  {new Date(event.date).toLocaleDateString("en-GB", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                                <Badge
                                  className={
                                    event.urgency === "urgent"
                                      ? "bg-red-100 text-red-700 text-xs"
                                      : event.urgency === "warning"
                                        ? "bg-amber-100 text-amber-700 text-xs"
                                        : "bg-slate-100 text-slate-600 text-xs"
                                  }
                                >
                                  {event.description}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Actions + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Quick Actions</CardTitle>
                    <CardDescription>Common tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {role === "landlord" && (
                      <>
                        <QuickAction href="/properties/new" icon={Plus} label="Add Property" />
                        <QuickAction href="/tenancies" icon={Users} label="Manage Tenancies" />
                        <QuickAction href="/issues/new" icon={Wrench} label="Report Issue" />
                        <QuickAction href="/reviews" icon={Star} label="View Reviews" />
                        <QuickAction
                          href="/compliance"
                          icon={AlertTriangle}
                          label="Check Compliance"
                        />
                      </>
                    )}
                    {role === "tenant" && (
                      <>
                        <QuickAction href="/issues/new" icon={Wrench} label="Report Issue" />
                        <QuickAction href="/issues" icon={ClipboardList} label="View My Issues" />
                        <QuickAction href="/reviews" icon={Star} label="Leave a Review" />
                      </>
                    )}
                    {role === "contractor" && (
                      <>
                        <QuickAction href="/tenders" icon={Briefcase} label="Browse Jobs" />
                        <QuickAction href="/quotes" icon={Receipt} label="My Quotes" />
                        <QuickAction href="/reviews" icon={Star} label="View Reviews" />
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Recent Activity</CardTitle>
                    <CardDescription>Latest updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-3xl mb-2">📭</p>
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50"
                          >
                            <span className="text-xl">{activity.icon}</span>
                            <div>
                              <p className="text-sm text-slate-700">{activity.text}</p>
                              <p className="text-xs text-slate-400">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
  };

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="text-3xl font-bold text-slate-800">{value}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
        whileHover={{ x: 4 }}
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <span className="font-medium text-slate-700">{label}</span>
      </motion.div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="space-y-2">
        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-6 w-96 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </motion.div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
