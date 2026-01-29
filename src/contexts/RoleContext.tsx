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
    const supabase = createClient();

    async function fetchRole(userId: string, userEmail: string | undefined) {
      try {
        setUserId(userId);
        setEmail(userEmail || null);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", userId)
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

    function clearAuth() {
      setRole(null);
      setUserId(null);
      setFullName(null);
      setEmail(null);
      setIsLoading(false);
    }

    // Initial auth check - use getUser() which validates with server
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (user && !error) {
        fetchRole(user.id, user.email);
      } else {
        setIsLoading(false);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          fetchRole(session.user.id, session.user.email);
        } else if (event === 'SIGNED_OUT') {
          clearAuth();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Session refreshed, ensure we have the latest
          setUserId(session.user.id);
          setEmail(session.user.email || null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
