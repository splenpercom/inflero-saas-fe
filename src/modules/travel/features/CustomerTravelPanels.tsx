/**
 * Travel Offers / Invoices / Documents panels for People → Customer profile.
 * UI-only (localStorage + mock). Shown only when TRAVEL module is enabled.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Edit2,
  Eye,
  FileImage,
  Hotel,
  Search,
  Send,
  ShieldCheck,
  Ticket,
  Trash2,
  Upload,
  WalletCards,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
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
  status: "active" | "inactive" | "sent" | "expired";
  createdAt: string;
}

type DocStatus = "valid" | "expiring" | "expired" | "missing";

interface ClientDoc {
  id: string;
  type: string;
  typeKey: string;
  fileName: string | null;
  uploadedAt: string | null;
  expiryDate: string | null;
  status: DocStatus;
  notes: string;
  icon: typeof CreditCard;
  iconColor: string;
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

const SEED_OFFERS: TravelOffer[] = [
  {
    id: "TRV-001",
    saleType: "Business",
    saleDate: "2026-10-01",
    from: "Baku",
    to: "Istanbul",
    country: "Turkey",
    city: "Istanbul",
    hotelName: "Grand Hyatt Istanbul",
    numAdults: 1,
    numChildren: 0,
    salePrice: { amount: "4500", currency: "USD", rate: "1.70", date: "" },
    clientName: "",
    status: "active",
    createdAt: "2026-08-15",
  },
  {
    id: "TRV-002",
    saleType: "Luxury",
    saleDate: "2026-09-25",
    from: "Baku",
    to: "Dubai",
    country: "UAE",
    city: "Dubai",
    hotelName: "Burj Al Arab",
    numAdults: 2,
    numChildren: 0,
    salePrice: { amount: "6200", currency: "USD", rate: "1.70", date: "" },
    clientName: "",
    status: "sent",
    createdAt: "2026-08-28",
  },
  {
    id: "TRV-003",
    saleType: "Holiday",
    saleDate: "2026-08-20",
    from: "Baku",
    to: "Antalya",
    country: "Turkey",
    city: "Antalya",
    hotelName: "Rixos Premium Antalya",
    numAdults: 2,
    numChildren: 1,
    salePrice: { amount: "3100", currency: "USD", rate: "1.70", date: "" },
    clientName: "",
    status: "inactive",
    createdAt: "2026-07-01",
  },
];

const DEFAULT_DOCS: ClientDoc[] = [
  { id: "d1", type: "Passport Copy", typeKey: "passport", fileName: "passport_scan.pdf", uploadedAt: "2026-08-10", expiryDate: "2028-03-14", status: "valid", notes: "Biometric pages", icon: CreditCard, iconColor: "text-blue-500" },
  { id: "d2", type: "Visa", typeKey: "visa", fileName: "visa_scan.jpg", uploadedAt: "2026-08-12", expiryDate: "2026-12-01", status: "valid", notes: "Multiple entry", icon: ShieldCheck, iconColor: "text-green-500" },
  { id: "d3", type: "Flight Ticket", typeKey: "ticket", fileName: "flight_ticket.pdf", uploadedAt: "2026-08-28", expiryDate: null, status: "valid", notes: "", icon: Ticket, iconColor: "text-purple-500" },
  { id: "d4", type: "Hotel Voucher", typeKey: "hotel", fileName: null, uploadedAt: null, expiryDate: null, status: "missing", notes: "Pending", icon: Hotel, iconColor: "text-gray-400" },
  { id: "d5", type: "Travel Insurance", typeKey: "insurance", fileName: "insurance.pdf", uploadedAt: "2026-08-15", expiryDate: "2026-10-31", status: "expiring", notes: "", icon: BadgeCheck, iconColor: "text-amber-500" },
  { id: "d6", type: "Other", typeKey: "other", fileName: null, uploadedAt: null, expiryDate: null, status: "missing", notes: "", icon: FileImage, iconColor: "text-gray-400" },
];

const INV_STATUS_BADGE: Record<Invoice["status"], string> = {
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  partial: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  unpaid: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
};

const OFFER_STATUS_BADGE: Record<TravelOffer["status"], string> = {
  active: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  sent: "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50",
  inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600",
  expired: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
};

const DOC_STATUS_STYLE: Record<DocStatus, string> = {
  valid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  expiring: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  expired: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  missing: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
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
  customerName,
  customerPhone = "",
}: {
  tab: CustomerTravelTab;
  customerName: string;
  customerPhone?: string;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);

  const [currentMonth, setCurrentMonth] = useState(() => toMonthStr(new Date()));
  const [invSearch, setInvSearch] = useState("");
  const [invStatus, setInvStatus] = useState("all");
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [offerSearch, setOfferSearch] = useState("");
  const [offerStatus, setOfferStatus] = useState("all");
  const [allOffers, setAllOffers] = useState<TravelOffer[]>([]);
  const [clientDocs, setClientDocs] = useState<ClientDoc[]>(DEFAULT_DOCS);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

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
    try {
      const stored = localStorage.getItem("inflero_offers");
      if (stored) {
        const list: TravelOffer[] = JSON.parse(stored);
        const forClient = list.filter((o) => o.clientName === customerName);
        setAllOffers(
          forClient.length > 0
            ? forClient
            : SEED_OFFERS.map((o) => ({ ...o, clientName: customerName })),
        );
      } else {
        setAllOffers(SEED_OFFERS.map((o) => ({ ...o, clientName: customerName })));
      }
    } catch {
      setAllOffers(SEED_OFFERS.map((o) => ({ ...o, clientName: customerName })));
    }
  }, [customerName]);

  useEffect(() => {
    setClientDocs(DEFAULT_DOCS);
    setUploadedDocs({});
  }, [customerName]);

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
        o.hotelName.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.saleType.toLowerCase().includes(q) ||
        o.from.toLowerCase().includes(q) ||
        o.to.toLowerCase().includes(q);
      const matchStatus = offerStatus === "all" || o.status === offerStatus;
      return matchSearch && matchStatus;
    });
  }, [allOffers, offerSearch, offerStatus]);

  function handleUploadClick(docId: string) {
    uploadTargetRef.current = docId;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const docId = uploadTargetRef.current;
    if (!file || !docId) return;
    setUploadingDocId(docId);
    window.setTimeout(() => {
      setUploadedDocs((prev) => ({ ...prev, [docId]: file.name }));
      setClientDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "valid" as const, fileName: file.name, uploadedAt: new Date().toISOString().slice(0, 10) } : d)),
      );
      setUploadingDocId(null);
      uploadTargetRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 400);
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
                    tr("TƏYİNAT", "DESTINATION"),
                    tr("OTEL", "HOTEL"),
                    tr("NÖV", "TYPE"),
                    tr("TARİX", "DATE"),
                    tr("SATIŞ QİYMƏTİ", "SALE PRICE"),
                    tr("STATUS", "STATUS"),
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
                    <td colSpan={7} className="px-3 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
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
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(`/offer-view/${o.id}`, "_blank")}
                            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                            title={tr("Bax", "View")}
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button type="button" className="rounded-lg border border-gray-300 p-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-400" title={tr("Redaktə Et", "Edit")}>
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button type="button" className="rounded-lg border border-gray-300 p-1.5 text-red-600 dark:border-gray-700 dark:text-red-400" title={tr("Sil", "Delete")}>
                            <Trash2 className="h-3 w-3" />
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

  // documents
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: tr("Ümumi", "Total"), value: clientDocs.length, color: "text-gray-900 dark:text-white" },
          { label: tr("Etibarlı", "Valid"), value: clientDocs.filter((d) => d.status === "valid").length, color: "text-green-600 dark:text-green-400" },
          { label: tr("Vaxtı bitir", "Expiring"), value: clientDocs.filter((d) => d.status === "expiring").length, color: "text-amber-600 dark:text-amber-400" },
          { label: tr("Yüklənməyib", "Missing"), value: clientDocs.filter((d) => d.status === "missing").length, color: "text-red-500 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`mt-0.5 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {clientDocs.map((doc) => {
          const Icon = doc.icon;
          const uploadedName = uploadedDocs[doc.id];
          const effectiveFile = uploadedName ?? doc.fileName;
          const effectiveStatus: DocStatus = uploadedName ? "valid" : doc.status;
          const isUploading = uploadingDocId === doc.id;

          return (
            <div
              key={doc.id}
              className={`flex flex-col gap-3 rounded-xl border p-4 transition-all ${
                effectiveStatus === "missing"
                  ? "border-dashed border-gray-300 dark:border-gray-700"
                  : "border-gray-200 shadow-sm dark:border-gray-800"
              } bg-white dark:bg-gray-900`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Icon className={`h-4 w-4 ${effectiveStatus === "missing" ? "text-gray-400" : doc.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight text-gray-900 dark:text-white">{doc.type}</p>
                    {effectiveFile && (
                      <p className="mt-0.5 max-w-[140px] truncate text-[10px] text-gray-400">{effectiveFile}</p>
                    )}
                  </div>
                </div>
                <span className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${DOC_STATUS_STYLE[effectiveStatus]}`}>
                  {effectiveStatus}
                </span>
              </div>

              {(doc.uploadedAt || doc.expiryDate || doc.notes) && effectiveStatus !== "missing" && (
                <div className="space-y-1 border-t border-gray-100 pt-2 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  {doc.uploadedAt && (
                    <div className="flex items-center justify-between">
                      <span>{tr("Yüklənib", "Uploaded")}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{doc.uploadedAt}</span>
                    </div>
                  )}
                  {doc.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span>{tr("Bitmə tarixi", "Expiry")}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{doc.expiryDate}</span>
                    </div>
                  )}
                  {doc.notes && <p className="text-[10px] italic text-gray-400">{doc.notes}</p>}
                </div>
              )}

              <div className="mt-auto flex gap-1.5">
                {effectiveFile ? (
                  <>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <Eye className="h-3 w-3" />
                      {tr("Bax", "View")}
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <Download className="h-3 w-3" />
                      {tr("Yüklə", "Download")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUploadClick(doc.id)}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-1.5 text-gray-500 dark:border-gray-700 dark:bg-gray-800"
                      title={tr("Yenilə", "Replace")}
                    >
                      <Upload className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUploadClick(doc.id)}
                    disabled={isUploading}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#14b8a6]/40 bg-[#14b8a6]/5 py-2 text-[11px] font-semibold text-[#14b8a6]"
                  >
                    <Upload className="h-3 w-3" />
                    {isUploading ? tr("Yüklənir...", "Uploading...") : tr("Yüklə", "Upload")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
