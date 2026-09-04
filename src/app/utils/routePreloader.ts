// Route preloader utility for instant page navigation
const preloadedRoutes = new Set<string>();

// Map of route paths to their lazy component imports
const routeImports: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('../components/corporate/CorporateDashboard'),
  '/inventory/products': () => import('../components/corporate/Products'),
  '/inventory/products/create': () => import('../components/corporate/CreateProduct'),
  '/inventory/products/low-stocks': () => import('../components/corporate/LowStocks'),
  '/inventory/products/expired': () => import('../components/corporate/ExpiredProducts'),
  '/inventory/category': () => import('../components/corporate/Category'),
  '/inventory/sub-category': () => import('../components/corporate/SubCategory'),
  '/inventory/brands': () => import('../components/corporate/Brands'),
  '/inventory/units': () => import('../components/corporate/Units'),
  '/inventory/variant-attributes': () => import('../components/corporate/VariantAttributes'),
  '/stock/manage': () => import('../components/corporate/ManageStock'),
  '/stock/adjustment': () => import('../components/corporate/StockAdjustment'),
  '/stock/transfer': () => import('../components/corporate/StockTransfer'),
  '/sales/pos-orders': () => import('../components/corporate/POSOrders'),
  '/sales/invoices': () => import('../components/corporate/Invoices'),
  '/sales/return': () => import('../components/corporate/SalesReturn'),
  '/sales/pos': () => import('../components/corporate/CorporatePOS'),
  '/purchases': () => import('../components/corporate/Purchase'),
  '/purchases/order': () => import('../components/corporate/PurchaseOrder'),
  '/purchases/return': () => import('../components/corporate/PurchaseReturn'),
  '/finances/expenses': () => import('../components/corporate/FinanceExpenses'),
  '/finances/income': () => import('../components/corporate/Income'),
  '/finances/bank-accounts': () => import('../components/corporate/BankAccounts'),
  '/finances/trial-balance': () => import('../components/corporate/TrialBalance'),
  '/people/customers': () => import('../components/corporate/people/PeopleCustomers'),
  '/people/suppliers': () => import('../components/corporate/people/Suppliers'),
  '/people/warehouses': () => import('../components/corporate/people/Warehouses'),
  '/reports': () => import('../components/corporate/Reports'),
  '/reports/sales': () => import('../components/corporate/reports/SalesReport'),
  '/reports/employee-sales': () => import('../components/corporate/reports/EmployeeSalesReport'),
  '/reports/finance': () => import('../components/corporate/reports/FinanceReport'),
  '/reports/product': () => import('../components/corporate/reports/ProductReport'),
  '/reports/annual': () => import('../components/corporate/reports/AnnualReport'),
  '/user-management': () => import('../components/corporate/UserManagement'),
  '/settings': () => import('../components/corporate/Settings'),
  '/dashboard/restaurant/menu': () => import('../../modules/dining/pages/MenuPage'),
  '/dashboard/restaurant/tables': () => import('../../modules/dining/pages/TablesPage'),
  '/dashboard/restaurant/kot': () => import('../../modules/dining/pages/KotPage'),
  '/dashboard/restaurant/bookings': () => import('../../modules/dining/pages/BookingsPage'),
};

export function preloadRoute(path: string) {
  // Don't preload if already preloaded
  if (preloadedRoutes.has(path)) {
    return;
  }

  // Get the import function for this route
  const importFn = routeImports[path];
  if (importFn) {
    preloadedRoutes.add(path);
    importFn().catch(() => {
      // If preload fails, remove from set so it can be retried
      preloadedRoutes.delete(path);
    });
  }
}

// Preload multiple routes at once (for common navigation paths)
export function preloadRoutes(paths: string[]) {
  paths.forEach(preloadRoute);
}

// Preload all routes in a section (e.g., all inventory routes)
export function preloadSection(sectionPrefix: string) {
  Object.keys(routeImports)
    .filter(path => path.startsWith(sectionPrefix))
    .forEach(preloadRoute);
}