"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
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

// Mock data for a single issue
const mockIssue = {
  id: "1",
  title: "Boiler not heating water",
  description: "Hot water stopped working yesterday evening around 7pm. The boiler display shows an error code (E119). I tried resetting it by turning it off and on but the problem persists. Cold water works fine. This is affecting our ability to shower and wash dishes.",
  property: "42 Oak Lane, Flat 2",
  status: "in_progress" as const,
  priority: "high" as const,
  category: "Plumbing",
  createdAt: "2026-01-25T18:30:00",
  updatedAt: "2026-01-27T10:15:00",
  photos: [
    "/api/placeholder/400/300",
    "/api/placeholder/400/300",
  ],
  timeline: [
    { 
      id: 1, 
      type: "created", 
      message: "Issue reported", 
      user: "You",
      timestamp: "2026-01-25T18:30:00"
    },
    { 
      id: 2, 
      type: "status", 
      message: "Status changed to In Progress", 
      user: "Landlord",
      timestamp: "2026-01-26T09:00:00"
    },
    { 
      id: 3, 
      type: "comment", 
      message: "I've contacted a plumber. They can come tomorrow between 10am-2pm. Will that work?", 
      user: "Landlord",
      timestamp: "2026-01-26T09:15:00"
    },
    { 
      id: 4, 
      type: "comment", 
      message: "Yes, that works. I'll be home.", 
      user: "You",
      timestamp: "2026-01-26T10:30:00"
    },
    { 
      id: 5, 
      type: "comment", 
      message: "Great, plumber confirmed for tomorrow 11am. His name is Dave from QuickFix Plumbing.", 
      user: "Landlord",
      timestamp: "2026-01-26T14:00:00"
    },
  ],
};

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
  const [newComment, setNewComment] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const issue = mockIssue;
  const StatusIcon = statusConfig[issue.status].icon;

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSending(false);
    setNewComment("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            <Badge className={statusConfig[issue.status].color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig[issue.status].label}
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
                        {issue.photos.map((_, i) => (
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
                      <Badge className={priorityConfig[issue.priority].color}>
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
                    {issue.timeline.map((item, index) => (
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
                          {index < issue.timeline.length - 1 && (
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
