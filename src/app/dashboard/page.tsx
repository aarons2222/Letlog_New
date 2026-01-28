"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Home, Key, Wrench, AlertTriangle, FileText, 
  MessageSquare, Briefcase, Star, Plus, ClipboardList,
  LogOut, Building2, User, Calendar, Settings, Users, Receipt
} from "lucide-react";

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

type Role = "landlord" | "tenant" | "contractor";

interface DashboardStats {
  properties: number;
  tenancies: number;
  openIssues: number;
  pendingQuotes: number;
  complianceAlerts: number;
}

interface Activity {
  id: string;
  type: string;
  text: string;
  time: string;
  icon: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role>("landlord");
  const [stats, setStats] = useState<DashboardStats>({
    properties: 0,
    tenancies: 0,
    openIssues: 0,
    pendingQuotes: 0,
    complianceAlerts: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      
      try {
        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          // For demo purposes, show mock data if not logged in
          setUser({
            id: 'demo',
            email: 'demo@letlog.app',
            full_name: 'Demo User',
            role: 'landlord',
          });
          setIsLoading(false);
          return;
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email || authUser.email || '',
            full_name: profile.full_name || 'User',
            role: (profile.role as Role) || 'landlord',
          });
          setRole((profile.role as Role) || 'landlord');
        }

        // Fetch stats based on role
        await loadStats(supabase, authUser.id, (profile?.role as Role) || 'landlord');
        
        // Fetch recent activity
        await loadActivity(supabase, authUser.id);

      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function loadStats(supabase: ReturnType<typeof createClient>, userId: string, userRole: Role) {
    try {
      if (userRole === 'landlord') {
        // Count properties
        const { count: propCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('landlord_id', userId);

        // Count active tenancies
        const { count: tenancyCount } = await supabase
          .from('tenancies')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Count open issues
        const { count: issueCount } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress']);

        // Count pending quotes
        const { count: quoteCount } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Count compliance alerts (items due soon)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { count: complianceCount } = await supabase
          .from('compliance_items')
          .select('*', { count: 'exact', head: true })
          .lt('expiry_date', thirtyDaysFromNow.toISOString())
          .eq('status', 'valid');

        setStats({
          properties: propCount || 0,
          tenancies: tenancyCount || 0,
          openIssues: issueCount || 0,
          pendingQuotes: quoteCount || 0,
          complianceAlerts: complianceCount || 0,
        });
      }
    } catch (err) {
      console.error('Stats load error:', err);
    }
  }

  async function loadActivity(supabase: ReturnType<typeof createClient>, userId: string) {
    try {
      // Fetch recent issues
      const { data: recentIssues } = await supabase
        .from('issues')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent tenancies
      const { data: recentTenancies } = await supabase
        .from('tenancies')
        .select('id, status, start_date, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      const activityItems: Activity[] = [];

      recentIssues?.forEach((issue) => {
        activityItems.push({
          id: `issue-${issue.id}`,
          type: 'issue',
          text: `Issue: ${issue.title}`,
          time: formatTimeAgo(issue.created_at),
          icon: issue.status === 'open' ? '🔧' : '✅',
        });
      });

      recentTenancies?.forEach((tenancy) => {
        activityItems.push({
          id: `tenancy-${tenancy.id}`,
          type: 'tenancy',
          text: `Tenancy ${tenancy.status === 'active' ? 'started' : 'updated'}`,
          time: formatTimeAgo(tenancy.created_at),
          icon: '🏠',
        });
      });

      // Sort by time and take top 5
      activityItems.sort((a, b) => a.time.localeCompare(b.time));
      setActivities(activityItems.slice(0, 5));
    } catch (err) {
      console.error('Activity load error:', err);
    }
  }

  const roleConfig = {
    landlord: { icon: Building2, label: "Landlord", color: "bg-blue-500" },
    tenant: { icon: Key, label: "Tenant", color: "bg-green-500" },
    contractor: { icon: Wrench, label: "Contractor", color: "bg-orange-500" },
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E8998D] to-[#F4A261] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="font-bold text-xl">
              <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">Let</span>
              <span>Log</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Link href="/settings">
              <motion.div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.1 }}
              >
                <User className="w-5 h-5 text-slate-600" />
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 min-h-[calc(100vh-73px)] bg-white border-r border-slate-200 p-4">
          <nav className="space-y-1">
            <NavLink href="/dashboard" icon={Home} label="Dashboard" active />
            <NavLink href="/properties" icon={Building2} label="Properties" />
            <NavLink href="/tenancies" icon={Users} label="Tenancies" />
            <NavLink href="/issues" icon={Wrench} label="Issues" />
            <NavLink href="/tenders" icon={Briefcase} label="Tenders" />
            <NavLink href="/quotes" icon={Receipt} label="Quotes" />
            <NavLink href="/compliance" icon={AlertTriangle} label="Compliance" />
            <NavLink href="/reviews" icon={Star} label="Reviews" />
            <NavLink href="/calendar" icon={Calendar} label="Calendar" />
            
            <div className="pt-4 border-t border-slate-200 mt-4">
              <NavLink href="/settings" icon={Settings} label="Settings" />
              <NavLink href="/pricing" icon={Star} label="Upgrade" />
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingSkeleton key="loading" />
            ) : (
              <motion.div
                key="content"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
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
                      Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
                    </h1>
                  </div>
                  <p className="text-slate-600">Here's your property management overview.</p>
                </motion.div>

                {/* Stats Grid */}
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                  variants={containerVariants}
                >
                  <StatCard title="Properties" value={stats.properties.toString()} icon={Home} color="blue" />
                  <StatCard title="Active Tenancies" value={stats.tenancies.toString()} icon={ClipboardList} color="green" />
                  <StatCard title="Open Issues" value={stats.openIssues.toString()} icon={Wrench} color="orange" />
                  <StatCard title="Compliance Alerts" value={stats.complianceAlerts.toString()} icon={AlertTriangle} color="red" />
                </motion.div>

                {/* Quick Actions + Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl">Quick Actions</CardTitle>
                        <CardDescription>Common tasks</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <QuickAction href="/properties/new" icon={Plus} label="Add Property" />
                        <QuickAction href="/tenancies" icon={Users} label="Manage Tenancies" />
                        <QuickAction href="/issues/new" icon={Wrench} label="Report Issue" />
                        <QuickAction href="/reviews" icon={Star} label="View Reviews" />
                        <QuickAction href="/compliance" icon={AlertTriangle} label="Check Compliance" />
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
                              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
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
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) {
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
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
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
