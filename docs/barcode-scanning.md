# Barcode scanning (POS + Product forms)

USB/HID **keyboard-wedge** scanners are the production path for shop POS and product barcode entry. Camera scanning was used during development only and has been removed from the UI.

---

## Goal

1. **POS:** Focus the search field → scan with the store gun → lookup → `addToCart` (beep + toast).
2. **Create / Edit Product:** Focus the Item Barcode field → scan (or Generate / type) → fills `itemBarcode`.

Lookup rule: exact match, trim, case-insensitive — **`itemBarcode` first, then `sku`**.

When STOCK + BRANCH_MANAGEMENT are enabled, lookup is scoped like the product list (active + stocked for the current branch). A code that exists elsewhere in the tenant but not at this branch returns **404**.

---

## Architecture

```
USB / Bluetooth wedge gun
   ──types code + Enter──►  POS search  OR  product barcode input
                                      │
                                      ▼
                         GET /tenant/inventory/products/lookup?code=
                                      │
                         POS → addToCart (+ stock checks, beep, toast)
                         Product form → setItemBarcode
```

**Important:** `jsbarcode` only **draws/prints** barcodes on Create/Edit. It cannot read a scanner. Wedge needs no camera library.

---

## Backend

### Endpoint

- `GET /tenant/inventory/products/lookup?code=`
- Auth + branch scope same as product list (see Goal).
- Match order: `itemBarcode` → `sku`.
- Returns list-shaped product fields (id, name, sku, price, quantity, …).
- **404** if not found; **409** `AMBIGUOUS_PRODUCT_CODE` if 2+ matches on the winning field; **429** if rate-limited.

### Key files

- `SAAS/backend/src/modules/inventory/inventory.routes.ts` — route before `:id`
- `SAAS/backend/src/modules/inventory/inventory.controller.ts` — rate limit
- `SAAS/backend/src/modules/inventory/inventory.service.ts` — `lookupProductByCode`
- `SAAS/backend/src/modules/inventory/product-lookup.ts` — pure resolver (+ unit tests)

---

## Platform

| File | Role |
|------|------|
| `platform/src/app/hooks/useBarcodeWedge.ts` | Rapid keys + Enter (or Enter on code-like field) → `onScan(code)` |
| `platform/src/app/api/inventory.ts` | `lookupProductByCode(code, { signal? })` |
| `platform/src/app/components/corporate/CorporatePOS.tsx` | Search field wedge → lookup → cart |
| `CreateProduct.tsx` / `EditProduct.tsx` | Barcode field wedge + Generate (jsbarcode) |

### Wedge behaviour

- Inter-key gap ~80ms resets buffer (human typing vs gun burst).
- Enter resolves code from buffer or field if length ≥ 4 and “code-like” (no spaces).
- `maxKeyGapMs` can be raised for slower CCD guns (e.g. 120–150).

### POS hardening

- Abort previous lookup only when a **different** code arrives; same code while in-flight → `"ignored"`.
- Same-code debounce ~**2000ms** after a lookup starts / succeeds.
- `addToCart` returns **boolean** (stock rejects do not fake success).
- Sequence counter ignores stale responses.
- Network / 404 / 409 / 429 surfaced via toasts.

### Demo mode

- `demoMocks.ts` mocks `/tenant/inventory/products/lookup` (barcode/sku; demo barcodes mirror SKU e.g. `PT001`).

---

## How stores should use this

| Method | What happens |
|--------|----------------|
| USB/Bluetooth barcode gun | Focus POS search → scan → product adds. Keep focus on search for the next item. |
| Product setup | Focus Item Barcode → scan with gun, or Generate + print CODE128. |

---

## Testing checklist

- [ ] Focus POS search → scan known `itemBarcode` or SKU → line adds (beep + toast).
- [ ] Rapid double-scan of the same code → only one cart increment.
- [ ] Stop backend mid-scan → network toast; manual SKU still usable.
- [ ] Two products with same `itemBarcode` → 409 ambiguous.
- [ ] Out-of-stock scan → warning, qty not increased.
- [ ] Create Product: gun fills barcode field; Generate still prints CODE128.
- [ ] `cd SAAS/backend && npm test` — product-lookup tests pass.

---

## Out of scope

- Camera / phone barcode scanning UI (removed; wedge only).
- Changing Generate to encode SKU/UUID (still random item barcode).
- Vendor-specific scanner SDKs / serial COM ports.
- Unique DB constraint on `(tenantId, itemBarcode)` (fail-closed at lookup for now).
- Per-branch UI for wedge `maxKeyGapMs`.

---

## Key takeaways

1. **Wedge is the shop path** — focus the field, scan, Enter terminates the code.
2. **jsbarcode ≠ scanner** — generate/print only.
3. **Never silently pick the first of duplicate barcodes** — fail closed with 409.
4. **Never let a stale lookup win** — abort + seq guard before `addToCart`.
