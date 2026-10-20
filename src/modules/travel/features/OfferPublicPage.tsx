import { useState, useRef } from "react";
import { useParams } from "react-router";
import {
  Plane, MapPin, Hotel, Calendar, Users, Shield,
  Utensils, Car, CreditCard, DollarSign, User,
  CheckCircle, Clock, ArrowRight, Globe, X,
  ThumbsUp, ThumbsDown, MessageSquare, Upload, FileText,
  ChevronRight, ChevronLeft, Lock, Banknote, AlertCircle,
  Star, Send, Trash2, Eye, Moon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialRow { amount: string; currency: string; rate: string; date: string; }
interface Passenger { id: string; fullName: string; dob: string; passportNo: string; passportExpiry: string; }
interface TravelOffer {
  id: string; saleType: string; saleDate: string; from: string; to: string;
  country: string; city: string; hotelName: string;
  numAdults: number; numChildren: number;
  flight: string; transfer: string; insurance: string; meal: string;
  costPrice: FinancialRow; salePrice: FinancialRow;
  paidByCash: FinancialRow; paidByTransfer: FinancialRow;
  expectedIncome: number; debt: number; actualIncome: number;
  clientName: string; paymentDeadline: string; supplier: string; agent: string;
  passengers: Passenger[];
  status: "active" | "inactive" | "sent" | "expired";
  createdAt: string;
}

// ─── Dummy data ───────────────────────────────────────────────────────────────

const PREVIEW_OFFER: TravelOffer = {
  id: "TRV-2026-0041",
  saleType: "Holiday Package",
  saleDate: "2026-10-18",
  from: "Baku",
  to: "Istanbul",
  country: "Turkey",
  city: "Istanbul",
  hotelName: "Grand Hyatt Istanbul",
  numAdults: 2,
  numChildren: 1,
  flight: "Round Trip — Baku › Istanbul",
  transfer: "Airport Pickup & Drop-off",
  insurance: "Comprehensive Travel Insurance",
  meal: "Bed & Breakfast",
  costPrice:      { amount: "3500", currency: "USD", rate: "1.70", date: "2026-09-01" },
  salePrice:      { amount: "4500", currency: "USD", rate: "1.70", date: "2026-09-01" },
  paidByCash:     { amount: "2000", currency: "AZN", rate: "1",    date: "2026-09-05" },
  paidByTransfer: { amount: "1650", currency: "AZN", rate: "1",    date: "2026-09-10" },
  expectedIncome: 1700, debt: 4000, actualIncome: 550,
  clientName: "Nigar Babayeva",
  paymentDeadline: "2026-10-10",
  supplier: "Anatolian Tours Ltd.",
  agent: "Aynur Həsənli",
  passengers: [
    { id: "p1", fullName: "Nigar Babayeva", dob: "1988-05-12", passportNo: "TK9876543", passportExpiry: "2030-05-12" },
    { id: "p2", fullName: "Kamran Babayev", dob: "1985-03-20", passportNo: "TK8765432", passportExpiry: "2029-03-20" },
    { id: "p3", fullName: "Leyla Babayeva", dob: "2015-07-04", passportNo: "TK7654321", passportExpiry: "2028-07-04" },
  ],
  status: "sent",
  createdAt: "2026-09-01",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAZN(row?: FinancialRow) {
  if (!row) return 0;
  return (parseFloat(row.amount) || 0) * (parseFloat(row.rate) || 1);
}

function fmtAZN(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " AZN";
}

function fmtAZNDec(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " AZN";
}

function formatDate(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
}

function fmtFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function loadOffer(id: string | undefined): TravelOffer {
  if (!id || id === "preview") return PREVIEW_OFFER;
  const keys = [`inflero_offer_${id}`, `inflero_offer_${id.replace(/^#/, "")}`];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const p = JSON.parse(raw) as TravelOffer;
      if (p?.id && p?.salePrice) return p;
    } catch { /* ignore */ }
  }
  return PREVIEW_OFFER;
}

// ─── Small shared pieces ──────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ background: "rgba(0,16,88,0.08)" }}>
        <Icon className="w-4 h-4 text-[#001058]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children, className = "" }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4 border-b border-gray-100 bg-gray-50/70">
        <div className="w-7 h-7 rounded-lg bg-[#001058] flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

function CheckoutModal({ remaining, clientName, offerId, onClose }: {
  remaining: number; clientName: string; offerId: string; onClose: () => void;
}) {
  const [step, setStep]       = useState<"amount" | "details" | "confirm" | "success">("amount");
  const [amount, setAmount]   = useState(remaining.toFixed(2));
  const [cardNo, setCardNo]   = useState("");
  const [expiry, setExpiry]   = useState("");
  const [cvv, setCvv]         = useState("");
  const [holder, setHolder]   = useState(clientName);
  const [method, setMethod]   = useState<"card" | "bank">("card");
  const payAmt = parseFloat(amount) || 0;

  function fmtCard(v: string)   { return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
  function fmtExpiry(v: string) { const d = v.replace(/\D/g, "").slice(0, 4); return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d; }

  const inp = "w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001058] transition-colors";

  const steps = ["amount", "details", "confirm"] as const;
  const stepIdx = steps.indexOf(step as typeof steps[number]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Sheet on mobile, centred card on desktop */}
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">

        {/* Header */}
        <div className="bg-[#001058] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Lock className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-widest leading-none">Secure Payment</p>
              <p className="text-sm font-bold text-white leading-tight">Inflero Travel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Step pills */}
        {step !== "success" && (
          <div className="flex items-center px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            {steps.map((s, i) => {
              const done   = i < stepIdx;
              const active = s === step;
              const labels = ["Amount", "Details", "Review"];
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${done ? "bg-green-500" : active ? "bg-[#001058]" : "bg-gray-200"}`}>
                      {done
                        ? <CheckCircle className="w-3 h-3 text-white" />
                        : <span className={`text-[10px] font-bold ${active ? "text-white" : "text-gray-400"}`}>{i + 1}</span>}
                    </div>
                    <span className={`text-[10px] font-medium hidden sm:inline ${active ? "text-[#001058]" : "text-gray-400"}`}>{labels[i]}</span>
                  </div>
                  {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {step === "amount" && (
            <>
              <div className="bg-[#001058]/5 rounded-xl p-4 border border-[#001058]/10">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Invoice</p>
                <p className="text-sm font-semibold text-gray-800">{offerId} — {clientName}</p>
                <p className="text-xs text-gray-500 mt-1">Outstanding: <span className="font-bold text-orange-500">{fmtAZN(remaining)}</span></p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Amount (AZN)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" max={remaining}
                  className={inp} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([["25%", remaining * 0.25], ["50%", remaining * 0.5], ["Full", remaining]] as [string, number][]).map(([lbl, val]) => (
                  <button key={lbl} onClick={() => setAmount(val.toFixed(2))}
                    className="py-2 text-xs border border-gray-300 rounded-lg hover:border-[#001058] hover:text-[#001058] font-medium transition-colors">
                    {lbl}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {([["card", "Card / POS", CreditCard], ["bank", "Bank Transfer", Banknote]] as [typeof method, string, React.ElementType][]).map(([k, lbl, Icon]) => (
                    <button key={k} onClick={() => setMethod(k)}
                      className={`flex items-center gap-2 px-3 py-3 border rounded-lg text-xs font-medium transition-colors ${method === k ? "border-[#001058] bg-[#001058]/5 text-[#001058]" : "border-gray-200 text-gray-600"}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />{lbl}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "details" && method === "card" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Cardholder Name</label>
                <input value={holder} onChange={e => setHolder(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Card Number</label>
                <input value={cardNo} onChange={e => setCardNo(fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19}
                  className={`${inp} font-mono tracking-widest`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Expiry</label>
                  <input value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">CVV</label>
                  <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="•••" type="password" maxLength={4} className={inp} />
                </div>
              </div>
            </>
          )}

          {step === "details" && method === "bank" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2.5">
              <p className="text-sm font-semibold text-blue-800 mb-3">Bank Transfer Details</p>
              {([["Bank", "ABB Bank"], ["Account", "Inflero Travel MMC"], ["IBAN", "AZ21NABZ00000000137010001944"], ["Ref", offerId]] as [string,string][]).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-blue-500 uppercase tracking-wider">{k}</span>
                  <span className="text-sm font-semibold text-blue-900 font-mono break-all">{v}</span>
                </div>
              ))}
              <p className="text-xs text-blue-500 pt-2 border-t border-blue-200">After transferring, click Continue to notify us.</p>
            </div>
          )}

          {step === "confirm" && (
            <>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {[
                  ["Offer", offerId],
                  ["Client", clientName],
                  ["Amount", fmtAZNDec(payAmt)],
                  ["Method", method === "card" ? "Card / POS" : "Bank Transfer"],
                  ...(method === "card" && cardNo ? [["Card", `•••• ${cardNo.replace(/\s/g,"").slice(-4)}`]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-gray-500 text-xs">{k}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Review all details before confirming. Payment is processed securely.</p>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Payment Submitted!</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Your payment of <span className="font-bold text-green-600">{fmtAZNDec(payAmt)}</span> has been received. Our team will confirm within 24 hours.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-1 text-left">
                <div className="flex justify-between"><span>Reference</span><span className="font-mono font-semibold">{offerId}-{Date.now().toString().slice(-6)}</span></div>
                <div className="flex justify-between"><span>Date</span><span>{formatDate(new Date().toISOString().split("T")[0])}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
          {step === "amount" && (
            <button onClick={() => { if (payAmt > 0) setStep("details"); }} disabled={payAmt <= 0}
              className="w-full py-3 bg-[#001058] hover:bg-[#000844] disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === "details" && (
            <div className="flex gap-2">
              <button onClick={() => setStep("amount")}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep("confirm")}
                className="flex-1 py-3 bg-[#001058] hover:bg-[#000844] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors">
                Review <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {step === "confirm" && (
            <div className="flex gap-2">
              <button onClick={() => setStep("details")}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep("success")}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-bold transition-colors">
                Confirm Payment
              </button>
            </div>
          )}
          {step === "success" && (
            <button onClick={onClose} className="w-full py-3 bg-[#001058] hover:bg-[#000844] text-white rounded-lg text-sm font-bold transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OfferPublicPage() {
  const { id } = useParams<{ id: string }>();
  const [offer] = useState<TravelOffer>(() => loadOffer(id));

  const salePriceAZN = calcAZN(offer.salePrice);
  const paidCashAZN  = calcAZN(offer.paidByCash);
  const paidTransAZN = calcAZN(offer.paidByTransfer);
  const totalPaid    = paidCashAZN + paidTransAZN;
  const remaining    = Math.max(0, salePriceAZN - totalPaid);
  const paidPct      = salePriceAZN > 0 ? Math.min(100, (totalPaid / salePriceAZN) * 100) : 0;

  const [clientAction, setClientAction]       = useState<"none" | "accepting" | "rejecting" | "feedback">("none");
  const [actionDone, setActionDone]           = useState<"accepted" | "rejected" | null>(null);
  const [feedback, setFeedback]               = useState("");
  const [feedbackRating, setFeedbackRating]   = useState(0);
  const [feedbackSent, setFeedbackSent]       = useState(false);
  const [showCheckout, setShowCheckout]       = useState(false);
  const [uploadedDocs, setUploadedDocs]       = useState<{ name: string; size: number; type: string; previewUrl?: string }[]>([]);
  const [docType, setDocType]                 = useState("Passport");
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  const DOC_TYPES = ["Passport", "ID Card", "Insurance", "Visa", "Medical", "Other"];

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedDocs(prev => [...prev, {
          name: file.name, size: file.size, type: docType,
          previewUrl: file.type.startsWith("image/") ? reader.result as string : undefined,
        }]);
      };
      reader.readAsDataURL(file);
    });
  }

  const paymentSchedule = [
    { label: "Deposit (30%)",       amount: salePriceAZN * 0.3, due: offer.createdAt,        done: totalPaid >= salePriceAZN * 0.3 },
    { label: "Second Payment (40%)", amount: salePriceAZN * 0.4, due: offer.paymentDeadline, done: totalPaid >= salePriceAZN * 0.7 },
    { label: "Final Payment (30%)",  amount: salePriceAZN * 0.3, due: offer.paymentDeadline, done: totalPaid >= salePriceAZN },
  ];

  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    active:   { label: "Active Deal",   bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    sent:     { label: "Pending Offer", bg: "bg-blue-100",  text: "text-blue-700",  border: "border-blue-300"  },
    inactive: { label: "Inactive",      bg: "bg-gray-100",  text: "text-gray-600",  border: "border-gray-300"  },
    expired:  { label: "Expired",       bg: "bg-red-100",   text: "text-red-600",   border: "border-red-300"   },
  };
  const sc = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.sent;

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">

      {/* ── Sticky top bar ──────────────────────────────────────────────── */}
      <div className="bg-[#001058] sticky top-0 z-20 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-white/50 uppercase tracking-widest leading-none hidden sm:block">Powered by</p>
              <p className="text-sm font-bold text-white leading-tight truncate">Inflero Travel</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {actionDone === "accepted" && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 border border-green-300">✓ Accepted</span>}
            {actionDone === "rejected" && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-600 border border-red-300">Declined</span>}
            {!actionDone && <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text} border ${sc.border}`}>{sc.label}</span>}
            {remaining > 0 && !actionDone && (
              <button onClick={() => setShowCheckout(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors">
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #001058 0%, #001c8c 70%, #0031b8 100%)" }}>
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">

          {/* Route + type */}
          <p className="text-xs text-white/50 uppercase tracking-widest mb-3 font-medium">{offer.saleType}</p>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-3xl sm:text-4xl font-bold text-white">{offer.from || "—"}</span>
            <ArrowRight className="w-6 h-6 text-white/40 flex-shrink-0" />
            <span className="text-3xl sm:text-4xl font-bold text-white">{offer.to || "—"}</span>
          </div>
          {offer.hotelName && (
            <div className="flex items-center gap-1.5 text-white/70 text-sm mb-4">
              <Hotel className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{offer.hotelName}</span>
            </div>
          )}

          {/* Pill tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { icon: Calendar, text: formatDate(offer.saleDate) },
              { icon: Users,    text: `${offer.numAdults} adults${(offer.numChildren ?? 0) > 0 ? `, ${offer.numChildren} child${offer.numChildren > 1 ? "ren":""}` : ""}` },
              { icon: Globe,    text: [offer.city, offer.country].filter(Boolean).join(", ") },
              { icon: Clock,    text: `Deadline: ${formatDate(offer.paymentDeadline)}` },
            ].filter(x => x.text && x.text !== "—").map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "rgba(255,255,255,0.13)" }}>
                <Icon className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Price + progress block */}
          <div className="rounded-2xl p-4 sm:p-5 border border-white/20 max-w-sm"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Total Price</p>
                <p className="text-3xl font-bold text-white">{fmtAZN(salePriceAZN)}</p>
              </div>
              {remaining <= 0 && (
                <div className="flex items-center gap-1.5 text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Fully Paid</span>
                </div>
              )}
            </div>
            <div className="w-full h-2 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full bg-green-400 transition-all duration-500" style={{ width: `${paidPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-white/60 mb-3">
              <span>Paid {fmtAZN(totalPaid)}</span>
              <span>{Math.round(paidPct)}%</span>
            </div>
            {remaining > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Remaining</p>
                  <p className="text-xl font-bold text-orange-300">{fmtAZN(remaining)}</p>
                </div>
                <button onClick={() => setShowCheckout(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold transition-colors">
                  Pay →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 flex-1 w-full">

        {/* 1. Client Response ─────────────────────────────────────────── */}
        {!actionDone ? (
          <Card title="Your Response" icon={MessageSquare}>
            <div className="p-4 sm:p-5">
              <p className="text-sm text-gray-600 mb-4">
                Dear <strong>{offer.clientName}</strong>, please review the offer details below and let us know your decision.
              </p>

              {clientAction === "none" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => setClientAction("accepting")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors">
                    <ThumbsUp className="w-4 h-4" /> Accept Offer
                  </button>
                  <button onClick={() => setClientAction("rejecting")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors">
                    <ThumbsDown className="w-4 h-4" /> Decline Offer
                  </button>
                  <button onClick={() => setClientAction("feedback")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#001058] text-[#001058] hover:bg-[#001058]/5 rounded-lg text-sm font-semibold transition-colors">
                    <MessageSquare className="w-4 h-4" /> Request Changes
                  </button>
                </div>
              )}

              {clientAction === "accepting" && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">You are accepting this offer</p>
                      <p className="text-xs text-green-600 mt-0.5">By confirming you agree to the terms and payment schedule below.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActionDone("accepted")}
                      className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold transition-colors">Confirm Acceptance</button>
                    <button onClick={() => setClientAction("none")}
                      className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Back</button>
                  </div>
                </div>
              )}

              {clientAction === "rejecting" && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700">Please tell us why so we can improve the offer.</p>
                  </div>
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                    placeholder="Your reason (optional)..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001058] resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setActionDone("rejected")}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors">Decline</button>
                    <button onClick={() => setClientAction("none")}
                      className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Back</button>
                  </div>
                </div>
              )}

              {clientAction === "feedback" && !feedbackSent && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Rate this offer</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setFeedbackRating(n)}>
                          <Star className={`w-6 h-6 transition-colors ${n <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
                    placeholder="What would you like to change? Dates, hotel, price, inclusions..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001058] resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => { if (feedback.trim()) setFeedbackSent(true); }} disabled={!feedback.trim()}
                      className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[#001058] hover:bg-[#000844] disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors">
                      <Send className="w-3.5 h-3.5" /> Send Feedback
                    </button>
                    <button onClick={() => setClientAction("none")}
                      className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              {clientAction === "feedback" && feedbackSent && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Feedback sent!</p>
                    <p className="text-xs text-blue-600 mt-0.5">Agent <strong>{offer.agent}</strong> will review your requests and follow up shortly.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className={`rounded-2xl p-4 sm:p-5 flex items-start gap-4 border ${actionDone === "accepted" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${actionDone === "accepted" ? "bg-green-100" : "bg-red-100"}`}>
              {actionDone === "accepted" ? <ThumbsUp className="w-5 h-5 text-green-600" /> : <ThumbsDown className="w-5 h-5 text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-1 ${actionDone === "accepted" ? "text-green-800" : "text-red-700"}`}>
                {actionDone === "accepted" ? "Offer Accepted — Welcome Aboard!" : "Offer Declined"}
              </p>
              <p className={`text-xs ${actionDone === "accepted" ? "text-green-600" : "text-red-500"}`}>
                {actionDone === "accepted"
                  ? "Please upload your travel documents below and complete your first payment to confirm the booking."
                  : `Our agent ${offer.agent} will follow up with an updated offer.`}
              </p>
              {actionDone === "accepted" && remaining > 0 && (
                <button onClick={() => setShowCheckout(true)}
                  className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors inline-block">
                  Make First Payment →
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Trip Details (Extended) ─────────────────────────────────── */}
        <Card title="Trip Details" icon={Plane}>
          <div className="p-4 sm:p-5 space-y-5">

            {/* Core info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: MapPin,   label: "Destination",  value: [offer.city, offer.country].filter(Boolean).join(", ") },
                { icon: Hotel,    label: "Hotel",         value: offer.hotelName },
                { icon: Calendar, label: "Travel Date",   value: formatDate(offer.saleDate) },
                { icon: Moon,     label: "Duration",      value: "7 Nights" },
                { icon: Users,    label: "Passengers",    value: `${offer.numAdults} adult${offer.numAdults !== 1 ? "s" : ""}${(offer.numChildren ?? 0) > 0 ? `, ${offer.numChildren} child${offer.numChildren !== 1 ? "ren" : ""}` : ""}` },
                { icon: Utensils, label: "Meal Plan",     value: offer.meal },
              ].filter(x => x.value && x.value !== "—").map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(0,16,88,0.08)" }}>
                    <Icon className="w-3.5 h-3.5 text-[#001058]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium leading-none mb-0.5">{label}</p>
                    <p className="text-xs text-gray-800 font-semibold leading-snug">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Included services chips */}
            {[offer.flight, offer.transfer, offer.insurance, offer.meal].some(Boolean) && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Included in Your Package
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: Plane,   label: offer.flight },
                    { icon: Car,     label: offer.transfer },
                    { icon: Shield,  label: offer.insurance },
                    { icon: Utensils,label: offer.meal },
                  ].filter(x => x.label && x.label !== "—").map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="text-xs text-green-700 font-medium truncate">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What's included checklist */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2.5">Your trip includes</p>
              <ul className="space-y-2">
                {[
                  `Round-trip flights from ${offer.from} to ${offer.to}`,
                  `Hotel accommodation at ${offer.hotelName}`,
                  offer.transfer || "Airport transfer service",
                  offer.insurance || "Travel insurance coverage",
                  `${offer.meal} included daily`,
                  "Local tour guide assistance",
                  "24/7 Inflero Travel support",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agent & trip notes */}
            <div className="bg-[#001058]/5 rounded-xl p-4 border border-[#001058]/10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Client",   value: offer.clientName },
                  { label: "Agent",    value: offer.agent },
                  { label: "Supplier", value: offer.supplier },
                  { label: "Currency", value: `${offer.salePrice?.currency ?? "USD"} @ ${offer.salePrice?.rate ?? "—"}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-gray-800 break-words">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Passengers ──────────────────────────────────────────────── */}
        {(offer.passengers?.length ?? 0) > 0 && (
          <Card title="Passengers" icon={Users}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    {["#", "Full Name", "Date of Birth", "Passport No.", "Expiry"].map(h => (
                      <th key={h} className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {offer.passengers.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 sm:px-5 py-3 text-xs text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-4 sm:px-5 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{p.fullName || "—"}</td>
                      <td className="px-4 sm:px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{p.dob ? formatDate(p.dob) : "—"}</td>
                      <td className="px-4 sm:px-5 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{p.passportNo || "—"}</td>
                      <td className="px-4 sm:px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{p.passportExpiry ? formatDate(p.passportExpiry) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 4. Upload Documents ────────────────────────────────────────── */}
        <Card title="Upload Documents" icon={Upload}>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-gray-500 mb-4">Upload passport, ID or visa copies. JPG, PNG, PDF — max 10 MB each.</p>

            {/* Doc type chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {DOC_TYPES.map(t => (
                <button key={t} onClick={() => setDocType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    docType === t ? "bg-[#001058] text-white border-[#001058]" : "bg-white text-gray-600 border-gray-300 hover:border-[#001058]"
                  }`}>{t}</button>
              ))}
            </div>

            {/* Drop zone */}
            <div onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed border-gray-300 rounded-xl py-10 px-4 text-center cursor-pointer hover:border-[#001058] transition-colors active:bg-[#001058]/5">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Tap to upload <span className="text-[#001058]">{docType}</span></p>
              <p className="text-xs text-gray-400 mt-1">or drag & drop here</p>
              <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf"
                className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>

            {uploadedDocs.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700">{uploadedDocs.length} file{uploadedDocs.length > 1 ? "s" : ""} uploaded</p>
                {uploadedDocs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {doc.previewUrl ? <img src={doc.previewUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{doc.name}</p>
                      <p className="text-[10px] text-gray-400">{doc.type} · {fmtFileSize(doc.size)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {doc.previewUrl && (
                        <a href={doc.previewUrl} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-[#001058]">
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => setUploadedDocs(p => p.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 5. Financial Summary ───────────────────────────────────────── */}
        <Card title="Financial Summary" icon={DollarSign}>
          <div className="px-4 sm:px-5 py-4 space-y-0">
            {[
              { label: "Total Price",     value: fmtAZNDec(salePriceAZN), cls: "text-[#001058] text-base font-bold" },
              { label: "Paid (Cash)",     value: fmtAZNDec(paidCashAZN),  cls: "text-gray-800 font-medium" },
              { label: "Paid (Transfer)", value: fmtAZNDec(paidTransAZN), cls: "text-gray-800 font-medium" },
              { label: "Total Paid",      value: fmtAZNDec(totalPaid),    cls: "text-green-700 font-semibold" },
              { label: "Remaining",       value: fmtAZNDec(remaining),    cls: remaining > 0 ? "text-orange-500 font-bold" : "text-green-600 font-semibold" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-sm ${cls}`}>{value}</span>
              </div>
            ))}
            <div className="pt-3">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                <span>Payment progress</span><span>{Math.round(paidPct)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* 6. Payment Schedule ────────────────────────────────────────── */}
        <Card title="Payment Schedule" icon={CreditCard}>
          <div className="p-4 sm:p-5">
            <div className="space-y-3 mb-4">
              {paymentSchedule.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border ${item.done ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-500" : "bg-gray-300"}`}>
                    {item.done
                      ? <CheckCircle className="w-4 h-4 text-white" />
                      : <span className="text-white text-xs font-bold">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${item.done ? "text-green-700" : "text-gray-700"}`}>{item.label}</p>
                    <p className="text-[10px] text-gray-400">Due: {formatDate(item.due)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${item.done ? "text-green-600" : "text-gray-600"}`}>{fmtAZN(item.amount)}</p>
                    <p className={`text-[10px] font-medium ${item.done ? "text-green-500" : "text-orange-400"}`}>{item.done ? "Paid" : "Pending"}</p>
                  </div>
                </div>
              ))}
            </div>
            {remaining > 0
              ? <button onClick={() => setShowCheckout(true)}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  <CreditCard className="w-4 h-4" /> Make a Payment ({fmtAZN(remaining)} remaining)
                </button>
              : <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-700">All payments complete!</span>
                </div>}
          </div>
        </Card>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 bg-white mt-2">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#001058] flex items-center justify-center">
              <Plane className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Inflero Travel Management</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Offer <span className="font-mono">{offer.id}</span> · Generated {formatDate(offer.createdAt)}
          </p>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal remaining={remaining} clientName={offer.clientName} offerId={offer.id} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}
