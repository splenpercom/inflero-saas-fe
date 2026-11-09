import { Gift, X } from "lucide-react";
import type { LoyaltyBuyGetPreviewOffer } from "../../app/api/loyalty";

type ProductOption = { id: string; name: string; image?: string };

type Props = {
  open: boolean;
  offers: LoyaltyBuyGetPreviewOffer[];
  productsById: Map<string, ProductOption>;
  onPick: (offerId: string, productId: string) => void;
  onClose: () => void;
  tr: (az: string, en: string, ru?: string) => string;
};

export function LoyaltyFreePickerDialog({
  open,
  offers,
  productsById,
  onPick,
  onClose,
  tr,
}: Props) {
  if (!open) return null;
  const redeemable = offers.filter((o) => Number(o.redeemableFreeQty) > 0);
  if (redeemable.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[#14b8a6]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Pulsuz məhsul", "Free product")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={tr("Bağla", "Close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
          {redeemable.map((offer) => {
            const options = offer.allowedProductIds
              .map((id) => productsById.get(id))
              .filter((p): p is ProductOption => Boolean(p));
            return (
              <div key={offer.offerId}>
                <p className="mb-1 text-xs font-semibold text-gray-900 dark:text-white">
                  {offer.name}
                </p>
                <p className="mb-2 text-[11px] text-gray-500">
                  {tr("Pulsuz hüquq", "Free available")}: {offer.redeemableFreeQty}
                  {offer.progressMode === "ACCUMULATE"
                    ? ` · ${tr("Progress", "Progress")}: ${offer.progressValue}/${offer.buyThreshold}`
                    : ""}
                </p>
                {options.length === 0 ? (
                  <p className="text-[11px] text-amber-600">
                    {tr("Uyğun məhsul tapılmadı", "No matching products on POS")}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {options.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => onPick(offer.offerId, p.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-[#14b8a6] dark:border-gray-700"
                        >
                          <span className="truncate text-gray-900 dark:text-white">{p.name}</span>
                          <span className="shrink-0 text-[11px] font-semibold text-[#14b8a6]">
                            {tr("Pulsuz əlavə et", "Add free")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
