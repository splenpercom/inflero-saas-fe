import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Columns3,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchProducts,
  fetchCategories,
  fetchBrands,
  deleteProduct,
  type CategoryRecord,
  type BrandRecord,
} from "../../api/inventory";
import { parsePrice } from "../../lib/inventoryMappers";
import { rememberProductsListReturn } from "../../lib/productsNavigation";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";

import { pickLang, mapLang } from "../../i18n/pickLang";
interface Product {
  id: string;
  sku: string;
  name: string;
  image: string;
  category: string;
  brand: string;
  price: number;
  unit: string;
  quantity: number;
  createdBy: string;
  createdById: string;
}

type SortField = "category" | "brand" | "price" | "quantity" | "createdBy";
type SortDirection = "asc" | "desc" | null;

type ProductsColumnKey =
  | "sku"
  | "productName"
  | "category"
  | "brand"
  | "price"
  | "unit"
  | "quantity"
  | "createdBy";

const PRODUCTS_COLUMNS_STORAGE_KEY = "inflero-products-visible-columns";

const DEFAULT_PRODUCTS_COLUMNS: Record<ProductsColumnKey, boolean> = {
  sku: true,
  productName: true,
  category: true,
  brand: true,
  price: true,
  unit: true,
  quantity: true,
  createdBy: true,
};

function loadProductsColumns(): Record<ProductsColumnKey, boolean> {
  try {
    const raw = localStorage.getItem(PRODUCTS_COLUMNS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PRODUCTS_COLUMNS };
    const parsed = JSON.parse(raw) as Partial<Record<ProductsColumnKey, boolean>>;
    return { ...DEFAULT_PRODUCTS_COLUMNS, ...parsed };
  } catch {
    return { ...DEFAULT_PRODUCTS_COLUMNS };
  }
}

export function Products() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  
  // Translation helper - temporary until translations.ts is updated
  const pt = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      title: { en: "Products/Services", az: "Məhsullar/Xidmətlər" },
      searchPlaceholder: { en: "Search products...", az: "Məhsul axtarın..." },
      allCategories: { en: "All Categories", az: "Bütün Kateqoriyalar" },
      allBrands: { en: "All Brands", az: "Bütün Brendlər" },
      addProduct: { en: "Create", az: "Yarat" },
      sku: { en: "SKU", az: "SKU" },
      productName: { en: "PRODUCT NAME", az: "MƏHSUL ADI" },
      category: { en: "CATEGORY", az: "KATEQORİYA" },
      brand: { en: "BRAND", az: "BREND" },
      price: { en: "PRICE", az: "QİYMƏT" },
      unit: { en: "UNIT", az: "VAHID" },
      qty: { en: "QTY", az: "MİQDAR" },
      createdBy: { en: "CREATED BY", az: "YARADAN" },
      actions: { en: "ACTIONS", az: "ƏMƏLİYYATLAR" },
      computers: { en: "Computers", az: "Kompüterlər" },
      electronics: { en: "Electronics", az: "Elektronika" },
      shoes: { en: "Shoes", az: "Ayaqqabılar" },
      furnitures: { en: "Furnitures", az: "Mebellər" },
      bags: { en: "Bags", az: "Çantalar" },
      phones: { en: "Phones", az: "Telefonlar" },
      importProducts: { en: "Import Products", az: "Məhsul İdxal Et" },
      step1: { en: "Step 1: Download Demo File", az: "Addım 1: Demo Faylı Yükləyin" },
      downloadDemoCSV: { en: "Download Demo CSV", az: "Demo CSV Yükləyin" },
      downloadDemoDesc: { en: "Download the demo file to see the correct format.", az: "Düzgün formatı görmək üçün demo faylı yükləyin." },
      step2: { en: "Step 2: Upload Your File", az: "Addım 2: Faylınızı Yükləyin" },
      clickToUpload: { en: "Click to upload", az: "Yükləmək üçün klikləyin" },
      dragAndDrop: { en: "or drag and drop", az: "və ya sürükləyib buraxın" },
      csvFiles: { en: "CSV files", az: "CSV faylları" },
      importing: { en: "Importing...", az: "İdxal edilir..." },
      close: { en: "Close", az: "Bağla" },
      productsImported: { en: "Products imported successfully!", az: "Məhsullar uğurla idxal edildi!" },
      select: { en: "Select", az: "Seç" },
      columns: { en: "Columns", az: "Sütunlar" },
    };
    return mapLang(language, translations[key], key);
  };
  
  // Search and filter states (restored from URL so edit/view return keeps page)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") ?? "all");
  const [selectedBrand, setSelectedBrand] = useState(() => searchParams.get("brand") ?? "all");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<ProductsColumnKey, boolean>>(loadProductsColumns);
  const columnsMenuRef = useRef<HTMLDivElement | null>(null);
  const skipPageResetRef = useRef(true);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sorting functionality
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(() => {
    const p = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("q") ?? "");
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  const listReturnTo = useMemo(() => {
    const next = new URLSearchParams();
    if (debouncedSearch.trim()) next.set("q", debouncedSearch.trim());
    if (selectedCategory !== "all") next.set("category", selectedCategory);
    if (selectedBrand !== "all") next.set("brand", selectedBrand);
    if (currentPage > 1) next.set("page", String(currentPage));
    const qs = next.toString();
    return qs ? `${location.pathname}?${qs}` : location.pathname;
  }, [location.pathname, debouncedSearch, selectedCategory, selectedBrand, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false;
      return;
    }
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedBrand]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch.trim()) next.set("q", debouncedSearch.trim());
    if (selectedCategory !== "all") next.set("category", selectedCategory);
    if (selectedBrand !== "all") next.set("brand", selectedBrand);
    if (currentPage > 1) next.set("page", String(currentPage));
    const nextStr = next.toString();
    if (nextStr !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [debouncedSearch, selectedCategory, selectedBrand, currentPage, searchParams, setSearchParams]);

  const col = (key: ProductsColumnKey) => visibleColumns[key];

  const toggleColumn = (key: ProductsColumnKey) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(PRODUCTS_COLUMNS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const columnLabels = useMemo(
    (): { key: ProductsColumnKey; label: string; available: boolean }[] => [
      { key: "sku", label: pt("sku"), available: true },
      { key: "productName", label: pt("productName"), available: true },
      { key: "category", label: pt("category"), available: true },
      { key: "brand", label: pt("brand"), available: true },
      { key: "price", label: pt("price"), available: true },
      { key: "unit", label: pt("unit"), available: true },
      { key: "quantity", label: pt("qty"), available: stockEnabled },
      { key: "createdBy", label: pt("createdBy"), available: true },
    ],
    [language, stockEnabled],
  );

  useEffect(() => {
    if (!columnsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [columnsOpen]);

  const visibleColCount =
    (col("sku") ? 1 : 0) +
    (col("productName") ? 1 : 0) +
    (col("category") ? 1 : 0) +
    (col("brand") ? 1 : 0) +
    (col("price") ? 1 : 0) +
    (col("unit") ? 1 : 0) +
    (stockEnabled && col("quantity") ? 1 : 0) +
    (col("createdBy") ? 1 : 0) +
    1; // actions

  const loadFilterOptions = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) return;
    try {
      const [catRows, brandRows] = await Promise.all([fetchCategories(), fetchBrands()]);
      setCategories(catRows);
      setBrands(brandRows);
    } catch (err) {
      notifyFromError(err);
    }
  }, [isDemo, isAuthenticated, canView, branchRevision]);

  const loadProducts = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setProducts([]);
      setTotalPages(1);
      setTotalItems(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sortBy =
        sortField && sortField !== "quantity"
          ? sortField
          : undefined;
      const data = await fetchProducts({
        page: currentPage,
        pageSize: itemsPerPage,
        search: debouncedSearch || undefined,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        brandId: selectedBrand !== "all" ? selectedBrand : undefined,
        sortBy,
        sortOrder: sortDirection || undefined,
      });
      let items = data.items.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        image: item.image,
        category: item.category,
        brand: item.brand,
        price: parsePrice(item.price),
        unit: item.unit,
        quantity: item.quantity ?? 0,
        createdBy: item.createdBy,
        createdById: item.createdById,
      }));
      if (sortField === "quantity" && sortDirection) {
        items = [...items].sort((a, b) =>
          sortDirection === "asc" ? a.quantity - b.quantity : b.quantity - a.quantity,
        );
      }
      setProducts(items);
      setTotalPages(Math.max(1, data.totalPages || 1));
      setTotalItems(data.total);
      if (data.totalPages > 0 && currentPage > data.totalPages) {
        setCurrentPage(data.totalPages);
      }
    } catch (err) {
      notifyFromError(err, pickLang(language, "Məhsulları yükləmək alınmadı", "Failed to load products"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    currentPage,
    debouncedSearch,
    selectedCategory,
    selectedBrand,
    sortField,
    sortDirection,
    language,
    branchRevision,
  ]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const selectedCategoryLabel =
    selectedCategory === "all"
      ? pt("allCategories")
      : categories.find((c) => c.id === selectedCategory)?.name ?? pt("allCategories");

  const selectedBrandLabel =
    selectedBrand === "all"
      ? pt("allBrands")
      : brands.find((b) => b.id === selectedBrand)?.name ?? pt("allBrands");

  const sortedProducts = products;

  const handleAddProduct = () => {
    navigate("/dashboard/inventory/products/create");
  };

  const handleImportProduct = () => {
    setIsImportModalOpen(true);
  };

  const handleExportPDF = () => {
    // Dynamically import jsPDF and autoTable
    import('jspdf').then((jsPDFModule) => {
      import('jspdf-autotable').then(() => {
        const jsPDF = jsPDFModule.default;
        const doc = new jsPDF() as any;
        
        // Add title
        doc.setFontSize(16);
        doc.text("Products/Services", 14, 15);
        
        // Add date
        doc.setFontSize(10);
        doc.text(`Generated: ${formatNowDate(language)}`, 14, 22);
        
        // Prepare table data
        const headers = [[
          "SKU", "Product Name", "Category", "Brand", "Price", "Unit",
          ...(stockEnabled ? ["Qty"] : []),
          "Created By",
        ]];
        const data = sortedProducts.map(product => [
          product.sku,
          product.name,
          product.category,
          product.brand,
          `${product.price} ₼`,
          product.unit,
          ...(stockEnabled ? [product.quantity.toString()] : []),
          product.createdBy
        ]);
        
        // Add table using autoTable (plugin is loaded globally)
        doc.autoTable({
          head: headers,
          body: data,
          startY: 28,
          theme: 'grid',
          headStyles: { fillColor: [20, 184, 166], fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        
        // Save PDF
        doc.save(`products_${new Date().toISOString().split("T")[0]}.pdf`);
      });
    }).catch((error) => {
      console.error('Error loading PDF libraries:', error);
      alert('Failed to generate PDF. Please try again.');
    });
  };

  const handleExportExcel = () => {
    // Create CSV content with semicolon separator for better international Excel compatibility
    const headers = [
      "SKU", "Product Name", "Category", "Brand", "Price", "Unit",
      ...(stockEnabled ? ["Quantity"] : []),
      "Created By",
    ];
    
    // Create CSV rows with semicolon separator
    const rows = sortedProducts.map((product) => [
      product.sku,
      product.name,
      product.category,
      product.brand,
      product.price,
      product.unit,
      ...(stockEnabled ? [product.quantity] : []),
      product.createdBy,
    ]);
    
    // Build CSV content with semicolon as delimiter
    let csvContent = headers.join(";") + "\n";
    rows.forEach((row) => {
      csvContent += row.join(";") + "\n";
    });

    // Create and download CSV file with UTF-8 BOM
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `products_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadProducts().finally(() => setIsRefreshing(false));
  };

  const handleView = (productId: string) => {
    rememberProductsListReturn(listReturnTo);
    navigate(`/dashboard/inventory/products/${productId}`, { state: { returnTo: listReturnTo } });
  };

  const handleEdit = (productId: string) => {
    rememberProductsListReturn(listReturnTo);
    navigate(`/dashboard/inventory/products/${productId}/edit`, { state: { returnTo: listReturnTo } });
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !(isAuthenticated || isDemo) || !canDelete) return;
    try {
      await deleteProduct(productToDelete);
      notifySuccess(pickLang(language, "Məhsul silindi", "Product deleted"));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      void loadProducts();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleDownloadDemo = () => {
    // Create demo CSV content
    const headers = [
      "SKU", "Product Name", "Category", "Brand", "Price", "Unit",
      ...(stockEnabled ? ["Quantity"] : []),
      "Created By",
    ];
    const demoData = [
      ["PT009", "Demo Product 1", "Electronics", "Demo Brand", "100", "Pc", ...(stockEnabled ? ["50"] : []), "Demo User"],
      ["PT010", "Demo Product 2", "Computers", "Demo Brand", "200", "Pc", ...(stockEnabled ? ["30"] : []), "Demo User"],
    ];
    const csvContent = [headers.join(","), ...demoData.map((row) => row.join(","))].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "demo_products.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsImporting(true);
      setImportProgress(0);

      // Simulate file import process
      const interval = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsImporting(false);
            setIsImportModalOpen(false);
            alert("Products imported successfully!");
            return 100;
          }
          return prev + 2;
        });
      }, 30);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const paginatedProducts = products;

  return (
    <div className="bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {pt("title")}
          </h1>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={pt("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {/* Category Dropdown */}
              <div className="relative w-[140px] shrink-0">
                <button
                  onClick={() => {
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    setIsBrandDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 rounded-full text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                    selectedCategory === "all" 
                      ? "border border-gray-300 dark:border-gray-700" 
                      : "border-2 border-[#14b8a6] dark:border-[#14b8a6]"
                  )}
                  title={selectedCategoryLabel}
                >
                  <span className="flex-1 min-w-0 truncate text-left">{selectedCategoryLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
                
                {isCategoryDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsCategoryDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 min-w-full w-max max-w-[260px] max-h-60 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-20">
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs hover:bg-[#ccfbf1] dark:hover:bg-[#14b8a6]/20 transition-colors",
                          selectedCategory === "all" && "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6] dark:text-[#14b8a6]"
                        )}
                      >
                        {pt("allCategories")}
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-xs hover:bg-[#ccfbf1] dark:hover:bg-[#14b8a6]/20 transition-colors text-gray-700 dark:text-gray-300",
                            selectedCategory === category.id && "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6] dark:text-[#14b8a6]"
                          )}
                          title={category.name}
                        >
                          <span className="block truncate">{category.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Brand Dropdown */}
              <div className="relative w-[140px] shrink-0">
                <button
                  onClick={() => {
                    setIsBrandDropdownOpen(!isBrandDropdownOpen);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 rounded-full text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                    selectedBrand === "all"
                      ? "border border-gray-300 dark:border-gray-700"
                      : "border-2 border-[#14b8a6] dark:border-[#14b8a6]",
                  )}
                  title={selectedBrandLabel}
                >
                  <span className="flex-1 min-w-0 truncate text-left">{selectedBrandLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
                
                {isBrandDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsBrandDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 min-w-full w-max max-w-[260px] max-h-60 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-20">
                      <button
                        onClick={() => {
                          setSelectedBrand("all");
                          setIsBrandDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs hover:bg-[#ccfbf1] dark:hover:bg-[#14b8a6]/20 transition-colors",
                          selectedBrand === "all" && "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6] dark:text-[#14b8a6]"
                        )}
                      >
                        {pt("allBrands")}
                      </button>
                      {brands.map((brand) => (
                        <button
                          key={brand.id}
                          onClick={() => {
                            setSelectedBrand(brand.id);
                            setIsBrandDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-xs hover:bg-[#ccfbf1] dark:hover:bg-[#14b8a6]/20 transition-colors text-gray-700 dark:text-gray-300",
                            selectedBrand === brand.id && "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6] dark:text-[#14b8a6]"
                          )}
                          title={brand.name}
                        >
                          <span className="block truncate">{brand.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <div className="relative" ref={columnsMenuRef}>
                <button
                  type="button"
                  onClick={() => setColumnsOpen((v) => !v)}
                  className="flex items-center justify-center w-8 h-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  title={pt("columns")}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                </button>
                {columnsOpen && (
                  <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 max-h-72 overflow-y-auto">
                    <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-gray-400">
                      {pt("columns")}
                    </p>
                    {columnLabels
                      .filter((c) => c.available)
                      .map((c) => (
                        <label
                          key={c.key}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[c.key]}
                            onChange={() => toggleColumn(c.key)}
                            className="rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
                          />
                          {c.label}
                        </label>
                      ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>

              {canCreate && (
              <button
                onClick={handleImportProduct}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </button>
              )}

              {canCreate && (
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{pt("addProduct")}</span>
              </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          className={cn(
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-opacity duration-500",
            isRefreshing && "opacity-50"
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  {col("sku") && (
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {pt("sku")}
                  </th>
                  )}
                  {col("productName") && (
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {pt("productName")}
                  </th>
                  )}
                  {col("category") && (
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      {pt("category")}
                      {sortField === "category" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      )}
                    </div>
                  </th>
                  )}
                  {col("brand") && (
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                    onClick={() => handleSort("brand")}
                  >
                    <div className="flex items-center gap-1">
                      {pt("brand")}
                      {sortField === "brand" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      )}
                    </div>
                  </th>
                  )}
                  {col("price") && (
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center gap-1">
                      {pt("price")}
                      {sortField === "price" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      )}
                    </div>
                  </th>
                  )}
                  {col("unit") && (
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {pt("unit")}
                  </th>
                  )}
                  {stockEnabled && col("quantity") && (
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center gap-1">
                      {pt("qty")}
                      {sortField === "quantity" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      )}
                    </div>
                  </th>
                  )}
                  {col("createdBy") && (
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                    onClick={() => handleSort("createdBy")}
                  >
                    <div className="flex items-center gap-1">
                      {pt("createdBy")}
                      {sortField === "createdBy" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      )}
                    </div>
                  </th>
                  )}
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {pt("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColCount} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      {pickLang(language, "Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColCount} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      {pickLang(language, "Məhsul tapılmadı", "No products found")}
                    </td>
                  </tr>
                ) : (
                paginatedProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`border-b border-gray-200 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/30"
                    }`}
                  >
                    {col("sku") && (
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {product.sku}
                    </td>
                    )}
                    {col("productName") && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
                          {product.image?.startsWith("http") || product.image?.startsWith("/") ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            product.image || "📦"
                          )}
                        </div>
                        <span className="text-xs text-gray-900 dark:text-white">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    )}
                    {col("category") && (
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {product.category}
                    </td>
                    )}
                    {col("brand") && (
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {product.brand}
                    </td>
                    )}
                    {col("price") && (
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {product.price} ₼
                    </td>
                    )}
                    {col("unit") && (
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {product.unit}
                    </td>
                    )}
                    {stockEnabled && col("quantity") && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                        {product.quantity}
                      </span>
                    </td>
                    )}
                    {col("createdBy") && (
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      <button
                        onClick={() => navigate("/staff")}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-[#14b8a6] dark:hover:text-[#14b8a6] hover:underline transition-colors"
                      >
                        {product.createdBy}
                      </button>
                    </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(product.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                        </button>

                        {canEdit && (
                        <button
                          onClick={() => handleEdit(product.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        )}

                        {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4">
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            showText={dataPaginationShowText((az, en, ru) => pickLang(language, az, en, ru))}
          />
        </div>

        {/* Import Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pt("importProducts")}
                </h2>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Download Demo File */}
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                    {pt("step1")}
                  </label>
                  <button
                    onClick={handleDownloadDemo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ccfbf1] dark:bg-[#14b8a6]/20 border border-[#b3c0ff] dark:border-[#14b8a6] rounded-lg text-sm font-medium text-[#14b8a6] dark:text-[#14b8a6] hover:bg-[#ccfbf1] dark:hover:bg-[#14b8a6]/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {pt("downloadDemoCSV")}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {pt("downloadDemoDesc")}
                  </p>
                </div>

                {/* Upload File */}
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                    {pt("step2")}
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">{pt("clickToUpload")}</span> {pt("dragAndDrop")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{pt("csvFiles")}</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx"
                        onChange={handleImportFileChange}
                        disabled={isImporting}
                      />
                    </label>
                  </div>
                </div>

                {/* Import Progress */}
                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{pt("importing")}</span>
                      <span className="font-medium text-[#14b8a6] dark:text-[#14b8a6]">
                        {importProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#14b8a6] h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isImporting ? "Importing..." : pt("close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pickLang(language, "Məhsulu sil", "Delete Product")}
                </h2>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      {pickLang(language, "Əminsiniz?", "Are you sure?")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pickLang(
                        language,
                        "Bu əməliyyat geri qaytarıla bilməz. Məhsul bazadan həmişəlik silinəcək.",
                        "This action cannot be undone. This will permanently delete the product from the database.",
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {pickLang(language, "Ləğv et", "Cancel")}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {pickLang(language, "Məhsulu sil", "Delete Product")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}