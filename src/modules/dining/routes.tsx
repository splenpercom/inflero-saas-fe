/**
 * Drop these routes into the host React Router tree.
 *
 * Dashboard (auth + layout):
 *   import { diningDashboardRouteElements } from "../modules/dining";
 *   <Route path="/dashboard/*">…{diningDashboardRouteElements}</Route>
 *
 * Public (no auth):
 *   import { diningPublicRouteElements } from "../modules/dining";
 *   {diningPublicRouteElements}
 *   Register BEFORE any `/:companySlug` catch-all.
 */
import type { ReactNode } from "react";
import { Route } from "react-router";
import { ModuleRouteGuard, ModuleUnavailablePanel } from "../../app/components/modules/ModuleRouteGuard";
import { useAuth } from "../../app/context/AuthContext";
import { DiningProvider } from "./DiningProvider";
import {
  MenuPage,
  TablesPage,
  KotPage,
  BookingsPage,
  QRMenuPage,
  BookTablePublicPage,
} from "./pages";

function DiningStaffGuard({ children }: { children: ReactNode }) {
  return (
    <ModuleRouteGuard module="DINING">
      <DiningProvider>{children}</DiningProvider>
    </ModuleRouteGuard>
  );
}

/**
 * Customer QR / book pages are public. If a logged-in tenant has Dining off,
 * hide them the same way as other disabled modules. Anonymous visitors still
 * see the prototype pages (no tenant in the URL yet).
 */
function DiningPublicGuard({ children }: { children: ReactNode }) {
  const { isDemo, isAuthenticated, modulesLoaded, hasModule } = useAuth();
  if (isDemo) return <>{children}</>;
  if (!isAuthenticated) return <>{children}</>;
  if (!modulesLoaded) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }
  if (!hasModule("DINING")) return <ModuleUnavailablePanel />;
  return <>{children}</>;
}

/** Staff routes — nest under `/dashboard/*`. */
export const diningDashboardRouteElements = (
  <>
    <Route path="restaurant/menu" element={<DiningStaffGuard><MenuPage /></DiningStaffGuard>} />
    <Route path="restaurant/tables" element={<DiningStaffGuard><TablesPage /></DiningStaffGuard>} />
    <Route path="restaurant/kot" element={<DiningStaffGuard><KotPage /></DiningStaffGuard>} />
    <Route path="restaurant/bookings" element={<DiningStaffGuard><BookingsPage /></DiningStaffGuard>} />
  </>
);

/** Customer routes — tenant slug required for multi-tenant public dining. */
export const diningPublicRouteElements = (
  <>
    <Route path="/menu/:tenantSlug/table/:tableId" element={<DiningPublicGuard><QRMenuPage /></DiningPublicGuard>} />
    <Route path="/menu/:tenantSlug" element={<DiningPublicGuard><QRMenuPage /></DiningPublicGuard>} />
    <Route path="/book/:tenantSlug/:tableId" element={<DiningPublicGuard><BookTablePublicPage /></DiningPublicGuard>} />
    <Route path="/book/:tenantSlug" element={<DiningPublicGuard><BookTablePublicPage /></DiningPublicGuard>} />
  </>
);

export const diningDashboardRouteConfig = [
  { path: "restaurant/menu", element: <DiningStaffGuard><MenuPage /></DiningStaffGuard> },
  { path: "restaurant/tables", element: <DiningStaffGuard><TablesPage /></DiningStaffGuard> },
  { path: "restaurant/kot", element: <DiningStaffGuard><KotPage /></DiningStaffGuard> },
  { path: "restaurant/bookings", element: <DiningStaffGuard><BookingsPage /></DiningStaffGuard> },
];

export const diningPublicRouteConfig = [
  { path: "/menu/:tenantSlug/table/:tableId", element: <DiningPublicGuard><QRMenuPage /></DiningPublicGuard> },
  { path: "/menu/:tenantSlug", element: <DiningPublicGuard><QRMenuPage /></DiningPublicGuard> },
  { path: "/book/:tenantSlug/:tableId", element: <DiningPublicGuard><BookTablePublicPage /></DiningPublicGuard> },
  { path: "/book/:tenantSlug", element: <DiningPublicGuard><BookTablePublicPage /></DiningPublicGuard> },
];
