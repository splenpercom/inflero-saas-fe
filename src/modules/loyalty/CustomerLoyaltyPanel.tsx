import { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, Unlink } from "lucide-react";
import { useAuth } from "../../app/context/AuthContext";
import { useLanguage } from "../../app/i18n/LanguageContext";
import { pickLang } from "../../app/i18n/pickLang";
import { useModulePermissions } from "../../app/hooks/useModulePermissions";
import {
  assignLoyaltyCard,
  fetchCustomerLoyalty,
  unassignLoyaltyCard,
  type LoyaltyCustomerDetail,
} from "../../app/api/loyalty";
import { notifyFromError, notifySuccess } from "../../app/lib/toast";
import { useConfirm } from "../../app/context/ConfirmContext";
import { formatCurrency } from "../../app/utils/currency";
import { LoyaltyLedgerTable } from "./LoyaltyLedgerTable";
import { useLoyaltyCardScan } from "./useLoyaltyCardScan";

/** Inline loyalty card/wallet block for customer profile (no outer page chrome). */
export function CustomerLoyaltyPanel({
  customerId,
  onChanged,
}: {
  customerId: string;
  onChanged?: (summary: { loyaltyCardBarcode: string | null; walletBalance: string }) => void;
}) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const loyaltyOn = hasModule("LOYALTY");
  const { canView, canEdit } = useModulePermissions("Loyalty");
  const askConfirm = useConfirm();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [data, setData] = useState<LoyaltyCustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const load = useCallback(async () => {
    if (!loyaltyOn || !canView || !(isAuthenticated || isDemo)) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      if (isDemo) {
        setData({
          customerId,
          code: "—",
          name: "—",
          loyaltyCardBarcode: null,
          walletBalance: "0.00",
          hasAssignedRate: true,
          assignedRatePercent: "5.00",
          ledger: [],
        });
      } else {
        const detail = await fetchCustomerLoyalty(customerId);
        setData(detail);
        onChangedRef.current?.({
          loyaltyCardBarcode: detail.loyaltyCardBarcode,
          walletBalance: detail.walletBalance,
        });
      }
    } catch (err) {
      notifyFromError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [loyaltyOn, canView, isAuthenticated, isDemo, customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const focusScanField = useCallback(() => {
    window.setTimeout(() => {
      const el = inputRef.current;
      if (!el || el.disabled) return;
      el.focus();
      el.select();
    }, 30);
  }, []);

  useEffect(() => {
    if (loyaltyOn && canEdit && !loading) focusScanField();
  }, [loyaltyOn, canEdit, loading, customerId, focusScanField]);

  const handleAssignCode = useCallback(
    async (code: string) => {
      if (!canEdit || isDemo) return;
      setSaving(true);
      try {
        const result = await assignLoyaltyCard(customerId, code);
        notifySuccess(tr("Kart təyin edildi", "Card assigned"));
        await load();
        onChangedRef.current?.({
          loyaltyCardBarcode: result.loyaltyCardBarcode,
          walletBalance: result.walletBalance,
        });
        focusScanField();
      } catch (err) {
        notifyFromError(err);
        focusScanField();
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [canEdit, isDemo, customerId, load, language, focusScanField],
  );

  const { barcode, setBarcode, handleKeyDown, submitTyped } =
    useLoyaltyCardScan(handleAssignCode);

  const unassign = async () => {
    if (!canEdit || isDemo) return;
    const ok = await askConfirm({
      title: tr("Kartı ayır", "Unassign card"),
      message: tr(
        "Barkod azad olunacaq. Cüzdan balansı müştəridə qalır.",
        "Barcode will be freed. Wallet balance stays with the customer.",
      ),
      confirmLabel: tr("Ayır", "Unassign"),
    });
    if (!ok) return;
    setSaving(true);
    try {
      const result = await unassignLoyaltyCard(customerId);
      notifySuccess(tr("Kart ayrıldı", "Card unassigned"));
      await load();
      onChangedRef.current?.({
        loyaltyCardBarcode: result.loyaltyCardBarcode,
        walletBalance: result.walletBalance,
      });
      focusScanField();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!loyaltyOn || !canView) return null;

  return (
    <div
      className="h-full rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      onMouseDown={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("input,button,a,textarea,[role='button']")) return;
        e.preventDefault();
        focusScanField();
      }}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <CreditCard className="h-4 w-4 text-[#14b8a6]" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {tr("Loyalty", "Loyalty")}
        </h2>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  {tr("Barkod", "Barcode")}
                </p>
                <p className="mt-0.5 truncate font-mono text-sm text-gray-900 dark:text-white">
                  {data?.loyaltyCardBarcode || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  {tr("Balans", "Balance")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#14b8a6]">
                  {formatCurrency(Number(data?.walletBalance ?? 0))}
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-gray-500">
                  {tr(
                    "Barkod oxuyucunu bu sahəyə yönəldin və skan edin (Enter ilə).",
                    "Focus this field and scan with your barcode reader (ends with Enter).",
                  )}
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder={tr("Kart barkodunu skan edin", "Scan card barcode")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800"
                  disabled={saving || isDemo}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving || isDemo || !barcode.trim()}
                    onClick={() => submitTyped()}
                    className="flex-1 rounded-lg bg-[#14b8a6] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {data?.loyaltyCardBarcode
                      ? tr("Yenidən təyin et", "Reassign")
                      : tr("Təyin et", "Assign")}
                  </button>
                  {data?.loyaltyCardBarcode && (
                    <button
                      type="button"
                      disabled={saving || isDemo}
                      onClick={() => void unassign()}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs dark:border-gray-700"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                      {tr("Ayır", "Unassign")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {(data?.ledger?.length ?? 0) > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
                <p className="mb-2 text-[10px] font-medium uppercase text-gray-400">
                  {tr("Cüzdan tarixçəsi", "Wallet history")}
                </p>
                <LoyaltyLedgerTable entries={data!.ledger} compact />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
