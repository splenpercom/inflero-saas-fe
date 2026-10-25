import type { ReactNode } from "react";
import { Route } from "react-router";
import { ModuleRouteGuard } from "../../app/components/modules/ModuleRouteGuard";
import { RoomsPage } from "./pages/RoomsPage";
import { ReservationsPage } from "./pages/ReservationsPage";

function HotelsGuard({ children }: { children: ReactNode }) {
  return <ModuleRouteGuard module="HOTELS">{children}</ModuleRouteGuard>;
}

export const hotelDashboardRouteElements = (
  <>
    <Route
      path="hotel/rooms"
      element={
        <HotelsGuard>
          <RoomsPage />
        </HotelsGuard>
      }
    />
    <Route
      path="hotel/reservations"
      element={
        <HotelsGuard>
          <ReservationsPage />
        </HotelsGuard>
      }
    />
  </>
);
