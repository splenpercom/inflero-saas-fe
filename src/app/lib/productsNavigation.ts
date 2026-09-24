/** Products list path (no trailing slash). */
export const PRODUCTS_LIST_PATH = "/dashboard/inventory/products";

const LIST_RETURN_STORAGE_KEY = "inflero-products-list-return";

/** True only for the products list URL (optional query), not detail/edit/create. */
export function isProductsListReturnPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== "string") return false;
  const pathname = path.split("?")[0].replace(/\/+$/, "");
  return pathname === PRODUCTS_LIST_PATH;
}

export function rememberProductsListReturn(path: string): void {
  if (!isProductsListReturnPath(path)) return;
  try {
    sessionStorage.setItem(LIST_RETURN_STORAGE_KEY, path);
  } catch {
    /* ignore */
  }
}

/** Prefer navigation state, then sessionStorage, else bare list path. Never returns a detail URL. */
export function resolveProductsListReturn(stateReturn?: string | null): string {
  if (isProductsListReturnPath(stateReturn)) return stateReturn as string;
  try {
    const stored = sessionStorage.getItem(LIST_RETURN_STORAGE_KEY);
    if (isProductsListReturnPath(stored)) return stored as string;
  } catch {
    /* ignore */
  }
  return PRODUCTS_LIST_PATH;
}
