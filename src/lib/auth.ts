import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole = "landlord" | "tenant" | "contractor";

interface AuthResult {
  user: { id: string; email: string } | null;
  role: UserRole | null;
  error: string | null;
}

/**
 * Get the authenticated user and their role from the profiles table.
 * Use this in API routes to verify both authentication and authorization.
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, role: null, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        user: { id: user.id, email: user.email || "" },
        role: null,
        error: "Profile not found",
      };
    }

    return {
      user: { id: user.id, email: user.email || "" },
      role: profile.role as UserRole,
      error: null,
    };
  } catch (err) {
    console.error("Auth error:", err);
    return { user: null, role: null, error: "Authentication failed" };
  }
}

/**
 * Check if a user has one of the allowed roles.
 */
export function hasRole(
  userRole: UserRole | null,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Check if a user is a landlord of a specific property.
 */
export async function isLandlordOfProperty(
  userId: string,
  propertyId: string
): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("landlord_id", userId)
    .single();

  return !error && !!data;
}

/**
 * Check if a user is a tenant of a specific property.
 */
export async function isTenantOfProperty(
  userId: string,
  propertyId: string
): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("tenancy_tenants")
    .select(
      `
      id,
      tenancies!inner(property_id)
    `
    )
    .eq("tenant_id", userId)
    .eq("tenancies.property_id", propertyId)
    .limit(1);

  return !error && data && data.length > 0;
}
