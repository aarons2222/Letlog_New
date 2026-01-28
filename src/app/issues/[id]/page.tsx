"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";
import { 
  ArrowLeft, AlertCircle, Clock, CheckCircle2, 
  MessageSquare, Send, Home, Calendar, User,
  Image as ImageIcon, ChevronLeft, ChevronRight
} from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface IssueDetail {
  id: string;
  title: string;
  description: string;
  property: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
  photos: string[];
}

interface TimelineItem {
  id: string;
  type: "created" | "status" | "comment";
  message: string;
  user: string;
  timestamp: string;
}

const statusConfig = {
  open: { label: "Open", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

export default function IssueDetailPage() {
  return (
    <RoleGuard allowedRoles={["landlord", "tenant"]}>
      <IssueDetailContent />
    </RoleGuard>
  );
}

function IssueDetailContent() {
  const params = useParams();
  const issueId = params.id as string;
  const { userId, fullName } = useRole();
  
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!issueId) return;

    async function fetchIssue() {
      const supabase = createClient();
      try {
        // Fetch the issue with property data
        const { data: issueData, error: issueError } = await supabase
          .from("issues")
          .select(`
            *,
            properties (
              id, address_line_1, address_line_2, city
            )
          `)
          .eq("id", issueId)
          .single();

        if (issueError) throw issueError;

        const prop = issueData.properties;
        const propertyAddress = prop
          ? [prop.address_line_1, prop.address_line_2, prop.city].filter(Boolean).join(", ")
          : "Unknown property";

        setIssue({
          id: issueData.id,
          title: issueData.title || "Untitled Issue",
          description: issueData.description || "",
          property: propertyAddress,
          status: issueData.status || "open",
          priority: issueData.priority || "medium",
          category: issueData.category || "General",
          createdAt: issueData.created_at || "",
          updatedAt: issueData.updated_at || issueData.created_at || "",
          photos: issueData.photos || [],
        });

        // Fetch comments for this issue
        const { data: comments, error: commentsError } = await supabase
          .from("issue_comments")
          .select(`
            *,
            profiles (
              full_name
            )
          `)
          .eq("issue_id", issueId)
          .order("created_at", { ascending: true });

        if (commentsError) throw commentsError;

        // Build timeline: start with issue creation, then add comments
        const timelineItems: TimelineItem[] = [
          {
            id: "created",
            type: "created",
            message: "Issue reported",
            user: issueData.reported_by === userId ? "You" : "Reporter",
            timestamp: issueData.created_at,
          },
        ];

        (comments || []).forEach((comment: any) => {
          timelineItems.push({
            id: comment.id,
            type: comment.type === "status_change" ? "status" : "comment",
            message: comment.content || comment.message || "",
            user: comment.user_id === userId ? "You" : (comment.profiles?.full_name || "User"),
            timestamp: comment.created_at,
          });
        });

        setTimeline(timelineItems);
      } catch (err) {
        console.error("Error fetching issue:", err);
        toast.error("Failed to load issue details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchIssue();
  }, [issueId, userId]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !issue) return;
    setIsSending(true);
    
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("issue_comments")
        .insert({
          issue_id: issue.id,
          user_id: userId,
          content: newComment.trim(),
          type: "comment",
        })
        .select()
        .single();

      if (error) throw error;

      // Add to timeline
      setTimeline(prev => [...prev, {
        id: data.id,
        type: "comment",
        message: newComment.trim(),
        user: "You",
        timestamp: data.created_at,
      }]);

      setNewComment("");
      toast.success("Comment added");
    } catch (err) {
      console.error("Error sending comment:", err);
      toast.error("Failed to send comment");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
          <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Issue not found</p>
          <Link href="/issues">
            <Button>Back to Issues</Button>
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[issue.status]?.icon || AlertCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/issues">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </motion.button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                {issue.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Home className="w-3 h-3" />
                {issue.property}
              </div>
            </div>
            <Badge className={statusConfig[issue.status]?.color || "bg-slate-100 text-slate-600"}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig[issue.status]?.label || issue.status}
            </Badge>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          {/* Photos */}
          {issue.photos.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="relative aspect-video bg-slate-100">
                  <motion.div
                    key={currentPhoto}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <div className="flex items-center gap-4 text-slate-400">
                      <ImageIcon className="w-12 h-12" />
                      <span>Photo {currentPhoto + 1}</span>
                    </div>
                  </motion.div>
                  
                  {issue.photos.length > 1 && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPhoto(p => (p - 1 + issue.photos.length) % issue.photos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPhoto(p => (p + 1) % issue.photos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {issue.photos.map((_: string, i: number) => (
                          <motion.button
                            key={i}
                            onClick={() => setCurrentPhoto(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i === currentPhoto ? "bg-white" : "bg-white/50"
                            }`}
                            whileHover={{ scale: 1.2 }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Details */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                      {issue.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(issue.createdAt)}
                      </span>
                      <Badge variant="outline">{issue.category}</Badge>
                      <Badge className={priorityConfig[issue.priority]?.color || "bg-slate-100 text-slate-600"}>
                        {issue.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {issue.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Activity
                </h3>

                <div className="space-y-4">
                  <AnimatePresence>
                    {timeline.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.user === "You" 
                              ? "bg-blue-100 text-blue-600" 
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="w-0.5 flex-1 bg-slate-200 my-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-800 dark:text-white text-sm">
                              {item.user}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDate(item.timestamp)}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            item.type === "status" 
                              ? "text-blue-600 italic" 
                              : "text-slate-600 dark:text-slate-300"
                          }`}>
                            {item.message}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Comment input */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 pt-4 border-t"
                >
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button 
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || isSending}
                      className="gap-2"
                    >
                      {isSending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
