import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router";
import { Globe } from "lucide-react";
import { isReservedStoreSlug } from "../../lib/bookingLinks";
import {
  MyWebsiteProvider,
  StorefrontView,
  loadWebsiteConfigBySlug,
} from "../../../modules/my-website";

export function PublicStorefront() {
  const { companySlug = "" } = useParams<{ companySlug: string }>();
  const slug = decodeURIComponent(companySlug).trim().toLowerCase();
  const reserved = !slug || isReservedStoreSlug(slug);
  const config = useMemo(
    () => (reserved ? null : loadWebsiteConfigBySlug(slug)),
    [reserved, slug],
  );

  if (reserved) {
    return <Navigate to="/" replace />;
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <Globe className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Store not published yet</h1>
          <p className="mt-1 text-sm text-gray-500 max-w-sm">
            No saved website was found for <span className="font-medium text-gray-700">/{slug}</span>.
            Open My Website in the dashboard and save to publish.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-green-600 hover:text-green-700 underline-offset-2 hover:underline"
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
