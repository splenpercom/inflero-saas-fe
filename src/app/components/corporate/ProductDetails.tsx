import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  ArrowLeft,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  Package,
  Tag,
  Image as ImageIcon,
  AlignLeft,
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { cn } from "../ui/utils";
import { useLanguage } from "../../i18n/LanguageContext";
import { mapLang, pickLang } from "../../i18n/pickLang";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { fetchProduct, type ProductDetail } from "../../api/inventory";
import { notifyFromError } from "../../lib/toast";
import { formatDate } from "../../lib/dateFormat";
import {
  resolveProductsListReturn,
  rememberProductsListReturn,
  PRODUCTS_LIST_PATH,
} from "../../lib/productsNavigation";

const LIST_PATH = PRODUCTS_LIST_PATH;

function productImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.map((img) => (typeof img === "string" ? img : (img as { url: string }).url));
}

function formatDiscountType(
  value: string | null | undefined,
  language: "en" | "az" | "ru",
): string {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "PERCENTAGE") return pickLang(language, "Faiz", "Percentage");
  if (normalized === "FIXED") return pickLang(language, "Sabit", "Fixed");
  return "—";
}

function formatDiscountValue(
  type: string | null | undefined,
  value: string | null | undefined,
): string {
  if (value == null || value === "") return "—";
  const normalized = (type ?? "").toUpperCase();
  if (normalized === "PERCENTAGE") return `${value} %`;
  if (normalized === "FIXED") return `${value} ₼`;
  return String(value);
}

function formatStatus(value: string | undefined, language: "en" | "az" | "ru"): string {
  if (value === "active") return pickLang(language, "Aktiv", "Active");
  if (value === "inactive") return pickLang(language, "Qeyri-aktiv", "Inactive");
  return value ?? "—";
}

function formatProductType(value: string | undefined, language: "en" | "az" | "ru"): string {
  if (value === "SERVICE") return pickLang(language, "Xidmət", "Service");
  if (value === "VARIABLE") return pickLang(language, "Variant", "Variant");
  if (value === "SINGLE") return pickLang(language, "Məhsul", "Product");
  return value ?? "—";
}

function dash(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <span
        className={cn(
          "text-sm text-gray-900 dark:text-white break-words",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 bg-gray-50/80 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors",
          open && "border-b border-gray-200 dark:border-gray-800",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#ccfbf1] dark:bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6]">
            {icon}
          </div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h2>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export function ProductDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const { canView, canEdit } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [productInfoOpen, setProductInfoOpen] = useState(true);
  const [pricingStocksOpen, setPricingStocksOpen] = useState(true);
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [imagesOpen, setImagesOpen] = useState(true);
  const { language } = useLanguage();
  const barcodeRef = useRef<SVGSVGElement>(null);
  const returnTo = resolveProductsListReturn(
    (location.state as { returnTo?: string } | null)?.returnTo,
  );

  const goBackToList = () => navigate(returnTo);

  const pt = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      backToProducts: { en: "Back to Products", az: "Məhsullara Geri" },
      title: { en: "Product Details", az: "Məhsul Təfərrüatları" },
      subtitle: { en: "Full details of a product", az: "Məhsulun tam təfərrüatları" },
      productInformation: { en: "Product/Service Information", az: "Məhsul/Xidmət Məlumatı" },
      pricingStocks: { en: "Pricing & Stocks", az: "Qiymət və Ehtiyatlar" },
      images: { en: "Images", az: "Şəkillər" },
      productName: { en: "Product/Service Name", az: "Məhsul/Xidmət Adı" },
      productType: { en: "Type", az: "Növ" },
      category: { en: "Category", az: "Kateqoriya" },
      subCategory: { en: "Sub Category", az: "Alt Kateqoriya" },
      brand: { en: "Brand", az: "Brend" },
      unit: { en: "Unit", az: "Vahid" },
      sku: { en: "SKU", az: "SKU" },
      itemBarcode: { en: "Item Barcode", az: "Məhsul/Xidmət Barkodu" },
      quantity: { en: "Quantity", az: "Miqdar" },
      quantityAlert: { en: "Quantity Alert", az: "Miqdar Xəbərdarlığı" },
      discountType: { en: "Discount Type", az: "Endirim Növü" },
      discountValue: { en: "Discount Value", az: "Endirim Dəyəri" },
      price: { en: "Price", az: "Qiymət" },
      status: { en: "Status", az: "Status" },
      description: { en: "Description", az: "Təsvir" },
      manufacturedDate: { en: "Manufactured Date", az: "İstehsal Tarixi" },
      expiryDate: { en: "Expiry On", az: "Son İstifadə Tarixi" },
      printBarcode: { en: "Print Barcode", az: "Barkod Çap Et" },
      edit: { en: "Edit", az: "Redaktə" },
      loading: { en: "Loading product...", az: "Məhsul yüklənir..." },
      notFound: { en: "Product not found", az: "Məhsul tapılmadı" },
      noImages: { en: "No images", az: "Şəkil yoxdur" },
      noDescription: { en: "No description", az: "Təsvir yoxdur" },
    };
    return mapLang(language, translations[key], key);
  };

  const loadProduct = useCallback(async () => {
    if (!id || !(isAuthenticated || isDemo) || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchProduct(id);
      setProduct(data);
      setImages(productImageUrls(data.images));
      setCurrentImageIndex(0);
    } catch (err) {
      notifyFromError(err, pickLang(language, "Məhsulu yükləmək alınmadı", "Failed to load product"));
      navigate(returnTo);
    } finally {
      setLoading(false);
    }
  }, [id, isDemo, isAuthenticated, canView, navigate, branchRevision, language, returnTo]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const barcode = product?.itemBarcode?.trim() || "";

  useEffect(() => {
    if (!barcode || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, barcode, {
        format: "CODE128",
        width: 1.5,
        height: 48,
        displayValue: true,
        fontSize: 12,
        margin: 4,
      });
    } catch {
      /* invalid barcode content */
    }
  }, [barcode, product?.id]);

  const nextImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const printBarcode = () => {
    if (!barcode) return;
    const printWindow = window.open("", "", "height=400,width=600");
    if (printWindow) {
      printWindow.document.write("<html><head><title>Print Barcode</title>");
      printWindow.document.write(
        "<style>body{font-family: Arial, sans-serif; text-align: center; padding: 40px;}</style>",
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(`<svg id="bc"></svg>`);
      printWindow.document.write(
        `<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>`,
      );
      printWindow.document.write(
        `<script>JsBarcode("#bc", ${JSON.stringify(barcode)}, {format:"CODE128",width:2,height:60,displayValue:true});<\/script>`,
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 400);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">{pt("loading")}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">{pt("notFound")}</p>
      </div>
    );
  }

  const displayImages = images.length > 0 ? images : product.image ? [product.image] : [];
  const isActive = product.status === "active";
  const isService = product.productType === "SERVICE";

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white truncate">
              {product.name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-mono">{product.sku}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{formatProductType(product.productType, language)}</span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  isActive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700",
                )}
              >
                {formatStatus(product.status, language)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  rememberProductsListReturn(returnTo);
                  navigate(`${LIST_PATH}/${product.id}/edit`, { state: { returnTo } });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{pt("edit")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={goBackToList}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{pt("backToProducts")}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 space-y-3">
            <SectionCard
              title={pt("productInformation")}
              icon={<Package className="w-3.5 h-3.5" />}
              open={productInfoOpen}
              onToggle={() => setProductInfoOpen((v) => !v)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <DetailRow label={pt("productName")} value={product.name} />
                <DetailRow
                  label={pt("productType")}
                  value={formatProductType(product.productType, language)}
                />
                <DetailRow label={pt("category")} value={dash(product.category)} />
                <DetailRow label={pt("subCategory")} value={dash(product.subCategory)} />
                <DetailRow label={pt("brand")} value={dash(product.brand)} />
                <DetailRow label={pt("unit")} value={dash(product.unit)} />
                <DetailRow label={pt("sku")} value={product.sku} mono />
                <DetailRow label={pt("itemBarcode")} value={dash(barcode)} mono />
              </div>

              {barcode ? (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3">
                  <div className="bg-white dark:bg-white rounded-lg border border-gray-200 px-3 py-2">
                    <svg ref={barcodeRef} />
                  </div>
                  <button
                    type="button"
                    onClick={printBarcode}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {pt("printBarcode")}
                  </button>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title={pt("pricingStocks")}
              icon={<Tag className="w-3.5 h-3.5" />}
              open={pricingStocksOpen}
              onToggle={() => setPricingStocksOpen((v) => !v)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <DetailRow
                  label={pt("price")}
                  value={
                    <span className="text-base font-semibold text-[#0d9488] dark:text-[#14b8a6]">
                      {product.price} ₼
                    </span>
                  }
                />
                <DetailRow
                  label={pt("status")}
                  value={
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        isActive
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700",
                      )}
                    >
                      {formatStatus(product.status, language)}
                    </span>
                  }
                />
                <DetailRow
                  label={pt("discountType")}
                  value={formatDiscountType(product.discountType, language)}
                />
                <DetailRow
                  label={pt("discountValue")}
                  value={formatDiscountValue(product.discountType, product.discountValue)}
                />
                {stockEnabled && !isService ? (
                  <>
                    <DetailRow label={pt("quantity")} value={dash(product.quantity)} />
                    <DetailRow
                      label={pt("quantityAlert")}
                      value={dash(product.quantityAlert)}
                    />
                  </>
                ) : null}
                {!isService ? (
                  <>
                    <DetailRow
                      label={pt("manufacturedDate")}
                      value={
                        product.manufacturedDate
                          ? formatDate(product.manufacturedDate, language)
                          : "—"
                      }
                    />
                    <DetailRow
                      label={pt("expiryDate")}
                      value={
                        product.expiryDate ? formatDate(product.expiryDate, language) : "—"
                      }
                    />
                  </>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title={pt("description")}
              icon={<AlignLeft className="w-3.5 h-3.5" />}
              open={descriptionOpen}
              onToggle={() => setDescriptionOpen((v) => !v)}
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {product.description?.trim()
                  ? product.description
                  : pt("noDescription")}
              </p>
            </SectionCard>
          </div>

          <div className="xl:col-span-2">
            <SectionCard
              title={pt("images")}
              icon={<ImageIcon className="w-3.5 h-3.5" />}
              open={imagesOpen}
              onToggle={() => setImagesOpen((v) => !v)}
            >
              {displayImages.length > 0 ? (
                <div>
                  <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden aspect-[4/3]">
                    <img
                      src={displayImages[currentImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />

                    {displayImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 dark:bg-gray-900/90 rounded-full shadow flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 dark:bg-gray-900/90 rounded-full shadow flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-0.5 rounded-full text-[10px]">
                          {currentImageIndex + 1} / {displayImages.length}
                        </div>
                      </>
                    )}
                  </div>

                  {displayImages.length > 1 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {displayImages.map((img, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={cn(
                            "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                            currentImageIndex === index
                              ? "border-[#14b8a6]"
                              : "border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100",
                          )}
                        >
                          <img
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center aspect-[4/3] bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-400 gap-2">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  {pt("noImages")}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
