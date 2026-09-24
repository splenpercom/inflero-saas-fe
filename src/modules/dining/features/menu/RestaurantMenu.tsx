import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useLanguage } from "../../i18n";
import { toast } from "sonner";
import { Search, UtensilsCrossed, RefreshCw, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react";
import {
  fetchDiningMenu,
  upsertDiningMenu,
  type DiningMenuCategory,
  type DiningMenuProduct,
} from "../../../../app/api/dining";
import { ApiError } from "../../../../app/api/client";
import { useBranchRevision } from "../../../../app/hooks/useBranchRevision";
import { useConfirm } from "../../../../app/context/ConfirmContext";
import { Checkbox } from "../../../../app/components/ui/checkbox";
import { cn } from "../../../../app/components/ui/utils";

const inputCls =
  "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]";

const menuCheckboxCls =
  "size-4 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-none data-[state=checked]:bg-[#14b8a6] data-[state=checked]:border-[#14b8a6] data-[state=checked]:text-white dark:data-[state=checked]:bg-[#14b8a6] dark:data-[state=checked]:border-[#14b8a6] focus-visible:ring-[#14b8a6]/30";

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export function RestaurantMenu() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const navigate = useNavigate();
  const dirtyRef = useRef(false);

  const [categories, setCategories] = useState<DiningMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const unsavedMessage = tr(
    "Saxlanmamış menyu dəyişiklikləri var. Səhifəni tərk etsəniz dəyişikliklər itəcək.",
    "You have unsaved menu changes. If you leave this page, your edits will be lost.",
  );

  const confirmLeaveUnsaved = useCallback(async () => {
    return askConfirm({
      title: tr("Saxlanmamış dəyişikliklər", "Unsaved changes"),
      message: unsavedMessage,
      confirmLabel: tr("Tərk et", "Leave"),
      cancelLabel: tr("Qal", "Stay"),
      variant: "danger",
    });
  }, [askConfirm, unsavedMessage, language]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Browser Back/Forward: trap navigation while unsaved.
  useEffect(() => {
    if (!dirty) return;

    window.history.pushState({ __infleroMenuUnsavedGuard: true }, "");

    let confirming = false;

    const onPopState = () => {
      if (!dirtyRef.current || confirming) return;
      confirming = true;
      // Stay on this page while the dialog is open.
      window.history.pushState({ __infleroMenuUnsavedGuard: true }, "");

      void (async () => {
        const leave = await confirmLeaveUnsaved();
        confirming = false;
        if (!leave) return;
        dirtyRef.current = false;
        setDirty(false);
        // Skip guard entries and leave the menu page.
        requestAnimationFrame(() => {
          window.history.go(-2);
        });
      })();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dirty, confirmLeaveUnsaved]);

  useEffect(() => {
    const isInternalNavLink = (anchor: HTMLAnchorElement) => {
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return false;
      }
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return false;
        const next = `${url.pathname}${url.search}${url.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        return next !== current;
      } catch {
        return false;
      }
    };

    const onDocumentClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavLink(anchor)) return;

      e.preventDefault();
      e.stopPropagation();
      const href = anchor.getAttribute("href");
      if (!href) return;
      void (async () => {
        const leave = await confirmLeaveUnsaved();
        if (!leave) return;
        dirtyRef.current = false;
        setDirty(false);
        navigate(href);
      })();
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [confirmLeaveUnsaved, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDiningMenu();
      setCategories(data.categories);
      setExpanded(new Set());
      setDirty(false);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + reload when branch changes (skip while unsaved edits exist).
  useEffect(() => {
    if (dirtyRef.current) return;
    void load();
  }, [load, branchRevision]);

  const confirmDiscardIfDirty = async () => {
    if (!dirty) return true;
    return askConfirm({
      title: tr("Saxlanmamış dəyişikliklər", "Unsaved changes"),
      message: unsavedMessage,
      confirmLabel: tr("Dəyişiklikləri at", "Discard"),
      cancelLabel: tr("Ləğv et", "Cancel"),
      variant: "danger",
    });
  };

  const handleRefresh = async () => {
    if (!(await confirmDiscardIfDirty())) return;
    await load();
  };

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

  const setCategoryProductsOnMenu = (
    categoryId: string,
    productIds: string[],
    onMenu: boolean,
  ) => {
    if (productIds.length === 0) return;
    const idSet = new Set(productIds);
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== categoryId
          ? c
          : {
              ...c,
              products: c.products.map((p) =>
                idSet.has(p.productId) ? { ...p, onMenu } : p,
              ),
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
          {dirty && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              {tr("Saxlanmayıb", "Unsaved")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700"
            title={tr("Yenilə", "Refresh")}
          >
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
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 mb-1 rounded-lg bg-[#f0fdfa] dark:bg-[#14b8a6]/10 border border-[#99f6e4]/60 dark:border-[#14b8a6]/25">
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                      {tr("Kateqoriya seçimi", "Category selection")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryProductsOnMenu(
                            cat.id,
                            cat.products.map((p) => p.productId),
                            true,
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white shadow-sm transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        {tr("Hamısını seç", "Select all")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryProductsOnMenu(
                            cat.id,
                            cat.products.map((p) => p.productId),
                            false,
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-colors"
                      >
                        <Square className="w-3.5 h-3.5" />
                        {tr("Hamısını təmizlə", "Clear all")}
                      </button>
                    </div>
                  </div>
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
                      <label
                        className={cn(
                          "flex items-center gap-2 text-[10px] font-medium flex-shrink-0 cursor-pointer select-none rounded-full px-2.5 py-1 border transition-colors",
                          p.onMenu
                            ? "border-[#14b8a6]/40 bg-[#ccfbf1]/50 dark:bg-[#14b8a6]/15 text-[#0d9488] dark:text-[#14b8a6]"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400",
                        )}
                      >
                        <Checkbox
                          checked={p.onMenu}
                          onCheckedChange={(checked) =>
                            patchProduct(cat.id, p.productId, { onMenu: checked === true })
                          }
                          className={menuCheckboxCls}
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
