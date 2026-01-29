'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';

interface Property {
  id: string;
  address_line_1: string;
  city: string;
  postcode: string;
}

export default function AddTenantPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    propertyId: '',
    rentAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    tenancyLength: '12', // months
  });

  useEffect(() => {
    async function loadProperties() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('properties')
        .select('id, address_line_1, city, postcode')
        .eq('landlord_id', user.id)
        .order('address_line_1');

      setProperties(data || []);
      setLoadingProperties(false);
      
      // Auto-select first property if only one
      if (data && data.length === 1) {
        setFormData(prev => ({ ...prev, propertyId: data[0].id }));
      }
    }

    loadProperties();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.propertyId || !formData.rentAmount || !formData.startDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Calculate end date based on tenancy length
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(formData.tenancyLength));

      // Create the tenancy record
      const { data: tenancy, error: tenancyError } = await supabase
        .from('tenancies')
        .insert({
          property_id: formData.propertyId,
          start_date: formData.startDate,
          end_date: endDate.toISOString().split('T')[0],
          rent_amount: parseFloat(formData.rentAmount),
          rent_frequency: 'monthly',
          status: 'pending',
        })
        .select()
        .single();

      if (tenancyError) {
        console.error('Tenancy error:', tenancyError);
        alert('Failed to create tenancy: ' + tenancyError.message);
        setIsLoading(false);
        return;
      }

      // If email provided, create invite
      if (formData.email) {
        const res = await fetch('/api/tenants/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            tenancy_id: tenancy.id,
            property_id: formData.propertyId,
            tenant_name: formData.name,
          }),
        });

        if (!res.ok) {
          console.error('Invite failed but tenancy created');
        }
      }

      router.push('/tenancies');
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingProperties) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8998D]" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">No Properties Yet</h1>
          <p className="text-slate-500 mb-6">Add a property before inviting tenants</p>
          <Link href="/properties/new">
            <Button className="bg-gradient-to-r from-[#E8998D] to-[#F4A261]">
              Add Property
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/tenancies" className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tenants
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Add Tenant</h1>
        <p className="text-slate-500">Add a new tenant to one of your properties</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#E8998D]" />
            Tenant Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tenant Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <p className="text-xs text-slate-500">If provided, we&apos;ll send an invite to join the app</p>
            </div>

            {/* Property */}
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <Select
                value={formData.propertyId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address_line_1}, {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rent Amount */}
            <div className="space-y-2">
              <Label htmlFor="rent">Monthly Rent (£) *</Label>
              <Input
                id="rent"
                type="number"
                placeholder="1200"
                value={formData.rentAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                required
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Tenancy Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            {/* Tenancy Length */}
            <div className="space-y-2">
              <Label htmlFor="length">Tenancy Length *</Label>
              <Select
                value={formData.tenancyLength}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tenancyLength: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="18">18 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Link href="/tenancies" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#E8998D] to-[#F4A261]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Tenant'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
