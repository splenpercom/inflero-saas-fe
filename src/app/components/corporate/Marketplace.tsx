import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Package,
  RefreshCw,
  Check,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { useAuth } from "../../context/AuthContext";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { cn } from "../ui/utils";
import { ModernSelect } from "../ui/ModernSelect";
import {
  fetchMarketplaceProducts,
  submitMarketplaceInquiry,
  productName,
  productShortDesc,
  productFullDesc,
  productCategory,
  conditionLabel,
  type MarketplaceProduct,
} from "../../api/marketplace";

type CartLine = { product: MarketplaceProduct; qty: number };
type DrawerStep = "cart" | "form" | "success";

const CART_KEY = "inflero-marketplace-cart";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* ignore */
  }
}

export function Marketplace() {
  const { language } = useLanguage();
  const { user, isDemo } = useAuth();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartLine[]>(() => loadCart());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState<DrawerStep>("cart");
  const [detail, setDetail] = useState<MarketplaceProduct | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchMarketplaceProducts();
      setProducts(items);
    } catch (err) {
      notifyFromError(err, tr("Məhsulları yükləmək alınmadı", "Failed to load products"));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    if (!drawerOpen) {
      const t = setTimeout(() => setStep("cart"), 250);
      return () => clearTimeout(t);
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (!user) return;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    setForm((f) => ({
      ...f,
      name: f.name || name,
      phone: f.phone || user.phone || "",
    }));
  }, [user]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      set.add(language === "en" ? p.categoryEn : p.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products, language]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const cat = productCategory(p, language);
      if (category !== "all" && cat !== category) return false;
      if (!q) return true;
      const hay = `${productName(p, language)} ${p.brand} ${p.model} ${cat}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, search, category, language]);

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cart.reduce((n, l) => n + l.product.price * l.qty, 0);
  const canSubmit = form.name.trim().length > 1 && form.phone.trim().length > 6;

  function addToCart(product: MarketplaceProduct, open = true) {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...prev, { product, qty: 1 }];
    });
    if (open) {
      setStep("cart");
      setDrawerOpen(true);
    }
  }

  function updateQty(id: string, qty: number) {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.product.id !== id) : prev.map((l) => (l.product.id === id ? { ...l, qty } : l)),
    );
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== id));
  }

  async function handleSubmit() {
    if (!canSubmit || submitting || cart.length === 0) return;
    if (isDemo) {
      notifyFromError(new Error("Demo"), tr("Demo rejimində sorğu göndərilmir", "Inquiries are disabled in demo mode"));
      return;
    }
    setSubmitting(true);
    try {
      await submitMarketplaceInquiry({
        name: form.name.trim(),
        phone: form.phone.trim(),
        note: form.note.trim() || undefined,
        lang: language === "en" ? "EN" : "AZ",
        total: cartTotal,
        items: cart.map((l) => ({
          productId: l.product.id,
          name: productName(l.product, language),
          brand: l.product.brand,
          model: l.product.model,
          price: l.product.price,
          qty: l.qty,
          lineTotal: l.product.price * l.qty,
        })),
        sourcePath: typeof window !== "undefined" ? window.location.pathname : "/dashboard/marketplace",
      });
      setCart([]);
      setForm((f) => ({ ...f, note: "" }));
      setStep("success");
      notifySuccess(tr("Sorğunuz qəbul olundu", "Inquiry submitted"));
    } catch (err) {
      notifyFromError(err, tr("Sorğunu göndərmək alınmadı", "Could not submit inquiry"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {tr("Marketpleys", "Marketplace")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tr(
                "POS və avadanlıq kataloqu — səbətə əlavə edib sorğu göndərin.",
                "POS & hardware catalog — add items and send an inquiry.",
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              {tr("Yenilə", "Refresh")}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("cart");
                setDrawerOpen(true);
              }}
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white text-sm font-semibold"
            >
              <ShoppingCart className="w-4 h-4" />
              {tr("Sorğu", "Inquiry")}
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tr("Axtar…", "Search…")}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            <div className="sm:w-56">
              <ModernSelect
                value={category}
                onChange={setCategory}
                searchable={categories.length > 6}
                minWidth={180}
                className="w-full"
                options={[
                  { value: "all", label: tr("Bütün kateqoriyalar", "All categories") },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-16 text-center">
            <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              {tr("Məhsul tapılmadı", "No products found")}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {tr("Filtrləri təmizləyib yenidən yoxlayın.", "Clear filters and try again.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const name = productName(p, language);
              const used = p.condition === "İşlənmiş";
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col hover:border-[#14b8a6]/50 transition-colors"
                >
                  <button type="button" onClick={() => setDetail(p)} className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-950 overflow-hidden text-left">
                    {p.imgs[0] ? (
                      <img src={p.imgs[0]} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="w-10 h-10" />
                      </div>
                    )}
                    {used && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
                        {conditionLabel(p.condition, language)}
                      </span>
                    )}
                  </button>
                  <div className="p-3.5 flex flex-col flex-1 gap-1.5">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">
                      {productCategory(p, language)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetail(p)}
                      className="text-left font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 hover:text-[#14b8a6]"
                    >
                      {name}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">
                      {productShortDesc(p, language)}
                    </p>
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {p.price.toLocaleString()}₼
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        className="px-3 py-1.5 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs font-semibold"
                      >
                        {tr("Əlavə et", "Add")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="aspect-video bg-gray-100 dark:bg-gray-950">
              {detail.imgs[0] ? (
                <img src={detail.imgs[0]} alt={productName(detail, language)} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="p-5 space-y-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">{productCategory(detail, language)}</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{productName(detail, language)}</h2>
              <p className="text-2xl font-bold text-[#14b8a6]">{detail.price.toLocaleString()}₼</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {productFullDesc(detail, language) || productShortDesc(detail, language)}
              </p>
              {detail.specs?.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  {detail.specs.map((s, i) => (
                    <div
                      key={`${s.label}-${i}`}
                      className="flex justify-between gap-4 px-3 py-2 text-sm border-b last:border-b-0 border-gray-100 dark:border-gray-800"
                    >
                      <span className="text-gray-500">{language === "en" ? s.labelEn : s.label}</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">
                        {language === "en" ? s.valueEn ?? s.value : s.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  addToCart(detail);
                  setDetail(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-sm"
              >
                {tr("Sorğuya əlavə et", "Add to inquiry")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[90] transition-opacity",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => setDrawerOpen(false)} />
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col transition-transform",
            drawerOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {step === "success"
                ? tr("Qəbul olundu", "Submitted")
                : step === "form"
                  ? tr("Sorğu məlumatları", "Inquiry details")
                  : tr("Sorğu səbəti", "Inquiry cart")}
            </h3>
            <button type="button" onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {step === "success" ? (
              <div className="flex flex-col items-center text-center py-10 gap-3">
                <div className="w-12 h-12 rounded-full bg-[#14b8a6]/15 text-[#14b8a6] flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {tr("Sorğunuz göndərildi", "Your inquiry was sent")}
                </p>
                <p className="text-sm text-gray-500">
                  {tr("Komandamız tezliklə sizinlə əlaqə saxlayacaq.", "Our team will contact you shortly.")}
                </p>
              </div>
            ) : step === "form" ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {tr("Cəmi", "Total")}: <span className="font-bold text-gray-900 dark:text-white">{cartTotal.toLocaleString()}₼</span>
                  {" · "}
                  {cartCount} {tr("məhsul", "items")}
                </div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{tr("Ad", "Name")}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-sm outline-none focus:ring-2 focus:ring-[#14b8a6]/40 text-gray-900 dark:text-white"
                  placeholder={tr("Adınız", "Your name")}
                />
                <label className="block text-xs font-medium text-gray-500 mb-1 mt-3">{tr("Telefon", "Phone")}</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-sm outline-none focus:ring-2 focus:ring-[#14b8a6]/40 text-gray-900 dark:text-white"
                  placeholder="+994 …"
                />
                <label className="block text-xs font-medium text-gray-500 mb-1 mt-3">{tr("Qeyd", "Note")}</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-sm outline-none focus:ring-2 focus:ring-[#14b8a6]/40 text-gray-900 dark:text-white resize-none"
                  placeholder={tr("İstəyə bağlı qeyd", "Optional note")}
                />
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>{tr("Səbət boşdur", "Cart is empty")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((l) => (
                  <div key={l.product.id} className="flex gap-3 p-2 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-950 flex-shrink-0">
                      {l.product.imgs[0] ? (
                        <img src={l.product.imgs[0]} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {productName(l.product, language)}
                      </div>
                      <div className="text-xs text-[#14b8a6] font-semibold mt-0.5">
                        {(l.product.price * l.qty).toLocaleString()}₼
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQty(l.product.id, l.qty - 1)}
                          className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium w-5 text-center">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(l.product.id, l.qty + 1)}
                          className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(l.product.id)}
                          className="ml-auto text-xs text-red-500 hover:underline"
                        >
                          {tr("Sil", "Remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {step !== "success" && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
              {step === "cart" && cart.length > 0 && (
                <>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{tr("Cəmi", "Total")}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{cartTotal.toLocaleString()}₼</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="w-full py-2.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-sm"
                  >
                    {tr("Davam et", "Continue")}
                  </button>
                </>
              )}
              {step === "form" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    {tr("Geri", "Back")}
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit || submitting}
                    onClick={() => void handleSubmit()}
                    className="flex-[1.4] py-2.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] disabled:opacity-50 text-white font-semibold text-sm"
                  >
                    {submitting ? tr("Göndərilir…", "Submitting…") : tr("Göndər", "Submit")}
                  </button>
                </div>
              )}
            </div>
          )}
          {step === "success" && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-sm"
              >
                {tr("Bağla", "Close")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
