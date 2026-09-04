import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Check,
  UtensilsCrossed,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Wifi,
  Copy,
  Eye,
  EyeOff,
  ChevronUp,
  Receipt,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import {
  createPublicDiningOrder,
  fetchPublicDiningMenu,
} from "../../../../app/api/publicDining";
import { ApiError } from "../../../../app/api/client";

type MenuItem = {
  productId: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
};

type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

type CartLine = { item: MenuItem; qty: number };

type RestaurantInfo = {
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
};

const CAT_COLORS = [
  "from-orange-400 to-rose-400",
  "from-blue-400 to-indigo-400",
  "from-pink-400 to-fuchsia-400",
  "from-teal-400 to-cyan-400",
];

const CAT_ICONS = ["🍳", "🍽️", "🍰", "🥤", "🥗", "🍕", "🍜", "☕"];

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function catIcon(name: string, idx: number) {
  const n = name.toLowerCase();
  if (n.includes("break")) return "🍳";
  if (n.includes("main") || n.includes("lunch") || n.includes("dinner")) return "🍽️";
  if (n.includes("dessert") || n.includes("sweet")) return "🍰";
  if (n.includes("drink") || n.includes("beverage") || n.includes("coffee")) return "🥤";
  return CAT_ICONS[idx % CAT_ICONS.length];
}

function VenueInfoCard({
  info,
  collapsed,
  onToggle,
}: {
  info: RestaurantInfo;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState<"ssid" | "pass" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const wifiPassword = info.wifiPassword?.trim() || null;
  const copy = (text: string, key: "ssid" | "pass") => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const socials = [
    { url: info.instagram, icon: Instagram, label: "Instagram", color: "text-pink-500" },
    { url: info.facebook, icon: Facebook, label: "Facebook", color: "text-blue-600" },
    { url: info.twitter, icon: Twitter, label: "X", color: "text-gray-700" },
  ].filter((s) => s.url);

  const hasDetails = Boolean(
    info.address || info.phone || info.email || info.wifiSsid || socials.length,
  );

  return (
    <div className="mx-3 mt-3 mb-1 rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
      <button
        type="button"
        onClick={onToggle}
        style={{ touchAction: "manipulation", minHeight: "52px" }}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-left"
      >
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <UtensilsCrossed className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight truncate">{info.name}</p>
          {info.tagline && (
            <p className="text-[11px] text-teal-100 truncate mt-0.5">{info.tagline}</p>
          )}
        </div>
        <div
          className={`w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 transition-transform ${
            collapsed ? "rotate-180" : ""
          }`}
        >
          <ChevronUp className="w-3.5 h-3.5 text-white" />
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 py-3 space-y-2.5">
          {!hasDetails ? (
            <p className="text-xs text-gray-500 text-center py-2">
              Restaurant details haven’t been published yet.
            </p>
          ) : (
            <>
              {info.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(info.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ touchAction: "manipulation" }}
                  className="flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-[#14b8a6] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-snug">{info.address}</span>
                </a>
              )}
              {info.phone && (
                <a
                  href={`tel:${info.phone}`}
                  style={{ touchAction: "manipulation", minHeight: "36px" }}
                  className="flex items-center gap-3"
                >
                  <Phone className="w-4 h-4 text-[#14b8a6] flex-shrink-0" />
                  <span className="text-sm text-gray-600">{info.phone}</span>
                </a>
              )}
              {info.email && (
                <a
                  href={`mailto:${info.email}`}
                  style={{ touchAction: "manipulation", minHeight: "36px" }}
                  className="flex items-center gap-3"
                >
                  <Mail className="w-4 h-4 text-[#14b8a6] flex-shrink-0" />
                  <span className="text-sm text-gray-600">{info.email}</span>
                </a>
              )}
              {socials.length > 0 && (
                <div className="flex items-center gap-4 pt-0.5">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url!}
                      target="_blank"
                      rel="noreferrer"
                      style={{ touchAction: "manipulation", minHeight: "36px" }}
                      className={`flex items-center gap-1.5 ${s.color}`}
                    >
                      <s.icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{s.label}</span>
                    </a>
                  ))}
                </div>
              )}
              {info.wifiSsid && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 mt-0.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Free WiFi
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Network</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{info.wifiSsid}</p>
                      <button
                        type="button"
                        onClick={() => copy(info.wifiSsid!, "ssid")}
                        style={{ touchAction: "manipulation" }}
                        className="flex-shrink-0 p-0.5"
                        aria-label="Copy network name"
                      >
                        {copied === "ssid" ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {wifiPassword && (
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Password</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-800 truncate font-mono tracking-wide">
                          {showPassword
                            ? wifiPassword
                            : "•".repeat(Math.min(Math.max(wifiPassword.length, 8), 24))}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          style={{ touchAction: "manipulation" }}
                          className="flex-shrink-0 p-0.5"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copy(wifiPassword, "pass")}
                          style={{ touchAction: "manipulation" }}
                          className="flex-shrink-0 p-0.5"
                          aria-label="Copy password"
                        >
                          {copied === "pass" ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CartOverlay({
  cart,
  placing,
  onClose,
  onPlaceOrder,
  onInc,
  onDec,
}: {
  cart: CartLine[];
  placing: boolean;
  onClose: () => void;
  onPlaceOrder: () => void;
  onInc: (productId: string) => void;
  onDec: (productId: string) => void;
}) {
  const total = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">Your Order</p>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          style={{ touchAction: "manipulation" }}
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {cart.map((c) => (
          <div
            key={c.item.productId}
            className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{c.item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.item.price.toFixed(2)} ₼ each</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => onDec(c.item.productId)}
                className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
              >
                <Minus className="w-3 h-3 text-gray-600" />
              </button>
              <span className="text-xs font-bold w-5 text-center">{c.qty}</span>
              <button
                type="button"
                onClick={() => onInc(c.item.productId)}
                className="w-7 h-7 rounded-lg bg-[#14b8a6] flex items-center justify-center"
              >
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
            <p className="text-sm font-bold text-gray-900 w-16 text-right">
              {(c.item.price * c.qty).toFixed(2)} ₼
            </p>
          </div>
        ))}
      </div>

      <div
        className="px-4 pt-3 border-t border-gray-100 flex-shrink-0"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">{total.toFixed(2)} ₼</span>
        </div>
        <button
          type="button"
          disabled={placing || cart.length === 0}
          onClick={onPlaceOrder}
          style={{ touchAction: "manipulation", minHeight: "50px" }}
          className="w-full rounded-2xl bg-[#14b8a6] active:bg-[#0d9488] text-white font-bold text-sm transition-colors disabled:opacity-50"
        >
          {placing ? "Sending…" : "Place Order"}
        </button>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          Payment at counter · kitchen notified
        </p>
      </div>
    </div>
  );
}

function OrderConfirmScreen({
  items,
  tableLabel,
  restaurantName,
  orderRef,
  tenantSlug,
  onBack,
}: {
  items: CartLine[];
  tableLabel: string | null;
  restaurantName: string;
  orderRef: string;
  tenantSlug: string;
  onBack: () => void;
}) {
  const total = items.reduce((s, c) => s + c.item.price * c.qty, 0);
  return (
    <div className="bg-gray-50 flex flex-col" style={{ minHeight: "100dvh" }}>
      <div
        className="bg-white border-b border-gray-100 flex-shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-xl bg-[#14b8a6] flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{restaurantName}</p>
            <p className="text-[11px] text-gray-400">Order confirmed</p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="bg-white border border-green-200 rounded-2xl p-5 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">Order Sent to Kitchen!</p>
          <p className="text-sm text-gray-500">
            {tableLabel ? `${tableLabel} · ` : ""}Sit back and relax.
          </p>
          <p className="text-xs text-gray-400 mt-2 font-mono">Ref {orderRef}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-bold text-gray-900">Your Bill</p>
            </div>
            <p className="text-[10px] text-gray-400">{tableLabel || "Counter"}</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            {items.map((c) => (
              <div key={c.item.productId} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-gray-600">{c.qty}</span>
                </div>
                <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">{c.item.name}</span>
                <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  {(c.item.price * c.qty).toFixed(2)} ₼
                </span>
              </div>
            ))}
          </div>
          <div className="mx-4 py-3 border-t border-dashed border-gray-200 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-[#0f766e]">{total.toFixed(2)} ₼</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 px-4">
          Please pay at the counter when ready.
        </p>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 pt-3 space-y-2"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{ touchAction: "manipulation", minHeight: "44px" }}
          className="w-full rounded-2xl bg-[#14b8a6] text-white font-semibold text-sm"
        >
          Order more
        </button>
        <Link
          to={`/book/${tenantSlug}`}
          style={{ touchAction: "manipulation", minHeight: "44px" }}
          className="w-full rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm flex items-center justify-center gap-1.5"
        >
          <CalendarDays className="w-3.5 h-3.5" /> Book a table
        </Link>
      </div>
    </div>
  );
}

export function QRMenuSite() {
  const { tenantSlug, tableId } = useParams<{ tenantSlug: string; tableId?: string }>();
  const [searchParams] = useSearchParams();
  const branchCode = searchParams.get("branch") || undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<RestaurantInfo>({
    name: "Menu",
    tagline: null,
    address: null,
    phone: null,
    email: null,
    instagram: null,
    facebook: null,
    twitter: null,
    wifiSsid: null,
    wifiPassword: null,
  });
  const [tableLabel, setTableLabel] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("");
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ ref: string; items: CartLine[] } | null>(null);

  useEffect(() => {
    if (!tenantSlug) {
      setError("Missing restaurant link");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (await fetchPublicDiningMenu(tenantSlug, {
          tableId,
          branch: branchCode,
        })) as {
          restaurant?: Partial<RestaurantInfo> | null;
          table?: { number: number; name: string } | null;
          categories?: MenuCategory[];
          tenant?: { name?: string };
        };
        setInfo({
          name: data.restaurant?.name || data.tenant?.name || "Menu",
          tagline: data.restaurant?.tagline ?? null,
          address: data.restaurant?.address ?? null,
          phone: data.restaurant?.phone ?? null,
          email: data.restaurant?.email ?? null,
          instagram: data.restaurant?.instagram ?? null,
          facebook: data.restaurant?.facebook ?? null,
          twitter: data.restaurant?.twitter ?? null,
          wifiSsid: data.restaurant?.wifiSsid ?? null,
          wifiPassword: data.restaurant?.wifiPassword ?? null,
        });
        setTableLabel(data.table ? `${data.table.name} (#${data.table.number})` : null);
        const cats = data.categories ?? [];
        setCategories(cats);
        setActiveCat(cats[0]?.id ?? "");
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantSlug, tableId, branchCode]);

  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((s, c) => s + c.item.price * c.qty, 0),
    [cart],
  );

  const addToCart = (item: MenuItem) => {
    if (!item.available) return;
    setCart((prev) => {
      const ex = prev.find((c) => c.item.productId === item.productId);
      return ex
        ? prev.map((c) =>
            c.item.productId === item.productId ? { ...c, qty: c.qty + 1 } : c,
          )
        : [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.item.productId === productId);
      if (!ex) return prev;
      return ex.qty === 1
        ? prev.filter((c) => c.item.productId !== productId)
        : prev.map((c) =>
            c.item.productId === productId ? { ...c, qty: c.qty - 1 } : c,
          );
    });
  };

  const qtyOf = (productId: string) =>
    cart.find((c) => c.item.productId === productId)?.qty ?? 0;

  const placeOrder = async () => {
    if (!tenantSlug || cart.length === 0) return;
    setPlacing(true);
    try {
      const res = (await createPublicDiningOrder(tenantSlug, {
        tableId: tableId ?? null,
        branch: branchCode ?? null,
        items: cart.map((c) => ({ productId: c.item.productId, quantity: c.qty })),
      })) as { reference?: string | null; id: string };
      const captured = [...cart];
      setPlaced({ ref: res.reference || res.id, items: captured });
      setCart([]);
      setShowCart(false);
      toast.success("Order sent to kitchen");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }

  if (error || !tenantSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center space-y-2 max-w-sm">
          <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-900">Menu unavailable</p>
          <p className="text-xs text-gray-500">
            {error || "This restaurant hasn’t published a menu yet."}
          </p>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <OrderConfirmScreen
        items={placed.items}
        tableLabel={tableLabel}
        restaurantName={info.name}
        orderRef={placed.ref}
        tenantSlug={tenantSlug}
        onBack={() => setPlaced(null)}
      />
    );
  }

  const HEADER_H = 96;
  const menuEmpty = categories.length === 0 || categories.every((c) => c.items.length === 0);

  return (
    <div className="bg-gray-50" style={{ minHeight: "100dvh" }}>
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#14b8a6] flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">{info.name}</p>
              {tableLabel ? (
                <p className="text-[11px] text-gray-400 leading-none mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block flex-shrink-0" />
                  <span className="truncate">{tableLabel}</span>
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 leading-none mt-0.5">Scan · Order · Enjoy</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCart(true)}
            style={{ touchAction: "manipulation", minHeight: "38px" }}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#14b8a6] active:bg-[#0d9488] text-white text-xs font-bold transition-colors flex-shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{cartTotal.toFixed(2)} ₼</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {!menuEmpty && (
          <div
            className="flex gap-2 px-3 pb-2.5 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {categories.map((cat, idx) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                onClick={() => setActiveCat(cat.id)}
                style={{ touchAction: "manipulation", minHeight: "30px", flexShrink: 0 }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  activeCat === cat.id
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                <span className="text-sm leading-none">{catIcon(cat.name, idx)}</span>
                {cat.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ paddingTop: `calc(${HEADER_H}px + env(safe-area-inset-top, 0px))` }}>
        <VenueInfoCard
          info={info}
          collapsed={infoCollapsed}
          onToggle={() => setInfoCollapsed((p) => !p)}
        />

        {menuEmpty ? (
          <div className="mx-3 mt-4 mb-8 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center space-y-2">
            <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-800">Menu not published yet</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              This restaurant hasn’t added items to the digital menu. Please ask staff for a
              printed menu, or check back later.
            </p>
            {info.phone && (
              <a
                href={`tel:${info.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f766e] pt-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {info.phone}
              </a>
            )}
          </div>
        ) : (
          <div
            className="px-3 pt-3 space-y-6"
            style={{ paddingBottom: `calc(80px + env(safe-area-inset-bottom, 0px))` }}
          >
            {categories.map((cat, catIdx) => {
              const available = cat.items.filter((i) => i.available).length;
              const icon = catIcon(cat.name, catIdx);
              return (
                <div key={cat.id} id={cat.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                        CAT_COLORS[catIdx % CAT_COLORS.length]
                      } flex items-center justify-center text-lg flex-shrink-0`}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                      <p className="text-[11px] text-gray-400">{available} available</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400">{cat.items.length}</span>
                  </div>

                  <div className="space-y-2">
                    {cat.items.map((item) => {
                      const q = qtyOf(item.productId);
                      return (
                        <div
                          key={item.productId}
                          className={`bg-white rounded-2xl border overflow-hidden flex items-start ${
                            !item.available
                              ? "opacity-50 border-gray-100"
                              : "border-gray-100 shadow-sm"
                          }`}
                        >
                          <div
                            className={`w-20 h-20 flex-shrink-0 bg-gradient-to-br ${
                              CAT_COLORS[catIdx % CAT_COLORS.length]
                            } flex items-center justify-center overflow-hidden`}
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">{icon}</span>
                            )}
                          </div>

                          <div
                            className="flex-1 p-3 min-w-0 flex flex-col"
                            style={{ minHeight: "80px" }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 leading-snug">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              {!item.available && (
                                <span className="inline-block mt-1 text-[10px] font-semibold text-red-400 bg-red-50 px-1.5 py-0.5 rounded">
                                  Unavailable
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-sm font-bold text-[#0f766e]">
                                {item.price.toFixed(2)} ₼
                              </span>
                              {item.available &&
                                (q === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => addToCart(item)}
                                    style={{ touchAction: "manipulation", minHeight: "30px" }}
                                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#14b8a6] active:bg-[#0d9488] text-white text-xs font-bold transition-colors"
                                  >
                                    <Plus className="w-3 h-3" /> Add
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(item.productId)}
                                      style={{
                                        touchAction: "manipulation",
                                        width: "28px",
                                        height: "28px",
                                      }}
                                      className="rounded-lg border border-gray-200 bg-white flex items-center justify-center active:bg-gray-100 transition-colors"
                                    >
                                      <Minus className="w-3 h-3 text-gray-600" />
                                    </button>
                                    <span className="text-xs font-bold text-gray-900 w-5 text-center">
                                      {q}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => addToCart(item)}
                                      style={{
                                        touchAction: "manipulation",
                                        width: "28px",
                                        height: "28px",
                                      }}
                                      className="rounded-lg bg-[#14b8a6] active:bg-[#0d9488] flex items-center justify-center transition-colors"
                                    >
                                      <Plus className="w-3 h-3 text-white" />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cartCount > 0 && !showCart && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-3"
          style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            type="button"
            onClick={() => setShowCart(true)}
            style={{ touchAction: "manipulation", minHeight: "52px" }}
            className="w-full rounded-2xl bg-[#14b8a6] active:bg-[#0d9488] text-white font-bold text-sm shadow-xl shadow-teal-600/25 transition-colors flex items-center justify-between px-4"
          >
            <span className="bg-white/25 rounded-lg w-7 h-7 flex items-center justify-center text-xs font-bold">
              {cartCount}
            </span>
            <span className="text-sm">View Order</span>
            <span className="font-bold">{cartTotal.toFixed(2)} ₼</span>
          </button>
        </div>
      )}

      {showCart && (
        <CartOverlay
          cart={cart}
          placing={placing}
          onClose={() => setShowCart(false)}
          onPlaceOrder={() => void placeOrder()}
          onInc={(id) => {
            const line = cart.find((c) => c.item.productId === id);
            if (line) addToCart(line.item);
          }}
          onDec={removeFromCart}
        />
      )}
    </div>
  );
}

export default QRMenuSite;
