import { useCallback, useEffect, useState } from "react";
import { fetchProducts } from "../api/inventory";
import { useAuth } from "../context/AuthContext";

export interface StockProductOption {
  id: string;
  name: string;
  sku: string;
  image: string;
}

export function useStockProductSearch(search: string, enabled = true) {
  const { isDemo, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<StockProductOption[]>([]);
  const [loading, setLoading] = useState(false);

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
      setProducts(
        data.items.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          image: p.image,
        })),
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isDemo, isAuthenticated, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return { products, loading };
}
