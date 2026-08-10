import { apiDelete, apiGet, apiPatch, apiPost, apiRequest } from "./client";
import { statusToApi, type UiStatus } from "../lib/inventoryMappers";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  status: UiStatus;
  createdAt: string;
  createdOn: string;
}

export interface SubCategoryRecord {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  categoryCode: string | null;
  description: string | null;
  image: string | null;
  status: UiStatus;
  createdAt: string;
  createdDate: string;
}

export interface BrandRecord {
  id: string;
  code: string;
  name: string;
  logo: string | null;
  status: UiStatus;
  createdAt: string;
  createdDate: string;
}

export interface UnitRecord {
  id: string;
  name: string;
  shortName: string;
  noOfProducts: number;
  status: UiStatus;
  createdAt: string;
  createdDate: string;
}

export interface VariantAttributeRecord {
  id: string;
  variant: string;
  values: string;
  status: UiStatus;
  createdAt: string;
  createdDate: string;
}

export interface ProductListItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  productType: "SINGLE" | "VARIABLE";
  image: string;
  category: string;
  brand: string;
  price: string;
  purchasePrice: string | null;
  unit: string;
  quantity: number;
  createdBy: string;
  createdById: string;
  status: UiStatus;
  quantityAlert: number | null;
  expiryDate: string | null;
}

export interface PagedProducts {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductStockRow {
  id: string;
  warehouseId: string | null;
  storeId: string | null;
  warehouse: string | null;
  store: string | null;
  quantity: number;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  categoryId: string | null;
  subCategoryId: string | null;
  subCategory: string | null;
  brandId: string | null;
  unitId: string | null;
  warrantyId: string | null;
  warranty: string | null;
  barcodeSymbology: string | null;
  itemBarcode: string | null;
  variantAttributeId: string | null;
  taxType: string | null;
  taxPercent: string | null;
  discountType: string | null;
  discountValue: string | null;
  manufacturer: string | null;
  manufacturedDate: string | null;
  images: string[];
  stocks: ProductStockRow[];
}

export type ProductListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: "ACTIVE" | "INACTIVE" | "all";
  sortBy?: "createdAt" | "name" | "sku" | "price" | "category" | "brand" | "createdBy";
  sortOrder?: "asc" | "desc";
};

export type ProductCreateBody = {
  sku?: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  productType?: "SINGLE" | "VARIABLE";
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  warrantyId?: string | null;
  barcodeSymbology?: string | null;
  itemBarcode?: string | null;
  price: string;
  purchasePrice?: string | null;
  taxType?: string | null;
  taxPercent?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  quantityAlert?: number | null;
  manufacturer?: string | null;
  manufacturedDate?: string | null;
  expiryDate?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  images?: string[];
  initialStocks?: { warehouseId?: string | null; storeId?: string | null; quantity: number }[];
  variantAttributeId?: string | null;
  variantAttributeName?: string | null;
  variantRows?: {
    variation: string;
    variantValue: string;
    sku: string;
    quantity: number;
    price: string;
    cogs: string;
    enabled?: boolean;
  }[];
};

export type ProductUpdateBody = Partial<ProductCreateBody> & {
  quantity?: number;
};

function productQueryString(q: ProductListQuery = {}): string {
  const params = new URLSearchParams();
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  if (q.search) params.set("search", q.search);
  if (q.categoryId) params.set("categoryId", q.categoryId);
  if (q.brandId) params.set("brandId", q.brandId);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.sortBy) params.set("sortBy", q.sortBy);
  if (q.sortOrder) params.set("sortOrder", q.sortOrder);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function fetchCategories() {
  const res = await apiGet<{ success: boolean; data: CategoryRecord[] }>("/tenant/inventory/categories");
  return res.data;
}

export async function createCategory(body: { name: string; status?: UiStatus; slug?: string }) {
  const res = await apiPost<{ success: boolean; data: CategoryRecord }>("/tenant/inventory/categories", {
    name: body.name,
    status: body.status ? statusToApi(body.status) : undefined,
    slug: body.slug,
  });
  return res.data;
}

export async function updateCategory(id: string, body: { name?: string; status?: UiStatus; slug?: string }) {
  const res = await apiPatch<{ success: boolean; data: CategoryRecord }>(
    `/tenant/inventory/categories/${id}`,
    {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.status !== undefined ? { status: statusToApi(body.status) } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
    },
  );
  return res.data;
}

export async function deleteCategory(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/inventory/categories/${id}`);
}

export async function fetchSubCategories() {
  const res = await apiGet<{ success: boolean; data: SubCategoryRecord[] }>(
    "/tenant/inventory/sub-categories",
  );
  return res.data;
}

export async function createSubCategory(body: {
  name: string;
  categoryId: string;
  categoryCode?: string;
  description?: string;
  status?: UiStatus;
}) {
  const res = await apiPost<{ success: boolean; data: SubCategoryRecord }>(
    "/tenant/inventory/sub-categories",
    { ...body, status: body.status ? statusToApi(body.status) : undefined },
  );
  return res.data;
}

export async function updateSubCategory(
  id: string,
  body: Partial<{ name: string; categoryId: string; description: string; status: UiStatus }>,
) {
  const res = await apiPatch<{ success: boolean; data: SubCategoryRecord }>(
    `/tenant/inventory/sub-categories/${id}`,
    { ...body, status: body.status ? statusToApi(body.status) : undefined },
  );
  return res.data;
}

export async function deleteSubCategory(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/inventory/sub-categories/${id}`);
}

export async function fetchBrands() {
  const res = await apiGet<{ success: boolean; data: BrandRecord[] }>("/tenant/inventory/brands");
  return res.data;
}

export async function createBrand(body: { name: string; code?: string; status?: UiStatus; logo?: string }) {
  const res = await apiPost<{ success: boolean; data: BrandRecord }>("/tenant/inventory/brands", {
    ...body,
    status: body.status ? statusToApi(body.status) : undefined,
  });
  return res.data;
}

export async function updateBrand(
  id: string,
  body: Partial<{ name: string; code: string; logo: string; status: UiStatus }>,
) {
  const res = await apiPatch<{ success: boolean; data: BrandRecord }>(`/tenant/inventory/brands/${id}`, {
    ...body,
    status: body.status ? statusToApi(body.status) : undefined,
  });
  return res.data;
}

export async function deleteBrand(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/inventory/brands/${id}`);
}

export async function fetchUnits() {
  const res = await apiGet<{ success: boolean; data: UnitRecord[] }>("/tenant/inventory/units");
  return res.data;
}

export async function createUnit(body: { name: string; shortName?: string; status?: UiStatus }) {
  const res = await apiPost<{ success: boolean; data: UnitRecord }>("/tenant/inventory/units", {
    ...body,
    status: body.status ? statusToApi(body.status) : undefined,
  });
  return res.data;
}

export async function updateUnit(
  id: string,
  body: Partial<{ name: string; shortName: string; status: UiStatus }>,
) {
  const res = await apiPatch<{ success: boolean; data: UnitRecord }>(`/tenant/inventory/units/${id}`, {
    ...body,
    status: body.status ? statusToApi(body.status) : undefined,
  });
  return res.data;
}

export async function deleteUnit(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/inventory/units/${id}`);
}

export async function fetchVariantAttributes() {
  const res = await apiGet<{ success: boolean; data: VariantAttributeRecord[] }>(
    "/tenant/inventory/variant-attributes",
  );
  return res.data;
}

export async function createVariantAttribute(body: {
  variant: string;
  values: string;
  status?: UiStatus;
}) {
  const res = await apiPost<{ success: boolean; data: VariantAttributeRecord }>(
    "/tenant/inventory/variant-attributes",
    { ...body, status: body.status ? statusToApi(body.status) : undefined },
  );
  return res.data;
}

export async function updateVariantAttribute(
  id: string,
  body: Partial<{ variant: string; values: string; status: UiStatus }>,
) {
  const res = await apiPatch<{ success: boolean; data: VariantAttributeRecord }>(
    `/tenant/inventory/variant-attributes/${id}`,
    { ...body, status: body.status ? statusToApi(body.status) : undefined },
  );
  return res.data;
}

export async function deleteVariantAttribute(id: string) {
  return apiDelete<{ success: boolean; message: string }>(
    `/tenant/inventory/variant-attributes/${id}`,
  );
}

export async function fetchProducts(query: ProductListQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PagedProducts }>(
    `/tenant/inventory/products${productQueryString(query)}`,
  );
  return res.data;
}

export async function fetchLowStockProducts(query: ProductListQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PagedProducts }>(
    `/tenant/inventory/products/low-stock${productQueryString(query)}`,
  );
  return res.data;
}

export async function fetchExpiredProducts(query: ProductListQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PagedProducts }>(
    `/tenant/inventory/products/expired${productQueryString(query)}`,
  );
  return res.data;
}

export async function fetchProduct(id: string) {
  const res = await apiGet<{ success: boolean; data: ProductDetail }>(
    `/tenant/inventory/products/${id}`,
  );
  return res.data;
}

export async function createProduct(body: ProductCreateBody) {
  const res = await apiPost<{ success: boolean; data: ProductDetail }>(
    "/tenant/inventory/products",
    body,
  );
  return res.data;
}

export async function updateProduct(id: string, body: ProductUpdateBody) {
  const res = await apiPatch<{ success: boolean; data: ProductDetail }>(
    `/tenant/inventory/products/${id}`,
    body,
  );
  return res.data;
}

export async function deleteProduct(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/inventory/products/${id}`);
}

export async function uploadProductImage(file: File, productId?: string) {
  const fd = new FormData();
  fd.append("file", file);
  const q = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  const res = await apiRequest<{ success: boolean; data: { url: string } }>(
    `/tenant/inventory/products/images${q}`,
    { method: "POST", body: fd },
  );
  return res.data.url;
}
