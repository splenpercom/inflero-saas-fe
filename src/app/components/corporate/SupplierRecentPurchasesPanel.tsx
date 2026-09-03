import { useState } from "react";
import { ChevronDown, ChevronUp, History, Loader2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatPurchaseDate } from "../../lib/purchaseMappers";
import { useSupplierRecentPurchases } from "../../hooks/useSupplierRecentPurchases";
import type { PurchaseListRow } from "../../api/purchases";

import { pickLang } from "../../i18n/pickLang";
interface SupplierRecentPurchasesPanelProps {
  supplierId: string;
  supplierName?: string;
  enabled: boolean;
  reusingPurchaseId: string | null;
  onView: (purchaseId: string) => void;
  onReuse: (purchase: PurchaseListRow) => void;
}

function statusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "received":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "ordered":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

export function SupplierRecentPurchasesPanel({
  supplierId,
  supplierName,
  enabled,
  reusingPurchaseId,
  onView,
  onReuse,
}: SupplierRecentPurchasesPanelProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [expanded, setExpanded] = useState(true);

  const { purchases, loading } = useSupplierRecentPurchases(supplierId, enabled);

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      Received: tr("Qəbul edildi", "Received"),
      Pending: tr("Gözləyir", "Pending"),
      Ordered: tr("Sifariş edildi", "Ordered"),
    };
    return map[status] ?? status;
  };

  if (!supplierId) return null;

  const title = supplierName
    ? tr(`${supplierName} — son satınalmalar`, `${supplierName} — recent purchases`)
    : tr("Son satınalmalar", "Recent purchases");

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors"
      >
        <History className="w-3.5 h-3.5 text-[#14b8a6] dark:text-blue-300 shrink-0" />
        <span className="flex-1 text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{title}</span>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
        ) : (
          <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
            {purchases.length}
          </span>
        )}
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {loading ? (
            <p className="px-3 py-2 text-[11px] text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
          ) : purchases.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-gray-500">
              {tr("Bu təchizatçı ilə əvvəlki satınalma yoxdur.", "No previous purchases with this supplier.")}
            </p>
          ) : (
            <ul className="max-h-36 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
              {purchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                >
                  <button
                    type="button"
                    disabled={reusingPurchaseId === purchase.id}
                    onClick={() => onReuse(purchase)}
                    className="min-w-0 flex-1 text-left disabled:opacity-60"
                  >
                    <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                      {formatPurchaseDate(purchase.date)}
                      {purchase.reference ? ` · ${purchase.reference}` : ""}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {purchase.productName}
                      {purchase.total > 0 ? ` · ₼${purchase.total.toFixed(2)}` : ""}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadgeClass(purchase.status)}`}
                    >
                      {translateStatus(purchase.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onView(purchase.id)}
                      className="text-[10px] font-medium text-[#14b8a6] dark:text-blue-300 hover:underline"
                    >
                      {tr("Bax", "View")}
                    </button>
                    <button
                      type="button"
                      disabled={reusingPurchaseId === purchase.id}
                      onClick={() => onReuse(purchase)}
                      className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-50"
                    >
                      {reusingPurchaseId === purchase.id
                        ? tr("Yüklənir...", "Loading...")
                        : tr("Təkrarla", "Reuse")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
