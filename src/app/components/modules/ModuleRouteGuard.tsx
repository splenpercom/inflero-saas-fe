import type { ReactNode } from "react";
import { Puzzle } from "lucide-react";
import type { TenantModuleKey } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

export function ModuleUnavailablePanel() {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Puzzle className="mx-auto mb-3 h-9 w-9 text-gray-400" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Module unavailable</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This feature is not enabled for your workspace.
        </p>
      </div>
    </div>
  );
}

export function ModuleRouteGuard({
  module,
  children,
}: {
  module: TenantModuleKey;
  children: ReactNode;
}) {
  const { modulesLoaded, hasModule } = useAuth();
  if (!modulesLoaded) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0026f6] border-t-transparent" />
      </div>
    );
  }
  if (!hasModule(module)) return <ModuleUnavailablePanel />;
  return <>{children}</>;
}
