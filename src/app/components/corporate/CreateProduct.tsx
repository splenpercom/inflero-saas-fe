import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useBranch } from "../../context/BranchContext";
import {
  fetchCategories,
  fetchSubCategories,
  fetchBrands,
  fetchUnits,
  createCategory,
  createSubCategory,
  createBrand,
  createUnit,
  createProduct,
  uploadProductImage,
} from "../../api/inventory";
import { parsePrice } from "../../lib/inventoryMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { ModernSelect } from "../ui/ModernSelect";
import { DateInput } from "../ui/DateInput";
import {
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  ArrowLeft,
  Image as ImageIcon,
  Check,
  Printer,
  Plus,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import JsBarcode from "jsbarcode";
import { useBarcodeWedge } from "../../hooks/useBarcodeWedge";

import { pickLang, mapLang } from "../../i18n/pickLang";
interface ProductImage {
  id: string;
  url: string;
  file?: File;
}

export function CreateProduct() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const { canCreate } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  const { branchId } = useBranch();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  // Translation helper
  const pt = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      title: { en: "Create", az: "Yarat" },
      subtitle: { en: "Add a new product or service", az: "Yeni məhsul və ya xidmət əlavə edin" },
      backToProduct: { en: "Back to Products/Services", az: "Məhsullar/Xidmətlərə Geri" },
      productInformation: { en: "Product/Service Information", az: "Məhsul/Xidmət Məlumatı" },
      pricingStocks: { en: "Pricing & Stocks", az: "Qiymət və Ehtiyatlar" },
      images: { en: "Images", az: "Şəkillər" },
      customFields: { en: "Custom Fields", az: "Xüsusi Sahələr" },
      productName: { en: "Product/Service Name", az: "Məhsul/Xidmət Adı" },
      productService: { en: "Product/Service", az: "Məhsul/Xidmət" },
      sku: { en: "SKU", az: "SKU" },
      generate: { en: "Generate", az: "Yarat" },
      category: { en: "Category", az: "Kateqoriya" },
      subCategory: { en: "Sub Category", az: "Alt Kateqoriya" },
      brand: { en: "Brand", az: "Brend" },
      unit: { en: "Unit", az: "Vahid" },
      itemBarcode: { en: "Item Barcode", az: "Məhsul/Xidmət Barkodu" },
      description: { en: "Description", az: "Təsvir" },
      productType: { en: "Product Type", az: "Məhsul Növü" },
      single: { en: "Single", az: "Tək" },
      variant: { en: "Variant", az: "Variant" },
      combo: { en: "Combo", az: "Birləşmə" },
      quantity: { en: "Quantity", az: "Miqdar" },
      price: { en: "Price", az: "Qiymət" },
      discountType: { en: "Discount Type", az: "Endirim Növü" },
      discountValue: { en: "Discount Value", az: "Endirim Dəyəri" },
      quantityAlert: { en: "Quantity Alert", az: "Miqdar Xəbərdarlığı" },
      uploadImages: { en: "Upload Images", az: "Şəkil Yükləyin" },
      dragDrop: { en: "Drag and drop images here or click to browse", az: "Şəkilləri bura sürükləyin və ya seçmək üçün klikləyin" },
      supportedFormats: { en: "Supported formats", az: "Dəstəklənən formatlar" },
      customField1: { en: "Custom Field 1", az: "Xüsusi Sahə 1" },
      customField2: { en: "Custom Field 2", az: "Xüsusi Sahə 2" },
      customField3: { en: "Custom Field 3", az: "Xüsusi Sahə 3" },
      manufacturedDate: { en: "Manufactured Date", az: "İstehsal Tarixi" },
      expiryDate: { en: "Expiry On", az: "Son İstifadə Tarixi" },
      cancel: { en: "Cancel", az: "Ləğv et" },
      submit: { en: "Submit", az: "Təsdiq et" },
      saveAndNew: { en: "Save and New", az: "Saxla və Yenisi" },
      select: { en: "Select", az: "Seç" },
      productCreated: { en: "Product/Service created successfully!", az: "Məhsul/Xidmət uğurla yaradıldı!" },
      print: { en: "Print", az: "Çap et" },
      addNewCategory: { en: "Add New Category", az: "Yeni Kateqoriya Əlavə et" },
      categoryName: { en: "Category Name", az: "Kateqoriya Adı" },
      enterCategoryName: { en: "Enter category name", az: "Kateqoriya adını daxil edin" },
      add: { en: "Add", az: "Əlavə et" },
      datePlaceholder: { en: "dd/mm/yyyy", az: "gün/ay/il" },
    };
    return mapLang(language, translations[key], key);
  };

  // Section collapse states
  const [productInfoOpen, setProductInfoOpen] = useState(true);
  const [pricingStocksOpen, setPricingStocksOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);

  // Active tab in custom fields
  const [activeCustomTab, setActiveCustomTab] = useState("customField1");

  // Form states
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [itemBarcode, setItemBarcode] = useState("");
  const [description, setDescription] = useState("");
  const barcodeCanvasRef = useRef<SVGSVGElement>(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [quantityAlert, setQuantityAlert] = useState("");
  const [manufacturedDate, setManufacturedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Images
  const [images, setImages] = useState<ProductImage[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [subCategoryCategoryMap, setSubCategoryCategoryMap] = useState<Record<string, string>>({});

  // Category management
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", status: "active" });
  const [categoryFormErrors, setCategoryFormErrors] = useState({ name: "" });

  // Sub Category management
  const [subCategories, setSubCategories] = useState<SelectOption[]>([]);
  const [isAddSubCategoryModalOpen, setIsAddSubCategoryModalOpen] = useState(false);
  const [subCatFormData, setSubCatFormData] = useState({ name: "", categoryId: "", status: "active" });
  const [subCatFormErrors, setSubCatFormErrors] = useState({ name: "", categoryId: "" });

  // Brand management
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [brandFormData, setBrandFormData] = useState({ name: "", status: "active" });
  const [brandFormErrors, setBrandFormErrors] = useState({ name: "" });

  // Unit management
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
      notifyFromError(err, tr("Seçimləri yükləmək alınmadı", "Failed to load form options"));
    } finally {
      setOptionsLoading(false);
    }
  }, [isDemo, isAuthenticated, language, branchRevision]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (subCategory && category && subCategoryCategoryMap[subCategory] !== category) {
      setSubCategory("");
    }
  }, [category, subCategory, subCategoryCategoryMap]);

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

  const handleAddCategory = async () => {
    const errors = { name: "" };
    if (!categoryFormData.name.trim()) errors.name = pickLang(language, "Ad tələb olunur", "Name is required");
    setCategoryFormErrors(errors);
    if (errors.name) return;
    if (isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createCategory({
        name: categoryFormData.name.trim(),
        status: categoryFormData.status as "active" | "inactive",
      });
      const newCat = { value: created.id, label: created.name };
      setCategories((prev) => [...prev, newCat]);
      setCategory(newCat.value);
      setCategoryFormData({ name: "", status: "active" });
      setCategoryFormErrors({ name: "" });
      setIsAddCategoryModalOpen(false);
      notifySuccess(tr("Kateqoriya uğurla əlavə edildi!", "Category added successfully!"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleAddSubCategory = async () => {
    const errors = { name: "", categoryId: "" };
    if (!subCatFormData.name.trim()) errors.name = pickLang(language, "Ad tələb olunur", "Name is required");
    if (!subCatFormData.categoryId.trim()) errors.categoryId = pickLang(language, "Kateqoriya tələb olunur", "Category is required");
    setSubCatFormErrors(errors);
    if (errors.name || errors.categoryId) return;
    if (isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createSubCategory({
        name: subCatFormData.name.trim(),
        categoryId: subCatFormData.categoryId,
        status: subCatFormData.status as "active" | "inactive",
      });
      const newSub = { value: created.id, label: created.name };
      setSubCategories((prev) => [...prev, newSub]);
      setSubCategoryCategoryMap((prev) => ({ ...prev, [created.id]: created.categoryId }));
      setSubCategory(newSub.value);
      setSubCatFormData({ name: "", categoryId: "", status: "active" });
      setSubCatFormErrors({ name: "", categoryId: "" });
      setIsAddSubCategoryModalOpen(false);
      notifySuccess(tr("Alt kateqoriya uğurla əlavə edildi!", "Sub category added successfully!"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleAddBrand = async () => {
    const errors = { name: "" };
    if (!brandFormData.name.trim()) errors.name = pickLang(language, "Ad tələb olunur", "Name is required");
    setBrandFormErrors(errors);
    if (errors.name) return;
    if (isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createBrand({
        name: brandFormData.name.trim(),
        status: brandFormData.status as "active" | "inactive",
      });
      const newBrand = { value: created.id, label: created.name };
      setBrands((prev) => [...prev, newBrand]);
      setBrand(newBrand.value);
      setBrandFormData({ name: "", status: "active" });
      setBrandFormErrors({ name: "" });
      setIsAddBrandModalOpen(false);
      notifySuccess(tr("Brend uğurla əlavə edildi!", "Brand added successfully!"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleAddUnit = async () => {
    const errors = { name: "", shortName: "" };
    if (!unitFormData.name.trim()) errors.name = pickLang(language, "Ad tələb olunur", "Name is required");
    if (!unitFormData.shortName.trim()) errors.shortName = pickLang(language, "Qısa ad tələb olunur", "Short name is required");
    setUnitFormErrors(errors);
    if (errors.name || errors.shortName) return;
    if (isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createUnit({
        name: unitFormData.name.trim(),
        shortName: unitFormData.shortName.trim(),
        status: unitFormData.status as "active" | "inactive",
      });
      const newUnit = { value: created.id, label: created.name };
      setUnits((prev) => [...prev, newUnit]);
      setUnit(newUnit.value);
      setUnitFormData({ name: "", shortName: "", status: "active" });
      setUnitFormErrors({ name: "", shortName: "" });
      setIsAddUnitModalOpen(false);
      notifySuccess(tr("Vahid uğurla əlavə edildi!", "Unit added successfully!"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  // Render barcode when itemBarcode changes
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
      } catch (error) {
        console.error("Invalid barcode:", error);
      }
    }
  }, [itemBarcode]);

  const handlePrintBarcode = () => {
    if (!barcodeCanvasRef.current) return;

    const printWindow = window.open("", "", "width=400,height=300");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
              }
              .barcode-container {
                text-align: center;
                padding: 20px;
                border: 1px solid #ddd;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${barcodeCanvasRef.current.outerHTML}
              <div style="margin-top: 10px; font-size: 12px; color: #666;">
                ${productName || pt("productService")}
              </div>
            </div>
            <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
              Print
            </button>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: ProductImage[] = Array.from(files).map((file) => ({
        id: Date.now().toString() + Math.random(),
        url: URL.createObjectURL(file),
        file,
      }));
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const mapDiscountType = (value: string): "PERCENTAGE" | "FIXED" | null => {
    if (value === "percentage") return "PERCENTAGE";
    if (value === "fixed") return "FIXED";
    return null;
  };

  const resetProductForm = useCallback(() => {
    setProductName("");
    // Keep category / sub-category / brand / unit for rapid consecutive creates
    setItemBarcode("");
    setDescription("");
    setQuantity("");
    setPrice("");
    setDiscountType("");
    setDiscountValue("");
    setQuantityAlert("");
    setManufacturedDate("");
    setExpiryDate("");
    setImages((prev) => {
      prev.forEach((img) => {
        if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
      });
      return [];
    });
    if (barcodeCanvasRef.current) {
      barcodeCanvasRef.current.innerHTML = "";
    }
  }, []);

  const handleSubmit = async (opts?: { andNew?: boolean }) => {
    if (isDemo || !isAuthenticated || !canCreate) return;
    if (!productName.trim()) {
      notifyFromError(new Error(tr("Məhsul/Xidmət adı tələb olunur", "Product/Service name is required")));
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

    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const img of images) {
        if (img.file) {
          const url = await uploadProductImage(img.file);
          imageUrls.push(url);
        }
      }

      const qty = quantity.trim() ? parseInt(quantity, 10) : 0;
      const initialStocks =
        stockEnabled && qty > 0 && branchId ? [{ storeId: branchId, quantity: qty }] : undefined;

      await createProduct({
        name: productName.trim(),
        description: description.trim() || null,
        productType: "SINGLE",
        categoryId: category,
        subCategoryId: subCategory || null,
        brandId: brand || null,
        unitId: unit || null,
        itemBarcode: itemBarcode.trim() || null,
        price: String(parsePrice(price)),
        discountType: mapDiscountType(discountType),
        discountValue: discountValue.trim() ? String(parsePrice(discountValue)) : null,
        ...(stockEnabled
          ? { quantityAlert: quantityAlert.trim() ? parseInt(quantityAlert, 10) : null, initialStocks }
          : {}),
        manufacturedDate: manufacturedDate || null,
        expiryDate: expiryDate || null,
        images: imageUrls,
      });

      notifySuccess(pt("productCreated"));

      if (opts?.andNew) {
        resetProductForm();
      } else {
        navigate("/dashboard/inventory/products");
      }
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/inventory/products");
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {pt("title")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {pt("subtitle")}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{pt("backToProduct")}</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="space-y-3">
          {/* Product Information Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-visible">
            <button
              onClick={() => setProductInfoOpen(!productInfoOpen)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-orange-500" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {pt("productInformation")}
                </span>
              </div>
              {productInfoOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {productInfoOpen && (
              <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-2.5 gap-y-2.5 mt-3">
                  {/* Product Name */}
                  <div className="col-span-2 md:col-span-1 xl:col-span-1">
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      {pt("productName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      {pt("category")} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1 items-center">
                      <div className="flex-1 min-w-0">
                        <ModernSelect
                          value={category}
                          onChange={(e) => setCategory(e)}
                          placeholder={pt("select")}
                          options={categories}
                        />
                      </div>
                      {canCreate && (
                      <button
                        type="button"
                        onClick={() => setIsAddCategoryModalOpen(true)}
                        title="Add new category"
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      )}
                    </div>
                  </div>

                  {/* Sub Category */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      {pt("subCategory")}
                    </label>
                    <div className="flex gap-1 items-center">
                      <div className="flex-1 min-w-0">
                        <ModernSelect
                          value={subCategory}
                          onChange={(e) => setSubCategory(e)}
                          placeholder={optionsLoading ? tr("Yüklənir...", "Loading...") : pt("select")}
                          options={filteredSubCategories}
                        />
                      </div>
                      {canCreate && (
                      <button
                        type="button"
                        onClick={() => setIsAddSubCategoryModalOpen(true)}
                        title="Add new sub category"
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      )}
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      {pt("brand")}
                    </label>
                    <div className="flex gap-1 items-center">
                      <div className="flex-1 min-w-0">
                        <ModernSelect
                          value={brand}
                          onChange={(e) => setBrand(e)}
                          placeholder={pt("select")}
                          options={brands}
                        />
                      </div>
                      {canCreate && (
                      <button
                        type="button"
                        onClick={() => setIsAddBrandModalOpen(true)}
                        title="Add new brand"
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      )}
                    </div>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      {pt("unit")}
                    </label>
                    <div className="flex gap-1 items-center">
                      <div className="flex-1 min-w-0">
                        <ModernSelect
                          value={unit}
                          onChange={(e) => setUnit(e)}
                          placeholder={pt("select")}
                          options={units}
                        />
                      </div>
                      {canCreate && (
                      <button
                        type="button"
                        onClick={() => setIsAddUnitModalOpen(true)}
                        title="Add new unit"
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      )}
                    </div>
                  </div>

                  {/* Item Barcode */}
                  <div className="col-span-2 md:col-span-2 xl:col-span-2">
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      {pt("itemBarcode")}
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={itemBarcode}
                        onChange={(e) => setItemBarcode(e.target.value)}
                        onKeyDown={handleBarcodeWedgeKeyDown}
                        autoComplete="off"
                        className="flex-1 min-w-0 h-[30px] px-2.5 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                        placeholder={pickLang(language, "Barkodu daxil edin, skan edin və ya yaradın", "Enter, scan, or generate barcode")}
                      />
                      <button
                        type="button"
                        onClick={generateBarcode}
                        className="shrink-0 inline-flex items-center justify-center px-2.5 py-1.5 text-[11px] bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md font-medium transition-colors"
                      >
                        {pt("generate")}
                      </button>
                    </div>
                    {itemBarcode && (
                      <div className="mt-1.5 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                        <div className="overflow-x-auto max-w-full">
                          <svg ref={barcodeCanvasRef} className="max-h-10" />
                        </div>
                        <button
                          type="button"
                          onClick={handlePrintBarcode}
                          className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Printer className="w-2.5 h-2.5" />
                          {pt("print")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description (left) + Images (right) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-visible">
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <ImageIcon className="w-3 h-3 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {pt("description")} & {pt("images")}
                </span>
              </div>
              {detailsOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {detailsOpen && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {pt("description")}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] resize-none"
                      rows={5}
                      placeholder={pickLang(language, "Qısa təsvir...", "Short description...")}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {pickLang(language, "Maksimum 60 söz", "Maximum 60 Words")}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {pt("images")}
                    </label>
                    <div className="flex flex-wrap gap-2 content-start min-h-[7.5rem] p-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                      <label className="w-16 h-16 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#14b8a6] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <Upload className="w-4 h-4 text-gray-400 mb-0.5" />
                        <span className="text-[9px] text-gray-400 text-center px-0.5 leading-tight">
                          {pt("uploadImages")}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {images.map((image) => (
                        <div key={image.id} className="relative w-16 h-16">
                          <img
                            src={image.url}
                            alt={pt("productService")}
                            className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Stocks Section (+ dates / alerts from custom fields) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-visible">
            <button
              type="button"
              onClick={() => setPricingStocksOpen(!pricingStocksOpen)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <svg className="w-3 h-3 text-orange-500" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {pt("pricingStocks")}
                </span>
              </div>
              {pricingStocksOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
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
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {pt("price")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {pt("discountType")}
                    </label>
                    <ModernSelect
                      value={discountType}
                      onChange={(e) => setDiscountType(e)}
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
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  </div>

                  {stockEnabled && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {pt("quantityAlert")}
                      </label>
                      <input
                        type="number"
                        value={quantityAlert}
                        onChange={(e) => setQuantityAlert(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {pt("manufacturedDate")}
                    </label>
                    <DateInput
                      value={manufacturedDate}
                      onChange={setManufacturedDate}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      placeholder={pt("datePlaceholder")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {pt("expiryDate")}
                    </label>
                    <DateInput
                      value={expiryDate}
                      onChange={setExpiryDate}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      placeholder={pt("datePlaceholder")}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              {pt("cancel")}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit({ andNew: true })}
              disabled={submitting || optionsLoading}
              className="px-4 py-2 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? tr("Göndərilir...", "Submitting...") : pt("saveAndNew")}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || optionsLoading}
              className="px-4 py-2 text-xs bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? tr("Göndərilir...", "Submitting...") : pt("submit")}
            </button>
          </div>
        </div>
      </div>

      {/* Add Category Modal — exact match of Category.tsx modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pickLang(language, "Kateqoriya Əlavə Et", "Add Category")}
              </h2>
              <button
                onClick={() => { setIsAddCategoryModalOpen(false); setCategoryFormData({ name: "", status: "active" }); setCategoryFormErrors({ name: "" }); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Kateqoriya Adı *", "Category Name *")}
                </label>
                <input
                  type="text"
                  placeholder={pickLang(language, "Kateqoriya adını daxil edin", "Enter category name")}
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  autoFocus
                  className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${categoryFormErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-700"} rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]`}
                />
                {categoryFormErrors.name && <p className="text-[10px] text-red-500 mt-1">{categoryFormErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Status", "Status")}
                </label>
                <ModernSelect
                  value={categoryFormData.status}
                  onChange={(value) => setCategoryFormData({ ...categoryFormData, status: value })}
                  options={[
                    { value: "active", label: pickLang(language, "Aktiv", "Active") },
                    { value: "inactive", label: pickLang(language, "Qeyri-aktiv", "Inactive") },
                  ]}
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
              <button
                onClick={() => { setIsAddCategoryModalOpen(false); setCategoryFormData({ name: "", status: "active" }); setCategoryFormErrors({ name: "" }); }}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {pickLang(language, "Ləğv Et", "Cancel")}
              </button>
              <button
                onClick={handleAddCategory}
                className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors"
              >
                {pickLang(language, "Kateqoriya Əlavə Et", "Add Category")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub Category Modal — exact match of SubCategory.tsx modal */}
      {isAddSubCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pickLang(language, "Alt Kateqoriya Əlavə Et", "Add Sub Category")}
              </h2>
              <button
                onClick={() => { setIsAddSubCategoryModalOpen(false); setSubCatFormData({ name: "", categoryId: "", status: "active" }); setSubCatFormErrors({ name: "", categoryId: "" }); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Alt Kateqoriya Adı *", "Sub Category Name *")}
                </label>
                <input
                  type="text"
                  placeholder={pickLang(language, "Alt kateqoriya adını daxil edin", "Enter sub category name")}
                  value={subCatFormData.name}
                  onChange={(e) => setSubCatFormData({ ...subCatFormData, name: e.target.value })}
                  autoFocus
                  className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${subCatFormErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-700"} rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]`}
                />
                {subCatFormErrors.name && <p className="text-[10px] text-red-500 mt-1">{subCatFormErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Kateqoriya *", "Category *")}
                </label>
                <ModernSelect
                  value={subCatFormData.categoryId}
                  onChange={(value) => setSubCatFormData({ ...subCatFormData, categoryId: value })}
                  className="w-full"
                  placeholder={pickLang(language, "Seç", "Select")}
                  options={[
                    { value: "", label: pickLang(language, "Seç", "Select") },
                    ...categories.map((c) => ({ value: c.value, label: c.label })),
                  ]}
                />
                {subCatFormErrors.categoryId && <p className="text-[10px] text-red-500 mt-1">{subCatFormErrors.categoryId}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Status", "Status")}
                </label>
                <ModernSelect
                  value={subCatFormData.status}
                  onChange={(value) => setSubCatFormData({ ...subCatFormData, status: value })}
                  options={[
                    { value: "active", label: pickLang(language, "Aktiv", "Active") },
                    { value: "inactive", label: pickLang(language, "Qeyri-aktiv", "Inactive") },
                  ]}
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
              <button
                onClick={() => { setIsAddSubCategoryModalOpen(false); setSubCatFormData({ name: "", categoryId: "", status: "active" }); setSubCatFormErrors({ name: "", categoryId: "" }); }}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {pickLang(language, "Ləğv Et", "Cancel")}
              </button>
              <button
                onClick={handleAddSubCategory}
                className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors"
              >
                {pickLang(language, "Alt Kateqoriya Əlavə Et", "Add Sub Category")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Brand Modal — exact match of Brands.tsx modal */}
      {isAddBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pickLang(language, "Brend Əlavə Et", "Add Brand")}
              </h2>
              <button
                onClick={() => { setIsAddBrandModalOpen(false); setBrandFormData({ name: "", status: "active" }); setBrandFormErrors({ name: "" }); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Brend Adı *", "Brand Name *")}
                </label>
                <input
                  type="text"
                  placeholder={pickLang(language, "Brend adını daxil edin", "Enter brand name")}
                  value={brandFormData.name}
                  onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                  autoFocus
                  className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${brandFormErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-700"} rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]`}
                />
                {brandFormErrors.name && <p className="text-[10px] text-red-500 mt-1">{brandFormErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Status", "Status")}
                </label>
                <ModernSelect
                  value={brandFormData.status}
                  onChange={(value) => setBrandFormData({ ...brandFormData, status: value })}
                  options={[
                    { value: "active", label: pickLang(language, "Aktiv", "Active") },
                    { value: "inactive", label: pickLang(language, "Qeyri-aktiv", "Inactive") },
                  ]}
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
              <button
                onClick={() => { setIsAddBrandModalOpen(false); setBrandFormData({ name: "", status: "active" }); setBrandFormErrors({ name: "" }); }}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {pickLang(language, "Ləğv Et", "Cancel")}
              </button>
              <button
                onClick={handleAddBrand}
                className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors"
              >
                {pickLang(language, "Brend Əlavə Et", "Add Brand")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal — exact match of Units.tsx modal */}
      {isAddUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pickLang(language, "Vahid Əlavə Et", "Add Unit")}
              </h2>
              <button
                onClick={() => { setIsAddUnitModalOpen(false); setUnitFormData({ name: "", shortName: "", status: "active" }); setUnitFormErrors({ name: "", shortName: "" }); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Vahid Adı *", "Unit Name *")}
                </label>
                <input
                  type="text"
                  placeholder={pickLang(language, "Vahid adını daxil edin", "Enter unit name")}
                  value={unitFormData.name}
                  onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                  autoFocus
                  className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${unitFormErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-700"} rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]`}
                />
                {unitFormErrors.name && <p className="text-[10px] text-red-500 mt-1">{unitFormErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Qısa Ad *", "Short Name *")}
                </label>
                <input
                  type="text"
                  placeholder={pickLang(language, "məs., kg", "e.g., kg")}
                  value={unitFormData.shortName}
                  onChange={(e) => setUnitFormData({ ...unitFormData, shortName: e.target.value })}
                  className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${unitFormErrors.shortName ? "border-red-500" : "border-gray-300 dark:border-gray-700"} rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]`}
                />
                {unitFormErrors.shortName && <p className="text-[10px] text-red-500 mt-1">{unitFormErrors.shortName}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {pickLang(language, "Status", "Status")}
                </label>
                <ModernSelect
                  value={unitFormData.status}
                  onChange={(value) => setUnitFormData({ ...unitFormData, status: value })}
                  options={[
                    { value: "active", label: pickLang(language, "Aktiv", "Active") },
                    { value: "inactive", label: pickLang(language, "Qeyri-aktiv", "Inactive") },
                  ]}
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
              <button
                onClick={() => { setIsAddUnitModalOpen(false); setUnitFormData({ name: "", shortName: "", status: "active" }); setUnitFormErrors({ name: "", shortName: "" }); }}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {pickLang(language, "Ləğv Et", "Cancel")}
              </button>
              <button
                onClick={handleAddUnit}
                className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors"
              >
                {pickLang(language, "Vahid Əlavə Et", "Add Unit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}