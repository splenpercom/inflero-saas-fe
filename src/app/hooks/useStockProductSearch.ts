import { useCallback, useEffect, useState } from "react";
import { fetchProducts } from "../api/inventory";
import { fetchStockLevels } from "../api/stock";
import { useAuth } from "../context/AuthContext";

export interface StockProductOption {
  id: string;
  name: string;
  sku: string;
  image: string;
  category: string;
  subCategory: string;
  /** Selling price (fallback when purchase cost is unset). */
  price: string;
  /** Preferred cost for purchase lines. */
  purchasePrice: string | null;
  /** Available qty at the scoped / requested store (null when unknown). */
  quantity: number | null;
}

export function useStockProductSearch(
  search: string,
  enabled = true,
  opts?: { storeId?: string | null },
) {
  const { isDemo, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<StockProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const storeId = opts?.storeId?.trim() || null;

  const load = useCallback(async () => {
    if (!enabled || !(isAuthenticated || isDemo)) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchProducts({
        page: 1,
        pageSize: 20,
        search: search.trim() || undefined,
      });

      // Optional enrichment for transfer "From" branch only. Failures must not
      // break product search used by sales / adjustments (no storeId).
      let qtyByProductId: Map<string, number> | null = null;
      if (storeId) {
        try {
          const levels = await fetchStockLevels({
            page: 1,
            pageSize: 50,
            storeId,
            search: search.trim() || undefined,
          });
          qtyByProductId = new Map(
            levels.items.map((row) => [row.productId, Number(row.qty) || 0]),
          );
        } catch {
          qtyByProductId = null;
        }
      }

      setProducts(
        data.items.map((p) => {
          const listQty =
            p.quantity != null && Number.isFinite(Number(p.quantity))
              ? Number(p.quantity)
              : null;
          const fromLevels = qtyByProductId?.get(p.id);
          const quantity =
            fromLevels != null ? fromLevels : storeId && qtyByProductId ? 0 : listQty;
          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            image: p.image,
            category: p.category?.trim() || "",
            subCategory: (p.subCategory ?? "").trim(),
            price: p.price ?? "0",
            purchasePrice: p.purchasePrice,
            quantity,
          };
        }),
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isDemo, isAuthenticated, search, storeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return { products, loading };
}
