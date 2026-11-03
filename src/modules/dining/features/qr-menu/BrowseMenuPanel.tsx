import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { fetchPublicDiningMenu } from "../../../../app/api/publicDining";
import { ApiError } from "../../../../app/api/client";

export type BrowseLang = "az" | "en" | "ru";

const BROWSE_LANG_KEY = "inflero-qr-menu-lang";

const BROWSE_STRINGS = {
  az: {
    browseMenu: "Menyuya bax",
    menu: "Menyu",
    available: "mövcud",
    unavailable: "Mövcud deyil",
    menuUnavailable: "Menyu əlçatan deyil",
    missingLink: "Restoran keçidi yoxdur",
    notPublishedYet: "Bu restoran hələ menyu dərc etməyib.",
    menuNotPublished: "Menyu hələ dərc edilməyib",
    menuNotPublishedHint:
      "Bu restoran rəqəmsal menyuya məhsul əlavə etməyib. Zəhmət olmasa işçidən çap menyusu istəyin və ya sonra yenidən yoxlayın.",
    viewFullMenu: "Tam menyuya bax",
    language: "Dil",
  },
  en: {
    browseMenu: "Browse menu",
    menu: "Menu",
    available: "available",
    unavailable: "Unavailable",
    menuUnavailable: "Menu unavailable",
    missingLink: "Missing restaurant link",
    notPublishedYet: "This restaurant hasn’t published a menu yet.",
    menuNotPublished: "Menu not published yet",
    menuNotPublishedHint:
      "This restaurant hasn’t added items to the digital menu. Please ask staff for a printed menu, or check back later.",
    viewFullMenu: "View full menu",
    language: "Language",
  },
  ru: {
    browseMenu: "Смотреть меню",
    menu: "Меню",
    available: "доступно",
    unavailable: "Недоступно",
    menuUnavailable: "Меню недоступно",
    missingLink: "Ссылка на ресторан отсутствует",
    notPublishedYet: "Этот ресторан ещё не опубликовал меню.",
    menuNotPublished: "Меню ещё не опубликовано",
    menuNotPublishedHint:
      "Ресторан ещё не добавил блюда в цифровое меню. Попросите печатное меню у персонала или зайдите позже.",
    viewFullMenu: "Открыть полное меню",
    language: "Язык",
  },
} as const;

type BrowseStringKey = keyof typeof BROWSE_STRINGS.az;

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

type RestaurantInfo = {
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
};

const CAT_COLORS = [
  "from-orange-400 to-rose-400",
  "from-blue-400 to-indigo-400",
  "from-pink-400 to-fuchsia-400",
  "from-teal-400 to-cyan-400",
];

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function readBrowseLang(searchParams?: URLSearchParams | null, fallback?: BrowseLang): BrowseLang {
  const fromUrl = searchParams?.get("lang");
  if (fromUrl === "az" || fromUrl === "en" || fromUrl === "ru") return fromUrl;
  if (fallback === "az" || fallback === "en" || fallback === "ru") return fallback;
  try {
    const saved = sessionStorage.getItem(BROWSE_LANG_KEY);
    if (saved === "az" || saved === "en" || saved === "ru") return saved;
  } catch {
    /* ignore */
  }
  return "az";
}

function LangSwitcher({
  lang,
  onChange,
}: {
  lang: BrowseLang;
  onChange: (lang: BrowseLang) => void;
}) {
  const options: { id: BrowseLang; label: string }[] = [
    { id: "az", label: "AZ" },
    { id: "en", label: "EN" },
    { id: "ru", label: "RU" },
  ];
  return (
    <div
      className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 flex-shrink-0"
      role="group"
      aria-label="Language"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          style={{ touchAction: "manipulation", minHeight: "28px" }}
          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
            lang === o.id
              ? "bg-[#14b8a6] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function browseMenuHref(tenantSlug: string, branchCode?: string, lang?: BrowseLang) {
  const params = new URLSearchParams();
  if (branchCode) params.set("branch", branchCode);
  params.set("mode", "browse");
  if (lang) params.set("lang", lang);
  const q = params.toString();
  return `/menu/${encodeURIComponent(tenantSlug)}${q ? `?${q}` : ""}`;
}

export type BrowseMenuPanelProps = {
  tenantSlug: string;
  branchCode?: string;
  /** Controlled language (e.g. from book page). Defaults to URL/session. */
  lang?: BrowseLang;
  /** When true, render as a section under booking success (no fixed page chrome). */
  embedded?: boolean;
  className?: string;
};

export function BrowseMenuPanel({
  tenantSlug,
  branchCode,
  lang: langProp,
  embedded = false,
  className,
}: BrowseMenuPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lang, setLang] = useState<BrowseLang>(() => readBrowseLang(searchParams, langProp));
  const t = useCallback((key: BrowseStringKey) => BROWSE_STRINGS[lang][key], [lang]);

  useEffect(() => {
    if (langProp === "az" || langProp === "en" || langProp === "ru") {
      setLang(langProp);
    }
  }, [langProp]);

  const setLanguage = (next: BrowseLang) => {
    setLang(next);
    try {
      sessionStorage.setItem(BROWSE_LANG_KEY, next);
    } catch {
      /* ignore */
    }
    if (!embedded) {
      const params = new URLSearchParams(searchParams);
      params.set("lang", next);
      setSearchParams(params, { replace: true });
    }
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<RestaurantInfo>({
    name: "Menu",
    tagline: null,
    address: null,
    phone: null,
  });
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCat, setActiveCat] = useState("");

  useEffect(() => {
    if (!tenantSlug) {
      setError("MISSING_LINK");
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (await fetchPublicDiningMenu(tenantSlug, {
          branch: branchCode,
        })) as {
          restaurant?: Partial<RestaurantInfo> | null;
          categories?: MenuCategory[];
          tenant?: { name?: string };
        };
        if (cancelled) return;
        setInfo({
          name: data.restaurant?.name || data.tenant?.name || "Menu",
          tagline: data.restaurant?.tagline ?? null,
          address: data.restaurant?.address ?? null,
          phone: data.restaurant?.phone ?? null,
        });
        const cats = data.categories ?? [];
        setCategories(cats);
        setActiveCat(cats[0]?.id ?? "");
      } catch (err) {
        if (!cancelled) setError(errMsg(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, branchCode]);

  const menuEmpty = categories.length === 0 || categories.every((c) => c.items.length === 0);
  const HEADER_H = embedded ? 0 : 88;

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${embedded ? "py-10" : "min-h-screen bg-gray-50"} ${className ?? ""}`}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }

  if (error || !tenantSlug) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 p-6 text-center ${
          embedded ? "py-8" : "min-h-screen bg-gray-50"
        } ${className ?? ""}`}
      >
        {!embedded && (
          <div className="absolute top-3 right-3" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
            <LangSwitcher lang={lang} onChange={setLanguage} />
          </div>
        )}
        <UtensilsCrossed className="w-8 h-8 text-gray-300" />
        <p className="text-sm font-semibold text-gray-900">{t("menuUnavailable")}</p>
        <p className="text-xs text-gray-500">
          {error === "MISSING_LINK" ? t("missingLink") : error || t("notPublishedYet")}
        </p>
      </div>
    );
  }

  const categoryNav = !menuEmpty ? (
    <div className="flex gap-2 overflow-x-auto px-1" style={{ scrollbarWidth: "none" }}>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => {
            setActiveCat(cat.id);
            const el = document.getElementById(`browse-${cat.id}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          style={{ touchAction: "manipulation", minHeight: "30px", flexShrink: 0 }}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            activeCat === cat.id
              ? "bg-[#14b8a6] border-[#14b8a6] text-white"
              : "bg-white border-gray-200 text-gray-600"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  ) : null;

  const emptyBlock = (
    <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center space-y-2">
      <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto" />
      <p className="text-sm font-semibold text-gray-800">{t("menuNotPublished")}</p>
      <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
        {t("menuNotPublishedHint")}
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
  );

  const grid = (
    <div className="space-y-6">
      {categories.map((cat, catIdx) => {
        const available = cat.items.filter((i) => i.available).length;
        return (
          <div
            key={cat.id}
            id={`browse-${cat.id}`}
            style={{
              scrollMarginTop: embedded
                ? "12px"
                : `calc(${HEADER_H + 12}px + env(safe-area-inset-top, 0px))`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                <p className="text-[11px] text-gray-400">
                  {available} {t("available")}
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-400">{cat.items.length}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {cat.items.map((item) => (
                <div
                  key={item.productId}
                  className={`bg-white rounded-xl border overflow-hidden flex flex-col ${
                    !item.available
                      ? "opacity-50 border-gray-100"
                      : "border-gray-100 shadow-sm"
                  }`}
                >
                  <div
                    className={`aspect-square w-full bg-gradient-to-br ${
                      CAT_COLORS[catIdx % CAT_COLORS.length]
                    } flex items-center justify-center overflow-hidden`}
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl opacity-40">🍽</span>
                    )}
                  </div>
                  <div className="p-2 flex-1 flex flex-col gap-0.5">
                    <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-[10px] text-gray-400 leading-snug line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    {!item.available && (
                      <span className="inline-block self-start text-[9px] font-semibold text-red-400 bg-red-50 px-1 py-0.5 rounded">
                        {t("unavailable")}
                      </span>
                    )}
                    <p className="text-xs font-bold text-[#0f766e] mt-auto pt-0.5">
                      {item.price.toFixed(2)} ₼
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (embedded) {
    const fullHref = browseMenuHref(tenantSlug, branchCode, lang);
    return (
      <div className={`w-full text-left ${className ?? ""}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">{t("menu")}</p>
            <p className="text-[11px] text-gray-400">{t("browseMenu")}</p>
          </div>
          <Link
            to={fullHref}
            style={{ touchAction: "manipulation", minHeight: "36px" }}
            className="text-xs font-semibold text-[#0f766e] hover:underline flex-shrink-0"
          >
            {t("viewFullMenu")}
          </Link>
        </div>
        {categoryNav && <div className="mb-4">{categoryNav}</div>}
        {menuEmpty ? emptyBlock : grid}
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 ${className ?? ""}`} style={{ minHeight: "100dvh" }}>
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
              <p className="text-[11px] text-gray-400 leading-none mt-0.5">{t("browseMenu")}</p>
            </div>
          </div>
          <LangSwitcher lang={lang} onChange={setLanguage} />
        </div>
        {!menuEmpty && <div className="px-3 pb-2.5">{categoryNav}</div>}
      </div>

      <div
        className="px-3 pb-8"
        style={{
          paddingTop: `calc(${HEADER_H}px + env(safe-area-inset-top, 0px))`,
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {(info.address || info.phone || info.tagline) && (
          <div className="mt-3 mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 space-y-2 shadow-sm">
            {info.tagline && <p className="text-xs text-gray-500">{info.tagline}</p>}
            {info.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(info.address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <MapPin className="w-4 h-4 text-[#14b8a6] mt-0.5 flex-shrink-0" />
                <span className="leading-snug">{info.address}</span>
              </a>
            )}
            {info.phone && (
              <a href={`tel:${info.phone}`} className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-[#14b8a6] flex-shrink-0" />
                {info.phone}
              </a>
            )}
          </div>
        )}
        {menuEmpty ? emptyBlock : grid}
      </div>
    </div>
  );
}

export default BrowseMenuPanel;
