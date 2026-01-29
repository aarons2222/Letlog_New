'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, Plus, Home, Users, Calendar, UserPlus, 
  MoreVertical, Loader2, Mail, Building2, AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Property {
  id: string;
  address_line_1: string;
  city: string;
  postcode: string;
}

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
    name?: string;
  } | null;
}

export default function TenanciesPage() {
  const router = useRouter();
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProperties, setHasProperties] = useState(false);
  const [firstPropertyId, setFirstPropertyId] = useState<string | null>(null);
  const [endingTenancyId, setEndingTenancyId] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [deletingTenancyId, setDeletingTenancyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Add Tenant Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    propertyId: '',
    rentAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    tenancyLength: '12',
  });

  const handleEndTenancy = async () => {
    if (!endingTenancyId) return;
    
    setIsEnding(true);
    try {
      const res = await fetch(`/api/tenancies/${endingTenancyId}/end`, {
        method: 'POST',
      });
      
      if (res.ok) {
        // Update local state
        setTenancies(prev => 
          prev.map(t => 
            t.id === endingTenancyId 
              ? { ...t, status: 'ended', end_date: new Date().toISOString().split('T')[0] }
              : t
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to end tenancy');
      }
    } catch (err) {
      alert('Failed to end tenancy');
    } finally {
      setIsEnding(false);
      setEndingTenancyId(null);
    }
  };

  const handleDeleteTenancy = async () => {
    if (!deletingTenancyId) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tenancies/${deletingTenancyId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Remove from local state
        setTenancies(prev => prev.filter(t => t.id !== deletingTenancyId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete tenancy');
      }
    } catch (err) {
      alert('Failed to delete tenancy');
    } finally {
      setIsDeleting(false);
      setDeletingTenancyId(null);
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.propertyId || !formData.rentAmount || !formData.startDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsAdding(true);

    try {
      // Calculate end date
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(formData.tenancyLength));

      // Create tenancy via API
      // Use 'pending' status if inviting a tenant, 'draft' otherwise
      const tenancyRes = await fetch('/api/tenancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: formData.propertyId,
          start_date: formData.startDate,
          end_date: endDate.toISOString().split('T')[0],
          rent_amount: formData.rentAmount,
          rent_frequency: 'monthly',
          status: formData.email ? 'pending' : 'draft',
          tenant_name: formData.name,
          tenant_email: formData.email,
        }),
      });

      const tenancyData = await tenancyRes.json();

      if (!tenancyRes.ok) {
        alert('Failed to create tenancy: ' + (tenancyData.error || 'Unknown error'));
        setIsAdding(false);
        return;
      }

      // If email provided, send invitation
      if (formData.email && tenancyData.data?.id) {
        const inviteRes = await fetch('/api/invitations/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            tenancyId: tenancyData.data.id,
          }),
        });
        
        const inviteData = await inviteRes.json();
        if (!inviteRes.ok) {
          console.error('Invitation error:', inviteData.error);
          // Still continue - tenancy was created, just invitation failed
          alert('Tenancy created but invitation failed: ' + (inviteData.error || 'Unknown error'));
        }
      }

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        propertyId: properties.length === 1 ? properties[0].id : '',
        rentAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        tenancyLength: '12',
      });
      setShowAddModal(false);
      
      // Refresh the page to show new tenancy
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
    } finally {
      setIsAdding(false);
    }
  };

  const openAddModal = () => {
    // Auto-select first property if only one
    if (properties.length === 1) {
      setFormData(prev => ({ ...prev, propertyId: properties[0].id }));
    }
    setShowAddModal(true);
  };

  useEffect(() => {
    async function loadTenancies() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Get user's properties for the form dropdown
      const { data: propsData } = await supabase
        .from('properties')
        .select('id, address_line_1, city, postcode')
        .eq('landlord_id', user.id)
        .order('address_line_1');

      if (!propsData || propsData.length === 0) {
        setHasProperties(false);
        setProperties([]);
        setTenancies([]);
        setIsLoading(false);
        return;
      }

      setHasProperties(true);
      setProperties(propsData);
      setFirstPropertyId(propsData[0].id);

      // Fetch tenancies with invitations via API (bypasses RLS issues)
      const res = await fetch('/api/tenancies/list');
      const { data: enriched, error } = await res.json();

      if (error) {
        console.error('Failed to load tenancies:', error);
        setTenancies([]);
        setIsLoading(false);
        return;
      }

      setTenancies(enriched || []);
      setIsLoading(false);
    }

    loadTenancies();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'current':
        return 'bg-green-100 text-green-700';
      case 'draft':
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
    <div className="">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenants</h1>
          <p className="text-sm text-slate-500">Manage your tenants</p>
        </div>
        {hasProperties && tenancies.length > 0 && (
          <Button 
            onClick={openAddModal}
            className="gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261]"
          >
            <UserPlus className="w-4 h-4" />
            Add Tenant
          </Button>
        )}
      </div>
          {tenancies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              {hasProperties ? (
                <>
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">No tenants yet</h2>
                  <p className="text-slate-500 mb-6">Add your first tenant to get started</p>
                  <Button 
                    onClick={openAddModal}
                    className="gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261]"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Tenant
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">No tenants yet</h2>
                  <p className="text-slate-500 mb-6">Add a property first, then add tenants</p>
                  <Link href="/properties/new">
                    <Button className="gap-2 bg-gradient-to-r from-[#E8998D] to-[#F4A261]">
                      <Building2 className="w-4 h-4" />
                      Add Property
                    </Button>
                  </Link>
                </>
              )}
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
                  <Card className="border-0 shadow-lg bg-white/70 backdrop-blur hover:shadow-xl transition-all overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      {/* Mobile: Badge + Menu at top */}
                      <div className="flex items-center justify-between mb-3 sm:hidden">
                        {tenancy.pending_invite && !tenancy.tenant_profile ? (
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                            Pending Invite
                          </Badge>
                        ) : (
                          <Badge className={getStatusColor(tenancy.status) + " text-xs"}>
                            {tenancy.status}
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                            {tenancy.status !== 'ended' && (
                              <DropdownMenuItem 
                                className="text-orange-600"
                                onClick={() => setEndingTenancyId(tenancy.id)}
                              >
                                End Tenancy
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeletingTenancyId(tenancy.id)}
                            >
                              Delete Tenancy
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex gap-3 sm:gap-4">
                          {/* Property Icon */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                            <Home className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                              {tenancy.properties?.address_line_1}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500">
                              {tenancy.properties?.city}, {tenancy.properties?.postcode}
                            </p>

                            {/* Tenant Info */}
                            <div className="mt-2 sm:mt-3">
                              {tenancy.tenant_profile ? (
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Users className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <span className="text-slate-700 truncate">{tenancy.tenant_profile.full_name}</span>
                                </div>
                              ) : tenancy.pending_invite ? (
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Mail className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                                  <span className="text-slate-500 truncate">
                                    {tenancy.pending_invite.name || tenancy.pending_invite.email}
                                    {tenancy.pending_invite.name && <span className="text-slate-400 ml-1">({tenancy.pending_invite.email})</span>}
                                  </span>
                                </div>
                              ) : (
                                <Link href={`/tenancies/${tenancy.id}/invite`}>
                                  <Button variant="outline" size="sm" className="gap-2 text-[#E8998D] border-[#E8998D] hover:bg-[#E8998D]/10 text-xs h-8">
                                    <UserPlus className="w-3 h-3" />
                                    Invite Tenant
                                  </Button>
                                </Link>
                              )}
                            </div>

                            {/* Dates & Rent */}
                            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                {new Date(tenancy.start_date).toLocaleDateString('en-GB')}
                                {tenancy.end_date && ` - ${new Date(tenancy.end_date).toLocaleDateString('en-GB')}`}
                              </div>
                              {tenancy.rent_amount && (
                                <div className="font-medium">
                                  £{tenancy.rent_amount.toLocaleString()}/{tenancy.rent_frequency || 'month'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side - Desktop only */}
                        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                          {tenancy.pending_invite && !tenancy.tenant_profile ? (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              Pending Invite
                            </Badge>
                          ) : (
                            <Badge className={getStatusColor(tenancy.status)}>
                              {tenancy.status}
                            </Badge>
                          )}

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
                              {tenancy.status !== 'ended' && (
                                <DropdownMenuItem 
                                  className="text-orange-600"
                                  onClick={() => setEndingTenancyId(tenancy.id)}
                                >
                                  End Tenancy
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => setDeletingTenancyId(tenancy.id)}
                              >
                                Delete Tenancy
                              </DropdownMenuItem>
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

      {/* End Tenancy Confirmation Dialog */}
      <AlertDialog open={!!endingTenancyId} onOpenChange={(open) => !open && setEndingTenancyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              End Tenancy
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this tenancy? This will mark the tenancy as ended with today&apos;s date. The tenancy record will be preserved for your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEnding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndTenancy}
              disabled={isEnding}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isEnding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ending...
                </>
              ) : (
                'End Tenancy'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tenancy Confirmation Dialog */}
      <AlertDialog open={!!deletingTenancyId} onOpenChange={(open) => !open && setDeletingTenancyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Tenancy
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this tenancy? This will remove all tenancy records, pending invites, and associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenancy}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Forever'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Tenant Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#E8998D]" />
              Add Tenant
            </DialogTitle>
            <DialogDescription>
              Add a new tenant to one of your properties
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddTenant} className="space-y-4 mt-4">
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

            {/* Email for invitation */}
            <div className="space-y-2">
              <Label htmlFor="email">Tenant Email (for invitation)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <p className="text-xs text-slate-500">We&apos;ll send them an invite to access their tenancy</p>
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

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddModal(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="flex-1 bg-gradient-to-r from-[#E8998D] to-[#F4A261]"
              >
                {isAdding ? (
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
