import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import { Link } from "react-router";

import { pickLang } from "../i18n/pickLang";
export function BranchScopeBanner() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, user } = useAuth();
  const {
    hasBranches,
    isGlobalMode,
    isBranchLocked,
    selectedBranch,
    branchManagementEnabled,
  } = useBranch();

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  if (!(isAuthenticated || isDemo)) return null;
  // Single-store tenants: no branch-scope messaging.
  if (!branchManagementEnabled) return null;

  if (!hasBranches) {
    return (
      <div className="bg-teal-50 dark:bg-[#0a3d38]/80 border-b border-teal-200 dark:border-[#14b8a6]/25 px-3 py-2 text-center text-xs text-teal-900 dark:text-[#99f6e4]">
        <span className="font-semibold">{tr("Qlobal rejim", "Global mode")}</span>
        <span className="text-teal-800/80 dark:text-[#5eead4]/80">
          {" "}
          —{" "}
          {tr(
            "Hələ filial yaradılmayıb. Yaratdığınız bütün məlumatlar filiala bağlı olmadan qlobal saxlanılacaq.",
            "No branch has been created yet. All data you create will be stored globally, not under a branch.",
          )}{" "}
          <Link
            to="/dashboard/people/warehouses"
            className="underline font-medium hover:text-teal-700 dark:hover:text-[#ccfbf1]"
          >
            {tr("Filiallar", "Branches")}
          </Link>
        </span>
      </div>
    );
  }

  if (isGlobalMode && !isBranchLocked) {
    const isOwner = !!user?.isTenantOwner;
    return (
      <div className="bg-teal-50 dark:bg-[#0a3d38]/80 border-b border-teal-200 dark:border-[#14b8a6]/25 px-3 py-2 text-center text-xs text-teal-900 dark:text-[#99f6e4]">
        <span className="font-semibold">
          {isOwner ? tr("Superadmin", "Superadmin") : tr("Bütün filiallar", "All branches")}
        </span>
        <span className="text-teal-800/80 dark:text-[#5eead4]/80">
          {" "}
          —{" "}
          {isOwner
            ? tr(
                "Şirkət üzrə bütün filiallar və qlobal qeydlər göstərilir. Yalnız bir filial üçün yan paneldən filial seçin.",
                "Showing company-wide data across all branches plus global records. Select a branch in the sidebar to scope to one location.",
              )
            : tr(
                "Bütün filialların və qlobal qeydlərin məlumatları göstərilir. Yalnız bir filial üçün məlumat görmək üçün yan paneldən filial seçin.",
                "Showing data across all branches plus global records. Select a branch in the sidebar to scope the workspace to that location.",
              )}
        </span>
      </div>
    );
  }

  if (selectedBranch) {
    return (
      <div className="bg-[#14b8a6]/5 dark:bg-[#14b8a6]/20 border-b border-[#14b8a6]/15 dark:border-[#14b8a6]/30 px-3 py-1.5 text-center text-[11px] text-[#14b8a6] dark:text-[#5eead4]">
        <span className="font-semibold">{selectedBranch.name}</span>
        <span className="opacity-80">
          {" "}
          — {tr("Məlumatlar bu filial üzrə filtirlənir", "Data is filtered for this branch")}
        </span>
      </div>
    );
  }

  return null;
}
