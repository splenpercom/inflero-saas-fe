# OmniCashier client library

Browser-side Omni Tech fiscal integration for Inflero POS (**CASH + CARD** sale + money_back).

**Full review guide (backend + frontend):**  
[`SAAS/docs/omnicashier-implementation-guide.md`](../../../../docs/omnicashier-implementation-guide.md)

Vendor PDF: [`SAAS/docs/OmnicashierAPI_version_2_0_0.pdf`](../../../../docs/OmnicashierAPI_version_2_0_0.pdf)

## Modules

| File | Purpose |
| --- | --- |
| `client.ts` | HTTP POST to Omni `/v2` |
| `session.ts` | Login, shift, `prev_doc_number` |
| `allocatePaymentLines.ts` | Line nets; Omni **614**-safe price baking |
| `mapCardSale.ts` | PosOrder → sale document |
| `mapCardReturn.ts` | SalesReturn → money_back |
| `fiscalize.ts` | Orchestrate device call + `PATCH …/fiscal` |
| `charset.ts` | `itemName` allowlist |

Settings / connectivity live in `../omnicashierSettings.ts`.

## Tests

```powershell
cd SAAS/platform
npx tsx --test src/app/lib/omnicashier/allocatePaymentLines.test.ts
```
