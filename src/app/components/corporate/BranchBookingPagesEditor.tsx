import { useEffect, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import type { BranchLandingPage } from "../../lib/branchBooking";
import { slugifyBranchPage } from "../../lib/branchBooking";
import { customerBookingPath, customerBookingUrl } from "../../lib/bookingLinks";
import type { StoreRecord } from "../../api/stores";
import { fetchStores } from "../../api/stores";
import { notifySuccess } from "../../lib/toast";

interface BranchBookingPagesEditorProps {
  tenantSlug: string | null;
  branchPages: Record<string, BranchLandingPage>;
  onChange: (pages: Record<string, BranchLandingPage>) => void;
  tr: (az: string, en: string) => string;
}

function defaultPageForStore(store: StoreRecord): BranchLandingPage {
  return {
    slug: slugifyBranchPage(store.code || store.name),
    enabled: true,
    name: store.name,
    phone: store.phone,
    email: store.email,
    address: store.address,
  };
}

export function BranchBookingPagesEditor({
  tenantSlug,
  branchPages,
  onChange,
  tr,
}: BranchBookingPagesEditorProps) {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchStores()
      .then((rows) => {
        if (!cancelled) setStores(rows.filter((s) => s.status === "Active"));
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!stores.length || seeded) return;
    const next = { ...branchPages };
    let changed = false;
    for (const store of stores) {
      if (!next[store.id]) {
        next[store.id] = defaultPageForStore(store);
        changed = true;
      }
    }
    if (changed) onChange(next);
    setSeeded(true);
  }, [stores, seeded, branchPages, onChange]);

  const updatePage = (storeId: string, patch: Partial<BranchLandingPage>) => {
    onChange({
      ...branchPages,
      [storeId]: { ...branchPages[storeId], ...patch },
    });
  };

  const copyLink = async (branchSlug: string) => {
    if (!tenantSlug) return;
    try {
      await navigator.clipboard.writeText(customerBookingUrl(tenantSlug, undefined, branchSlug));
      notifySuccess(tr("Link kopyalandı", "Link copied"));
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return <p className="text-xs text-gray-500">{tr("Filiallar yüklənir...", "Loading branches...")}</p>;
  }

  if (!stores.length) {
    return (
      <p className="text-xs text-amber-700 dark:text-amber-400">
        {tr(
          "Əvvəlcə filial əlavə edin (İnsanlar → Filiallar).",
          "Add branches first (People → Branches).",
        )}{" "}
        <Link to="/dashboard/people/warehouses" className="underline font-medium">
          {tr("Filiallara keç", "Go to Branches")}
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
      {stores.map((store) => {
        const page = branchPages[store.id] ?? defaultPageForStore(store);
        const linkPath = tenantSlug ? customerBookingPath(tenantSlug, page.slug) : null;
        return (
          <div
            key={store.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{store.name}</p>
                <p className="text-[10px] text-gray-500">{store.code}</p>
              </div>
              <label className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400 shrink-0">
                <input
                  type="checkbox"
                  checked={page.enabled !== false}
                  onChange={(e) => updatePage(store.id, { enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                {tr("Aktiv", "Enabled")}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">{tr("URL slug", "URL slug")}</label>
                <input
                  value={page.slug}
                  onChange={(e) => updatePage(store.id, { slug: slugifyBranchPage(e.target.value) })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">{tr("Görünən ad", "Display name")}</label>
                <input
                  value={page.name ?? ""}
                  onChange={(e) => updatePage(store.id, { name: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">{tr("Telefon", "Phone")}</label>
                <input
                  value={page.phone ?? ""}
                  onChange={(e) => updatePage(store.id, { phone: e.target.value || null })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">{tr("E-poçt", "Email")}</label>
                <input
                  value={page.email ?? ""}
                  onChange={(e) => updatePage(store.id, { email: e.target.value || null })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 block mb-1">{tr("Ünvan", "Address")}</label>
              <input
                value={page.address ?? ""}
                onChange={(e) => updatePage(store.id, { address: e.target.value || null })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
              />
            </div>

            {linkPath && page.enabled !== false && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-[10px] text-gray-500 truncate flex-1">{linkPath}</p>
                <button
                  type="button"
                  onClick={() => void copyLink(page.slug)}
                  className="p-1 border border-gray-300 dark:border-gray-700 rounded"
                  title={tr("Kopyala", "Copy")}
                >
                  <Copy className="w-3 h-3" />
                </button>
                <Link
                  to={linkPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 border border-gray-300 dark:border-gray-700 rounded"
                  title={tr("Aç", "Open")}
                >
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
