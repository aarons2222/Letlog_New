"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";
import type { Role } from "@/lib/roles";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Guards a page so only users with the specified roles can see it.
 * Redirects to /dashboard (or a custom path) if the user's role doesn't match.
 */
export function RoleGuard({ allowedRoles, children, fallbackPath = "/dashboard" }: RoleGuardProps) {
  const { role, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role)) {
      router.replace(fallbackPath);
    }
  }, [role, isLoading, allowedRoles, fallbackPath, router]);

  // Show nothing while loading or if role doesn't match (redirect is in progress)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
