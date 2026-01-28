"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Home, CheckCircle2, AlertCircle, ArrowRight, Key, Loader2 } from "lucide-react";

// Mock invitation data - would come from Supabase
const mockInvitation = {
  id: "inv1",
  tenancyId: "t1",
  email: "newtenant@example.com",
  invitedBy: "John Smith",
  landlordCompany: "Property Management Ltd",
  property: {
    address: "42 Oak Street, London, E1 4AB",
    type: "flat",
    bedrooms: 2,
  },
  status: "pending",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<typeof mockInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Simulate fetching invitation
    const fetchInvitation = async () => {
      setLoading(true);
      
      // In reality, fetch from Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if token is valid
      if (token === "invalid" || token === "expired") {
        setError(token === "expired" ? "This invitation has expired." : "Invalid invitation link.");
        setInvitation(null);
      } else {
        setInvitation(mockInvitation);
        setError(null);
      }
      
      setLoading(false);
    };
    
    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    setSubmitting(true);
    
    // Simulate account creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Account created!", {
      description: "Welcome to LetLog. Redirecting to your dashboard...",
    });
    
    // Redirect to dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-2xl">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Invitation Not Valid</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <p className="text-sm text-slate-500 mb-6">
              Please contact your landlord to request a new invitation.
            </p>
            <Link href="/">
              <Button variant="outline" className="rounded-xl">
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo.svg" alt="LetLog" width={48} height={48} className="rounded-xl shadow-lg" />
            <span className="font-semibold text-2xl tracking-tight">
              <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">Let</span>
              <span>Log</span>
            </span>
          </Link>
        </div>

        <Card className="rounded-2xl shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-7 h-7 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">You've Been Invited!</CardTitle>
            <CardDescription className="text-base">
              {invitation?.invitedBy} has invited you to join as a tenant
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Property Info */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Home className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{invitation?.property.address}</p>
                  <p className="text-sm text-slate-600">
                    {invitation?.property.bedrooms} bed {invitation?.property.type}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Managed by {invitation?.landlordCompany}
                  </p>
                </div>
              </div>
            </div>

            {/* Create Account Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation?.email}
                  disabled
                  className="rounded-xl bg-slate-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="rounded-xl"
                />
                <p className="text-xs text-slate-500">Minimum 8 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 h-12 text-base"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Benefits */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">As a tenant you can:</p>
              <ul className="space-y-2">
                {[
                  "Report maintenance issues with photos",
                  "Access your tenancy documents",
                  "Track repair progress in real-time",
                  "Leave reviews for contractors",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-slate-500 text-center">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-slate-700">Terms</Link> and{" "}
              <Link href="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
