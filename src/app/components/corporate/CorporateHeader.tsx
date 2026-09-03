import { pickLang } from "../../i18n/pickLang";
import {
  Maximize,
  Minimize,
  Moon,
  Sun,
  User,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  DollarSign,
  Plus,
  FileText,
  Users,
  UserPlus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { memo, useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { SimpleDropdown, SimpleDropdownItem, SimpleDropdownLabel, SimpleDropdownSeparator } from "../ui/simple-dropdown";
import { LanguageSwitcherDropdown } from "../LanguageSwitcherDropdown";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { getUserDisplayName, getUserInitials } from "../../lib/userDisplay";
import { usePendingReservationCount } from "../../hooks/usePendingReservationCount";
import { useHeaderStats } from "../../hooks/useHeaderStats";
import { useSubscriptionBadge } from "../../hooks/useSubscriptionRemaining";
import type { TenantRbacModule } from "../../lib/rbacModules";
import type { PermissionAction } from "../../lib/permissions";

interface CorporateHeaderProps {
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sidebarCollapsed?: boolean;
}

interface StatBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  variant?: "default" | "primary" | "success" | "warning";
}

const StatBadge = memo(function StatBadge({ icon: Icon, label, count, variant = "default" }: StatBadgeProps) {
  const variantClasses = {
    default: "glass",
    primary: "bg-[#ccfbf1]0/10 dark:bg-[#ccfbf1]0/20 border border-[#14b8a6]/30 dark:border-[#14b8a6]/30",
    success: "bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-500/30",
    warning: "bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-200/30 dark:border-yellow-500/30",
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg smooth-transition ${variantClasses[variant]}`}>
      <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
      <span className="hidden lg:inline text-[10px] text-gray-600 dark:text-gray-400 font-medium">{label}:</span>
      <span className="text-xs font-semibold text-gray-900 dark:text-white">{count}</span>
    </div>
  );
});

export const CorporateHeader = memo(function CorporateHeader({
  onToggleSidebar,
  onToggleMobileMenu,
  darkMode,
  onToggleDarkMode,
  sidebarCollapsed,
}: CorporateHeaderProps) {
  const { language, t } = useLanguage();
  const { user, isDemo, logout, exitDemo, hasPermission, hasModule } = useAuth();
  const navigate = useNavigate();
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  const displayName = getUserDisplayName(
    user,
    pt("Demo User", "Demo İstifadəçi"),
  );
  const displayEmail = user?.email ?? (isDemo ? "demo@sample.local" : "—");
  const initials = getUserInitials(displayName, user?.email);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const { pendingCount: reservationPendingCount } = usePendingReservationCount();
  const { productCount, todayOrdersCount } = useHeaderStats();
  const subscriptionBadge = useSubscriptionBadge(pt);

  const canViewInventory = hasPermission("Inventory", "view");

  const handleLogout = async () => {
    exitDemo();
    await logout();
    navigate("/");
  };

  const quickActions = useMemo(() => {
    const actions: {
      label: string;
      path: string;
      icon: typeof Package;
      module: TenantRbacModule;
      action: PermissionAction;
    }[] = [
      {
        label: pt("Create", "Yarat"),
        path: "/dashboard/inventory/products/create",
        icon: Package,
        module: "Inventory",
        action: "create",
      },
      {
        label: pt("Add Purchase", "Satınalma Əlavə Et"),
        path: "/dashboard/purchases",
        icon: ShoppingCart,
        module: "Purchases",
        action: "create",
      },
      {
        label: pt("Add Expense", "Xərc Əlavə Et"),
        path: "/dashboard/finances/expenses",
        icon: DollarSign,
        module: "Finances",
        action: "create",
      },
      {
        label: pt("Add Supplier", "Təchizatçı Əlavə Et"),
        path: "/dashboard/people/suppliers",
        icon: Users,
        module: "People",
        action: "create",
      },
      {
        label: pt("Add Customer", "Müştəri Əlavə Et"),
        path: "/dashboard/people/customers",
        icon: UserPlus,
        module: "People",
        action: "create",
      },
    ];
    return actions.filter((action) => hasPermission(action.module, action.action));
  }, [hasPermission, language]);

  const canViewPos = hasModule("POS") && hasPermission("Sales", "view");
  const canViewReservations = hasModule("RESERVATIONS") && hasPermission("Reservations", "view");

  // Check fullscreen status
  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      // Check if fullscreen API is supported and allowed
      if (!document.fullscreenEnabled) {
        return; // Fullscreen not supported or not allowed
      }

      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      // Silently handle errors (e.g., permissions policy in iframe)
      // Don't log to console to avoid showing errors in production
    }
  };

  return (
    <header
      className="h-12 glass-strong border-b border-white/20 dark:border-white/10 flex items-center justify-between px-3 sticky top-0 z-50"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitBackfaceVisibility: 'hidden',
        WebkitTransform: 'translateZ(0)',
      } as React.CSSProperties}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition"
          aria-label={pt("Open menu", "Menyunu aç")}
        >
          <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition"
          aria-label={
            sidebarCollapsed
              ? pt("Expand sidebar", "Yan paneli genişlət")
              : pt("Collapse sidebar", "Yan paneli yığ")
          }
          title={
            sidebarCollapsed
              ? pt("Expand sidebar", "Yan paneli genişlət")
              : pt("Collapse sidebar", "Yan paneli yığ")
          }
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-1.5">
          {canViewInventory && (
            <StatBadge
              icon={Package}
              label={pt("Products", "Məhsullar")}
              count={productCount}
              variant="primary"
            />
          )}
          {canViewPos && (
            <StatBadge
              icon={ShoppingCart}
              label={pt("Orders", "Sifarişlər")}
              count={todayOrdersCount}
            />
          )}
          {canViewReservations && (
            <StatBadge
              icon={CalendarDays}
              label={pt("Reservations", "Rezervasiyalar")}
              count={reservationPendingCount}
              variant="success"
            />
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1.5 flex-1 justify-end">
        {quickActions.length > 0 && (
          <SimpleDropdown
            trigger={
              <button className="px-2 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition flex items-center justify-center bg-green-600/10 dark:bg-green-600/20 border border-green-600/20 dark:border-green-600/30">
                <Plus className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </button>
            }
          >
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <SimpleDropdownItem key={index} onClick={() => navigate(action.path)}>
                  <Icon className="w-3.5 h-3.5 mr-2" />
                  <span className="text-xs">{action.label}</span>
                </SimpleDropdownItem>
              );
            })}
          </SimpleDropdown>
        )}

        {/* POS Shortcut */}
        {canViewPos && (
          <Link
            to="/dashboard/sales/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition bg-[#14b8a6]/10 dark:bg-[#14b8a6]/20 border border-[#14b8a6]/20 dark:border-[#14b8a6]/30"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#14b8a6] dark:text-[#14b8a6]" />
            <span className="hidden sm:inline text-xs font-medium text-[#14b8a6] dark:text-[#14b8a6]">{pt("POS", "POS")}</span>
          </Link>
        )}

        {/* Language Switcher */}
        <div className="hidden md:block">
          <LanguageSwitcherDropdown variant="light" />
        </div>

        {/* Subscription Status */}
        {subscriptionBadge && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg glass smooth-transition"
            title={subscriptionBadge.info.expiringOn}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                subscriptionBadge.urgency === "success"
                  ? "bg-green-500 shadow-lg shadow-green-500/50"
                  : subscriptionBadge.urgency === "warning"
                    ? "bg-yellow-500 shadow-lg shadow-yellow-500/50"
                    : "bg-red-500 shadow-lg shadow-red-500/50"
              }`}
            />
            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              <span className="hidden sm:inline">{subscriptionBadge.labels.full}</span>
              <span className="sm:hidden">{subscriptionBadge.labels.short}</span>
            </span>
          </div>
        )}

        {/* Fullscreen */}
        <button 
          onClick={toggleFullscreen}
          className="hidden md:block p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition"
          aria-label={pt("Toggle fullscreen", "Tam ekran rejimi")}
        >
          {isFullscreen ? (
            <Minimize className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Maximize className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition"
          aria-label={pt("Toggle dark mode", "Qaranlıq rejim")}
        >
          {darkMode ? (
            <Sun className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        <div className="h-5 w-px bg-white/20 dark:bg-white/10 ml-1" />

        {/* Profile Dropdown */}
        <SimpleDropdown
          trigger={
            <button className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition ml-1">
              <div className="w-7 h-7 rounded-full bg-[#14b8a6] flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-white">{initials}</span>
                )}
              </div>
            </button>
          }
        >
          <SimpleDropdownLabel>
            <div className="flex flex-col">
              <span className="font-semibold text-xs">{displayName}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">{displayEmail}</span>
            </div>
          </SimpleDropdownLabel>
          <SimpleDropdownSeparator />
          <SimpleDropdownItem onClick={() => navigate("/dashboard/profile")}>
            <User className="w-3.5 h-3.5 mr-2" />
            <span className="text-xs">{pt("Profile", "Profil")}</span>
          </SimpleDropdownItem>
          <SimpleDropdownSeparator />
          <SimpleDropdownItem onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5 mr-2 text-red-600 dark:text-red-400" />
            <span className="text-xs text-red-600 dark:text-red-400">{pt("Logout", "Çıxış")}</span>
          </SimpleDropdownItem>
        </SimpleDropdown>
      </div>
    </header>
  );
});