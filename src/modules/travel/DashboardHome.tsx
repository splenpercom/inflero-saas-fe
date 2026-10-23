import { Navigate } from "react-router";
import { useAuth } from "../../app/context/AuthContext";
import { NewDashboard } from "../../app/components/corporate/NewDashboard";

/** When TRAVEL is on, dashboard home is Travel Reports; otherwise unchanged ERP dashboard. */
export function DashboardHome() {
  const { hasModule, modulesLoaded, isDemo } = useAuth();
  if (!modulesLoaded && !isDemo) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }
  // Demo treats all modules as on — do not force travel home there.
  if (!isDemo && hasModule("TRAVEL")) {
    return <Navigate to="/dashboard/travel-reports" replace />;
  }
  return <NewDashboard />;
}
