"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Building2, Calendar, PoundSterling, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
}

export default function NewTenancyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const [formData, setFormData] = useState({
    property_id: "",
    start_date: "",
    end_date: "",
    rent_amount: "",
    rent_frequency: "monthly",
    deposit_amount: "",
    notes: "",
  });

  useEffect(() => {
    async function loadProperties() {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("properties")
          .select("id, address_line_1, address_line_2, city, postcode")
          .eq("landlord_id", user.id)
          .order("address_line_1");

        if (error) throw error;
        setProperties(data || []);
      } catch (err) {
        console.error("Failed to load properties:", err);
        toast.error("Failed to load properties");
      } finally {
        setLoadingProperties(false);
      }
    }
    loadProperties();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.property_id || !formData.start_date || !formData.rent_amount) {
        toast.error("Please fill in all required fields");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("tenancies").insert({
        property_id: formData.property_id,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        rent_amount: parseFloat(formData.rent_amount),
        rent_frequency: formData.rent_frequency,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
        notes: formData.notes || null,
        status: "active",
      });

      if (error) throw error;

      toast.success("Tenancy created successfully!");
      router.push("/tenancies");
    } catch (error: any) {
      console.error("Create tenancy error:", error);
      toast.error(error.message || "Failed to create tenancy");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (p: Property) => {
    const parts = [p.address_line_1];
    if (p.address_line_2) parts.push(p.address_line_2);
    parts.push(p.city, p.postcode);
    return parts.join(", ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/tenancies">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tenancies
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-green-500" />
              <h1 className="text-xl font-bold text-slate-800">New Tenancy</h1>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Property</CardTitle>
                    <CardDescription>Select the property for this tenancy</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingProperties ? (
                  <div className="h-10 bg-slate-100 rounded animate-pulse" />
                ) : properties.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-slate-500 mb-3">No properties found. Add a property first.</p>
                    <Link href="/properties/new">
                      <Button variant="outline" size="sm">Add Property</Button>
                    </Link>
                  </div>
                ) : (
                  <Select value={formData.property_id} onValueChange={(v) => handleChange("property_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {formatAddress(property)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Dates */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Tenancy Period</CardTitle>
                    <CardDescription>Start and end dates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleChange("start_date", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleChange("end_date", e.target.value)}
                    />
                    <p className="text-xs text-slate-500">Leave blank for rolling tenancy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Financial */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <PoundSterling className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle>Financial Details</CardTitle>
                    <CardDescription>Rent and deposit information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rent_amount">Rent Amount (£) *</Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="rent_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="850"
                        value={formData.rent_amount}
                        onChange={(e) => handleChange("rent_amount", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rent_frequency">Frequency</Label>
                    <Select value={formData.rent_frequency} onValueChange={(v) => handleChange("rent_frequency", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="fortnightly">Fortnightly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Deposit Amount (£)</Label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="deposit_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="850"
                      value={formData.deposit_amount}
                      onChange={(e) => handleChange("deposit_amount", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Any additional details about this tenancy</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Special conditions, arrangements, etc..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4"
          >
            <Link href="/tenancies" className="flex-1">
              <Button variant="outline" className="w-full">Cancel</Button>
            </Link>
            <Button type="submit" className="flex-1 gap-2" disabled={isLoading}>
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Tenancy
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
