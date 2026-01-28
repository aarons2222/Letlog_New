"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Home, 
  Users, 
  Calendar, 
  Plus, 
  MoreVertical, 
  UserPlus,
  XCircle,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - would come from Supabase
const mockTenancies = [
  {
    id: "1",
    property: {
      id: "p1",
      address: "42 Oak Street, London, E1 4AB",
      type: "flat",
      bedrooms: 2,
    },
    tenants: [
      { id: "t1", name: "Sarah Johnson", email: "sarah@example.com", isLead: true },
      { id: "t2", name: "Mike Johnson", email: "mike@example.com", isLead: false },
    ],
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    rentAmount: 1500,
    status: "active",
  },
  {
    id: "2",
    property: {
      id: "p2",
      address: "15 Maple Avenue, Manchester, M1 2BB",
      type: "house",
      bedrooms: 3,
    },
    tenants: [
      { id: "t3", name: "Emma Wilson", email: "emma@example.com", isLead: true },
    ],
    startDate: "2023-09-01",
    endDate: "2024-08-31",
    rentAmount: 1200,
    status: "active",
  },
  {
    id: "3",
    property: {
      id: "p3",
      address: "8 Pine Road, Birmingham, B2 3CC",
      type: "flat",
      bedrooms: 1,
    },
    tenants: [
      { id: "t4", name: "James Brown", email: "james@example.com", isLead: true },
    ],
    startDate: "2022-03-01",
    endDate: "2023-02-28",
    rentAmount: 850,
    status: "ended",
    endedAt: "2023-02-28",
  },
];

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  ended: "bg-slate-100 text-slate-600",
  terminated: "bg-red-100 text-red-700",
};

export default function TenanciesPage() {
  const [tenancies, setTenancies] = useState(mockTenancies);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // End Tenancy Dialog
  const [endTenancyOpen, setEndTenancyOpen] = useState(false);
  const [selectedTenancy, setSelectedTenancy] = useState<typeof mockTenancies[0] | null>(null);
  const [endReason, setEndReason] = useState("");
  const [endNotes, setEndNotes] = useState("");
  
  // Invite Tenant Dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  const filteredTenancies = tenancies.filter((t) => {
    const matchesSearch = 
      t.property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenants.some(tenant => tenant.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEndTenancy = (tenancy: typeof mockTenancies[0]) => {
    setSelectedTenancy(tenancy);
    setEndTenancyOpen(true);
  };

  const confirmEndTenancy = () => {
    if (!selectedTenancy) return;
    
    // Update tenancy status
    setTenancies(prev => prev.map(t => 
      t.id === selectedTenancy.id 
        ? { ...t, status: "ended", endedAt: new Date().toISOString() }
        : t
    ));
    
    toast.success("Tenancy ended", {
      description: "Former tenants can leave reviews for 60 days.",
    });
    
    setEndTenancyOpen(false);
    setSelectedTenancy(null);
    setEndReason("");
    setEndNotes("");
  };

  const handleInviteTenant = (tenancy: typeof mockTenancies[0]) => {
    setSelectedTenancy(tenancy);
    setInviteOpen(true);
  };

  const sendInvitation = () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    // Would send invitation via Supabase
    toast.success("Invitation sent", {
      description: `Invitation sent to ${inviteEmail}`,
    });
    
    setInviteOpen(false);
    setInviteEmail("");
    setInviteName("");
    setSelectedTenancy(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tenancies</h1>
              <p className="text-slate-600 mt-1">Manage your tenancy agreements</p>
            </div>
            <Link href="/tenancies/new">
              <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                New Tenancy
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            placeholder="Search by property or tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm rounded-xl"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tenancy Cards */}
        <div className="grid gap-6">
          {filteredTenancies.map((tenancy) => (
            <Card key={tenancy.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Home className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tenancy.property.address}</CardTitle>
                      <CardDescription className="mt-1">
                        {tenancy.property.bedrooms} bed {tenancy.property.type}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[tenancy.status]}>
                      {tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => handleInviteTenant(tenancy)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Tenant
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Email Tenants
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {tenancy.status === "active" && (
                          <DropdownMenuItem 
                            onClick={() => handleEndTenancy(tenancy)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            End Tenancy
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  {/* Tenants */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                      <Users className="w-4 h-4" />
                      Tenants
                    </div>
                    <div className="space-y-1">
                      {tenancy.tenants.map((tenant) => (
                        <div key={tenant.id} className="text-sm text-slate-700">
                          {tenant.name}
                          {tenant.isLead && (
                            <span className="text-xs text-slate-400 ml-1">(Lead)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      Term
                    </div>
                    <div className="text-sm text-slate-700">
                      {new Date(tenancy.startDate).toLocaleDateString('en-GB', { 
                        day: 'numeric', month: 'short', year: 'numeric' 
                      })}
                      {" → "}
                      {tenancy.endDate ? new Date(tenancy.endDate).toLocaleDateString('en-GB', { 
                        day: 'numeric', month: 'short', year: 'numeric' 
                      }) : "Rolling"}
                    </div>
                    {tenancy.status === "ended" && tenancy.endedAt && (
                      <div className="text-xs text-slate-500 mt-1">
                        Ended: {new Date(tenancy.endedAt).toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </div>

                  {/* Rent */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                      £ Rent
                    </div>
                    <div className="text-sm text-slate-700">
                      £{tenancy.rentAmount.toLocaleString()}/month
                    </div>
                  </div>
                </div>

                {/* Review Window Notice for Ended Tenancies */}
                {tenancy.status === "ended" && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-amber-800">Review window active</span>
                      <p className="text-amber-700 mt-0.5">
                        Former tenants can leave a review until{" "}
                        {new Date(new Date(tenancy.endedAt!).getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredTenancies.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No tenancies found</h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Create your first tenancy to get started"}
                </p>
                <Link href="/tenancies/new">
                  <Button className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tenancy
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* End Tenancy Dialog */}
      <Dialog open={endTenancyOpen} onOpenChange={setEndTenancyOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              End Tenancy
            </DialogTitle>
            <DialogDescription>
              This will mark the tenancy as ended. Former tenants will have 60 days to leave a review.
            </DialogDescription>
          </DialogHeader>

          {selectedTenancy && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="font-medium text-slate-900">{selectedTenancy.property.address}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {selectedTenancy.tenants.map(t => t.name).join(", ")}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason for ending</Label>
                <Select value={endReason} onValueChange={setEndReason}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural_end">End of fixed term</SelectItem>
                    <SelectItem value="mutual_agreement">Mutual agreement</SelectItem>
                    <SelectItem value="tenant_notice">Tenant gave notice</SelectItem>
                    <SelectItem value="landlord_notice">Landlord gave notice</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Any additional notes about the tenancy ending..."
                  value={endNotes}
                  onChange={(e) => setEndNotes(e.target.value)}
                  className="rounded-xl"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEndTenancyOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={confirmEndTenancy} className="rounded-xl bg-amber-600 hover:bg-amber-700">
              End Tenancy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Tenant Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-500" />
              Invite Tenant
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to add a tenant to this tenancy.
            </DialogDescription>
          </DialogHeader>

          {selectedTenancy && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="font-medium text-slate-900">{selectedTenancy.property.address}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteName">Tenant's Name</Label>
                <Input
                  id="inviteName"
                  placeholder="John Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="tenant@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                <p>The tenant will receive an email with a link to create their account and access this tenancy.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={sendInvitation} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
