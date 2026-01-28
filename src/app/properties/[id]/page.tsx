"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Home, MapPin, Bed, Bath, Building2, Edit,
  Users, FileCheck, AlertTriangle, Calendar, ClipboardList
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Property {
  id: string;
  landlord_id: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string | null;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  description: string | null;
  photos: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Tenancy {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  rent_frequency: string;
  tenancy_tenants: { id: string; tenant_id: string; profiles?: { full_name: string } }[];
}

interface ComplianceRecord {
  id: string;
  record_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  notes: string | null;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      try {
        // Fetch property
        const { data: prop, error: propError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

        if (propError) throw propError;
        setProperty(prop);

        // Fetch tenancies
        const { data: tenancyData } = await supabase
          .from("tenancies")
          .select("*, tenancy_tenants(id, tenant_id, profiles:tenant_id(full_name))")
          .eq("property_id", id)
          .order("start_date", { ascending: false });

        setTenancies(tenancyData || []);

        // Fetch compliance records
        const { data: complianceData } = await supabase
          .from("compliance_records")
          .select("*")
          .eq("property_id", id)
          .order("expiry_date", { ascending: true });

        setComplianceRecords(complianceData || []);

        // Fetch issues
        const { data: issueData } = await supabase
          .from("issues")
          .select("*")
          .eq("property_id", id)
          .order("created_at", { ascending: false });

        setIssues(issueData || []);
      } catch (err: any) {
        console.error("Error fetching property:", err);
        toast.error("Failed to load property details");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="h-10 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Property not found</p>
          <Link href="/properties">
            <Button>Back to Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  const fullAddress = [
    property.address_line_1,
    property.address_line_2,
    property.city,
    property.county,
    property.postcode,
  ].filter(Boolean).join(", ");

  const propertyTypeLabel = property.property_type
    ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)
    : "Property";

  const now = new Date();
  const openIssues = issues.filter(i => i.status !== "closed" && i.status !== "resolved");
  const activeTenancies = tenancies.filter(t => t.status === "active");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/properties">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Properties
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Home className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Property Details</h1>
            </div>
          </div>
          <Link href={`/properties/${id}/edit`}>
            <Button className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Property
            </Button>
          </Link>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Property Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center flex-shrink-0">
                  <Home className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{fullAddress}</h2>
                  <p className="text-slate-500 flex items-center gap-1 mt-1">
                    <Building2 className="w-4 h-4" />
                    {propertyTypeLabel}
                  </p>

                  <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Bed className="w-4 h-4" />
                      {property.bedrooms} bedroom{property.bedrooms !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath className="w-4 h-4" />
                      {property.bathrooms} bathroom{property.bathrooms !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {property.city}, {property.postcode}
                    </span>
                  </div>

                  {property.description && (
                    <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                      {property.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tenancies */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Tenancies</CardTitle>
                  <CardDescription>
                    {activeTenancies.length} active tenanc{activeTenancies.length === 1 ? "y" : "ies"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tenancies.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No tenancies found for this property.</p>
              ) : (
                <div className="space-y-3">
                  {tenancies.map((tenancy) => {
                    const statusColors: Record<string, string> = {
                      active: "bg-green-100 text-green-700",
                      pending: "bg-amber-100 text-amber-700",
                      ended: "bg-slate-100 text-slate-600",
                      expired: "bg-red-100 text-red-700",
                    };
                    return (
                      <div
                        key={tenancy.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[tenancy.status] || "bg-slate-100 text-slate-600"}>
                              {tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)}
                            </Badge>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              £{tenancy.rent_amount}/{tenancy.rent_frequency || "month"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(tenancy.start_date).toLocaleDateString("en-GB")}
                            {tenancy.end_date && ` — ${new Date(tenancy.end_date).toLocaleDateString("en-GB")}`}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          {tenancy.tenancy_tenants?.length || 0} tenant{(tenancy.tenancy_tenants?.length || 0) !== 1 ? "s" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Compliance Records */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Compliance Records</CardTitle>
                  <CardDescription>{complianceRecords.length} record{complianceRecords.length !== 1 ? "s" : ""}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {complianceRecords.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No compliance records found.</p>
              ) : (
                <div className="space-y-3">
                  {complianceRecords.map((record) => {
                    const expiry = new Date(record.expiry_date);
                    const isExpired = expiry < now;
                    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    const isExpiring = !isExpired && expiry <= thirtyDays;

                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {record.record_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Issued: {new Date(record.issue_date).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              isExpired
                                ? "bg-red-100 text-red-700"
                                : isExpiring
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }
                          >
                            {isExpired && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {isExpiring && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {isExpired ? "Expired" : isExpiring ? "Expiring Soon" : "Valid"}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Expires: {expiry.toLocaleDateString("en-GB")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Open Issues */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Issues</CardTitle>
                  <CardDescription>
                    {openIssues.length} open issue{openIssues.length !== 1 ? "s" : ""} · {issues.length} total
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No issues reported.</p>
              ) : (
                <div className="space-y-3">
                  {issues.map((issue) => {
                    const priorityColors: Record<string, string> = {
                      urgent: "bg-red-100 text-red-700",
                      high: "bg-orange-100 text-orange-700",
                      medium: "bg-amber-100 text-amber-700",
                      low: "bg-slate-100 text-slate-600",
                    };
                    const statusColors: Record<string, string> = {
                      open: "bg-blue-100 text-blue-700",
                      in_progress: "bg-purple-100 text-purple-700",
                      resolved: "bg-green-100 text-green-700",
                      closed: "bg-slate-100 text-slate-600",
                    };
                    return (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{issue.title}</p>
                          {issue.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{issue.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(issue.created_at).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={priorityColors[issue.priority] || "bg-slate-100 text-slate-600"}>
                            {issue.priority}
                          </Badge>
                          <Badge className={statusColors[issue.status] || "bg-slate-100 text-slate-600"}>
                            {issue.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
