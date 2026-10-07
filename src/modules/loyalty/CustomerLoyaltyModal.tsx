import { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, Unlink, X } from "lucide-react";
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
import type { PeopleCustomer } from "../../app/api/people";
import { LoyaltyLedgerTable } from "./LoyaltyLedgerTable";
import { useLoyaltyCardScan } from "./useLoyaltyCardScan";

export function CustomerLoyaltyModal({
  customer,
  onClose,
  onChanged,
}: {
  customer: PeopleCustomer | null;
  onClose: () => void;
  onChanged?: () => void;
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

  const load = useCallback(async () => {
    if (!customer || !loyaltyOn || !canView || !(isAuthenticated || isDemo)) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      if (isDemo) {
        setData({
          customerId: customer.id,
          code: customer.code,
          name: customer.name,
          loyaltyCardBarcode: customer.loyaltyCardBarcode ?? null,
          walletBalance: customer.walletBalance ?? "0.00",
          hasAssignedRate: true,
          assignedRatePercent: "5.00",
          ledger: [],
        });
      } else {
        setData(await fetchCustomerLoyalty(customer.id));
      }
    } catch (err) {
      notifyFromError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [customer, loyaltyOn, canView, isAuthenticated, isDemo]);

  useEffect(() => {
    void load();
  }, [load]);

  const focusScanField = useCallback(() => {
    window.setTimeout(() => {
      const el = inputRef.current;
      if (!el || el.disabled) return;
      el.focus();
      el.select();
    }, 50);
  }, []);

  useEffect(() => {
    if (customer && canEdit && !loading) focusScanField();
  }, [customer, canEdit, loading, focusScanField]);

  const handleAssignCode = useCallback(
    async (code: string) => {
      if (!customer || !canEdit || isDemo) return;
      setSaving(true);
      try {
        await assignLoyaltyCard(customer.id, code);
        notifySuccess(tr("Kart təyin edildi", "Card assigned"));
        await load();
        onChanged?.();
        focusScanField();
      } catch (err) {
        notifyFromError(err);
        focusScanField();
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [customer, canEdit, isDemo, load, onChanged, language, focusScanField],
  );

  const { barcode, setBarcode, handleKeyDown, submitTyped } =
    useLoyaltyCardScan(handleAssignCode);

  const unassign = async () => {
    if (!customer || !canEdit || isDemo) return;
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
      await unassignLoyaltyCard(customer.id);
      notifySuccess(tr("Kart ayrıldı", "Card unassigned"));
      await load();
      onChanged?.();
      focusScanField();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!customer || !loyaltyOn || !canView) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        onMouseDown={(e) => {
          // Keep scan focus unless user clicks another control.
          const t = e.target as HTMLElement;
          if (t.closest("input,button,a,textarea,[role='button']")) return;
          e.preventDefault();
          focusScanField();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 shrink-0 text-[#14b8a6]" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Loyalty kart / cüzdan", "Loyalty card / wallet")}
              </h2>
            </div>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {customer.name} · {customer.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="py-6 text-center text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">
                    {tr("Barkod", "Barcode")}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-sm text-gray-900 dark:text-white">
                    {data?.loyaltyCardBarcode || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">
                    {tr("Balans", "Balance")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#14b8a6]">
                    {formatCurrency(Number(data?.walletBalance ?? 0))}
                  </p>
                </div>
              </div>

              {canEdit && (
                <div className="space-y-2">
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
                  {isDemo && (
                    <p className="text-[11px] text-gray-400">
                      {tr("Demo rejimində saxlanılmır", "Not persisted in demo mode")}
                    </p>
                  )}
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
    </div>
  );
}
