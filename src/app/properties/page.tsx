"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { 
  ArrowLeft, Plus, Search, Home, MapPin, Bed, Bath, 
  Users, AlertTriangle, MoreVertical, Edit, Trash2, Eye,
  Building2, Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Property {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  // Computed fields
  status?: 'occupied' | 'vacant';
  tenant_count?: number;
  compliance_status?: 'valid' | 'expiring' | 'expired';
  rent_amount?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperties() {
      const supabase = createClient();
      
      try {
        // Refresh session first to ensure RLS works
        await supabase.auth.refreshSession();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          window.location.href = '/login';
          return;
        }

        // Fetch properties for this landlord
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .eq('landlord_id', user.id)
          .order('created_at', { ascending: false });

        if (!propertiesData) {
          setProperties([]);
          return;
        }

        // Enrich properties with tenancy and compliance data
        const enrichedProperties = await Promise.all(
          propertiesData.map(async (prop) => {
            // Get tenancies for this property (no tenant_id in schema, just status)
            const { data: tenancies } = await supabase
              .from('tenancies')
              .select('id, status, rent_amount')
              .eq('property_id', prop.id);
            
            // Filter active tenancies client-side (status is enum)
            const activeTenancies = tenancies?.filter(t => 
              t.status?.toLowerCase() === 'active' || t.status?.toLowerCase() === 'current'
            ) || [];

            // Get compliance status
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const now = new Date();
            
            const { data: compliance } = await supabase
              .from('compliance_items')
              .select('id, expiry_date, status')
              .eq('property_id', prop.id);

            let complianceStatus: 'valid' | 'expiring' | 'expired' = 'valid';
            if (compliance) {
              const validItems = compliance.filter(c => c.status?.toLowerCase() === 'valid');
              const expired = validItems.some(c => new Date(c.expiry_date) < now);
              const expiring = validItems.some(c => new Date(c.expiry_date) < thirtyDaysFromNow);
              if (expired) complianceStatus = 'expired';
              else if (expiring) complianceStatus = 'expiring';
            }

            return {
              ...prop,
              status: activeTenancies.length > 0 ? 'occupied' : 'vacant',
              tenant_count: activeTenancies.length,
              compliance_status: complianceStatus,
              rent_amount: activeTenancies[0]?.rent_amount || 0,
            } as Property;
          })
        );

        setProperties(enrichedProperties);
      } catch (err) {
        console.error('Failed to load properties:', err);
        setError('Failed to load properties');
      } finally {
        setIsLoading(false);
      }
    }

    loadProperties();
  }, []);

  const filteredProperties = properties.filter(p => {
    const matchesSearch = 
      p.address_line_1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.postcode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !filterStatus || p.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: properties.length,
    occupied: properties.filter(p => p.status === "occupied").length,
    vacant: properties.filter(p => p.status === "vacant").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8998D]" />
          <p className="text-slate-600">Loading properties...</p>
        </div>
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
              <h1 className="text-xl font-bold text-slate-800">Properties</h1>
              <p className="text-sm text-slate-500">Manage your property portfolio</p>
            </div>
          </div>
          <Link href="/properties/new">
            <Button className="gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261] hover:from-[#d88a7e] hover:to-[#e39555]">
              <Plus className="w-4 h-4" />
              Add Property
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        <Sidebar role="landlord" />
        
        <main className="flex-1 p-6">
          {/* Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur cursor-pointer" onClick={() => setFilterStatus(null)}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-sm text-slate-500">Total</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur cursor-pointer" onClick={() => setFilterStatus('occupied')}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.occupied}</p>
                <p className="text-sm text-slate-500">Occupied</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur cursor-pointer" onClick={() => setFilterStatus('vacant')}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-orange-600">{stats.vacant}</p>
                <p className="text-sm text-slate-500">Vacant</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by address, city, or postcode..."
                className="pl-10 bg-white/70 backdrop-blur border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>

          {/* Empty state */}
          {properties.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">No properties yet</h2>
              <p className="text-slate-500 mb-6">Add your first property to get started</p>
              <Link href="/properties/new">
                <Button className="gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261]">
                  <Plus className="w-4 h-4" />
                  Add Your First Property
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Property Grid */}
          {properties.length > 0 && (
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* No results */}
          {properties.length > 0 && filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No properties match your search</p>
              <Button variant="link" onClick={() => { setSearchQuery(''); setFilterStatus(null); }}>
                Clear filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'flat': return '🏢';
      case 'house': return '🏠';
      case 'bungalow': return '🏡';
      case 'studio': return '🏬';
      default: return '🏠';
    }
  };

  const getComplianceColor = (status?: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-700';
      case 'expiring': return 'bg-yellow-100 text-yellow-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <motion.div variants={itemVariants} layout>
      <Link href={`/properties/${property.id}`}>
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur hover:shadow-xl transition-all cursor-pointer group overflow-hidden">
          <CardContent className="p-4">
            {/* Mobile-first horizontal layout */}
            <div className="flex gap-3">
              {/* Compact icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{getPropertyIcon(property.property_type)}</span>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Address + menu */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">
                      {property.address_line_1}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {property.city}, {property.postcode}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3" /> {property.bedrooms} bed
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-3 h-3" /> {property.bathrooms} bath
                  </span>
                  {property.tenant_count ? (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {property.tenant_count}
                    </span>
                  ) : null}
                  {property.rent_amount ? (
                    <span className="font-medium text-slate-800">
                      £{property.rent_amount.toLocaleString()}/mo
                    </span>
                  ) : null}
                </div>

                {/* Badges */}
                <div className="flex gap-2 mt-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0 ${property.status === 'occupied' ? 'border-green-300 text-green-700 bg-green-50' : 'border-orange-300 text-orange-700 bg-orange-50'}`}
                  >
                    {property.status === 'occupied' ? 'Occupied' : 'Vacant'}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0 ${getComplianceColor(property.compliance_status)}`}
                  >
                    {property.compliance_status === 'valid' && 'Compliant'}
                    {property.compliance_status === 'expiring' && 'Expiring'}
                    {property.compliance_status === 'expired' && 'Expired'}
                    {!property.compliance_status && 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
