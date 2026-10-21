import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router";
import {
  Search, Plus, FileText, FileSpreadsheet, RefreshCw,
  Eye, Trash2, X, Share2, CheckCircle,
  UserPlus, ExternalLink, Link2, Check,
  Clock, MapPin, Banknote, MessageSquare, ChevronDown, ChevronUp,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { useAuth } from "../../../app/context/AuthContext";
import { useBranch } from "../../../app/context/BranchContext";
import { useConfirm } from "../../../app/context/ConfirmContext";
import { useModulePermissions } from "../../../app/hooks/useModulePermissions";
import { useBranchRevision } from "../../../app/hooks/useBranchRevision";
import { useServerPagination, DEFAULT_LIST_PAGE_SIZE } from "../../../app/hooks/usePagination";
import { DataPagination, dataPaginationShowText } from "../../../app/components/ui/DataPagination";
import { notifyFromError, notifySuccess } from "../../../app/lib/toast";
import {
  confirmOfferBankPayment,
  createOffer,
  deleteOffer as apiDeleteOffer,
  fetchOffer,
  fetchOfferClientNames,
  fetchOffers,
  publishOffer,
  rejectOfferBankPayment,
  resolveOfferChanges,
  updateOffer,
  type OfferChangeRequestRow,
  type OfferPaymentRow,
  type OfferStatusUi,
  type OfferWriteBody,
  type TravelOfferRow,
} from "../../../app/api/offers";
import { createCustomer, fetchCustomers } from "../../../app/api/people";
import { AddCustomerModal, type CustomerFormData } from "../../../app/components/corporate/people/AddCustomerModal";
import { FilterSelect } from "../ui/filter-select";
import { exportToExcel } from "../lib/exportExcel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialRow {
  amount: string;
  currency: string;
  rate: string;
  date: string;
}

interface Passenger {
  id: string;
  fullName: string;
  dob: string;
  passportNo: string;
  passportExpiry: string;
}

export interface TravelOffer {
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
  flight: string;
  transfer: string;
  insurance: string;
  meal: string;
  costPrice: FinancialRow;
  salePrice: FinancialRow;
  paidByCash: FinancialRow;
  paidByTransfer: FinancialRow;
  expectedIncome: number;
  debt: number;
  actualIncome: number;
  clientName: string;
  customerId: string | null;
  paymentDeadline: string;
  supplier: string;
  agent: string;
  createdByUserId: string | null;
  createdByName: string | null;
  passengers: Passenger[];
  status: OfferStatusUi;
  createdAt: string;
  pendingBankPaymentCount?: number;
  changeRequestCount?: number;
  latestChangeNote?: string | null;
}

function offerAgentLabel(o: { createdByName?: string | null; agent?: string | null }): string {
  return (o.createdByName || o.agent || "").trim();
}

function mapRow(row: TravelOfferRow): TravelOffer {
  return {
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
    flight: row.flight,
    transfer: row.transfer,
    insurance: row.insurance,
    meal: row.meal,
    costPrice: row.costPrice,
    salePrice: row.salePrice,
    paidByCash: row.paidByCash,
    paidByTransfer: row.paidByTransfer,
    expectedIncome: row.expectedIncome,
    debt: row.debt,
    actualIncome: row.actualIncome,
    clientName: row.clientName,
    customerId: row.customerId,
    paymentDeadline: row.paymentDeadline,
    supplier: row.supplier,
    agent: row.agent,
    createdByUserId: row.createdByUserId ?? null,
    createdByName: row.createdByName ?? null,
    passengers: row.passengers,
    status: row.status,
    createdAt: row.createdAt,
    pendingBankPaymentCount: row.pendingBankPaymentCount ?? 0,
    changeRequestCount: row.changeRequestCount ?? 0,
    latestChangeNote: row.latestChangeNote ?? null,
  };
}

function passengerFilled(p: Passenger): boolean {
  return !!(p.fullName || p.dob || p.passportNo || p.passportExpiry);
}

function passengerLabel(i: number, numAdults: number, language: string): string {
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  if (i < numAdults) return `${tr("Böyük", "Adult")} ${i + 1}`;
  return `${tr("Uşaq", "Child")} ${i - numAdults + 1}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: "AZN", label: "AZN" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "TRY", label: "TRY" },
];

const SALE_TYPES    = ["Tour","Hotel","Transfer","Flight","Package","Other"].map(v => ({ value: v, label: v }));
const FLIGHT_OPTIONS  = [{ value: "", label: "Select..." }, ...["Included","Separate","None"].map(v => ({ value: v, label: v }))];
const TRANSFER_OPTIONS= [{ value: "", label: "Select..." }, ...["Included","Separate","None"].map(v => ({ value: v, label: v }))];
const INSURANCE_OPTIONS=[{ value: "", label: "Select..." }, ...["None","Basic","Premium"].map(v => ({ value: v, label: v }))];
const MEAL_OPTIONS    = [{ value: "", label: "Select..." }, ...["None","Breakfast Only","Half Board","Full Board","All Inclusive"].map(v => ({ value: v, label: v }))];

function getEmpInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

const STATUS_BADGE: Record<OfferStatusUi, string> = {
  active:   "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600",
  sent:     "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50",
  expired:  "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
  accepted: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
  changing: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
};

const STATUS_LABEL: Record<OfferStatusUi, { en: string; az: string }> = {
  active:   { en: "Active",    az: "Aktiv"          },
  inactive: { en: "Inactive",  az: "Qeyri-aktiv"    },
  sent:     { en: "Sent",      az: "Göndərildi"     },
  expired:  { en: "Expired",   az: "Vaxtı bitmiş"   },
  accepted: { en: "Accepted",  az: "Qəbul edildi"   },
  rejected: { en: "Rejected",  az: "Rədd edildi"    },
  changing: { en: "Changing",  az: "Dəyişiklik"     },
};

const STATUS_OPTIONS: OfferStatusUi[] = [
  "active",
  "inactive",
  "sent",
  "expired",
  "accepted",
  "rejected",
  "changing",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAZN(amount: string, rate: string): number {
  return (parseFloat(amount) || 0) * (parseFloat(rate) || 1);
}

/** Pure AZN finance totals — same formulas as server recompute / former Calculate. */
function computeOfferFinance(rows: {
  costPrice: FinancialRow;
  salePrice: FinancialRow;
  paidByCash: FinancialRow;
  paidByTransfer: FinancialRow;
}): { expectedIncome: number; debt: number; actualIncome: number } {
  const costAZN = calcAZN(rows.costPrice.amount, rows.costPrice.rate);
  const saleAZN = calcAZN(rows.salePrice.amount, rows.salePrice.rate);
  const cashAZN = calcAZN(rows.paidByCash.amount, rows.paidByCash.rate);
  const transAZN = calcAZN(rows.paidByTransfer.amount, rows.paidByTransfer.rate);
  return {
    expectedIncome: saleAZN - costAZN,
    debt: saleAZN - cashAZN - transAZN,
    actualIncome: cashAZN + transAZN - costAZN,
  };
}

function blankRow(currency = "USD"): FinancialRow {
  // Amount always empty. AZN rate is fixed at 1; other currencies leave rate empty to type.
  return {
    amount: "",
    currency,
    rate: currency === "AZN" ? "1" : "",
    date: "",
  };
}

function freshForm() {
  return {
    saleType: "Tour", saleDate: new Date().toISOString().split("T")[0],
    from: "", to: "", country: "", city: "", hotelName: "",
    numAdults: 1, numChildren: 0,
    flight: "", transfer: "", insurance: "", meal: "",
    costPrice: blankRow("USD"), salePrice: blankRow("USD"),
    paidByCash: blankRow("AZN"), paidByTransfer: blankRow("AZN"),
    clientName: "", customerId: null as string | null, paymentDeadline: "", supplier: "", agent: "",
    passengers: [{ id: "p1", fullName: "", dob: "", passportNo: "", passportExpiry: "" }] as Passenger[],
  };
}

function initForm(editOffer?: TravelOffer) {
  if (!editOffer) return freshForm();
  return {
    saleType: editOffer.saleType, saleDate: editOffer.saleDate,
    from: editOffer.from, to: editOffer.to, country: editOffer.country, city: editOffer.city,
    hotelName: editOffer.hotelName, numAdults: editOffer.numAdults, numChildren: editOffer.numChildren,
    flight: editOffer.flight, transfer: editOffer.transfer, insurance: editOffer.insurance, meal: editOffer.meal,
    costPrice: editOffer.costPrice, salePrice: editOffer.salePrice,
    paidByCash: editOffer.paidByCash, paidByTransfer: editOffer.paidByTransfer,
    clientName: editOffer.clientName, customerId: editOffer.customerId,
    paymentDeadline: editOffer.paymentDeadline,
    supplier: editOffer.supplier, agent: editOffer.agent, passengers: editOffer.passengers,
  };
}

// ─── Financial Row ────────────────────────────────────────────────────────────

const FinRow = memo(function FinRow({
  label,
  row,
  onChange,
}: {
  label: string;
  row: FinancialRow;
  onChange: (r: FinancialRow) => void;
}) {
  const azn = calcAZN(row.amount, row.rate).toFixed(2);
  const inp = "px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#14b8a6] text-right";

  const onAmount = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...row, amount: e.target.value }),
    [onChange, row],
  );
  const isAzn = row.currency === "AZN";

  const onCurrency = useCallback(
    (v: string) => {
      if (v === "AZN") {
        onChange({ ...row, currency: v, rate: "1" });
      } else {
        onChange({
          ...row,
          currency: v,
          // Leaving AZN → clear rate so the user types the FX rate
          rate: row.currency === "AZN" ? "" : row.rate,
        });
      }
    },
    [onChange, row],
  );
  const onRate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (row.currency === "AZN") return;
      onChange({ ...row, rate: e.target.value });
    },
    [onChange, row],
  );
  const onDate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...row, date: e.target.value }),
    [onChange, row],
  );

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <td className="py-2 pr-3 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{label}</td>
      <td className="py-2 pr-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={row.amount}
          onChange={onAmount}
          className={`w-20 ${inp}`}
          placeholder="0.00"
        />
      </td>
      <td className="py-2 pr-1.5">
        <FilterSelect value={row.currency} onChange={onCurrency} options={CURRENCIES} />
      </td>
      <td className="py-2 pr-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={isAzn ? "1" : row.rate}
          onChange={onRate}
          readOnly={isAzn}
          className={`w-20 ${inp} ${isAzn ? "opacity-60 cursor-not-allowed" : ""}`}
          placeholder={isAzn ? "1" : "e.g. 1.70"}
          title={isAzn ? "AZN rate is always 1" : undefined}
        />
      </td>
      <td className="py-2 pr-2">
        <input type="date" value={row.date} onChange={onDate}
          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#14b8a6]" />
      </td>
      <td className="py-2 text-xs font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap pl-2 min-w-[60px]">
        {azn}
      </td>
    </tr>
  );
});

const OfferFinanceSummary = memo(function OfferFinanceSummary({
  expectedIncome,
  debt,
  actualIncome,
  expectedLabel,
  debtLabel,
  actualLabel,
}: {
  expectedIncome: number;
  debt: number;
  actualIncome: number;
  expectedLabel: string;
  debtLabel: string;
  actualLabel: string;
}) {
  return (
    <div className="space-y-0 mb-5">
      {(
        [
          { key: "expectedIncome" as const, label: expectedLabel, value: expectedIncome },
          { key: "debt" as const, label: debtLabel, value: debt },
          { key: "actualIncome" as const, label: actualLabel, value: actualIncome },
        ] as const
      ).map(({ key, label, value }) => (
        <div
          key={key}
          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span
            className={`text-xs font-semibold ${
              key === "debt" && value > 0
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {value.toFixed(2)} AZN
          </span>
        </div>
      ))}
    </div>
  );
});

// ─── Client Autocomplete + History ────────────────────────────────────────────

type CustomerSuggestion = {
  kind: "customer";
  id: string;
  name: string;
  phone?: string;
  code?: string;
  email?: string;
};
type NameSuggestion = { kind: "name"; name: string };
type ClientSuggestion = CustomerSuggestion | NameSuggestion;

function ClientNameInput({
  value, customerId, onChange, language, inputClass, excludeOfferId, onNewCustomer,
}: {
  value: string;
  customerId: string | null;
  onChange: (name: string, customerId: string | null) => void;
  language: string;
  inputClass: string;
  excludeOfferId?: string;
  onNewCustomer: () => void;
}) {
  const tr = (az: string, en: string) => language === "az" ? az : en;
  const [showSug, setShowSug] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<TravelOffer[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const loadHistory = useCallback(
    async (name: string, custId: string | null) => {
      try {
        const res = await fetchOffers({
          ...(custId ? { customerId: custId } : { clientName: name }),
          page: 1,
          pageSize: 5,
        });
        setHistory(
          (res.items || [])
            .filter((o) => o.id !== excludeOfferId)
            .slice(0, 5)
            .map(mapRow),
        );
      } catch {
        setHistory([]);
      }
    },
    [excludeOfferId],
  );

  // Load previous offers when editing a linked customer
  useEffect(() => {
    if (customerId && value.trim()) {
      void loadHistory(value.trim(), customerId);
    }
  }, [customerId, value, loadHistory]);

  useEffect(() => {
    if (!showSug) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSug(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSug]);

  useEffect(() => {
    if (!showSug) return;
    let cancelled = false;
    const t = setTimeout(() => {
      const q = query.trim();
      setSearching(true);
      Promise.all([
        fetchCustomers({
          search: q || undefined,
          status: "all",
          limit: 25,
        }).catch(() => []),
        // Past free-text names (unlinked) — secondary to CRM customers
        q.length >= 1
          ? fetchOfferClientNames(q).catch(() => [] as string[])
          : Promise.resolve([] as string[]),
      ]).then(([customers, names]) => {
        if (cancelled) return;
        const fromCustomers: CustomerSuggestion[] = (customers || []).map((c) => ({
          kind: "customer" as const,
          id: c.id,
          name: c.name,
          phone: c.phone || undefined,
          code: c.code || undefined,
          email: c.email || undefined,
        }));
        const used = new Set(fromCustomers.map((c) => c.name.toLowerCase()));
        const fromNames: NameSuggestion[] = names
          .filter((n) => n.toLowerCase() !== q.toLowerCase() && !used.has(n.toLowerCase()))
          .slice(0, 5)
          .map((name) => ({ kind: "name" as const, name }));
        setCustomerSuggestions(fromCustomers);
        setNameSuggestions(fromNames);
      }).finally(() => {
        if (!cancelled) setSearching(false);
      });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, showSug]);

  async function selectSuggestion(s: ClientSuggestion) {
    if (s.kind === "customer") {
      onChange(s.name, s.id);
      setQuery(s.name);
      setShowSug(false);
      await loadHistory(s.name, s.id);
      return;
    }
    onChange(s.name, null);
    setQuery(s.name);
    setShowSug(false);
    await loadHistory(s.name, null);
  }

  function handleChange(v: string) {
    setQuery(v);
    // Typing clears link until a customer is chosen from the list
    onChange(v, null);
    setShowSug(true);
    if (!v) setHistory([]);
  }

  const hasResults = customerSuggestions.length > 0 || nameSuggestions.length > 0;

  return (
    <div ref={containerRef} className="flex-1 space-y-2">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setShowSug(true)}
              placeholder={tr("Mövcud müştəri axtar…", "Search existing customers…")}
              className={`${inputClass} pl-8`}
              autoComplete="off"
            />
          </div>
          {showSug && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50 overflow-hidden max-h-72 overflow-y-auto">
              {searching && (
                <p className="px-3 py-2 text-[11px] text-gray-400">
                  {tr("Axtarılır…", "Searching…")}
                </p>
              )}
              {!searching && !hasResults && (
                <p className="px-3 py-2 text-[11px] text-gray-400">
                  {query.trim()
                    ? tr("Müştəri tapılmadı — yenisini əlavə edin", "No customer found — add a new one")
                    : tr("Axtarmağa başlayın və ya siyahıdan seçin", "Start typing or pick from the list")}
                </p>
              )}
              {customerSuggestions.length > 0 && (
                <>
                  <p className="px-3 py-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                    {tr("Mövcud müştərilər", "Existing customers")}
                  </p>
                  {customerSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => void selectSuggestion(s)}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        customerId === s.id ? "bg-[#14b8a6]/10" : ""
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[9px] font-bold flex-shrink-0">
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium truncate">{s.name}</span>
                          {s.code ? (
                            <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">{s.code}</span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {[s.phone, s.email].filter(Boolean).join(" · ") || tr("Müştəri qeydi", "Customer record")}
                        </p>
                      </div>
                      {customerId === s.id && (
                        <Check className="w-3.5 h-3.5 text-[#14b8a6] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
              {nameSuggestions.length > 0 && (
                <>
                  <p className="px-3 py-1 mt-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-gray-800 pt-1">
                    {tr("Əvvəlki adlar (bağlı deyil)", "Past names (not linked)")}
                  </p>
                  {nameSuggestions.map((s) => (
                    <button
                      key={`n-${s.name}`}
                      type="button"
                      onClick={() => void selectSuggestion(s)}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-[9px] font-bold flex-shrink-0">
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium truncate">{s.name}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onNewCustomer}
          className="flex-shrink-0 px-2.5 py-1.5 text-xs border border-[#14b8a6] text-[#14b8a6] rounded-lg hover:bg-[#14b8a6]/10 font-medium whitespace-nowrap"
          title={tr("Yeni müştəri", "New customer")}
        >
          <UserPlus className="w-3.5 h-3.5" />
        </button>
      </div>
      {customerId ? (
        <p className="text-[10px] text-[#14b8a6]">
          {tr("Mövcud müştəriyə bağlandı — təklif bu müştəriyə yazılacaq", "Linked to existing customer — offer will be created for them")}
        </p>
      ) : value.trim() ? (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          {tr("Siyahıdan müştəri seçin və ya yenisini əlavə edin", "Pick a customer from the list, or add a new one")}
        </p>
      ) : null}

      {history.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {tr("Bu müştəriyə göndərilmiş əvvəlki təkliflər", "Previous offers sent to this client")}
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {history.map(o => (
              <div key={o.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#14b8a6] dark:text-[#14b8a6]">{o.displayCode}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 dark:bg-[#14b8a6]/15 text-blue-600 dark:text-[#14b8a6] border border-blue-200 dark:border-[#14b8a6]/40">
                      {o.saleType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                      {o.from} → {o.to}{o.hotelName ? ` · ${o.hotelName}` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] font-semibold text-gray-900 dark:text-white">
                    {calcAZN(o.salePrice.amount, o.salePrice.rate).toFixed(0)} AZN
                  </p>
                  <p className="text-[9px] text-gray-400">{o.saleDate}</p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_BADGE[o.status]}`}>
                  {STATUS_LABEL[o.status].en}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Offer Modal ──────────────────────────────────────────────────────────

function AddOfferModal({
  onClose, onSave, editOffer, saving, canEditPayments, onPaymentsChanged, onOfferUpdated,
}: {
  onClose: () => void;
  onSave: (payload: OfferWriteBody, opts?: { navigatePublic?: boolean }) => Promise<void>;
  editOffer?: TravelOffer;
  saving?: boolean;
  canEditPayments?: boolean;
  onPaymentsChanged?: () => void;
  onOfferUpdated?: (row: TravelOffer) => void;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);

  const [form, setForm] = useState(() => initForm(editOffer));
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [payments, setPayments] = useState<OfferPaymentRow[]>([]);
  const [changeRequests, setChangeRequests] = useState<OfferChangeRequestRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payBusyId, setPayBusyId] = useState<string | null>(null);
  const [showChangeHistory, setShowChangeHistory] = useState(true);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [offerStatus, setOfferStatus] = useState<OfferStatusUi | undefined>(editOffer?.status);
  const [resolveBusy, setResolveBusy] = useState(false);
  const changesOpen = offerStatus === "changing";

  const pendingBankPayments = useMemo(
    () => payments.filter((p) => p.method === "bank" && p.status === "pending"),
    [payments],
  );

  useEffect(() => {
    setOfferStatus(editOffer?.status);
  }, [editOffer?.id, editOffer?.status]);

  useEffect(() => {
    if (!editOffer?.id) {
      setPayments([]);
      setChangeRequests([]);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    fetchOffer(editOffer.id)
      .then((row) => {
        if (cancelled) return;
        setPayments(Array.isArray(row.payments) ? row.payments : []);
        setChangeRequests(Array.isArray(row.changeRequests) ? row.changeRequests : []);
        setOfferStatus(row.status);
        if (row.paidByCash) setForm((f) => ({ ...f, paidByCash: row.paidByCash }));
        if (row.paidByTransfer) setForm((f) => ({ ...f, paidByTransfer: row.paidByTransfer }));
      })
      .catch((err) => notifyFromError(err))
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editOffer?.id]);

  async function handleResolveChanges() {
    if (!editOffer || !canEditPayments || !changesOpen) return;
    setResolveBusy(true);
    try {
      const row = await resolveOfferChanges(editOffer.id);
      const mapped = mapRow(row);
      setOfferStatus(mapped.status);
      setChangeRequests(Array.isArray(row.changeRequests) ? row.changeRequests : []);
      onOfferUpdated?.(mapped);
      onPaymentsChanged?.();
      notifySuccess(
        tr(
          "Dəyişikliklər həll olundu — müştəri yenidən cavab verə bilər",
          "Changes resolved — client can respond again",
        ),
      );
    } catch (err) {
      notifyFromError(err);
    } finally {
      setResolveBusy(false);
    }
  }

  async function handleConfirmPayment(p: OfferPaymentRow) {
    if (!editOffer || !canEditPayments) return;
    setPayBusyId(p.id);
    try {
      await confirmOfferBankPayment(editOffer.id, p.id);
      notifySuccess(tr("Köçürmə təsdiqləndi", "Bank transfer confirmed"));
      const row = await fetchOffer(editOffer.id);
      setPayments(Array.isArray(row.payments) ? row.payments : []);
      if (row.paidByCash) setForm((f) => ({ ...f, paidByCash: row.paidByCash }));
      if (row.paidByTransfer) setForm((f) => ({ ...f, paidByTransfer: row.paidByTransfer }));
      onPaymentsChanged?.();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setPayBusyId(null);
    }
  }

  async function handleRejectPayment(p: OfferPaymentRow) {
    if (!editOffer || !canEditPayments) return;
    setPayBusyId(p.id);
    try {
      await rejectOfferBankPayment(editOffer.id, p.id);
      notifySuccess(tr("Ödəniş ləğv edildi", "Payment rejected"));
      const row = await fetchOffer(editOffer.id);
      setPayments(Array.isArray(row.payments) ? row.payments : []);
      onPaymentsChanged?.();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setPayBusyId(null);
    }
  }

  // Derived finance — no calc state / no Calculate click; skips recompute when non-money fields change.
  const finance = useMemo(
    () =>
      computeOfferFinance({
        costPrice: form.costPrice,
        salePrice: form.salePrice,
        paidByCash: form.paidByCash,
        paidByTransfer: form.paidByTransfer,
      }),
    [form.costPrice, form.salePrice, form.paidByCash, form.paidByTransfer],
  );

  const set = useCallback(
    (k: string) => (v: unknown) => setForm((f) => ({ ...f, [k]: v })),
    [],
  );

  // Stable per-row setters so memo(FinRow) skips when sibling rows / other fields change.
  const onCostPrice = useCallback((r: FinancialRow) => setForm((f) => ({ ...f, costPrice: r })), []);
  const onSalePrice = useCallback((r: FinancialRow) => setForm((f) => ({ ...f, salePrice: r })), []);
  const onPaidByCash = useCallback((r: FinancialRow) => setForm((f) => ({ ...f, paidByCash: r })), []);
  const onPaidByTransfer = useCallback(
    (r: FinancialRow) => setForm((f) => ({ ...f, paidByTransfer: r })),
    [],
  );

  // Sync passenger rows to adults + children (keep filled rows when trim would drop data).
  useEffect(() => {
    setForm((f) => {
      const target = Math.max(1, f.numAdults) + Math.max(0, f.numChildren);
      if (f.passengers.length === target) return f;
      if (f.passengers.length < target) {
        const next = [...f.passengers];
        while (next.length < target) {
          next.push({
            id: `p${Date.now()}_${next.length}`,
            fullName: "",
            dob: "",
            passportNo: "",
            passportExpiry: "",
          });
        }
        return { ...f, passengers: next };
      }
      const wouldDrop = f.passengers.slice(target).some(passengerFilled);
      if (wouldDrop) {
        const n = f.passengers.length;
        let adults = Math.max(1, f.numAdults);
        let children = Math.max(0, n - adults);
        if (adults + children < n) adults = n - children;
        return { ...f, numAdults: adults, numChildren: children };
      }
      return { ...f, passengers: f.passengers.slice(0, target) };
    });
  }, [form.numAdults, form.numChildren]);

  const addPassenger = useCallback(() => {
    setForm((f) => ({
      ...f,
      numAdults: f.numAdults + 1,
      passengers: [
        ...f.passengers,
        { id: `p${Date.now()}`, fullName: "", dob: "", passportNo: "", passportExpiry: "" },
      ],
    }));
  }, []);

  const updatePassenger = useCallback((id: string, field: keyof Passenger, value: string) => {
    setForm((f) => ({
      ...f,
      passengers: f.passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  }, []);

  const removePassenger = useCallback((id: string) => {
    setForm((f) => {
      if (f.passengers.length <= 1) return f;
      const next = f.passengers.filter((p) => p.id !== id);
      const n = next.length;
      let adults = Math.min(f.numAdults, n);
      if (adults < 1) adults = 1;
      const children = Math.max(0, n - adults);
      return { ...f, passengers: next, numAdults: adults, numChildren: children };
    });
  }, []);

  const buildBody = useCallback(
    (status: TravelOffer["status"]): OfferWriteBody => ({
      ...form,
      numAdults: Math.max(1, form.numAdults || 1),
      numChildren: Math.max(0, form.numChildren || 0),
      costPrice: {
        ...form.costPrice,
        amount: form.costPrice.amount.trim() === "" ? "0" : form.costPrice.amount,
        rate: form.costPrice.rate.trim() === "" ? "1" : form.costPrice.rate,
      },
      salePrice: {
        ...form.salePrice,
        amount: form.salePrice.amount.trim() === "" ? "0" : form.salePrice.amount,
        rate: form.salePrice.rate.trim() === "" ? "1" : form.salePrice.rate,
      },
      paidByCash: {
        ...form.paidByCash,
        amount: form.paidByCash.amount.trim() === "" ? "0" : form.paidByCash.amount,
        rate: form.paidByCash.rate.trim() === "" ? "1" : form.paidByCash.rate,
      },
      paidByTransfer: {
        ...form.paidByTransfer,
        amount: form.paidByTransfer.amount.trim() === "" ? "0" : form.paidByTransfer.amount,
        rate: form.paidByTransfer.rate.trim() === "" ? "1" : form.paidByTransfer.rate,
      },
      expectedIncome: finance.expectedIncome,
      debt: finance.debt,
      actualIncome: finance.actualIncome,
      status,
    }),
    [form, finance],
  );

  const handleMakeDeal = useCallback(async () => {
    // Confirmed staff-side deal → accepted (not active), so the public page stays locked.
    await onSave(buildBody("accepted"));
  }, [onSave, buildBody]);

  const handleSendAsOffer = useCallback(async () => {
    await onSave(buildBody("sent"), { navigatePublic: true });
  }, [onSave, buildBody]);

  function generateInvoice(lang: "en" | "az") {
    const isAz = lang === "az";
    const costAZN = calcAZN(form.costPrice.amount, form.costPrice.rate).toFixed(2);
    const saleAZN = calcAZN(form.salePrice.amount, form.salePrice.rate).toFixed(2);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${isAz ? "Hesab-faktura" : "Invoice"}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}h1{color:#14b8a6;font-size:22px;margin-bottom:2px}.sub{color:#666;font-size:12px;margin-bottom:24px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#14b8a6;color:#fff;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}td{padding:7px 12px;border-bottom:1px solid #eee}.bold{font-weight:700;color:#14b8a6}.footer{margin-top:40px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:12px}</style></head><body>
<h1>Inflero Travel</h1><div class="sub">${isAz ? "Hesab-faktura" : "Invoice"} &mdash; ${new Date().toLocaleDateString()}</div>
<table><tr><th colspan="2">${isAz ? "Müştəri" : "Client Information"}</th></tr>
<tr><td>${isAz ? "Ad" : "Client"}</td><td class="bold">${form.clientName || "—"}</td></tr>
<tr><td>${isAz ? "Ödəniş son tarixi" : "Payment Deadline"}</td><td>${form.paymentDeadline || "—"}</td></tr>
<tr><td>${isAz ? "Tədarükçü" : "Supplier"}</td><td>${form.supplier || "—"}</td></tr>
<tr><td>Agent</td><td>${form.agent || "—"}</td></tr></table>
<table><tr><th colspan="2">${isAz ? "Səyahət Detalları" : "Travel Details"}</th></tr>
<tr><td>${isAz ? "Növ" : "Type"}</td><td>${form.saleType}</td></tr>
<tr><td>${isAz ? "Haradan" : "From"}</td><td>${form.from || "—"}</td></tr>
<tr><td>${isAz ? "Haraya" : "To"}</td><td>${form.to || "—"} ${form.country ? `(${form.country})` : ""}</td></tr>
<tr><td>${isAz ? "Otel" : "Hotel"}</td><td>${form.hotelName || "—"}</td></tr>
<tr><td>${isAz ? "Tarix" : "Travel Date"}</td><td>${form.saleDate}</td></tr>
<tr><td>${isAz ? "Böyüklər / Uşaqlar" : "Adults / Children"}</td><td>${form.numAdults} / ${form.numChildren}</td></tr></table>
<table><tr><th>${isAz ? "Maliyyə" : "Financial Summary"}</th><th style="text-align:right">AZN</th></tr>
<tr><td>${isAz ? "Maya dəyəri" : "Cost Price"}</td><td style="text-align:right">${costAZN}</td></tr>
<tr><td class="bold">${isAz ? "Satış qiyməti" : "Sale Price"}</td><td style="text-align:right" class="bold">${saleAZN}</td></tr></table>
${form.passengers.length ? `<table><tr><th>#</th><th>${isAz ? "Ad" : "Full Name"}</th><th>${isAz ? "Doğum tarixi" : "Date of Birth"}</th><th>${isAz ? "Pasport №" : "Passport #"}</th><th>${isAz ? "Bitmə tarixi" : "Expiry"}</th></tr>${form.passengers.map((p, i) => `<tr><td>${i + 1}</td><td>${p.fullName || "—"}</td><td>${p.dob || "—"}</td><td>${p.passportNo || "—"}</td><td>${p.passportExpiry || "—"}</td></tr>`).join("")}</table>` : ""}
<div class="footer">Inflero Travel Management System &mdash; ${new Date().getFullYear()}</div>
<script>window.onload=()=>window.print();</script></body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  }

  const inp = "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";
  const lbl = "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-6 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-7xl shadow-2xl border border-gray-200 dark:border-gray-800">

          {/* Header */}
          <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 rounded-t-2xl border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {editOffer ? tr("Təklifi Redaktə Et","Edit Offer") : tr("Yeni Təklif Əlavə Et","Add New Offer")}
                </h2>
                {editOffer && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-gray-400 font-mono">{editOffer.displayCode}</span>
                    {offerStatus && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_BADGE[offerStatus]}`}>
                        {language === "az" ? STATUS_LABEL[offerStatus].az : STATUS_LABEL[offerStatus].en}
                      </span>
                    )}
                    {pendingBankPayments.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse">
                        <Banknote className="w-2.5 h-2.5" />
                        {tr("Köçürmə təsdiqi", "Bank confirm")} · {pendingBankPayments.length}
                      </span>
                    )}
                    {changesOpen && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700 animate-pulse">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {tr("Açıq dəyişiklik", "Open changes")}
                        {changeRequests.length > 0 ? ` · ${changeRequests.length}` : ""}
                      </span>
                    )}
                    {!changesOpen && changeRequests.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {tr("Dəyişiklik tarixçəsi", "Change history")} · {changeRequests.length}
                      </span>
                    )}
                    {detailLoading && (
                      <span className="text-[10px] text-gray-400">{tr("Yüklənir…", "Loading…")}</span>
                    )}
                  </div>
                )}
              </div>
              <button type="button" onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>

          </div>

          {/* Body */}
          <div className="p-6">
            {/* Payments + change history at top when editing */}
            {editOffer && (
              <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`border rounded-xl p-4 ${
                  pendingBankPayments.length > 0
                    ? "border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20"
                    : "border-gray-200 dark:border-gray-800"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Banknote className="w-3.5 h-3.5 text-[#14b8a6]" />
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white flex-1">
                      {tr("Ödənişlər", "Payments")}
                      {pendingBankPayments.length > 0
                        ? ` · ${pendingBankPayments.length} ${tr("gözləyir", "pending")}`
                        : ""}
                    </h3>
                    {payments.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllPayments((v) => !v)}
                        className="text-[10px] text-[#14b8a6] font-medium"
                      >
                        {showAllPayments ? tr("Yığcam", "Less") : tr("Hamısı", "All")}
                      </button>
                    )}
                  </div>
                  {payments.length === 0 ? (
                    <p className="text-[11px] text-gray-500">{tr("Ödəniş yoxdur", "No payments yet")}</p>
                  ) : (
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {(showAllPayments ? payments : payments.slice(0, 3)).map((p) => (
                        <li
                          key={p.id}
                          className={`flex flex-col gap-1.5 rounded-lg border px-3 py-2 ${
                            p.method === "bank" && p.status === "pending"
                              ? "border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900"
                              : "border-gray-100 dark:border-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200">
                              {p.method === "bank" ? tr("Köçürmə", "Bank") : tr("Kart", "Card")} ·{" "}
                              {p.amount.toFixed(2)} {p.currency}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase ${
                                p.status === "paid"
                                  ? "text-green-600"
                                  : p.status === "pending"
                                    ? "text-amber-600"
                                    : "text-gray-500"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {new Date(p.createdAt).toLocaleString()}
                            {p.clientNote ? ` · ${p.clientNote}` : ""}
                          </p>
                          {p.method === "bank" && p.status === "pending" && canEditPayments && (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                disabled={payBusyId === p.id}
                                onClick={() => void handleConfirmPayment(p)}
                                className="px-2 py-1 text-[10px] font-medium rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                              >
                                {tr("Təsdiqlə", "Confirm")}
                              </button>
                              <button
                                type="button"
                                disabled={payBusyId === p.id}
                                onClick={() => void handleRejectPayment(p)}
                                className="px-2 py-1 text-[10px] font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                              >
                                {tr("Rədd et", "Reject")}
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={`border rounded-xl p-4 ${
                  changesOpen
                    ? "border-orange-300 dark:border-orange-700 bg-orange-50/40 dark:bg-orange-950/20"
                    : changeRequests.length > 0
                      ? "border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/40"
                      : "border-gray-200 dark:border-gray-800"
                }`}>
                  <div className="flex items-start gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setShowChangeHistory((v) => !v)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${changesOpen ? "text-orange-500" : "text-amber-500"}`} />
                      <h3 className="text-xs font-semibold text-gray-900 dark:text-white flex-1">
                        {tr("Dəyişiklik sorğuları", "Change requests")}
                        {changeRequests.length > 0 ? ` (${changeRequests.length})` : ""}
                      </h3>
                      {showChangeHistory ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                    {changesOpen && canEditPayments && (
                      <button
                        type="button"
                        disabled={resolveBusy}
                        onClick={() => void handleResolveChanges()}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white disabled:opacity-50 flex-shrink-0"
                        title={tr(
                          "Həll olundu — status Göndərildi olur, müştəri yenidən cavab verə bilər",
                          "Resolved — status becomes Sent so the client can respond again",
                        )}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {resolveBusy
                          ? tr("…", "…")
                          : tr("Həll olundu", "Resolved")}
                      </button>
                    )}
                  </div>
                  {changesOpen && (
                    <p className="text-[10px] text-orange-700 dark:text-orange-300 mb-3">
                      {tr(
                        "Müştəri dəyişiklik istəyib. Təklifi yeniləyin, sonra Həll olundu basın — ictimai səhifə yenidən açılacaq.",
                        "Client requested changes. Update the offer, then click Resolved — the public page unlocks again.",
                      )}
                    </p>
                  )}
                  {!changesOpen && changeRequests.length > 0 && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                      {tr(
                        "Açıq dəyişiklik yoxdur. Tarixçə aşağıdadır.",
                        "No open change request. History is below.",
                      )}
                    </p>
                  )}
                  {showChangeHistory && (
                    changeRequests.length === 0 ? (
                      <p className="text-[11px] text-gray-500">
                        {tr("Tarixçə yoxdur", "No change requests")}
                      </p>
                    ) : (
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {changeRequests.map((c, idx) => (
                          <li
                            key={c.id}
                            className={`rounded-lg border px-3 py-2 ${
                              idx === 0 && changesOpen
                                ? "border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-900"
                                : "border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60"
                            }`}
                          >
                            {idx === 0 && (
                              <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
                                changesOpen
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-gray-500"
                              }`}>
                                {changesOpen
                                  ? tr("Sonuncu (açıq)", "Latest (open)")
                                  : tr("Sonuncu", "Latest")}
                              </p>
                            )}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] text-gray-500">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                              {c.rating != null && c.rating > 0 && (
                                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                  {"★".repeat(c.rating)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {c.note}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* ── Sale Details ── */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                  {tr("Satış Detalları","Sale Details")}
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>{tr("Satış növü","Sale type")}</label>
                      <FilterSelect value={form.saleType} onChange={set("saleType")} options={SALE_TYPES} className="w-full" />
                    </div>
                    <div>
                      <label className={lbl}>{tr("Satış tarixi","Sale date")}</label>
                      <input type="date" value={form.saleDate} onChange={e => set("saleDate")(e.target.value)} className={inp} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>{tr("Haradan","From")}</label>
                      <input value={form.from} onChange={e => set("from")(e.target.value)} placeholder={tr("Çıxış şəhəri","Departure city")} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>{tr("Haraya","To")}</label>
                      <input value={form.to} onChange={e => set("to")(e.target.value)} placeholder={tr("Təyinat","Destination")} className={inp} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>{tr("Ölkə","Country")}</label>
                      <input value={form.country} onChange={e => set("country")(e.target.value)} placeholder={tr("Ölkə","Country")} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>{tr("Şəhər","City")}</label>
                      <input value={form.city} onChange={e => set("city")(e.target.value)} placeholder={tr("Şəhər","City")} className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>{tr("Otel adı","Hotel name")}</label>
                    <input value={form.hotelName} onChange={e => set("hotelName")(e.target.value)} placeholder={tr("Otel adı","Hotel name")} className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>{tr("Böyüklər sayı","Number of adults")}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.numAdults === 0 ? "" : String(form.numAdults)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          if (raw === "") {
                            set("numAdults")(0);
                            return;
                          }
                          set("numAdults")(Math.max(0, parseInt(raw, 10) || 0));
                        }}
                        placeholder="1"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>{tr("Uşaqlar sayı","Number of children")}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.numChildren === 0 ? "" : String(form.numChildren)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          if (raw === "") {
                            set("numChildren")(0);
                            return;
                          }
                          set("numChildren")(Math.max(0, parseInt(raw, 10) || 0));
                        }}
                        placeholder="0"
                        className={inp}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>{tr("Uçuş","Flight")}</label>
                      <FilterSelect value={form.flight} onChange={set("flight")} options={FLIGHT_OPTIONS} className="w-full" />
                    </div>
                    <div>
                      <label className={lbl}>{tr("Transfer","Transfer")}</label>
                      <FilterSelect value={form.transfer} onChange={set("transfer")} options={TRANSFER_OPTIONS} className="w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>{tr("Sığorta","Insurance")}</label>
                      <FilterSelect value={form.insurance} onChange={set("insurance")} options={INSURANCE_OPTIONS} className="w-full" />
                    </div>
                    <div>
                      <label className={lbl}>{tr("Qidalanma","Meal")}</label>
                      <FilterSelect value={form.meal} onChange={set("meal")} options={MEAL_OPTIONS} className="w-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Financial Details ── */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                  {tr("Maliyyə Detalları","Financial Details")}
                </h3>

                <div className="overflow-x-auto mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left text-[10px] font-medium text-gray-400 uppercase pb-2 pr-3 tracking-wider"></th>
                        <th className="text-right text-[10px] font-medium text-gray-400 uppercase pb-2 pr-1.5 tracking-wider">{tr("Məbləğ","Amount")}</th>
                        <th className="text-left text-[10px] font-medium text-gray-400 uppercase pb-2 pr-1.5 tracking-wider">{tr("Valyuta","Currency")}</th>
                        <th className="text-right text-[10px] font-medium text-gray-400 uppercase pb-2 pr-2 tracking-wider">{tr("Kurs","Rate")}</th>
                        <th className="text-left text-[10px] font-medium text-gray-400 uppercase pb-2 pr-2 tracking-wider">{tr("Tarix","Date")}</th>
                        <th className="text-right text-[10px] font-medium text-gray-400 uppercase pb-2 tracking-wider">AZN</th>
                      </tr>
                    </thead>
                    <tbody>
                      <FinRow label={tr("Maya dəyəri","Cost price")} row={form.costPrice} onChange={onCostPrice} />
                      <FinRow label={tr("Satış qiyməti","Sale price")} row={form.salePrice} onChange={onSalePrice} />
                      <FinRow label={tr("Nağd ödəniş","Paid by cash")} row={form.paidByCash} onChange={onPaidByCash} />
                      <FinRow label={tr("Köçürmə ilə","Paid by transfer")} row={form.paidByTransfer} onChange={onPaidByTransfer} />
                    </tbody>
                  </table>
                </div>

                <OfferFinanceSummary
                  expectedIncome={finance.expectedIncome}
                  debt={finance.debt}
                  actualIncome={finance.actualIncome}
                  expectedLabel={tr("Gözlənilən gəlir", "Expected income")}
                  debtLabel={tr("Borc", "Debt")}
                  actualLabel={tr("Faktiki gəlir", "Actual income")}
                />

                {/* Client / Supplier */}
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <label className={lbl}>{tr("Müştəri","Customer")}</label>
                    <ClientNameInput
                      value={form.clientName}
                      customerId={form.customerId}
                      onChange={(name, custId) =>
                        setForm((f) => ({ ...f, clientName: name, customerId: custId }))
                      }
                      language={language}
                      inputClass={inp}
                      excludeOfferId={editOffer?.id}
                      onNewCustomer={() => setAddCustomerOpen(true)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className={lbl}>{tr("Ödəniş son tarixi","Payment deadline")}</label>
                      <input type="date" value={form.paymentDeadline} onChange={e => set("paymentDeadline")(e.target.value)} className={inp} />
                    </div>
                    <button type="button" onClick={() => generateInvoice("en")}
                      className="flex-shrink-0 px-2.5 py-1.5 text-xs border border-[#14b8a6] text-[#14b8a6] rounded-lg hover:bg-[#14b8a6]/10 dark:hover:bg-[#14b8a6]/10 font-medium transition-colors whitespace-nowrap">
                      Invoice EN
                    </button>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className={lbl}>{tr("Tədarükçü","Supplier")}</label>
                      <input value={form.supplier} onChange={e => set("supplier")(e.target.value)} placeholder={tr("Tədarükçü adı","Supplier name")} className={inp} />
                    </div>
                    <button type="button" onClick={() => generateInvoice("az")}
                      className="flex-shrink-0 px-2.5 py-1.5 text-xs border border-[#14b8a6] text-[#14b8a6] rounded-lg hover:bg-[#14b8a6]/10 dark:hover:bg-[#14b8a6]/10 font-medium transition-colors whitespace-nowrap">
                      Invoice AZ
                    </button>
                  </div>
                  <div>
                    <label className={lbl}>{tr("Agent","Agent")}</label>
                    <input value={form.agent} onChange={e => set("agent")(e.target.value)} placeholder={tr("Agent adı","Agent name")} className={inp} />
                  </div>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {tr("Bu məhsulla təmin edilən müştərilər","Clients provided with current product")}
                </span>
                <button type="button" onClick={addPassenger}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#14b8a6] border border-[#14b8a6] rounded-lg hover:bg-[#14b8a6]/10 dark:hover:bg-[#14b8a6]/10 transition-colors">
                  <UserPlus className="w-3 h-3" />
                  {tr("Sərnişin əlavə et","+ Add passenger")}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 w-8">#</th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">{tr("Müştəri Tam Adı","Client Full Name")}</th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">{tr("Doğum tarixi","Date of Birth")}</th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">{tr("Pasport №","Passport Number")}</th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">{tr("Pasport Bitmə","Passport Expiry")}</th>
                      <th className="w-8 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.passengers.map((p, i) => (
                      <tr key={p.id} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}>
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap" title={String(i + 1)}>
                          {passengerLabel(i, form.numAdults, language)}
                        </td>
                        <td className="px-3 py-1.5">
                          <input value={p.fullName} onChange={e => updatePassenger(p.id, "fullName", e.target.value)}
                            placeholder={tr("Tam ad","Full name")}
                            className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#14b8a6]" />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="date" value={p.dob} onChange={e => updatePassenger(p.id, "dob", e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#14b8a6]" />
                        </td>
                        <td className="px-3 py-1.5">
                          <input value={p.passportNo} onChange={e => updatePassenger(p.id, "passportNo", e.target.value)}
                            placeholder="AA1234567"
                            className="w-full px-2 py-1 text-xs font-mono border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#14b8a6]" />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="date" value={p.passportExpiry} onChange={e => updatePassenger(p.id, "passportExpiry", e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#14b8a6]" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {form.passengers.length > 1 && (
                            <button type="button" onClick={() => removePassenger(p.id)} className="text-red-400 hover:text-red-600 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50">
              {tr("Ləğv Et","Cancel")}
            </button>
            <button type="button" onClick={() => void handleSendAsOffer()} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#14b8a6] dark:border-[#14b8a6] rounded-lg text-[#14b8a6] dark:text-[#14b8a6] hover:bg-[#14b8a6]/5 dark:hover:bg-blue-900/20 transition-colors font-medium bg-white dark:bg-gray-800 disabled:opacity-50">
              <Share2 className="w-3 h-3" />
              {tr("Təklif Olaraq Göndər","Send as Offer")}
            </button>
            <button type="button" onClick={() => void handleMakeDeal()} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              <CheckCircle className="w-3 h-3" />
              {tr("Sövdələşmə Et","Make it Deal")}
            </button>
          </div>
        </div>
      </div>

      <AddCustomerModal
        isOpen={addCustomerOpen}
        onClose={() => {
          if (!savingCustomer) setAddCustomerOpen(false);
        }}
        saving={savingCustomer}
        onSave={async (data: CustomerFormData) => {
          setSavingCustomer(true);
          try {
            const created = await createCustomer({
              name: data.name,
              email: data.email || null,
              phone: data.phone || null,
              status: data.status,
            });
            setForm((f) => ({
              ...f,
              clientName: created.name,
              customerId: created.id,
            }));
            setAddCustomerOpen(false);
            notifySuccess(tr("Müştəri yaradıldı", "Customer created"));
          } catch (err) {
            notifyFromError(err);
          } finally {
            setSavingCustomer(false);
          }
        }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Offers() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { isGlobalMode, branchId } = useBranch();
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Offers");
  const tr = (az: string, en: string) => (language === "az" ? az : en);

  const [offers, setOffers] = useState<TravelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<TravelOffer | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setTotals,
    resetToFirstPage,
  } = useServerPagination(DEFAULT_LIST_PAGE_SIZE);

  const needsBranch = isGlobalMode && !branchId;
  const canMutate = !isDemo && !needsBranch;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    resetToFirstPage();
  }, [debouncedSearch, selectedStatus, branchRevision, resetToFirstPage]);

  const loadOffers = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setOffers([]);
      setTotals(0, 1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchOffers({
        search: debouncedSearch.trim() || undefined,
        status: selectedStatus === "all" ? "all" : (selectedStatus as TravelOffer["status"]),
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setOffers((Array.isArray(result.items) ? result.items : []).map(mapRow));
      setTotals(result.total ?? 0, result.totalPages);
    } catch (err) {
      notifyFromError(err);
      setOffers([]);
      setTotals(0, 1);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    isDemo,
    canView,
    debouncedSearch,
    selectedStatus,
    currentPage,
    itemsPerPage,
    branchRevision,
    setTotals,
  ]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  function openAdd() { setEditingOffer(null); setShowModal(true); }
  function openEdit(o: TravelOffer) { setEditingOffer(o); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditingOffer(null); }

  async function ensurePublicToken(o: TravelOffer): Promise<string> {
    if (o.publicToken) return o.publicToken;
    const pub = await publishOffer(o.id);
    setOffers((prev) =>
      prev.map((x) =>
        x.id === o.id
          ? { ...x, publicToken: pub.publicToken, status: pub.status, displayCode: pub.displayCode }
          : x,
      ),
    );
    return pub.publicToken;
  }

  async function handleCopyUrl(o: TravelOffer) {
    if (!canMutate) return;
    try {
      const token = await ensurePublicToken(o);
      const url = `${window.location.origin}/offer-view/${token}`;
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
      setCopiedId(o.id);
      setTimeout(() => setCopiedId(null), 2000);
      notifySuccess(tr("URL kopyalandı", "URL copied"));
    } catch (err) {
      notifyFromError(err);
    }
  }

  async function handleVisit(o: TravelOffer) {
    if (!canMutate && !o.publicToken) return;
    try {
      const token = o.publicToken || (canMutate ? await ensurePublicToken(o) : "");
      if (!token) return;
      navigate(`/offer-view/${token}`);
    } catch (err) {
      notifyFromError(err);
    }
  }

  async function handleSave(body: OfferWriteBody, opts?: { navigatePublic?: boolean }) {
    if (!canMutate) {
      notifyFromError(new Error(tr("Filial seçin və ya demo rejimində dəyişiklik edilə bilməz", "Select a branch, or demo mode cannot save")));
      return;
    }
    setSaving(true);
    try {
      let row: TravelOfferRow;
      if (editingOffer) {
        if (!canEdit) throw new Error(tr("Redaktə icazəsi yoxdur", "No edit permission"));
        row = await updateOffer(editingOffer.id, body);
      } else {
        if (!canCreate) throw new Error(tr("Yaratma icazəsi yoxdur", "No create permission"));
        row = await createOffer(body);
      }
      let token = row.publicToken;
      if (opts?.navigatePublic) {
        const pub = await publishOffer(row.id);
        token = pub.publicToken;
        row = { ...row, publicToken: pub.publicToken, status: pub.status };
      }
      closeModal();
      notifySuccess(editingOffer ? tr("Təklif yeniləndi", "Offer updated") : tr("Təklif yaradıldı", "Offer created"));
      await loadOffers();
      if (opts?.navigatePublic && token) {
        navigate(`/offer-view/${token}`);
      }
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(o: TravelOffer) {
    if (!canDelete || !canMutate) return;
    const ok = await askConfirm({
      title: tr("Təklifi sil", "Delete offer"),
      message: tr(
        `${o.displayCode} silinsin?`,
        `Delete ${o.displayCode}?`,
      ),
      confirmLabel: tr("Sil", "Delete"),
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiDeleteOffer(o.id);
      notifySuccess(tr("Təklif silindi", "Offer deleted"));
      await loadOffers();
    } catch (err) {
      notifyFromError(err);
    }
  }

  async function handleStatusChange(o: TravelOffer, status: OfferStatusUi) {
    if (!canEdit || !canMutate || status === o.status) return;
    try {
      const row = await updateOffer(o.id, { status });
      setOffers((prev) => prev.map((x) => (x.id === o.id ? mapRow(row) : x)));
      notifySuccess(tr("Status yeniləndi", "Status updated"));
    } catch (err) {
      notifyFromError(err);
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Səyahət Təklifləri","Travel Offers")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Müştərilər üçün səyahət təkliflərini idarə edin","Manage travel offers for your clients")}
          </p>
          {needsBranch && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              {tr("Təklifləri idarə etmək üçün filial seçin.", "Select a branch to manage offers.")}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button type="button" onClick={() => alert(tr("PDF ixrac funksiyası tezliklə","Export PDF coming soon"))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>
          <button type="button" onClick={() => exportToExcel(
            ["ID", tr("Növ", "Type"), tr("Tarix", "Date"), tr("Haradan", "From"), tr("Haraya", "To"), tr("Ölkə", "Country"), tr("Şəhər", "City"), tr("Otel", "Hotel"), tr("Böyüklər", "Adults"), tr("Uşaqlar", "Children"), tr("Uçuş", "Flight"), tr("Transfer", "Transfer"), tr("Sığorta", "Insurance"), tr("Qidalanma", "Meal"), tr("Maya məbləği", "Cost Amount"), tr("Maya valyutası", "Cost Currency"), tr("Maya kursu", "Cost Rate"), tr("Maya AZN", "Cost AZN"), tr("Satış məbləği", "Sale Amount"), tr("Satış valyutası", "Sale Currency"), tr("Satış kursu", "Sale Rate"), tr("Satış AZN", "Sale AZN"), tr("Nağd ödəniş AZN", "Paid Cash AZN"), tr("Köçürmə AZN", "Paid Transfer AZN"), tr("Gözlənilən gəlir", "Expected Income"), tr("Borc", "Debt"), tr("Faktiki gəlir", "Actual Income"), tr("Müştəri", "Client"), tr("Agent", "Agent"), tr("Tədarükçü", "Supplier"), tr("Ödəniş son tarixi", "Payment Deadline"), "Status", tr("Yaradılma tarixi", "Created At")],
            offers.map(o => [
              o.displayCode, o.saleType, o.saleDate, o.from, o.to, o.country, o.city, o.hotelName,
              o.numAdults, o.numChildren, o.flight, o.transfer, o.insurance, o.meal,
              o.costPrice.amount, o.costPrice.currency, o.costPrice.rate, calcAZN(o.costPrice.amount, o.costPrice.rate).toFixed(2),
              o.salePrice.amount, o.salePrice.currency, o.salePrice.rate, calcAZN(o.salePrice.amount, o.salePrice.rate).toFixed(2),
              calcAZN(o.paidByCash.amount, o.paidByCash.rate).toFixed(2),
              calcAZN(o.paidByTransfer.amount, o.paidByTransfer.rate).toFixed(2),
              o.expectedIncome, o.debt, o.actualIncome,
              o.clientName, offerAgentLabel(o), o.supplier, o.paymentDeadline, o.status, o.createdAt,
            ]),
            "travel_offers"
          )}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>
          <button type="button" onClick={() => void loadOffers()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {canCreate && canMutate && (
            <button type="button" onClick={openAdd}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Təklif Əlavə Et","Add Offer")}</span>
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder={tr("Axtar...","Search...")} value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div className="flex gap-2 ml-auto">
              <FilterSelect value={selectedStatus} onChange={setSelectedStatus}
                options={[
                  { value: "all",      label: tr("Status","Status")        },
                  { value: "active",   label: tr("Aktiv","Active")         },
                  { value: "sent",     label: tr("Göndərildi","Sent")      },
                  { value: "inactive", label: tr("Qeyri-aktiv","Inactive") },
                  { value: "expired",  label: tr("Vaxtı bitmiş","Expired") },
                  { value: "accepted", label: tr("Qəbul edildi","Accepted") },
                  { value: "rejected", label: tr("Rədd edildi","Rejected") },
                  { value: "changing", label: tr("Dəyişiklik","Changing") },
                ]} />
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
                    tr("MÜŞTƏRİ","CLIENT"), tr("NÖV","TYPE"), tr("TARİX","DATE"),
                    tr("CƏMİ QİYMƏT","TOTAL PRICE"), tr("MAYA DƏYƏRİ","COST"),
                    tr("GƏLİR","REVENUE"), tr("STATUS","STATUS"),
                    tr("AGENT","AGENT"), tr("ƏMƏLİYYATLAR","ACTIONS"),
                  ].map(h => (
                    <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    {tr("Yüklənir…","Loading…")}
                  </td></tr>
                ) : offers.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    {tr("Təklif tapılmadı.","No offers found.")}
                  </td></tr>
                ) : offers.map((o, i) => {
                  const totalAZN   = calcAZN(o.salePrice.amount, o.salePrice.rate);
                  const costAZN    = calcAZN(o.costPrice.amount,  o.costPrice.rate);
                  const revenueAZN = totalAZN - costAZN;
                  return (
                    <tr key={o.id} className={`border-b border-gray-200 dark:border-gray-800 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate("/dashboard/people/customers")}
                          className="text-xs text-[#14b8a6] dark:text-[#14b8a6] hover:underline text-left whitespace-nowrap font-medium"
                        >
                          {o.clientName || "—"}
                        </button>
                        <p className="text-[10px] text-gray-400 mt-0.5">{o.displayCode}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(o.pendingBankPaymentCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-400 dark:border-amber-600 animate-pulse">
                              <Banknote className="w-2.5 h-2.5" />
                              {tr("Təsdiq lazım", "Needs confirm")} · {o.pendingBankPaymentCount}
                            </span>
                          )}
                          {o.status === "changing" && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-400 dark:border-orange-600 max-w-[160px] truncate animate-pulse"
                              title={o.latestChangeNote ?? undefined}
                            >
                              <MessageSquare className="w-2.5 h-2.5 flex-shrink-0" />
                              {tr("Açıq dəyişiklik", "Open changes")}
                              {(o.changeRequestCount ?? 0) > 0 ? ` · ${o.changeRequestCount}` : ""}
                            </span>
                          )}
                          {o.status !== "changing" && (o.changeRequestCount ?? 0) > 0 && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 max-w-[160px] truncate"
                              title={o.latestChangeNote ?? undefined}
                            >
                              <MessageSquare className="w-2.5 h-2.5 flex-shrink-0" />
                              {tr("Tarixçə", "History")} · {o.changeRequestCount}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50">
                          {o.saleType}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{o.saleDate}</td>

                      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {totalAZN.toFixed(0)} AZN
                      </td>

                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {costAZN.toFixed(0)} AZN
                      </td>

                      <td className="px-3 py-2 text-xs font-semibold whitespace-nowrap">
                        <span className={revenueAZN >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
                          {revenueAZN >= 0 ? "+" : ""}{revenueAZN.toFixed(0)} AZN
                        </span>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        {canEdit && canMutate ? (
                          <select
                            value={o.status}
                            onChange={(e) => void handleStatusChange(o, e.target.value as OfferStatusUi)}
                            className={`text-[10px] font-medium rounded px-1.5 py-0.5 border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#14b8a6] ${STATUS_BADGE[o.status]}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {language === "az" ? STATUS_LABEL[s].az : STATUS_LABEL[s].en}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[o.status]}`}>
                            {language === "az" ? STATUS_LABEL[o.status].az : STATUS_LABEL[o.status].en}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        {(() => {
                          const agentLabel = offerAgentLabel(o);
                          const agentPath = o.createdByUserId
                            ? `/dashboard/user-management/users/${o.createdByUserId}`
                            : "/dashboard/user-management";
                          return (
                            <button
                              type="button"
                              onClick={() => navigate(agentPath)}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                              title={tr("Təklifi yaradan", "Offer creator")}
                            >
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[10px] font-bold flex-shrink-0">
                                {getEmpInitials(agentLabel || "?")}
                              </div>
                              <p className="text-xs text-gray-900 dark:text-white whitespace-nowrap">
                                {agentLabel || "—"}
                              </p>
                            </button>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {(canEdit || canView) && (
                            <button type="button" onClick={() => openEdit(o)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                                (o.pendingBankPaymentCount ?? 0) > 0 || o.status === "changing"
                                  ? "bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 shadow-sm"
                                  : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                              title={
                                (o.pendingBankPaymentCount ?? 0) > 0
                                  ? tr("Köçürmə təsdiqi lazımdır — açın", "Bank confirmation needed — open")
                                  : o.status === "changing"
                                    ? tr("Açıq dəyişiklik sorğusu — açın", "Open change request — open")
                                    : tr("Bax / Redaktə Et", "View / Edit")
                              }>
                              <Eye className="w-3 h-3" />
                              {((o.pendingBankPaymentCount ?? 0) > 0 || o.status === "changing") && (
                                <span className="text-[10px] font-bold">!</span>
                              )}
                            </button>
                          )}
                          <button type="button" onClick={() => void handleVisit(o)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title={tr("Təklif səhifəsinə keç","Visit offer page")}>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => void handleCopyUrl(o)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                              copiedId === o.id
                                ? "bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400"
                                : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                            title={copiedId === o.id ? tr("Kopyalandı!","URL Copied!") : tr("URL kopyala","Copy offer URL")}>
                            {copiedId === o.id ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                          </button>
                          {canDelete && canMutate && (
                            <button type="button" onClick={() => void handleDelete(o)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title={tr("Sil","Delete")}>
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
          {totalPages > 1 && (
            <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-2">
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                showText={dataPaginationShowText(tr)}
              />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddOfferModal
          onClose={closeModal}
          onSave={handleSave}
          editOffer={editingOffer ?? undefined}
          saving={saving}
          canEditPayments={canEdit && canMutate}
          onPaymentsChanged={() => void loadOffers()}
          onOfferUpdated={(row) => {
            setEditingOffer(row);
            setOffers((prev) => prev.map((x) => (x.id === row.id ? row : x)));
          }}
        />
      )}
    </div>
  );
}
