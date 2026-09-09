import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { ArrowRight, Building2, Globe, MapPin, Store } from "lucide-react";
import { isReservedStoreSlug } from "../../lib/bookingLinks";
import { fetchPublicStorefront, type PublicStorefrontBranch } from "../../api/website";
import {
  MyWebsiteProvider,
  StorefrontView,
  loadWebsiteConfigBySlug,
} from "../../../modules/my-website";
import type { WebsiteConfig } from "../../../modules/my-website/features/builder/types";
import { isBranchSellingMode } from "../../../modules/my-website/features/builder/branchSelling";
import {
  catalogFromPublic,
  EMPTY_CATALOG,
  type StorefrontCatalog,
} from "../../../modules/my-website/features/builder/storefrontCatalog";

function ShimmerBlock({ className = "" }: { className?: string }) {
  return <div className={`shimmer bg-gray-200/80 dark:bg-gray-800/80 ${className}`} aria-hidden />;
}

function StorefrontShimmer() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="sticky top-0 z-10 h-12 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <ShimmerBlock className="h-7 w-28 rounded-lg" />
        <div className="hidden sm:flex items-center gap-3">
          <ShimmerBlock className="h-2.5 w-10 rounded-full" />
          <ShimmerBlock className="h-2.5 w-12 rounded-full" />
          <ShimmerBlock className="h-2.5 w-10 rounded-full" />
        </div>
        <ShimmerBlock className="h-5 w-5 rounded-full" />
      </div>

      <div className="p-3 space-y-3">
        <ShimmerBlock className="w-full h-52 sm:h-64 rounded-2xl" />

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <ShimmerBlock className="h-4 w-36 rounded-md" />
            <ShimmerBlock className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <ShimmerBlock className="w-full aspect-square rounded-xl" />
                <ShimmerBlock className="h-3 w-full rounded-md" />
                <ShimmerBlock className="h-3 w-16 rounded-md" />
                <ShimmerBlock className="h-4 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BranchGate({
  storeName,
  branches,
  config,
  companySlug,
  onSelect,
}: {
  storeName: string;
  branches: PublicStorefrontBranch[];
  config: WebsiteConfig;
  companySlug: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Live homepage preview behind the gate */}
      <div
        className="pointer-events-none absolute inset-0 select-none"
        aria-hidden
      >
        <div className="h-full min-h-screen scale-[1.02] origin-top">
          <MyWebsiteProvider>
            <StorefrontView
              config={config}
              catalog={EMPTY_CATALOG}
              companySlug={companySlug}
            />
          </MyWebsiteProvider>
        </div>
      </div>

      {/* Glass veil */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/55 backdrop-blur-[10px] sm:backdrop-blur-md" />

      {/* Branch picker */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="rounded-3xl border border-white/25 bg-white/15 p-6 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8 dark:bg-white/10">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14b8a6]/90 text-white shadow-lg shadow-[#14b8a6]/30 ring-4 ring-white/20">
                <Store className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl drop-shadow-sm">
                {storeName}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
                Pick a location to see products available at that branch
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {branches.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-white/20 bg-white/10 px-5 py-8 text-center text-sm text-white/75 backdrop-blur-md">
                  <Building2 className="mx-auto mb-2 h-6 w-6 opacity-70" />
                  No branches are available for online shopping yet.
                </div>
              ) : (
                branches.map((b, i) => (
                  <button
                    key={b.storeId}
                    type="button"
                    onClick={() => onSelect(b.code)}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="group relative flex flex-col rounded-2xl border border-white/30 bg-white/90 p-5 text-left shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#14b8a6]/50 hover:bg-white hover:shadow-xl hover:shadow-[#14b8a6]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-gray-950/85 dark:hover:bg-gray-950"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white shadow-md shadow-[#14b8a6]/25 transition-transform duration-200 group-hover:scale-105">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-[#14b8a6] group-hover:text-white dark:bg-gray-800">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <p className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                      {b.name}
                    </p>
                    {b.address ? (
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#14b8a6]" />
                        <span>{b.address}</span>
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-gray-400">Tap to shop this location</p>
                    )}
                    {b.code ? (
                      <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        {b.code}
                      </p>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicStorefront() {
  const { companySlug = "" } = useParams<{ companySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const branchParam = searchParams.get("branch");
  const slug = decodeURIComponent(companySlug).trim().toLowerCase();
  const reserved = !slug || isReservedStoreSlug(slug);
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [catalog, setCatalog] = useState<StorefrontCatalog>(EMPTY_CATALOG);
  const [storeName, setStoreName] = useState("");
  const [enabledBranches, setEnabledBranches] = useState<PublicStorefrontBranch[]>([]);
  const [branchSellingMode, setBranchSellingMode] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<PublicStorefrontBranch | null>(null);
  const [loading, setLoading] = useState(!reserved);
  const [notFound, setNotFound] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  useEffect(() => {
    if (reserved) return;

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setConfig(null);
    setCatalog(EMPTY_CATALOG);
    setSelectedBranch(null);
    setRemoteLoaded(false);

    void (async () => {
      try {
        const remote = await fetchPublicStorefront(slug, branchParam);
        if (cancelled) return;
        if (remote?.config) {
          setConfig(remote.config);
          setStoreName(remote.storeName || remote.config.storeName || slug);
          setBranchSellingMode(Boolean(remote.branchSellingMode));
          setEnabledBranches(remote.enabledBranches ?? []);
          setSelectedBranch(remote.selectedBranch ?? null);
          setCatalog(catalogFromPublic(remote.catalog ?? {}));
          setRemoteLoaded(true);
          return;
        }
        // No published remote config — local draft only when not branch-selling.
        const local = loadWebsiteConfigBySlug(slug);
        if (cancelled) return;
        if (local && !isBranchSellingMode(local)) {
          setConfig(local);
          setStoreName(local.storeName || slug);
          setBranchSellingMode(false);
          setEnabledBranches([]);
          return;
        }
        setNotFound(true);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "";
        if (branchParam && msg.toLowerCase().includes("branch")) {
          // Invalid branch → drop query and reload gate.
          setSearchParams({}, { replace: true });
          return;
        }
        // Fail closed for branch-selling drafts: never show ungated full catalog from localStorage.
        const local = loadWebsiteConfigBySlug(slug);
        if (local && !isBranchSellingMode(local)) {
          setConfig(local);
          setStoreName(local.storeName || slug);
          setBranchSellingMode(false);
        } else {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reserved, slug, branchParam, setSearchParams]);

  if (reserved) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <StorefrontShimmer />;
  }

  if (notFound || !config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#14b8a6]/10 flex items-center justify-center">
          <Globe className="w-6 h-6 text-[#14b8a6]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Store not published yet</h1>
          <p className="mt-1 text-sm text-gray-500 max-w-sm">
            No saved website was found for <span className="font-medium text-gray-700">/{slug}</span>.
            Open My Website in the dashboard and click Save to publish.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-[#14b8a6] hover:text-[#0f766e] underline-offset-2 hover:underline"
        >
          Go to Inflero
        </Link>
      </div>
    );
  }

  // Prefer server flag after API success; config alone only for non-remote edge cases.
  const needsBranchGate =
    (remoteLoaded ? branchSellingMode : branchSellingMode || isBranchSellingMode(config)) &&
    !branchParam?.trim();

  const openBranchGate = (branches: PublicStorefrontBranch[]) => (
    <BranchGate
      storeName={storeName || config.storeName || slug}
      branches={branches}
      config={config}
      companySlug={slug}
      onSelect={(code) => {
        setSearchParams({ branch: code });
      }}
    />
  );

  if (needsBranchGate) {
    return openBranchGate(enabledBranches);
  }

  // Stale ?branch= while still in branch-selling mode without a resolved selection → re-gate.
  if (remoteLoaded && branchSellingMode && branchParam?.trim() && !selectedBranch) {
    return openBranchGate(enabledBranches);
  }

  return (
    <MyWebsiteProvider>
      <StorefrontView
        key={branchParam ?? "all"}
        config={config}
        catalog={catalog}
        companySlug={slug}
        selectedBranch={selectedBranch}
        onChangeBranch={
          branchSellingMode
            ? () => {
                setSearchParams({}, { replace: true });
              }
            : undefined
        }
      />
    </MyWebsiteProvider>
  );
}
