'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { 
  ArrowLeft, Plus, Home, Users, Calendar, UserPlus, 
  MoreVertical, Loader2, Mail, Building2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Tenancy {
  id: string;
  property_id: string;
  tenant_id: string | null;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  rent_frequency: string;
  status: string;
  created_at: string;
  properties: {
    address_line_1: string;
    city: string;
    postcode: string;
    bedrooms: number;
    property_type: string;
  };
  tenant_profile?: {
    full_name: string;
    email: string;
  } | null;
  pending_invite?: {
    email: string;
  } | null;
}

export default function TenanciesPage() {
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTenancies() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Get user's properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('landlord_id', user.id);

      if (!properties || properties.length === 0) {
        setTenancies([]);
        setIsLoading(false);
        return;
      }

      const propIds = properties.map(p => p.id);

      // Get tenancies with property info
      const { data: tenanciesData } = await supabase
        .from('tenancies')
        .select(`
          *,
          properties (address_line_1, city, postcode, bedrooms, property_type)
        `)
        .in('property_id', propIds)
        .order('created_at', { ascending: false });

      if (!tenanciesData) {
        setTenancies([]);
        setIsLoading(false);
        return;
      }

      // Enrich with tenant info and pending invites
      const enriched = await Promise.all(
        tenanciesData.map(async (t) => {
          let tenant_profile = null;
          let pending_invite = null;

          // Get tenant profile if tenant_id exists
          if (t.tenant_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', t.tenant_id)
              .maybeSingle();
            tenant_profile = profile;
          }

          // Check for pending invite
          const { data: invite } = await supabase
            .from('tenant_invites')
            .select('email')
            .eq('tenancy_id', t.id)
            .eq('status', 'pending')
            .maybeSingle();
          pending_invite = invite;

          return {
            ...t,
            tenant_profile,
            pending_invite,
          };
        })
      );

      setTenancies(enriched);
      setIsLoading(false);
    }

    loadTenancies();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'current':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'ended':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8998D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Tenancies</h1>
              <p className="text-sm text-slate-500">Manage your tenancy agreements</p>
            </div>
          </div>
          <Link href="/tenancies/new">
            <Button className="gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261]">
              <Plus className="w-4 h-4" />
              New Tenancy
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        <Sidebar role="landlord" />

        <main className="flex-1 p-6">
          {tenancies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">No tenancies yet</h2>
              <p className="text-slate-500 mb-6">Create a tenancy to start managing your rentals</p>
              <Link href="/tenancies/new">
                <Button className="gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261]">
                  <Plus className="w-4 h-4" />
                  Create First Tenancy
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {tenancies.map((tenancy, index) => (
                <motion.div
                  key={tenancy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg bg-white/70 backdrop-blur hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          {/* Property Icon */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <Home className="w-6 h-6 text-slate-600" />
                          </div>

                          {/* Info */}
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {tenancy.properties?.address_line_1}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {tenancy.properties?.city}, {tenancy.properties?.postcode}
                            </p>

                            {/* Tenant Info */}
                            <div className="mt-3 flex items-center gap-4">
                              {tenancy.tenant_profile ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="w-4 h-4 text-green-600" />
                                  <span className="text-slate-700">{tenancy.tenant_profile.full_name}</span>
                                  <span className="text-slate-400">({tenancy.tenant_profile.email})</span>
                                </div>
                              ) : tenancy.pending_invite ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-4 h-4 text-yellow-600" />
                                  <span className="text-slate-500">Invite pending: {tenancy.pending_invite.email}</span>
                                </div>
                              ) : (
                                <Link href={`/tenancies/${tenancy.id}/invite`}>
                                  <Button variant="outline" size="sm" className="gap-2 text-[#E8998D] border-[#E8998D] hover:bg-[#E8998D]/10">
                                    <UserPlus className="w-4 h-4" />
                                    Invite Tenant
                                  </Button>
                                </Link>
                              )}
                            </div>

                            {/* Dates & Rent */}
                            <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(tenancy.start_date).toLocaleDateString('en-GB')}
                                {tenancy.end_date && ` - ${new Date(tenancy.end_date).toLocaleDateString('en-GB')}`}
                              </div>
                              {tenancy.rent_amount && (
                                <div>
                                  £{tenancy.rent_amount.toLocaleString()}/{tenancy.rent_frequency || 'month'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(tenancy.status)}>
                            {tenancy.status}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/tenancies/${tenancy.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              {!tenancy.tenant_profile && !tenancy.pending_invite && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/tenancies/${tenancy.id}/invite`}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Invite Tenant
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>Edit Tenancy</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">End Tenancy</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
