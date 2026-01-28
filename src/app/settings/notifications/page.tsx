"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Bell, Mail, Home, Wrench, FileText, 
  AlertTriangle, CreditCard, MessageSquare, Star, Save
} from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
  // Property & Tenancy
  tenancy_reminders: boolean;
  rent_reminders: boolean;
  property_updates: boolean;
  
  // Maintenance
  issue_updates: boolean;
  quote_notifications: boolean;
  job_completion: boolean;
  
  // Compliance
  compliance_alerts: boolean;
  compliance_reminders: boolean;
  
  // Documents
  document_uploads: boolean;
  document_shares: boolean;
  
  // Communication
  messages: boolean;
  review_requests: boolean;
  
  // Marketing
  tips_and_updates: boolean;
  product_news: boolean;
}

const defaultPreferences: NotificationPreferences = {
  tenancy_reminders: true,
  rent_reminders: true,
  property_updates: true,
  issue_updates: true,
  quote_notifications: true,
  job_completion: true,
  compliance_alerts: true,
  compliance_reminders: true,
  document_uploads: true,
  document_shares: true,
  messages: true,
  review_requests: true,
  tips_and_updates: false,
  product_news: false,
};

const notificationGroups = [
  {
    title: "Property & Tenancy",
    icon: Home,
    color: "blue",
    items: [
      { key: "tenancy_reminders", label: "Tenancy start/end reminders", description: "Get notified before tenancies begin or end" },
      { key: "rent_reminders", label: "Rent payment reminders", description: "Reminders for upcoming and overdue payments" },
      { key: "property_updates", label: "Property updates", description: "Changes to your properties or tenancies" },
    ],
  },
  {
    title: "Maintenance & Repairs",
    icon: Wrench,
    color: "orange",
    items: [
      { key: "issue_updates", label: "Issue status updates", description: "When maintenance issues are updated or resolved" },
      { key: "quote_notifications", label: "Quote notifications", description: "New quotes from contractors" },
      { key: "job_completion", label: "Job completion", description: "When work is completed" },
    ],
  },
  {
    title: "Compliance",
    icon: AlertTriangle,
    color: "red",
    items: [
      { key: "compliance_alerts", label: "Expiry alerts", description: "When certificates are about to expire or have expired" },
      { key: "compliance_reminders", label: "Renewal reminders", description: "Reminders to renew certificates" },
    ],
  },
  {
    title: "Documents",
    icon: FileText,
    color: "green",
    items: [
      { key: "document_uploads", label: "Document uploads", description: "When new documents are added" },
      { key: "document_shares", label: "Document shares", description: "When someone shares a document with you" },
    ],
  },
  {
    title: "Communication",
    icon: MessageSquare,
    color: "purple",
    items: [
      { key: "messages", label: "New messages", description: "When you receive a message" },
      { key: "review_requests", label: "Review requests", description: "Requests to leave reviews after jobs" },
    ],
  },
  {
    title: "Marketing",
    icon: Star,
    color: "yellow",
    items: [
      { key: "tips_and_updates", label: "Tips & best practices", description: "Helpful tips for property management" },
      { key: "product_news", label: "Product updates", description: "New features and improvements" },
    ],
  },
];

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Fetch notification preferences from profile or a separate table
      const { data: profile } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single();
      
      if (profile?.notification_preferences) {
        setPreferences({ ...defaultPreferences, ...profile.notification_preferences });
      }
      
      setIsLoading(false);
    };
    
    fetchPreferences();
  }, [router]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          notification_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Notification preferences saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnableAll = () => {
    setPreferences(Object.keys(preferences).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {} as NotificationPreferences));
  };

  const handleDisableNonEssential = () => {
    setPreferences({
      ...preferences,
      tips_and_updates: false,
      product_news: false,
      review_requests: false,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
        />
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
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Settings
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Email Notifications</h1>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <Button variant="outline" size="sm" onClick={handleEnableAll}>
            Enable all
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisableNonEssential}>
            Essential only
          </Button>
        </motion.div>

        {/* Notification groups */}
        {notificationGroups.map((group, groupIndex) => {
          const Icon = group.icon;
          const colorClasses: Record<string, string> = {
            blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
            orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
            red: "bg-red-100 dark:bg-red-900/30 text-red-600",
            green: "bg-green-100 dark:bg-green-900/30 text-green-600",
            purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
            yellow: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
          };

          return (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
            >
              <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${colorClasses[group.color]} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{group.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.items.map((item) => (
                    <div 
                      key={item.key} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <Label htmlFor={item.key} className="font-medium cursor-pointer">
                          {item.label}
                        </Label>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                      <Switch
                        id={item.key}
                        checked={preferences[item.key as keyof NotificationPreferences]}
                        onCheckedChange={() => handleToggle(item.key as keyof NotificationPreferences)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-slate-500 py-4"
        >
          <Mail className="w-5 h-5 mx-auto mb-2" />
          <p>You'll always receive critical security notifications regardless of these settings.</p>
        </motion.div>
      </main>
    </div>
  );
}
