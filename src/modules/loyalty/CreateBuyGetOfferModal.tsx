import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLanguage } from "../../app/i18n/LanguageContext";
import { pickLang } from "../../app/i18n/pickLang";
import { ModernSelect } from "../../app/components/ui/ModernSelect";
import { ModernMultiSelect } from "../../app/components/ui/ModernMultiSelect";

type CatalogOption = { id: string; name: string; sku?: string | null };
type CustomerOption = { id: string; name: string; code: string };

export type BuyGetOfferFormData = {
  name: string;
  buyMetric: "QUANTITY" | "MONEY";
  buyThreshold: number;
  getQty: number;
  buyTargetType: "PRODUCT" | "CATEGORY";
  getTargetType: "PRODUCT" | "CATEGORY";
  buyProductId: string | null;
  buyCategoryId: string | null;
  getProductId: string | null;
  getCategoryId: string | null;
  progressMode: "SAME_VISIT" | "ACCUMULATE";
  audience: "ALL" | "SELECTED";
  customerIds: string[];
};

type Props = {
  isOpen: boolean;
  saving?: boolean;
  products: CatalogOption[];
  categories: CatalogOption[];
  customers: CustomerOption[];
  onClose: () => void;
  onSave: (data: BuyGetOfferFormData) => void | Promise<void>;
};

export function CreateBuyGetOfferModal({
  isOpen,
  saving = false,
  products,
  categories,
  customers,
  onClose,
  onSave,
}: Props) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [offerName, setOfferName] = useState("");
  const [buyMetric, setBuyMetric] = useState<"QUANTITY" | "MONEY">("QUANTITY");
  const [buyThreshold, setBuyThreshold] = useState("5");
  const [getQty, setGetQty] = useState("1");
  const [buyTargetType, setBuyTargetType] = useState<"PRODUCT" | "CATEGORY">("PRODUCT");
  const [getTargetType, setGetTargetType] = useState<"PRODUCT" | "CATEGORY">("PRODUCT");
  const [buyProductId, setBuyProductId] = useState("");
  const [buyCategoryId, setBuyCategoryId] = useState("");
  const [getProductId, setGetProductId] = useState("");
  const [getCategoryId, setGetCategoryId] = useState("");
  const [progressMode, setProgressMode] = useState<"SAME_VISIT" | "ACCUMULATE">("SAME_VISIT");
  const [audience, setAudience] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.sku ? `${p.name} (${p.sku})` : p.name,
      })),
    [products],
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
    [customers],
  );

  useEffect(() => {
    if (!isOpen) {
      setOfferName("");
      setBuyMetric("QUANTITY");
      setBuyThreshold("5");
      setGetQty("1");
      setBuyTargetType("PRODUCT");
      setGetTargetType("PRODUCT");
      setBuyProductId("");
      setBuyCategoryId("");
      setGetProductId("");
      setGetCategoryId("");
      setProgressMode("SAME_VISIT");
      setAudience("ALL");
      setSelectedCustomerIds([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const bt = Number(buyThreshold);
    const gq = Number(getQty);
    if (!offerName.trim() || !Number.isFinite(bt) || bt <= 0 || !Number.isFinite(gq) || gq <= 0) {
      setError(tr("Ad və müsbət X dəyərləri daxil edin", "Enter a name and positive X values"));
      return;
    }
    if (buyTargetType === "PRODUCT" && !buyProductId) {
      setError(tr("Alınan məhsulu seçin", "Select buy product"));
      return;
    }
    if (buyTargetType === "CATEGORY" && !buyCategoryId) {
      setError(tr("Alınan kateqoriyanı seçin", "Select buy category"));
      return;
    }
    if (getTargetType === "PRODUCT" && !getProductId) {
      setError(tr("Pulsuz məhsulu seçin", "Select free product"));
      return;
    }
    if (getTargetType === "CATEGORY" && !getCategoryId) {
      setError(tr("Pulsuz kateqoriyanı seçin", "Select free category"));
      return;
    }
    if (audience === "SELECTED" && selectedCustomerIds.length === 0) {
      setError(tr("Müştəri seçin", "Select customers"));
      return;
    }
    setError(null);
    await onSave({
      name: offerName.trim(),
      buyMetric,
      buyThreshold: bt,
      getQty: gq,
      buyTargetType,
      getTargetType,
      buyProductId: buyTargetType === "PRODUCT" ? buyProductId : null,
      buyCategoryId: buyTargetType === "CATEGORY" ? buyCategoryId : null,
      getProductId: getTargetType === "PRODUCT" ? getProductId : null,
      getCategoryId: getTargetType === "CATEGORY" ? getCategoryId : null,
      progressMode,
      audience,
      customerIds: audience === "SELECTED" ? selectedCustomerIds : [],
    });
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
  const labelClass = "block text-xs text-gray-500 dark:text-gray-400";
  const selectBtn =
    "mt-1 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700";

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Yeni təklif", "New offer")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <label className={labelClass}>
            {tr("Ad", "Name")}
            <input
              value={offerName}
              onChange={(e) => setOfferName(e.target.value)}
              className={fieldClass}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={labelClass}>{tr("Alış metri", "Buy metric")}</p>
              <ModernSelect
                value={buyMetric}
                onChange={(v) => setBuyMetric(v as "QUANTITY" | "MONEY")}
                options={[
                  { value: "QUANTITY", label: tr("Miqdar", "Quantity") },
                  { value: "MONEY", label: tr("Məbləğ", "Money") },
                ]}
                buttonClassName={selectBtn}
                disabled={saving}
              />
              <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                {buyMetric === "MONEY"
                  ? tr(
                      "Alış hədəfinə xərclənən məbləğ sayılır. Eyni Al X və Pulsuz X sahələri istifadə olunur.",
                      "Counts spend on the buy target. Uses the same Buy X and Free X fields.",
                    )
                  : tr(
                      "Alış hədəfindən alınan ədəd sayılır. Eyni Al X və Pulsuz X sahələri istifadə olunur.",
                      "Counts units bought of the buy target. Uses the same Buy X and Free X fields.",
                    )}
              </p>
            </div>
            <div>
              <p className={labelClass}>{tr("Progress", "Progress")}</p>
              <ModernSelect
                value={progressMode}
                onChange={(v) => setProgressMode(v as "SAME_VISIT" | "ACCUMULATE")}
                options={[
                  { value: "SAME_VISIT", label: tr("Eyni satış", "Same visit") },
                  { value: "ACCUMULATE", label: tr("Yığılma", "Accumulate") },
                ]}
                buttonClassName={selectBtn}
                disabled={saving}
              />
              <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                {progressMode === "ACCUMULATE"
                  ? tr(
                      "Yığılma: müştəri alışları bir neçə ziyarətdə toplanır; həddə çatanda pulsuz məhsul verilir.",
                      "Accumulate: purchases build across visits until the threshold is met, then free items unlock.",
                    )
                  : tr(
                      "Eyni satış: pulsuz məhsul yalnız bu sifarişdə Al X tamamlananda verilir; progress saxlanmır.",
                      "Same visit: free items unlock only when Buy X is completed in this order; progress is not kept.",
                    )}
              </p>
            </div>
            <label className={labelClass}>
              {buyMetric === "MONEY"
                ? tr("Al X (₼)", "Buy X (₼)")
                : tr("Al X (ədəd)", "Buy X (qty)")}
              <input
                value={buyThreshold}
                onChange={(e) => setBuyThreshold(e.target.value)}
                type="number"
                min={0.001}
                step="any"
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              {tr("Götür X pulsuz (ədəd)", "Get X free (qty)")}
              <input
                value={getQty}
                onChange={(e) => setGetQty(e.target.value)}
                type="number"
                min={0.001}
                step="any"
                className={fieldClass}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={labelClass}>{tr("Alış hədəfi", "Buy target")}</p>
              <ModernSelect
                value={buyTargetType}
                onChange={(v) => setBuyTargetType(v as "PRODUCT" | "CATEGORY")}
                options={[
                  { value: "PRODUCT", label: tr("Məhsul", "Product") },
                  { value: "CATEGORY", label: tr("Kateqoriya", "Category") },
                ]}
                buttonClassName={selectBtn}
                disabled={saving}
              />
            </div>
            {buyTargetType === "PRODUCT" ? (
              <div>
                <p className={labelClass}>{tr("Məhsul", "Product")}</p>
                <ModernSelect
                  value={buyProductId}
                  onChange={setBuyProductId}
                  options={productOptions}
                  placeholder={
                    productOptions.length === 0
                      ? tr("Məhsul yoxdur", "No products")
                      : tr("Seçin", "Select")
                  }
                  searchable
                  searchPlaceholder={tr("Məhsul / SKU axtar...", "Search product / SKU...")}
                  buttonClassName={selectBtn}
                  disabled={saving || productOptions.length === 0}
                />
              </div>
            ) : (
              <div>
                <p className={labelClass}>{tr("Kateqoriya", "Category")}</p>
                <ModernSelect
                  value={buyCategoryId}
                  onChange={setBuyCategoryId}
                  options={categoryOptions}
                  placeholder={
                    categoryOptions.length === 0
                      ? tr("Kateqoriya yoxdur", "No categories")
                      : tr("Seçin", "Select")
                  }
                  searchable
                  searchPlaceholder={tr("Kateqoriya axtar...", "Search category...")}
                  buttonClassName={selectBtn}
                  disabled={saving || categoryOptions.length === 0}
                />
              </div>
            )}
            <div>
              <p className={labelClass}>{tr("Pulsuz hədəf", "Free target")}</p>
              <ModernSelect
                value={getTargetType}
                onChange={(v) => setGetTargetType(v as "PRODUCT" | "CATEGORY")}
                options={[
                  { value: "PRODUCT", label: tr("Məhsul", "Product") },
                  { value: "CATEGORY", label: tr("Kateqoriya", "Category") },
                ]}
                buttonClassName={selectBtn}
                disabled={saving}
              />
            </div>
            {getTargetType === "PRODUCT" ? (
              <div>
                <p className={labelClass}>{tr("Pulsuz məhsul", "Free product")}</p>
                <ModernSelect
                  value={getProductId}
                  onChange={setGetProductId}
                  options={productOptions}
                  placeholder={
                    productOptions.length === 0
                      ? tr("Məhsul yoxdur", "No products")
                      : tr("Seçin", "Select")
                  }
                  searchable
                  searchPlaceholder={tr("Məhsul / SKU axtar...", "Search product / SKU...")}
                  buttonClassName={selectBtn}
                  disabled={saving || productOptions.length === 0}
                />
              </div>
            ) : (
              <div>
                <p className={labelClass}>{tr("Pulsuz kateqoriya", "Free category")}</p>
                <ModernSelect
                  value={getCategoryId}
                  onChange={setGetCategoryId}
                  options={categoryOptions}
                  placeholder={
                    categoryOptions.length === 0
                      ? tr("Kateqoriya yoxdur", "No categories")
                      : tr("Seçin", "Select")
                  }
                  searchable
                  searchPlaceholder={tr("Kateqoriya axtar...", "Search category...")}
                  buttonClassName={selectBtn}
                  disabled={saving || categoryOptions.length === 0}
                />
              </div>
            )}
          </div>

          <div>
            <p className={labelClass}>{tr("Auditorium", "Audience")}</p>
            <ModernSelect
              value={audience}
              onChange={(v) => setAudience(v as "ALL" | "SELECTED")}
              options={[
                { value: "ALL", label: tr("Bütün müştərilər", "All customers") },
                { value: "SELECTED", label: tr("Seçilmiş müştərilər", "Selected customers") },
              ]}
              buttonClassName={selectBtn}
              disabled={saving}
            />
          </div>

          {audience === "SELECTED" && (
            <div>
              <p className={labelClass}>{tr("Müştərilər", "Customers")}</p>
              <ModernMultiSelect
                values={selectedCustomerIds}
                onChange={setSelectedCustomerIds}
                options={customerOptions}
                placeholder={
                  customerOptions.length === 0
                    ? tr("Müştəri yoxdur", "No customers")
                    : tr("Müştəri seçin", "Select customers")
                }
                searchable
                searchPlaceholder={tr("Müştəri axtar...", "Search customers...")}
                buttonClassName={selectBtn}
                disabled={saving || customerOptions.length === 0}
              />
            </div>
          )}

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-lg bg-[#14b8a6] px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            {saving ? tr("Saxlanılır...", "Saving...") : tr("Yarat", "Create")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
