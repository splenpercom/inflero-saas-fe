import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";
import { SimpleDropdown, SimpleDropdownItem } from "./ui/simple-dropdown";
import { memo, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Table2,
  BellRing,
  Calendar,
  ShoppingCart,
  Truck,
  DollarSign,
  Wallet,
  BarChart3,
  Settings,
  Store,
  ChevronDown,
  X,
  Globe,
  ExternalLink,
  CreditCard,
  Package,
  ChefHat,
} from "lucide-react";
import { useTheme } from "../i18n/ThemeContext";
import { getAppLogo } from "../lib/branding";
import { BrandLogo } from "./ui/BrandLogo";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  active?: boolean;
  badge?: number;
  path?: string;
  subItems?: { labelKey: string; active?: boolean; path?: string }[];
  isPremium?: boolean;
}

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

export function Sidebar({ collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const logo = getAppLogo(theme === "dark");
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["menu"]);
  const [selectedBranch, setSelectedBranch] = useState("Downtown Branch");
  // Track if sidebar is open on mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleExpand = (labelKey: string) => {
    setExpandedItems((prev) =>
      prev.includes(labelKey)
        ? prev.filter((item) => item !== labelKey) // Remove only this item if already open
        : [...prev, labelKey] // Add this item to the list of open items
    );
  };

  // Mock branch data - in real app, this would come from API
  const branches = [
    { id: 1, name: "Downtown Branch", address: "123 Main St" },
    { id: 2, name: "Airport Branch", address: "Airport Terminal 2" },
    { id: 3, name: "Mall Branch", address: "City Center Mall" },
    { id: 4, name: "Beach Branch", address: "Seaside Blvd" },
  ];

  const navItems: NavItem[] = [
    { icon: LayoutDashboard, labelKey: "dashboard", path: "/dashboard" },
    {
      icon: UtensilsCrossed,
      labelKey: "menu",
      subItems: [
        { labelKey: "menus", path: "/menus" },
        { labelKey: "menuItems", path: "/menus/1/items" },
        { labelKey: "itemCategories", path: "/menus/items/categories" },
        { labelKey: "modifierGroups", path: "/menus/items/modifiers" },
        { labelKey: "itemModifiers", path: "/menus/items/item-modifiers" },
      ],
    },
    {
      icon: Table2,
      labelKey: "tables",
      subItems: [
        { labelKey: "areas", path: "/areas" },
        { labelKey: "tables", path: "/tables" },
        { labelKey: "qrCodes", path: "/qrcodes" },
      ],
    },
    { icon: BellRing, labelKey: "waiterRequests", badge: 3, path: "/waiter-requests" },
    { icon: Calendar, labelKey: "reservations", badge: 5, path: "/reservations" },
    { icon: ShoppingCart, labelKey: "pos", path: "/pos" },
    { icon: ChefHat, labelKey: "kitchenKOT", path: "/kitchen-kot", badge: 8 },
    { icon: Truck, labelKey: "deliveryExecutive", path: "/delivery-executive" },
    {
      icon: DollarSign,
      labelKey: "expenses",
      subItems: [
        { labelKey: "expenses", path: "/expenses" },
        { labelKey: "expenseCategories", path: "/expense-categories" }
      ],
    },
    {
      icon: Wallet,
      labelKey: "payments",
      subItems: [
        { labelKey: "payments", path: "/payments" },
        { labelKey: "duePayments" }
      ],
    },
    {
      icon: BarChart3,
      labelKey: "reports",
      subItems: [
        { labelKey: "salesReport", path: "/sales-report" },
        { labelKey: "itemReport", path: "/item-report" },
        { labelKey: "categoryReport", path: "/category-report" },
        { labelKey: "deliveryAppReport", path: "/delivery-app-report" },
        { labelKey: "expenseReport", path: "/expense-report" },
        { labelKey: "canceledOrderReport", path: "/cancelled-order-report" },
        { labelKey: "removedQOTItemReport", path: "/removed-kot-report" },
        { labelKey: "taxReport", path: "/tax-report" },
        { labelKey: "refundReport", path: "/refund-report" },
      ],
    },
    { icon: CreditCard, labelKey: "cashRegister", isPremium: true },
    { icon: Package, labelKey: "inventory", isPremium: true },
    { icon: Settings, labelKey: "settings", path: "/settings" },
  ];

  return (
    <aside
      className={cn(
        "h-screen flex flex-col glass-strong border-r border-white/20 dark:border-white/10 transition-all duration-300 ease-in-out",
        "w-64",
        collapsed && "lg:w-16"
      )}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* Logo Section - Fixed Header */}
      <div className="h-12 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-3 flex-shrink-0">
        {!collapsed ? (
          <>
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo src={logo} alt="Inflero" size="sidebar" />
            </Link>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </>
        ) : (
          <Link to="/dashboard" className="hidden lg:flex items-center justify-center w-full">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
          </Link>
        )}
        {/* Mobile always shows full logo */}
        {collapsed && (
          <>
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <BrandLogo src={logo} alt="Inflero" size="sidebar" />
            </Link>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Branch Switcher - Fixed below header */}
      {!collapsed && (
        <div className="border-b border-white/10 dark:border-white/5 p-2 flex-shrink-0">
          <SimpleDropdown
            align="start"
            trigger={
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass smooth-transition hover:bg-white/20 dark:hover:bg-white/5 text-left group shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">
                    {t.selectBranch}
                  </p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {selectedBranch}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 smooth-transition group-hover:text-blue-500" />
              </button>
            }
          >
            {branches.map((branch) => (
              <SimpleDropdownItem
                key={branch.id}
                onClick={() => setSelectedBranch(branch.name)}
                className={cn(
                  selectedBranch === branch.name 
                    ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-200/30 dark:border-blue-500/30" 
                    : ""
                )}
              >
                <div>
                  <p className="font-semibold text-xs text-gray-900 dark:text-white">
                    {branch.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {branch.address}
                  </p>
                </div>
              </SimpleDropdownItem>
            ))}
          </SimpleDropdown>
        </div>
      )}

      {/* Navigation - Scrollable Middle Section */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="py-2 px-2">
          {navItems.map((item) => {
            const label = t[item.labelKey as keyof typeof t] as string || item.labelKey;
            const isActive = item.path === location.pathname;
            const hasActiveSubItem = item.subItems?.some(
              (subItem) => subItem.path === location.pathname
            );
            
            const ItemContent = (
              <>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{label}</span>
                    {item.isPremium && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-white uppercase tracking-wide">
                        Premium
                      </span>
                    )}
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-semibold shadow-lg shadow-blue-500/30 animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {item.subItems && (
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200",
                          expandedItems.includes(item.labelKey) &&
                            "rotate-180"
                        )}
                      />
                    )}
                  </>
                )}
              </>
            );
            
            return (
              <div
                key={item.labelKey}
                className="mb-0.5"
              >
                {item.path ? (
                  <Link
                    to={item.path}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs smooth-transition font-medium relative overflow-hidden group",
                      isActive
                        ? "bg-gradient-to-r from-blue-500/15 to-blue-600/15 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/10 border border-blue-200/30 dark:border-blue-500/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:shadow-sm",
                      collapsed && "lg:justify-center"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 animate-pulse" />
                    )}
                    <div className={cn(
                      "relative z-10 flex items-center gap-2.5 w-full",
                      isActive && "drop-shadow-sm"
                    )}>
                      {ItemContent}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => item.subItems && toggleExpand(item.labelKey)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs smooth-transition font-medium relative overflow-hidden group",
                      hasActiveSubItem || item.active
                        ? "bg-gradient-to-r from-blue-500/15 to-blue-600/15 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/10 border border-blue-200/30 dark:border-blue-500/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:shadow-sm",
                      collapsed && "lg:justify-center"
                    )}
                  >
                    {(hasActiveSubItem || item.active) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 animate-pulse" />
                    )}
                    <div className={cn(
                      "relative z-10 flex items-center gap-2.5 w-full",
                      (hasActiveSubItem || item.active) && "drop-shadow-sm"
                    )}>
                      {ItemContent}
                    </div>
                  </button>
                )}

                {/* Sub Items */}
                {item.subItems &&
                  expandedItems.includes(item.labelKey) &&
                  !collapsed && (
                    <div className="mt-1 ml-6 space-y-0.5 pl-3 border-l-2 border-white/10 dark:border-white/5">
                      {item.subItems.map((subItem) => {
                        const subLabel = t[
                          subItem.labelKey as keyof typeof t
                        ] as string;
                        const isSubActive = subItem.path === location.pathname;
                        return (
                          <Link
                            key={subItem.labelKey}
                            to={subItem.path || "#"}
                            className={cn(
                              "block w-full text-left px-3 py-1.5 rounded-lg text-xs smooth-transition font-medium",
                              isSubActive
                                ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 dark:text-blue-400 shadow-sm border-l-2 border-blue-500"
                                : "text-gray-600 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                            )}
                          >
                            {subLabel}
                          </Link>
                        );
                      })}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section - Customer Site Link */}
      <div className="border-t border-white/10 dark:border-white/5 p-2 space-y-2">
        {/* Customer Site Link */}
        <Link
          to="/customer-site"
          onClick={onClose}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs smooth-transition font-medium text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-blue-600/10 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm group",
            collapsed && "lg:justify-center"
          )}
        >
          <Globe className="w-4 h-4 flex-shrink-0 smooth-transition group-hover:scale-110" />
          {!collapsed && (
            <>
              <span className="flex-1">{t.customerSite}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0 smooth-transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </Link>
      </div>
    </aside>
  );
}