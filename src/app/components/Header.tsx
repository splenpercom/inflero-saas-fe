import {
  ShoppingCart,
  Calendar,
  BellRing,
  Maximize,
  Moon,
  Sun,
  Monitor,
  User,
  LogOut,
  Settings,
  Globe,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { memo } from "react";
import { useNavigate } from "react-router";
import { SimpleDropdown, SimpleDropdownItem, SimpleDropdownLabel, SimpleDropdownSeparator } from "./ui/simple-dropdown";
import { LanguageSwitcherDropdown } from "./LanguageSwitcherDropdown";
import { useLanguage } from "../i18n/LanguageContext";
import { useOrders } from "../contexts/OrderContext";
import { pickLang } from "../i18n/pickLang";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sidebarCollapsed?: boolean;
}

export const Header = memo(function Header({
  onToggleSidebar,
  onToggleMobileMenu,
  darkMode,
  onToggleDarkMode,
  sidebarCollapsed,
}: HeaderProps) {
  const { language, t } = useLanguage();
  const { getTodayOrders } = useOrders();
  const navigate = useNavigate();
  const subscriptionDaysLeft = 12;
  const subscriptionStatus =
    subscriptionDaysLeft > 7
      ? "success"
      : subscriptionDaysLeft > 3
      ? "warning"
      : "danger";

  // Get live order count
  const todayOrdersCount = getTodayOrders().length;

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
      <div className="flex items-center gap-2">
        {/* Mobile Menu Button */}
        <button 
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition"
        >
          <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Desktop Sidebar Collapse Button - Before stats */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Quick Stats - Hidden on small mobile, visible on sm+ */}
        <div className="hidden sm:flex items-center gap-1.5">
          <StatBadge icon={ShoppingCart} label={t.ordersBadge} count={todayOrdersCount} />
          <StatBadge icon={Calendar} label={t.reservationsBadge} count={5} />
          <StatBadge icon={BellRing} label={t.requestsBadge} count={3} />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1.5">
        {/* POS Button */}
        <button 
          onClick={() => navigate("/pos")}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg smooth-transition shadow-lg shadow-blue-500/20 text-xs font-medium whitespace-nowrap"
        >
          <span className="hidden sm:inline">{t.goToPOS}</span>
          <span className="sm:hidden">{t.pos}</span>
        </button>

        <div className="h-5 w-px bg-white/20 dark:bg-white/10 mx-1" />

        {/* Language Switcher */}
        <div className="hidden md:block">
          <LanguageSwitcherDropdown variant="light" />
        </div>

        {/* Subscription Status - Compact on mobile */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg glass smooth-transition">
          <div
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${ 
              subscriptionStatus === "success"
                ? "bg-green-500 shadow-lg shadow-green-500/50"
                : subscriptionStatus === "warning"
                ? "bg-yellow-500 shadow-lg shadow-yellow-500/50"
                : "bg-blue-500 shadow-lg shadow-blue-500/50"
            }`}
          />
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            <span className="hidden sm:inline">{subscriptionDaysLeft} {t.daysLeft}</span>
            <span className="sm:hidden">{subscriptionDaysLeft}d</span>
          </span>
        </div>

        {/* Fullscreen - Hidden on mobile */}
        <button className="hidden md:block p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition">
          <Maximize className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition"
        >
          {darkMode ? (
            <Sun className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Computer Display - Hidden on mobile */}
        <div className="hidden md:block">
          <SimpleDropdown
            trigger={
              <button className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition">
                <Monitor className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              </button>
            }
          >
            <SimpleDropdownLabel>{t.displayOptions}</SimpleDropdownLabel>
            <SimpleDropdownSeparator />
            <SimpleDropdownItem>
              <Monitor className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">{t.customerDisplayScreen}</span>
            </SimpleDropdownItem>
            <SimpleDropdownItem>
              <Monitor className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">{t.customerOrderBoard}</span>
            </SimpleDropdownItem>
          </SimpleDropdown>
        </div>

        <div className="h-5 w-px bg-white/20 dark:bg-white/10 ml-1" />

        {/* Profile Dropdown */}
        <SimpleDropdown
          trigger={
            <button className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition ml-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">JD</span>
              </div>
            </button>
          }
        >
          <SimpleDropdownLabel>
            <div>
              <p className="font-medium text-xs">John Doe</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                john@restaurant.com
              </p>
            </div>
          </SimpleDropdownLabel>
          <SimpleDropdownSeparator />
          <SimpleDropdownItem>
            <User className="w-3.5 h-3.5 mr-2" />
            <span className="text-xs">{t.myProfile}</span>
          </SimpleDropdownItem>
          <SimpleDropdownItem onClick={() => navigate("/settings")}>
            <Settings className="w-3.5 h-3.5 mr-2" />
            <span className="text-xs">{t.accountSettings}</span>
          </SimpleDropdownItem>
          <SimpleDropdownSeparator />
          <SimpleDropdownItem onClick={() => navigate("/")}>
            <LogOut className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400">{t.logout}</span>
          </SimpleDropdownItem>
        </SimpleDropdown>
      </div>
    </header>
  );
});

interface StatBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}

function StatBadge({ icon: Icon, label, count }: StatBadgeProps) {
  return (
    <button className="group relative p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="relative">
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-blue-600 text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </div>
      {/* Tooltip on hover */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </button>
  );
}