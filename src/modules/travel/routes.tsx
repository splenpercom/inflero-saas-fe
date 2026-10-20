/**
 * Drop these routes into the host React Router tree.
 *
 * Dashboard (auth + layout):
 *   import { travelDashboardRouteElements } from "../modules/travel";
 *   <Route path="/dashboard/*">…{travelDashboardRouteElements}</Route>
 *
 * Public (no auth):
 *   import { travelPublicRouteElements } from "../modules/travel";
 *   {travelPublicRouteElements}
 *   Register BEFORE any `/:companySlug` catch-all.
 */
import type { ReactNode } from "react";
import { Route } from "react-router";
import { ModuleRouteGuard, ModuleUnavailablePanel } from "../../app/components/modules/ModuleRouteGuard";
import { useAuth } from "../../app/context/AuthContext";
import {
  TravelReportsPage,
  OffersPage,
  OfferPublicPageWrapper,
  CommissionsPage,
  LogsPage,
  TravelInvoicesPage,
  TravelCalendarPage,
} from "./pages";

function TravelStaffGuard({ children }: { children: ReactNode }) {
  return <ModuleRouteGuard module="TRAVEL">{children}</ModuleRouteGuard>;
}

/**
 * Public offer pages. Logged-in tenants without TRAVEL see unavailable;
 * anonymous visitors still see the preview/client offer UI.
 */
function TravelPublicGuard({ children }: { children: ReactNode }) {
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
  if (!hasModule("TRAVEL")) return <ModuleUnavailablePanel />;
  return <>{children}</>;
}

/** Staff routes — nest under `/dashboard/*`. */
export const travelDashboardRouteElements = (
  <>
    <Route path="travel-reports" element={<TravelStaffGuard><TravelReportsPage /></TravelStaffGuard>} />
    <Route path="offers" element={<TravelStaffGuard><OffersPage /></TravelStaffGuard>} />
    <Route path="commissions" element={<TravelStaffGuard><CommissionsPage /></TravelStaffGuard>} />
    <Route path="logs" element={<TravelStaffGuard><LogsPage /></TravelStaffGuard>} />
    <Route path="invoices-travel" element={<TravelStaffGuard><TravelInvoicesPage /></TravelStaffGuard>} />
    <Route path="travel-calendar" element={<TravelStaffGuard><TravelCalendarPage /></TravelStaffGuard>} />
  </>
);

/** Client-facing offer routes. */
export const travelPublicRouteElements = (
  <>
    <Route path="/offer-view/:id" element={<TravelPublicGuard><OfferPublicPageWrapper /></TravelPublicGuard>} />
    <Route path="/offer-view" element={<TravelPublicGuard><OfferPublicPageWrapper /></TravelPublicGuard>} />
  </>
);
