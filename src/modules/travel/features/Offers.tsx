import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search, Plus, FileText, FileSpreadsheet, RefreshCw,
  Eye, Trash2, X, Calculator, Share2, CheckCircle,
  UserPlus, ExternalLink, Link2, Check, ChevronDown,
  Clock, MapPin,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
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
  paymentDeadline: string;
  supplier: string;
  agent: string;
  passengers: Passenger[];
  status: "active" | "inactive" | "sent" | "expired";
  createdAt: string;
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

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_OFFERS: TravelOffer[] = [
  {
    id: "TRV-001", saleType: "Tour", saleDate: "2026-09-15",
    from: "Baku", to: "Istanbul", country: "Turkey", city: "Istanbul",
    hotelName: "Grand Hyatt Istanbul",
    numAdults: 2, numChildren: 1,
    flight: "Included", transfer: "Included", insurance: "Basic", meal: "Breakfast Only",
    costPrice:      { amount: "3500", currency: "USD", rate: "1.70", date: "2026-08-15" },
    salePrice:      { amount: "4500", currency: "USD", rate: "1.70", date: "2026-08-15" },
    paidByCash:     { amount: "2000", currency: "AZN", rate: "1",    date: "2026-08-20" },
    paidByTransfer: { amount: "3650", currency: "AZN", rate: "1",    date: "2026-08-25" },
    expectedIncome: 1700, debt: 0, actualIncome: 550,
    clientName: "Nigar Babayeva", paymentDeadline: "2026-09-01",
    supplier: "Anatolian Tours", agent: "a.hartwell",
    passengers: [{ id: "p1", fullName: "Nigar Babayeva", dob: "1988-05-12", passportNo: "TK9876543", passportExpiry: "2030-05-12" }],
    status: "active", createdAt: "2026-08-15",
  },
  {
    id: "TRV-002", saleType: "Package", saleDate: "2026-10-01",
    from: "Baku", to: "Dubai", country: "UAE", city: "Dubai",
    hotelName: "Atlantis The Palm",
    numAdults: 2, numChildren: 0,
    flight: "Included", transfer: "Included", insurance: "Premium", meal: "All Inclusive",
    costPrice:      { amount: "5000", currency: "USD", rate: "1.70", date: "2026-08-28" },
    salePrice:      { amount: "6200", currency: "USD", rate: "1.70", date: "2026-08-28" },
    paidByCash:     { amount: "5000", currency: "AZN", rate: "1",    date: "2026-09-01" },
    paidByTransfer: { amount: "5540", currency: "AZN", rate: "1",    date: "2026-09-01" },
    expectedIncome: 2040, debt: 0, actualIncome: -540,
    clientName: "Anar Həsənov", paymentDeadline: "2026-09-15",
    supplier: "Emirates Tours", agent: "m.delgado",
    passengers: [{ id: "p1", fullName: "Anar Həsənov", dob: "1990-03-15", passportNo: "AA1234567", passportExpiry: "2029-03-15" }],
    status: "sent", createdAt: "2026-08-28",
  },
  {
    id: "TRV-003", saleType: "Hotel", saleDate: "2026-08-20",
    from: "Baku", to: "Antalya", country: "Turkey", city: "Antalya",
    hotelName: "Rixos Premium Belek",
    numAdults: 2, numChildren: 2,
    flight: "Separate", transfer: "Included", insurance: "Basic", meal: "All Inclusive",
    costPrice:      { amount: "2200", currency: "USD", rate: "1.70", date: "2026-08-01" },
    salePrice:      { amount: "3100", currency: "USD", rate: "1.70", date: "2026-08-01" },
    paidByCash:     { amount: "5270", currency: "AZN", rate: "1",    date: "2026-08-05" },
    paidByTransfer: { amount: "0",    currency: "AZN", rate: "1",    date: ""           },
    expectedIncome: 1530, debt: 0, actualIncome: 1540,
    clientName: "Leyla Əliyeva", paymentDeadline: "2026-08-15",
    supplier: "Pegasus Hotels", agent: "a.hartwell",
    passengers: [{ id: "p1", fullName: "Leyla Əliyeva", dob: "1992-07-18", passportNo: "AA2345678", passportExpiry: "2028-07-18" }],
    status: "active", createdAt: "2026-08-01",
  },
  {
    id: "TRV-004", saleType: "Tour", saleDate: "2026-07-10",
    from: "Baku", to: "Istanbul", country: "Turkey", city: "Istanbul",
    hotelName: "Hilton Bomonti",
    numAdults: 2, numChildren: 0,
    flight: "Included", transfer: "None", insurance: "None", meal: "Breakfast Only",
    costPrice:      { amount: "1800", currency: "USD", rate: "1.70", date: "2026-07-01" },
    salePrice:      { amount: "2400", currency: "USD", rate: "1.70", date: "2026-07-01" },
    paidByCash:     { amount: "4080", currency: "AZN", rate: "1",    date: "2026-07-05" },
    paidByTransfer: { amount: "0",    currency: "AZN", rate: "1",    date: ""           },
    expectedIncome: 1020, debt: 0, actualIncome: 1020,
    clientName: "Nigar Babayeva", paymentDeadline: "2026-07-08",
    supplier: "Anatolian Tours", agent: "a.hartwell",
    passengers: [{ id: "p1", fullName: "Nigar Babayeva", dob: "1988-05-12", passportNo: "TK9876543", passportExpiry: "2030-05-12" }],
    status: "active", createdAt: "2026-07-01",
  },
  {
    id: "TRV-005", saleType: "Package", saleDate: "2026-06-15",
    from: "Baku", to: "Dubai", country: "UAE", city: "Dubai",
    hotelName: "Burj Al Arab",
    numAdults: 2, numChildren: 1,
    flight: "Included", transfer: "Included", insurance: "Premium", meal: "Full Board",
    costPrice:      { amount: "4200", currency: "USD", rate: "1.70", date: "2026-06-01" },
    salePrice:      { amount: "5500", currency: "USD", rate: "1.70", date: "2026-06-01" },
    paidByCash:     { amount: "4675", currency: "AZN", rate: "1",    date: "2026-06-10" },
    paidByTransfer: { amount: "4675", currency: "AZN", rate: "1",    date: "2026-06-10" },
    expectedIncome: 2210, debt: 0, actualIncome: 1050,
    clientName: "Anar Həsənov", paymentDeadline: "2026-06-12",
    supplier: "Emirates Tours", agent: "m.delgado",
    passengers: [{ id: "p1", fullName: "Anar Həsənov", dob: "1990-03-15", passportNo: "AA1234567", passportExpiry: "2029-03-15" }],
    status: "active", createdAt: "2026-06-01",
  },
];

const STATUS_BADGE: Record<TravelOffer["status"], string> = {
  active:   "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600",
  sent:     "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50",
  expired:  "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
};

const STATUS_LABEL: Record<TravelOffer["status"], { en: string; az: string }> = {
  active:   { en: "Active",    az: "Aktiv"          },
  inactive: { en: "Inactive",  az: "Qeyri-aktiv"    },
  sent:     { en: "Sent",      az: "Göndərildi"     },
  expired:  { en: "Expired",   az: "Vaxtı bitmiş"   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAZN(amount: string, rate: string): number {
  return (parseFloat(amount) || 0) * (parseFloat(rate) || 1);
}

function blankRow(currency = "USD"): FinancialRow {
  return { amount: "0", currency, rate: "1.0000", date: "" };
}

function freshForm() {
  return {
    saleType: "Tour", saleDate: new Date().toISOString().split("T")[0],
    from: "", to: "", country: "", city: "", hotelName: "",
    numAdults: 1, numChildren: 0,
    flight: "", transfer: "", insurance: "", meal: "",
    costPrice: blankRow("USD"), salePrice: blankRow("USD"),
    paidByCash: blankRow("AZN"), paidByTransfer: blankRow("AZN"),
    clientName: "", paymentDeadline: "", supplier: "", agent: "",
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
    clientName: editOffer.clientName, paymentDeadline: editOffer.paymentDeadline,
    supplier: editOffer.supplier, agent: editOffer.agent, passengers: editOffer.passengers,
  };
}

// ─── Financial Row ────────────────────────────────────────────────────────────

function FinRow({ label, row, onChange }: { label: string; row: FinancialRow; onChange: (r: FinancialRow) => void }) {
  const azn = calcAZN(row.amount, row.rate).toFixed(2);
  const inp = "px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#14b8a6] text-right";
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <td className="py-2 pr-3 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{label}</td>
      <td className="py-2 pr-1.5">
        <input type="number" min="0" step="0.01" value={row.amount}
          onChange={e => onChange({ ...row, amount: e.target.value })}
          className={`w-20 ${inp}`} placeholder="0.00" />
      </td>
      <td className="py-2 pr-1.5">
        {/* FilterSelect now uses a portal — no clipping inside overflow-x-auto */}
        <FilterSelect value={row.currency} onChange={v => onChange({ ...row, currency: v })} options={CURRENCIES} />
      </td>
      <td className="py-2 pr-1.5">
        <input type="number" min="0" step="0.0001" value={row.rate}
          onChange={e => onChange({ ...row, rate: e.target.value })}
          className={`w-20 ${inp}`} placeholder="1.0000" />
      </td>
      <td className="py-2 pr-2">
        <input type="date" value={row.date} onChange={e => onChange({ ...row, date: e.target.value })}
          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#14b8a6]" />
      </td>
      <td className="py-2 text-xs font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap pl-2 min-w-[60px]">
        {azn}
      </td>
    </tr>
  );
}

// ─── Client Autocomplete + History ────────────────────────────────────────────

function ClientNameInput({
  value, onChange, existingOffers, language, inputClass,
}: {
  value: string;
  onChange: (v: string) => void;
  existingOffers: TravelOffer[];
  language: string;
  inputClass: string;
}) {
  const tr = (az: string, en: string) => language === "az" ? az : en;
  const [showSug, setShowSug] = useState(false);
  const [history, setHistory] = useState<TravelOffer[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const uniqueClients = [...new Set(existingOffers.map(o => o.clientName).filter(Boolean))];
  const suggestions = value.length > 0
    ? uniqueClients.filter(n => n.toLowerCase().includes(value.toLowerCase()) && n !== value)
    : [];

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

  function selectClient(name: string) {
    onChange(name);
    setShowSug(false);
    setHistory(existingOffers.filter(o => o.clientName === name).slice(0, 5));
  }

  function handleChange(v: string) {
    onChange(v);
    setShowSug(true);
    if (!v) setHistory([]);
  }

  return (
    <div ref={containerRef} className="flex-1 space-y-2">
      <div className="relative">
        <input
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (value) setShowSug(true); }}
          placeholder={tr("Müştəri adı", "Client name")}
          className={inputClass}
          autoComplete="off"
        />
        {showSug && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50 overflow-hidden">
            <p className="px-3 py-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
              {tr("Əvvəlki müştərilər", "Previous clients")}
            </p>
            {suggestions.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => selectClient(name)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[9px] font-bold flex-shrink-0">
                  {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium">{name}</span>
                <span className="ml-auto text-[10px] text-gray-400">
                  {existingOffers.filter(o => o.clientName === name).length}{" "}
                  {tr("təklif", "offer")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Previous offers for selected client */}
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
                    <span className="text-[10px] font-semibold text-[#14b8a6] dark:text-[#14b8a6]">{o.id}</span>
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
  onClose, onSave, editOffer, existingOffers,
}: {
  onClose: () => void;
  onSave: (o: TravelOffer) => void;
  editOffer?: TravelOffer;
  existingOffers: TravelOffer[];
}) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);

  const [form, setForm] = useState(() => initForm(editOffer));
  const [calc, setCalc] = useState({ expectedIncome: 0, debt: 0, actualIncome: 0, done: false });

  const set = (k: string) => (v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const setRow = (k: "costPrice" | "salePrice" | "paidByCash" | "paidByTransfer") =>
    (r: FinancialRow) => setForm(f => ({ ...f, [k]: r }));

  function recalculate() {
    const costAZN  = calcAZN(form.costPrice.amount,      form.costPrice.rate);
    const saleAZN  = calcAZN(form.salePrice.amount,      form.salePrice.rate);
    const cashAZN  = calcAZN(form.paidByCash.amount,     form.paidByCash.rate);
    const transAZN = calcAZN(form.paidByTransfer.amount, form.paidByTransfer.rate);
    setCalc({ expectedIncome: saleAZN - costAZN, debt: saleAZN - cashAZN - transAZN, actualIncome: cashAZN + transAZN - costAZN, done: true });
  }

  function addPassenger() {
    setForm(f => ({ ...f, passengers: [...f.passengers, { id: `p${Date.now()}`, fullName: "", dob: "", passportNo: "", passportExpiry: "" }] }));
  }
  function updatePassenger(id: string, field: keyof Passenger, value: string) {
    setForm(f => ({ ...f, passengers: f.passengers.map(p => p.id === id ? { ...p, [field]: value } : p) }));
  }
  function removePassenger(id: string) {
    setForm(f => ({ ...f, passengers: f.passengers.filter(p => p.id !== id) }));
  }

  function buildOffer(status: TravelOffer["status"]): TravelOffer {
    return {
      id: editOffer ? editOffer.id : `TRV-${Date.now()}`,
      ...form,
      expectedIncome: calc.expectedIncome, debt: calc.debt, actualIncome: calc.actualIncome,
      status, createdAt: editOffer ? editOffer.createdAt : new Date().toISOString().split("T")[0],
    };
  }

  function handleMakeDeal() { onSave(buildOffer("active")); onClose(); }
  function handleSendAsOffer() {
    const offer = buildOffer("sent");
    try { localStorage.setItem(`inflero_offer_${offer.id}`, JSON.stringify(offer)); } catch {}
    onSave(offer); onClose(); navigate(`/offer-view/${offer.id}`);
  }

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
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {editOffer ? tr("Təklifi Redaktə Et","Edit Offer") : tr("Yeni Təklif Əlavə Et","Add New Offer")}
            </h2>
            <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
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
                      <input type="number" min="1" value={form.numAdults} onChange={e => set("numAdults")(parseInt(e.target.value) || 1)} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>{tr("Uşaqlar sayı","Number of children")}</label>
                      <input type="number" min="0" value={form.numChildren} onChange={e => set("numChildren")(parseInt(e.target.value) || 0)} className={inp} />
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
                      <FinRow label={tr("Maya dəyəri","Cost price")}       row={form.costPrice}      onChange={setRow("costPrice")} />
                      <FinRow label={tr("Satış qiyməti","Sale price")}      row={form.salePrice}      onChange={setRow("salePrice")} />
                      <FinRow label={tr("Nağd ödəniş","Paid by cash")}      row={form.paidByCash}     onChange={setRow("paidByCash")} />
                      <FinRow label={tr("Köçürmə ilə","Paid by transfer")}  row={form.paidByTransfer} onChange={setRow("paidByTransfer")} />
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="space-y-0 mb-5">
                  {[
                    { key: "expectedIncome", label: tr("Gözlənilən gəlir","Expected income"), extra: (
                      <button type="button" onClick={recalculate}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border border-[#14b8a6] text-[#14b8a6] rounded-md hover:bg-[#14b8a6]/10 dark:hover:bg-[#14b8a6]/10 transition-colors">
                        <Calculator className="w-2.5 h-2.5" />
                        {tr("Hesabla","Calculate")}
                      </button>
                    )},
                    { key: "debt",           label: tr("Borc","Debt"),                    extra: null },
                    { key: "actualIncome",   label: tr("Faktiki gəlir","Actual income"),   extra: null },
                  ].map(({ key, label, extra }) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${key === "debt" && calc.done && calc.debt > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                          {calc.done ? (calc as Record<string, number>)[key].toFixed(2) : "0.00"} AZN
                        </span>
                        {extra}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Client / Supplier */}
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <label className={lbl}>{tr("Müştəri adı","Client Name")}</label>
                    <ClientNameInput
                      value={form.clientName}
                      onChange={v => set("clientName")(v)}
                      existingOffers={existingOffers.filter(o => !editOffer || o.id !== editOffer.id)}
                      language={language}
                      inputClass={inp}
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
                  {tr("Müştəri Əlavə Et","+ Add client")}
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
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{i + 1}</td>
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
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
              {tr("Ləğv Et","Cancel")}
            </button>
            <button type="button" onClick={handleSendAsOffer}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#14b8a6] dark:border-[#14b8a6] rounded-lg text-[#14b8a6] dark:text-[#14b8a6] hover:bg-[#14b8a6]/5 dark:hover:bg-blue-900/20 transition-colors font-medium bg-white dark:bg-gray-800">
              <Share2 className="w-3 h-3" />
              {tr("Təklif Olaraq Göndər","Send as Offer")}
            </button>
            <button type="button" onClick={handleMakeDeal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
              <CheckCircle className="w-3 h-3" />
              {tr("Sövdələşmə Et","Make it Deal")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Offers() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);

  const [offers, setOffers] = useState<TravelOffer[]>(() => {
    try {
      const stored = localStorage.getItem("inflero_offers");
      if (stored) return JSON.parse(stored);
    } catch {}
    return SEED_OFFERS;
  });

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<TravelOffer | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem("inflero_offers", JSON.stringify(offers)); } catch {}
  }, [offers]);

  function openAdd() { setEditingOffer(null); setShowModal(true); }
  function openEdit(o: TravelOffer) { setEditingOffer(o); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditingOffer(null); }

  function handleCopyUrl(id: string) {
    const url = `${window.location.origin}/offer-view/${id}`;
    try { navigator.clipboard.writeText(url); } catch {}
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSave(offer: TravelOffer) {
    setOffers(prev => {
      const exists = prev.some(o => o.id === offer.id);
      return exists ? prev.map(o => o.id === offer.id ? offer : o) : [offer, ...prev];
    });
  }

  function handleDelete(id: string) {
    if (confirm(tr("Bu təklifi silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this offer?"))) {
      setOffers(prev => prev.filter(o => o.id !== id));
    }
  }

  const filtered = offers.filter(o => {
    const matchSearch = !search ||
      `${o.from} ${o.to} ${o.clientName} ${o.hotelName} ${o.saleType} ${o.country}`
        .toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === "all" || o.status === selectedStatus;
    return matchSearch && matchStatus;
  });

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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button onClick={() => alert(tr("PDF ixrac funksiyası tezliklə","Export PDF coming soon"))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>
          <button onClick={() => exportToExcel(
            ["ID", tr("Növ", "Type"), tr("Tarix", "Date"), tr("Haradan", "From"), tr("Haraya", "To"), tr("Ölkə", "Country"), tr("Şəhər", "City"), tr("Otel", "Hotel"), tr("Böyüklər", "Adults"), tr("Uşaqlar", "Children"), tr("Uçuş", "Flight"), tr("Transfer", "Transfer"), tr("Sığorta", "Insurance"), tr("Qidalanma", "Meal"), tr("Maya məbləği", "Cost Amount"), tr("Maya valyutası", "Cost Currency"), tr("Maya kursu", "Cost Rate"), tr("Maya AZN", "Cost AZN"), tr("Satış məbləği", "Sale Amount"), tr("Satış valyutası", "Sale Currency"), tr("Satış kursu", "Sale Rate"), tr("Satış AZN", "Sale AZN"), tr("Nağd ödəniş AZN", "Paid Cash AZN"), tr("Köçürmə AZN", "Paid Transfer AZN"), tr("Gözlənilən gəlir", "Expected Income"), tr("Borc", "Debt"), tr("Faktiki gəlir", "Actual Income"), tr("Müştəri", "Client"), tr("Agent", "Agent"), tr("Tədarükçü", "Supplier"), tr("Ödəniş son tarixi", "Payment Deadline"), "Status", tr("Yaradılma tarixi", "Created At")],
            filtered.map(o => [
              o.id, o.saleType, o.saleDate, o.from, o.to, o.country, o.city, o.hotelName,
              o.numAdults, o.numChildren, o.flight, o.transfer, o.insurance, o.meal,
              o.costPrice.amount, o.costPrice.currency, o.costPrice.rate, calcAZN(o.costPrice.amount, o.costPrice.rate).toFixed(2),
              o.salePrice.amount, o.salePrice.currency, o.salePrice.rate, calcAZN(o.salePrice.amount, o.salePrice.rate).toFixed(2),
              calcAZN(o.paidByCash.amount, o.paidByCash.rate).toFixed(2),
              calcAZN(o.paidByTransfer.amount, o.paidByTransfer.rate).toFixed(2),
              o.expectedIncome, o.debt, o.actualIncome,
              o.clientName, o.agent, o.supplier, o.paymentDeadline, o.status, o.createdAt,
            ]),
            "travel_offers"
          )}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>
          <button onClick={() => setOffers([...SEED_OFFERS])}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>{tr("Təklif Əlavə Et","Add Offer")}</span>
          </button>
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
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    {tr("Təklif tapılmadı.","No offers found.")}
                  </td></tr>
                ) : filtered.map((o, i) => {
                  const totalAZN   = calcAZN(o.salePrice.amount, o.salePrice.rate);
                  const costAZN    = calcAZN(o.costPrice.amount,  o.costPrice.rate);
                  const revenueAZN = totalAZN - costAZN;
                  return (
                    <tr key={o.id} className={`border-b border-gray-200 dark:border-gray-800 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}>

                      {/* CLIENT — link to People → Customers */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => navigate("/dashboard/people/customers")}
                          className="text-xs text-[#14b8a6] dark:text-[#14b8a6] hover:underline text-left whitespace-nowrap font-medium"
                        >
                          {o.clientName || "—"}
                        </button>
                      </td>

                      {/* TYPE */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50">
                          {o.saleType}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{o.saleDate}</td>

                      {/* TOTAL */}
                      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {totalAZN.toFixed(0)} AZN
                      </td>

                      {/* COST */}
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {costAZN.toFixed(0)} AZN
                      </td>

                      {/* REVENUE */}
                      <td className="px-3 py-2 text-xs font-semibold whitespace-nowrap">
                        <span className={revenueAZN >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
                          {revenueAZN >= 0 ? "+" : ""}{revenueAZN.toFixed(0)} AZN
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[o.status]}`}>
                          {language === "az" ? STATUS_LABEL[o.status].az : STATUS_LABEL[o.status].en}
                        </span>
                      </td>

                      {/* AGENT — avatar + name + link to User Management */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => navigate("/dashboard/user-management")}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[10px] font-bold flex-shrink-0">
                            {getEmpInitials(o.agent || "?")}
                          </div>
                          <p className="text-xs text-gray-900 dark:text-white whitespace-nowrap">{o.agent || "—"}</p>
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(o)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title={tr("Bax / Redaktə Et","View / Edit")}>
                            <Eye className="w-3 h-3" />
                          </button>
                          <button onClick={() => { try { localStorage.setItem(`inflero_offer_${o.id}`, JSON.stringify(o)); } catch {} navigate(`/offer-view/${o.id}`); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title={tr("Təklif səhifəsinə keç","Visit offer page")}>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleCopyUrl(o.id)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                              copiedId === o.id
                                ? "bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400"
                                : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                            title={copiedId === o.id ? tr("Kopyalandı!","URL Copied!") : tr("URL kopyala","Copy offer URL")}>
                            {copiedId === o.id ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                          </button>
                          <button onClick={() => handleDelete(o.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={tr("Sil","Delete")}>
                            <Trash2 className="w-3 h-3" />
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

      {showModal && (
        <AddOfferModal
          onClose={closeModal}
          onSave={handleSave}
          editOffer={editingOffer ?? undefined}
          existingOffers={offers}
        />
      )}
    </div>
  );
}
