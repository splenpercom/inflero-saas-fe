import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
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
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { ModernSelect } from "../ui/ModernSelect";
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

import { pickLang, mapLang } from "../../i18n/pickLang";
const LIST_PATH = "/dashboard/inventory/products";

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

export function EditProduct() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const { canCreate, canEdit } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  const { branchId } = useBranch();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const pt = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      title: { en: "Edit", az: "Redaktə et" },
      subtitle: { en: "Update product or service information", az: "Məhsul və ya xidmət məlumatını yeniləyin" },
      backToProduct: { en: "Back to Products/Services", az: "Məhsullar/Xidmətlərə Geri" },
      productInformation: { en: "Product/Service Information", az: "Məhsul/Xidmət Məlumatı" },
      pricingStocks: { en: "Pricing & Stocks", az: "Qiymət və Ehtiyatlar" },
      images: { en: "Images", az: "Şəkillər" },
      customFields: { en: "Custom Fields", az: "Xüsusi Sahələr" },
      productName: { en: "Product/Service Name", az: "Məhsul/Xidmət Adı" },
      category: { en: "Category", az: "Kateqoriya" },
      subCategory: { en: "Sub Category", az: "Alt Kateqoriya" },
      brand: { en: "Brand", az: "Brend" },
      unit: { en: "Unit", az: "Vahid" },
      itemBarcode: { en: "Item Barcode", az: "Məhsul/Xidmət Barkodu" },
      description: { en: "Description", az: "Təsvir" },
      quantity: { en: "Quantity", az: "Miqdar" },
      price: { en: "Price", az: "Qiymət" },
      discountType: { en: "Discount Type", az: "Endirim Növü" },
      discountValue: { en: "Discount Value", az: "Endirim Dəyəri" },
      quantityAlert: { en: "Quantity Alert", az: "Miqdar Xəbərdarlığı" },
      uploadImages: { en: "Upload Images", az: "Şəkil Yükləyin" },
      manufacturedDate: { en: "Manufactured Date", az: "İstehsal Tarixi" },
      expiryDate: { en: "Expiry On", az: "Son İstifadə Tarixi" },
      cancel: { en: "Cancel", az: "Ləğv et" },
      submit: { en: "Save Changes", az: "Yadda saxla" },
      select: { en: "Select", az: "Seç" },
      productUpdated: { en: "Product/Service updated successfully!", az: "Məhsul/Xidmət uğurla yeniləndi!" },
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
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [itemBarcode, setItemBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [quantityAlert, setQuantityAlert] = useState("");
  const [manufacturedDate, setManufacturedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);

  const barcodeCanvasRef = useRef<SVGSVGElement>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [subCategoryCategoryMap, setSubCategoryCategoryMap] = useState<Record<string, string>>({});

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
    try {
      const product = await fetchProduct(id);
      setProductName(product.name);
      setCategory(product.categoryId ?? "");
      setSubCategory(product.subCategoryId ?? "");
      setBrand(product.brandId ?? "");
      setUnit(product.unitId ?? "");
      setItemBarcode(product.itemBarcode ?? "");
      setDescription(product.description ?? "");
      setQuantity(String(product.quantity ?? 0));
      setPrice(product.price ?? "");
      setDiscountType(mapDiscountToUi(product.discountType));
      setDiscountValue(product.discountValue ?? "");
      setQuantityAlert(product.quantityAlert != null ? String(product.quantityAlert) : "");
      setManufacturedDate(product.manufacturedDate?.slice(0, 10) ?? "");
      setExpiryDate(product.expiryDate?.slice(0, 10) ?? "");

      const urls = productImageUrls(product.images);
      setImages(urls.map((url, index) => ({ id: `img-${index}`, url })));
    } catch (err) {
      notifyFromError(err, pickLang(language, "Məhsulu yükləmək alınmadı", "Failed to load product"));
      navigate(LIST_PATH);
    } finally {
      setLoading(false);
    }
  }, [id, isDemo, isAuthenticated, navigate, branchRevision, language]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    if (subCategory && category && subCategoryCategoryMap[subCategory] !== category) {
      setSubCategory("");
    }
  }, [category, subCategory, subCategoryCategoryMap]);

  const generateBarcode = () => {
    const randomBarcode = Math.floor(Math.random() * 1000000000000).toString();
    setItemBarcode(randomBarcode);
  };

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
    if (!barcodeCanvasRef.current) return;
    const printWindow = window.open("", "", "width=400,height=300");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Print Barcode</title></head><body style="display:flex;justify-content:center;padding:20px;">
        ${barcodeCanvasRef.current.outerHTML}
        <p style="margin-top:10px;font-size:12px;">${productName}</p>
        </body></html>
      `);
      printWindow.document.close();
    }
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
      setSubCategory(created.id);
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
    if (!unitFormData.name.trim()) errors.name = tr("Ad tələb olunur", "Name is required");
    if (!unitFormData.shortName.trim()) errors.shortName = tr("Qısa ad tələb olunur", "Short name is required");
    setUnitFormErrors(errors);
    if (errors.name || errors.shortName || isDemo || !isAuthenticated || !canCreate) return;
    try {
      const created = await createUnit({
        name: unitFormData.name.trim(),
        shortName: unitFormData.shortName.trim(),
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
      notifyFromError(new Error(tr("Məhsul/Xidmət adı tələb olunur", "Product/Service name is required")));
      return;
    }
    if (!price.trim()) {
      notifyFromError(new Error(tr("Qiymət tələb olunur", "Price is required")));
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

      const qty = quantity.trim() ? parseInt(quantity, 10) : 0;
      const payload: Parameters<typeof updateProduct>[1] = {
        name: productName.trim(),
        description: description.trim() || null,
        categoryId: category || null,
        subCategoryId: subCategory || null,
        brandId: brand || null,
        unitId: unit || null,
        itemBarcode: itemBarcode.trim() || null,
        price: String(parsePrice(price)),
        discountType: mapDiscountToApi(discountType),
        discountValue: discountValue.trim() ? String(parsePrice(discountValue)) : null,
        ...(stockEnabled
          ? { quantityAlert: quantityAlert.trim() ? parseInt(quantityAlert, 10) : null }
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
      navigate(`${LIST_PATH}/${id}`);
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
            onClick={() => navigate(id ? `${LIST_PATH}/${id}` : LIST_PATH)}
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
                        <button type="button" onClick={() => setIsAddCategoryModalOpen(true)} className="w-7 h-7 flex items-center justify-center bg-[#0026f6] text-white rounded-lg">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("subCategory")}</label>
                    <div className="flex gap-1.5 items-center">
                      <div className="flex-1">
                        <ModernSelect
                          value={subCategory}
                          onChange={setSubCategory}
                          placeholder={optionsLoading ? tr("Yüklənir...", "Loading...") : pt("select")}
                          options={filteredSubCategories}
                        />
                      </div>
                      {canCreate && (
                        <button type="button" onClick={() => setIsAddSubCategoryModalOpen(true)} className="w-7 h-7 flex items-center justify-center bg-[#0026f6] text-white rounded-lg">
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
                        <button type="button" onClick={() => setIsAddBrandModalOpen(true)} className="w-7 h-7 flex items-center justify-center bg-[#0026f6] text-white rounded-lg">
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
                        <button type="button" onClick={() => setIsAddUnitModalOpen(true)} className="w-7 h-7 flex items-center justify-center bg-[#0026f6] text-white rounded-lg">
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
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                      />
                      <button type="button" onClick={generateBarcode} className="px-3 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white rounded-lg">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 mt-4">
                  {stockEnabled && <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("quantity")}</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-900" />
                    {!branchId && (
                      <p className="text-[10px] text-amber-600 mt-1">{tr("Miqdarı yeniləmək üçün filial seçin", "Select a branch to update quantity")}</p>
                    )}
                  </div>}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("price")} <span className="text-red-500">*</span></label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("discountType")}</label>
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
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("discountValue")}</label>
                    <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                </div>
                {stockEnabled && <div className="mt-6">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{pt("quantityAlert")}</label>
                  <input type="number" value={quantityAlert} onChange={(e) => setQuantityAlert(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-900" />
                </div>}
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
                    <DateInput value={expiryDate} onChange={setExpiryDate} placeholder={pt("datePlaceholder")} className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(id ? `${LIST_PATH}/${id}` : LIST_PATH)} className="px-4 py-2 text-xs bg-gray-900 text-white rounded-lg">
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
              <button type="button" onClick={() => void handleAddCategory()} className="px-3 py-1.5 text-xs bg-[#0026f6] text-white rounded-lg">{tr("Əlavə et", "Add")}</button>
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
              <button type="button" onClick={() => void handleAddSubCategory()} className="px-3 py-1.5 text-xs bg-[#0026f6] text-white rounded-lg">{tr("Əlavə et", "Add")}</button>
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
              <button type="button" onClick={() => void handleAddBrand()} className="px-3 py-1.5 text-xs bg-[#0026f6] text-white rounded-lg">{tr("Əlavə et", "Add")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Unit modal */}
      {isAddUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm border p-4 space-y-3">
            <h2 className="text-sm font-semibold">{tr("Vahid Əlavə Et", "Add Unit")}</h2>
            <input value={unitFormData.name} onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })} className="w-full px-3 py-1.5 text-xs border rounded-lg" placeholder={tr("Vahid adı", "Unit name")} />
            <input value={unitFormData.shortName} onChange={(e) => setUnitFormData({ ...unitFormData, shortName: e.target.value })} className="w-full px-3 py-1.5 text-xs border rounded-lg" placeholder={tr("Qısa ad", "Short name")} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddUnitModalOpen(false)} className="px-3 py-1.5 text-xs">{pt("cancel")}</button>
              <button type="button" onClick={() => void handleAddUnit()} className="px-3 py-1.5 text-xs bg-[#0026f6] text-white rounded-lg">{tr("Əlavə et", "Add")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
