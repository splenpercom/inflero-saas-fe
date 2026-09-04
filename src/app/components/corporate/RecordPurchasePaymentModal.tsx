import { useEffect, useState } from "react";
import { X, CreditCard } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { recordPurchasePayment } from "../../api/purchases";
import { mapPaymentMethodToApi } from "../../lib/purchaseMappers";
import type { PosUiPaymentMethod } from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { pickLang } from "../../i18n/pickLang";

interface RecordPurchasePaymentModalProps {
  purchaseId: string | null;
  reference: string | null;
  due: number;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function RecordPurchasePaymentModal({
  purchaseId,
  reference,
  due,
  isOpen,
  onClose,
  onSaved,
}: RecordPurchasePaymentModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosUiPaymentMethod>("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPaymentAmount(due > 0 ? String(due) : "");
    setPaymentMethod("cash");
    setPaymentNote("");
    setPaymentReference("");
  }, [isOpen, due, purchaseId]);

  if (!isOpen || !purchaseId) return null;

  const amount = parseFloat(paymentAmount);
  const canSubmit = !saving && amount > 0 && amount <= due;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await recordPurchasePayment(purchaseId, {
        amount,
        method: mapPaymentMethodToApi(paymentMethod),
        note: paymentNote.trim() || null,
        reference: paymentReference.trim() || null,
      });
      notifySuccess(tr("Ödəniş qeydə alındı", "Payment recorded"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#14b8a6] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Ödəniş qeyd et", "Record payment")}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {reference ?? "—"} · {tr("Borc", "Due")}: ₼{due.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
              {tr("Məbləğ", "Amount")}
            </label>
            <input
              type="number"
              min={0}
              max={due}
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
              {tr("Ödəniş üsulu", "Payment method")}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PosUiPaymentMethod)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="cash">{tr("Nağd", "Cash")}</option>
              <option value="card">{tr("Kart", "Card")}</option>
              <option value="bank">{tr("Bank köçürməsi", "Bank transfer")}</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
              {tr("İstinad (istəyə bağlı)", "Reference (optional)")}
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
              {tr("Qeyd (istəyə bağlı)", "Note (optional)")}
            </label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSave()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] text-white disabled:opacity-50"
          >
            {saving ? tr("Qeyd edilir...", "Recording...") : tr("Ödənişi qeyd et", "Record payment")}
          </button>
        </div>
      </div>
    </div>
  );
}
