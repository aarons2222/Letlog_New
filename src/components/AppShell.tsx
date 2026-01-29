"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRole } from "@/contexts/RoleContext";
import { roleConfig, routePermissions, type Role } from "@/lib/roles";
import {
  Home,
  Wrench,
  AlertTriangle,
  Briefcase,
  Star,
  Building2,
  User,
  Calendar,
  Settings,
  Users,
  Receipt,
  ChevronsRight,
  ChevronsLeft,
  Menu,
  X,
} from "lucide-react";

// Full nav items with associated route paths and icons
const allNavItems: { href: string; icon: React.ElementType; label: string }[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/properties", icon: Building2, label: "Properties" },
  { href: "/tenancies", icon: Users, label: "Tenancies" },
  { href: "/issues", icon: Wrench, label: "Maintenance" },
  { href: "/tenders", icon: Briefcase, label: "Jobs" },
  { href: "/compliance", icon: AlertTriangle, label: "Compliance" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/quotes", icon: Receipt, label: "Quotes" },
  { href: "/reviews", icon: Star, label: "Reviews" },
];

const settingsNav = { href: "/settings", icon: Settings, label: "Settings" };

/** Filter nav items based on the user's role using routePermissions. */
function getNavItemsForRole(role: Role | null) {
  if (!role) return allNavItems; // Show all while loading
  return allNavItems.filter((item) => {
    const permission = routePermissions.find((rp) => rp.path === item.href);
    // If no permission entry exists, show it (public route)
    if (!permission) return true;
    return permission.roles.includes(role);
  });
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link href={href} title={collapsed ? label : undefined}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          active
            ? "bg-slate-100 text-slate-900 font-semibold"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
      </div>
    </Link>
  );
}

export default function AppShell({
  children,
  activeNav,
}: {
  children: React.ReactNode;
  activeNav?: string;
}) {
  const { role, fullName, email } = useRole();
  const [expanded, setExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = useMemo(() => getNavItemsForRole(role), [role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#E8998D] to-[#F4A261] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">L</span>
                </div>
                <span className="font-bold text-xl">
                  <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">Let</span>
                  <span>Log</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            {/* User info */}
            <div className="p-4 border-b border-slate-200">
              <p className="font-medium text-slate-700">{fullName}</p>
              <p className="text-sm text-slate-500">{email}</p>
              {role && (
                <Badge className={roleConfig[role].badgeColor + " text-xs mt-2"}>
                  {roleConfig[role].label}
                </Badge>
              )}
            </div>
            
            {/* Nav items */}
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeNav === item.href.slice(1)
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-slate-200 mt-4">
                <Link 
                  href={settingsNav.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeNav === "settings"
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <settingsNav.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{settingsNav.label}</span>
                  </div>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="px-4 py-4 flex justify-between items-center">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E8998D] to-[#F4A261] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="font-bold text-xl">
              <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">
                Let
              </span>
              <span>Log</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700">{fullName}</p>
              <div className="flex items-center justify-end gap-2">
                <p className="text-xs text-slate-500">{email}</p>
                {role && (
                  <Badge className={roleConfig[role].badgeColor + " text-xs"}>
                    {roleConfig[role].label}
                  </Badge>
                )}
              </div>
            </div>
            <Link href="/settings">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                <User className="w-5 h-5 text-slate-600" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — collapsed to icons by default, expandable */}
        <aside
          className={`hidden md:flex flex-col min-h-[calc(100vh-73px)] bg-white border-r border-slate-200 flex-shrink-0 transition-all duration-150 ${
            expanded ? "w-56" : "w-16"
          }`}
        >
          <nav className="flex-1 space-y-1 p-2 mt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={activeNav === item.href.slice(1)}
                collapsed={!expanded}
              />
            ))}

            <div className="pt-4 border-t border-slate-200 mt-4">
              <NavLink
                href={settingsNav.href}
                icon={settingsNav.icon}
                label={settingsNav.label}
                active={activeNav === "settings"}
                collapsed={!expanded}
              />
            </div>
          </nav>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center p-3 m-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            {expanded ? (
              <ChevronsLeft className="w-4 h-4" />
            ) : (
              <ChevronsRight className="w-4 h-4" />
            )}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
