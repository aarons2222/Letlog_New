"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Reset link sent! Check your email.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 via-white to-rose-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center gap-3 mb-12">
          <Image src="/logo.svg" alt="LetLog" width={40} height={40} className="rounded-xl shadow-lg" />
          <span className="font-semibold text-xl tracking-tight">
            <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Let</span>
            <span>Log</span>
          </span>
        </Link>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Check your email</h1>
            <p className="text-slate-600 mb-2">
              We've sent a password reset link to
            </p>
            <p className="font-medium text-slate-900 mb-8">{email}</p>
            <p className="text-sm text-slate-500 mb-8">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setIsSuccess(false)}
                className="rounded-xl"
              >
                Try again
              </Button>
              <Link href="/login">
                <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">
                  Back to login
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset your password</h1>
            <p className="text-slate-600 mb-8">
              Enter your email and we'll send you a reset link
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-11 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-base font-medium shadow-lg shadow-slate-900/10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  "Send reset link"
                )}
              </Button>

              <Link 
                href="/login" 
                className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mt-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
