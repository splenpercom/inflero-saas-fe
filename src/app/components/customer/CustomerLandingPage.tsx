import { Navigate, useParams } from "react-router";
import { CarServiceCustomerSite } from "../CarServiceCustomerSite";

export function CustomerLandingPage() {
  const { slug, branchSlug } = useParams<{ slug: string; branchSlug?: string }>();
  const tenantSlug = slug?.trim();

  if (!tenantSlug) {
    return <Navigate to="/" replace />;
  }

  return (
    <CarServiceCustomerSite
      tenantSlug={tenantSlug}
      branchSlug={branchSlug?.trim() || null}
    />
  );
}
