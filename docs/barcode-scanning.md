# Barcode scanning (POS + Product forms)

Documentation of the barcode scanning work added to the SAAS platform: goals, architecture, files touched, mobile/LAN setup, known camera limits, and how to test.

---

## Goal

1. **POS (primary in shops):** USB/HID keyboard-wedge scanners type a code + Enter → look up product → `addToCart`.
2. **POS (secondary):** Camera **Scan** for phones/tablets or when no gun is available.
3. **Create / Edit Product:** Scan (camera or wedge) fills `itemBarcode` next to Generate (jsbarcode CODE128 for print only).

Lookup rule: exact match, trim, case-insensitive — **`itemBarcode` first, then `sku`**.

---

## Architecture

```
USB gun  ──types code + Enter──►  POS search / product barcode input
Phone cam / webcam  ──decode──►  BarcodeScanModal → confirm → callback
                                      │
                                      ▼
                         GET /tenant/inventory/products/lookup?code=
                                      │
                         POS → addToCart (+ stock checks, beep, toast)
                         Product form → setItemBarcode
```

**Important:** `jsbarcode` only **draws/prints** barcodes. It cannot read a camera or a USB scanner. Decoding uses browser APIs / ZXing; wedge needs no library.

---

## Backend

### Endpoint

- `GET /tenant/inventory/products/lookup?code=`
- Auth + branch scope same as product list.
- Match order: `itemBarcode` → `sku`.
- Returns list-shaped product fields (id, name, sku, price, quantity, …).
- 404 if not found.

### Also

- Product list/search includes `itemBarcode` in search and list DTO.

### Key files

- `SAAS/backend/src/modules/inventory/inventory.routes.ts` — route before `:id`
- `SAAS/backend/src/modules/inventory/inventory.controller.ts`
- `SAAS/backend/src/modules/inventory/inventory.service.ts` — `lookupProductByCode`
- Validation schema for `code` query

---

## Platform API client

- `SAAS/platform/src/app/api/inventory.ts` — `lookupProductByCode(code)`
- `SAAS/platform/src/app/api/apiBase.ts` — resolves API base URL
  - In **Vite DEV**, uses same-origin **`/api/v1`** (proxied to backend) so:
    - Phones on LAN don’t call `localhost` on the phone
    - HTTPS frontend can call HTTP backend without mixed-content blocks

---

## Shared helpers / UI

| File | Role |
|------|------|
| `platform/src/app/hooks/useBarcodeWedge.ts` | Keyboard wedge: rapid keys + Enter (or Enter on code-like field value) → `onScan(code)` |
| `platform/src/app/components/ui/BarcodeScanModal.tsx` | Camera modal: preview, decode, user **Confirm / Rescan**, optional paste |

### Wedge behaviour

- Inter-key gap ~80ms resets buffer (human typing vs gun burst).
- Enter resolves code from buffer or field if length ≥ 4 and “code-like” (no spaces).
- Used on POS search and Create/Edit product barcode input.

### Camera modal (current UX)

- Detect → **add immediately** (no Confirm / Locking friction).
- Brief green “Scanned: …” flash; POS keeps the camera open for the next item (`continuous`).
- Soft filter: reject broken EAN-8/13 checksums only; internal CODE128 / 12-digit codes allowed.
- Same-code cooldown (~1.6s) to avoid double-adds.
- Manual type/paste + Enter still available.
- Requires HTTPS on LAN for mobile camera access.


Libraries involved over the iterations:

- `@zxing/browser` + `@zxing/library` — still used
- `html5-qrcode` — installed earlier; live path no longer depends on it
- `@ericblade/quagga2` — installed earlier; live path no longer uses Quagga (false positives)

---

## POS wiring

**File:** `platform/src/app/components/corporate/CorporatePOS.tsx`

- Search field: `useBarcodeWedge` → `lookupProductByCode` → `addToCart` → clear search; toast on success/failure.
- **Scan** button opens `BarcodeScanModal` with `continuous` (after confirm, can scan next).
- Stock / permission checks reuse existing `addToCart` behaviour.

---

## Create / Edit Product

**Files:** `CreateProduct.tsx`, `EditProduct.tsx`

- **Scan** beside **Generate**.
- Camera (single-shot after confirm) or wedge on the barcode input → `setItemBarcode` only.
- Generate still uses `jsbarcode` CODE128 for preview/print.

---

## Mobile / LAN development

Phones on the same Wi‑Fi were failing login (“failed to fetch”) and camera (“could not start”).

### Fixes

1. **Vite** `server.host: true` + **`@vitejs/plugin-basic-ssl`** → serve **`https://192.168.x.x:5173`**.
2. **Vite proxy** `/api` → `http://127.0.0.1:4000`.
3. **`resolveApiBaseUrl()`** in DEV returns `/api/v1`.
4. **Backend CORS** in non-production allows private LAN origins (`192.168.*`, `10.*`, `172.16–31.*`) over http and https.

### How to test on phone

1. Restart platform + backend.
2. Open the Vite **Network HTTPS** URL on the phone (accept certificate warning).
3. Allow camera when prompted.
4. Hold product barcode **~20–40 cm** away (too close → blur → wrong digits).

Windows Firewall may need to allow port **4000** / Vite port if the API proxy path still fails.

---

## Header / mobile UX (related while testing on phone)

- Language switcher was `hidden md:block` → shown on mobile (`CorporateHeader.tsx`).
- `SimpleDropdown` menus clamped to viewport edges so they don’t clip off-screen on narrow screens.

---

## How stores should use this in production

| Method | What happens |
|--------|----------------|
| USB barcode gun | Focus POS search → scan → product adds (no modal). |
| Phone camera | POS → Scan → hold label sharp → Confirm if code matches packaging. |
| Product setup | Generate or Scan into Item Barcode; print CODE128 with jsbarcode. |

Camera scanning is a **fallback / convenience**. Dedicated wedge scanners remain the reliable path for busy counters.

---

## Production hardening (busy counter)

### Lookup races (double-add)

POS barcode handler:

- Aborts the previous in-flight lookup via `AbortController` when a new scan starts.
- Ignores stale responses with a sequence counter.
- Debounces the **same** code within ~450ms (gun bounce / double Confirm).
- `lookupProductByCode(code, { signal })` passes the signal through `fetch`.

### Offline / network failure

- Network/`Failed to fetch` shows an explicit toast: check connection **or type SKU in search manually**.
- Aborted lookups are silent (not shown as errors).
- 404 / 409 / 429 still surface API messages via `notifyFromError`.

### Duplicate barcode / SKU

- Lookup uses `findMany(..., take: 2)` + pure `resolveExactLookup` (`product-lookup.ts`).
- Prefer **itemBarcode**, then **sku**.
- **2+ matches** on the winning field → **HTTP 409** `AMBIGUOUS_PRODUCT_CODE` (no silent first-match / wrong-item-sold).

### Rate limit

- Lookup controller: in-memory sliding window **40 requests / 10s per user** (`LOOKUP_RATE_LIMITED`).
- Sanity guard for accidental hammering; not a substitute for edge WAF if the API is internet-exposed.

### Wedge timing

- `useBarcodeWedge` accepts `maxKeyGapMs` (default **80**).
- Raise per stubborn CCD hardware (e.g. 120–150) without forking the helper.
- Branch/device UI config for this threshold is a follow-up.

### Automated tests

- `backend/src/modules/inventory/product-lookup.test.ts` — trim, barcode-before-sku, ambiguous barcode/sku, not_found.
- Included in `npm test` on the backend.

---

## Testing checklist

- [ ] Paste known `itemBarcode` or SKU in POS search + Enter → line adds.
- [ ] Rapid double-scan of the same code → only one cart increment (debounce / abort).
- [ ] Stop backend mid-scan → clear network toast; manual SKU search still usable.
- [ ] Two products with same `itemBarcode` → 409 ambiguous (no silent wrong item).
- [ ] Camera: valid EAN → Locking → Confirm → cart toast / add.
- [ ] Create Product: Scan sets barcode; Generate still prints CODE128.
- [ ] Phone over `https://LAN:5173` → login + camera permission work.
- [ ] `cd SAAS/backend && npm test` — product-lookup tests pass.

---

## Out of scope (intentionally)

- Changing Generate to encode SKU/UUID (still random item barcode).
- Vendor-specific scanner SDKs / serial COM ports.
- Replacing CODE128 labels with QR-only generation (camera can still read QR if present).
- Per-branch UI for wedge `maxKeyGapMs` (API option exists; settings screen later).

---

## Key takeaways

1. **Wedge ≠ camera** — shops mainly need Enter-terminated keyboard input + lookup API.
2. **jsbarcode ≠ scanner** — generate/print only.
3. **Mobile camera needs HTTPS** on LAN.
4. **Close-up phone cameras blur 1D barcodes** — software can filter bad checksums and require stable reads, but physics still matters; Confirm step is the safety net.
5. **Quagga** was too inaccurate for retail EAN on phone cams; native detector + ZXing + user confirm is the current approach.
6. **Never silently pick the first of duplicate barcodes** — fail closed with 409.
7. **Never let a stale lookup win** — abort + seq guard before `addToCart`.
