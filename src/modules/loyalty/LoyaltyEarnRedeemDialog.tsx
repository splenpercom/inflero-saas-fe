import { Award, Wallet } from "lucide-react";
import { formatCurrency } from "../../app/utils/currency";

export type LoyaltyDialogInfo = {
  customerName: string;
  walletBalance: number;
  hasAssignedRate: boolean;
  assignedRatePercent: number | null;
  earnPreview: number;
  redeemApply: number;
  redeemLeftover: number;
};

type Props = {
  open: boolean;
  info: LoyaltyDialogInfo | null;
  tr: (az: string, en: string, ru?: string) => string;
  onEarn: () => void;
  onRedeem: () => void;
  onSkip: () => void;
  onClose: () => void;
};

export function LoyaltyEarnRedeemDialog({
  open,
  info,
  tr,
  onEarn,
  onRedeem,
  onSkip,
  onClose,
}: Props) {
  if (!open || !info) return null;

  const canEarn = info.hasAssignedRate && info.earnPreview > 0;
  const canRedeem = info.redeemApply > 0;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loyalty-earn-redeem-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-[#14b8a6]" />
          <h2
            id="loyalty-earn-redeem-title"
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            {tr("Loyalty", "Loyalty")}
          </h2>
        </div>
        <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">{info.customerName}</p>
        <p className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Wallet className="h-3.5 w-3.5" />
          {tr("Balans", "Balance")}: {formatCurrency(info.walletBalance)}
        </p>

        {!info.hasAssignedRate && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {tr(
              "Cashback proqramı yoxdur — qazanma söndürülüb. Balans varsa istifadə edə bilərsiniz.",
              "No cashback program — earn is disabled. You can still redeem if there is a balance.",
            )}
          </p>
        )}

        <div className="space-y-2">
          <button
            type="button"
            disabled={!canEarn}
            onClick={onEarn}
            className="flex w-full flex-col items-start rounded-xl border border-gray-200 px-4 py-3 text-left hover:border-[#14b8a6] disabled:opacity-40 dark:border-gray-700"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {tr("Qazan (cashback)", "Earn cashback")}
            </span>
            <span className="text-xs text-gray-500">
              {info.hasAssignedRate
                ? tr(
                    `Bu satışdan ~${formatCurrency(info.earnPreview)} (${info.assignedRatePercent ?? 0}%)`,
                    `About ${formatCurrency(info.earnPreview)} from this sale (${info.assignedRatePercent ?? 0}%)`,
                  )
                : tr("Tarif təyin edilməyib", "No rate assigned")}
            </span>
          </button>

          <button
            type="button"
            disabled={!canRedeem}
            onClick={onRedeem}
            className="flex w-full flex-col items-start rounded-xl border border-gray-200 px-4 py-3 text-left hover:border-[#14b8a6] disabled:opacity-40 dark:border-gray-700"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {tr(
                `Cüzdanı tətbiq et (${formatCurrency(info.redeemApply)})`,
                `Apply wallet (${formatCurrency(info.redeemApply)})`,
              )}
            </span>
            <span className="text-xs text-gray-500">
              {tr(
                `Sonra balans: ${formatCurrency(info.redeemLeftover)} · bu satışda cashback yox`,
                `Balance after: ${formatCurrency(info.redeemLeftover)} · no earn on this sale`,
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="w-full rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
          >
            {tr("Heç biri / keç", "Neither / skip")}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
        >
          {tr("Bağla", "Close")}
        </button>
      </div>
    </div>
  );
}
