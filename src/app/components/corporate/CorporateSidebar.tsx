import { useLanguage } from "../../i18n/LanguageContext";
import { useIsDarkMode } from "../../hooks/useIsDarkMode";
import { cn } from "../ui/utils";
import { SimpleDropdown, SimpleDropdownItem } from "../ui/simple-dropdown";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { preloadRoute } from "../../utils/routePreloader";
import { usePendingReservationCount } from "../../hooks/usePendingReservationCount";
import {
  LayoutDashboard,
  Building2,
  Settings,
  ChevronDown,
  X,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Warehouse,
  BarChart3,
  CalendarDays,
  Globe,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { getBrandLogoUrl } from "../../lib/branding";
import { getCompanyLogoUrl } from "../../lib/userDisplay";
import { BrandLogo } from "../ui/BrandLogo";
import { storePath } from "../../lib/bookingLinks";
import type { TenantRbacModule } from "../../lib/rbacModules";
import { getNavPermission, type PermissionAction } from "../../lib/permissions";
import { ALL_BRANCHES_NAV_ENTRIES } from "../../lib/allBranchesNav";

import { pickLang, mapLang } from "../../i18n/pickLang";
interface NavSubItem {
  labelKey: string;
  label: string;
  active?: boolean;
  path?: string;
  permissionModule?: TenantRbacModule;
  permissionAction?: PermissionAction;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  label: string;
  active?: boolean;
  badge?: number;
  comingSoon?: boolean;
  path?: string;
  permissionModule?: TenantRbacModule;
  subItems?: NavSubItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

export function CorporateSidebar({ collapsed, onClose }: SidebarProps) {
  const { t, language } = useLanguage();
  const isDarkMode = useIsDarkMode();
  const { user, isDemo, isAuthenticated, hasPermission, hasModule } = useAuth();
  const {
    branches,
    branchId,
    selectedBranch,
    isBranchLocked,
    isGlobalMode,
    hasBranches,
    setBranchId,
    isLoading: branchesLoading,
  } = useBranch();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { badgeCount: newResCount, acknowledge: acknowledgeReservations } = usePendingReservationCount();

  const companyLogo = getCompanyLogoUrl(user?.tenant, isDarkMode);
  const brandLogo = getBrandLogoUrl(user?.tenant, isDarkMode);
  const brandAlt = user?.tenant?.name ?? "Inflero";

  // Translation helper for sidebar
  const st = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      // Main Menu Items
      dashboard: { en: "Dashboard", az: "İdarə Paneli" },
      inventory: { en: "Inventory", az: "İnventar" },
      stock: { en: "Stock", az: "Anbar" },
      sales: { en: "Sales", az: "Satışlar" },
      purchases: { en: "Purchases", az: "Satınalmalar" },
      finances: { en: "Finances", az: "Maliyyə" },
      people: { en: "Users", az: "İstifadəçilər" },
      reports: { en: "Reports", az: "Hesabatlar" },
      userManagement: { en: "User Management", az: "İstifadəçi İdarəetməsi" },
      settings: { en: "Settings", az: "Parametrlər" },
      reservations: { en: "Reservations", az: "Rezervasiyalar" },
      serviceTypes: { en: "Service Types", az: "Xidmət Növləri" },
      myWebsite: { en: "My Website", az: "Mənim Saytım" },
      webOrders: { en: "Web Orders", az: "Veb Sifarişlər" },
      webReports: { en: "Web Report", az: "Veb Hesabat" },
      
      // Inventory Sub-items
      products: { en: "Products/Services", az: "Məhsullar/Xidmətlər" },
      createProduct: { en: "Create", az: "Yarat" },
      expiredProducts: { en: "Expired Products/Services", az: "Vaxtı Keçmiş Məhsullar/Xidmətlər" },
      lowStocks: { en: "Low Stocks", az: "Tükənən" },
      category: { en: "Category", az: "Kateqoriya" },
      subCategory: { en: "Sub Category", az: "Alt Kateqoriya" },
      brands: { en: "Brands", az: "Brendlər" },
      units: { en: "Units", az: "Vahidlər" },
      variantAttributes: { en: "Variant Attributes", az: "Variant Atributları" },
      warranties: { en: "Warranties", az: "Zəmanətlər" },
      
      // Stock Sub-items
      manageStock: { en: "Manage Stock", az: "Anbar İdarəsi" },
      stockAdjustment: { en: "Stock Adjustment", az: "Anbar Düzəlişi" },
      stockTransfer: { en: "Stock Transfer", az: "Anbar Transferi" },
      
      // Sales Sub-items
      posOrders: { en: "POS Orders", az: "POS Sifarişləri" },
      invoices: { en: "Invoices", az: "Qaimələr" },
      salesReturn: { en: "Sales Return", az: "Satış Qaytarması" },
      pos: { en: "POS", az: "POS" },
      
      // Purchases Sub-items
      purchase: { en: "Purchase", az: "Satınalma" },
      purchaseOrder: { en: "Purchase Order", az: "Əməliyyatlar" },
      purchaseReturn: { en: "Purchase Return", az: "Qaytarmalar" },
      
      // Finances Sub-items
      financeExpenses: { en: "Expenses", az: "Xərclər" },
      income: { en: "Income", az: "Gəlir" },
      bankAccounts: { en: "Bank Accounts", az: "Bank Hesabları" },
      trialBalance: { en: "Trial Balance", az: "Sınaq Balansı" },
      
      // Users Sub-items
      peopleCustomers: { en: "Customers", az: "Müştərilər" },
      suppliers: { en: "Suppliers", az: "Təchizatçılar" },
      warehouses: { en: "Branches", az: "Filiallar" },
      
      // Reports Sub-items
      salesReport: { en: "Sales Report", az: "Satış Hesabatı" },
      employeeSalesReport: { en: "Employee Sales Report", az: "İşçi Satış Hesabatı" },
      financeReport: { en: "Finance Report", az: "Maliyyə Hesabatı" },
      productReport: { en: "Product Report", az: "Məhsul Hesabatı" },
      annualReport: { en: "Annual Report", az: "İllik Hesabat" },

      // Other
      selectWarehouse: { en: "Active Branch", az: "AKTİV FİLİAL" },
      allBranches: { en: "All branches", az: "Bütün filiallar" },
      globalMode: { en: "Global", az: "Qlobal" },
      noBranchesYet: { en: "No branches yet", az: "Filial yoxdur" },
      myStore: { en: "My Store", az: "Mənim Mağazam" },
    };
    return mapLang(language, translations[key], key);
  };

  const toggleExpand = (labelKey: string) => {
    setExpandedItems((prev) =>
      prev.includes(labelKey)
        ? prev.filter((item) => item !== labelKey)
        : [...prev, labelKey]
    );
  };

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard/reservations")) {
      setExpandedItems((prev) =>
        prev.includes("reservations") ? prev : [...prev, "reservations"],
      );
    }
  }, [location.pathname]);

  // Mock warehouse data - only active/configured warehouses
  const branchLabel = branchesLoading
    ? "…"
    : isBranchLocked && selectedBranch
      ? selectedBranch.name
      : !hasBranches
        ? st("noBranchesYet")
        : isGlobalMode
          ? st("allBranches")
          : selectedBranch?.name ?? (branchId ? "…" : st("globalMode"));

  const branchManagementEnabled = hasModule("BRANCH_MANAGEMENT");
  const showBranchSwitcher = (isAuthenticated || isDemo) && branchManagementEnabled;
  const isOwnerAllBranches = !!user?.isTenantOwner && isGlobalMode;

  const allBranchesNavItems: NavItem[] = useMemo(() => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      dashboard: LayoutDashboard,
      userManagement: Users,
      warehouses: Building2,
      settings: Settings,
      myWebsite: Globe,
    };
    const items: NavItem[] = ALL_BRANCHES_NAV_ENTRIES.map((entry) => ({
      icon: icons[entry.labelKey] ?? LayoutDashboard,
      labelKey: entry.labelKey,
      label: st(entry.labelKey),
      path: entry.path,
      permissionModule: entry.permissionModule,
    }));

    items.push({
      icon: Globe,
      labelKey: "myWebsite",
      label: st("myWebsite"),
      permissionModule: "My Website",
      subItems: [
        { labelKey: "myWebsite", label: st("myWebsite"), path: "/dashboard/my-website" },
        { labelKey: "webOrders", label: st("webOrders"), path: "/dashboard/my-website/orders" },
        { labelKey: "webReports", label: st("webReports"), path: "/dashboard/my-website/reports" },
      ],
    });

    return items;
  }, [language]);

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      labelKey: "dashboard",
      label: st("dashboard"),
      path: "/dashboard",
      permissionModule: "Dashboard",
    },
    {
      icon: Package,
      labelKey: "inventory",
      label: st("inventory"),
      permissionModule: "Inventory",
      subItems: [
        { labelKey: "products", label: st("products"), path: "/dashboard/inventory/products" },
        {
          labelKey: "createProduct",
          label: st("createProduct"),
          path: "/dashboard/inventory/products/create",
          permissionAction: "create",
        },
        { labelKey: "expiredProducts", label: st("expiredProducts"), path: "/dashboard/inventory/products/expired" },
        { labelKey: "lowStocks", label: st("lowStocks"), path: "/dashboard/inventory/products/low-stocks" },
        { labelKey: "category", label: st("category"), path: "/dashboard/inventory/category" },
        { labelKey: "subCategory", label: st("subCategory"), path: "/dashboard/inventory/sub-category" },
        { labelKey: "brands", label: st("brands"), path: "/dashboard/inventory/brands" },
        { labelKey: "units", label: st("units"), path: "/dashboard/inventory/units" },
      ],
    },
    {
      icon: Warehouse,
      labelKey: "stock",
      label: st("stock"),
      permissionModule: "Stock",
      subItems: [
        { labelKey: "manageStock", label: st("manageStock"), path: "/dashboard/stock/manage" },
        { labelKey: "stockAdjustment", label: st("stockAdjustment"), path: "/dashboard/stock/adjustment" },
        { labelKey: "stockTransfer", label: st("stockTransfer"), path: "/dashboard/stock/transfer" },
      ],
    },
    {
      icon: TrendingUp,
      labelKey: "sales",
      label: st("sales"),
      permissionModule: "Sales",
      subItems: [
        { labelKey: "posOrders", label: st("posOrders"), path: "/dashboard/sales/pos-orders" },
        { labelKey: "invoices", label: st("invoices"), path: "/dashboard/sales/invoices" },
        { labelKey: "salesReturn", label: st("salesReturn"), path: "/dashboard/sales/return" },
        { labelKey: "pos", label: st("pos"), path: "/dashboard/sales/pos" },
      ],
    },
    {
      icon: ShoppingBag,
      labelKey: "purchases",
      label: st("purchases"),
      permissionModule: "Purchases",
      subItems: [
        { labelKey: "purchase", label: st("purchase"), path: "/dashboard/purchases" },
        { labelKey: "purchaseOrder", label: st("purchaseOrder"), path: "/dashboard/purchases/order" },
        { labelKey: "purchaseReturn", label: st("purchaseReturn"), path: "/dashboard/purchases/return" },
      ],
    },
    {
      icon: DollarSign,
      labelKey: "finances",
      label: st("finances"),
      permissionModule: "Finances",
      subItems: [
        { labelKey: "financeExpenses", label: st("financeExpenses"), path: "/dashboard/finances/expenses" },
        { labelKey: "income", label: st("income"), path: "/dashboard/finances/income" },
        { labelKey: "bankAccounts", label: st("bankAccounts"), path: "/dashboard/finances/bank-accounts" },
        { labelKey: "trialBalance", label: st("trialBalance"), path: "/dashboard/finances/trial-balance" },
      ],
    },
    {
      icon: Building2,
      labelKey: "people",
      label: st("people"),
      permissionModule: "People",
      subItems: [
        { labelKey: "peopleCustomers", label: st("peopleCustomers"), path: "/dashboard/people/customers" },
        { labelKey: "suppliers", label: st("suppliers"), path: "/dashboard/people/suppliers" },
        { labelKey: "warehouses", label: st("warehouses"), path: "/dashboard/people/warehouses" },
        {
          labelKey: "userManagement",
          label: st("userManagement"),
          path: "/dashboard/user-management",
          permissionModule: "User Management",
        },
      ],
    },
    {
      icon: BarChart3,
      labelKey: "reports",
      label: st("reports"),
      permissionModule: "Reports",
      subItems: [
        { labelKey: "salesReport", label: st("salesReport"), path: "/dashboard/reports/sales" },
        { labelKey: "employeeSalesReport", label: st("employeeSalesReport"), path: "/dashboard/reports/employee-sales" },
        { labelKey: "financeReport", label: st("financeReport"), path: "/dashboard/reports/finance" },
        { labelKey: "productReport", label: st("productReport"), path: "/dashboard/reports/product" },
        { labelKey: "annualReport", label: st("annualReport"), path: "/dashboard/reports/annual" },
      ],
    },
    {
      icon: CalendarDays,
      labelKey: "reservations",
      label: st("reservations"),
      permissionModule: "Reservations",
      subItems: [
        { labelKey: "reservationsList", label: st("reservations"), path: "/dashboard/reservations" },
        { labelKey: "serviceTypes", label: st("serviceTypes"), path: "/dashboard/reservations/service-types" },
      ],
    },
    {
      icon: Globe,
      labelKey: "myWebsite",
      label: st("myWebsite"),
      permissionModule: "My Website",
      subItems: [
        { labelKey: "myWebsite", label: st("myWebsite"), path: "/dashboard/my-website" },
        { labelKey: "webOrders", label: st("webOrders"), path: "/dashboard/my-website/orders" },
        { labelKey: "webReports", label: st("webReports"), path: "/dashboard/my-website/reports" },
      ],
    },
    {
      icon: Settings,
      labelKey: "settings",
      label: st("settings"),
      path: "/dashboard/settings",
      permissionModule: "Settings",
    },
  ];

  const visibleNavItems = useMemo(() => {
    const canAccess = (module: TenantRbacModule, action: PermissionAction = "view") =>
      hasPermission(module, action);

    const itemsToFilter = isOwnerAllBranches ? allBranchesNavItems : navItems;

    return itemsToFilter
      .map((item) => {
        if (item.labelKey === "stock" && !hasModule("STOCK")) return null;
        if (item.labelKey === "reservations" && !hasModule("RESERVATIONS")) return null;
        if (item.labelKey === "myWebsite" && !hasModule("WEB_EDITOR")) return null;
        if (item.labelKey === "warehouses" && !branchManagementEnabled) return null;
        const parentModule = item.permissionModule ?? "Dashboard";
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter((sub) => {
            if (["expiredProducts", "lowStocks"].includes(sub.labelKey) && !hasModule("STOCK")) return false;
            if (["pos", "posOrders"].includes(sub.labelKey) && !hasModule("POS")) return false;
            if (sub.labelKey === "stockTransfer" && !branchManagementEnabled) return false;
            if (sub.labelKey === "warehouses" && !branchManagementEnabled) return false;
            const perm = getNavPermission(sub.path, parentModule, {
              permissionModule: sub.permissionModule,
              permissionAction: sub.permissionAction,
            });
            return perm ? canAccess(perm.module, perm.action) : true;
          });
          if (filteredSubItems.length === 0) return null;
          return { ...item, subItems: filteredSubItems };
        }
        if (item.path) {
          const perm = getNavPermission(item.path, parentModule);
          if (perm && !canAccess(perm.module, perm.action)) return null;
        }
        return item;
      })
      .filter((item): item is NavItem => item !== null);
  }, [hasPermission, hasModule, language, newResCount, isOwnerAllBranches, allBranchesNavItems, navItems, branchManagementEnabled, hasBranches]);

  const tenantSlug = user?.tenant?.slug ?? null;
  const myStorePath = tenantSlug ? storePath(tenantSlug) : null;

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
            <Link to="/dashboard" className="flex items-center justify-center flex-1">
              <BrandLogo
                src={brandLogo}
                alt={brandAlt}
                size="sidebar"
              />
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
            {companyLogo ? (
              <img src={companyLogo} alt={brandAlt} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <BrandLogo src={brandLogo} alt={brandAlt} size="sidebarIcon" />
            )}
          </Link>
        )}
        {/* Mobile always shows full logo */}
        {collapsed && (
          <>
            <Link to="/dashboard" className="lg:hidden flex items-center justify-center flex-1">
              <BrandLogo
                src={brandLogo}
                alt={brandAlt}
                size="sidebar"
              />
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

      {/* Branch switcher - fixed below header */}
      {!collapsed && showBranchSwitcher && (
        <div className="border-b border-white/10 dark:border-white/5 p-2 flex-shrink-0">
          <SimpleDropdown
            align="start"
            estimatedHeight={Math.min(320, 56 + branches.length * 52)}
            trigger={
              <button
                type="button"
                disabled={isBranchLocked && !hasBranches}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass smooth-transition hover:bg-white/20 dark:hover:bg-white/5 text-left group shadow-sm disabled:opacity-70"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0026f6] to-[#001db8] flex items-center justify-center shadow-lg shadow-[#0026f6]/30">
                  <Warehouse className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">
                    {st("selectWarehouse")}
                  </p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {branchLabel}
                  </p>
                </div>
                {!isBranchLocked && hasBranches && (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 smooth-transition group-hover:text-[#0026f6]" />
                )}
              </button>
            }
          >
            {!isBranchLocked && hasBranches && branchManagementEnabled && (
              <SimpleDropdownItem
                onClick={() => setBranchId(null)}
                className={cn(
                  isGlobalMode
                    ? "bg-gradient-to-r from-[#0026f6]/10 to-[#001db8]/10 border border-[#0026f6]/30 dark:border-[#0026f6]/30"
                    : "",
                )}
              >
                <div>
                  <p className="font-semibold text-xs text-gray-900 dark:text-white">
                    {st("allBranches")}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {pickLang(language, "Bütün filiallar və qlobal qeydlər", "All branches and global records")}
                  </p>
                </div>
              </SimpleDropdownItem>
            )}
            {branches.map((branch) => (
              <SimpleDropdownItem
                key={branch.id}
                onClick={() => setBranchId(branch.id)}
                className={cn(
                  branchId === branch.id
                    ? "bg-gradient-to-r from-[#0026f6]/10 to-[#001db8]/10 border border-[#0026f6]/30 dark:border-[#0026f6]/30"
                    : "",
                )}
              >
                <div>
                  <p className="font-semibold text-xs text-gray-900 dark:text-white">
                    {branch.name}
                  </p>
                  {branch.address && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {branch.address}
                    </p>
                  )}
                </div>
              </SimpleDropdownItem>
            ))}
          </SimpleDropdown>
        </div>
      )}

      {/* Navigation - Scrollable Middle Section */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="py-2 px-2">
          {visibleNavItems.map((item) => {
            const label = item.label;
            const isActive = item.path === location.pathname;
            const hasActiveSubItem = item.subItems?.some(
              (subItem) => subItem.path === location.pathname
            );
            
            const isReservations = item.labelKey === "reservations";
            const showRedDot = isReservations && newResCount > 0;

            const ItemContent = (
              <>
                <div className="relative flex-shrink-0">
                  <item.icon className="w-4 h-4" />
                  {showRedDot && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-gray-900 shadow-sm" />
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{label}</span>
                    {showRedDot && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold shadow-sm animate-pulse">
                        {newResCount > 9 ? "9+" : newResCount}
                      </span>
                    )}
                    {item.comingSoon && (
                      <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[9px] font-semibold shadow-sm">
                        {pickLang(language, "Tezliklə", "Soon")}
                      </span>
                    )}
                    {item.badge && !showRedDot && (
                      <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white text-[10px] font-semibold shadow-lg shadow-[#0026f6]/30 animate-pulse">
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
                    onMouseEnter={() => preloadRoute(item.path!)}
                    onClick={() => {
                      if (isReservations && newResCount > 0) {
                        acknowledgeReservations();
                      }
                      onClose?.();
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs smooth-transition font-medium relative overflow-hidden group",
                      isActive
                        ? "bg-gradient-to-r from-[#0026f6]/15 to-[#001db8]/15 text-[#0026f6] dark:text-[#0026f6] shadow-sm shadow-[#0026f6]/10 border border-[#0026f6]/30 dark:border-[#0026f6]/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:shadow-sm",
                      collapsed && "lg:justify-center"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0026f6]/5 to-[#001db8]/5 animate-pulse" />
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
                        ? "bg-gradient-to-r from-[#0026f6]/15 to-[#001db8]/15 text-[#0026f6] dark:text-[#0026f6] shadow-sm shadow-[#0026f6]/10 border border-[#0026f6]/30 dark:border-[#0026f6]/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:shadow-sm",
                      collapsed && "lg:justify-center"
                    )}
                  >
                    {(hasActiveSubItem || item.active) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0026f6]/5 to-[#001db8]/5 animate-pulse" />
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
                        const subLabel = subItem.label;
                        const isSubActive = subItem.path === location.pathname;
                        return (
                          <Link
                            key={subItem.labelKey}
                            to={subItem.path || "#"}
                            onMouseEnter={() => subItem.path && preloadRoute(subItem.path)}
                            onClick={() => {
                              if (
                                isReservations &&
                                subItem.path === "/dashboard/reservations" &&
                                newResCount > 0
                              ) {
                                acknowledgeReservations();
                              }
                              onClose?.();
                            }}
                            className={cn(
                              "block w-full text-left px-3 py-1.5 rounded-lg text-xs smooth-transition font-medium",
                              isSubActive
                                ? "bg-gradient-to-r from-[#0026f6]/10 to-[#001db8]/10 text-[#0026f6] dark:text-[#0026f6] shadow-sm border-l-2 border-[#0026f6]"
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

      {myStorePath && !isDemo && (
        <div className="flex-shrink-0 border-t border-white/10 dark:border-white/5 p-2">
          <Link
            to={myStorePath}
            target="_blank"
            rel="noopener noreferrer"
            title={st("myStore")}
            onClick={onClose}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium smooth-transition",
              "bg-gradient-to-r from-[#0026f6]/10 to-[#001db8]/10 text-[#0026f6] dark:text-[#0026f6]",
              "border border-[#0026f6]/25 dark:border-[#0026f6]/30",
              "hover:from-[#0026f6]/15 hover:to-[#001db8]/15 hover:shadow-sm",
              collapsed && "lg:justify-center lg:px-2",
            )}
          >
            <Globe className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left leading-tight">{st("myStore")}</span>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}