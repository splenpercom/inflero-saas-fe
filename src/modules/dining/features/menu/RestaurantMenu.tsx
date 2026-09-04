import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../i18n";
import { toast } from "sonner";
import { Search, UtensilsCrossed, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import {
  fetchDiningMenu,
  upsertDiningMenu,
  type DiningMenuCategory,
  type DiningMenuProduct,
} from "../../../../app/api/dining";
import { ApiError } from "../../../../app/api/client";
import { useBranchRevision } from "../../../../app/hooks/useBranchRevision";

const inputCls =
  "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]";

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export function RestaurantMenu() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const branchRevision = useBranchRevision();

  const [categories, setCategories] = useState<DiningMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDiningMenu();
      setCategories(data.categories);
      setExpanded(new Set(data.categories.filter((c) => c.products.some((p) => p.onMenu)).map((c) => c.id)));
      setDirty(false);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, branchRevision]);

  const patchProduct = (categoryId: string, productId: string, patch: Partial<DiningMenuProduct>) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== categoryId
          ? c
          : {
              ...c,
              products: c.products.map((p) => (p.productId === productId ? { ...p, ...patch } : p)),
            },
      ),
    );
    setDirty(true);
  };

  const onMenuCount = useMemo(
    () => categories.reduce((n, c) => n + c.products.filter((p) => p.onMenu).length, 0),
    [categories],
  );

  const save = async () => {
    setSaving(true);
    try {
      const items = categories.flatMap((c) =>
        c.products.map((p) => ({
          productId: p.productId,
          onMenu: p.onMenu,
          sortOrder: p.sortOrder,
          available: p.available,
          description: p.description,
          imageUrl: p.imageUrl,
        })),
      );
      const data = await upsertDiningMenu(items);
      setCategories(data.categories);
      setDirty(false);
      toast.success(tr("Menyu yadda saxlanıldı", "Menu saved"));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered = categories
    .map((c) => ({
      ...c,
      products: c.products.filter(
        (p) =>
          !q.trim() ||
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.sku.toLowerCase().includes(q.toLowerCase()),
      ),
    }))
    .filter((c) => c.products.length > 0);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-[#14b8a6]" />
            {tr("Restoran menyusu", "Restaurant menu")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {tr(
              "Inventar kateqoriyaları və məhsullarından seçin. Kateqoriya yaratmaq lazım deyil.",
              "Opt inventory products onto this branch menu. Categories come from Inventory.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => void save()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white disabled:opacity-50"
          >
            {saving ? tr("Saxlanılır…", "Saving…") : tr("Yadda saxla", "Save menu")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{categories.length}</p>
          <p className="text-xs text-gray-500">{tr("Inventar kateqoriyası", "Inventory categories")}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{onMenuCount}</p>
          <p className="text-xs text-gray-500">{tr("Menyuda", "On menu")}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("Məhsul axtar…", "Search products…")}
          className={`${inputCls} pl-8`}
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-8">
            {tr("Məhsul tapılmadı. Əvvəlcə Inventarda məhsul yaradın.", "No products found. Create products in Inventory first.")}
          </p>
        )}
        {filtered.map((cat) => {
          const open = expanded.has(cat.id);
          return (
            <div key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(cat.id)) next.delete(cat.id);
                    else next.add(cat.id);
                    return next;
                  })
                }
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {cat.products.filter((p) => p.onMenu).length}/{cat.products.length} {tr("menyuda", "on menu")}
                  </p>
                </div>
                {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
              </button>
              {open && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-2 space-y-1">
                  {cat.products.map((p) => (
                    <div
                      key={p.productId}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                        {p.image || p.imageUrl ? (
                          <img src={(p.imageUrl || p.image)!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">🍴</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {p.sku} · {p.price.toFixed(2)} ₼
                          {p.status !== "ACTIVE" ? ` · ${p.status}` : ""}
                        </p>
                      </div>
                      <label className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-300 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={p.onMenu}
                          onChange={(e) => patchProduct(cat.id, p.productId, { onMenu: e.target.checked })}
                          className="accent-[#14b8a6]"
                        />
                        {tr("Menyuda", "On menu")}
                      </label>
                      {p.onMenu && (
                        <button
                          type="button"
                          onClick={() => patchProduct(cat.id, p.productId, { available: !p.available })}
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            p.available
                              ? "border-green-300 text-green-700 bg-green-50"
                              : "border-gray-300 text-gray-500"
                          }`}
                        >
                          {p.available ? tr("Aktiv", "Available") : tr("Gizli", "Hidden")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
