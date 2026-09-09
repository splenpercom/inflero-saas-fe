import type { TenantModuleKey } from "../api/auth";
import {
  Car,
  CalendarDays,
  ShoppingCart,
  Package,
  Building2,
  Globe,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** Mirrors hub MODULE_KEYS — tenant Plugins page catalog. */
export const TENANT_PLUGIN_KEYS = [
  "AUTO",
  "RESERVATIONS",
  "POS",
  "STOCK",
  "BRANCH_MANAGEMENT",
  "WEB_EDITOR",
  "DINING",
] as const satisfies readonly TenantModuleKey[];

export type TenantPluginKey = (typeof TENANT_PLUGIN_KEYS)[number];

export type PluginCategory =
  | "Core"
  | "Sales"
  | "Operations"
  | "Productivity";

export const PLUGIN_CATEGORIES: PluginCategory[] = [
  "Core",
  "Sales",
  "Operations",
  "Productivity",
];

export type PluginCatalogEntry = {
  key: TenantPluginKey;
  /** Tenant-facing name (Branches instead of hub "superadmin/branches"). */
  name: string;
  nameAz: string;
  version: string;
  category: PluginCategory;
  description: string;
  descriptionAz: string;
  icon: LucideIcon;
  /** Tailwind classes for icon tile. */
  iconTone: string;
  /** Feature plugins are store-scoped when Branch Management is on. */
  storeScoped: boolean;
};

export const TENANT_PLUGINS_CATALOG: PluginCatalogEntry[] = [
  {
    key: "AUTO",
    name: "Auto",
    nameAz: "Auto",
    version: "v1.0.0",
    category: "Core",
    description: "Core Inflero automation toolkit for your company workspace.",
    descriptionAz: "Şirkət iş sahəniz üçün əsas Inflero avtomatlaşdırma alətləri.",
    icon: Car,
    iconTone: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    storeScoped: true,
  },
  {
    key: "BRANCH_MANAGEMENT",
    name: "Branches",
    nameAz: "Filiallar",
    version: "v1.0.0",
    category: "Core",
    description: "Multi-branch management, branch switcher, and per-location scoping.",
    descriptionAz: "Çoxfiliallı idarəetmə, filial dəyişdirici və məkan üzrə filtr.",
    icon: Building2,
    iconTone: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    storeScoped: false,
  },
  {
    key: "POS",
    name: "POS",
    nameAz: "POS",
    version: "v1.0.0",
    category: "Sales",
    description: "Point of sale checkout, orders, and payments for entitled branches.",
    descriptionAz: "İcazəli filiallar üçün satış nöqtəsi, sifarişlər və ödənişlər.",
    icon: ShoppingCart,
    iconTone: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    storeScoped: true,
  },
  {
    key: "RESERVATIONS",
    name: "Bookings",
    nameAz: "Rezervasiyalar",
    version: "v1.0.0",
    category: "Sales",
    description: "Online and in-store booking calendar, services, and reservation flow.",
    descriptionAz: "Onlayn və mağaza rezervasiya təqvimi, xidmətlər və rezervasiya axını.",
    icon: CalendarDays,
    iconTone: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    storeScoped: true,
  },
  {
    key: "DINING",
    name: "Dining",
    nameAz: "Restoran",
    version: "v1.0.0",
    category: "Sales",
    description: "Restaurant floor plans, tables, KOT, and dining service tools (requires POS).",
    descriptionAz: "Restoran zalı, masalar, KOT və yemək xidməti alətləri (POS tələb olunur).",
    icon: UtensilsCrossed,
    iconTone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    storeScoped: true,
  },
  {
    key: "STOCK",
    name: "Stock",
    nameAz: "Stok",
    version: "v1.0.0",
    category: "Operations",
    description: "Inventory stock levels, adjustments, and transfers for entitled branches.",
    descriptionAz: "İcazəli filiallar üçün stok səviyyələri, düzəlişlər və transferlər.",
    icon: Package,
    iconTone: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    storeScoped: true,
  },
  {
    key: "WEB_EDITOR",
    name: "Web Editor",
    nameAz: "Veb redaktor",
    version: "v1.0.0",
    category: "Productivity",
    description: "Build and publish your public storefront and website content.",
    descriptionAz: "İctimai vitrin və vebsayt məzmununu yaradın və dərc edin.",
    icon: Globe,
    iconTone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    storeScoped: true,
  },
];
