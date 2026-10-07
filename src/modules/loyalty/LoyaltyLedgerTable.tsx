import { useNavigate } from "react-router";
import type { LoyaltyLedgerEntry } from "../../app/api/loyalty";
import { formatCurrency } from "../../app/utils/currency";
import { pickLang } from "../../app/i18n/pickLang";
import { useLanguage } from "../../app/i18n/LanguageContext";

function typeLabel(
  type: LoyaltyLedgerEntry["type"],
  tr: (az: string, en: string) => string,
) {
  if (type === "EARN") return tr("Cashback", "Cashback");
  if (type === "REDEEM") return tr("Redeem", "Redeem");
  return tr("Adjust", "Adjust");
}

function typeClass(type: LoyaltyLedgerEntry["type"]) {
  if (type === "EARN") return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900";
  if (type === "REDEEM") return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900";
  return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
}

export function LoyaltyLedgerTable({
  entries,
  compact = false,
}: {
  entries: LoyaltyLedgerEntry[];
  compact?: boolean;
}) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const tr = (az: string, en: string) => pickLang(language, az, en);

  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-gray-400">
        {tr("Hələ əməliyyat yoxdur", "No ledger entries yet")}
      </p>
    );
  }

  return (
    <div className={`overflow-x-auto ${compact ? "max-h-52" : "max-h-80"} overflow-y-auto`}>
      <table className="w-full min-w-[28rem]">
        <thead className="sticky top-0 bg-white dark:bg-gray-900">
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-gray-400">
              {tr("Tarix", "Date")}
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-gray-400">
              {tr("Növ", "Type")}
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-gray-400">
              {tr("Satış", "Sale")}
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-gray-400">
              {tr("Təfərrüat", "Detail")}
            </th>
            <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase text-gray-400">
              {tr("Məbləğ", "Amount")}
            </th>
            <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase text-gray-400">
              {tr("Balans", "Balance")}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const signed =
              e.type === "REDEEM"
                ? -Number(e.amount)
                : e.type === "EARN"
                  ? Number(e.amount)
                  : Number(e.amount);
            const when = new Date(e.createdAt);
            return (
              <tr
                key={e.id}
                className="border-b border-gray-50 last:border-0 dark:border-gray-800/60"
              >
                <td className="whitespace-nowrap px-2 py-2 text-[11px] text-gray-500">
                  {when.toLocaleDateString()}
                  <span className="ml-1 text-gray-400">
                    {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${typeClass(e.type)}`}
                  >
                    {typeLabel(e.type, tr)}
                  </span>
                </td>
                <td className="px-2 py-2 text-[11px]">
                  {e.order ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/dashboard/sales/pos-orders?orderId=${encodeURIComponent(e.order!.id)}`,
                        )
                      }
                      className="font-medium text-[#14b8a6] hover:underline"
                      title={tr("Sifarişə bax", "Open order")}
                    >
                      {e.order.reference}
                    </button>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                  {e.order && (
                    <div className="text-[10px] text-gray-400">
                      {tr("Satış", "Sale")}: {formatCurrency(Number(e.order.grandTotal))}
                    </div>
                  )}
                </td>
                <td className="max-w-[12rem] px-2 py-2 text-[11px] text-gray-600 dark:text-gray-400">
                  <span className="line-clamp-2" title={e.description || e.note || undefined}>
                    {e.description || e.note || "—"}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-2 py-2 text-right text-[11px] font-semibold ${
                    signed >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {signed >= 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(signed))}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right text-[11px] text-gray-700 dark:text-gray-300">
                  {formatCurrency(Number(e.balanceAfter))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
