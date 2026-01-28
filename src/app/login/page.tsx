"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Mail, ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const router = useRouter();
  const supabase = createClient();

  // Simple email validation
  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Check your email for the login link!");
    setLoading(false);
  };

  const switchToMagicLink = () => {
    setMode("magic");
    setPassword("");
  };

  const switchToPassword = () => {
    setMode("password");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-start justify-center px-6 pt-16 pb-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 mb-12">
            <Image src="/logo.svg" alt="LetLog" width={40} height={40} className="rounded-xl shadow-lg" />
            <span className="font-semibold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Let</span>
              <span>Log</span>
            </span>
          </Link>

          <div className="min-h-[460px]">
          <AnimatePresence mode="wait">
            {mode === "password" ? (
              <motion.div
                key="password-mode"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
                <p className="text-slate-600 mb-8">Sign in to your account to continue</p>

                <form onSubmit={handleLogin} className="space-y-5">
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
                        required
                        className="h-12 pl-11 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-rose-600 hover:text-rose-700 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-11 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-base font-medium shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all" 
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-slate-500">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 text-base font-medium"
                  onClick={switchToMagicLink}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Sign in with Magic Link
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="magic-mode"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <button 
                  onClick={switchToPassword}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to password sign in
                </button>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Magic Link</h1>
                <p className="text-slate-600 mb-8">We'll email you a link to sign in instantly — no password needed</p>

                <form onSubmit={handleMagicLink} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email" className="text-slate-700 font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 pl-11 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-base font-medium shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={loading || !isValidEmail}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        {isValidEmail ? "Send Link" : "Enter valid email"}
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          <p className="mt-8 text-center text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-rose-600 font-medium hover:text-rose-700 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-4xl font-bold mb-6">Manage your properties with ease</h2>
          <p className="text-rose-100 text-lg leading-relaxed">
            Track tenancies, handle maintenance, stay compliant — all from one beautiful dashboard.
          </p>
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-medium"
                >
                  {["👤", "🏠", "🔧", "📋"][i - 1]}
                </div>
              ))}
            </div>
            <p className="text-sm text-rose-100">
              <span className="font-semibold text-white">2,000+</span> landlords already onboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
