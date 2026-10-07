import { Route } from "react-router";
import { LoyaltyPage } from "./LoyaltyPage";

export const loyaltyDashboardRouteElements = (
  <>
    <Route path="loyalty" element={<LoyaltyPage />} />
  </>
);
