import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { getStorageItem } from "./lib/storageMigration";
import { STORAGE_KEYS } from "./lib/storageKeys";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./i18n/ThemeContext";
import { CorporateSidebar } from "./components/corporate/CorporateSidebar";
import { CorporateHeader } from "./components/corporate/CorporateHeader";
import { CorporateDashboard } from "./components/corporate/CorporateDashboard";
import { NewDashboard } from "./components/corporate/NewDashboard";
import { CorporateOrders } from "./components/corporate/CorporateOrders";
import { Settings as CorporateSettings } from "./components/corporate/Settings";
import { Profile } from "./components/corporate/Profile";
import { Products } from "./components/corporate/Products";
import { ProductDetails } from "./components/corporate/ProductDetails";
import { CreateProduct } from "./components/corporate/CreateProduct";
import { EditProduct } from "./components/corporate/EditProduct";
import { LowStocks } from "./components/corporate/LowStocks";
import { ExpiredProducts } from "./components/corporate/ExpiredProducts";
import { Category } from "./components/corporate/Category";
import { SubCategory } from "./components/corporate/SubCategory";
import { Brands } from "./components/corporate/Brands";
import { Units } from "./components/corporate/Units";
import { VariantAttributes } from "./components/corporate/VariantAttributes";
import { ManageStock } from "./components/corporate/ManageStock";
import { StockAdjustment } from "./components/corporate/StockAdjustment";
import { StockTransfer } from "./components/corporate/StockTransfer";
import { POSOrders } from "./components/corporate/POSOrders";
import { Invoices } from "./components/corporate/Invoices";
import { InvoiceView } from "./components/corporate/InvoiceView";
import { SalesReturn } from "./components/corporate/SalesReturn";
import { CorporatePOS } from "./components/corporate/CorporatePOS";
import { Purchase } from "./components/corporate/Purchase";
import { PurchaseOrder } from "./components/corporate/PurchaseOrder";
import { PurchaseReturn } from "./components/corporate/PurchaseReturn";
import { FinanceExpenses } from "./components/corporate/FinanceExpenses";
import { Income } from "./components/corporate/Income";
import { BankAccounts } from "./components/corporate/BankAccounts";
import { TrialBalance } from "./components/corporate/TrialBalance";
import { PeopleCustomers } from "./components/corporate/people/PeopleCustomers";
import { CustomerProfile } from "./components/corporate/CustomerProfile";
import { Suppliers } from "./components/corporate/people/Suppliers";
import { Warehouses } from "./components/corporate/people/Warehouses";
import { Reports } from "./components/corporate/Reports";
import { UserManagement } from "./components/corporate/UserManagement";
import { UserDetail } from "./components/corporate/UserDetail";
import { SalesReport } from "./components/corporate/reports/SalesReport";
import { FinanceReport } from "./components/corporate/reports/FinanceReport";
import { ProductReport } from "./components/corporate/reports/ProductReport";
import { AnnualReport } from "./components/corporate/reports/AnnualReport";
import { EmployeeSalesReport } from "./components/corporate/reports/EmployeeSalesReport";
import { Login } from "./components/Login";
import { Reservations } from "./components/corporate/Reservations";
import { ServiceTypes } from "./components/corporate/ServiceTypes";
import { CustomerLandingPage } from "./components/customer/CustomerLandingPage";
import { PublicStorefront } from "./components/storefront/PublicStorefront";
import {
  MyWebsiteProvider,
  MyWebsitePage,
  WebOrdersPage,
  WebReportPage,
} from "../modules/my-website";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DemoBanner } from "./components/DemoBanner";
import { PaymentStatusGate, BillingResultPage } from "./components/billing/PaymentStatusGate";
import { AuthProvider } from "./context/AuthContext";
import { BranchProvider } from "./context/BranchContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { DashboardPermissionGuard } from "./components/permissions/DashboardPermissionGuard";
import { AllBranchesScopeGuard } from "./components/permissions/AllBranchesScopeGuard";
import { BranchScopeBanner } from "./components/BranchScopeBanner";
import { Toaster } from "sonner";
import { useTheme } from "./i18n/ThemeContext";
import { AppBrandingEffects } from "./components/AppBrandingEffects";
import { ModuleRouteGuard } from "./components/modules/ModuleRouteGuard";

// Suppress recharts internal duplicate key warnings (library issue, not our code)
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const msg = String(args[0] || '');
  if (msg.includes('Encountered two children with the same key') ||
      msg.includes('Keys should be unique')) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const msg = String(args[0] || '');
  if (msg.includes('Encountered two children with the same key') ||
      msg.includes('Keys should be unique') ||
      msg.includes('Google Maps JavaScript API error')) {
    return;
  }
  originalError.apply(console, args);
};

// Layout wrapper component for Corporate ERP
const LayoutWrapper = React.memo(function LayoutWrapper({
  children,
  sidebarCollapsed,
  mobileMenuOpen,
  closeMobileMenu,
  toggleSidebar,
  toggleMobileMenu,
  darkMode,
  toggleDarkMode,
}: {
  children: React.ReactNode;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  closeMobileMenu: () => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-100 dark:from-gray-950 dark:via-blue-950/10 dark:to-gray-900">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden smooth-transition"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Mobile Drawer / Desktop Static */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform transition-transform duration-300 lg:transform-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <CorporateSidebar
          collapsed={sidebarCollapsed}
          onClose={closeMobileMenu}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <DemoBanner />
        <PaymentStatusGate />
        <BranchScopeBanner />
        {/* Header */}
        <CorporateHeader
          onToggleSidebar={toggleSidebar}
          onToggleMobileMenu={toggleMobileMenu}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 scrollbar-hide">
          <AllBranchesScopeGuard>
            <DashboardPermissionGuard>{children}</DashboardPermissionGuard>
          </AllBranchesScopeGuard>
        </main>
      </div>
    </div>
  );
});

const SIDEBAR_COLLAPSED_KEY = STORAGE_KEYS.sidebarCollapsed;

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const toggleDarkMode = toggleTheme;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = getStorageItem(
      localStorage, SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Memoized callbacks to prevent unnecessary re-renders
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <AppBrandingEffects />
      <AuthProvider>
      <BranchProvider>
      <ConfirmProvider>
      <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/customer-landing/:slug" element={<CustomerLandingPage />} />
            <Route path="/customer-landing/:slug/:branchSlug" element={<CustomerLandingPage />} />

            {/* POS Route - Full screen without sidebar/header */}
            <Route
              path="/dashboard/sales/pos"
              element={
                <ProtectedRoute>
                  <AllBranchesScopeGuard>
                    <DashboardPermissionGuard>
                      <>
                        <DemoBanner />
                        <ModuleRouteGuard module="POS">
                          <CorporatePOS />
                        </ModuleRouteGuard>
                      </>
                    </DashboardPermissionGuard>
                  </AllBranchesScopeGuard>
                </ProtectedRoute>
              }
            />

            {/* All other routes with layout */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                <LayoutWrapper
                  sidebarCollapsed={sidebarCollapsed}
                  mobileMenuOpen={mobileMenuOpen}
                  closeMobileMenu={closeMobileMenu}
                  toggleSidebar={toggleSidebar}
                  toggleMobileMenu={toggleMobileMenu}
                  darkMode={darkMode}
                  toggleDarkMode={toggleDarkMode}
                >
                  <Routes>
              {/* Corporate ERP Routes */}
              <Route path="/" element={<NewDashboard />} />
              <Route path="/home" element={<NewDashboard />} />
              <Route path="new-dashboard" element={<NewDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="orders" element={<CorporateOrders />} />

              {/* Inventory Routes */}
              <Route path="inventory/products/create" element={<CreateProduct />} />
              <Route path="inventory/products/:id/edit" element={<EditProduct />} />
              <Route path="inventory/products/:id" element={<ProductDetails />} />
              <Route path="inventory/products" element={<Products />} />
              <Route path="inventory/products/low-stocks" element={<ModuleRouteGuard module="STOCK"><LowStocks /></ModuleRouteGuard>} />
              <Route path="inventory/products/expired" element={<ModuleRouteGuard module="STOCK"><ExpiredProducts /></ModuleRouteGuard>} />
              <Route path="inventory/category" element={<Category />} />
              <Route path="inventory/sub-category" element={<SubCategory />} />
              <Route path="inventory/brands" element={<Brands />} />
              <Route path="inventory/units" element={<Units />} />
              <Route path="inventory/variant-attributes" element={<VariantAttributes />} />

              {/* Stock Routes */}
              <Route path="stock/manage" element={<ModuleRouteGuard module="STOCK"><ManageStock /></ModuleRouteGuard>} />
              <Route path="stock/adjustment" element={<ModuleRouteGuard module="STOCK"><StockAdjustment /></ModuleRouteGuard>} />
              <Route
                path="stock/transfer"
                element={
                  <ModuleRouteGuard module="STOCK">
                    <ModuleRouteGuard module="BRANCH_MANAGEMENT">
                      <StockTransfer />
                    </ModuleRouteGuard>
                  </ModuleRouteGuard>
                }
              />

              {/* Sales Routes */}
              <Route path="sales/pos-orders" element={<ModuleRouteGuard module="POS"><POSOrders /></ModuleRouteGuard>} />
              <Route path="sales/invoices" element={<Invoices />} />
              <Route path="sales/invoice-view/:id" element={<InvoiceView />} />
              <Route path="sales/return" element={<SalesReturn />} />

              {/* Purchase Routes */}
              <Route path="purchases" element={<Purchase />} />
              <Route path="purchases/order" element={<PurchaseOrder />} />
              <Route path="purchases/return" element={<PurchaseReturn />} />

              {/* Finance Routes */}
              <Route path="finances/expenses" element={<FinanceExpenses />} />
              <Route path="finances/income" element={<Income />} />
              <Route path="finances/bank-accounts" element={<BankAccounts />} />
              <Route path="finances/trial-balance" element={<TrialBalance />} />

              {/* People Routes */}
              <Route path="people/customers" element={<PeopleCustomers />} />
              <Route path="people/customers/:id" element={<CustomerProfile />} />
              <Route path="people/suppliers" element={<Suppliers />} />
              <Route path="people/warehouses" element={<Warehouses />} />

              {/* Reports and User Management */}
              <Route path="reports" element={<Reports />} />
              <Route path="user-management/users/:id" element={<UserDetail />} />
              <Route path="user-management" element={<UserManagement />} />

              {/* Report Pages */}
              <Route path="reports/sales" element={<SalesReport />} />
              <Route path="reports/employee-sales" element={<EmployeeSalesReport />} />
              <Route path="reports/finance" element={<FinanceReport />} />
              <Route path="reports/product" element={<ProductReport />} />
              <Route path="reports/annual" element={<AnnualReport />} />

              {/* Settings */}
              <Route path="reservations" element={<ModuleRouteGuard module="RESERVATIONS"><Reservations /></ModuleRouteGuard>} />
              <Route path="reservations/service-types" element={<ModuleRouteGuard module="RESERVATIONS"><ServiceTypes /></ModuleRouteGuard>} />
              <Route
                path="my-website"
                element={
                  <ModuleRouteGuard module="WEB_EDITOR">
                    <MyWebsiteProvider>
                      <MyWebsitePage />
                    </MyWebsiteProvider>
                  </ModuleRouteGuard>
                }
              />
              <Route
                path="my-website/orders"
                element={
                  <ModuleRouteGuard module="WEB_EDITOR">
                    <MyWebsiteProvider>
                      <WebOrdersPage />
                    </MyWebsiteProvider>
                  </ModuleRouteGuard>
                }
              />
              <Route
                path="my-website/reports"
                element={
                  <ModuleRouteGuard module="WEB_EDITOR">
                    <MyWebsiteProvider>
                      <WebReportPage />
                    </MyWebsiteProvider>
                  </ModuleRouteGuard>
                }
              />
              <Route path="settings" element={<CorporateSettings />} />
              <Route path="billing/result" element={<BillingResultPage />} />

              {/* Catch all - redirect to dashboard home */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            {/* Public storefront — after known routes; reserved slugs redirect inside */}
            <Route path="/:companySlug" element={<PublicStorefront />} />
      </Routes>
      </ConfirmProvider>
      </BranchProvider>
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </LanguageProvider>
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  );
}