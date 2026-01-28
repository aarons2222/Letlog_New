"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Home, Key, Wrench, Check } from "lucide-react";
import Image from "next/image";

type UserRole = "landlord" | "contractor";

const roles = [
  { value: "landlord", label: "Landlord", icon: Home, desc: "I manage rental properties" },
  { value: "contractor", label: "Contractor", icon: Wrench, desc: "I provide repair services" },
] as const;

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("landlord");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    toast.success("Account created successfully!");
    setSignupSuccess(true);
    setLoading(false);
    // Clear form
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-md text-white">
          <h2 className="text-4xl font-bold mb-6">Start managing properties smarter</h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-12">
            Join landlords and contractors using LetLog to simplify property management.
          </p>
          
          <div className="space-y-4">
            {[
              "Track all your properties in one place",
              "Stay compliant with automatic reminders",
              "Handle maintenance requests effortlessly",
              "Invite tenants and manage everything in one place",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 mb-12">
            <Image src="/logo.svg" alt="LetLog" width={40} height={40} className="rounded-xl shadow-lg" />
            <span className="font-semibold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Let</span>
              <span>Log</span>
            </span>
          </Link>

          {signupSuccess ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Account Created!</h2>
              <p className="text-slate-600 mb-6">
                Please check your email to confirm your account.<br />
                Once confirmed, you can sign in.
              </p>
              <Link href="/login">
                <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
          <p className="text-slate-600 mb-8">Get started free — no credit card required</p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 font-medium">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-12 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
              />
              <p className="text-xs text-slate-500">Minimum 8 characters</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={`h-12 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20 ${
                  confirmPassword && password !== confirmPassword ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                      role === r.value 
                        ? "border-rose-500 bg-rose-50" 
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <r.icon className={`w-6 h-6 mx-auto mb-2 ${role === r.value ? "text-rose-600" : "text-slate-400"}`} />
                    <span className={`text-sm font-medium ${role === r.value ? "text-rose-900" : "text-slate-700"}`}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-base font-medium shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all mt-6" 
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-rose-600 font-medium hover:text-rose-700 transition-colors">
              Sign in
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-slate-500">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-700">Terms</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
