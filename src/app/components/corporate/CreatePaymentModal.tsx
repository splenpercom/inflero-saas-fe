import { useState, useEffect } from "react";
import { X, Save, DollarSign, Calendar, CreditCard, FileText } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchPosOrder, type PosOrderDetail } from "../../api/sales";
import { notifyFromError } from "../../lib/toast";
import { DateInput } from "../ui/DateInput";

import { pickLang } from "../../i18n/pickLang";
export interface PaymentFormData {
  date: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  note: string;
}

export interface PaymentSummary {
  reference: string;
  customerName: string;
  grandTotal: number;
  paid: number;
  due: number;
}

interface CreatePaymentModalProps {
  orderId?: string | null;
  paymentSummary?: PaymentSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (paymentData: PaymentFormData) => Promise<void>;
}

export function CreatePaymentModal({
  orderId = null,
  paymentSummary = null,
  isOpen,
  onClose,
  onSaved,
}: CreatePaymentModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [order, setOrder] = useState<PosOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    paymentMethod: "Cash",
    reference: "",
    note: "",
  });

  useEffect(() => {
    if (!isOpen) {
      setOrder(null);
      return;
    }
    if (paymentSummary) {
      setOrder(null);
      setLoading(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        amount: paymentSummary.due > 0 ? paymentSummary.due : 0,
        paymentMethod: "Cash",
        reference: "",
        note: "",
      });
      return;
    }
    if (!orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    fetchPosOrder(orderId)
      .then((data) => {
        setOrder(data);
        const due = parseFloat(data.due);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          amount: due > 0 ? due : 0,
          paymentMethod: "Cash",
          reference: "",
          note: "",
        });
      })
      .catch((err) => {
        notifyFromError(err, tr("Sifariş yüklənə bilmədi", "Failed to load order"));
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, orderId, paymentSummary, language]);

  const summary: PaymentSummary | null = paymentSummary
    ? paymentSummary
    : order
      ? {
          reference: order.reference,
          customerName: order.customerName ?? "—",
          grandTotal: parseFloat(order.grandTotal),
          paid: parseFloat(order.paid),
          due: parseFloat(order.due),
        }
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary) return;
    const due = summary.due;
    if (formData.amount <= 0 || formData.amount > due) return;

    setSaving(true);
    try {
      await onSaved(formData);
      onClose();
    } catch {
      // parent shows error toast
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || (!orderId && !paymentSummary)) return null;

  const grandTotal = summary?.grandTotal ?? 0;
  const paid = summary?.paid ?? 0;
  const due = summary?.due ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tr("Ödəniş Yarat", "Create Payment")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary ? `${summary.reference} - ${summary.customerName}` : "—"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
        ) : !summary ? (
          <p className="p-6 text-center text-sm text-gray-500">{tr("Məlumat tapılmadı", "Details not found")}</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-4">
            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{tr("Ümumi Cəmi", "Total Amount")}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">₼{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{tr("Ödənilib", "Paid")}:</span>
                <span className="font-medium text-green-600 dark:text-green-400">₼{paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-600 dark:text-gray-400">{tr("Qalan Borc", "Remaining Due")}:</span>
                <span className="font-bold text-[#0026f6] dark:text-[#0026f6]">₼{due.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-3.5 h-3.5" />
                {tr("Ödəniş Tarixi", "Payment Date")}
              </label>
              <DateInput
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-3.5 h-3.5" />
                {tr("Məbləğ", "Amount")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={due}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 pr-12 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">₼</span>
              </div>
              {formData.amount > due && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {tr("Məbləğ borcdan çox ola bilməz", "Amount cannot exceed due amount")}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: due / 2 })}
                  className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {tr("Yarısı", "Half")}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: due })}
                  className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {tr("Tam Borc", "Full Due")}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CreditCard className="w-3.5 h-3.5" />
                {tr("Ödəniş Üsulu", "Payment Method")}
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                required
              >
                <option value="Cash">{tr("Nağd", "Cash")}</option>
                <option value="Card">{tr("Kart", "Card")}</option>
                <option value="Bank Transfer">{tr("Bank Transferi", "Bank Transfer")}</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-3.5 h-3.5" />
                {tr("İstinad Nömrəsi", "Reference Number")}
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                placeholder={tr("Ödəniş istinadı", "Payment reference")}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {tr("Qeyd", "Note")}
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] resize-none"
                placeholder={tr("Ödəniş haqqında qeyd əlavə edin...", "Add note about payment...")}
              />
            </div>
          </form>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={(e) => void handleSubmit(e)}
            disabled={loading || !summary || saving || formData.amount <= 0 || formData.amount > due}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? tr("Yaradılır...", "Creating...") : tr("Ödənişi Yarat", "Create Payment")}
          </button>
        </div>
      </div>
    </div>
  );
}
