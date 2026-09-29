import * as XLSX from "xlsx";
import {
  createBrand,
  createCategory,
  createProduct,
  createSubCategory,
  createUnit,
  fetchBrands,
  fetchCategories,
  fetchSubCategories,
  fetchUnits,
  type BrandRecord,
  type CategoryRecord,
  type ProductListItem,
  type SubCategoryRecord,
  type UnitRecord,
} from "../api/inventory";

/** Canonical spreadsheet columns matching create/edit product fields (export ↔ import). */
export const PRODUCT_FILE_COLUMNS = [
  "SKU",
  "Product Name",
  "Slug",
  "Description",
  "Product Type",
  "Category",
  "Sub Category",
  "Brand",
  "Unit",
  "Item Barcode",
  "Barcode Symbology",
  "Price",
  "Purchase Price",
  "Discount Type",
  "Discount Value",
  "Tax Type",
  "Tax Percent",
  "Quantity",
  "Quantity Alert",
  "Manufacturer",
  "Warranty",
  "Manufactured Date",
  "Expiry Date",
  "Status",
  "Images",
  "Created By",
] as const;

export type ProductFileColumn = (typeof PRODUCT_FILE_COLUMNS)[number];

export type ProductImportRow = {
  rowNumber: number;
  sku: string;
  name: string;
  slug: string;
  description: string;
  productType: string;
  category: string;
  subCategory: string;
  brand: string;
  unit: string;
  itemBarcode: string;
  barcodeSymbology: string;
  price: string;
  purchasePrice: string;
  discountType: string;
  discountValue: string;
  taxType: string;
  taxPercent: string;
  quantity: number | null;
  quantityAlert: number | null;
  manufacturer: string;
  warranty: string;
  manufacturedDate: string;
  expiryDate: string;
  status: string;
  images: string;
};

export type ProductImportFailure = {
  rowNumber: number;
  name: string;
  error: string;
};

export type ProductImportResult = {
  created: number;
  failed: ProductImportFailure[];
  skippedStock: number;
};

function cellStr(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

type ImportField = keyof Omit<ProductImportRow, "rowNumber">;

const HEADER_MAP: Record<string, ImportField> = {
  sku: "sku",
  productsku: "sku",
  name: "name",
  productname: "name",
  product: "name",
  slug: "slug",
  description: "description",
  desc: "description",
  producttype: "productType",
  type: "productType",
  category: "category",
  subcategory: "subCategory",
  subcategories: "subCategory",
  brand: "brand",
  unit: "unit",
  itembarcode: "itemBarcode",
  barcode: "itemBarcode",
  barcodesymbology: "barcodeSymbology",
  price: "price",
  purchaseprice: "purchasePrice",
  cost: "purchasePrice",
  discounttype: "discountType",
  discountvalue: "discountValue",
  discount: "discountValue",
  taxtype: "taxType",
  taxpercent: "taxPercent",
  tax: "taxPercent",
  quantity: "quantity",
  qty: "quantity",
  quantityalert: "quantityAlert",
  alertqty: "quantityAlert",
  manufacturer: "manufacturer",
  warranty: "warranty",
  manufactureddate: "manufacturedDate",
  mfgdate: "manufacturedDate",
  expirydate: "expiryDate",
  expiry: "expiryDate",
  status: "status",
  images: "images",
  image: "images",
  imageurls: "images",
};

function mapHeaderKey(header: string): ImportField | null {
  const key = normalizeHeader(header);
  if (!key || key === "createdby" || key === "createdbyid") return null;
  return HEADER_MAP[key] ?? null;
}

function dateOnly(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function joinImageUrls(images: string[] | undefined, fallback: string | undefined): string {
  if (images?.length) return images.join(" | ");
  return fallback?.trim() || "";
}

/** Map a list API product into a full spreadsheet row (create/edit field set). */
export function productToExportCells(
  product: ProductListItem,
  options?: { stockEnabled?: boolean },
): string[] {
  const stockEnabled = options?.stockEnabled !== false;
  const qty =
    stockEnabled && product.quantity != null && Number.isFinite(Number(product.quantity))
      ? String(product.quantity)
      : "";
  const qtyAlert =
    stockEnabled && product.quantityAlert != null ? String(product.quantityAlert) : "";

  const byHeader: Record<ProductFileColumn, string> = {
    SKU: product.sku ?? "",
    "Product Name": product.name ?? "",
    Slug: product.slug ?? "",
    Description: product.description ?? "",
    "Product Type": product.productType ?? "SINGLE",
    Category: product.category ?? "",
    "Sub Category": product.subCategory ?? "",
    Brand: product.brand ?? "",
    Unit: product.unitName?.trim() || product.unit || "",
    "Item Barcode": product.itemBarcode ?? "",
    "Barcode Symbology": product.barcodeSymbology ?? "",
    Price: product.price ?? "",
    "Purchase Price": product.purchasePrice ?? "",
    "Discount Type": product.discountType ?? "",
    "Discount Value": product.discountValue ?? "",
    "Tax Type": product.taxType ?? "",
    "Tax Percent": product.taxPercent ?? "",
    Quantity: qty,
    "Quantity Alert": qtyAlert,
    Manufacturer: product.manufacturer ?? "",
    Warranty: product.warranty ?? "",
    "Manufactured Date": dateOnly(product.manufacturedDate),
    "Expiry Date": dateOnly(product.expiryDate),
    Status: product.status ?? "",
    Images: joinImageUrls(product.images, product.image),
    "Created By": product.createdBy ?? "",
  };

  return PRODUCT_FILE_COLUMNS.map((col) => byHeader[col]);
}

export function buildProductExportAoA(
  products: ProductListItem[],
  options?: { stockEnabled?: boolean },
): string[][] {
  return [
    [...PRODUCT_FILE_COLUMNS],
    ...products.map((p) => productToExportCells(p, options)),
  ];
}

export function downloadProductExportXlsx(
  products: ProductListItem[],
  filename: string,
  options?: { stockEnabled?: boolean },
) {
  const aoa = buildProductExportAoA(products, options);
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Products");
  XLSX.writeFile(book, filename);
}

export function downloadProductExportCsv(
  products: ProductListItem[],
  filename: string,
  options?: { stockEnabled?: boolean },
) {
  const aoa = buildProductExportAoA(products, options);
  const escape = (cell: string) => `"${String(cell).replace(/"/g, '""')}"`;
  const csv = aoa.map((row) => row.map((c) => escape(c)).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadProductDemoCsv(options?: { stockEnabled?: boolean }) {
  const stockEnabled = options?.stockEnabled !== false;
  const demo: ProductListItem[] = [
    {
      id: "demo-1",
      sku: "PT009",
      name: "Demo Product 1",
      slug: "demo-product-1",
      description: "Sample imported product",
      productType: "SINGLE",
      category: "Electronics",
      subCategory: "Phones",
      brand: "Demo Brand",
      unit: "Pc",
      unitName: "Piece",
      itemBarcode: "1234567890123",
      barcodeSymbology: "",
      price: "100",
      purchasePrice: "70",
      discountType: "PERCENTAGE",
      discountValue: "5",
      taxType: null,
      taxPercent: null,
      quantity: stockEnabled ? 50 : null,
      quantityAlert: stockEnabled ? 5 : null,
      manufacturer: "Demo Mfg",
      warranty: "",
      manufacturedDate: "2026-01-15",
      expiryDate: null,
      status: "active",
      images: [],
      image: "",
      createdBy: "",
      createdById: "",
    },
    {
      id: "demo-2",
      sku: "PT010",
      name: "Demo Product 2",
      slug: "demo-product-2",
      description: "",
      productType: "SINGLE",
      category: "Computers",
      subCategory: "",
      brand: "Demo Brand",
      unit: "Pc",
      unitName: "Piece",
      itemBarcode: "",
      barcodeSymbology: "",
      price: "200",
      purchasePrice: null,
      discountType: null,
      discountValue: null,
      taxType: null,
      taxPercent: null,
      quantity: stockEnabled ? 30 : null,
      quantityAlert: null,
      manufacturer: null,
      warranty: "",
      manufacturedDate: null,
      expiryDate: "2027-12-31",
      status: "active",
      images: [],
      image: "",
      createdBy: "",
      createdById: "",
    },
  ];
  downloadProductExportCsv(demo, "demo_products.csv", { stockEnabled });
}

function parseOptionalInt(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number.parseInt(raw.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseOptionalNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw.trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function mapDiscountType(raw: string): "PERCENTAGE" | "FIXED" | null {
  const v = raw.trim().toUpperCase();
  if (!v) return null;
  if (v === "PERCENTAGE" || v === "PERCENT" || v === "%") return "PERCENTAGE";
  if (v === "FIXED" || v === "AMOUNT") return "FIXED";
  return null;
}

function mapTaxType(raw: string): "INCLUSIVE" | "EXCLUSIVE" | null {
  const v = raw.trim().toUpperCase();
  if (!v) return null;
  if (v === "INCLUSIVE" || v === "EXCLUSIVE") return v;
  return null;
}

function mapStatus(raw: string): "ACTIVE" | "INACTIVE" | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (v === "active") return "ACTIVE";
  if (v === "inactive") return "INACTIVE";
  return undefined;
}

function mapProductType(raw: string): "SINGLE" | "SERVICE" {
  const v = raw.trim().toUpperCase();
  if (v === "SERVICE") return "SERVICE";
  return "SINGLE";
}

function splitList(raw: string): string[] {
  return raw
    .split(/[|,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitSubCategories(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parse CSV or XLSX into normalized import rows (1-based data row numbers). */
export async function parseProductImportFile(file: File): Promise<ProductImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  if (!matrix.length) return [];

  const headerCells = (matrix[0] ?? []).map((c) => cellStr(c));
  const columnIndex: Partial<Record<ImportField, number>> = {};
  headerCells.forEach((header, idx) => {
    const mapped = mapHeaderKey(header);
    if (mapped && columnIndex[mapped] == null) columnIndex[mapped] = idx;
  });

  if (columnIndex.name == null) {
    throw new Error('Missing required column: "Product Name"');
  }
  if (columnIndex.category == null) {
    throw new Error('Missing required column: "Category"');
  }
  if (columnIndex.price == null) {
    throw new Error('Missing required column: "Price"');
  }

  const emptyRow = (): Omit<ProductImportRow, "rowNumber"> => ({
    sku: "",
    name: "",
    slug: "",
    description: "",
    productType: "",
    category: "",
    subCategory: "",
    brand: "",
    unit: "",
    itemBarcode: "",
    barcodeSymbology: "",
    price: "",
    purchasePrice: "",
    discountType: "",
    discountValue: "",
    taxType: "",
    taxPercent: "",
    quantity: null,
    quantityAlert: null,
    manufacturer: "",
    warranty: "",
    manufacturedDate: "",
    expiryDate: "",
    status: "",
    images: "",
  });

  const rows: ProductImportRow[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i] ?? [];
    const get = (field: ImportField) => {
      const idx = columnIndex[field];
      return idx == null ? "" : cellStr(cells[idx]);
    };
    const name = get("name");
    const category = get("category");
    const price = get("price");
    if (
      !name &&
      !category &&
      !price &&
      !get("sku") &&
      !get("brand") &&
      !get("unit") &&
      !get("quantity") &&
      !get("itemBarcode")
    ) {
      continue;
    }
    const base = emptyRow();
    rows.push({
      rowNumber: i + 1,
      ...base,
      sku: get("sku"),
      name,
      slug: get("slug"),
      description: get("description"),
      productType: get("productType"),
      category,
      subCategory: get("subCategory"),
      brand: get("brand"),
      unit: get("unit"),
      itemBarcode: get("itemBarcode"),
      barcodeSymbology: get("barcodeSymbology"),
      price,
      purchasePrice: get("purchasePrice"),
      discountType: get("discountType"),
      discountValue: get("discountValue"),
      taxType: get("taxType"),
      taxPercent: get("taxPercent"),
      quantity: parseOptionalInt(get("quantity")),
      quantityAlert: parseOptionalInt(get("quantityAlert")),
      manufacturer: get("manufacturer"),
      warranty: get("warranty"),
      manufacturedDate: get("manufacturedDate"),
      expiryDate: get("expiryDate"),
      status: get("status"),
      images: get("images"),
    });
  }
  return rows;
}

function findByName<T extends { id: string; name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.trim().toLowerCase();
  return list.find((item) => item.name.trim().toLowerCase() === needle);
}

type ResolveMaps = {
  categories: CategoryRecord[];
  brands: BrandRecord[];
  units: UnitRecord[];
  subCategories: SubCategoryRecord[];
};

async function ensureCategory(maps: ResolveMaps, name: string): Promise<string> {
  const existing = findByName(maps.categories, name);
  if (existing) return existing.id;
  const created = await createCategory({ name: name.trim(), status: "active" });
  maps.categories.push(created);
  return created.id;
}

async function ensureBrand(maps: ResolveMaps, name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = findByName(maps.brands, trimmed);
  if (existing) return existing.id;
  const created = await createBrand({ name: trimmed, status: "active" });
  maps.brands.push(created);
  return created.id;
}

async function ensureUnit(maps: ResolveMaps, name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = findByName(maps.units, trimmed);
  if (existing) return existing.id;
  const shortName = trimmed.slice(0, 16) || trimmed;
  const created = await createUnit({ name: trimmed, shortName, status: "active" });
  maps.units.push(created);
  return created.id;
}

async function ensureSubCategories(
  maps: ResolveMaps,
  categoryId: string,
  namesJoined: string,
): Promise<string[]> {
  const names = splitSubCategories(namesJoined);
  const ids: string[] = [];
  for (const name of names) {
    const existing = maps.subCategories.find(
      (s) =>
        s.categoryId === categoryId && s.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const created = await createSubCategory({
      name: name.trim(),
      categoryId,
      status: "active",
    });
    maps.subCategories.push(created);
    ids.push(created.id);
  }
  return ids;
}

export type RunProductImportOptions = {
  rows: ProductImportRow[];
  stockEnabled: boolean;
  branchId: string | null;
  onProgress?: (done: number, total: number) => void;
};

/** Create products from parsed rows; auto-creates missing category/brand/unit/sub-category by name. */
export async function runProductImport(
  options: RunProductImportOptions,
): Promise<ProductImportResult> {
  const { rows, stockEnabled, branchId, onProgress } = options;
  const maps: ResolveMaps = {
    categories: await fetchCategories(),
    brands: await fetchBrands(),
    units: await fetchUnits(),
    subCategories: await fetchSubCategories(),
  };

  let created = 0;
  let skippedStock = 0;
  const failed: ProductImportFailure[] = [];
  const total = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    try {
      if (!row.name.trim()) throw new Error("Product name is required");
      const productType = mapProductType(row.productType);
      if (productType !== "SERVICE" && !row.category.trim()) {
        throw new Error("Category is required");
      }
      if (!row.price.trim()) throw new Error("Price is required");
      const priceNum = parseOptionalNumber(row.price);
      if (priceNum == null || priceNum < 0) throw new Error("Invalid price");

      const categoryId =
        productType === "SERVICE" && !row.category.trim()
          ? null
          : await ensureCategory(maps, row.category);

      const brandId = await ensureBrand(maps, row.brand);
      const unitId = await ensureUnit(maps, row.unit);
      const subCategoryIds =
        categoryId && row.subCategory.trim()
          ? await ensureSubCategories(maps, categoryId, row.subCategory)
          : [];

      let initialStocks: { storeId: string; quantity: number }[] | undefined;
      if (stockEnabled && productType !== "SERVICE" && row.quantity != null && row.quantity > 0) {
        if (branchId) {
          initialStocks = [{ storeId: branchId, quantity: row.quantity }];
        } else {
          skippedStock += 1;
        }
      }

      const purchasePriceNum = parseOptionalNumber(row.purchasePrice);
      const discountType = mapDiscountType(row.discountType);
      const discountValueNum = parseOptionalNumber(row.discountValue);
      const taxPercentNum = parseOptionalNumber(row.taxPercent);
      const imageUrls = splitList(row.images);

      await createProduct({
        sku: row.sku.trim() || undefined,
        name: row.name.trim(),
        slug: row.slug.trim() || null,
        description: row.description.trim() || null,
        productType,
        categoryId,
        subCategoryIds,
        subCategoryId: subCategoryIds[0] ?? null,
        brandId,
        unitId,
        itemBarcode: row.itemBarcode.trim() || null,
        barcodeSymbology: row.barcodeSymbology.trim() || null,
        price: String(priceNum),
        purchasePrice: purchasePriceNum != null ? String(purchasePriceNum) : null,
        discountType,
        discountValue: discountValueNum != null ? String(discountValueNum) : null,
        taxType: mapTaxType(row.taxType),
        taxPercent: taxPercentNum != null ? String(taxPercentNum) : null,
        manufacturer: row.manufacturer.trim() || null,
        manufacturedDate: row.manufacturedDate.trim() || null,
        expiryDate: row.expiryDate.trim() || null,
        status: mapStatus(row.status),
        images: imageUrls.length ? imageUrls : undefined,
        ...(stockEnabled && productType !== "SERVICE"
          ? {
              quantityAlert: row.quantityAlert,
              ...(initialStocks ? { initialStocks } : {}),
            }
          : {}),
      });
      created += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push({
        rowNumber: row.rowNumber,
        name: row.name || `(row ${row.rowNumber})`,
        error: message,
      });
    }
    onProgress?.(i + 1, total);
  }

  return { created, failed, skippedStock };
}
