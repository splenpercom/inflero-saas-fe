import { createContext, useContext } from "react";

export type WebsiteBookingContextValue = {
  /** Tenant public slug for /res/{slug} booking APIs */
  tenantSlug: string | null;
  /** True when RESERVATIONS (Bookings) module is enabled for this tenant */
  bookingsEnabled: boolean;
};

const WebsiteBookingContext = createContext<WebsiteBookingContextValue>({
  tenantSlug: null,
  bookingsEnabled: false,
});

export function WebsiteBookingProvider({
  value,
  children,
}: {
  value: WebsiteBookingContextValue;
  children: React.ReactNode;
}) {
  return <WebsiteBookingContext.Provider value={value}>{children}</WebsiteBookingContext.Provider>;
}

export function useWebsiteBooking() {
  return useContext(WebsiteBookingContext);
}
