import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { isAllBranchesAllowedPath } from "../../lib/allBranchesNav";

export function AllBranchesScopeGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { language } = useLanguage();
  const { user, isLoading } = useAuth();
  const { isGlobalMode, ready } = useBranch();

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  // Keep the current URL — never hard-redirect to /dashboard on refresh or when
  // Superadmin (all-branches) is selected on a branch-scoped page.
  if (!isLoading && ready && user?.isTenantOwner && isGlobalMode && !isAllBranchesAllowedPath(location.pathname)) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
            {tr("Filial seçin", "Select a branch", "Выберите филиал")}
          </p>
          <p className="mt-2 text-xs text-gray-600 dark:text-muted-foreground">
            {tr(
              "Bu səhifə filial rejimində işləyir. Yan paneldən bir filial seçin — eyni səhifədə qalacaqsınız.",
              "This page needs a branch. Choose one in the sidebar — you will stay on this page.",
              "Эта страница работает в режиме филиала. Выберите филиал в боковой панели — вы останетесь на этой странице.",
            )}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
