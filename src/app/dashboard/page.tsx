"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RoleNavigation, RoleQuickActions, RoleBadge } from "@/components/RoleNavigation";
import { Sidebar } from "@/components/Sidebar";
import { DashboardEmptyState } from "@/components/EmptyState";
import { 
  Home, Key, Wrench, AlertTriangle, FileText, 
  MessageSquare, Briefcase, Star, Plus, ClipboardList,
  LogOut, Building2, User, Calendar, Settings, Users, Receipt, Bell
} from "lucide-react";
import { Suspense } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const supabase = createClient();
    let mounted = true;

    async function loadDashboard() {
      if (!mounted) return;
      
      try {
        // Get session - wait for it to be ready
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Not logged in yet, wait for auth state change
          return;
        }

        const authUser = session.user;
        
        if (!authUser) {
          window.location.href = '/login';
          return;
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, role')
          .eq('id', authUser.id)
          .maybeSingle();

        // Get name from profile, auth metadata, or email
        const userName = profile?.full_name 
          || authUser.user_metadata?.full_name 
          || authUser.user_metadata?.name
          || authUser.email?.split('@')[0] 
          || 'User';
        
        // Handle role (might be enum value)
        let userRole: Role = 'landlord';
        if (profile?.role) {
          const roleStr = String(profile.role).toLowerCase();
          if (roleStr === 'tenant') userRole = 'tenant';
          else if (roleStr === 'contractor') userRole = 'contractor';
        }

        setUser({
          id: authUser.id,
          email: profile?.email || authUser.email || '',
          full_name: userName,
          role: userRole,
        });
        setRole(userRole);

        // Create profile if doesn't exist
        if (!profile) {
          await supabase.from('profiles').upsert({
            id: authUser.id,
            email: authUser.email,
            full_name: userName,
            role: 'landlord',
          }).select();
        }

        // Fetch stats based on role
        await loadStats(supabase, authUser.id, userRole);
        
        // Fetch recent activity
        await loadActivity(supabase, authUser.id);

      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Failed to load dashboard data');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    // Listen for auth state changes (handles fresh login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        loadDashboard();
      }
    });

    // Initial load
    loadDashboard();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadStats(supabase: ReturnType<typeof createClient>, userId: string, userRole: Role) {
    let newStats = {
      properties: 0,
      tenancies: 0,
      openIssues: 0,
      pendingQuotes: 0,
      complianceAlerts: 0,
    };

    if (userRole === 'landlord') {
      // Get my properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('landlord_id', userId);
      
      newStats.properties = properties?.length || 0;
      
      if (properties && properties.length > 0) {
        const propIds = properties.map(p => p.id);
        
        // Count active tenancies (status is enum, try common values)
        const { data: tenancies } = await supabase
          .from('tenancies')
          .select('id, status')
          .in('property_id', propIds);
        
        // Filter active tenancies client-side (enum might be 'active', 'Active', etc)
        newStats.tenancies = tenancies?.filter(t => 
          t.status?.toLowerCase() === 'active' || t.status?.toLowerCase() === 'current'
        ).length || 0;

        // Count open issues
        const { data: issues } = await supabase
          .from('issues')
          .select('id, status')
          .in('property_id', propIds);
        
        // Filter open issues client-side
        newStats.openIssues = issues?.filter(i => 
          ['open', 'pending', 'in_progress', 'reported'].includes(i.status?.toLowerCase() || '')
        ).length || 0;
      }

      // Count pending quotes for my tenders
      const { data: tenders } = await supabase
        .from('tenders')
        .select('id')
        .eq('landlord_id', userId);
      
      if (tenders && tenders.length > 0) {
        const tenderIds = tenders.map(t => t.id);
        const { data: quotes } = await supabase
          .from('quotes')
          .select('id, status')
          .in('tender_id', tenderIds);
        
        newStats.pendingQuotes = quotes?.filter(q => 
          q.status?.toLowerCase() === 'pending'
        ).length || 0;
      }

      // Count compliance alerts (expiring within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data: compliance } = await supabase
        .from('compliance_items')
        .select('id, expiry_date, status, property_id')
        .lt('expiry_date', thirtyDaysFromNow.toISOString());
      
      // Filter to my properties and valid status
      if (properties && compliance) {
        const propIds = properties.map(p => p.id);
        newStats.complianceAlerts = compliance.filter(c => 
          propIds.includes(c.property_id) && 
          c.status?.toLowerCase() === 'valid'
        ).length;
      }
    }

    setStats(newStats);
  }

  async function loadActivity(supabase: ReturnType<typeof createClient>, userId: string) {
    const activityItems: Activity[] = [];

    try {
      // Get my properties first
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('landlord_id', userId);
      
      if (properties && properties.length > 0) {
        const propIds = properties.map(p => p.id);

        // Recent issues
        const { data: issues } = await supabase
          .from('issues')
          .select('id, title, status, created_at')
          .in('property_id', propIds)
          .order('created_at', { ascending: false })
          .limit(3);

        issues?.forEach((issue) => {
          activityItems.push({
            id: `issue-${issue.id}`,
            type: 'issue',
            text: `Issue: ${issue.title || 'Untitled'}`,
            time: formatTimeAgo(issue.created_at),
            icon: issue.status?.toLowerCase() === 'open' ? '🔧' : '✅',
          });
        });

        // Recent tenancies
        const { data: tenancies } = await supabase
          .from('tenancies')
          .select('id, status, start_date, created_at')
          .in('property_id', propIds)
          .order('created_at', { ascending: false })
          .limit(2);

        tenancies?.forEach((tenancy) => {
          activityItems.push({
            id: `tenancy-${tenancy.id}`,
            type: 'tenancy',
            text: `Tenancy ${tenancy.status?.toLowerCase() === 'active' ? 'started' : 'updated'}`,
            time: formatTimeAgo(tenancy.created_at),
            icon: '🏠',
          });
        });
      }

      // Sort by time
      activityItems.sort((a, b) => b.time.localeCompare(a.time));
      setActivities(activityItems.slice(0, 5));
    } catch (err) {
      console.error('Activity load error:', err);
      setActivities([]);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                >
                  <User className="w-5 h-5 text-slate-600" />
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/notifications" className="cursor-pointer">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar Navigation - Collapsible */}
        <Sidebar role={role} />

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
                {/* Show empty state for new users (check for 0, null, or undefined) */}
                {(role === 'landlord' && !stats.properties) ? (
                  <DashboardEmptyState role={role} />
                ) : (role === 'contractor' && !stats.pendingQuotes) ? (
                  <DashboardEmptyState role={role} />
                ) : (role === 'tenant' && !stats.openIssues && activities.length === 0) ? (
                  <DashboardEmptyState role={role} />
                ) : (
                  <>
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

                {/* Stats Grid - Role-specific */}
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                  variants={containerVariants}
                >
                  {role === 'landlord' && (
                    <>
                      <StatCard title="Properties" value={stats.properties.toString()} icon={Home} color="blue" />
                      <StatCard title="Active Tenancies" value={stats.tenancies.toString()} icon={ClipboardList} color="green" />
                      <StatCard title="Open Issues" value={stats.openIssues.toString()} icon={Wrench} color="orange" />
                      <StatCard title="Compliance Alerts" value={stats.complianceAlerts.toString()} icon={AlertTriangle} color="red" />
                    </>
                  )}
                  {role === 'tenant' && (
                    <>
                      <StatCard title="Open Issues" value={stats.openIssues.toString()} icon={Wrench} color="orange" />
                      <StatCard title="Documents" value="0" icon={FileText} color="blue" />
                      <StatCard title="Messages" value="0" icon={MessageSquare} color="green" />
                      <StatCard title="Reviews" value="0" icon={Star} color="purple" />
                    </>
                  )}
                  {role === 'contractor' && (
                    <>
                      <StatCard title="Available Jobs" value="0" icon={Briefcase} color="blue" />
                      <StatCard title="Pending Quotes" value={stats.pendingQuotes.toString()} icon={Receipt} color="orange" />
                      <StatCard title="Active Jobs" value="0" icon={Wrench} color="green" />
                      <StatCard title="Reviews" value="0" icon={Star} color="purple" />
                    </>
                  )}
                </motion.div>

                {/* Quick Actions + Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl">Quick Actions</CardTitle>
                        <CardDescription>Common tasks for {role}s</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RoleQuickActions role={role} />
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
                  </>
                )}
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
    purple: "from-purple-500 to-purple-600",
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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      {/* Animated Logo */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-20 h-20 bg-gradient-to-br from-[#E8998D] to-[#F4A261] rounded-2xl flex items-center justify-center shadow-lg mb-6"
      >
        <span className="text-white font-bold text-3xl">L</span>
      </motion.div>
      
      {/* Loading text */}
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-slate-500 font-medium"
      >
        Loading your dashboard...
      </motion.p>

      {/* Skeleton cards below */}
      <div className="w-full max-w-4xl mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <motion.div 
            key={i} 
            className="h-24 bg-slate-100 rounded-2xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
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
// Thu Jan 29 10:27:54 GMT 2026
