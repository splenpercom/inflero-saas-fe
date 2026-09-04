# Dining module (platform)

Staff routes under `/dashboard/restaurant/*` and public QR/book pages.

## Public URLs

- `/menu/:tenantSlug`
- `/menu/:tenantSlug/table/:tableId`
- `/book/:tenantSlug`
- `/book/:tenantSlug/:tableId`

## API wiring

Staff UI uses `/api/v1/tenant/dining/*` and sales POS helpers (`send-to-kot`, optional `tableId`).
Public UI uses `/api/v1/public/tenants/:slug/dining/*`.

Requires Hub tenant module **DINING** (implies POS). Branch scope is required for staff dining screens.

## LocalStorage

`lib/restaurantStorage.ts` remains for legacy types/helpers only. Live screens should use the API clients in `app/api/dining.ts` and `app/api/publicDining.ts`.
