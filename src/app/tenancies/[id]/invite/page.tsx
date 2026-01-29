'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Send, CheckCircle2, Loader2, Home, User } from 'lucide-react';

interface Tenancy {
  id: string;
  start_date: string;
  rent_amount: number;
  property: {
    id: string;
    address_line_1: string;
    city: string;
    postcode: string;
  };
}

export default function InviteTenantPage() {
  const params = useParams();
  const router = useRouter();
  const tenancyId = params.id as string;

  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function loadTenancy() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('tenancies')
        .select(`
          id, start_date, rent_amount,
          properties!inner (id, address_line_1, city, postcode, landlord_id)
        `)
        .eq('id', tenancyId)
        .single();

      if (error || !data) {
        toast.error('Tenancy not found');
        router.push('/tenancies');
        return;
      }

      // Check ownership
      if ((data.properties as any).landlord_id !== user.id) {
        toast.error('Not authorized');
        router.push('/tenancies');
        return;
      }

      setTenancy({
        id: data.id,
        start_date: data.start_date,
        rent_amount: data.rent_amount,
        property: {
          id: (data.properties as any).id,
          address_line_1: (data.properties as any).address_line_1,
          city: (data.properties as any).city,
          postcode: (data.properties as any).postcode,
        },
      });
      setLoading(false);
    }

    loadTenancy();
  }, [tenancyId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !tenancy) return;

    setSending(true);

    try {
      const res = await fetch('/api/tenants/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tenancy_id: tenancy.id,
          property_id: tenancy.property.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setSent(true);
      toast.success('Invitation sent!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8998D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/tenancies" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Tenancies
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#E8998D] to-[#F4A261] flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Invite Tenant</CardTitle>
              <CardDescription>
                Send an invitation to your tenant to join LetLog
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Property Info */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">{tenancy?.property.address_line_1}</p>
                    <p className="text-sm text-slate-500">{tenancy?.property.city}, {tenancy?.property.postcode}</p>
                  </div>
                </div>
              </div>

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Invitation Sent!</h3>
                  <p className="text-slate-600 mb-6">
                    We've sent an email to <strong>{email}</strong> with instructions to join.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => { setSent(false); setEmail(''); }}>
                      Invite Another
                    </Button>
                    <Button onClick={() => router.push('/tenancies')}>
                      Done
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Tenant's Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tenant@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261]"
                    disabled={sending || !email}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    The tenant will receive an email with a link to create their account and access the property.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
