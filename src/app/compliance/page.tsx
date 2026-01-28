"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { 
  ArrowLeft, Shield, Search, AlertTriangle, CheckCircle, 
  Clock, Upload, FileText, Home, Calendar, Filter, Plus,
  Flame, Zap, Bug, FileCheck
} from "lucide-react";

// Compliance types with UK requirements
const complianceTypes = {
  gas_safety: { 
    label: "Gas Safety Certificate", 
    icon: Flame, 
    color: "orange",
    renewalPeriod: "12 months",
    required: "All properties with gas appliances"
  },
  eicr: { 
    label: "EICR (Electrical)", 
    icon: Zap, 
    color: "yellow",
    renewalPeriod: "5 years",
    required: "All rental properties"
  },
  epc: { 
    label: "EPC Certificate", 
    icon: FileCheck, 
    color: "green",
    renewalPeriod: "10 years",
    required: "Minimum rating E for rentals"
  },
  legionella: { 
    label: "Legionella Risk Assessment", 
    icon: Bug, 
    color: "blue",
    renewalPeriod: "2 years recommended",
    required: "All rental properties"
  },
  smoke_co: { 
    label: "Smoke & CO Alarms", 
    icon: Shield, 
    color: "red",
    renewalPeriod: "Annual check",
    required: "All rental properties"
  },
};

// Mock data
const mockCompliance = [
  {
    id: "1",
    property_id: "1",
    property_address: "42 Oak Lane, Flat 2",
    compliance_type: "gas_safety",
    issue_date: "2025-08-15",
    expiry_date: "2026-08-14",
    status: "valid",
    certificate_number: "GS-2025-12345",
    inspector_name: "British Gas",
    document_url: null,
  },
  {
    id: "2",
    property_id: "1",
    property_address: "42 Oak Lane, Flat 2",
    compliance_type: "eicr",
    issue_date: "2024-03-01",
    expiry_date: "2029-02-28",
    status: "valid",
    certificate_number: "EICR-2024-67890",
    inspector_name: "Sparks Electrical",
    document_url: null,
  },
  {
    id: "3",
    property_id: "2",
    property_address: "15 High Street",
    compliance_type: "gas_safety",
    issue_date: "2025-01-10",
    expiry_date: "2026-01-09",
    status: "expiring_soon",
    certificate_number: "GS-2025-54321",
    inspector_name: "Local Gas Services",
    document_url: null,
  },
  {
    id: "4",
    property_id: "2",
    property_address: "15 High Street",
    compliance_type: "epc",
    issue_date: "2020-06-15",
    expiry_date: "2030-06-14",
    status: "valid",
    certificate_number: "EPC-0012-3456-7890",
    inspector_name: "Energy Assessors Ltd",
    document_url: null,
  },
  {
    id: "5",
    property_id: "3",
    property_address: "8 Mill Road",
    compliance_type: "eicr",
    issue_date: "2021-11-20",
    expiry_date: "2026-11-19",
    status: "valid",
    certificate_number: "EICR-2021-11111",
    inspector_name: "Safe Electrics",
    document_url: null,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function CompliancePage() {
  const [records, setRecords] = useState(mockCompliance);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.property_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.certificate_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !filterType || r.compliance_type === filterType;
    const matchesStatus = !filterStatus || r.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: records.length,
    valid: records.filter(r => r.status === "valid").length,
    expiring: records.filter(r => r.status === "expiring_soon").length,
    expired: records.filter(r => r.status === "expired").length,
  };

  // Group by status for priority display
  const expiringSoon = filteredRecords.filter(r => r.status === "expiring_soon");
  const expired = filteredRecords.filter(r => r.status === "expired");
  const valid = filteredRecords.filter(r => r.status === "valid");

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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Compliance Tracker</h1>
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Certificate
          </Button>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Certificates</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.valid}</p>
              <p className="text-sm text-slate-500">Valid</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.expiring}</p>
              <p className="text-sm text-slate-500">Expiring Soon</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-sm text-slate-500">Expired</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts */}
        {(expiringSoon.length > 0 || expired.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            {expired.length > 0 && (
              <Card className="border-0 shadow-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500 mb-4">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700 dark:text-red-400">
                      {expired.length} Certificate{expired.length > 1 ? "s" : ""} Expired!
                    </h3>
                    <p className="text-sm text-red-600/80">
                      Immediate action required to remain compliant.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {expiringSoon.length > 0 && (
              <Card className="border-0 shadow-lg bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                      {expiringSoon.length} Certificate{expiringSoon.length > 1 ? "s" : ""} Expiring Soon
                    </h3>
                    <p className="text-sm text-amber-600/80">
                      Schedule renewals to avoid compliance issues.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by property or certificate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? null : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(complianceTypes).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? null : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Compliance Records */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredRecords.map((record) => (
              <ComplianceCard key={record.id} record={record} />
            ))}
          </AnimatePresence>

          {filteredRecords.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No compliance records found</p>
            </motion.div>
          )}
        </motion.div>

        {/* Compliance Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">UK Landlord Requirements</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(complianceTypes).map(([key, info]) => {
              const Icon = info.icon;
              const colorClasses: Record<string, string> = {
                orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
                yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
                green: "bg-green-100 dark:bg-green-900/30 text-green-600",
                blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
                red: "bg-red-100 dark:bg-red-900/30 text-red-600",
              };
              
              return (
                <Card key={key} className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${colorClasses[info.color]} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">{info.label}</h3>
                        <p className="text-xs text-slate-500 mt-1">Renewal: {info.renewalPeriod}</p>
                        <p className="text-xs text-slate-400 mt-1">{info.required}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function ComplianceCard({ record }: { record: typeof mockCompliance[0] }) {
  const typeInfo = complianceTypes[record.compliance_type as keyof typeof complianceTypes];
  const Icon = typeInfo?.icon || FileText;

  const statusConfig = {
    valid: { label: "Valid", color: "bg-green-100 text-green-700", icon: CheckCircle },
    expiring_soon: { label: "Expiring Soon", color: "bg-amber-100 text-amber-700", icon: Clock },
    expired: { label: "Expired", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  };

  const status = statusConfig[record.status as keyof typeof statusConfig];
  const StatusIcon = status?.icon || CheckCircle;

  // Calculate days until expiry
  const expiryDate = new Date(record.expiry_date);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const colorClasses: Record<string, string> = {
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600",
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ y: -2 }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Type Icon */}
            <div className={`w-12 h-12 rounded-xl ${colorClasses[typeInfo?.color || "blue"]} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">
                    {typeInfo?.label || record.compliance_type}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    {record.property_address}
                  </p>
                </div>
                <Badge className={status?.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status?.label}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Expires: {new Date(record.expiry_date).toLocaleDateString("en-GB")}
                </span>
                <span>
                  {daysUntilExpiry > 0 
                    ? `${daysUntilExpiry} days remaining`
                    : `${Math.abs(daysUntilExpiry)} days overdue`
                  }
                </span>
                <span className="text-slate-400">
                  #{record.certificate_number}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="gap-1">
                <FileText className="w-4 h-4" />
                View
              </Button>
              {(record.status === "expiring_soon" || record.status === "expired") && (
                <Button size="sm" className="gap-1">
                  <Upload className="w-4 h-4" />
                  Renew
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
