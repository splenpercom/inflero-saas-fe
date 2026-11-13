import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { useBranch } from "../../context/BranchContext";
import {
  fetchCategories,
  fetchSubCategories,
  fetchBrands,
  fetchUnits,
  fetchProduct,
  createCategory,
  createSubCategory,
  createBrand,
  createUnit,
  updateProduct,
  uploadProductImage,
} from "../../api/inventory";
import { parsePrice } from "../../lib/inventoryMappers";
import { normalizeScaleItemCodeInput } from "../../lib/scaleBarcode/buildLabel";
import { resolveProductsListReturn, PRODUCTS_LIST_PATH } from "../../lib/productsNavigation";
import { formatBarcodePriceLabel, printBarcodeLabel } from "../../lib/posPrint";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import {
  formatProductNumericInput,
  PRODUCT_NUMERIC_MAX_DP,
  roundToMaxDp,
  sanitizeNumericTypingMaxDp,
} from "../../lib/numericInput";
import { ModernSelect } from "../ui/ModernSelect";
import { ModernMultiSelect } from "../ui/ModernMultiSelect";
import { DateInput } from "../ui/DateInput";
import {
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  ListOrdered,
  Type,
  Image as ImageIcon,
  Printer,
  Plus,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import JsBarcode from "jsbarcode";
import { useBarcodeWedge } from "../../hooks/useBarcodeWedge";
import { useProductsCogsEnabled } from "../../hooks/useProductsCogsEnabled";
import { useScaleLabelScanEnabled } from "../../hooks/useScaleLabelScanEnabled";

import { pickLang, mapLang } from "../../i18n/pickLang";
const LIST_PATH = PRODUCTS_LIST_PATH;

interface ProductImage {
  id: string;
  url: string;
  file?: File;
}

type SelectOption = { value: string; label: string };

function mapDiscountToUi(value: string | null | undefined): string {
  if (value === "PERCENTAGE") return "percentage";
  if (value === "FIXED") return "fixed";
  return "";
}

function mapDiscountToApi(value: string): "PERCENTAGE" | "FIXED" | null {
  if (value === "percentage") return "PERCENTAGE";
  if (value === "fixed") return "FIXED";
  return null;
}

function productImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.map((img) => (typeof img === "string" ? img : (img as { url: string }).url));
}

type EditProductSnapshot = {
  productName: string;
  category: string;
  subCategoryIds: string[];
  brand: string;
  unit: string;
  itemBarcode: string;
  scaleSaleMode: "NONE" | "WEIGHT";
  scaleItemCode: string;
  scaleLfCode: string;
  description: string;
  quantity: string;
  price: string;
  cost: string;
  discountType: string;
  discountValue: string;
  quantityAlert: string;
  showOnPos: boolean;
  manufacturedDate: string;
  expiryDate: string;
  imageUrls: string[];
};

function serializeEditSnapshot(s: EditProductSnapshot): string {
  return JSON.stringify({
    ...s,
    subCategoryIds: [...s.subCategoryIds].sort(),
    imageUrls: [...s.imageUrls],
  });
}

export function EditProduct() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const productsCogsEnabled = useProductsCogsEnabled();
  const scaleLabelScanEnabled = useScaleLabelScanEnabled();
  const { canCreate, canEdit } = useModulePermissions("Products");
  const branchRevision = useBranchRevision();
  const { branchId } = useBranch();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const returnTo = resolveProductsListReturn(
    (location.state as { returnTo?: string } | null)?.returnTo,
  );

  const [baseline, setBaseline] = useState<string | null>(null);

  const pt = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      title: { en: "Edit", az: "Redaktə et" },
      subtitle: { en: "Update product information", az: "Məhsul məlumatını yeniləyin" },
      backToProduct: { en: "Back to Products", az: "Məhsullara Geri" },
      productInformation: { en: "Product Information", az: "Məhsul Məlumatı" },
      pricingStocks: { en: "Pricing & Stocks", az: "Qiymət və Ehtiyatlar" },
      images: { en: "Images", az: "Şəkillər" },
      customFields: { en: "Custom Fields", az: "Xüsusi Sahələr" },
      productName: { en: "Product Name", az: "Məhsul Adı" },
      category: { en: "Category", az: "Kateqoriya" },
      subCategory: { en: "Sub Categories", az: "Alt Kateqoriyalar" },
      brand: { en: "Brand", az: "Brend" },
      unit: { en: "Unit", az: "Vahid" },
      itemBarcode: { en: "Item Barcode", az: "Məhsul Barkodu" },
      description: { en: "Description", az: "Təsvir" },
      quantity: { en: "Quantity", az: "Miqdar" },
      price: { en: "Sale Price", az: "Satış qiyməti" },
      cost: { en: "Cost (COGS)", az: "Maya dəyəri (COGS)" },
      discountType: { en: "Discount Type", az: "Endirim Növü" },
      discountValue: { en: "Discount Value", az: "Endirim Dəyəri" },
      quantityAlert: { en: "Quantity Alert", az: "Miqdar Xəbərdarlığı" },
      uploadImages: { en: "Upload Images", az: "Şəkil Yükləyin" },
      manufacturedDate: { en: "Manufactured Date", az: "İstehsal Tarixi" },
      expiryDate: { en: "Expiry On", az: "Son İstifadə Tarixi" },
      cancel: { en: "Cancel", az: "Ləğv et" },
      submit: { en: "Save Changes", az: "Yadda saxla" },
      select: { en: "Select", az: "Seç" },
      productUpdated: { en: "Product updated successfully!", az: "Məhsul uğurla yeniləndi!" },
      generate: { en: "Generate", az: "Yarat" },
      print: { en: "Print", az: "Çap et" },
      datePlaceholder: { en: "dd/mm/yyyy", az: "gün/ay/il" },
    };
    return mapLang(language, translations[key], key);
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productInfoOpen, setProductInfoOpen] = useState(true);
  const [pricingStocksOpen, setPricingStocksOpen] = useState(true);
  const [imagesOpen, setImagesOpen] = useState(true);
  const [customFieldsOpen, setCustomFieldsOpen] = useState(true);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [subCategoryIds, setSubCategoryIds] = useState<string[]>([]);
  const [subCategoryLabelMap, setSubCategoryLabelMap] = useState<Record<string, string>>({});
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [itemBarcode, setItemBarcode] = useState("");
  const [scaleSaleMode, setScaleSaleMode] = useState<"NONE" | "WEIGHT">("NONE");
  const [scaleItemCode, setScaleItemCode] = useState("");
  const [scaleLfCode, setScaleLfCode] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [quantityAlert, setQuantityAlert] = useState("");
  const [showOnPos, setShowOnPos] = useState(true);
  const [manufacturedDate, setManufacturedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);

  const barcodeCanvasRef = useRef<SVGSVGElement>(null);
  const categoryRef = useRef("");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [subCategoryCategoryMap, setSubCategoryCategoryMap] = useState<Record<string, string>>({});

  const currentSnapshot = useMemo<EditProductSnapshot>(
    () => ({
      productName,
      category,
      subCategoryIds,
      brand,
      unit,
      itemBarcode,
      scaleSaleMode,
      scaleItemCode,
      scaleLfCode,
      description,
      quantity,
      price,
      cost,
      discountType,
      discountValue,
      quantityAlert,
      showOnPos,
      manufacturedDate,
      expiryDate,
      imageUrls: images.map((img) => img.url),
    }),
    [
      productName,
      category,
      subCategoryIds,
      brand,
      unit,
      itemBarcode,
      scaleSaleMode,
      scaleItemCode,
      scaleLfCode,
      description,
      quantity,
      price,
      cost,
      discountType,
      discountValue,
      quantityAlert,
      showOnPos,
      manufacturedDate,
      expiryDate,
      images,
    ],
  );

  const isDirty =
    !loading && baseline != null && baseline !== serializeEditSnapshot(currentSnapshot);
  // Guard the whole edit session (not only dirty): Back/Cancel/sidebar must warn.
  const leaveGuardEnabled = !loading && baseline != null;

  const { confirmLeave, allowNextNavigation } = useUnsavedChangesGuard(leaveGuardEnabled, {
    title: tr("Saxlanmamış dəyişikliklər", "Unsaved changes", "Несохранённые изменения"),
    message: isDirty
      ? tr(
          "Redaktə səhifəsindən saxlamadan çıxmaq üzrəsiniz. Dəyişikliklər itə bilər.",
          "You are about to leave the edit page without saving. Your changes may be lost.",
          "Вы собираетесь покинуть страницу редактирования без сохранения. Изменения могут быть потеряны.",
        )
      : tr(
          "Redaktə səhifəsindən çıxmaq üzrəsiniz. Saxlanmamış dəyişikliklər itə bilər.",
          "You are about to leave the edit page. Any unsaved changes will be lost.",
          "Вы собираетесь покинуть страницу редактирования. Несохранённые изменения будут потеряны.",
        ),
  });

  const goBackToList = useCallback(async () => {
    if (!(await confirmLeave())) return;
    allowNextNavigation();
    navigate(returnTo, { replace: true });
  }, [allowNextNavigation, confirmLeave, navigate, returnTo]);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", status: "active" });
  const [categoryFormErrors, setCategoryFormErrors] = useState({ name: "" });

  const [subCategories, setSubCategories] = useState<SelectOption[]>([]);
  const [isAddSubCategoryModalOpen, setIsAddSubCategoryModalOpen] = useState(false);
  const [subCatFormData, setSubCatFormData] = useState({ name: "", categoryId: "", status: "active" });
  const [subCatFormErrors, setSubCatFormErrors] = useState({ name: "", categoryId: "" });

  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [brandFormData, setBrandFormData] = useState({ name: "", status: "active" });
  const [brandFormErrors, setBrandFormErrors] = useState({ name: "" });

  const [units, setUnits] = useState<SelectOption[]>([]);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [unitFormData, setUnitFormData] = useState({ name: "", shortName: "", status: "active" });
  const [unitFormErrors, setUnitFormErrors] = useState({ name: "", shortName: "" });

  const filteredSubCategories = category
    ? subCategories.filter((sc) => subCategoryCategoryMap[sc.value] === category)
    : subCategories;

  const loadOptions = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) {
      setCategories([]);
      setSubCategories([]);
      setBrands([]);
      setUnits([]);
      setOptionsLoading(false);
      return;
    }
    setOptionsLoading(true);
    try {
      const [catRows, subRows, brandRows, unitRows] = await Promise.all([
        fetchCategories(),
        fetchSubCategories(),
        fetchBrands(),
        fetchUnits(),
      ]);
      setCategories(catRows.map((r) => ({ value: r.id, label: r.name })));
      setSubCategories(subRows.map((r) => ({ value: r.id, label: r.name })));
      setSubCategoryCategoryMap(Object.fromEntries(subRows.map((r) => [r.id, r.categoryId])));
      setBrands(brandRows.map((r) => ({ value: r.id, label: r.name })));
      setUnits(unitRows.map((r) => ({ value: r.id, label: r.name })));
    } catch (err) {
      notifyFromError(err, pickLang(language, "Seçimləri yükləmək alınmadı", "Failed to load form options"));
    } finally {
      setOptionsLoading(false);
    }
  }, [isDemo, isAuthenticated, branchRevision, language]);

  const loadProduct = useCallback(async () => {
    if (!id || !(isAuthenticated || isDemo)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setBaseline(null);
    try {
      const product = await fetchProduct(id);
      const ids =
        product.subCategoryIds?.length
          ? product.subCategoryIds
          : product.subCategoryId
            ? [product.subCategoryId]
            : [];
      const names = product.subCategories ?? [];
      const labels: Record<string, string> = {};
      ids.forEach((sid, i) => {
        if (names[i]) labels[sid] = names[i];
        else if (ids.length === 1 && product.subCategory) labels[sid] = product.subCategory;
      });
      const nextScaleMode = product.scaleSaleMode === "WEIGHT" ? "WEIGHT" : "NONE";
      const nextQty = formatProductNumericInput(product.quantity ?? 0);
      const nextPrice = formatProductNumericInput(product.price ?? "");
      const nextCost = formatProductNumericInput(product.purchasePrice ?? "");
      const nextDiscountType = mapDiscountToUi(product.discountType);
      const nextDiscountValue = formatProductNumericInput(product.discountValue ?? "");
      const nextQtyAlert =
        product.quantityAlert != null
          ? formatProductNumericInput(product.quantityAlert)
          : "";
      const nextShowOnPos = product.showOnPos !== false;
      const nextManufactured = product.manufacturedDate?.slice(0, 10) ?? "";
      const nextExpiry = product.expiryDate?.slice(0, 10) ?? "";
      const urls = productImageUrls(product.images);

      setProductName(product.name);
      setCategory(product.categoryId ?? "");
      categoryRef.current = product.categoryId ?? "";
      setSubCategoryIds(ids);
      setSubCategoryLabelMap(labels);
      setBrand(product.brandId ?? "");
      setUnit(product.unitId ?? "");
      setItemBarcode(product.itemBarcode ?? "");
      setScaleSaleMode(nextScaleMode);
      setScaleItemCode(product.scaleItemCode ?? "");
      setScaleLfCode(product.scaleLfCode ?? "");
      setDescription(product.description ?? "");
      setQuantity(nextQty);
      setPrice(nextPrice);
      setCost(nextCost);
      setDiscountType(nextDiscountType);
      setDiscountValue(nextDiscountValue);
      setQuantityAlert(nextQtyAlert);
      setShowOnPos(nextShowOnPos);
      setManufacturedDate(nextManufactured);
      setExpiryDate(nextExpiry);
      setImages(urls.map((url, index) => ({ id: `img-${index}`, url })));
      setBaseline(
        serializeEditSnapshot({
          productName: product.name,
          category: product.categoryId ?? "",
          subCategoryIds: ids,
          brand: product.brandId ?? "",
          unit: product.unitId ?? "",
          itemBarcode: product.itemBarcode ?? "",
          scaleSaleMode: nextScaleMode,
          scaleItemCode: product.scaleItemCode ?? "",
          scaleLfCode: product.scaleLfCode ?? "",
          description: product.description ?? "",
          quantity: nextQty,
          price: nextPrice,
          cost: nextCost,
          discountType: nextDiscountType,
          discountValue: nextDiscountValue,
          quantityAlert: nextQtyAlert,
          showOnPos: nextShowOnPos,
          manufacturedDate: nextManufactured,
          expiryDate: nextExpiry,
          imageUrls: urls,
        }),
      );
    } catch (err) {
      notifyFromError(err, pickLang(language, "Məhsulu yükləmək alınmadı", "Failed to load product"));
      allowNextNavigation();
      navigate(returnTo, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [
    id,
    isDemo,
    isAuthenticated,
    navigate,
    branchRevision,
    language,
    returnTo,
    allowNextNavigation,
  ]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    // Only strip mismatched sub-cats when the user changes category — not when
    // options finish loading (that was clearing/hiding selections on edit).
    if (categoryRef.current === category) return;
    categoryRef.current = category;
    if (!category || Object.keys(subCategoryCategoryMap).length === 0) {
      setSubCategoryIds([]);
      return;
    }
    setSubCategoryIds((prev) =>
      prev.filter((id) => !subCategoryCategoryMap[id] || subCategoryCategoryMap[id] === category),
    );
  }, [category, subCategoryCategoryMap]);

  const generateBarcode = () => {
    const randomBarcode = Math.floor(Math.random() * 1000000000000).toString();
    setItemBarcode(randomBarcode);
  };

  const applyScannedBarcode = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setItemBarcode(trimmed);
  }, []);

  const { handleKeyDown: handleBarcodeWedgeKeyDown } = useBarcodeWedge(applyScannedBarcode);

  useEffect(() => {
    if (itemBarcode && barcodeCanvasRef.current) {
      try {
        JsBarcode(barcodeCanvasRef.current, itemBarcode, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
      } catch {
        /* ignore invalid barcode */
      }
    }
  }, [itemBarcode]);

  const handlePrintBarcode = () => {
    if (!itemBarcode.trim()) return;
    void printBarcodeLabel({
      barcodeValue: itemBarcode.trim(),
      productName: productName.trim(),
      priceLabel: formatBarcodePriceLabel(price),
    }).catch((err) => notifyFromError(err));
  };

  const handleAddCategory = async () => {
    const errors = { name: "" };
    if (!categoryFormData.name.trim()) errors.name = tr("Ad tələb olunur", "Name is required");
    setCategoryFormErrors(errors);
    if (errors.name || isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createCategory({
        name: categoryFormData.name.trim(),
        status: categoryFormData.status as "active" | "inactive",
      });
      setCategories((prev) => [...prev, { value: created.id, label: created.name }]);
      setCategory(created.id);
      setCategoryFormData({ name: "", status: "active" });
      setIsAddCategoryModalOpen(false);
      notifySuccess(tr("Kateqoriya əlavə edildi", "Category added"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleAddSubCategory = async () => {
    const errors = { name: "", categoryId: "" };
    if (!subCatFormData.name.trim()) errors.name = tr("Ad tələb olunur", "Name is required");
    if (!subCatFormData.categoryId.trim()) errors.categoryId = tr("Kateqoriya tələb olunur", "Category is required");
    setSubCatFormErrors(errors);
    if (errors.name || errors.categoryId || isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createSubCategory({
        name: subCatFormData.name.trim(),
        categoryId: subCatFormData.categoryId,
        status: subCatFormData.status as "active" | "inactive",
      });
      setSubCategories((prev) => [...prev, { value: created.id, label: created.name }]);
      setSubCategoryCategoryMap((prev) => ({ ...prev, [created.id]: created.categoryId }));
      setSubCategoryIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
      setSubCatFormData({ name: "", categoryId: "", status: "active" });
      setIsAddSubCategoryModalOpen(false);
      notifySuccess(tr("Alt kateqoriya əlavə edildi", "Sub category added"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleAddBrand = async () => {
    const errors = { name: "" };
    if (!brandFormData.name.trim()) errors.name = tr("Ad tələb olunur", "Name is required");
    setBrandFormErrors(errors);
    if (errors.name || isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createBrand({
        name: brandFormData.name.trim(),
        status: brandFormData.status as "active" | "inactive",
      });
      setBrands((prev) => [...prev, { value: created.id, label: created.name }]);
      setBrand(created.id);
      setBrandFormData({ name: "", status: "active" });
      setIsAddBrandModalOpen(false);
      notifySuccess(tr("Brend əlavə edildi", "Brand added"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleAddUnit = async () => {
    const errors = { name: "", shortName: "" };
    const shortName = unitFormData.shortName.trim();
    if (!shortName) errors.shortName = tr("Qısa ad tələb olunur", "Short name is required");
    setUnitFormErrors(errors);
    if (errors.shortName || isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createUnit({
        name: shortName,
        shortName,
        status: unitFormData.status as "active" | "inactive",
      });
      setUnits((prev) => [...prev, { value: created.id, label: created.name }]);
      setUnit(created.id);
      setUnitFormData({ name: "", shortName: "", status: "active" });
      setIsAddUnitModalOpen(false);
      notifySuccess(tr("Vahid əlavə edildi", "Unit added"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !id) return;
    for (const file of Array.from(files)) {
      if (isDemo || !isAuthenticated || !canEdit) {
        setImages((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, url: URL.createObjectURL(file), file },
        ]);
        continue;
      }
      try {
        const url = await uploadProductImage(file, id);
        setImages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, url }]);
      } catch (err) {
        notifyFromError(err, tr("Şəkil yüklənmədi", "Failed to upload image"));
      }
    }
    e.target.value = "";
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async () => {
    if (!id || saving || !(isAuthenticated || isDemo) || !canEdit) return;
    if (!productName.trim()) {
      notifyFromError(new Error(tr("Məhsul adı tələb olunur", "Product name is required")));
      return;
    }
    if (!category.trim()) {
      notifyFromError(new Error(tr("Kateqoriya tələb olunur", "Category is required")));
      return;
    }
    if (!price.trim()) {
      notifyFromError(new Error(tr("Qiymət tələb olunur", "Price is required")));
      return;
    }
    const effectiveScaleMode =
      scaleLabelScanEnabled && scaleSaleMode === "WEIGHT" ? "WEIGHT" : "NONE";
    if (effectiveScaleMode === "WEIGHT" && !normalizeScaleItemCodeInput(scaleItemCode)) {
      notifyFromError(
        new Error(
          tr(
            "Tərəzi məhsul kodu 5 rəqəm olmalıdır",
            "Scale item code must be exactly 5 digits",
          ),
        ),
      );
      return;
    }

    setSaving(true);
    try {
      const imageUrls: string[] = [];
      for (const img of images) {
        if (img.file) {
          const url = await uploadProductImage(img.file, id);
          imageUrls.push(url);
        } else {
          imageUrls.push(img.url);
        }
      }

      const qty = quantity.trim()
        ? roundToMaxDp(parsePrice(quantity), PRODUCT_NUMERIC_MAX_DP)
        : 0;
      const payload: Parameters<typeof updateProduct>[1] = {
        name: productName.trim(),
        description: description.trim() || null,
        categoryId: category,
        subCategoryIds,
        subCategoryId: subCategoryIds[0] ?? null,
        brandId: brand || null,
        unitId: unit || null,
        itemBarcode: itemBarcode.trim() || null,
        ...(scaleLabelScanEnabled
          ? {
              scaleSaleMode: effectiveScaleMode,
              scaleItemCode:
                effectiveScaleMode === "WEIGHT"
                  ? normalizeScaleItemCodeInput(scaleItemCode)
                  : null,
              scaleLfCode:
                effectiveScaleMode === "WEIGHT" ? scaleLfCode.trim() || null : null,
              scaleUnit: "KG" as const,
            }
          : {}),
        price: String(roundToMaxDp(parsePrice(price), PRODUCT_NUMERIC_MAX_DP)),
        ...(productsCogsEnabled
          ? {
              purchasePrice: cost.trim()
                ? String(roundToMaxDp(parsePrice(cost), PRODUCT_NUMERIC_MAX_DP))
                : null,
            }
          : {}),
        discountType: mapDiscountToApi(discountType),
        discountValue: discountValue.trim()
          ? String(roundToMaxDp(parsePrice(discountValue), PRODUCT_NUMERIC_MAX_DP))
          : null,
        showOnPos,
        ...(stockEnabled
          ? {
              quantityAlert: quantityAlert.trim()
                ? roundToMaxDp(parsePrice(quantityAlert), PRODUCT_NUMERIC_MAX_DP)
                : null,
            }
          : {}),
        manufacturedDate: manufacturedDate || null,
        expiryDate: expiryDate || null,
        images: imageUrls,
      };

      if (stockEnabled && branchId) {
        payload.quantity = qty;
      }

      await updateProduct(id, payload);
      notifySuccess(pt("productUpdated"));
      allowNextNavigation();
      setBaseline(serializeEditSnapshot(currentSnapshot));
      navigate(returnTo, { replace: true });
    } catch (err) {
      notifyFromError(err, tr("Yeniləmək alınmadı", "Failed to update product"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{pt("title")}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pt("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => void goBackToList()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{pt("backToProduct")}</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Product Information */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-visible">
            <button
              type="button"
              onClick={() => setProductInfoOpen(!productInfoOpen)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-lg"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">{pt("productInformation")}</span>
              {productInfoOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {productInfoOpen && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {pt("productName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {pt("category")} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <div className="flex-1">
                        <ModernSelect value={category} onChange={setCategory} placeholder={pt("select")} options={categories} />
                      </div>
                      {canCreate && (
                        <button type="button" onClick={() => setIsAddCategoryModalOpen(true)} className="w-7 h-7 flex items-center justify-center bg-[#14b8a6] text-white rounded-lg">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("subCategory")}</label>
                    <div className="flex gap-1.5 items-start">
                      <div className="flex-1 min-w-0">
                        <ModernMultiSelect
                          values={subCategoryIds}
                          onChange={setSubCategoryIds}
                          labelMap={subCategoryLabelMap}
                          placeholder={optionsLoading ? tr("Yüklənir...", "Loading...") : pt("select")}
                          options={filteredSubCategories}
                        />
                      </div>
                      {canCreate && (
                        <button type="button" onClick={() => setIsAddSubCategoryModalOpen(true)} className="w-7 h-7 mt-0.5 flex items-center justify-center bg-[#14b8a6] text-white rounded-lg">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("brand")}</label>
                    <div className="flex gap-1.5 items-center">
                      <div className="flex-1">
                        <ModernSelect value={brand} onChange={setBrand} placeholder={pt("select")} options={brands} />
                      </div>
                      {canCreate && (
                        <button type="button" onClick={() => setIsAddBrandModalOpen(true)} className="w-7 h-7 flex items-center justify-center bg-[#14b8a6] text-white rounded-lg">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("unit")}</label>
                    <div className="flex gap-1.5 items-center">
                      <div className="flex-1">
                        <ModernSelect value={unit} onChange={setUnit} placeholder={pt("select")} options={units} />
                      </div>
                      {canCreate && (
                        <button type="button" onClick={() => setIsAddUnitModalOpen(true)} className="w-7 h-7 flex items-center justify-center bg-[#14b8a6] text-white rounded-lg">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("itemBarcode")}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={itemBarcode}
                        onChange={(e) => setItemBarcode(e.target.value)}
                        onKeyDown={handleBarcodeWedgeKeyDown}
                        autoComplete="off"
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                        placeholder={pickLang(language, "Barkodu daxil edin, skan edin və ya yaradın", "Enter, scan, or generate barcode")}
                      />
                      <button type="button" onClick={generateBarcode} className="px-3 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg">
                        {pt("generate")}
                      </button>
                    </div>
                    {itemBarcode && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2">
                        <svg ref={barcodeCanvasRef} />
                        <button type="button" onClick={handlePrintBarcode} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg">
                          <Printer className="w-3.5 h-3.5" />
                          {pt("print")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("description")}</label>
                  <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-300 dark:border-gray-700">
                      <Bold className="w-3.5 h-3.5 text-gray-500" />
                      <Italic className="w-3.5 h-3.5 text-gray-500" />
                      <Underline className="w-3.5 h-3.5 text-gray-500" />
                      <Link2 className="w-3.5 h-3.5 text-gray-500" />
                      <List className="w-3.5 h-3.5 text-gray-500" />
                      <ListOrdered className="w-3.5 h-3.5 text-gray-500" />
                      <Type className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Stocks */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-visible">
            <button type="button" onClick={() => setPricingStocksOpen(!pricingStocksOpen)} className="w-full flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{pt("pricingStocks")}</span>
              {pricingStocksOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {pricingStocksOpen && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-3 mt-4">
                  {stockEnabled && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {pt("quantity")}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            sanitizeNumericTypingMaxDp(
                              e.target.value,
                              PRODUCT_NUMERIC_MAX_DP,
                            ),
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                      {!branchId && (
                        <p className="text-[10px] text-amber-600 mt-1">
                          {tr("Miqdarı yeniləmək üçün filial seçin", "Select a branch to update quantity")}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {pt("price")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) =>
                        setPrice(
                          sanitizeNumericTypingMaxDp(
                            e.target.value,
                            PRODUCT_NUMERIC_MAX_DP,
                          ),
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  </div>
                  {productsCogsEnabled && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {pt("cost")}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cost}
                      onChange={(e) =>
                        setCost(
                          sanitizeNumericTypingMaxDp(
                            e.target.value,
                            PRODUCT_NUMERIC_MAX_DP,
                          ),
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {pt("discountType")}
                    </label>
                    <ModernSelect
                      value={discountType}
                      onChange={setDiscountType}
                      placeholder={pt("select")}
                      options={[
                        { value: "", label: pt("select") },
                        { value: "percentage", label: pickLang(language, "Faiz", "Percentage") },
                        { value: "fixed", label: pickLang(language, "Sabit", "Fixed") },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {pt("discountValue")}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={discountValue}
                      onChange={(e) =>
                        setDiscountValue(
                          sanitizeNumericTypingMaxDp(
                            e.target.value,
                            PRODUCT_NUMERIC_MAX_DP,
                          ),
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  </div>
                  {stockEnabled && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {pt("quantityAlert")}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={quantityAlert}
                        onChange={(e) =>
                          setQuantityAlert(
                            sanitizeNumericTypingMaxDp(
                              e.target.value,
                              PRODUCT_NUMERIC_MAX_DP,
                            ),
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 col-span-2 md:col-span-3 xl:col-span-4 pt-1">
                    <input
                      id="edit-show-on-pos"
                      type="checkbox"
                      checked={showOnPos}
                      onChange={(e) => setShowOnPos(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
                    />
                    <label
                      htmlFor="edit-show-on-pos"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {tr("POS-da göstər", "Show on POS")}
                    </label>
                  </div>
                  {scaleLabelScanEnabled && (
                  <div className="col-span-2 md:col-span-3 xl:col-span-4 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="edit-scale-weight"
                        type="checkbox"
                        checked={scaleSaleMode === "WEIGHT"}
                        onChange={(e) =>
                          setScaleSaleMode(e.target.checked ? "WEIGHT" : "NONE")
                        }
                        className="h-3.5 w-3.5 rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
                      />
                      <label
                        htmlFor="edit-scale-weight"
                        className="text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {tr("Etiket tərəzisində satılır", "Sold on label scale")}
                      </label>
                    </div>
                    {scaleSaleMode === "WEIGHT" && (
                      <div className="grid grid-cols-2 gap-2 max-w-md">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {tr("Tərəzi məhsul kodu (5 rəqəm)", "Scale item code (5 digits)")}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            value={scaleItemCode}
                            onChange={(e) =>
                              setScaleItemCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                            }
                            placeholder="00123"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {tr("LF kodu (ixtiyari)", "LF code (optional)")}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={scaleLfCode}
                            onChange={(e) =>
                              setScaleLfCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setImagesOpen(!imagesOpen)} className="w-full flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">{pt("images")}</span>
              </div>
              {imagesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {imagesOpen && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap gap-3 mt-4">
                  <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-[10px] text-gray-400">{pt("uploadImages")}</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                  {images.map((image) => (
                    <div key={image.id} className="relative w-20 h-20">
                      <img src={image.url} alt="" className="w-full h-full object-cover rounded-lg border" />
                      <button type="button" onClick={() => removeImage(image.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setCustomFieldsOpen(!customFieldsOpen)} className="w-full flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{pt("customFields")}</span>
              {customFieldsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {customFieldsOpen && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("manufacturedDate")}</label>
                    <DateInput value={manufacturedDate} onChange={setManufacturedDate} placeholder={pt("datePlaceholder")} className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("expiryDate")}</label>
                    <DateInput value={expiryDate} onChange={setExpiryDate} allowFuture placeholder={pt("datePlaceholder")} className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => void goBackToList()}
              className="px-4 py-2 text-xs bg-gray-900 text-white rounded-lg"
            >
              {pt("cancel")}
            </button>
            <button type="button" onClick={() => void handleSubmit()} disabled={saving || optionsLoading} className="px-4 py-2 text-xs bg-orange-500 text-white rounded-lg disabled:opacity-50">
              {saving ? tr("Göndərilir...", "Saving...") : pt("submit")}
            </button>
          </div>
        </div>
      </div>

      {/* Category modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm border p-4 space-y-3">
            <h2 className="text-sm font-semibold">{tr("Kateqoriya Əlavə Et", "Add Category")}</h2>
            <input value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full px-3 py-1.5 text-xs border rounded-lg" placeholder={tr("Kateqoriya adı", "Category name")} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddCategoryModalOpen(false)} className="px-3 py-1.5 text-xs">{pt("cancel")}</button>
              <button type="button" onClick={() => void handleAddCategory()} className="px-3 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg">{tr("Əlavə et", "Add")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub category modal */}
      {isAddSubCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm border p-4 space-y-3">
            <h2 className="text-sm font-semibold">{tr("Alt Kateqoriya Əlavə Et", "Add Sub Category")}</h2>
            <input value={subCatFormData.name} onChange={(e) => setSubCatFormData({ ...subCatFormData, name: e.target.value })} className="w-full px-3 py-1.5 text-xs border rounded-lg" placeholder={tr("Alt kateqoriya adı", "Sub category name")} />
            <ModernSelect value={subCatFormData.categoryId} onChange={(v) => setSubCatFormData({ ...subCatFormData, categoryId: v })} placeholder={pt("select")} options={categories} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddSubCategoryModalOpen(false)} className="px-3 py-1.5 text-xs">{pt("cancel")}</button>
              <button type="button" onClick={() => void handleAddSubCategory()} className="px-3 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg">{tr("Əlavə et", "Add")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Brand modal */}
      {isAddBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm border p-4 space-y-3">
            <h2 className="text-sm font-semibold">{tr("Brend Əlavə Et", "Add Brand")}</h2>
            <input value={brandFormData.name} onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })} className="w-full px-3 py-1.5 text-xs border rounded-lg" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddBrandModalOpen(false)} className="px-3 py-1.5 text-xs">{pt("cancel")}</button>
              <button type="button" onClick={() => void handleAddBrand()} className="px-3 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg">{tr("Əlavə et", "Add")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Unit modal */}
      {isAddUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm border p-4 space-y-3">
            <h2 className="text-sm font-semibold">{tr("Vahid Əlavə Et", "Add Unit")}</h2>
            <input value={unitFormData.shortName} onChange={(e) => setUnitFormData({ ...unitFormData, shortName: e.target.value })} className="w-full px-3 py-1.5 text-xs border rounded-lg" placeholder={tr("Qısa ad", "Short name")} autoFocus />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddUnitModalOpen(false)} className="px-3 py-1.5 text-xs">{pt("cancel")}</button>
              <button type="button" onClick={() => void handleAddUnit()} className="px-3 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg">{tr("Əlavə et", "Add")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
