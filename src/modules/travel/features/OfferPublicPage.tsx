import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  Plane, MapPin, Hotel, Calendar, Users, Shield,
  Utensils, Car, CreditCard, DollarSign, User,
  CheckCircle, Clock, ArrowRight, Globe, X,
  ThumbsUp, ThumbsDown, MessageSquare, Upload, FileText,
  ChevronRight, ChevronLeft, Lock, Banknote, AlertCircle,
  Star, Send, Trash2, Moon, RefreshCw,
} from "lucide-react";
import {
  deletePublicOfferDocument,
  fetchPublicOffer,
  publicAcceptOffer,
  publicDeclineOffer,
  publicInitiateBankPayment,
  publicInitiateEpointPayment,
  publicReconcilePayment,
  publicRequestOfferChanges,
  publicSubmitOfferDocuments,
  offerDocSideLabel,
  uploadPublicOfferDocument,
  type OfferBankDetails,
  type OfferDocSide,
  type OfferDocumentRow,
  type OfferPaymentRow,
  type OfferStatusUi,
  type TravelOfferRow,
} from "../../../app/api/offers";
import { ApiError } from "../../../app/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialRow { amount: string; currency: string; rate: string; date: string; }
interface Passenger { id: string; fullName: string; dob: string; passportNo: string; passportExpiry: string; }
interface TravelOffer {
  id: string;
  displayCode: string;
  saleType: string; saleDate: string; from: string; to: string;
  country: string; city: string; hotelName: string;
  numAdults: number; numChildren: number;
  flight: string; transfer: string; insurance: string; meal: string;
  costPrice: FinancialRow; salePrice: FinancialRow;
  paidByCash: FinancialRow; paidByTransfer: FinancialRow;
  expectedIncome: number; debt: number; actualIncome: number;
  clientName: string; paymentDeadline: string; supplier: string; agent: string;
  passengers: Passenger[];
  status: OfferStatusUi;
  createdAt: string;
  clientResponseNote?: string | null;
  clientResponseRating?: number | null;
  documentsSubmittedAt?: string | null;
}

type UploadedDoc = {
  id?: string;
  name: string;
  size: number;
  type: string;
  side?: OfferDocSide | null;
  contentType?: string;
  /** Image data-URL / CDN, or any viewable URL for inline preview. */
  previewUrl?: string;
  url?: string;
};

function docViewSrc(doc: UploadedDoc): string | undefined {
  return doc.url || doc.previewUrl;
}

function isImageDoc(doc: UploadedDoc): boolean {
  const ct = (doc.contentType ?? "").toLowerCase();
  if (ct.startsWith("image/")) return true;
  const src = docViewSrc(doc) ?? "";
  if (src.startsWith("data:image/")) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(doc.name);
}

function isPdfDoc(doc: UploadedDoc): boolean {
  const ct = (doc.contentType ?? "").toLowerCase();
  if (ct.includes("pdf")) return true;
  const src = docViewSrc(doc) ?? "";
  if (src.startsWith("data:application/pdf")) return true;
  return /\.pdf$/i.test(doc.name);
}

function sideOptionsForType(type: string): { value: OfferDocSide; label: string; optional?: boolean }[] {
  if (type === "Passport") {
    return [
      { value: "bio", label: "Bio page" },
      { value: "extra", label: "Extra page", optional: true },
    ];
  }
  if (type === "ID Card") {
    return [
      { value: "front", label: "Front" },
      { value: "back", label: "Back" },
    ];
  }
  return [];
}

function docsForSide(docs: UploadedDoc[], side: OfferDocSide | null): UploadedDoc[] {
  if (!side) return docs.filter((d) => !d.side);
  return docs.filter((d) => d.side === side);
}

function docsOfType(docs: UploadedDoc[], type: string): UploadedDoc[] {
  return docs.filter((d) => d.type === type);
}

/** Required slots filled → tick on tab (optional sides ignored). */
function isDocTypeComplete(docs: UploadedDoc[], type: string): boolean {
  const ofType = docsOfType(docs, type);
  if (type === "Passport") return ofType.some((d) => d.side === "bio" || !d.side);
  if (type === "ID Card") {
    return ofType.some((d) => d.side === "front") && ofType.some((d) => d.side === "back");
  }
  return ofType.length > 0;
}

function isDocTypeStarted(docs: UploadedDoc[], type: string): boolean {
  return docsOfType(docs, type).length > 0;
}

// ─── Dummy data ───────────────────────────────────────────────────────────────

const PREVIEW_OFFER: TravelOffer = {
  id: "preview-offer",
  displayCode: "TRV-2026-0041",
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

function mapPublicRow(row: TravelOfferRow): TravelOffer {
  return {
    id: row.id,
    displayCode: row.displayCode || row.id,
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
    paymentDeadline: row.paymentDeadline,
    supplier: row.supplier,
    agent: row.agent,
    passengers: row.passengers,
    status: row.status,
    createdAt: row.createdAt,
    clientResponseNote: row.clientResponseNote,
    clientResponseRating: row.clientResponseRating,
    documentsSubmittedAt: row.documentsSubmittedAt ?? null,
  };
}

function mapDocs(docs: OfferDocumentRow[] | undefined): UploadedDoc[] {
  return (docs ?? []).map((d) => ({
    id: d.id,
    name: d.fileName,
    size: d.sizeBytes,
    type: d.type,
    side: d.side,
    contentType: d.contentType,
    url: d.url,
    previewUrl: d.contentType.startsWith("image/") ? d.url : d.url,
  }));
}

function hydrateActionFromStatus(status: OfferStatusUi): {
  actionDone: "accepted" | "rejected" | null;
  feedbackSent: boolean;
  note?: string | null;
  rating?: number | null;
} {
  if (status === "accepted") return { actionDone: "accepted", feedbackSent: false };
  if (status === "rejected") return { actionDone: "rejected", feedbackSent: false };
  if (status === "changing") return { actionDone: null, feedbackSent: true };
  return { actionDone: null, feedbackSent: false };
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

// ─── Checkout Modal (full outstanding only; Epoint redirect / bank notify) ────

const PREVIEW_BANK: OfferBankDetails = {
  bank: "ABB Bank",
  accountName: "Inflero Travel MMC",
  iban: "AZ21NABZ00000000137010001944",
  reference: "TRV-2026-0041",
};

function CheckoutModal({
  remaining,
  clientName,
  offerCode,
  publicToken,
  isPreview,
  onClose,
  onBankNotified,
}: {
  remaining: number;
  clientName: string;
  offerCode: string;
  publicToken: string | null;
  isPreview: boolean;
  onClose: () => void;
  onBankNotified?: () => void;
}) {
  const [step, setStep] = useState<"method" | "bank" | "success">("method");
  const [method, setMethod] = useState<"card" | "bank">("card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bank, setBank] = useState<OfferBankDetails | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);

  async function payWithCard() {
    setError(null);
    if (isPreview || !publicToken) {
      setError("Preview mode — card checkout is disabled.");
      return;
    }
    setBusy(true);
    try {
      const data = await publicInitiateEpointPayment(publicToken, "en");
      window.location.assign(data.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Card payment unavailable");
      setBusy(false);
    }
  }

  async function showBankDetails() {
    setError(null);
    if (isPreview || !publicToken) {
      setBank({ ...PREVIEW_BANK, reference: offerCode });
      setStep("bank");
      return;
    }
    setBusy(true);
    try {
      const data = await publicInitiateBankPayment(publicToken);
      setBank(data.bank);
      setOrderRef(data.payment.orderId);
      setStep("bank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create bank payment");
    } finally {
      setBusy(false);
    }
  }

  function notifyBankDone() {
    setStep("success");
    onBankNotified?.();
  }

  async function continueFromMethod() {
    if (method === "card") await payWithCard();
    else await showBankDetails();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
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
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {step === "method" && (
            <>
              <div className="bg-[#001058]/5 rounded-xl p-4 border border-[#001058]/10">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Invoice</p>
                <p className="text-sm font-semibold text-gray-800">{offerCode} — {clientName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Amount due: <span className="font-bold text-orange-500">{fmtAZNDec(remaining)}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Full outstanding balance only</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["card", "Card", CreditCard],
                    ["bank", "Bank Transfer", Banknote],
                  ] as const).map(([k, lbl, Icon]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMethod(k)}
                      className={`flex items-center gap-2 px-3 py-3 border rounded-lg text-xs font-medium transition-colors ${
                        method === k
                          ? "border-[#001058] bg-[#001058]/5 text-[#001058]"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              {method === "card" && (
                <p className="text-xs text-gray-500">
                  You will be redirected to Epoint to pay securely. Card details are never entered here.
                </p>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
            </>
          )}

          {step === "bank" && bank && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2.5">
              <p className="text-sm font-semibold text-blue-800 mb-1">Bank Transfer Details</p>
              <p className="text-xs text-blue-700 mb-2">
                Transfer <span className="font-bold">{fmtAZNDec(remaining)}</span> then notify us.
              </p>
              {(
                [
                  ["Bank", bank.bank],
                  ["Account", bank.accountName],
                  ["IBAN", bank.iban],
                  ["Ref", bank.reference],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-blue-500 uppercase tracking-wider">{k}</span>
                  <span className="text-sm font-semibold text-blue-900 font-mono break-all">{v}</span>
                </div>
              ))}
              <p className="text-xs text-blue-500 pt-2 border-t border-blue-200">
                After transferring, click Notify — our team will confirm the payment.
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Transfer notified</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  We recorded your bank transfer of{" "}
                  <span className="font-bold text-green-600">{fmtAZNDec(remaining)}</span>. Staff will
                  confirm once funds arrive.
                </p>
              </div>
              {orderRef && (
                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 text-left">
                  <div className="flex justify-between">
                    <span>Reference</span>
                    <span className="font-mono font-semibold">{orderRef}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
          {step === "method" && (
            <button
              type="button"
              onClick={() => void continueFromMethod()}
              disabled={busy || remaining <= 0}
              className="w-full py-3 bg-[#001058] hover:bg-[#000844] disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              {busy
                ? "Please wait…"
                : method === "card"
                  ? (
                    <>
                      Pay {fmtAZNDec(remaining)} <ChevronRight className="w-4 h-4" />
                    </>
                  )
                  : (
                    <>
                      Continue <ChevronRight className="w-4 h-4" />
                    </>
                  )}
            </button>
          )}
          {step === "bank" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("method")}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={notifyBankDone}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-bold transition-colors"
              >
                Notify transfer
              </button>
            </div>
          )}
          {step === "success" && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-[#001058] hover:bg-[#000844] text-white rounded-lg text-sm font-bold transition-colors"
            >
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
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview = !id || id === "preview";
  const [offer, setOffer] = useState<TravelOffer>(PREVIEW_OFFER);
  const [loading, setLoading] = useState(() => Boolean(id && id !== "preview"));
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [payBanner, setPayBanner] = useState<"success" | "error" | "pending" | null>(null);
  const [payments, setPayments] = useState<OfferPaymentRow[]>([]);

  const [clientAction, setClientAction]       = useState<"none" | "accepting" | "rejecting" | "feedback">("none");
  const [actionDone, setActionDone]           = useState<"accepted" | "rejected" | null>(null);
  const [feedback, setFeedback]               = useState("");
  const [feedbackRating, setFeedbackRating]   = useState(0);
  const [feedbackSent, setFeedbackSent]       = useState(false);
  const [showCheckout, setShowCheckout]       = useState(false);
  const [uploadedDocs, setUploadedDocs]       = useState<UploadedDoc[]>([]);
  const [docType, setDocType]                 = useState("Passport");
  const [docSide, setDocSide]                 = useState<OfferDocSide | null>("bio");
  const [docsAck, setDocsAck]                 = useState(false);
  const [docsSubmitting, setDocsSubmitting]   = useState(false);
  const fileInputRef                          = useRef<HTMLInputElement>(null);
  const replaceDocRef                         = useRef<UploadedDoc | null>(null);

  function selectDocType(t: string) {
    setDocType(t);
    const sides = sideOptionsForType(t);
    if (sides.length) {
      // Prefer first incomplete required side, else first side
      const ofType = docsOfType(uploadedDocs, t);
      const prefer =
        sides.find((s) => !s.optional && docsForSide(ofType, s.value).length === 0) ??
        sides[0];
      setDocSide(prefer.value);
    } else {
      setDocSide(null);
    }
  }

  const sideOptions = sideOptionsForType(docType);
  const activeTypeDocs = docsOfType(uploadedDocs, docType);
  const activeSideDocs = sideOptions.length
    ? docsForSide(activeTypeDocs, docSide)
    : activeTypeDocs;
  const activeSlotFilled = activeSideDocs.length > 0;

  function applyPublicOffer(row: TravelOfferRow) {
    setOffer(mapPublicRow(row));
    if (row.documents) setUploadedDocs(mapDocs(row.documents));
    if (Array.isArray(row.payments)) setPayments(row.payments);
    const h = hydrateActionFromStatus(row.status);
    setActionDone(h.actionDone);
    setFeedbackSent(h.feedbackSent);
    if (row.clientResponseNote) setFeedback(row.clientResponseNote);
    if (row.clientResponseRating) setFeedbackRating(row.clientResponseRating);
    // Unlock actions after staff resolves changes (status leaves "changing").
    if (h.feedbackSent) setClientAction("feedback");
    else if (!h.actionDone) setClientAction("none");
  }

  async function refreshPublicOffer() {
    if (isPreview || !id) return;
    try {
      const row = await fetchPublicOffer(id);
      applyPublicOffer(row);
    } catch {
      /* keep current */
    }
  }

  useEffect(() => {
    if (isPreview) {
      setOffer(PREVIEW_OFFER);
      setNotFound(false);
      setActionDone(null);
      setFeedbackSent(false);
      setUploadedDocs([]);
      setPayments([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchPublicOffer(id)
      .then((row) => {
        if (cancelled) return;
        applyPublicOffer(row);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.statusCode === 404) {
          setNotFound(true);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isPreview]);

  // Epoint return: ?pay=success|error&order_id=… — reconcile; never fake PAID.
  useEffect(() => {
    if (isPreview || !id) return;
    const pay = searchParams.get("pay");
    if (pay !== "success" && pay !== "error") return;
    const orderId = searchParams.get("order_id");
    let cancelled = false;

    (async () => {
      try {
        if (pay === "error") {
          if (!cancelled) setPayBanner("error");
        } else {
          setPayBanner("pending");
          if (orderId) {
            try {
              const result = await publicReconcilePayment(id, orderId);
              if (cancelled) return;
              if (result.status === "paid") {
                setPayBanner("success");
                const row = await fetchPublicOffer(id);
                if (!cancelled) applyPublicOffer(row);
              } else if (result.status === "failed" || result.status === "cancelled") {
                setPayBanner("error");
              } else {
                setPayBanner("pending");
              }
            } catch {
              if (!cancelled) setPayBanner("pending");
            }
          }
        }
      } finally {
        if (cancelled) return;
        const next = new URLSearchParams(searchParams);
        next.delete("pay");
        next.delete("order_id");
        setSearchParams(next, { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isPreview, searchParams, setSearchParams]);

  const salePriceAZN = calcAZN(offer.salePrice);
  const paidCashAZN  = calcAZN(offer.paidByCash);
  const paidTransAZN = calcAZN(offer.paidByTransfer);
  const totalPaid    = paidCashAZN + paidTransAZN;
  const remaining    = Math.max(0, salePriceAZN - totalPaid);
  const paidPct      = salePriceAZN > 0 ? Math.min(100, (totalPaid / salePriceAZN) * 100) : 0;
  /** After change request: view-only until staff revises / re-sends. */
  // Change-request lock only — accepted deals still allow docs/payments.
  const actionsLocked = feedbackSent || offer.status === "changing";
  const decisionDone =
    offer.status === "accepted" ||
    offer.status === "rejected" ||
    actionDone === "accepted" ||
    actionDone === "rejected";
  const effectiveActionDone: "accepted" | "rejected" | null =
    actionDone ??
    (offer.status === "accepted"
      ? "accepted"
      : offer.status === "rejected"
        ? "rejected"
        : null);
  const pendingBank = payments.find((p) => p.method === "bank" && p.status === "pending");
  const pendingCard = payments.find((p) => p.method === "card" && p.status === "pending");
  const recentPayments = payments.filter((p) => p.status !== "cancelled").slice(0, 8);

  const DOC_TYPES = ["Passport", "ID Card", "Insurance", "Visa", "Medical", "Other"];

  function openCheckout() {
    if (actionsLocked || remaining <= 0 || pendingBank) return;
    setShowCheckout(true);
  }

  function paymentStatusLabel(status: OfferPaymentRow["status"]) {
    if (status === "paid") return "Paid";
    if (status === "pending") return "Pending confirmation";
    if (status === "failed") return "Failed";
    return "Cancelled";
  }

  async function confirmAccept() {
    if (actionsLocked || decisionDone) return;
    setActionError(null);
    if (isPreview) {
      setActionDone("accepted");
      return;
    }
    setBusy(true);
    try {
      const row = await publicAcceptOffer(id!);
      applyPublicOffer(row);
      setActionDone("accepted");
      setClientAction("none");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDecline() {
    if (actionsLocked || decisionDone) return;
    setActionError(null);
    if (isPreview) {
      setActionDone("rejected");
      return;
    }
    setBusy(true);
    try {
      const row = await publicDeclineOffer(id!, { note: feedback.trim() || null });
      applyPublicOffer(row);
      setActionDone("rejected");
      setClientAction("none");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to decline");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRequestChanges() {
    if (actionsLocked || decisionDone || !feedback.trim()) return;
    setActionError(null);
    if (isPreview) {
      setFeedbackSent(true);
      return;
    }
    setBusy(true);
    try {
      const row = await publicRequestOfferChanges(id!, {
        note: feedback.trim(),
        rating: feedbackRating || null,
      });
      applyPublicOffer(row);
      setFeedbackSent(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send feedback");
    } finally {
      setBusy(false);
    }
  }

  function openFilePicker(opts?: { replace?: UploadedDoc | null; side?: OfferDocSide | null }) {
    if (actionsLocked) return;
    replaceDocRef.current = opts?.replace ?? null;
    if (opts?.side !== undefined) setDocSide(opts.side);
    fileInputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    if (!files || actionsLocked) return;
    const side = sideOptions.length ? docSide : null;
    const toReplace = replaceDocRef.current;
    replaceDocRef.current = null;
    const fileList = Array.from(files);
    if (!fileList.length) return;

    // Replace mode: single file, remove previous after success
    const filesToUpload = toReplace ? fileList.slice(0, 1) : fileList;

    filesToUpload.forEach((file) => {
      if (isPreview) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setUploadedDocs((prev) => {
            let next = prev;
            if (toReplace) {
              next = next.filter((d) => d !== toReplace && d.id !== toReplace.id);
            }
            return [
              ...next,
              {
                name: file.name,
                size: file.size,
                type: docType,
                side: toReplace?.side ?? side,
                contentType: file.type || undefined,
                previewUrl: dataUrl,
                url: dataUrl,
              },
            ];
          });
        };
        reader.readAsDataURL(file);
        return;
      }
      void (async () => {
        setBusy(true);
        setActionError(null);
        try {
          const doc = await uploadPublicOfferDocument(
            id!,
            file,
            docType,
            toReplace?.side ?? side,
          );
          if (toReplace?.id) {
            try {
              await deletePublicOfferDocument(id!, toReplace.id);
            } catch {
              /* new file already uploaded */
            }
          }
          setUploadedDocs((prev) => {
            let next = prev;
            if (toReplace) {
              next = next.filter((d) => d.id !== toReplace.id && d !== toReplace);
            }
            return [
              ...next,
              {
                id: doc.id,
                name: doc.fileName,
                size: doc.sizeBytes,
                type: doc.type,
                side: doc.side,
                contentType: doc.contentType,
                url: doc.url,
                previewUrl: doc.url,
              },
            ];
          });
        } catch (err) {
          setActionError(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setBusy(false);
        }
      })();
    });
  }

  async function removeDoc(doc: UploadedDoc) {
    if (actionsLocked) return;
    if (isPreview || !doc.id) {
      setUploadedDocs((p) => p.filter((d) => d !== doc));
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await deletePublicOfferDocument(id!, doc.id);
      setUploadedDocs((p) => p.filter((d) => d.id !== doc.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitDocumentsAck() {
    if (actionsLocked || !docsAck || uploadedDocs.length < 1) return;
    if (isPreview) {
      setOffer((o) => ({ ...o, documentsSubmittedAt: new Date().toISOString() }));
      return;
    }
    setDocsSubmitting(true);
    setActionError(null);
    try {
      const row = await publicSubmitOfferDocuments(id!);
      applyPublicOffer(row);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to submit documents");
    } finally {
      setDocsSubmitting(false);
    }
  }

  function renderDocCard(doc: UploadedDoc, opts?: { compact?: boolean }) {
    const src = docViewSrc(doc);
    const image = isImageDoc(doc);
    const pdf = isPdfDoc(doc);
    const compact = opts?.compact;
    return (
      <div key={doc.id ?? `${doc.name}-${doc.size}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {image && src ? (
              <img src={src} alt="" className="w-full h-full object-cover" />
            ) : (
              <FileText className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{doc.name}</p>
            <p className="text-[10px] text-gray-400">{fmtFileSize(doc.size)}</p>
          </div>
          {!actionsLocked && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => openFilePicker({ replace: doc, side: doc.side ?? null })}
                disabled={busy}
                className="p-2 text-gray-400 hover:text-[#001058] disabled:opacity-50"
                title="Replace"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void removeDoc(doc)}
                disabled={busy}
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {src && (image || pdf) && !compact && (
          <div className="border-t border-gray-100">
            {image ? (
              <img src={src} alt={doc.name} className="w-full max-h-[280px] object-contain bg-gray-50" />
            ) : (
              <iframe title={doc.name} src={src} className="w-full h-[280px] border-0 bg-gray-50" />
            )}
          </div>
        )}
      </div>
    );
  }

  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    active:   { label: "Active Deal",   bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    sent:     { label: "Pending Offer", bg: "bg-blue-100",  text: "text-blue-700",  border: "border-blue-300"  },
    inactive: { label: "Inactive",      bg: "bg-gray-100",  text: "text-gray-600",  border: "border-gray-300"  },
    expired:  { label: "Expired",       bg: "bg-red-100",   text: "text-red-600",   border: "border-red-300"   },
    accepted: { label: "Accepted",      bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    rejected: { label: "Declined",      bg: "bg-red-100",   text: "text-red-600",   border: "border-red-300"   },
    changing: { label: "Changes requested", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  };
  const sc = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.sent;

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Loading offer…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-800">Offer not found</p>
          <p className="text-xs text-gray-500 mt-1">This link may be invalid or the offer is no longer available.</p>
        </div>
      </div>
    );
  }

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
            {effectiveActionDone === "accepted" && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 border border-green-300">✓ Accepted</span>}
            {effectiveActionDone === "rejected" && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-600 border border-red-300">Declined</span>}
            {feedbackSent && !actionDone && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-300">Changes requested</span>}
            {!actionDone && !feedbackSent && <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text} border ${sc.border}`}>{sc.label}</span>}
            {remaining > 0 && !actionDone && !actionsLocked && !pendingBank && (
              <button type="button" onClick={openCheckout}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors">
                Pay Now
              </button>
            )}
            {remaining > 0 && !actionsLocked && pendingBank && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 whitespace-nowrap">
                Bank pending
              </span>
            )}
          </div>
        </div>
      </div>

      {actionsLocked && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          This offer is locked while your change request is reviewed. Accept, decline, payments, and document uploads are disabled until we send an updated offer.
        </div>
      )}

      {!actionsLocked && pendingBank && (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-900">
          Bank transfer of <strong>{fmtAZNDec(pendingBank.amount)}</strong> submitted — awaiting staff confirmation.
          Balance updates after approval.
        </div>
      )}

      {!actionsLocked && !pendingBank && pendingCard && !payBanner && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          Card payment of <strong>{fmtAZNDec(pendingCard.amount)}</strong> is processing. Refresh if the balance does not update shortly.
        </div>
      )}

      {payBanner && (
        <div
          className={`border-b px-4 py-3 text-center text-sm ${
            payBanner === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : payBanner === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {payBanner === "success" && "Payment confirmed. Thank you!"}
          {payBanner === "error" && "Payment was not completed. You can try again."}
          {payBanner === "pending" && "Payment is processing — refresh shortly if the balance has not updated."}
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #001058 0%, #001c8c 70%, #0031b8 100%)" }}>
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 lg:py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-center">

            {/* Left: trip summary */}
            <div className="min-w-0">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-2 font-medium">
                {offer.saleType || "Offer"}
              </p>
              <div className="flex items-center gap-2.5 sm:gap-3 mb-2 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {offer.from?.trim() || "—"}
                </span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 flex-shrink-0" />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {offer.to?.trim() || "—"}
                </span>
              </div>
              {offer.hotelName && (
                <div className="flex items-center gap-1.5 text-white/70 text-sm mb-3">
                  <Hotel className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{offer.hotelName}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Calendar, text: formatDate(offer.saleDate) },
                  {
                    icon: Users,
                    text: `${offer.numAdults} adult${offer.numAdults !== 1 ? "s" : ""}${
                      (offer.numChildren ?? 0) > 0
                        ? `, ${offer.numChildren} child${offer.numChildren !== 1 ? "ren" : ""}`
                        : ""
                    }`,
                  },
                  { icon: Globe, text: [offer.city, offer.country].filter(Boolean).join(", ") },
                  {
                    icon: Clock,
                    text: offer.paymentDeadline
                      ? `Deadline: ${formatDate(offer.paymentDeadline)}`
                      : "",
                  },
                ]
                  .filter((x) => x.text && x.text !== "—")
                  .map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white"
                      style={{ background: "rgba(255,255,255,0.13)" }}
                    >
                      <Icon className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: price + progress (fills empty space on md+) */}
            <div
              className="rounded-2xl p-4 sm:p-5 border border-white/20 w-full"
              style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
            >
              <div className="flex items-end justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Total Price</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{fmtAZN(salePriceAZN)}</p>
                </div>
                {remaining <= 0 && (
                  <div className="flex items-center gap-1.5 text-green-300 flex-shrink-0">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">Fully Paid</span>
                  </div>
                )}
              </div>
              <div className="w-full h-2 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div
                  className="h-full rounded-full bg-green-400 transition-all duration-500"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60 mb-4">
                <span>Paid {fmtAZN(totalPaid)}</span>
                <span>{Math.round(paidPct)}%</span>
              </div>
              {remaining > 0 && !actionsLocked && !pendingBank && (
                <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Remaining</p>
                    <p className="text-xl font-bold text-orange-300">{fmtAZN(remaining)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={openCheckout}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                  >
                    Pay →
                  </button>
                </div>
              )}
              {remaining > 0 && !actionsLocked && pendingBank && (
                <div className="rounded-xl px-3 py-3 border border-blue-300/40 bg-blue-500/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Remaining</p>
                      <p className="text-xl font-bold text-orange-300">{fmtAZN(remaining)}</p>
                      <p className="text-[11px] text-blue-100 mt-1.5 leading-snug">
                        Bank transfer submitted — awaiting confirmation ({fmtAZNDec(pendingBank.amount)})
                      </p>
                    </div>
                    <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-500/40 text-blue-50 border border-blue-300/40 whitespace-nowrap flex-shrink-0">
                      Waiting…
                    </span>
                  </div>
                </div>
              )}
              {remaining > 0 && actionsLocked && (
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Remaining</p>
                  <p className="text-xl font-bold text-orange-300">{fmtAZN(remaining)}</p>
                  <p className="text-[11px] text-white/60 mt-1">
                    Payment paused until your change request is resolved.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 flex-1 w-full">

        {/* 1. Client Response ─────────────────────────────────────────── */}
        {!effectiveActionDone ? (
          <Card title="Your Response" icon={MessageSquare}>
            <div className="p-4 sm:p-5">
              {actionsLocked ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Change request received</p>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Dear <strong>{offer.clientName}</strong>, this offer is locked while agent{" "}
                      <strong>{offer.agent || "our team"}</strong> reviews your feedback
                      {offer.clientResponseNote ? (
                        <>
                          :{" "}
                          <span className="italic">“{offer.clientResponseNote}”</span>
                        </>
                      ) : (
                        "."
                      )}{" "}
                      You will be able to accept, pay, and upload documents again after we send an update.
                    </p>
                  </div>
                </div>
              ) : (
              <>
              <p className="text-sm text-gray-600 mb-4">
                Dear <strong>{offer.clientName}</strong>, please review the offer details below and let us know your decision.
              </p>

              {actionError && (
                <p className="text-xs text-red-600 mb-3">{actionError}</p>
              )}

              {clientAction === "none" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => setClientAction("accepting")} disabled={busy}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                    <ThumbsUp className="w-4 h-4" /> Accept Offer
                  </button>
                  <button onClick={() => setClientAction("rejecting")} disabled={busy}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                    <ThumbsDown className="w-4 h-4" /> Decline Offer
                  </button>
                  <button onClick={() => setClientAction("feedback")} disabled={busy}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#001058] text-[#001058] hover:bg-[#001058]/5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
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
                    <button onClick={() => void confirmAccept()} disabled={busy}
                      className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">Confirm Acceptance</button>
                    <button onClick={() => setClientAction("none")} disabled={busy}
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
                    <button onClick={() => void confirmDecline()} disabled={busy}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">Decline</button>
                    <button onClick={() => setClientAction("none")} disabled={busy}
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
                        <button key={n} onClick={() => setFeedbackRating(n)} type="button">
                          <Star className={`w-6 h-6 transition-colors ${n <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
                    placeholder="What would you like to change? Dates, hotel, price, inclusions..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001058] resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => void confirmRequestChanges()} disabled={!feedback.trim() || busy}
                      className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[#001058] hover:bg-[#000844] disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors">
                      <Send className="w-3.5 h-3.5" /> Send Feedback
                    </button>
                    <button onClick={() => setClientAction("none")} disabled={busy}
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
              </>
              )}
            </div>
          </Card>
        ) : (
          <div className={`rounded-2xl p-4 sm:p-5 flex items-start gap-4 border ${effectiveActionDone === "accepted" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${effectiveActionDone === "accepted" ? "bg-green-100" : "bg-red-100"}`}>
              {effectiveActionDone === "accepted" ? <ThumbsUp className="w-5 h-5 text-green-600" /> : <ThumbsDown className="w-5 h-5 text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-1 ${effectiveActionDone === "accepted" ? "text-green-800" : "text-red-700"}`}>
                {effectiveActionDone === "accepted" ? "Offer Accepted — Welcome Aboard!" : "Offer Declined"}
              </p>
              <p className={`text-xs ${effectiveActionDone === "accepted" ? "text-green-600" : "text-red-500"}`}>
                {effectiveActionDone === "accepted"
                  ? pendingBank
                    ? "Your bank transfer was submitted. We will confirm it shortly — please upload your travel documents below."
                    : "Please upload your travel documents below and complete your first payment to confirm the booking."
                  : `Our agent ${offer.agent} will follow up with an updated offer.`}
              </p>
              {effectiveActionDone === "accepted" && remaining > 0 && !actionsLocked && !pendingBank && (
                <button type="button" onClick={openCheckout}
                  className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors inline-block">
                  Make First Payment →
                </button>
              )}
              {effectiveActionDone === "accepted" && remaining > 0 && !actionsLocked && pendingBank && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
                  <Banknote className="w-3.5 h-3.5" />
                  Waiting for bank confirmation ({fmtAZNDec(pendingBank.amount)})
                </div>
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

        {/* 4. Documents — tabbed slots; filled slots show content + replace/remove */}
        <Card title="Documents" icon={Upload}>
          <div className="p-4 sm:p-5">
            {actionsLocked ? (
              <p className="text-xs text-amber-700 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Document upload is disabled while your change request is under review. Existing files remain visible.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mb-4">
                Select a type below. Completed tabs show a checkmark. JPG, PNG, PDF — max 10 MB.
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {/* Type tabs with completion ticks */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {DOC_TYPES.map((t) => {
                const complete = isDocTypeComplete(uploadedDocs, t);
                const started = isDocTypeStarted(uploadedDocs, t);
                const active = docType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => selectDocType(t)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? "bg-[#001058] text-white border-[#001058]"
                        : complete
                          ? "bg-green-50 text-green-800 border-green-300"
                          : started
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-white text-gray-600 border-gray-300 hover:border-[#001058]"
                    }`}
                  >
                    {complete && (
                      <CheckCircle
                        className={`w-3.5 h-3.5 ${active ? "text-green-300" : "text-green-600"}`}
                      />
                    )}
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Side / page chips when relevant */}
            {sideOptions.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  {docType === "Passport" ? "Page" : "Side"}
                  {docType === "ID Card" ? " (front + back required)" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sideOptions.map((opt) => {
                    const filled = docsForSide(activeTypeDocs, opt.value).length > 0;
                    const active = docSide === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDocSide(opt.value)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          active
                            ? "bg-[#001058]/10 text-[#001058] border-[#001058]"
                            : filled
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-white text-gray-600 border-gray-300 hover:border-[#001058]"
                        }`}
                      >
                        {filled && <CheckCircle className="w-3 h-3 text-green-600" />}
                        {opt.label}
                        {opt.optional && !filled ? (
                          <span className="text-[9px] opacity-70">optional</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {actionError && (
              <p className="text-xs text-red-600 mb-3">{actionError}</p>
            )}

            {/* Active slot: content OR upload — never both for the same slot */}
            {activeSlotFilled ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-700">
                    {docType}
                    {docSide ? ` · ${offerDocSideLabel(docType, docSide)}` : ""}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
                    <CheckCircle className="w-3 h-3" /> Uploaded
                  </span>
                </div>
                <div className="space-y-2">
                  {activeSideDocs.map((doc) => renderDocCard(doc))}
                </div>
                {!actionsLocked && sideOptions.length === 0 && (
                  <button
                    type="button"
                    onClick={() => openFilePicker()}
                    disabled={busy}
                    className="w-full py-2 text-xs font-medium text-[#001058] border border-dashed border-[#001058]/30 rounded-lg hover:bg-[#001058]/5 disabled:opacity-50"
                  >
                    + Add another file
                  </button>
                )}
              </div>
            ) : actionsLocked ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                <p className="text-xs text-gray-500">
                  No {docType}
                  {docSide ? ` (${offerDocSideLabel(docType, docSide)})` : ""} uploaded yet.
                </p>
              </div>
            ) : (
              <div
                onClick={() => openFilePicker({ side: docSide })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-gray-300 rounded-xl py-8 px-4 text-center cursor-pointer hover:border-[#001058] transition-colors active:bg-[#001058]/5"
              >
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Upload{" "}
                  <span className="text-[#001058]">
                    {docType}
                    {docSide ? ` · ${offerDocSideLabel(docType, docSide)}` : ""}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Tap or drag & drop</p>
              </div>
            )}

            {/* Quick overview of other completed types */}
            {uploadedDocs.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Overview
                </p>
                <div className="flex flex-wrap gap-2">
                  {DOC_TYPES.filter((t) => isDocTypeStarted(uploadedDocs, t)).map((t) => {
                    const n = docsOfType(uploadedDocs, t).length;
                    const complete = isDocTypeComplete(uploadedDocs, t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => selectDocType(t)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border ${
                          complete
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {complete ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {t} · {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Acknowledgement + submit for staff review */}
            {!actionsLocked && (
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                {offer.documentsSubmittedAt ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Documents submitted</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        Thanks — our team has been notified. You can still replace files if needed.
                        {" "}
                        Submitted {new Date(offer.documentsSubmittedAt).toLocaleString()}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={docsAck}
                        onChange={(e) => setDocsAck(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#001058] focus:ring-[#001058]"
                      />
                      <span className="text-xs text-gray-700 leading-relaxed">
                        I confirm the documents I uploaded are correct, complete, and ready for Inflero
                        Travel to review.
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => void submitDocumentsAck()}
                      disabled={
                        !docsAck ||
                        uploadedDocs.length < 1 ||
                        docsSubmitting ||
                        busy
                      }
                      className="w-full py-3 bg-[#001058] hover:bg-[#000844] disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {docsSubmitting ? "Submitting…" : "Submit documents for review"}
                    </button>
                    {uploadedDocs.length < 1 && (
                      <p className="text-[11px] text-gray-400 text-center">
                        Upload at least one document before submitting.
                      </p>
                    )}
                  </>
                )}
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

        {/* 6. Outstanding balance + payment activity ──────────────────── */}
        <Card title="Payment" icon={CreditCard}>
          <div className="p-4 sm:p-5 space-y-4">
            <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border ${remaining <= 0 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${remaining <= 0 ? "bg-green-500" : "bg-orange-500"}`}>
                {remaining <= 0
                  ? <CheckCircle className="w-4 h-4 text-white" />
                  : <DollarSign className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${remaining <= 0 ? "text-green-700" : "text-orange-800"}`}>
                  {remaining <= 0 ? "Fully paid" : "Outstanding balance"}
                </p>
                {offer.paymentDeadline && (
                  <p className="text-[10px] text-gray-400">Deadline: {formatDate(offer.paymentDeadline)}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${remaining <= 0 ? "text-green-600" : "text-orange-600"}`}>
                  {fmtAZNDec(remaining)}
                </p>
              </div>
            </div>

            {recentPayments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Payment activity
                </p>
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {recentPayments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white">
                      <div className="min-w-0 flex items-center gap-2">
                        {p.method === "bank" ? (
                          <Banknote className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-[#001058] flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800">
                            {p.method === "bank" ? "Bank transfer" : "Card"} · {fmtAZNDec(p.amount)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(p.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold flex-shrink-0 ${
                          p.status === "paid"
                            ? "text-green-600"
                            : p.status === "pending"
                              ? "text-amber-600"
                              : p.status === "failed"
                                ? "text-red-600"
                                : "text-gray-400"
                        }`}
                      >
                        {paymentStatusLabel(p.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {remaining > 0
              ? actionsLocked
                ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Payment disabled until offer is updated</span>
                  </div>
                )
                : pendingBank
                  ? (
                    <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Banknote className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">
                        Waiting for bank confirmation ({fmtAZNDec(pendingBank.amount)})
                      </span>
                    </div>
                  )
                  : (
                  <button type="button" onClick={openCheckout}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <CreditCard className="w-4 h-4" /> Pay {fmtAZNDec(remaining)}
                  </button>
                )
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
      {showCheckout && !actionsLocked && (
        <CheckoutModal
          remaining={remaining}
          clientName={offer.clientName}
          offerCode={offer.displayCode || offer.id}
          publicToken={isPreview ? null : id!}
          isPreview={isPreview}
          onClose={() => setShowCheckout(false)}
          onBankNotified={() => void refreshPublicOffer()}
        />
      )}
    </div>
  );
}
