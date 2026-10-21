/**
 * Travel Offers / Invoices / Documents panels for People → Customer profile.
 * Offers + docs by customerId from API; invoices stay localStorage mock.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FileText,
  Search,
  Send,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { useAuth } from "../../../app/context/AuthContext";
import {
  deleteOfferDocument,
  fetchOfferDocuments,
  fetchOffers,
  offerDocSideLabel,
  type OfferDocumentRow,
  type OfferStatusUi,
} from "../../../app/api/offers";
import { notifyFromError, notifySuccess } from "../../../app/lib/toast";
import { FilterSelect } from "../ui/filter-select";

export type CustomerTravelTab = "invoices" | "offers" | "documents";

interface FinancialRow {
  amount: string;
  currency: string;
  rate: string;
  date: string;
}

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

interface TravelOffer {
  id: string;
  displayCode: string;
  publicToken: string;
  saleType: string;
  saleDate: string;
  from: string;
  to: string;
  country: string;
  city: string;
  hotelName: string;
  numAdults: number;
  numChildren: number;
  salePrice: FinancialRow;
  clientName: string;
  status: OfferStatusUi;
  documentsSubmittedAt: string | null;
  createdAt: string;
}

const SEED_INVOICES: Invoice[] = [
  {
    id: "INV-006",
    clientName: "",
    clientPhone: "",
    offerId: "TRV-001",
    offerTitle: "Istanbul Business Package",
    amount: 7650,
    paid: 5650,
    dueDate: "2026-09-10",
    status: "partial",
    payments: [{ id: "p1", amount: 5650, method: "Bank Transfer", date: "2026-08-25", notes: "" }],
    createdAt: "2026-08-15",
    month: "2026-09",
  },
  {
    id: "INV-007",
    clientName: "",
    clientPhone: "",
    offerId: "TRV-002",
    offerTitle: "Dubai Luxury Package",
    amount: 10540,
    paid: 0,
    dueDate: "2026-09-15",
    status: "unpaid",
    payments: [],
    createdAt: "2026-08-28",
    month: "2026-09",
  },
  {
    id: "INV-008",
    clientName: "",
    clientPhone: "",
    offerId: "TRV-003",
    offerTitle: "Antalya Premium",
    amount: 5270,
    paid: 5270,
    dueDate: "2026-08-31",
    status: "paid",
    payments: [{ id: "p1", amount: 5270, method: "Cash", date: "2026-08-30", notes: "" }],
    createdAt: "2026-08-01",
    month: "2026-09",
  },
];

const INV_STATUS_BADGE: Record<Invoice["status"], string> = {
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  partial: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  unpaid: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
};

const OFFER_STATUS_BADGE: Record<OfferStatusUi, string> = {
  active: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  sent: "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50",
  inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600",
  expired: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
  accepted: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
  changing: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " AZN";
}
function calcAZN(row?: FinancialRow) {
  if (!row) return 0;
  return (parseFloat(row.amount) || 0) * (parseFloat(row.rate) || 1);
}
function formatDate(d: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
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
  return toMonthStr(new Date(y, mo - 1 + delta, 1));
}

const thCls =
  "text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2";
const tdCls = "px-3 py-2 text-xs text-gray-600 dark:text-gray-400";

export function CustomerTravelPanels({
  tab,
  customerId,
  customerName,
  customerPhone = "",
}: {
  tab: CustomerTravelTab;
  customerId: string;
  customerName: string;
  customerPhone?: string;
}) {
  const { language } = useLanguage();
  const { isAuthenticated, isDemo } = useAuth();
  const tr = (az: string, en: string) => (language === "az" ? az : en);

  const [currentMonth, setCurrentMonth] = useState(() => toMonthStr(new Date()));
  const [invSearch, setInvSearch] = useState("");
  const [invStatus, setInvStatus] = useState("all");
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [offerSearch, setOfferSearch] = useState("");
  const [offerStatus, setOfferStatus] = useState("all");
  const [allOffers, setAllOffers] = useState<TravelOffer[]>([]);
  const [offerDocs, setOfferDocs] = useState<OfferDocumentRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("inflero_travel_invoices");
      if (stored) {
        const list: Invoice[] = JSON.parse(stored);
        const forClient = list.filter(
          (inv) =>
            inv.clientName === customerName ||
            (!!customerPhone && inv.clientPhone.replace(/\D/g, "") === customerPhone.replace(/\D/g, "")),
        );
        setAllInvoices(
          forClient.length > 0
            ? forClient
            : SEED_INVOICES.map((inv) => ({
                ...inv,
                clientName: customerName,
                clientPhone: customerPhone,
              })),
        );
      } else {
        setAllInvoices(
          SEED_INVOICES.map((inv) => ({
            ...inv,
            clientName: customerName,
            clientPhone: customerPhone,
          })),
        );
      }
    } catch {
      setAllInvoices(
        SEED_INVOICES.map((inv) => ({
          ...inv,
          clientName: customerName,
          clientPhone: customerPhone,
        })),
      );
    }
  }, [customerName, customerPhone]);

  useEffect(() => {
    let cancelled = false;
    if (!(isAuthenticated || isDemo) || !customerId) {
      setAllOffers([]);
      return;
    }
    fetchOffers({ customerId, page: 1, pageSize: 100 })
      .then((res) => {
        if (cancelled) return;
        setAllOffers(
          (res.items || []).map((row) => ({
            id: row.id,
            displayCode: row.displayCode,
            publicToken: row.publicToken,
            saleType: row.saleType,
            saleDate: row.saleDate,
            from: row.from,
            to: row.to,
            country: row.country,
            city: row.city,
            hotelName: row.hotelName,
            numAdults: row.numAdults,
            numChildren: row.numChildren,
            salePrice: row.salePrice,
            clientName: row.clientName,
            status: row.status,
            documentsSubmittedAt: row.documentsSubmittedAt ?? null,
            createdAt: row.createdAt,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setAllOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, isAuthenticated, isDemo]);

  useEffect(() => {
    let cancelled = false;
    if (!(isAuthenticated || isDemo) || !customerId || tab !== "documents") {
      return;
    }
    setDocsLoading(true);
    fetchOfferDocuments({ customerId })
      .then((docs) => {
        if (!cancelled) setOfferDocs(docs);
      })
      .catch(() => {
        if (!cancelled) setOfferDocs([]);
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, isAuthenticated, isDemo, tab]);

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      const matchMonth = inv.month === currentMonth;
      const q = invSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.offerId.toLowerCase().includes(q) ||
        inv.offerTitle.toLowerCase().includes(q);
      const matchStatus = invStatus === "all" || inv.status === invStatus;
      return matchMonth && matchSearch && matchStatus;
    });
  }, [allInvoices, currentMonth, invSearch, invStatus]);

  const totalAmount = filteredInvoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = filteredInvoices.reduce((s, i) => s + i.paid, 0);
  const totalRemaining = totalAmount - totalPaid;

  const filteredOffers = useMemo(() => {
    return allOffers.filter((o) => {
      const q = offerSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.displayCode.toLowerCase().includes(q) ||
        o.hotelName.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.saleType.toLowerCase().includes(q) ||
        o.from.toLowerCase().includes(q) ||
        o.to.toLowerCase().includes(q);
      const matchStatus = offerStatus === "all" || o.status === offerStatus;
      return matchSearch && matchStatus;
    });
  }, [allOffers, offerSearch, offerStatus]);

  async function handleDeleteDoc(docId: string) {
    try {
      await deleteOfferDocument(docId);
      setOfferDocs((prev) => prev.filter((d) => d.id !== docId));
      setPreviewDocId((id) => (id === docId ? null : id));
      notifySuccess(tr("Sənəd silindi", "Document deleted"));
    } catch (err) {
      notifyFromError(err);
    }
  }

  if (tab === "invoices") {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1 py-1 dark:border-gray-800 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => shiftMonth(m, -1))}
              className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[120px] px-3 text-center text-xs font-semibold text-gray-800 dark:text-gray-200">
              {formatMonthLabel(currentMonth)}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => shiftMonth(m, 1))}
              className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {filteredInvoices.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: tr("Ümumi", "Total"), value: fmt(totalAmount), cls: "text-gray-900 dark:text-white" },
              { label: tr("Ödənilib", "Collected"), value: fmt(totalPaid), cls: "text-green-600 dark:text-green-400" },
              { label: tr("Qalıq", "Outstanding"), value: fmt(totalRemaining), cls: "text-orange-500" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`mt-0.5 text-sm font-bold ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder={tr("Faktura, təklif axtar...", "Search invoice, offer...")}
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <FilterSelect
              value={invStatus}
              onChange={setInvStatus}
              options={[
                { value: "all", label: tr("Bütün Statuslar", "All Status") },
                { value: "paid", label: tr("Ödənilib", "Paid") },
                { value: "partial", label: tr("Qismən", "Partial") },
                { value: "unpaid", label: tr("Ödənilməyib", "Unpaid") },
              ]}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  {[
                    tr("FAKTURA ID", "Invoice ID"),
                    tr("TƏKLİF", "Offer"),
                    tr("MƏBLƏĞ", "Amount"),
                    tr("ÖDƏNİLİB", "Paid"),
                    tr("QALIQ", "Remaining"),
                    tr("STATUS", "Status"),
                    tr("SON TARİX", "Due Date"),
                    tr("ƏMƏLİYYATLAR", "Actions"),
                  ].map((h) => (
                    <th key={h} className={thCls}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                      {tr("Bu ay faktura tapılmadı.", "No invoices found for this month.")}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, i) => {
                    const rem = inv.amount - inv.paid;
                    const pctPd = inv.amount > 0 ? (inv.paid / inv.amount) * 100 : 0;
                    return (
                      <tr
                        key={inv.id}
                        className={`border-b border-gray-200 dark:border-gray-800 ${
                          i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                        }`}
                      >
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{inv.id}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className="text-xs font-medium text-orange-500">{inv.offerId}</span>
                        </td>
                        <td className={`${tdCls} whitespace-nowrap font-medium`}>{fmt(inv.amount)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className={`text-xs font-medium ${inv.paid > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                            {fmt(inv.paid)}
                          </span>
                        </td>
                        <td className="min-w-[120px] whitespace-nowrap px-3 py-3">
                          <span className={`mb-1 block text-xs font-medium ${rem > 0 ? "text-orange-500" : "text-gray-400"}`}>
                            {fmt(rem)}
                          </span>
                          {inv.status === "partial" && (
                            <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div className="h-full rounded-full bg-orange-500" style={{ width: `${pctPd}%` }} />
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${INV_STATUS_BADGE[inv.status]}`}>
                            {inv.status === "paid" ? tr("Ödənilib", "Paid") : inv.status === "partial" ? tr("Qismən", "Partial") : tr("Ödənilməyib", "Unpaid")}
                          </span>
                        </td>
                        <td className={`${tdCls} whitespace-nowrap`}>{formatDate(inv.dueDate)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <button type="button" className="rounded-lg border border-gray-300 p-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-400" title={tr("Bax", "View")}>
                              <Eye className="h-3 w-3" />
                            </button>
                            <button type="button" className="rounded-lg border border-gray-300 p-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-400" title={tr("Redaktə", "Edit")}>
                              <Edit2 className="h-3 w-3" />
                            </button>
                            {inv.status !== "paid" && (
                              <button type="button" className="rounded-lg border border-gray-300 p-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-400" title={tr("Ödəniş Əlavə Et", "Add Payment")}>
                                <WalletCards className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              title={tr("Göndər", "Send Offer")}
                              onClick={() => window.open(`/offer-view/${inv.offerId}`, "_blank")}
                              className="rounded-lg border border-[#14b8a6] bg-[#14b8a6] hover:bg-[#0d9488] p-1.5 text-white"
                            >
                              <Send className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "offers") {
    return (
      <div>
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
                placeholder={tr("Otel, şəhər, növ axtar...", "Search hotel, city, type...")}
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <FilterSelect
              value={offerStatus}
              onChange={setOfferStatus}
              options={[
                { value: "all", label: tr("Bütün Statuslar", "All Status") },
                { value: "active", label: tr("Aktiv", "Active") },
                { value: "sent", label: tr("Göndərildi", "Sent") },
                { value: "inactive", label: tr("Aktiv deyil", "Inactive") },
                { value: "expired", label: tr("Müddəti bitib", "Expired") },
                { value: "accepted", label: tr("Qəbul edildi", "Accepted") },
                { value: "rejected", label: tr("Rədd edildi", "Rejected") },
                { value: "changing", label: tr("Dəyişiklik", "Changing") },
              ]}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  {[
                    tr("KOD", "CODE"),
                    tr("TƏYİNAT", "DESTINATION"),
                    tr("OTEL", "HOTEL"),
                    tr("NÖV", "TYPE"),
                    tr("TARİX", "DATE"),
                    tr("SATIŞ QİYMƏTİ", "SALE PRICE"),
                    tr("STATUS", "STATUS"),
                    tr("SƏNƏDLƏR", "DOCS"),
                    tr("ƏMƏLİYYATLAR", "ACTIONS"),
                  ].map((h) => (
                    <th key={h} className={thCls}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                      {tr("Təklif tapılmadı.", "No offers found.")}
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((o, i) => (
                    <tr
                      key={o.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="text-xs font-semibold text-[#14b8a6]">{o.displayCode || "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {o.from && o.to ? `${o.from} → ${o.to}` : o.from || o.to || "—"}
                        </span>
                      </td>
                      <td className={`${tdCls} max-w-[160px] truncate whitespace-nowrap`}>{o.hotelName || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="inline-flex items-center rounded border border-blue-300 bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-[#14b8a6]/50 dark:bg-[#14b8a6]/20 dark:text-[#14b8a6]">
                          {o.saleType}
                        </span>
                      </td>
                      <td className={`${tdCls} whitespace-nowrap`}>{o.saleDate}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">
                        {calcAZN(o.salePrice).toFixed(0)} AZN
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${OFFER_STATUS_BADGE[o.status]}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {o.documentsSubmittedAt ? (
                          <span className="inline-flex items-center rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                            {tr("Təqdim edilib", "Submitted")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const token = o.publicToken;
                              if (token) window.open(`/offer-view/${token}`, "_blank");
                            }}
                            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                            title={tr("Bax", "View")}
                            disabled={!o.publicToken}
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // documents — from TravelOfferDocument API (customerId)
  return (
    <div>
      <div className="mb-4 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {tr("Təklif sənədləri", "Offer documents")}
        </p>
        <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">{offerDocs.length}</p>
      </div>

      {docsLoading ? (
        <p className="py-8 text-center text-xs text-gray-500">{tr("Yüklənir…", "Loading…")}</p>
      ) : offerDocs.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-500">
          {tr("Bu müştəri üçün sənəd yoxdur.", "No documents for this customer.")}
        </p>
      ) : (
        <div className="space-y-4">
          {(() => {
            const order = ["Passport", "ID Card", "Insurance", "Visa", "Medical", "Other"];
            const groups = order
              .map((type) => ({
                type,
                docs: offerDocs.filter((d) => d.type === type),
              }))
              .filter((g) => g.docs.length > 0);
            const orphan = offerDocs.filter((d) => !order.includes(d.type));
            if (orphan.length) {
              const other = groups.find((g) => g.type === "Other");
              if (other) other.docs.push(...orphan);
              else groups.push({ type: "Other", docs: orphan });
            }

            return groups.map((group) => {
              const sides =
                group.type === "Passport"
                  ? (["bio", "extra"] as const)
                  : group.type === "ID Card"
                    ? (["front", "back"] as const)
                    : null;

              return (
                <section
                  key={group.type}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
                    <span className="text-xs font-bold text-[#14b8a6]">{group.type}</span>
                    <span className="text-[10px] text-gray-400">
                      {group.docs.length}{" "}
                      {tr("fayl", group.docs.length === 1 ? "file" : "files")}
                    </span>
                    {sides && (
                      <div className="ml-auto flex flex-wrap gap-1">
                        {sides.map((side) => {
                          const n = group.docs.filter((d) => d.side === side).length;
                          return (
                            <span
                              key={side}
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                                n > 0
                                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                              }`}
                            >
                              {offerDocSideLabel(group.type, side)}
                              {n > 0 ? ` · ${n}` : ""}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-3">
                    {(sides
                      ? sides.flatMap((side) => {
                          const sideDocs = group.docs.filter((d) => d.side === side);
                          if (!sideDocs.length) return [];
                          return [
                            <div key={side} className="space-y-2">
                              <span className="inline-flex items-center rounded-md border border-[#14b8a6]/30 bg-[#14b8a6]/10 px-2 py-0.5 text-[10px] font-semibold text-[#14b8a6]">
                                {offerDocSideLabel(group.type, side)}
                              </span>
                              {sideDocs.map((doc) => {
                                const isImage = doc.contentType.startsWith("image/");
                                const isPdf =
                                  doc.contentType.includes("pdf") || /\.pdf$/i.test(doc.fileName);
                                const open = previewDocId === doc.id;
                                return (
                                  <div
                                    key={doc.id}
                                    className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
                                          {isImage ? (
                                            <img src={doc.url} alt="" className="h-full w-full object-cover" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-[#14b8a6]" />
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                                            {doc.fileName}
                                          </p>
                                          <p className="text-[10px] text-gray-400">
                                            {doc.offerDisplayCode ? (
                                              <button
                                                type="button"
                                                className="mr-1.5 font-medium text-[#14b8a6] hover:underline"
                                                onClick={() => {
                                                  if (doc.offerPublicToken) {
                                                    window.open(`/offer-view/${doc.offerPublicToken}`, "_blank");
                                                  }
                                                }}
                                              >
                                                {doc.offerDisplayCode}
                                              </button>
                                            ) : null}
                                            {tr("Yüklənib", "Uploaded")}{" "}
                                            {formatDate(doc.createdAt.slice(0, 10))}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1.5">
                                        {(isImage || isPdf) && (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewDocId(open ? null : doc.id)}
                                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                          >
                                            <Eye className="h-3 w-3" />
                                            {open ? tr("Gizlət", "Hide") : tr("Bax", "View")}
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => void handleDeleteDoc(doc.id)}
                                          className="rounded-lg border border-gray-200 bg-gray-50 p-1.5 text-red-500 dark:border-gray-700 dark:bg-gray-800"
                                          title={tr("Sil", "Delete")}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                    {open && (isImage || isPdf) && (
                                      <div className="border-t border-gray-100 dark:border-gray-800">
                                        {isImage ? (
                                          <img
                                            src={doc.url}
                                            alt={doc.fileName}
                                            className="max-h-[480px] w-full object-contain bg-gray-50 dark:bg-gray-950"
                                          />
                                        ) : (
                                          <iframe
                                            title={doc.fileName}
                                            src={doc.url}
                                            className="h-[480px] w-full border-0 bg-gray-50 dark:bg-gray-950"
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>,
                          ];
                        })
                      : group.docs.map((doc) => {
                          const isImage = doc.contentType.startsWith("image/");
                          const isPdf =
                            doc.contentType.includes("pdf") || /\.pdf$/i.test(doc.fileName);
                          const open = previewDocId === doc.id;
                          return (
                            <div
                              key={doc.id}
                              className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
                                    {isImage ? (
                                      <img src={doc.url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-[#14b8a6]" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                                      {doc.fileName}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {doc.offerDisplayCode ? (
                                        <button
                                          type="button"
                                          className="mr-1.5 font-medium text-[#14b8a6] hover:underline"
                                          onClick={() => {
                                            if (doc.offerPublicToken) {
                                              window.open(`/offer-view/${doc.offerPublicToken}`, "_blank");
                                            }
                                          }}
                                        >
                                          {doc.offerDisplayCode}
                                        </button>
                                      ) : null}
                                      {tr("Yüklənib", "Uploaded")}{" "}
                                      {formatDate(doc.createdAt.slice(0, 10))}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  {(isImage || isPdf) && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewDocId(open ? null : doc.id)}
                                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    >
                                      <Eye className="h-3 w-3" />
                                      {open ? tr("Gizlət", "Hide") : tr("Bax", "View")}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteDoc(doc.id)}
                                    className="rounded-lg border border-gray-200 bg-gray-50 p-1.5 text-red-500 dark:border-gray-700 dark:bg-gray-800"
                                    title={tr("Sil", "Delete")}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              {open && (isImage || isPdf) && (
                                <div className="border-t border-gray-100 dark:border-gray-800">
                                  {isImage ? (
                                    <img
                                      src={doc.url}
                                      alt={doc.fileName}
                                      className="max-h-[480px] w-full object-contain bg-gray-50 dark:bg-gray-950"
                                    />
                                  ) : (
                                    <iframe
                                      title={doc.fileName}
                                      src={doc.url}
                                      className="h-[480px] w-full border-0 bg-gray-50 dark:bg-gray-950"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }))}
                  </div>
                </section>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
