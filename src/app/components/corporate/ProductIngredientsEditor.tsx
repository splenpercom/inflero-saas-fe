import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { useStockProductSearch } from "../../hooks/useStockProductSearch";
import {
  PRODUCT_NUMERIC_MAX_DP,
  roundToMaxDp,
  sanitizeNumericTypingMaxDp,
} from "../../lib/numericInput";

export type ProductIngredientDraft = {
  ingredientProductId: string;
  name: string;
  sku: string;
  quantity: string;
  /** Available stock at the current branch when picked (display only). */
  stockQty?: number | null;
};

type Props = {
  enabled: boolean;
  hasIngredients: boolean;
  onHasIngredientsChange: (value: boolean) => void;
  rows: ProductIngredientDraft[];
  onRowsChange: (rows: ProductIngredientDraft[]) => void;
  /** Exclude the product being edited from the picker. */
  excludeProductId?: string | null;
  /** Branch store — used to show ingredient stock while picking. */
  storeId?: string | null;
};

function formatStockQty(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const rounded = roundToMaxDp(n, 3);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function ProductIngredientsEditor({
  enabled,
  hasIngredients,
  onHasIngredientsChange,
  rows,
  onRowsChange,
  excludeProductId,
  storeId,
}: Props) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const { products, loading } = useStockProductSearch(search, enabled && hasIngredients, {
    storeId,
  });

  const selectedIds = useMemo(
    () => new Set(rows.map((r) => r.ingredientProductId)),
    [rows],
  );

  const options = products.filter(
    (p) =>
      p.id !== excludeProductId &&
      !selectedIds.has(p.id),
  );

  if (!enabled) return null;

  const addIngredient = (product: {
    id: string;
    name: string;
    sku: string;
    quantity: number | null;
  }) => {
    onRowsChange([
      ...rows,
      {
        ingredientProductId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: "1",
        stockQty: product.quantity,
      },
    ]);
    setSearch("");
    setShowList(false);
  };

  return (
    <div className="col-span-2 md:col-span-3 xl:col-span-4 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
      <div className="flex items-center gap-2">
        <input
          id="product-has-ingredients"
          type="checkbox"
          checked={hasIngredients}
          onChange={(e) => {
            const on = e.target.checked;
            onHasIngredientsChange(on);
            if (!on) onRowsChange([]);
          }}
          className="h-3.5 w-3.5 rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
        />
        <label
          htmlFor="product-has-ingredients"
          className="text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          {tr("İnqredientləri var", "Has ingredients")}
        </label>
      </div>

      {hasIngredients && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {tr(
              "Satışda bu məhsulun öz ehtiyatı əvəzinə seçilmiş inqredient ehtiyatları azalacaq. Məhsul ehtiyatı ixtiyaridir.",
              "On sale, ingredient stock is deducted instead of this product's own stock. Product stock is optional.",
            )}
          </p>
          {!storeId && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              {tr(
                "Stok göstərmək üçün filial seçin.",
                "Select a branch to see ingredient stock.",
              )}
            </p>
          )}

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowList(true);
                }}
                onFocus={() => setShowList(true)}
                placeholder={tr("İnqredient məhsulu axtar...", "Search ingredient product...")}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            {showList && (
              <div className="absolute z-20 mt-1 w-full max-h-40 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                {loading ? (
                  <p className="px-3 py-2 text-[11px] text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
                ) : options.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-gray-500">
                    {tr("Məhsul tapılmadı", "No products found")}
                  </p>
                ) : (
                  options.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addIngredient(p)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Plus className="w-3 h-3 text-[#14b8a6] shrink-0" />
                        <span className="truncate">
                          {p.name}{" "}
                          <span className="text-gray-400">({p.sku})</span>
                        </span>
                      </span>
                      <span
                        className={`shrink-0 tabular-nums ${
                          (p.quantity ?? 0) <= 0
                            ? "text-red-600"
                            : "text-teal-700 dark:text-teal-300"
                        }`}
                      >
                        {tr("Stok", "Stock")}: {formatStockQty(p.quantity)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              {tr("Ən azı bir inqredient əlavə edin", "Add at least one ingredient")}
            </p>
          ) : (
            <div className="space-y-1.5">
              {rows.map((row, index) => (
                <div
                  key={row.ingredientProductId}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {row.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {row.sku}
                      {row.stockQty != null && (
                        <span
                          className={`ml-1.5 tabular-nums ${
                            row.stockQty <= 0
                              ? "text-red-600"
                              : "text-teal-700 dark:text-teal-300"
                          }`}
                        >
                          · {tr("Stok", "Stock")}: {formatStockQty(row.stockQty)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 w-20">
                    <label
                      htmlFor={`ingredient-qty-${row.ingredientProductId}`}
                      className="block text-[9px] leading-tight text-gray-500 dark:text-gray-400 mb-0.5"
                      title={tr(
                        "1 satış üçün istifadə olunan miqdar",
                        "Quantity used per 1 sale of this product",
                      )}
                    >
                      {tr("Miqdar", "Qty")}
                    </label>
                    <input
                      id={`ingredient-qty-${row.ingredientProductId}`}
                      type="text"
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(e) => {
                        const next = [...rows];
                        next[index] = {
                          ...row,
                          quantity: sanitizeNumericTypingMaxDp(
                            e.target.value,
                            PRODUCT_NUMERIC_MAX_DP,
                          ),
                        };
                        onRowsChange(next);
                      }}
                      placeholder={tr("Miqdar", "Qty")}
                      title={tr(
                        "1 satış üçün istifadə olunan miqdar",
                        "Quantity used per 1 sale of this product",
                      )}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      aria-label={tr("Miqdar", "Quantity")}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onRowsChange(rows.filter((r) => r.ingredientProductId !== row.ingredientProductId))
                    }
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    aria-label={tr("Sil", "Remove")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
