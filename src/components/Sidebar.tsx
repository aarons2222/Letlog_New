'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Home, Building2, Users, Wrench, Briefcase, Receipt,
  AlertTriangle, Star, Calendar, Settings, ChevronLeft,
  ChevronRight, FileText, CreditCard
} from 'lucide-react';

type Role = 'landlord' | 'tenant' | 'contractor';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['landlord', 'tenant', 'contractor'] },
  { href: '/properties', icon: Building2, label: 'Properties', roles: ['landlord'] },
  { href: '/tenancies', icon: Users, label: 'Tenancies', roles: ['landlord'] },
  { href: '/issues', icon: Wrench, label: 'Issues', roles: ['landlord', 'tenant'] },
  { href: '/tenders', icon: Briefcase, label: 'Tenders', roles: ['landlord', 'contractor'] },
  { href: '/quotes', icon: Receipt, label: 'My Quotes', roles: ['contractor'] },
  { href: '/compliance', icon: AlertTriangle, label: 'Compliance', roles: ['landlord'] },
  { href: '/reviews', icon: Star, label: 'Reviews', roles: ['landlord', 'tenant', 'contractor'] },
  { href: '/calendar', icon: Calendar, label: 'Calendar', roles: ['landlord', 'tenant', 'contractor'] },
];

const bottomNavItems: NavItem[] = [
  { href: '/settings', icon: Settings, label: 'Settings', roles: ['landlord', 'tenant', 'contractor'] },
  { href: '/pricing', icon: CreditCard, label: 'Upgrade', roles: ['landlord', 'tenant', 'contractor'] },
];

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Save preference to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const filteredItems = navItems.filter(item => item.roles.includes(role));
  const filteredBottomItems = bottomNavItems.filter(item => item.roles.includes(role));

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col min-h-[calc(100vh-73px)] bg-white border-r border-slate-200 relative"
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>

      {/* Role Badge */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                role === 'landlord' ? 'bg-blue-100 text-blue-700' :
                role === 'tenant' ? 'bg-green-100 text-green-700' :
                'bg-orange-100 text-orange-700'
              }`}
            >
              {role === 'landlord' && <Building2 className="w-3.5 h-3.5" />}
              {role === 'tenant' && <FileText className="w-3.5 h-3.5" />}
              {role === 'contractor' && <Wrench className="w-3.5 h-3.5" />}
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 pb-4 pt-2 border-t border-slate-200 mt-2 space-y-1">
        {filteredBottomItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </motion.aside>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavLink({ href, icon: Icon, label, isActive, isCollapsed }: NavLinkProps) {
  return (
    <Link href={href}>
      <motion.div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group ${
          isActive 
            ? 'bg-gradient-to-r from-[#E8998D]/10 to-[#F4A261]/10 text-slate-900' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
        whileHover={{ x: isCollapsed ? 0 : 2 }}
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#E8998D] to-[#F4A261] rounded-full"
          />
        )}
        
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#E8998D]' : ''}`} />
        
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export default Sidebar;
