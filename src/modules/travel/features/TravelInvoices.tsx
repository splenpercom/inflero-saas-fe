import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Search, Plus, FileText, FileSpreadsheet,
  Eye, Edit2, X, WalletCards,
  Send, DollarSign, Calendar, Loader2, Printer, Trash2,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { pickLang } from "../../../app/i18n/pickLang";
import type { Language } from "../../../app/i18n/translations";
import { useAuth } from "../../../app/context/AuthContext";
import { useModulePermissions } from "../../../app/hooks/useModulePermissions";
import { FilterSelect } from "../ui/filter-select";
import { MonthYearNav } from "../ui/MonthYearNav";
import { exportToExcel } from "../lib/exportExcel";
import {
  deleteOffer,
  fetchOfferInvoices,
  recordOfferStaffPayment,
  type OfferInvoice,
  type OfferInvoicePayment,
} from "../../../app/api/offers";
import { notifyError, notifyFromError, notifySuccess } from "../../../app/lib/toast";
import { useConfirm } from "../../../app/context/ConfirmContext";

// ─── Types (UI shape = API OfferInvoice) ─────────────────────────────────────

type Payment = OfferInvoicePayment;
type Invoice = OfferInvoice;

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_VALUES = ["", "cash", "bank", "card", "online"] as const;

const STATUS_BADGE = {
  paid:    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  partial: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  unpaid:  "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
};

const STATUS_LABEL_EN = { paid: "Paid", partial: "Partial", unpaid: "Unpaid" } as const;
const STATUS_LABEL_AZ = { paid: "Ödənilib", partial: "Qismən", unpaid: "Ödənilməyib" } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " AZN";
}

function toMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(d: string) {
  if (!d) return "—";
  try {
    return new Date(d.includes("T") ? d : `${d}T12:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function printInvoice(invoice: Invoice, language: Language) {
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const remaining = Math.max(0, invoice.amount - invoice.paid);
  const paidRows = invoice.payments.filter((p) => p.status === "paid");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${t("Hesab-faktura", "Invoice", "Счёт-фактура")} ${invoice.id}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}h1{color:#14b8a6;font-size:22px;margin-bottom:2px}.sub{color:#666;font-size:12px;margin-bottom:24px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#14b8a6;color:#fff;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}td{padding:7px 12px;border-bottom:1px solid #eee}.bold{font-weight:700;color:#14b8a6}.right{text-align:right}.footer{margin-top:40px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:12px}</style></head><body>
<h1>Inflero Travel</h1>
<div class="sub">${t("Hesab-faktura", "Invoice", "Счёт-фактура")} ${invoice.id} &mdash; ${new Date().toLocaleDateString()}</div>
<table><tr><th colspan="2">${t("Müştəri", "Client Information", "Информация о клиенте")}</th></tr>
<tr><td>${t("Ad", "Client", "Клиент")}</td><td class="bold">${invoice.clientName || "—"}</td></tr>
<tr><td>${t("Telefon", "Phone", "Телефон")}</td><td>${invoice.clientPhone || "—"}</td></tr>
<tr><td>${t("Ödəniş son tarixi", "Payment Deadline")}</td><td>${invoice.dueDate || "—"}</td></tr>
<tr><td>${t("Təklif", "Offer")}</td><td>${invoice.id} — ${invoice.offerTitle}</td></tr></table>
<table><tr><th>${t("Maliyyə", "Financial Summary", "Финансовая сводка")}</th><th class="right">AZN</th></tr>
<tr><td>${t("Satış qiyməti", "Sale Price")}</td><td class="right bold">${invoice.amount.toFixed(2)}</td></tr>
<tr><td>${t("Ödənilib", "Paid")}</td><td class="right">${invoice.paid.toFixed(2)}</td></tr>
<tr><td>${t("Qalıq", "Remaining")}</td><td class="right">${remaining.toFixed(2)}</td></tr></table>
${paidRows.length ? `<table><tr><th>${t("Tarix", "Date")}</th><th>${t("Metod", "Method")}</th><th class="right">${t("Məbləğ", "Amount")}</th><th>${t("Qeyd", "Note")}</th></tr>${paidRows.map((p) => `<tr><td>${p.date || "—"}</td><td>${p.method}</td><td class="right">${p.amount.toFixed(2)}</td><td>${p.notes || "—"}</td></tr>`).join("")}</table>` : ""}
<div class="footer">Inflero Travel Management System &mdash; ${new Date().getFullYear()}</div>
<script>window.onload=()=>window.print();</script></body></html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── WhatsApp Popup ───────────────────────────────────────────────────────────

function WAPopup({
  invoice, onClose, language, anchorEl,
}: {
  invoice: Invoice;
  onClose: () => void;
  language: Language;
  anchorEl: HTMLElement;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const remaining = Math.max(0, invoice.amount - invoice.paid);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const r = anchorEl.getBoundingClientRect();
      const width = 256; // w-64
      const gap = 6;
      const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
      const top = r.bottom + gap;
      setPos({ top, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorEl]);

  useEffect(() => {
    function h(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (anchorEl.contains(t)) return;
      onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose, anchorEl]);

  const message = pickLang(
    language,
    `Hörmətli ${invoice.clientName},\n\nSizin ödənişiniz barədə xatırlatma:\n\n📋 Faktura: ${invoice.id}\n✈️ Xidmət: ${invoice.offerTitle}\n💰 Ümumi məbləğ: ${fmt(invoice.amount)}\n✅ Ödənildi: ${fmt(invoice.paid)}\n⏳ Qalıq: ${fmt(remaining)}\n📅 Son tarix: ${formatDate(invoice.dueDate)}\n\nXahiş edirik ödənişi tamamlayasınız.\n\nInflero Travel komandası`,
    `Dear ${invoice.clientName},\n\nThis is a payment reminder:\n\n📋 Invoice: ${invoice.id}\n✈️ Service: ${invoice.offerTitle}\n💰 Total Amount: ${fmt(invoice.amount)}\n✅ Already Paid: ${fmt(invoice.paid)}\n⏳ Remaining Balance: ${fmt(remaining)}\n📅 Due Date: ${formatDate(invoice.dueDate)}\n\nPlease complete your payment at your earliest convenience.\n\nThank you,\nInflero Travel Team`,
    `Уважаемый(ая) ${invoice.clientName},\n\nНапоминание об оплате:\n\n📋 Счёт: ${invoice.id}\n✈️ Услуга: ${invoice.offerTitle}\n💰 Общая сумма: ${fmt(invoice.amount)}\n✅ Уже оплачено: ${fmt(invoice.paid)}\n⏳ Остаток: ${fmt(remaining)}\n📅 Срок оплаты: ${formatDate(invoice.dueDate)}\n\nПожалуйста, завершите оплату при первой возможности.\n\nС уважением,\nКоманда Inflero Travel`,
  );

  const cleanPhone = invoice.clientPhone.replace(/\D/g, "");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : null;

  if (!pos) return null;

  return createPortal(
    <div
      ref={ref}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[9999] w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3"
    >
      <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-700 rotate-45" />

      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">
        {pickLang(language, "Ödəniş xatırlatması", "Payment Reminder", "Напоминание об оплате")}
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
        {invoice.clientName} — {invoice.offerTitle}
      </p>
      <div className="flex items-center gap-1.5 mb-3 text-[11px]">
        <span className="text-gray-500 dark:text-gray-400">{pickLang(language, "Qalıq:", "Remaining:", "Остаток:")}</span>
        <span className="font-bold text-orange-500">{fmt(remaining)}</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span className="text-gray-500 dark:text-gray-400">{formatDate(invoice.dueDate)}</span>
      </div>

      {waUrl ? (
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[#25D366] hover:bg-[#1db954] text-white text-xs font-semibold transition-colors">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.527 5.851L.057 23.882l6.198-1.459A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.678.865.93-3.584-.234-.368A9.818 9.818 0 1 1 12 21.818z" />
          </svg>
          {pickLang(language, "WhatsApp ilə göndər", "Send via WhatsApp", "Отправить через WhatsApp")}
        </a>
      ) : (
        <p className="text-[11px] text-center text-red-500 py-2">
          {pickLang(language, "Telefon nömrəsi yoxdur", "No phone number on file", "Номер телефона не указан")}
        </p>
      )}
      <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-1.5">
        {invoice.clientPhone || "—"}
      </p>
    </div>,
    document.body,
  );
}

// ─── Add Payment Modal ────────────────────────────────────────────────────────

function AddPaymentModal({
  invoice, onClose, onRecord,
}: {
  invoice: Invoice;
  onClose: () => void;
  onRecord: (invoice: Invoice, payment: {
    amount: number;
    method: "cash" | "card" | "bank" | "online";
    date: string;
    notes: string;
  }) => Promise<void>;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const remaining = Math.max(0, invoice.amount - invoice.paid);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [date, setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes]   = useState("");
  const [saving, setSaving] = useState(false);

  function quickAmount(pct: number | "full") {
    const val = pct === "full" ? remaining : Math.round(invoice.amount * (pct / 100));
    setAmount(String(Math.min(val, remaining)));
  }

  async function handleRecord() {
    const a = parseFloat(amount);
    if (!a || a <= 0) {
      notifyError(tr("Məbləğ daxil edin", "Enter a valid amount"));
      return;
    }
    if (!method) {
      notifyError(tr("Ödəniş metodunu seçin", "Select a payment method"));
      return;
    }
    if (remaining <= 0) {
      notifyError(tr("Bu faktura artıq ödənilib", "This invoice is already paid"));
      return;
    }
    setSaving(true);
    try {
      await onRecord(invoice, {
        amount: Math.min(a, remaining),
        method: method as "cash" | "card" | "bank" | "online",
        date,
        notes,
      });
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Ödəniş Əlavə Et", "Add Payment")}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {tr("Ödənişi qeyd et:", "Record a payment for")}{" "}
              <span className="text-[#14b8a6] font-medium">{invoice.clientName}</span>
              {" · "}
              <span className="text-gray-400">{invoice.id}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{tr("Faktura məbləği", "Invoice Amount")}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{fmt(invoice.amount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{tr("Artıq ödənilib", "Already Paid")}</span>
              <span className="font-medium text-green-600 dark:text-green-400">{fmt(invoice.paid)}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">{tr("Qalıq Məbləğ", "Remaining Amount")}</span>
              <span className="font-bold text-orange-500 text-sm">{fmt(remaining)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {tr("Sürətli Məbləğ", "Quick Amount")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([25, 50, 75, "full"] as const).map((pct) => (
                <button key={pct} type="button" onClick={() => quickAmount(pct)}
                  className="py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#14b8a6] hover:text-[#14b8a6] font-medium transition-colors">
                  {pct === "full" ? tr("Tam", "Full") : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Ödəniş Məbləği (AZN)", "Payment Amount (AZN)")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="number" min="0" step="0.01" max={remaining}
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Ödəniş Metodu", "Payment Method")} <span className="text-red-500">*</span>
            </label>
            <FilterSelect
              value={method}
              onChange={setMethod}
              options={PAYMENT_METHOD_VALUES.map((value) => ({
                value,
                label:
                  value === ""
                    ? tr("Metod seçin...", "Select method...")
                    : value === "cash"
                      ? tr("Nağd", "Cash")
                      : value === "bank"
                        ? tr("Bank Transferi", "Bank Transfer")
                        : value === "card"
                          ? tr("Kart / POS", "Card / POS")
                          : tr("Online Transfer", "Online Transfer"),
              }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Ödəniş Tarixi", "Payment Date")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Qeydlər (İstəyə bağlı)", "Notes (Optional)")}
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder={tr("Bu ödəniş barədə qeyd əlavə edin...", "Add any notes about this payment...")}
              className={`${inp} resize-none`} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50">
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button type="button" onClick={() => void handleRecord()} disabled={saving || remaining <= 0}
            className="px-4 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? tr("Yadda saxlanır…", "Saving…") : tr("Ödənişi Qeyd Et", "Record Payment")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Invoice Modal ───────────────────────────────────────────────────────

function ViewInvoiceModal({
  invoice, onClose, onPrint,
}: {
  invoice: Invoice;
  onClose: () => void;
  onPrint: () => void;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const remaining = Math.max(0, invoice.amount - invoice.paid);
  const history = invoice.payments.filter((p) => p.status !== "cancelled");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.id}</h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[invoice.status]}`}>
              {pickLang(language, STATUS_LABEL_AZ[invoice.status], STATUS_LABEL_EN[invoice.status])}
            </span>
          </div>
          <button type="button" onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: tr("Müştəri", "Client"),       value: invoice.clientName  },
              { label: tr("Telefon", "Phone"),         value: invoice.clientPhone || "—" },
              { label: tr("Təklif", "Offer"),          value: `${invoice.id} — ${invoice.offerTitle}` },
              { label: tr("Səyahət tarixi", "Travel"), value: formatDate(invoice.saleDate) },
              { label: tr("Son tarix", "Due Date"),    value: formatDate(invoice.dueDate) },
              { label: tr("Məbləğ", "Total"),          value: fmt(invoice.amount) },
              { label: tr("Ödənilib", "Paid"),         value: fmt(invoice.paid)   },
              { label: tr("Status", "Offer status"),   value: String(invoice.offerStatus) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{value}</p>
              </div>
            ))}
          </div>
          {remaining > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">{tr("Qalıq məbləğ", "Remaining Balance")}</span>
              <span className="text-sm font-bold text-orange-500">{fmt(remaining)}</span>
            </div>
          )}
          {history.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr("Ödəniş Tarixçəsi", "Payment History")}</p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {[tr("Tarix", "Date"), tr("Məbləğ", "Amount"), tr("Metod", "Method"), tr("Status", "Status"), tr("Qeyd", "Note")].map(h => (
                        <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p, i) => (
                      <tr key={p.id} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{formatDate(p.date)}</td>
                        <td className="px-3 py-2 text-xs font-medium text-green-600 dark:text-green-400">{fmt(p.amount)}</td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{p.method}</td>
                        <td className="px-3 py-2 text-xs text-gray-500 capitalize">{p.status}</td>
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{p.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {history.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">{tr("Hələ ödəniş yoxdur.", "No payments recorded yet.")}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button type="button" onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
            <Printer className="w-3.5 h-3.5" />
            {tr("Çap et", "Print invoice")}
          </button>
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 font-medium transition-colors">
            {tr("Bağla", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TravelInvoices() {
  const { language } = useLanguage();
  const { isAuthenticated, isDemo } = useAuth();
  const navigate = useNavigate();
  const askConfirm = useConfirm();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Travel Invoices");
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => toMonthStr(new Date()));
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentModal, setPaymentModal]         = useState<Invoice | null>(null);
  const [viewModal, setViewModal]               = useState<Invoice | null>(null);
  const [waPopup, setWaPopup] = useState<{ offerId: string; el: HTMLElement } | null>(null);

  const load = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Load all invoices; month filter applied client-side so empty months still navigate cleanly.
      const items = await fetchOfferInvoices();
      setInvoices(items);
    } catch (err) {
      setInvoices([]);
      notifyFromError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDemo, canView]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRecordPayment(
    invoice: Invoice,
    payment: {
      amount: number;
      method: "cash" | "card" | "bank" | "online";
      date: string;
      notes: string;
    },
  ) {
    await recordOfferStaffPayment(invoice.offerId, {
      amount: payment.amount,
      method: payment.method,
      date: payment.date,
      notes: payment.notes || null,
    });
    notifySuccess(tr("Ödəniş qeyd edildi", "Payment recorded"));
    await load();
  }

  async function handleDelete(inv: Invoice) {
    const ok = await askConfirm({
      title: tr("Təklifi sil", "Delete offer invoice"),
      message: tr(
        `${inv.id} silinsin? Bu, əlaqəli təklifi də siləcək.`,
        `Delete ${inv.id}? This also soft-deletes the linked offer.`,
      ),
      confirmLabel: tr("Sil", "Delete"),
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteOffer(inv.offerId);
      notifySuccess(tr("Silindi", "Deleted"));
      await load();
    } catch (err) {
      notifyFromError(err);
    }
  }

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchMonth  = inv.month === currentMonth;
      const matchSearch = !search || `${inv.id} ${inv.clientName} ${inv.offerTitle} ${inv.offerId}`
        .toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchMonth && matchSearch && matchStatus;
    });
  }, [invoices, currentMonth, search, statusFilter]);

  const totalAmount    = filtered.reduce((s, i) => s + i.amount, 0);
  const totalPaid      = filtered.reduce((s, i) => s + i.paid,   0);
  const totalRemaining = totalAmount - totalPaid;

  if (!canView) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-6">
        <p className="text-sm text-gray-500">{tr("İcazə yoxdur", "No permission")}</p>
      </div>
    );
  }

  function printAllFiltered() {
    if (filtered.length === 0) {
      notifyError(tr("Çap üçün faktura yoxdur", "No invoices to print"));
      return;
    }
    if (filtered.length === 1) {
      printInvoice(filtered[0]!, language);
      return;
    }
    // Print a summary sheet for the month, then each invoice can be printed individually.
    const rows = filtered.map((inv) =>
      `<tr><td>${inv.id}</td><td>${inv.clientName}</td><td>${inv.offerTitle}</td><td class="right">${inv.amount.toFixed(0)}</td><td class="right">${inv.paid.toFixed(0)}</td><td class="right">${(inv.amount - inv.paid).toFixed(0)}</td><td>${inv.status}</td><td>${inv.dueDate || "—"}</td></tr>`,
    ).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${tr("Fakturalar", "Invoices")} ${currentMonth}</title>
<style>body{font-family:Arial,sans-serif;margin:32px;font-size:12px}h1{color:#14b8a6}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#14b8a6;color:#fff;padding:8px;text-align:left}td{padding:6px 8px;border-bottom:1px solid #eee}.right{text-align:right}</style></head><body>
<h1>Inflero Travel — ${formatMonthLabel(currentMonth)}</h1>
<p>${filtered.length} ${tr("faktura", "invoices", "счетов")} · ${tr("Ümumi", "Total")} ${totalAmount.toFixed(0)} AZN · ${tr("Ödənilib", "Paid")} ${totalPaid.toFixed(0)} AZN</p>
<table><tr><th>ID</th><th>${tr("Müştəri", "Client")}</th><th>${tr("Təklif", "Offer")}</th><th class="right">${tr("Məbləğ", "Amount")}</th><th class="right">${tr("Ödənilib", "Paid")}</th><th class="right">${tr("Qalıq", "Due")}</th><th>Status</th><th>${tr("Son tarix", "Due")}</th></tr>${rows}</table>
<script>window.onload=()=>window.print();</script></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">

        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Fakturalar", "Invoices")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr(
              "Təkliflərdən yaranan fakturalar və ödənişlər",
              "Invoices and payments derived from travel offers",
            )}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <MonthYearNav
            value={currentMonth}
            onChange={setCurrentMonth}
            language={language}
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void load()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
              title={tr("Yenilə", "Refresh")}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            </button>
            <button type="button" onClick={printAllFiltered}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
              title={tr("Çap et / PDF", "Print / PDF")}>
              <Printer className="w-3.5 h-3.5 text-red-500" />
            </button>
            <button type="button" onClick={() => exportToExcel(
              ["ID", tr("Müştəri", "Client"), tr("Telefon", "Phone"), tr("Təklif", "Offer"), tr("Məbləğ (AZN)", "Amount (AZN)"), tr("Ödənilib (AZN)", "Paid (AZN)"), tr("Qalıq (AZN)", "Remaining (AZN)"), "Status", tr("Son ödəniş tarixi", "Due Date"), tr("Yaradılma tarixi", "Created At"), tr("Ay", "Month")],
              filtered.map(inv => [inv.id, inv.clientName, inv.clientPhone, inv.offerTitle, inv.amount, inv.paid, inv.amount - inv.paid, inv.status, inv.dueDate, inv.createdAt, inv.month]),
              `invoices_${currentMonth}`
            )}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
            </button>
            {canCreate && (
            <button type="button" onClick={() => navigate("/dashboard/offers")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Təklif yarat", "+ Create offer")}</span>
            </button>
            )}
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: tr("Ümumi", "Total"),            value: fmt(totalAmount),    cls: "text-gray-900 dark:text-white"        },
              { label: tr("Ödənilib", "Collected"),     value: fmt(totalPaid),      cls: "text-green-600 dark:text-green-400"   },
              { label: tr("Qalıq", "Outstanding"),      value: fmt(totalRemaining), cls: "text-orange-500"                      },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-bold mt-0.5 ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Faktura ID, müştəri, təklif axtar...", "Search by invoice ID, client, offer...")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all",     label: tr("Bütün Statuslar", "All Status") },
                  { value: "paid",    label: tr("Ödənilib", "Paid")              },
                  { value: "partial", label: tr("Qismən", "Partial")             },
                  { value: "unpaid",  label: tr("Ödənilməyib", "Unpaid")         },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  {[
                    tr("FAKTURA ID",      "Invoice ID"),
                    tr("MÜŞTƏRİ",         "Client"),
                    tr("TƏKLİF",          "Offer"),
                    tr("MƏBLƏǧ",          "Amount"),
                    tr("ÖDƏNİLİB",        "Paid"),
                    tr("QALIQ",           "Remaining"),
                    tr("STATUS",          "Status"),
                    tr("SON TARİX",       "Due Date"),
                    tr("ƏMƏLİYYATLAR",   "Actions"),
                  ].map(h => (
                    <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-xs text-gray-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#14b8a6]" />
                        {tr("Yüklənir…", "Loading…")}
                      </span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                      {tr(
                        "Bu ay üçün təklif fakturası yoxdur. Təkliflər səhifəsindən yeni təklif yaradın.",
                        "No offer invoices for this month. Create an offer from the Offers page.",
                      )}
                    </td>
                  </tr>
                ) : filtered.map((inv, i) => {
                  const remaining = Math.max(0, inv.amount - inv.paid);
                  const paidPct   = inv.amount > 0 ? (inv.paid / inv.amount) * 100 : 0;

                  return (
                    <tr key={inv.offerId}
                      className={`border-b border-gray-200 dark:border-gray-800 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{inv.id}</span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (inv.customerId) navigate(`/dashboard/people/customers/${inv.customerId}`);
                          }}
                          className={`text-xs font-medium text-orange-500 hover:text-orange-600 ${inv.customerId ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {inv.clientName}
                        </button>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap max-w-[180px]">
                        <span className="text-xs font-medium text-orange-500 truncate block" title={inv.offerTitle}>
                          {inv.offerTitle}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {fmt(inv.amount)}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${inv.paid > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                          {fmt(inv.paid)}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap min-w-[130px]">
                        <span className={`text-xs font-medium block mb-1 ${remaining > 0 ? "text-orange-500" : "text-gray-400 dark:text-gray-500"}`}>
                          {fmt(remaining)}
                        </span>
                        {inv.status === "partial" && (
                          <div className="w-24 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${paidPct}%` }} />
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[inv.status]}`}>
                          {pickLang(language, STATUS_LABEL_AZ[inv.status], STATUS_LABEL_EN[inv.status])}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(inv.dueDate)}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button type="button" onClick={() => setViewModal(inv)}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
                            title={tr("Bax", "View")}>
                            <Eye className="w-3 h-3" />
                          </button>

                          <button type="button" onClick={() => printInvoice(inv, language)}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
                            title={tr("Çap et", "Print")}>
                            <Printer className="w-3 h-3" />
                          </button>

                          <button type="button" onClick={() => navigate("/dashboard/offers")}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
                            title={tr("Təkliflərdə redaktə", "Edit on Offers")}>
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {canEdit && inv.status !== "paid" && (
                            <button type="button" onClick={() => setPaymentModal(inv)}
                              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
                              title={tr("Ödəniş Əlavə Et", "Add Payment")}>
                              <WalletCards className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              const el = e.currentTarget;
                              setWaPopup((prev) =>
                                prev?.offerId === inv.offerId ? null : { offerId: inv.offerId, el },
                              );
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-[#25D366] hover:bg-[#1db954] border border-[#25D366] rounded-lg font-medium text-white transition-colors"
                            title={tr("WhatsApp Göndər", "Send WhatsApp")}>
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.527 5.851L.057 23.882l6.198-1.459A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.678.865.93-3.584-.234-.368A9.818 9.818 0 1 1 12 21.818z" />
                            </svg>
                          </button>

                          <button type="button"
                            onClick={() => {
                              if (inv.publicToken) window.open(`/offer-view/${inv.publicToken}`, "_blank");
                            }}
                            disabled={!inv.publicToken}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-40"
                            title={tr("Təklifi aç", "View Offer")}>
                            <Send className="w-3 h-3" />
                          </button>

                          {canDelete && (
                          <button type="button" onClick={() => void handleDelete(inv)}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
                            title={tr("Sil", "Delete")}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {paymentModal && (
        <AddPaymentModal
          invoice={paymentModal}
          onClose={() => setPaymentModal(null)}
          onRecord={handleRecordPayment}
        />
      )}
      {viewModal && (
        <ViewInvoiceModal
          invoice={viewModal}
          onClose={() => setViewModal(null)}
          onPrint={() => printInvoice(viewModal, language)}
        />
      )}
      {waPopup && (() => {
        const inv = invoices.find((x) => x.offerId === waPopup.offerId);
        if (!inv) return null;
        return (
          <WAPopup
            invoice={inv}
            language={language}
            anchorEl={waPopup.el}
            onClose={() => setWaPopup(null)}
          />
        );
      })()}
    </div>
  );
}
