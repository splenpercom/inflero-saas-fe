import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  Receipt,
  ChevronDown,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "../ui/utils";
import { preloadRoute } from "../../utils/routePreloader";
import { useTheme } from "../../i18n/ThemeContext";
import { getAppLogo } from "../../lib/branding";
import { BrandLogo } from "../ui/BrandLogo";

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  active?: boolean;
}

export function SuperAdminSidebar({ collapsed, onClose }: SidebarProps) {
  const location = useLocation();
  const { theme } = useTheme();
  const logo = getAppLogo(theme === "dark");

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/superadmin/dashboard",
      active: location.pathname === "/superadmin/dashboard",
    },
    {
      icon: Building2,
      label: "Companies",
      path: "/superadmin/companies",
      active: location.pathname === "/superadmin/companies",
    },
    {
      icon: Receipt,
      label: "Subscriptions",
      path: "/superadmin/subscriptions",
      active: location.pathname === "/superadmin/subscriptions",
    },
    {
      icon: Package,
      label: "Packages",
      path: "/superadmin/packages",
      active: location.pathname === "/superadmin/packages",
    },
    {
      icon: CreditCard,
      label: "Purchase Transaction",
      path: "/superadmin/purchase-transaction",
      active: location.pathname === "/superadmin/purchase-transaction",
    },
    {
      icon: ArrowRightLeft,
      label: "Money Transfer",
      path: "/superadmin/money-transfer",
      active: location.pathname === "/superadmin/money-transfer",
    },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col",
        collapsed ? "w-0 md:w-16" : "w-56"
      )}
    >
      {/* Close button for mobile */}
      {!collapsed && (
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Logo Section */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex-shrink-0">
        <Link
          to="/superadmin/dashboard"
          className="flex items-center justify-center group"
        >
          <BrandLogo
            src={logo}
            alt="Inflero"
            size={collapsed ? "sidebarIcon" : "sidebar"}
          />
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onMouseEnter={() => preloadRoute(item.path)}
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-xs font-medium group relative overflow-hidden",
              collapsed ? "justify-center" : "",
              item.active
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.active && (
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10" />
            )}
            <item.icon
              className={cn(
                "w-4 h-4 flex-shrink-0 relative z-10 transition-transform group-hover:scale-110",
                item.active ? "text-white" : "text-gray-500 dark:text-gray-400"
              )}
            />
            {!collapsed && (
              <span className="relative z-10 truncate">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Back to Corporate */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-2 flex-shrink-0">
        <Link
          to="/corporate/dashboard"
          onClick={onClose}
          className={cn(
            "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group",
            collapsed ? "justify-center" : ""
          )}
          title={collapsed ? "Back to Corporate" : undefined}
        >
          <Building2 className="w-4 h-4" />
          {!collapsed && <span>Back to Corporate</span>}
        </Link>
      </div>
    </aside>
  );
}