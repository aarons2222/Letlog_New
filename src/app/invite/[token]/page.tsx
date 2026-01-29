'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Home, CheckCircle2, AlertCircle, ArrowRight, Key, Loader2, User, Mail } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  properties: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    postcode: string;
    property_type: string;
    bedrooms: number;
  };
  profiles: {
    full_name: string;
  };
}

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/tenants/accept?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Invalid invitation');
          setInvitation(null);
        } else {
          setInvitation(data.invite);
          setError(null);
        }
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/tenants/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, full_name: fullName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'USER_EXISTS') {
          toast.error(data.error);
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Failed to create account');
      }

      setSuccess(true);
      toast.success('Account created successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8998D]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Invalid Invitation</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link href="/">
              <Button>Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Welcome to LetLog!</h2>
              <p className="text-slate-600 mb-2">Your account has been created.</p>
              <p className="text-sm text-slate-500">Redirecting to login...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#E8998D] to-[#F4A261] flex items-center justify-center">
              <Key className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Join Your Tenancy</CardTitle>
            <CardDescription>
              {invitation?.profiles?.full_name || 'Your landlord'} has invited you to LetLog
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Property Info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">{invitation?.properties?.address_line_1}</p>
                  {invitation?.properties?.address_line_2 && (
                    <p className="text-sm text-slate-600">{invitation.properties.address_line_2}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    {invitation?.properties?.city}, {invitation?.properties?.postcode}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {invitation?.properties?.bedrooms} bed {invitation?.properties?.property_type}
                  </p>
                </div>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={invitation?.email || ''}
                    disabled
                    className="pl-10 bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-[#E8998D] hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
