"use client";

import { usePathname } from "next/navigation";
import AppShell from "./AppShell";

// Routes that should NOT have the app shell (public pages, auth pages)
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/pricing", "/blog", "/privacy", "/terms", "/cookies", "/invite"];

export default function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if this is a public route
  const isPublic = publicRoutes.some(route => 
    pathname === route || pathname.startsWith("/auth/") || pathname.startsWith("/invite/")
  );

  if (isPublic) {
    return <>{children}</>;
  }

  // Extract active nav from pathname
  const segment = pathname.split("/")[1] || "dashboard";

  return (
    <AppShell activeNav={segment}>
      {children}
    </AppShell>
  );
}
