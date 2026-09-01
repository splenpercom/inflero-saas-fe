import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { Globe } from "lucide-react";
import { isReservedStoreSlug } from "../../lib/bookingLinks";
import { fetchPublicStorefront } from "../../api/website";
import {
  MyWebsiteProvider,
  StorefrontView,
  loadWebsiteConfigBySlug,
} from "../../../modules/my-website";
import type { WebsiteConfig } from "../../../modules/my-website/features/builder/types";

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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="mt-4 px-4 py-6 border-t border-gray-100 dark:border-gray-800">
        <ShimmerBlock className="h-3 w-44 mx-auto rounded-md" />
      </div>
    </div>
  );
}

export function PublicStorefront() {
  const { companySlug = "" } = useParams<{ companySlug: string }>();
  const slug = decodeURIComponent(companySlug).trim().toLowerCase();
  const reserved = !slug || isReservedStoreSlug(slug);
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(!reserved);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (reserved) return;

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setConfig(null);

    void (async () => {
      try {
        const remote = await fetchPublicStorefront(slug);
        if (cancelled) return;
        if (remote?.config) {
          setConfig(remote.config);
          return;
        }
        const local = loadWebsiteConfigBySlug(slug);
        if (cancelled) return;
        if (local) {
          setConfig(local);
          return;
        }
        setNotFound(true);
      } catch {
        if (cancelled) return;
        const local = loadWebsiteConfigBySlug(slug);
        if (local) {
          setConfig(local);
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
  }, [reserved, slug]);

  if (reserved) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <StorefrontShimmer />;
  }

  if (notFound || !config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0026f6]/10 flex items-center justify-center">
          <Globe className="w-6 h-6 text-[#0026f6]" />
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
          className="text-sm font-medium text-[#0026f6] hover:text-[#001db8] underline-offset-2 hover:underline"
        >
          Go to Inflero
        </Link>
      </div>
    );
  }

  return (
    <MyWebsiteProvider>
      <StorefrontView config={config} />
    </MyWebsiteProvider>
  );
}
