import { createContext, useContext, type ReactNode } from "react";
import type { CategoryRecord, ProductListItem } from "../../../../app/api/inventory";
import type { ProductSource } from "./types";

export type StorefrontCategory = { id: string; name: string };

export type StorefrontProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  category: string;
  badge: string;
  rating: number;
  reviews: number;
  image: string;
};

export type StorefrontCatalog = {
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  loading: boolean;
};

export const EMPTY_CATALOG: StorefrontCatalog = {
  categories: [],
  products: [],
  loading: false,
};

const CatalogContext = createContext<StorefrontCatalog>(EMPTY_CATALOG);

export function CatalogProvider({
  value,
  children,
}: {
  value: StorefrontCatalog;
  children: ReactNode;
}) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): StorefrontCatalog {
  return useContext(CatalogContext);
}

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f3f4f6" width="400" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="18">No image</text></svg>`,
  );

export function mapInventoryProduct(p: ProductListItem): StorefrontProduct {
  const price = Number.parseFloat(p.price);
  return {
    id: p.id,
    name: p.name,
    price: Number.isFinite(price) ? price : 0,
    originalPrice: null,
    category: p.categoryId ?? "",
    badge: "",
    rating: 0,
    reviews: 0,
    image: p.image?.trim() || PLACEHOLDER_IMAGE,
  };
}

export function mapInventoryCategory(c: CategoryRecord): StorefrontCategory {
  return { id: c.id, name: c.name };
}

/** Public API catalog item shape (already storefront-ready). */
export type PublicCatalogProduct = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  categoryId: string | null;
};

export type PublicCatalogCategory = {
  id: string;
  name: string;
};

export function catalogFromPublic(data: {
  categories?: PublicCatalogCategory[];
  products?: PublicCatalogProduct[];
}): StorefrontCatalog {
  return {
    loading: false,
    categories: (data.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
    products: (data.products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number.isFinite(p.price) ? p.price : 0,
      originalPrice: null,
      category: p.categoryId ?? "",
      badge: "",
      rating: 0,
      reviews: 0,
      image: p.image?.trim() || PLACEHOLDER_IMAGE,
    })),
  };
}

export function resolveProducts(
  products: StorefrontProduct[],
  src?: ProductSource,
): StorefrontProduct[] {
  const limit = src?.limit || 4;
  if (!src) return products.slice(0, limit);
  if (src.mode === "category" && src.categoryId) {
    return products.filter((p) => p.category === src.categoryId).slice(0, limit);
  }
  if (src.mode === "specific" && src.productIds.length) {
    const order = new Map(src.productIds.map((id, i) => [id, i]));
    return products
      .filter((p) => order.has(p.id))
      .sort((a, b) => (order.get(a.id)! - order.get(b.id)!))
      .slice(0, limit);
  }
  return products.slice(0, limit);
}
