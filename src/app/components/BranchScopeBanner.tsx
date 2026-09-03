import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import { Link } from "react-router";

import { pickLang } from "../i18n/pickLang";
export function BranchScopeBanner() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
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
      <div className="bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-800/50 px-3 py-2 text-center text-xs text-sky-900 dark:text-sky-200">
        <span className="font-semibold">{tr("Qlobal rejim", "Global mode")}</span>
        <span className="text-sky-800/80 dark:text-sky-300/80">
          {" "}
          —{" "}
          {tr(
            "Hələ filial yaradılmayıb. Yaratdığınız bütün məlumatlar filiala bağlı olmadan qlobal saxlanılacaq.",
            "No branch has been created yet. All data you create will be stored globally, not under a branch.",
          )}{" "}
          <Link
            to="/dashboard/people/warehouses"
            className="underline font-medium hover:text-sky-700 dark:hover:text-sky-100"
          >
            {tr("Filiallar", "Branches")}
          </Link>
        </span>
      </div>
    );
  }

  if (isGlobalMode && !isBranchLocked) {
    return (
      <div className="bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-800/50 px-3 py-2 text-center text-xs text-sky-900 dark:text-sky-200">
        <span className="font-semibold">{tr("Bütün filiallar", "All branches")}</span>
        <span className="text-sky-800/80 dark:text-sky-300/80">
          {" "}
          —{" "}
          {tr(
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
