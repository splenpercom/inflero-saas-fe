import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../ui/utils";
import { useLanguage } from "../../i18n/LanguageContext";
import { mapLang, pickLang } from "../../i18n/pickLang";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { fetchProduct, type ProductDetail } from "../../api/inventory";
import { notifyFromError } from "../../lib/toast";

const LIST_PATH = "/dashboard/inventory/products";

function productImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.map((img) => (typeof img === "string" ? img : (img as { url: string }).url));
}

function formatDiscountType(
  value: string | null | undefined,
  language: "en" | "az" | "ru",
): string {
  if (value === "PERCENTAGE") return pickLang(language, "Faiz", "Percentage");
  if (value === "FIXED") return pickLang(language, "Sabit", "Fixed");
  return value ?? "—";
}

function formatStatus(value: string | undefined, language: "en" | "az" | "ru"): string {
  if (value === "active") return pickLang(language, "Aktiv", "Active");
  if (value === "inactive") return pickLang(language, "Qeyri-aktiv", "Inactive");
  return value ?? "—";
}

export function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const { canView } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const { language } = useLanguage();

  const pt = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      back: { en: "Back", az: "Geri" },
      backToProducts: { en: "Back to Products", az: "Məhsullara Geri" },
      title: { en: "Product Details", az: "Məhsul Təfərrüatları" },
      subtitle: { en: "Full details of a product", az: "Məhsulun tam təfərrüatları" },
      product: { en: "Product", az: "Məhsul" },
      category: { en: "Category", az: "Kateqoriya" },
      subCategory: { en: "Sub Category", az: "Alt Kateqoriya" },
      brand: { en: "Brand", az: "Brend" },
      unit: { en: "Unit", az: "Vahid" },
      sku: { en: "SKU", az: "SKU" },
      minimumQty: { en: "Minimum Qty", az: "Minimum Miqdar" },
      quantity: { en: "Quantity", az: "Miqdar" },
      tax: { en: "Tax", az: "Vergi" },
      discountType: { en: "Discount Type", az: "Endirim Növü" },
      price: { en: "Price", az: "Qiymət" },
      status: { en: "Status", az: "Status" },
      description: { en: "Description", az: "Təsvir" },
      active: { en: "Active", az: "Aktiv" },
      printBarcode: { en: "Print Barcode", az: "Barkod Çap Et" },
      loading: { en: "Loading product...", az: "Məhsul yüklənir..." },
      notFound: { en: "Product not found", az: "Məhsul tapılmadı" },
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
      navigate(LIST_PATH);
    } finally {
      setLoading(false);
    }
  }, [id, isDemo, isAuthenticated, canView, navigate, branchRevision]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const barcode = product?.itemBarcode ?? "";
  const taxDisplay = product?.taxPercent ? `${product.taxPercent} %` : "0.00 %";

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
      printWindow.document.write(`<p style="font-family: monospace; font-size: 16px;">${barcode}</p>`);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
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

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
              {pt("title")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pt("subtitle")}</p>
          </div>
          <button
            onClick={() => navigate(LIST_PATH)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{pt("backToProducts")}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            {barcode && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6 inline-block">
                <div className="flex items-center gap-4">
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{barcode}</p>
                  <button
                    onClick={printBarcode}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title={pt("printBarcode")}
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-0 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              {[
                { label: pt("product"), value: product.name },
                { label: pt("category"), value: product.category || "—" },
                { label: pt("subCategory"), value: product.subCategory || "—" },
                { label: pt("brand"), value: product.brand || "—" },
                { label: pt("unit"), value: product.unit || "—" },
                { label: pt("sku"), value: product.sku },
                ...(stockEnabled ? [{
                  label: pt("minimumQty"),
                  value: product.quantityAlert != null ? product.quantityAlert : "—",
                },
                { label: pt("quantity"), value: product.quantity }] : []),
                { label: pt("tax"), value: taxDisplay },
                { label: pt("discountType"), value: formatDiscountType(product.discountType, language) },
                { label: pt("price"), value: product.price },
                {
                  label: pt("status"),
                  value: formatStatus(product.status, language),
                  isStatus: true,
                  active: isActive,
                },
                {
                  label: pt("description"),
                  value: product.description || "—",
                  fullWidth: true,
                },
              ].map((row, index) => (
                <div
                  key={index}
                  className={cn(
                    "grid border-b border-gray-200 dark:border-gray-800 last:border-b-0",
                    row.fullWidth ? "grid-cols-1" : "grid-cols-2",
                  )}
                >
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-[#0026f6] dark:text-[#0026f6] border-r border-gray-200 dark:border-gray-800">
                    {row.label}
                  </div>
                  <div
                    className={cn(
                      "px-4 py-3 text-xs text-gray-900 dark:text-white",
                      row.fullWidth && "bg-gray-50 dark:bg-gray-800/50",
                    )}
                  >
                    {row.isStatus ? (
                      <span
                        className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
                          row.active
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700",
                        )}
                      >
                        {row.value}
                      </span>
                    ) : (
                      row.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            {displayImages.length > 0 ? (
              <div className="relative">
                <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden aspect-[4/3] mb-4">
                  <img
                    src={displayImages[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />

                  {displayImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs">
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                </div>

                {displayImages.length > 1 && (
                  <div className="flex gap-2 mt-4 justify-center">
                    {displayImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                          currentImageIndex === index
                            ? "border-[#0026f6] dark:border-[#0026f6]"
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
              <div className="flex items-center justify-center aspect-[4/3] bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-400">
                {pickLang(language, "Şəkil yoxdur", "No images")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
