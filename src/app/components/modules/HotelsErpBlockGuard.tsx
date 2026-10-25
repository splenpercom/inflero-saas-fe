import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";

/** Dashboard / Reports → Coming Soon when Hotels is enabled. */
export function HotelsShellPageGuard({
  children,
  comingSoon,
}: {
  children: ReactNode;
  comingSoon: ReactNode;
}) {
  const { isDemo, hasModule } = useAuth();
  const hotelsEnabled = !isDemo && hasModule("HOTELS");
  if (hotelsEnabled) return <>{comingSoon}</>;
  return <>{children}</>;
}
