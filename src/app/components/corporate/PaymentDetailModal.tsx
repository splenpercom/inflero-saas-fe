import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import {
  fetchFinancePayment,
  updateFinancePayment,
  voidFinancePayment,
  type FinancePaymentRow,
} from "../../api/finance";
import { dateInputToIso, formatFinanceDate, parseFinanceMoney } from "../../lib/financeMappers";
import { DateInput } from "../ui/DateInput";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { pickLang } from "../../i18n/pickLang";

interface PaymentDetailModalProps {
  paymentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  canVoid?: boolean;
  onChanged?: () => void;
}

export function PaymentDetailModal({
  paymentId,
  isOpen,
  onClose,
  canEdit = false,
  canVoid = false,
  onChanged,
}: PaymentDetailModalProps) {
  const { language } = useLanguage();
  const { isDemo } = useAuth();
  const askConfirm = useConfirm();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [payment, setPayment] = useState<FinancePaymentRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [voidReason, setVoidReason] = useState("");

  useEffect(() => {
    if (!isOpen || !paymentId) {
      setPayment(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchFinancePayment(paymentId)
      .then((row) => {
        if (cancelled) return;
        setPayment(row);
        setNote(row.note ?? "");
        setReference(row.reference ?? "");
        setDate(row.date.slice(0, 10));
        setVoidReason("");
      })
      .catch((err) => {
        if (!cancelled) notifyFromError(err, tr("Ödəniş yüklənmədi", "Failed to load payment"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, paymentId]);

  if (!isOpen) return null;

  const isVoided = payment?.status === "VOIDED";
  const editable = canEdit && !isDemo && !isVoided;

  const handleSave = async () => {
    if (!payment || !editable) return;
    setSaving(true);
    try {
      const updated = await updateFinancePayment(payment.id, {
        note: note.trim() || null,
        reference: reference.trim() || null,
        date: date ? dateInputToIso(date) : undefined,
      });
      setPayment(updated);
      notifySuccess(tr("Ödəniş yeniləndi", "Payment updated"));
      onChanged?.();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async () => {
    if (!payment || !canVoid || isDemo || isVoided) return;
    if (
      !(await askConfirm({
        title: tr("Ödənişi ləğv et", "Void payment"),
        message: tr(
          "Bu ödəniş ləğv ediləcək. Məbləğ dəyişdirilə bilməz — səhv məbləğ üçün ləğv edib yenisini qeyd edin. Davam edilsin?",
          "This payment will be voided. Amounts cannot be edited — void and record a new payment if the amount was wrong. Continue?",
        ),
        variant: "danger",
      }))
    ) {
      return;
    }
    setVoiding(true);
    try {
      const updated = await voidFinancePayment(payment.id, {
        reason: voidReason.trim() || null,
      });
      setPayment(updated);
      notifySuccess(tr("Ödəniş ləğv edildi", "Payment voided"));
      onChanged?.();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setVoiding(false);
    }
  };

  const methodLabel = (m: string) => {
    const key = m.toUpperCase();
    if (key === "CASH") return tr("Nağd", "Cash");
    if (key === "CARD" || key === "CREDIT_CARD" || key === "DEBIT_CARD") return tr("Kart", "Card");
    if (key === "BANK_TRANSFER") return tr("Bank köçürməsi", "Bank transfer");
    return m.replace(/_/g, " ");
  };
  const targetLabel = (t: string | null) => {
    if (t === "PURCHASE") return tr("Satınalma", "Purchase");
    if (t === "PURCHASE_RETURN") return tr("Satınalma qaytarması", "Purchase return");
    if (t === "POS_ORDER") return tr("POS", "POS");
    if (t === "INVOICE") return tr("Faktura", "Invoice");
    if (t === "SALES_RETURN") return tr("Satış qaytarması", "Sales return");
    return "—";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Ödəniş detalları", "Payment details")}
            </h2>
            {payment ? (
              <p className="text-[11px] text-gray-500 mt-0.5">{payment.paymentNumber}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading || !payment ? (
            <p className="text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 mb-1">{tr("Status", "Status")}</p>
                  <span
                    className={
                      isVoided
                        ? "inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : "inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }
                  >
                    {isVoided ? tr("Ləğv edilib", "Voided") : tr("Keçirilib", "Posted")}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 mb-1">{tr("İstiqamət", "Direction")}</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {payment.direction === "OUT"
                      ? tr("Çıxış (ödəniş)", "Out (payment)")
                      : tr("Giriş (mədaxil)", "In (receipt)")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 mb-1">{tr("Məbləğ", "Amount")}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {parseFinanceMoney(payment.amount).toFixed(2)} AZN
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 mb-1">{tr("Üsul", "Method")}</p>
                  <p className="text-xs text-gray-900 dark:text-white">{methodLabel(payment.method)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 mb-1">{tr("Tərəf", "Party")}</p>
                  <p className="text-xs text-gray-900 dark:text-white">{payment.partyName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 mb-1">{tr("Sənəd", "Document")}</p>
                  <p className="text-xs text-gray-900 dark:text-white">
                    {targetLabel(payment.targetType)} · {payment.documentLabel}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">{tr("Tarix", "Date")}</label>
                {editable ? (
                  <DateInput
                    value={date}
                    onChange={setDate}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                  />
                ) : (
                  <p className="text-xs text-gray-900 dark:text-white">{formatFinanceDate(payment.date)}</p>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">{tr("İstinad", "Reference")}</label>
                {editable ? (
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-xs text-gray-900 dark:text-white">{payment.reference || "—"}</p>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">{tr("Qeyd", "Note")}</label>
                {editable ? (
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  />
                ) : (
                  <p className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap">
                    {payment.note || "—"}
                  </p>
                )}
              </div>

              {canVoid && !isDemo && !isVoided ? (
                <div>
                  <label className="text-[10px] uppercase text-gray-500 mb-1 block">
                    {tr("Ləğv səbəbi (istəyə bağlı)", "Void reason (optional)")}
                  </label>
                  <input
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder={tr("Məs: səhv məbləğ", "e.g. wrong amount")}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
          >
            {tr("Bağla", "Close")}
          </button>
          {editable ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg disabled:opacity-50"
            >
              {saving ? tr("Saxlanılır...", "Saving...") : tr("Saxla", "Save")}
            </button>
          ) : null}
          {canVoid && !isDemo && payment && !isVoided ? (
            <button
              type="button"
              disabled={voiding}
              onClick={() => void handleVoid()}
              className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              {voiding ? tr("Ləğv edilir...", "Voiding...") : tr("Ləğv et", "Void")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
