"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { 
  ArrowLeft, Plus, Search, Home, MapPin, Bed, Bath, 
  Users, AlertTriangle, MoreVertical, Edit, Trash2, Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - will be replaced with Supabase
const mockProperties = [
  {
    id: "1",
    address_line_1: "42 Oak Lane",
    address_line_2: "Flat 2",
    city: "Lincoln",
    postcode: "LN1 3BT",
    property_type: "flat",
    bedrooms: 2,
    bathrooms: 1,
    status: "occupied",
    tenant_count: 1,
    compliance_status: "valid",
    rent_amount: 850,
    image: null,
  },
  {
    id: "2",
    address_line_1: "15 High Street",
    city: "Lincoln",
    postcode: "LN2 1HN",
    property_type: "house",
    bedrooms: 3,
    bathrooms: 2,
    status: "occupied",
    tenant_count: 2,
    compliance_status: "expiring",
    rent_amount: 1200,
    image: null,
  },
  {
    id: "3",
    address_line_1: "8 Mill Road",
    city: "Lincoln",
    postcode: "LN3 4JP",
    property_type: "house",
    bedrooms: 4,
    bathrooms: 2,
    status: "vacant",
    tenant_count: 0,
    compliance_status: "valid",
    rent_amount: 1450,
    image: null,
  },
];

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
  const [properties, setProperties] = useState(mockProperties);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredProperties = properties.filter(p => {
    const matchesSearch = 
      p.address_line_1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.postcode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !filterStatus || p.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: properties.length,
    occupied: properties.filter(p => p.status === "occupied").length,
    vacant: properties.filter(p => p.status === "vacant").length,
    expiring: properties.filter(p => p.compliance_status === "expiring").length,
  };

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
              <Home className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Properties</h1>
            </div>
          </div>
          <Link href="/properties/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Property
            </Button>
          </Link>
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
              <p className="text-sm text-slate-500">Total Properties</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.occupied}</p>
              <p className="text-sm text-slate-500">Occupied</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.vacant}</p>
              <p className="text-sm text-slate-500">Vacant</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.expiring}</p>
              <p className="text-sm text-slate-500">Compliance Due</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={filterStatus === null ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus(null)}
            >
              All
            </Button>
            <Button 
              variant={filterStatus === "occupied" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("occupied")}
            >
              Occupied
            </Button>
            <Button 
              variant={filterStatus === "vacant" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("vacant")}
            >
              Vacant
            </Button>
          </div>
        </motion.div>

        {/* Property List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4"
        >
          <AnimatePresence>
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </AnimatePresence>

          {filteredProperties.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Home className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No properties found</p>
              <Link href="/properties/new">
                <Button className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Add your first property
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function PropertyCard({ property }: { property: typeof mockProperties[0] }) {
  const statusConfig = {
    occupied: { label: "Occupied", color: "bg-green-100 text-green-700" },
    vacant: { label: "Vacant", color: "bg-orange-100 text-orange-700" },
  };

  const complianceConfig = {
    valid: { label: "Compliant", color: "bg-green-100 text-green-700" },
    expiring: { label: "Expiring Soon", color: "bg-amber-100 text-amber-700" },
    expired: { label: "Expired", color: "bg-red-100 text-red-700" },
  };

  const status = statusConfig[property.status as keyof typeof statusConfig];
  const compliance = complianceConfig[property.compliance_status as keyof typeof complianceConfig];

  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 dark:bg-slate-900/70 backdrop-blur overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Property Image */}
            <div className="w-full md:w-48 h-32 md:h-auto bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
              <Home className="w-12 h-12 text-slate-400" />
            </div>

            {/* Property Info */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                    {property.address_line_1}
                    {property.address_line_2 && `, ${property.address_line_2}`}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {property.city}, {property.postcode}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/properties/${property.id}`} className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/properties/${property.id}/edit`} className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  {property.bedrooms} bed
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  {property.bathrooms} bath
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {property.tenant_count} tenant{property.tenant_count !== 1 ? "s" : ""}
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  £{property.rent_amount}/mo
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                <Badge className={status.color}>{status.label}</Badge>
                <Badge className={compliance.color}>
                  {compliance.label === "Expiring Soon" && (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {compliance.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
