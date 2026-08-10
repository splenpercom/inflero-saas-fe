import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { cn } from "../ui/utils";
import type { StockAdjustmentRow } from "../../api/stock";
import { formatStockDate, branchLabel } from "../../lib/stockMappers";

import { pickLang } from "../../i18n/pickLang";
interface ViewAdjustmentModalProps {
  adjustment: StockAdjustmentRow | null;
  onClose: () => void;
}

export function ViewAdjustmentModal({ adjustment, onClose }: ViewAdjustmentModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  if (!adjustment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {tr("Tənzimləmə Məlumatları", "Adjustment Details")}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Məhsul", "Product")}
            </h3>
            <p className="text-sm text-gray-900 dark:text-white">{adjustment.productName}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {tr("Tənzimləmə", "Adjustment")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">{tr("Miqdar", "Quantity")}</p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    adjustment.qty > 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  {adjustment.qty > 0 ? "+" : ""}
                  {adjustment.qty}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{tr("Tarix", "Date")}</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatStockDate(adjustment.date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{tr("Filial", "Branch")}</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {branchLabel(adjustment.store)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{tr("Şəxs", "Person")}</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {adjustment.personName || "—"}
                </p>
              </div>
              {adjustment.customerName && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{tr("Müştəri", "Customer")}</p>
                  <p className="text-sm text-gray-900 dark:text-white">{adjustment.customerName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          >
            {tr("Bağla", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
