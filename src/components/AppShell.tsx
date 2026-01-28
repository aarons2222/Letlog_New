"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRole } from "@/contexts/RoleContext";
import { roleConfig } from "@/lib/roles";
import {
  Home, Wrench, AlertTriangle, Briefcase, Star,
  Building2, User, Calendar, Settings, Users, Receipt
} from "lucide-react";

function NavLink({ href, icon: Icon, label, active }: {
  href: string; icon: React.ElementType; label: string; active?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        active ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
}

export default function AppShell({ children, activeNav }: { children: React.ReactNode; activeNav?: string }) {
  const { role, fullName, email } = useRole();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E8998D] to-[#F4A261] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="font-bold text-xl">
              <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">Let</span>
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
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-73px)] bg-white border-r border-slate-200 flex-shrink-0">
          <nav className="flex-1 space-y-1 p-3 mt-2">
            <NavLink href="/dashboard" icon={Home} label="Dashboard" active={activeNav === "dashboard"} />

            {role === "landlord" && (
              <>
                <NavLink href="/properties" icon={Building2} label="Properties" active={activeNav === "properties"} />
                <NavLink href="/tenancies" icon={Users} label="Tenancies" active={activeNav === "tenancies"} />
                <NavLink href="/issues" icon={Wrench} label="Maintenance" active={activeNav === "issues"} />
                <NavLink href="/tenders" icon={Briefcase} label="Jobs" active={activeNav === "tenders"} />
                <NavLink href="/compliance" icon={AlertTriangle} label="Compliance" active={activeNav === "compliance"} />
                <NavLink href="/calendar" icon={Calendar} label="Calendar" active={activeNav === "calendar"} />
                <NavLink href="/reviews" icon={Star} label="Reviews" active={activeNav === "reviews"} />
              </>
            )}

            {role === "tenant" && (
              <>
                <NavLink href="/issues" icon={Wrench} label="Maintenance" active={activeNav === "issues"} />
                <NavLink href="/reviews" icon={Star} label="Reviews" active={activeNav === "reviews"} />
              </>
            )}

            {role === "contractor" && (
              <>
                <NavLink href="/tenders" icon={Briefcase} label="Browse Jobs" active={activeNav === "tenders"} />
                <NavLink href="/quotes" icon={Receipt} label="My Quotes" active={activeNav === "quotes"} />
                <NavLink href="/reviews" icon={Star} label="Reviews" active={activeNav === "reviews"} />
              </>
            )}

            <div className="pt-4 border-t border-slate-200 mt-4">
              <NavLink href="/settings" icon={Settings} label="Settings" active={activeNav === "settings"} />
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
