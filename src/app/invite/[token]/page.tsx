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
import { createClient } from "@/lib/supabase/client";

interface Invitation {
  id: string;
  tenancyId: string;
  email: string;
  invitedBy: string;
  landlordCompany: string;
  property: {
    address: string;
    type: string;
    bedrooms: number;
  };
  status: string;
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      setLoading(true);
      const supabase = createClient();
      
      try {
        // Fetch invitation by token
        const { data: inv, error: invError } = await supabase
          .from("tenant_invitations")
          .select(`
            *,
            tenancies (
              id,
              properties (
                address_line_1, address_line_2, city, postcode, property_type, bedrooms
              )
            ),
            profiles!tenant_invitations_invited_by_fkey (
              full_name
            )
          `)
          .eq("token", token)
          .single();

        if (invError || !inv) {
          setError("Invalid invitation link. Please contact your landlord for a new invitation.");
          setInvitation(null);
          setLoading(false);
          return;
        }

        // Check if invitation is expired
        if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
          setError("This invitation has expired. Please contact your landlord for a new invitation.");
          setInvitation(null);
          setLoading(false);
          return;
        }

        // Check if already accepted
        if (inv.status === "accepted") {
          setError("This invitation has already been accepted. Please log in to access your account.");
          setInvitation(null);
          setLoading(false);
          return;
        }

        const tenancy = inv.tenancies;
        const prop = tenancy?.properties;
        const address = prop
          ? [prop.address_line_1, prop.address_line_2, prop.city, prop.postcode]
              .filter(Boolean)
              .join(", ")
          : "Unknown property";

        setInvitation({
          id: inv.id,
          tenancyId: inv.tenancy_id,
          email: inv.email || "",
          invitedBy: inv.profiles?.full_name || "Your landlord",
          landlordCompany: inv.profiles?.full_name || "Property Management",
          property: {
            address,
            type: prop?.property_type || "property",
            bedrooms: prop?.bedrooms || 0,
          },
          status: inv.status,
          expiresAt: inv.expires_at || "",
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching invitation:", err);
        setError("Failed to load invitation. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
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

    if (!invitation) return;
    
    setSubmitting(true);
    const supabase = createClient();
    
    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "tenant",
          },
        },
      });

      if (authError) throw authError;

      // Update invitation status
      await supabase
        .from("tenant_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      // Add tenant to tenancy
      if (authData.user) {
        await supabase
          .from("tenancy_tenants")
          .insert({
            tenancy_id: invitation.tenancyId,
            tenant_id: authData.user.id,
            is_lead: false,
          });

        // Create or update profile
        await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            full_name: fullName,
            email: invitation.email,
            role: "tenant",
          });
      }

      toast.success("Account created!", {
        description: "Welcome to LetLog. Redirecting to your dashboard...",
      });
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Error creating account:", err);
      toast.error(err.message || "Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            <div className="w-12 h-12 bg-gradient-to-br from-[#E8998D] to-[#F4A261] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">L</span>
            </div>
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
            <CardTitle className="text-xl">You&apos;ve Been Invited!</CardTitle>
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
                  value={invitation?.email || ""}
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
