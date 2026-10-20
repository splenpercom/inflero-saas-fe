import React, { useState, useEffect, useRef } from "react";
import {
  Search, Plus, FileText, FileSpreadsheet, RefreshCw,
  Eye, Edit2, X, ChevronLeft, ChevronRight, WalletCards,
  Send, Check, DollarSign, Calendar, MessageSquare,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { FilterSelect } from "../ui/filter-select";
import { exportToExcel } from "../lib/exportExcel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
  notes: string;
}

interface Invoice {
  id: string;
  clientName: string;
  clientPhone: string;
  offerId: string;
  offerTitle: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: "paid" | "partial" | "unpaid";
  payments: Payment[];
  createdAt: string;
  month: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED: Invoice[] = [
  {
    id: "INV-001", clientName: "Aysel Cafarova",   clientPhone: "+994501112233",
    offerId: "#1",       offerTitle: "Istanbul Tour",
    amount: 3500, paid: 3500, dueDate: "2026-05-01", status: "paid",
    payments: [{ id: "p1", amount: 3500, method: "Cash",          date: "2026-04-28", notes: "" }],
    createdAt: "2026-04-20", month: "2026-05",
  },
  {
    id: "INV-002", clientName: "Emin Huseynov",    clientPhone: "+994552223344",
    offerId: "#2",       offerTitle: "Istanbul Tour",
    amount: 2100, paid: 1000, dueDate: "2026-05-10", status: "partial",
    payments: [{ id: "p1", amount: 1000, method: "Bank Transfer", date: "2026-04-30", notes: "" }],
    createdAt: "2026-04-25", month: "2026-05",
  },
  {
    id: "INV-003", clientName: "Nigar Aliyeva",    clientPhone: "+994513334455",
    offerId: "#3",       offerTitle: "Dubai Package",
    amount: 5800, paid: 0, dueDate: "2026-05-08", status: "unpaid",
    payments: [], createdAt: "2026-04-28", month: "2026-05",
  },
  {
    id: "INV-004", clientName: "Farid Gasimov",    clientPhone: "+994774445566",
    offerId: "#6",       offerTitle: "Antalya Resort",
    amount: 7200, paid: 0, dueDate: "2026-05-30", status: "unpaid",
    payments: [], createdAt: "2026-05-01", month: "2026-05",
  },
  {
    id: "INV-005", clientName: "Sevda Ismayilova", clientPhone: "+994505556677",
    offerId: "#5",       offerTitle: "Baku City Tour",
    amount: 1950, paid: 1950, dueDate: "2026-05-05", status: "paid",
    payments: [{ id: "p1", amount: 1950, method: "Card",          date: "2026-05-03", notes: "" }],
    createdAt: "2026-05-01", month: "2026-05",
  },
  {
    id: "INV-006", clientName: "Nigar Babayeva",   clientPhone: "+994514445566",
    offerId: "TRV-001",  offerTitle: "Istanbul Business Package",
    amount: 7650, paid: 5650, dueDate: "2026-09-10", status: "partial",
    payments: [{ id: "p1", amount: 5650, method: "Bank Transfer", date: "2026-08-25", notes: "" }],
    createdAt: "2026-08-15", month: "2026-09",
  },
  {
    id: "INV-007", clientName: "Anar Həsənov",     clientPhone: "+994501112233",
    offerId: "TRV-002",  offerTitle: "Dubai Luxury Package",
    amount: 10540, paid: 0, dueDate: "2026-09-15", status: "unpaid",
    payments: [], createdAt: "2026-08-28", month: "2026-09",
  },
  {
    id: "INV-008", clientName: "Leyla Əliyeva",    clientPhone: "+994552223344",
    offerId: "TRV-003",  offerTitle: "Antalya Premium",
    amount: 5270, paid: 5270, dueDate: "2026-08-31", status: "paid",
    payments: [{ id: "p1", amount: 5270, method: "Cash",          date: "2026-08-30", notes: "" }],
    createdAt: "2026-08-01", month: "2026-09",
  },
  // October 2026
  {
    id: "INV-009", clientName: "Nigar Babayeva",   clientPhone: "+994514445566",
    offerId: "TRV-001",  offerTitle: "Istanbul Business Package",
    amount: 7650, paid: 7650, dueDate: "2026-10-01", status: "paid",
    payments: [{ id: "p1", amount: 2000, method: "Bank Transfer", date: "2026-09-10", notes: "First installment" }, { id: "p2", amount: 5650, method: "Card / POS", date: "2026-09-28", notes: "Balance" }],
    createdAt: "2026-09-01", month: "2026-10",
  },
  {
    id: "INV-010", clientName: "Anar Həsənov",     clientPhone: "+994501112233",
    offerId: "TRV-002",  offerTitle: "Dubai Luxury Package",
    amount: 10540, paid: 5000, dueDate: "2026-10-15", status: "partial",
    payments: [{ id: "p1", amount: 5000, method: "Cash",           date: "2026-09-20", notes: "Advance" }],
    createdAt: "2026-09-15", month: "2026-10",
  },
  {
    id: "INV-011", clientName: "Rauf Quliyev",     clientPhone: "+994703334455",
    offerId: "TRV-010",  offerTitle: "Cappadocia Adventure",
    amount: 3800, paid: 0,     dueDate: "2026-10-05", status: "unpaid",
    payments: [], createdAt: "2026-09-28", month: "2026-10",
  },
  {
    id: "INV-012", clientName: "Sevinc Əhmədova",  clientPhone: "+994506667788",
    offerId: "TRV-011",  offerTitle: "Georgia Mountain Tour",
    amount: 2600, paid: 2600,  dueDate: "2026-10-08", status: "paid",
    payments: [{ id: "p1", amount: 2600, method: "Online",         date: "2026-10-07", notes: "" }],
    createdAt: "2026-10-01", month: "2026-10",
  },
  {
    id: "INV-013", clientName: "Elçin Nəsirov",    clientPhone: "+994775556677",
    offerId: "TRV-012",  offerTitle: "Baku City Tour Premium",
    amount: 1400, paid: 700,   dueDate: "2026-10-20", status: "partial",
    payments: [{ id: "p1", amount: 700, method: "Cash",            date: "2026-10-02", notes: "Half upfront" }],
    createdAt: "2026-10-01", month: "2026-10",
  },
  {
    id: "INV-014", clientName: "Farid Gasimov",    clientPhone: "+994774445566",
    offerId: "TRV-006",  offerTitle: "Antalya Resort All-Inclusive",
    amount: 9400, paid: 9400,  dueDate: "2026-10-10", status: "paid",
    payments: [{ id: "p1", amount: 9400, method: "Bank Transfer",  date: "2026-10-05", notes: "Full amount" }],
    createdAt: "2026-09-25", month: "2026-10",
  },
  {
    id: "INV-015", clientName: "Aysel Cafarova",   clientPhone: "+994501112233",
    offerId: "TRV-013",  offerTitle: "Rome & Venice Package",
    amount: 6200, paid: 3000,  dueDate: "2026-10-28", status: "partial",
    payments: [{ id: "p1", amount: 3000, method: "Card / POS",     date: "2026-10-12", notes: "Deposit" }],
    createdAt: "2026-10-10", month: "2026-10",
  },
  // June 2026
  {
    id: "INV-016", clientName: "Sevinc Əhmədova",  clientPhone: "+994506667788",
    offerId: "TRV-004",  offerTitle: "Tbilisi & Kazbegi Tour",
    amount: 1850, paid: 1850,  dueDate: "2026-06-10", status: "paid",
    payments: [{ id: "p1", amount: 1850, method: "Cash",           date: "2026-06-08", notes: "" }],
    createdAt: "2026-05-30", month: "2026-06",
  },
  {
    id: "INV-017", clientName: "Rauf Quliyev",     clientPhone: "+994703334455",
    offerId: "TRV-005",  offerTitle: "Prague City Break",
    amount: 4100, paid: 1500,  dueDate: "2026-06-18", status: "partial",
    payments: [{ id: "p1", amount: 1500, method: "Bank Transfer",  date: "2026-06-01", notes: "First payment" }],
    createdAt: "2026-05-25", month: "2026-06",
  },
  {
    id: "INV-018", clientName: "Nigar Babayeva",   clientPhone: "+994514445566",
    offerId: "TRV-007",  offerTitle: "Maldives Honeymoon",
    amount: 18500, paid: 0,    dueDate: "2026-06-25", status: "unpaid",
    payments: [], createdAt: "2026-06-01", month: "2026-06",
  },
  // July 2026
  {
    id: "INV-019", clientName: "Anar Həsənov",     clientPhone: "+994501112233",
    offerId: "TRV-008",  offerTitle: "Moscow Business Trip",
    amount: 4600, paid: 4600,  dueDate: "2026-07-10", status: "paid",
    payments: [{ id: "p1", amount: 4600, method: "Online",         date: "2026-07-09", notes: "Bank transfer" }],
    createdAt: "2026-06-28", month: "2026-07",
  },
  {
    id: "INV-020", clientName: "Leyla Əliyeva",    clientPhone: "+994552223344",
    offerId: "TRV-009",  offerTitle: "London Explorer",
    amount: 8700, paid: 4000,  dueDate: "2026-07-22", status: "partial",
    payments: [{ id: "p1", amount: 4000, method: "Card / POS",     date: "2026-07-05", notes: "Advance payment" }],
    createdAt: "2026-07-01", month: "2026-07",
  },
  {
    id: "INV-021", clientName: "Elçin Nəsirov",    clientPhone: "+994775556677",
    offerId: "TRV-012",  offerTitle: "Sharm El Sheikh Resort",
    amount: 3200, paid: 0,     dueDate: "2026-07-30", status: "unpaid",
    payments: [], createdAt: "2026-07-15", month: "2026-07",
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "",               label: "Select method..."   },
  { value: "Cash",           label: "Cash"               },
  { value: "Bank Transfer",  label: "Bank Transfer"      },
  { value: "Card / POS",     label: "Card / POS"         },
  { value: "Online",         label: "Online Transfer"    },
];

const STATUS_BADGE = {
  paid:    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  partial: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  unpaid:  "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
};

const STATUS_LABEL = { paid: "Paid", partial: "Partial", unpaid: "Unpaid" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " AZN";
}

function computeStatus(amount: number, paid: number): Invoice["status"] {
  if (paid <= 0) return "unpaid";
  if (paid >= amount) return "paid";
  return "partial";
}

function toMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return toMonthStr(d);
}

function formatDate(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; }
}

// ─── WhatsApp Popup ───────────────────────────────────────────────────────────

function WAPopup({
  invoice, onClose, language,
}: { invoice: Invoice; onClose: () => void; language: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const remaining = invoice.amount - invoice.paid;

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const isAz = language === "az";
  const message = isAz
    ? `Hörmətli ${invoice.clientName},\n\nSizin ödənişiniz barədə xatırlatma:\n\n📋 Faktura: ${invoice.id}\n✈️ Xidmət: ${invoice.offerTitle}\n💰 Ümumi məbləğ: ${fmt(invoice.amount)}\n✅ Ödənildi: ${fmt(invoice.paid)}\n⏳ Qalıq: ${fmt(remaining)}\n📅 Son tarix: ${formatDate(invoice.dueDate)}\n\nXahiş edirik ödənişi tamamlayasınız.\n\nInflero Travel komandası`
    : `Dear ${invoice.clientName},\n\nThis is a payment reminder:\n\n📋 Invoice: ${invoice.id}\n✈️ Service: ${invoice.offerTitle}\n💰 Total Amount: ${fmt(invoice.amount)}\n✅ Already Paid: ${fmt(invoice.paid)}\n⏳ Remaining Balance: ${fmt(remaining)}\n📅 Due Date: ${formatDate(invoice.dueDate)}\n\nPlease complete your payment at your earliest convenience.\n\nThank you,\nInflero Travel Team`;

  const cleanPhone = invoice.clientPhone.replace(/\D/g, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-1.5 z-[200] w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3">
      {/* Arrow */}
      <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-700 rotate-45" />

      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">
        {isAz ? "Ödəniş xatırlatması" : "Payment Reminder"}
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
        {invoice.clientName} — {invoice.offerTitle}
      </p>
      <div className="flex items-center gap-1.5 mb-3 text-[11px]">
        <span className="text-gray-500 dark:text-gray-400">{isAz ? "Qalıq:" : "Remaining:"}</span>
        <span className="font-bold text-orange-500">{fmt(remaining)}</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span className="text-gray-500 dark:text-gray-400">{formatDate(invoice.dueDate)}</span>
      </div>

      <a href={waUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[#25D366] hover:bg-[#1db954] text-white text-xs font-semibold transition-colors">
        {/* WhatsApp SVG icon */}
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.527 5.851L.057 23.882l6.198-1.459A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.678.865.93-3.584-.234-.368A9.818 9.818 0 1 1 12 21.818z" />
        </svg>
        {isAz ? "WhatsApp ilə göndər" : "Send via WhatsApp"}
      </a>
      <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-1.5">
        {invoice.clientPhone}
      </p>
    </div>
  );
}

// ─── Add Payment Modal ────────────────────────────────────────────────────────

function AddPaymentModal({
  invoice, onClose, onRecord,
}: {
  invoice: Invoice;
  onClose: () => void;
  onRecord: (invoiceId: string, payment: Payment) => void;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const remaining = invoice.amount - invoice.paid;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [date, setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes]   = useState("");

  function quickAmount(pct: number | "full") {
    const val = pct === "full" ? remaining : Math.round(invoice.amount * (pct / 100));
    setAmount(String(Math.min(val, remaining)));
  }

  function handleRecord() {
    const a = parseFloat(amount);
    if (!a || a <= 0) return alert(tr("Məbləğ daxil edin", "Enter a valid amount"));
    if (!method)      return alert(tr("Ödəniş metodunu seçin", "Select a payment method"));
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      amount: Math.min(a, remaining),
      method,
      date,
      notes,
    };
    onRecord(invoice.id, payment);
    onClose();
  }

  const inp = "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Ödəniş Əlavə Et", "Add Payment")}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {tr("Ödənişi qeyd et:", "Record a payment for")} <span className="text-[#14b8a6] dark:text-[#14b8a6] font-medium">{invoice.clientName}</span>
            </p>
          </div>
          <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Summary box */}
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

          {/* Quick Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {tr("Sürətli Məbləğ", "Quick Amount")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([25, 50, 75, "full"] as const).map((pct) => (
                <button key={pct} type="button" onClick={() => quickAmount(pct)}
                  className="py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#14b8a6] hover:text-[#14b8a6] dark:hover:border-[#14b8a6] dark:hover:text-[#14b8a6] font-medium transition-colors">
                  {pct === "full" ? tr("Tam", "Full") : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Ödəniş Məbləği (AZN)", "Payment Amount (AZN)")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="number" min="0" step="0.01" max={remaining}
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors" />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Ödəniş Metodu", "Payment Method")} <span className="text-red-500">*</span>
            </label>
            <FilterSelect value={method} onChange={setMethod} options={PAYMENT_METHODS} className="w-full" />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Ödəniş Tarixi", "Payment Date")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Qeydlər (İstəyə bağlı)", "Notes (Optional)")}
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder={tr("Bu ödəniş barədə qeyd əlavə edin...", "Add any notes about this payment...")}
              className={`${inp} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button onClick={handleRecord}
            className="px-4 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
            {tr("Ödənişi Qeyd Et", "Record Payment")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────

function CreateInvoiceModal({
  onClose, onSave, currentMonth,
}: {
  onClose: () => void;
  onSave: (inv: Invoice) => void;
  currentMonth: string;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);

  const [form, setForm] = useState({
    clientName: "", clientPhone: "", offerId: "", offerTitle: "",
    amount: "", dueDate: "",
  });

  const inp = "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";
  const lbl = "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1";

  function handleSave() {
    if (!form.clientName.trim()) return alert(tr("Müştəri adı daxil edin", "Enter client name"));
    if (!form.amount || parseFloat(form.amount) <= 0) return alert(tr("Məbləğ daxil edin", "Enter a valid amount"));
    const inv: Invoice = {
      id: `INV-${String(Date.now()).slice(-4)}`,
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim() || "+994 __",
      offerId: form.offerId.trim() || "—",
      offerTitle: form.offerTitle.trim() || "—",
      amount: parseFloat(form.amount),
      paid: 0,
      dueDate: form.dueDate,
      status: "unpaid",
      payments: [],
      createdAt: new Date().toISOString().split("T")[0],
      month: currentMonth,
    };
    onSave(inv);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Yeni Faktura", "Create Invoice")}
          </h2>
          <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{tr("Müştəri adı", "Client Name")} <span className="text-red-500">*</span></label>
              <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                placeholder={tr("Tam ad", "Full name")} className={inp} />
            </div>
            <div>
              <label className={lbl}>{tr("Telefon nömrəsi", "Phone Number")}</label>
              <input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                placeholder="+994 50 000 0000" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{tr("Təklif ID", "Offer ID")}</label>
              <input value={form.offerId} onChange={e => setForm(f => ({ ...f, offerId: e.target.value }))}
                placeholder="#1 / TRV-001" className={inp} />
            </div>
            <div>
              <label className={lbl}>{tr("Təklif başlığı", "Offer Title")}</label>
              <input value={form.offerTitle} onChange={e => setForm(f => ({ ...f, offerTitle: e.target.value }))}
                placeholder={tr("İstanbul Turu", "Istanbul Tour")} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{tr("Məbləğ (AZN)", "Amount (AZN)")} <span className="text-red-500">*</span></label>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00" className={inp} />
            </div>
            <div>
              <label className={lbl}>{tr("Son Ödəniş Tarixi", "Due Date")}</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className={inp} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button onClick={handleSave}
            className="px-4 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
            {tr("Faktura Yarat", "Create Invoice")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Invoice Modal ───────────────────────────────────────────────────────

function ViewInvoiceModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const remaining = invoice.amount - invoice.paid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.id}</h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[invoice.status]}`}>
              {STATUS_LABEL[invoice.status]}
            </span>
          </div>
          <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: tr("Müştəri", "Client"),       value: invoice.clientName  },
              { label: tr("Telefon", "Phone"),         value: invoice.clientPhone },
              { label: tr("Təklif", "Offer"),          value: `${invoice.offerId} — ${invoice.offerTitle}` },
              { label: tr("Son tarix", "Due Date"),    value: formatDate(invoice.dueDate) },
              { label: tr("Məbləğ", "Total"),          value: fmt(invoice.amount) },
              { label: tr("Ödənilib", "Paid"),         value: fmt(invoice.paid)   },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{value}</p>
              </div>
            ))}
          </div>
          {/* Remaining */}
          {remaining > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">{tr("Qalıq məbləğ", "Remaining Balance")}</span>
              <span className="text-sm font-bold text-orange-500">{fmt(remaining)}</span>
            </div>
          )}
          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr("Ödəniş Tarixi", "Payment History")}</p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {[tr("Tarix", "Date"), tr("Məbləğ", "Amount"), tr("Metod", "Method"), tr("Qeyd", "Note")].map(h => (
                        <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((p, i) => (
                      <tr key={p.id} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{formatDate(p.date)}</td>
                        <td className="px-3 py-2 text-xs font-medium text-green-600 dark:text-green-400">{fmt(p.amount)}</td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{p.method}</td>
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{p.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {invoice.payments.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">{tr("Hələ ödəniş yoxdur.", "No payments recorded yet.")}</p>
          )}
        </div>
        <div className="flex justify-end px-5 pb-5">
          <button onClick={onClose}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
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
  const tr = (az: string, en: string) => (language === "az" ? az : en);

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const stored = localStorage.getItem("inflero_travel_invoices");
      if (stored) return JSON.parse(stored);
    } catch {}
    return SEED;
  });

  const [currentMonth, setCurrentMonth] = useState(() => toMonthStr(new Date()));
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [paymentModal, setPaymentModal]         = useState<Invoice | null>(null);
  const [viewModal, setViewModal]               = useState<Invoice | null>(null);
  const [waPopup, setWaPopup]                   = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem("inflero_travel_invoices", JSON.stringify(invoices)); } catch {}
  }, [invoices]);

  function handleRecordPayment(invoiceId: string, payment: Payment) {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const newPaid = Math.min(inv.paid + payment.amount, inv.amount);
      return {
        ...inv,
        paid: newPaid,
        status: computeStatus(inv.amount, newPaid),
        payments: [...inv.payments, payment],
      };
    }));
  }

  function handleSaveInvoice(inv: Invoice) {
    setInvoices(prev => [inv, ...prev]);
  }

  function handleDelete(id: string) {
    if (confirm(tr("Bu fakturanı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this invoice?"))) {
      setInvoices(prev => prev.filter(i => i.id !== id));
    }
  }

  const filtered = invoices.filter(inv => {
    const matchMonth  = inv.month === currentMonth;
    const matchSearch = !search || `${inv.id} ${inv.clientName} ${inv.offerId} ${inv.offerTitle}`
      .toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchMonth && matchSearch && matchStatus;
  });

  // Summary stats
  const totalAmount    = filtered.reduce((s, i) => s + i.amount, 0);
  const totalPaid      = filtered.reduce((s, i) => s + i.paid,   0);
  const totalRemaining = totalAmount - totalPaid;

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Fakturalar (Səyahət)", "Invoices (Travel)")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Müştəri fakturalarını və ödənişləri idarə edin", "Manage client invoices and payments")}
          </p>
        </div>

        {/* Month Navigator + Create button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-1 py-1">
            <button onClick={() => setCurrentMonth(m => shiftMonth(m, -1))}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-xs font-semibold text-gray-800 dark:text-gray-200 min-w-[120px] text-center">
              {formatMonthLabel(currentMonth)}
            </span>
            <button onClick={() => setCurrentMonth(m => shiftMonth(m, 1))}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => alert(tr("PDF ixrac", "Export PDF coming soon"))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FileText className="w-3.5 h-3.5 text-red-500" />
            </button>
            <button onClick={() => exportToExcel(
              ["ID", tr("Müştəri", "Client"), tr("Telefon", "Phone"), tr("Təklif ID", "Offer ID"), tr("Təklif adı", "Offer Title"), tr("Məbləğ (AZN)", "Amount (AZN)"), tr("Ödənilib (AZN)", "Paid (AZN)"), tr("Qalıq (AZN)", "Remaining (AZN)"), "Status", tr("Son ödəniş tarixi", "Due Date"), tr("Yaradılma tarixi", "Created At"), tr("Ay", "Month")],
              filtered.map(inv => [inv.id, inv.clientName, inv.clientPhone, inv.offerId, inv.offerTitle, inv.amount, inv.paid, inv.amount - inv.paid, inv.status, inv.dueDate, inv.createdAt, inv.month]),
              `invoices_${currentMonth}`
            )}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
            </button>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Faktura Yarat", "+ Create Invoice")}</span>
            </button>
          </div>
        </div>

        {/* Summary stats */}
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

        {/* Filter bar */}
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

        {/* Table */}
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                      {tr("Bu ay üçün faktura tapılmadı.", "No invoices found for this month.")}
                    </td>
                  </tr>
                ) : filtered.map((inv, i) => {
                  const remaining = inv.amount - inv.paid;
                  const paidPct   = inv.amount > 0 ? (inv.paid / inv.amount) * 100 : 0;

                  return (
                    <tr key={inv.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}>

                      {/* Invoice ID */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{inv.id}</span>
                      </td>

                      {/* Client */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-orange-500 hover:text-orange-600 cursor-pointer">
                          {inv.clientName}
                        </span>
                      </td>

                      {/* Offer */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-orange-500">{inv.offerId}</span>
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {fmt(inv.amount)}
                      </td>

                      {/* Paid */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${inv.paid > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                          {fmt(inv.paid)}
                        </span>
                      </td>

                      {/* Remaining + progress bar */}
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

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[inv.status]}`}>
                          {STATUS_LABEL[inv.status]}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(inv.dueDate)}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* View */}
                          <button onClick={() => setViewModal(inv)}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title={tr("Bax", "View")}>
                            <Eye className="w-3 h-3" />
                          </button>

                          {/* Edit */}
                          <button onClick={() => alert(tr("Düzəliş tezliklə", "Edit coming soon"))}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title={tr("Redaktə", "Edit")}>
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {/* Add Payment */}
                          {inv.status !== "paid" && (
                            <button onClick={() => setPaymentModal(inv)}
                              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title={tr("Ödəniş Əlavə Et", "Add Payment")}>
                              <WalletCards className="w-3 h-3" />
                            </button>
                          )}

                          {/* WhatsApp — only if there's remaining balance */}
                          {remaining > 0 && (
                            <div className="relative">
                              <button
                                onClick={() => setWaPopup(waPopup === inv.id ? null : inv.id)}
                                className="flex items-center gap-1 px-2 py-1.5 text-xs bg-[#25D366] hover:bg-[#1db954] border border-[#25D366] rounded-lg font-medium text-white transition-colors"
                                title={tr("WhatsApp Göndər", "Send WhatsApp")}>
                                {/* WhatsApp icon */}
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.527 5.851L.057 23.882l6.198-1.459A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.678.865.93-3.584-.234-.368A9.818 9.818 0 1 1 12 21.818z" />
                                </svg>
                              </button>
                              {waPopup === inv.id && (
                                <WAPopup invoice={inv} language={language} onClose={() => setWaPopup(null)} />
                              )}
                            </div>
                          )}

                          {/* Send / View Offer */}
                          <button onClick={() => window.open(`/offer-view/${inv.offerId}`, "_blank")}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
                            title={tr("Təklifi Göndər", "View Offer")}>
                            <Send className="w-3 h-3" />
                          </button>
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

      {/* Modals */}
      {showCreateModal && (
        <CreateInvoiceModal
          currentMonth={currentMonth}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveInvoice}
        />
      )}
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
        />
      )}
    </div>
  );
}
