// Role-based access control configuration for LetLog
// Three roles: landlord, tenant, contractor

export type Role = "landlord" | "tenant" | "contractor";

export interface RoutePermission {
  path: string;
  label: string;
  roles: Role[];
}

// Define which roles can access which routes
export const routePermissions: RoutePermission[] = [
  // Shared routes - all roles
  { path: "/dashboard", label: "Dashboard", roles: ["landlord", "tenant", "contractor"] },
  { path: "/settings", label: "Settings", roles: ["landlord", "tenant", "contractor"] },
  { path: "/reviews", label: "Reviews", roles: ["landlord", "tenant", "contractor"] },

  // Landlord-only routes
  { path: "/properties", label: "Properties", roles: ["landlord"] },
  { path: "/tenancies", label: "Tenancies", roles: ["landlord"] },
  { path: "/compliance", label: "Compliance", roles: ["landlord"] },
  { path: "/calendar", label: "Calendar", roles: ["landlord"] },

  // Landlord + Tenant routes
  { path: "/issues", label: "Issues", roles: ["landlord", "tenant"] },

  // Landlord + Contractor routes
  { path: "/tenders", label: "Tenders", roles: ["landlord", "contractor"] },

  // Landlord + Contractor routes
  { path: "/quotes", label: "Quotes", roles: ["landlord", "contractor"] },
];

/**
 * Check if a role can access a given route path.
 * Matches the beginning of the path so /properties/new is covered by /properties.
 */
export function canAccessRoute(role: Role, path: string): boolean {
  // Always allow access to non-protected routes (public pages, auth, etc.)
  const protectedPrefixes = routePermissions.map((r) => r.path);
  const matchedPermission = protectedPrefixes.find(
    (prefix) => path === prefix || path.startsWith(prefix + "/")
  );

  // If the route isn't in our permissions list, allow access (public page)
  if (!matchedPermission) return true;

  const permission = routePermissions.find((r) => r.path === matchedPermission);
  return permission ? permission.roles.includes(role) : true;
}

/**
 * Get the default redirect path for a role when access is denied.
 */
export function getDefaultRedirect(role: Role): string {
  return "/dashboard";
}

// Role display configuration
export const roleConfig = {
  landlord: {
    label: "Landlord",
    color: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-700",
    description: "Manage properties, tenancies, and maintenance",
  },
  tenant: {
    label: "Tenant",
    color: "bg-green-500",
    badgeColor: "bg-green-100 text-green-700",
    description: "View your tenancy, report issues, leave reviews",
  },
  contractor: {
    label: "Contractor",
    color: "bg-orange-500",
    badgeColor: "bg-orange-100 text-orange-700",
    description: "Browse jobs, submit quotes, manage active work",
  },
} as const;

// Helper type guards
export function isLandlord(role: Role): boolean {
  return role === "landlord";
}

export function isTenant(role: Role): boolean {
  return role === "tenant";
}

export function isContractor(role: Role): boolean {
  return role === "contractor";
}
