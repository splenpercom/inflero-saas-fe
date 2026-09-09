import { useMemo, useState } from "react";
import { Navigate } from "react-router";
import { Info, Puzzle } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import type { TenantModuleKey } from "../../api/auth";
import {
  PLUGIN_CATEGORIES,
  TENANT_PLUGINS_CATALOG,
  type PluginCategory,
  type PluginCatalogEntry,
  type TenantPluginKey,
} from "../../lib/tenantPluginsCatalog";
import { cn } from "../ui/utils";

type FilterId = "All" | PluginCategory;

function ReadOnlyToggle({ on }: { on: boolean }) {
  return (
    <span
      role="presentation"
      aria-hidden
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors",
        on ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
          on ? "left-4" : "left-0.5",
        )}
      />
    </span>
  );
}

function StatusBadge({
  enabled,
  tr,
}: {
  enabled: boolean;
  tr: (az: string, en: string) => string;
}) {
  if (enabled) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/15">
        {tr("Aktiv", "Enabled")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-600/15">
      {tr("Deaktiv", "Disabled")}
    </span>
  );
}

function PluginCard({
  plugin,
  enabled,
  branchNames,
  branchManagementOn,
  language,
  tr,
}: {
  plugin: PluginCatalogEntry;
  enabled: boolean;
  branchNames: string[];
  branchManagementOn: boolean;
  language: string;
  tr: (az: string, en: string) => string;
}) {
  const Icon = plugin.icon;
  const name = language === "az" ? plugin.nameAz : plugin.name;
  const description = language === "az" ? plugin.descriptionAz : plugin.description;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-4 shadow-sm flex flex-col gap-3 min-h-[148px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              plugin.iconTone,
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {name}
              </h3>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                {plugin.version}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{plugin.category}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StatusBadge enabled={enabled} tr={tr} />
          {enabled ? (
            <ReadOnlyToggle on />
          ) : (
            <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
              {tr("Aktivləşdirmək üçün Inflero", "Contact Inflero to enable")}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{description}</p>

      {enabled && branchManagementOn && plugin.storeScoped && (
        <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
            {tr("Filiallar", "Branches")}
          </p>
          {branchNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {branchNames.map((n) => (
                <span
                  key={n}
                  className="inline-flex px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-[10px] font-medium text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700"
                >
                  {n}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              {tr("Aktivdir, amma filial təyin olunmayıb", "Enabled, but no branch assigned")}
            </p>
          )}
        </div>
      )}

      {enabled && (!branchManagementOn || !plugin.storeScoped) && (
        <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {plugin.storeScoped
              ? tr("Bütün şirkət / tək mağaza", "Company-wide / single store")
              : tr("Bütün şirkət üçün aktiv", "Enabled for the whole company")}
          </p>
        </div>
      )}
    </div>
  );
}

export function Plugins() {
  const { language } = useLanguage();
  const { user, isDemo, isAuthenticated, isLoading } = useAuth();
  const { branches, branchManagementEnabled } = useBranch();
  const [category, setCategory] = useState<FilterId>("All");

  const tr = (az: string, en: string) => pickLang(language, az, en);

  const modules = user?.tenant.modules;
  const moduleStores = user?.tenant.moduleStores;

  const branchNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of branches) map.set(b.id, b.name);
    return map;
  }, [branches]);

  const rows = useMemo(() => {
    return TENANT_PLUGINS_CATALOG.map((plugin) => {
      const enabled = isDemo
        ? true
        : modules?.[plugin.key as TenantModuleKey] === true;
      let branchNames: string[] = [];
      if (enabled && plugin.storeScoped && branchManagementEnabled) {
        const ids =
          moduleStores?.[plugin.key as Exclude<TenantPluginKey, "BRANCH_MANAGEMENT">] ?? [];
        branchNames = ids
          .map((id) => branchNameById.get(id) ?? id.slice(0, 8))
          .filter(Boolean);
        if (isDemo && branchNames.length === 0) {
          branchNames = branches.map((b) => b.name).slice(0, 2);
        }
      }
      return { plugin, enabled, branchNames };
    });
  }, [modules, moduleStores, branchManagementEnabled, branchNameById, isDemo, branches]);

  const filtered = useMemo(() => {
    if (category === "All") return rows;
    return rows.filter((r) => r.plugin.category === category);
  }, [rows, category]);

  const activeCount = rows.filter((r) => r.enabled).length;
  const availableCount = rows.length;
  const disabledCount = availableCount - activeCount;

  const filters: FilterId[] = ["All", ...PLUGIN_CATEGORIES];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-gray-500">
        …
      </div>
    );
  }

  if (!isDemo && (!isAuthenticated || !user?.isTenantOwner)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/15 text-[#0f766e] dark:text-[#5eead4] flex items-center justify-center flex-shrink-0">
          <Puzzle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {tr("Plaginlər", "Plugins")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {tr(
              "Sisteminizi genişləndirin — hesabınız üçün aktiv və mövcud plaginlərə baxın.",
              "Extend your system — review enabled and available plugins for your account.",
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {tr("Aktiv", "Active")}
          </p>
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {tr("Mövcud", "Available")}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{availableCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {tr("Deaktiv", "Disabled")}
          </p>
          <p className="text-2xl font-semibold text-[#14b8a6] dark:text-[#2dd4bf] mt-1">{disabledCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((id) => {
          const label =
            id === "All"
              ? tr("Hamısı", "All")
              : id === "Core"
                ? tr("Əsas", "Core")
                : id === "Sales"
                  ? tr("Satış", "Sales")
                  : id === "Operations"
                    ? tr("Əməliyyatlar", "Operations")
                    : tr("Məhsuldarlıq", "Productivity");
          const active = category === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                active
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(({ plugin, enabled, branchNames }) => (
          <PluginCard
            key={plugin.key}
            plugin={plugin}
            enabled={enabled}
            branchNames={branchNames}
            branchManagementOn={branchManagementEnabled}
            language={language}
            tr={tr}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          {tr("Bu kateqoriyada plagin yoxdur.", "No plugins in this category.")}
        </p>
      )}

      <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <p>
          {tr(
            "Plaginlər Inflero Hub tərəfindən idarə olunur. Status yalnız baxış üçündür; aktivləşdirmə üçün dəstəyə müraciət edin. Filial təyinatları çoxfiliallı rejimdə göstərilir.",
            "Plugins are managed by Inflero Hub. Status here is read-only — contact support to enable or change them. Branch assignments appear when multi-branch mode is on.",
          )}
        </p>
      </div>
    </div>
  );
}
