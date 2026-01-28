"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type Role,
  canAccessRoute,
  isLandlord,
  isTenant,
  isContractor,
  roleConfig,
} from "@/lib/roles";

interface RoleContextValue {
  role: Role | null;
  isLoading: boolean;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  canAccess: (route: string) => boolean;
  isLandlord: () => boolean;
  isTenant: () => boolean;
  isContractor: () => boolean;
  roleLabel: string;
  roleBadgeColor: string;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setIsLoading(false);
          return;
        }

        setUserId(user.id);
        setEmail(user.email || null);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", user.id)
          .single();

        if (profile) {
          setRole((profile.role as Role) || "landlord");
          setFullName(profile.full_name || null);
          if (profile.email) setEmail(profile.email);
        }
      } catch (err) {
        console.error("Failed to fetch user role:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, []);

  const value: RoleContextValue = {
    role,
    isLoading,
    userId,
    fullName,
    email,
    canAccess: (route: string) => (role ? canAccessRoute(role, route) : false),
    isLandlord: () => (role ? isLandlord(role) : false),
    isTenant: () => (role ? isTenant(role) : false),
    isContractor: () => (role ? isContractor(role) : false),
    roleLabel: role ? roleConfig[role].label : "",
    roleBadgeColor: role ? roleConfig[role].badgeColor : "",
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (context === undefined) {
    // Return defaults when no provider (e.g., during pre-rendering)
    return {
      role: null,
      isLoading: true,
      userId: null,
      fullName: null,
      email: null,
      canAccess: () => false,
      isLandlord: () => false,
      isTenant: () => false,
      isContractor: () => false,
      roleLabel: "",
      roleBadgeColor: "",
    };
  }
  return context;
}
