import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ModuleRouteGuard, ModuleUnavailablePanel } from "./ModuleRouteGuard";

/** WEB_EDITOR + when BRANCH_MANAGEMENT is on, only the tenant owner may open the website editor. */
export function WebsiteEditorRouteGuard({ children }: { children: ReactNode }) {
  const { modulesLoaded, hasModule, user, isDemo } = useAuth();

  if (!modulesLoaded) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }

  if (!hasModule("WEB_EDITOR")) return <ModuleUnavailablePanel />;

  if (hasModule("BRANCH_MANAGEMENT") && !isDemo && user && !user.isTenantOwner) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Lock className="mx-auto mb-3 h-9 w-9 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Editor restricted</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            The website editor is only available to the company owner. Branch users can still open Web Orders and Web Report.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/** Convenience: same as ModuleRouteGuard(WEB_EDITOR) for non-editor website pages. */
export function WebsiteModuleRouteGuard({ children }: { children: ReactNode }) {
  return <ModuleRouteGuard module="WEB_EDITOR">{children}</ModuleRouteGuard>;
}
