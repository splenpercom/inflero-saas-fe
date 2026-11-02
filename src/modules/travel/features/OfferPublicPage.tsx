import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  Plane, MapPin, Hotel, Calendar, Users, Shield,
  Utensils, Car, CreditCard, DollarSign, User,
  CheckCircle, Clock, ArrowRight, Globe, X,
  ThumbsUp, ThumbsDown, MessageSquare, Upload, FileText,
  ChevronRight, ChevronLeft, Lock, Banknote, AlertCircle,
  Star, Send, Trash2, RefreshCw,
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
  type OfferChangeRequestRow,
  type OfferDocSide,
  type OfferDocumentRow,
  type OfferPaymentRow,
  type OfferStatusUi,
  type TravelOfferRow,
} from "../../../app/api/offers";
import { ApiError } from "../../../app/api/client";
import { LanguageSwitcherDropdown } from "../../../app/components/LanguageSwitcherDropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../app/components/ui/dialog";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { pickLang } from "../../../app/i18n/pickLang";
import { OfferChangeRequestChat } from "./OfferChangeRequestChat";

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
  changeRequests?: OfferChangeRequestRow[];
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

function sideOptionsForType(
  type: string,
  tr: (az: string, en: string, ru?: string) => string,
): { value: OfferDocSide; label: string; optional?: boolean }[] {
  if (type === "Passport") {
    return [
      { value: "bio", label: tr("Bio səhifə", "Bio page", "Страница с фото") },
      { value: "extra", label: tr("Əlavə səhifə", "Extra page", "Доп. страница"), optional: true },
    ];
  }
  if (type === "ID Card") {
    return [
      { value: "front", label: tr("Ön tərəf", "Front", "Лицевая сторона") },
      { value: "back", label: tr("Arxa tərəf", "Back", "Обратная сторона") },
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
    changeRequests: Array.isArray(row.changeRequests) ? row.changeRequests : [],
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
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [step, setStep] = useState<"method" | "bank" | "success">("method");
  const [method, setMethod] = useState<"card" | "bank">("card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bank, setBank] = useState<OfferBankDetails | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);

  async function payWithCard() {
    setError(null);
    if (isPreview || !publicToken) {
      setError(tr("Baxış rejimi — kart ödənişi deaktivdir.", "Preview mode — card checkout is disabled.", "Режим предпросмотра — оплата картой отключена."));
      return;
    }
    setBusy(true);
    try {
      const data = await publicInitiateEpointPayment(publicToken, language === "az" ? "az" : "en");
      window.location.assign(data.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Kart ödənişi mümkün deyil", "Card payment unavailable", "Оплата картой недоступна"));
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
      setError(err instanceof Error ? err.message : tr("Bank ödənişi yaradıla bilmədi", "Could not create bank payment", "Не удалось создать банковский платёж"));
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
              <p className="text-[10px] text-white/60 uppercase tracking-widest leading-none">{tr("Təhlükəsiz ödəniş", "Secure Payment", "Безопасная оплата")}</p>
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
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{tr("Faktura", "Invoice", "Счёт")}</p>
                <p className="text-sm font-semibold text-gray-800">{offerCode} — {clientName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {tr("Ödəniləcək məbləğ", "Amount due", "Сумма к оплате")}: <span className="font-bold text-orange-500">{fmtAZNDec(remaining)}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">{tr("Yalnız tam qalıq məbləğ", "Full outstanding balance only", "Только полная сумма остатка")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">{tr("Ödəniş üsulu", "Method", "Способ оплаты")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["card", tr("Kart", "Card", "Карта"), CreditCard],
                    ["bank", tr("Bank köçürməsi", "Bank Transfer", "Банковский перевод"), Banknote],
                  ] as ["card" | "bank", string, typeof CreditCard][]).map(([k, lbl, Icon]) => (
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
                  {tr(
                    "Təhlükəsiz ödəniş üçün Epoint-ə yönləndiriləcəksiniz. Kart məlumatları burada daxil edilmir.",
                    "You will be redirected to Epoint to pay securely. Card details are never entered here.",
                    "Вы будете перенаправлены на Epoint для безопасной оплаты. Данные карты здесь не вводятся.",
                  )}
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
              <p className="text-sm font-semibold text-blue-800 mb-1">{tr("Bank köçürməsi məlumatları", "Bank Transfer Details", "Реквизиты банковского перевода")}</p>
              <p className="text-xs text-blue-700 mb-2">
                {tr("Köçürün", "Transfer", "Переведите")} <span className="font-bold">{fmtAZNDec(remaining)}</span> {tr("və bizə bildirin.", "then notify us.", "и сообщите нам.")}
              </p>
              {(
                [
                  [tr("Bank", "Bank", "Банк"), bank.bank],
                  [tr("Hesab", "Account", "Счёт"), bank.accountName],
                  ["IBAN", bank.iban],
                  [tr("İstinad", "Ref", "Ссылка"), bank.reference],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-blue-500 uppercase tracking-wider">{k}</span>
                  <span className="text-sm font-semibold text-blue-900 font-mono break-all">{v}</span>
                </div>
              ))}
              <p className="text-xs text-blue-500 pt-2 border-t border-blue-200">
                {tr(
                  "Köçürmədən sonra Bildirin düyməsinə basın — komandamız ödənişi təsdiq edəcək.",
                  "After transferring, click Notify — our team will confirm the payment.",
                  "После перевода нажмите «Уведомить» — наша команда подтвердит платёж.",
                )}
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{tr("Köçürmə bildirildi", "Transfer notified", "Перевод уведомлён")}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {tr(
                    `Bank köçürməniz qeydə alındı: `,
                    `We recorded your bank transfer of `,
                    `Мы зафиксировали ваш банковский перевод на сумму `,
                  )}
                  <span className="font-bold text-green-600">{fmtAZNDec(remaining)}</span>
                  {tr(
                    ". Vəsait daxil olduqdan sonra əməkdaş təsdiq edəcək.",
                    ". Staff will confirm once funds arrive.",
                    ". Сотрудник подтвердит после поступления средств.",
                  )}
                </p>
              </div>
              {orderRef && (
                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 text-left">
                  <div className="flex justify-between">
                    <span>{tr("İstinad", "Reference", "Ссылка")}</span>
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
                ? tr("Gözləyin…", "Please wait…", "Подождите…")
                : method === "card"
                  ? (
                    <>
                      {tr("Ödə", "Pay", "Оплатить")} {fmtAZNDec(remaining)} <ChevronRight className="w-4 h-4" />
                    </>
                  )
                  : (
                    <>
                      {tr("Davam et", "Continue", "Продолжить")} <ChevronRight className="w-4 h-4" />
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
                <ChevronLeft className="w-4 h-4" /> {tr("Geri", "Back", "Назад")}
              </button>
              <button
                type="button"
                onClick={notifyBankDone}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-bold transition-colors"
              >
                {tr("Köçürməni bildir", "Notify transfer", "Уведомить о переводе")}
              </button>
            </div>
          )}
          {step === "success" && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-[#001058] hover:bg-[#000844] text-white rounded-lg text-sm font-bold transition-colors"
            >
              {tr("Bağla", "Close", "Закрыть")}
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
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const isPreview = !id || id === "preview";
  const [offer, setOffer] = useState<TravelOffer>(PREVIEW_OFFER);
  const [loading, setLoading] = useState(() => Boolean(id && id !== "preview"));
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [payBanner, setPayBanner] = useState<"success" | "error" | "pending" | null>(null);
  const [payments, setPayments] = useState<OfferPaymentRow[]>([]);
  const [changeRequests, setChangeRequests] = useState<OfferChangeRequestRow[]>([]);

  const [clientAction, setClientAction]       = useState<"none" | "feedback">("none");
  const [decisionModal, setDecisionModal]     = useState<null | "accept" | "decline">(null);
  const [actionDone, setActionDone]           = useState<"accepted" | "rejected" | null>(null);
  const [feedback, setFeedback]               = useState("");
  const [declineNote, setDeclineNote]         = useState("");
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
    const sides = sideOptionsForType(t, tr);
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

  const sideOptions = sideOptionsForType(docType, tr);
  const activeTypeDocs = docsOfType(uploadedDocs, docType);
  const activeSideDocs = sideOptions.length
    ? docsForSide(activeTypeDocs, docSide)
    : activeTypeDocs;
  const activeSlotFilled = activeSideDocs.length > 0;

  function applyPublicOffer(row: TravelOfferRow) {
    setOffer(mapPublicRow(row));
    if (row.documents) setUploadedDocs(mapDocs(row.documents));
    if (Array.isArray(row.payments)) setPayments(row.payments);
    setChangeRequests(Array.isArray(row.changeRequests) ? row.changeRequests : []);
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
      setChangeRequests([]);
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

  const DOC_TYPES = ["Passport", "ID Card", "Insurance", "Visa", "Medical", "Other"] as const;
  const docTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      Passport:  tr("Pasport", "Passport", "Паспорт"),
      "ID Card": tr("Şəxsiyyət vəsiqəsi", "ID Card", "Удостоверение личности"),
      Insurance: tr("Sığorta", "Insurance", "Страховка"),
      Visa:      tr("Viza", "Visa", "Виза"),
      Medical:   tr("Tibbi", "Medical", "Медицинский"),
      Other:     tr("Digər", "Other", "Другое"),
    };
    return map[t] ?? t;
  };

  function openCheckout() {
    if (actionsLocked || remaining <= 0 || pendingBank) return;
    setShowCheckout(true);
  }

  async function confirmAccept() {
    if (actionsLocked || decisionDone) return;
    setActionError(null);
    if (isPreview) {
      setActionDone("accepted");
      setDecisionModal(null);
      return;
    }
    setBusy(true);
    try {
      const row = await publicAcceptOffer(id!);
      applyPublicOffer(row);
      setActionDone("accepted");
      setClientAction("none");
      setDecisionModal(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tr("Qəbul etmək alınmadı", "Failed to accept", "Не удалось принять"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDecline() {
    if (actionsLocked || decisionDone) return;
    setActionError(null);
    if (isPreview) {
      setActionDone("rejected");
      setDecisionModal(null);
      return;
    }
    setBusy(true);
    try {
      const row = await publicDeclineOffer(id!, { note: declineNote.trim() || null });
      applyPublicOffer(row);
      setActionDone("rejected");
      setClientAction("none");
      setDecisionModal(null);
      setDeclineNote("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tr("Rədd etmək alınmadı", "Failed to decline", "Не удалось отклонить"));
    } finally {
      setBusy(false);
    }
  }

  function openAcceptModal() {
    setActionError(null);
    setDecisionModal("accept");
  }

  function openDeclineModal() {
    setActionError(null);
    setDeclineNote("");
    setDecisionModal("decline");
  }

  function closeDecisionModal() {
    if (busy) return;
    setDecisionModal(null);
    setActionError(null);
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
      setActionError(err instanceof Error ? err.message : tr("Rəy göndərmək alınmadı", "Failed to send feedback", "Не удалось отправить отзыв"));
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
          setActionError(err instanceof Error ? err.message : tr("Yükləmə uğursuz oldu", "Upload failed", "Ошибка загрузки"));
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
      setActionError(err instanceof Error ? err.message : tr("Silmək alınmadı", "Delete failed", "Не удалось удалить"));
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
      setActionError(err instanceof Error ? err.message : tr("Sənədləri göndərmək alınmadı", "Failed to submit documents", "Не удалось отправить документы"));
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
                title={tr("Əvəz et", "Replace", "Заменить")}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void removeDoc(doc)}
                disabled={busy}
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                title={tr("Sil", "Remove", "Удалить")}
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
    active:   { label: tr("Aktiv sövdələşmə", "Active Deal", "Активная сделка"), bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    sent:     { label: tr("Gözləyən təklif", "Pending Offer", "Ожидает ответа"), bg: "bg-blue-100",  text: "text-blue-700",  border: "border-blue-300"  },
    inactive: { label: tr("Aktiv deyil", "Inactive", "Неактивно"),      bg: "bg-gray-100",  text: "text-gray-600",  border: "border-gray-300"  },
    expired:  { label: tr("Vaxtı bitib", "Expired", "Истёк"),       bg: "bg-red-100",   text: "text-red-600",   border: "border-red-300"   },
    accepted: { label: tr("Qəbul edildi", "Accepted", "Принято"),      bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    rejected: { label: tr("Rədd edildi", "Declined", "Отклонено"),      bg: "bg-red-100",   text: "text-red-600",   border: "border-red-300"   },
    changing: { label: tr("Dəyişiklik tələb olunur", "Changes requested", "Запрошены изменения"), bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  };
  const sc = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.sent;

  const fromLabel = offer.from?.trim() || "";
  const toLabel = offer.to?.trim() || "";
  const hasRoute = Boolean(fromLabel && toLabel);
  const heroHeadline =
    offer.hotelName?.trim() ||
    offer.saleType?.trim() ||
    tr("Səyahət təklifi", "Travel offer", "Туристическое предложение");
  const heroTiles = [
    offer.hotelName
      ? { icon: Hotel, label: tr("Otel", "Hotel", "Отель"), value: offer.hotelName }
      : null,
    offer.flight
      ? { icon: Plane, label: tr("Uçuş", "Flight", "Рейс"), value: offer.flight }
      : null,
    offer.transfer
      ? { icon: Car, label: tr("Transfer", "Transfer", "Трансфер"), value: offer.transfer }
      : null,
    offer.meal
      ? { icon: Utensils, label: tr("Yemək", "Meal", "Питание"), value: offer.meal }
      : null,
    offer.insurance
      ? { icon: Shield, label: tr("Sığorta", "Insurance", "Страховка"), value: offer.insurance }
      : null,
  ].filter(Boolean) as { icon: typeof Hotel; label: string; value: string }[];

  const changeChatBlock =
    changeRequests.length > 0 ? (
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-[#001058]" />
          <p className="text-sm font-semibold text-[#001058]">
            {tr("Dəyişiklik söhbəti", "Change chat", "Чат по изменениям")}
          </p>
        </div>
        <OfferChangeRequestChat
          items={changeRequests}
          openLatest={actionsLocked}
          maxHeightClass=""
          labels={{
            client: tr("Siz", "You", "Вы"),
            agency: tr("Agentlik", "Agency", "Агентство"),
            empty: tr("Mesaj yoxdur", "No messages", "Нет сообщений"),
            waiting: tr(
              "Agentlik cavabını gözləyirik…",
              "Waiting for the agency reply…",
              "Ожидаем ответ агентства…",
            ),
          }}
        />
      </div>
    ) : null;

  /** Sticky strip stays compact — chat & confirm forms scroll with the page. */
  const stickyBar = !effectiveActionDone ? (
    actionsLocked ? (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex gap-2.5 items-start">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-amber-900">
            {tr("Dəyişiklik sorğusu alındı", "Change request received", "Запрос на изменение получен")}
          </p>
          <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
            {tr(
              "Cavab söhbətdə görünəcək. Qəbul və ödəniş müvəqqəti deaktivdir.",
              "The reply will appear in the chat below. Accept and pay are temporarily disabled.",
              "Ответ появится в чате ниже. Принятие и оплата временно отключены.",
            )}
          </p>
        </div>
      </div>
    ) : clientAction === "none" ? (
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm text-gray-800">
            {tr("Hörmətli", "Dear", "Уважаемый(-ая)")}{" "}
            <strong>{offer.clientName}</strong>
          </p>
          {actionError && <p className="text-xs text-red-600 mt-1">{actionError}</p>}
        </div>
        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 sm:items-center sm:shrink-0 w-full sm:w-auto">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={openAcceptModal}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <ThumbsUp className="w-4 h-4" />
              {tr("Qəbul et", "Accept", "Принять")}
            </button>
            <button
              type="button"
              onClick={openDeclineModal}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <ThumbsDown className="w-4 h-4" />
              {tr("Rədd et", "Decline", "Отклонить")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setClientAction("feedback")}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-sm font-semibold text-[#001058] hover:underline underline-offset-2 disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            {tr("Dəyişiklik tələb et", "Request a change", "Запросить изменение")}
          </button>
        </div>
      </div>
    ) : null
  ) : null;

  const inlineDecisionForms = !effectiveActionDone && !actionsLocked && clientAction === "feedback" && !feedbackSent ? (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
      <p className="text-sm font-semibold text-[#001058]">
        {tr("Nəyi dəyişmək istəyirsiniz?", "What would you like changed?", "Что бы вы хотели изменить?")}
      </p>
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">
          {tr("Bu təklifi qiymətləndirin", "Rate this offer", "Оцените это предложение")}
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setFeedbackRating(n)}>
              <Star
                className={`w-6 h-6 transition-colors ${
                  n <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        placeholder={tr(
          "Tarixlər, otel, qiymət, daxil olanlar...",
          "Dates, hotel, price, inclusions...",
          "Даты, отель, цена, включённое...",
        )}
        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001058] resize-none"
      />
      {actionError && <p className="text-xs text-red-600">{actionError}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void confirmRequestChanges()}
          disabled={!feedback.trim() || busy}
          className="flex-1 min-h-[44px] py-2.5 flex items-center justify-center gap-2 bg-[#001058] hover:bg-[#000844] disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Send className="w-3.5 h-3.5" /> {tr("Göndər", "Send", "Отправить")}
        </button>
        <button
          type="button"
          onClick={() => setClientAction("none")}
          disabled={busy}
          className="px-4 min-h-[44px] border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {tr("Ləğv et", "Cancel", "Отмена")}
        </button>
      </div>
    </div>
  ) : null;

  const statusBanner = effectiveActionDone ? (
    <div
      className={`rounded-xl p-3 sm:p-4 flex items-start gap-3 border ${
        effectiveActionDone === "accepted"
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          effectiveActionDone === "accepted" ? "bg-green-100" : "bg-red-100"
        }`}
      >
        {effectiveActionDone === "accepted" ? (
          <ThumbsUp className="w-4 h-4 text-green-600" />
        ) : (
          <ThumbsDown className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-bold ${
            effectiveActionDone === "accepted" ? "text-green-800" : "text-red-700"
          }`}
        >
          {effectiveActionDone === "accepted"
            ? tr("Təklif qəbul edildi", "Offer accepted", "Предложение принято")
            : tr("Təklif rədd edildi", "Offer declined", "Предложение отклонено")}
        </p>
        <p
          className={`text-xs mt-0.5 ${
            effectiveActionDone === "accepted" ? "text-green-600" : "text-red-500"
          }`}
        >
          {effectiveActionDone === "accepted"
            ? remaining > 0
              ? tr(
                  "Ödəniş üçün yuxarıdakı «İndi ödə» düyməsindən istifadə edin və aşağıda sənədlərinizi yükləyin.",
                  "Use Pay Now in the header to pay, and upload your documents below.",
                  "Используйте «Оплатить» в шапке для оплаты и загрузите документы ниже.",
                )
              : tr(
                  "Zəhmət olmasa aşağıda səyahət sənədlərinizi yükləyin.",
                  "Please upload your travel documents below.",
                  "Пожалуйста, загрузите ваши проездные документы ниже.",
                )
            : `${tr("Agentimiz", "Our agent", "Наш агент")} ${offer.agent} ${tr(
                "yenilənmiş təkliflə sizinlə əlaqə saxlayacaq.",
                "will follow up with an updated offer.",
                "свяжется с вами с обновлённым предложением.",
              )}`}
        </p>
        {effectiveActionDone === "accepted" && remaining > 0 && !actionsLocked && pendingBank && (
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
            <Banknote className="w-3.5 h-3.5" />
            {tr("Bank təsdiqi gözlənilir", "Waiting for bank confirmation", "Ожидание подтверждения банка")}
          </div>
        )}
      </div>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        {tr("Təklif yüklənir…", "Loading offer…", "Загрузка предложения…")}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col">
        <div className="bg-[#001058] sticky top-0 z-20 shadow-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <Plane className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-white/50 uppercase tracking-widest leading-none hidden sm:block">
                  {tr("Təqdim edir", "Powered by", "При поддержке")}
                </p>
                <p className="text-sm font-bold text-white leading-tight truncate">Inflero Travel</p>
              </div>
            </div>
            <LanguageSwitcherDropdown variant="dark" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-800">
              {tr("Təklif tapılmadı", "Offer not found", "Предложение не найдено")}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {tr(
                "Bu keçid etibarsız ola bilər və ya təklif artıq mövcud deyil.",
                "This link may be invalid or the offer is no longer available.",
                "Ссылка может быть недействительной или предложение больше недоступно.",
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">

      {/* ── Sticky top bar ──────────────────────────────────────────────── */}
      <div className="bg-[#001058] sticky top-0 z-20 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-white/50 uppercase tracking-widest leading-none hidden sm:block">
                {tr("Təqdim edir", "Powered by", "При поддержке")}
              </p>
              <p className="text-sm font-bold text-white leading-tight truncate">Inflero Travel</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {effectiveActionDone === "accepted" && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 border border-green-300">
                ✓ {tr("Qəbul edildi", "Accepted", "Принято")}
              </span>
            )}
            {effectiveActionDone === "rejected" && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-600 border border-red-300">
                {tr("Rədd edildi", "Declined", "Отклонено")}
              </span>
            )}
            {feedbackSent && !actionDone && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                {tr("Dəyişiklik tələb olunur", "Changes requested", "Запрошены изменения")}
              </span>
            )}
            {!actionDone && !feedbackSent && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text} border ${sc.border}`}>
                {sc.label}
              </span>
            )}
            {remaining > 0 && !actionDone && !actionsLocked && !pendingBank && (
              <button type="button" onClick={openCheckout}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors">
                {tr("İndi ödə", "Pay Now", "Оплатить")}
              </button>
            )}
            {remaining > 0 && !actionsLocked && pendingBank && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 whitespace-nowrap">
                {tr("Bank gözlənilir", "Bank pending", "Ожидание банка")}
              </span>
            )}
            <LanguageSwitcherDropdown variant="dark" />
          </div>
        </div>
      </div>

      {actionsLocked && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {tr(
            "Dəyişiklik sorğunuz nəzərdən keçirilən müddətdə bu təklif kilidlənib. Yenilənmiş təklif göndərilənə qədər qəbul, rədd, ödəniş və sənəd yükləmə deaktivdir.",
            "This offer is locked while your change request is reviewed. Accept, decline, payments, and document uploads are disabled until we send an updated offer.",
            "Это предложение заблокировано, пока рассматривается ваш запрос на изменение. Принятие, отклонение, оплата и загрузка документов отключены до отправки обновлённого предложения.",
          )}
        </div>
      )}

      {!actionsLocked && pendingBank && (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-900">
          {tr("Bank köçürməsi", "Bank transfer of", "Банковский перевод на сумму")} <strong>{fmtAZNDec(pendingBank.amount)}</strong> {tr(
            "göndərilib — əməkdaş təsdiqi gözlənilir. Balans təsdiq edildikdən sonra yenilənəcək.",
            "submitted — awaiting staff confirmation. Balance updates after approval.",
            "отправлен — ожидается подтверждение. Баланс обновится после одобрения.",
          )}
        </div>
      )}

      {!actionsLocked && !pendingBank && pendingCard && !payBanner && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {tr("Kart ödənişi", "Card payment of", "Оплата картой на сумму")} <strong>{fmtAZNDec(pendingCard.amount)}</strong> {tr(
            "emal edilir. Balans qısa müddətdə yenilənməsə, səhifəni yeniləyin.",
            "is processing. Refresh if the balance does not update shortly.",
            "обрабатывается. Обновите страницу, если баланс не изменится в ближайшее время.",
          )}
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
          {payBanner === "success" && tr("Ödəniş təsdiqləndi. Təşəkkür edirik!", "Payment confirmed. Thank you!", "Платёж подтверждён. Спасибо!")}
          {payBanner === "error" && tr("Ödəniş tamamlanmadı. Yenidən cəhd edə bilərsiniz.", "Payment was not completed. You can try again.", "Платёж не завершён. Вы можете попробовать снова.")}
          {payBanner === "pending" && tr("Ödəniş emal edilir — balans yenilənməyibsə, səhifəni yeniləyin.", "Payment is processing — refresh shortly if the balance has not updated.", "Платёж обрабатывается — обновите страницу, если баланс не изменился.")}
        </div>
      )}

      {/* Compact sticky actions only — chat scrolls with the page */}
      {(stickyBar || statusBanner) && (
        <div className="sticky top-[52px] z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            {stickyBar ?? statusBanner}
          </div>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 lg:py-8 flex-1 w-full">
        {(changeChatBlock || inlineDecisionForms) && (
          <div className="mb-5 sm:mb-6 space-y-3">
            {changeChatBlock}
            {inlineDecisionForms}
          </div>
        )}

        {/* Compact trip intro (replaces hero) */}
        <div className="mb-5 sm:mb-6">
          <p className="text-[10px] sm:text-xs text-[#001058]/60 uppercase tracking-widest mb-1.5 font-semibold">
            {offer.saleType || tr("Təklif", "Offer", "Предложение")}
          </p>
          {hasRoute ? (
            <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-[#001058] leading-tight">{fromLabel}</span>
              <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              <span className="text-2xl sm:text-3xl font-bold text-[#001058] leading-tight">{toLabel}</span>
            </div>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-bold text-[#001058] leading-tight mb-3">{heroHeadline}</h1>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { icon: Calendar, text: formatDate(offer.saleDate) },
              {
                icon: Users,
                text: `${offer.numAdults} ${tr("böyük", "adult", "взросл.")}${offer.numAdults !== 1 ? (language === "en" ? "s" : "") : ""}${
                  (offer.numChildren ?? 0) > 0
                    ? `, ${offer.numChildren} ${tr("uşaq", "child", "дет.")}${language === "en" && offer.numChildren !== 1 ? "ren" : ""}`
                    : ""
                }`,
              },
              { icon: Globe, text: [offer.city, offer.country].filter(Boolean).join(", ") },
              {
                icon: Clock,
                text: offer.paymentDeadline
                  ? `${tr("Son tarix", "Deadline", "Крайний срок")}: ${formatDate(offer.paymentDeadline)}`
                  : "",
              },
            ]
              .filter((x) => x.text && x.text !== "—")
              .map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100"
                >
                  <Icon className="w-3.5 h-3.5 text-[#001058]/70 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
          </div>
          {heroTiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {heroTiles.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 border border-gray-200 bg-white"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,16,88,0.08)" }}
                  >
                    <Icon className="w-4 h-4 text-[#001058]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</p>
                    <p className="text-sm text-gray-800 font-medium leading-snug">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 lg:items-start">

        {/* Trip details (inclusions — no supplier/currency) */}
        <div className="lg:col-span-7 space-y-4">
        <Card title={tr("Səyahət detalları", "Trip Details", "Детали поездки")} icon={Plane}>
          <div className="p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                { icon: MapPin, label: tr("İstiqamət", "Destination", "Направление"), value: [offer.city, offer.country].filter(Boolean).join(", ") },
                { icon: Hotel, label: tr("Otel", "Hotel", "Отель"), value: offer.hotelName },
                { icon: Calendar, label: tr("Səyahət tarixi", "Travel Date", "Дата поездки"), value: formatDate(offer.saleDate) },
                { icon: Users, label: tr("Sərnişinlər", "Passengers", "Пассажиры"), value: `${offer.numAdults} ${tr("böyük", "adult", "взросл.")}${offer.numAdults !== 1 ? (language === "en" ? "s" : "") : ""}${(offer.numChildren ?? 0) > 0 ? `, ${offer.numChildren} ${tr("uşaq", "child", "дет.")}${language === "en" && offer.numChildren !== 1 ? "ren" : ""}` : ""}` },
                { icon: Utensils, label: tr("Yemək planı", "Meal Plan", "План питания"), value: offer.meal },
              ]
                .filter((x) => x.value && x.value !== "—")
                .map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(0,16,88,0.08)" }}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#001058]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium leading-none mb-0.5">
                        {label}
                      </p>
                      <p className="text-xs text-gray-800 font-semibold leading-snug">{value}</p>
                    </div>
                  </div>
                ))}
            </div>

            {[offer.flight, offer.transfer, offer.insurance, offer.meal].some(Boolean) && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />{" "}
                  {tr("Paketinizə daxildir", "Included in Your Package", "Включено в ваш пакет")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: Plane, label: offer.flight },
                    { icon: Car, label: offer.transfer },
                    { icon: Shield, label: offer.insurance },
                    { icon: Utensils, label: offer.meal },
                  ]
                    .filter((x) => x.label && x.label !== "—")
                    .map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2.5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl"
                      >
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

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2.5">
                {tr("Səyahətinizə daxildir", "Your trip includes", "Ваша поездка включает")}
              </p>
              <ul className="space-y-2 columns-1 xl:columns-2 xl:gap-x-6">
                {[
                  tr(
                    `${offer.from} — ${offer.to} gediş-dönüş uçuşları`,
                    `Round-trip flights from ${offer.from} to ${offer.to}`,
                    `Перелёт туда-обратно из ${offer.from} в ${offer.to}`,
                  ),
                  offer.hotelName
                    ? tr(
                        `${offer.hotelName} otelində yerləşmə`,
                        `Hotel accommodation at ${offer.hotelName}`,
                        `Проживание в отеле ${offer.hotelName}`,
                      )
                    : "",
                  offer.transfer || tr("Hava limanı transfer xidməti", "Airport transfer service", "Трансфер из аэропорта"),
                  offer.insurance || tr("Səyahət sığortası", "Travel insurance coverage", "Страхование путешествия"),
                  offer.meal
                    ? tr(`${offer.meal} gündəlik daxildir`, `${offer.meal} included daily`, `${offer.meal} включён ежедневно`)
                    : "",
                  tr("24/7 Inflero Travel dəstəyi", "24/7 Inflero Travel support", "Поддержка Inflero Travel 24/7"),
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 break-inside-avoid mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </Card>
        </div>

        <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: tr("Müştəri", "Client", "Клиент"), value: offer.clientName },
              { label: tr("Agent", "Agent", "Агент"), value: offer.agent },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800 break-words">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Passengers */}
        {(offer.passengers?.length ?? 0) > 0 && (
          <Card title={tr("Sərnişinlər", "Passengers", "Пассажиры")} icon={Users}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] lg:min-w-0">
                <thead className="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    {[
                      "#",
                      tr("Ad Soyad", "Full Name", "Полное имя"),
                      tr("Doğum tarixi", "Date of Birth", "Дата рождения"),
                      tr("Pasport №", "Passport No.", "№ паспорта"),
                      tr("Bitmə tarixi", "Expiry", "Срок действия"),
                    ].map(h => (
                      <th key={h} className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {offer.passengers.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{p.fullName || "—"}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{p.dob ? formatDate(p.dob) : "—"}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{p.passportNo || "—"}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{p.passportExpiry ? formatDate(p.passportExpiry) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        </div>

        {/* Documents — full width under the two columns */}
        <div className="lg:col-span-12">
        <Card title={tr("Sənədlər", "Documents", "Документы")} icon={Upload}>
          <div className="p-4 sm:p-5">
            {actionsLocked ? (
              <p className="text-xs text-amber-700 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {tr(
                  "Dəyişiklik sorğunuz nəzərdən keçirilən müddətdə sənəd yükləmə deaktivdir. Mövcud fayllar görünən olaraq qalır.",
                  "Document upload is disabled while your change request is under review. Existing files remain visible.",
                  "Загрузка документов отключена, пока ваш запрос на изменение рассматривается. Существующие файлы остаются видимыми.",
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mb-4">
                {tr(
                  "Aşağıdan növü seçin. Tamamlanmış tablar işarə ilə göstərilir. JPG, PNG, PDF — maks 10 MB.",
                  "Select a type below. Completed tabs show a checkmark. JPG, PNG, PDF — max 10 MB.",
                  "Выберите тип ниже. Заполненные вкладки отмечены галочкой. JPG, PNG, PDF — макс. 10 МБ.",
                )}
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
                    {docTypeLabel(t)}
                  </button>
                );
              })}
            </div>

            {/* Side / page chips when relevant */}
            {sideOptions.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  {docType === "Passport" ? tr("Səhifə", "Page", "Страница") : tr("Tərəf", "Side", "Сторона")}
                  {docType === "ID Card" ? tr(" (ön + arxa tələb olunur)", " (front + back required)", " (лицевая + обратная обязательны)") : ""}
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
                          <span className="text-[9px] opacity-70">{tr("istəyə bağlı", "optional", "необязательно")}</span>
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
                    {docTypeLabel(docType)}
                    {docSide ? ` · ${offerDocSideLabel(docType, docSide)}` : ""}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
                    <CheckCircle className="w-3 h-3" /> {tr("Yüklənib", "Uploaded", "Загружено")}
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
                    + {tr("Başqa fayl əlavə et", "Add another file", "Добавить ещё файл")}
                  </button>
                )}
              </div>
            ) : actionsLocked ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                <p className="text-xs text-gray-500">
                  {docTypeLabel(docType)}
                  {docSide ? ` (${offerDocSideLabel(docType, docSide)})` : ""} {tr("hələ yüklənməyib.", "not uploaded yet.", "ещё не загружен.")}
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
                  {tr("Yüklə", "Upload", "Загрузить")}{" "}
                  <span className="text-[#001058]">
                    {docTypeLabel(docType)}
                    {docSide ? ` · ${offerDocSideLabel(docType, docSide)}` : ""}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{tr("Toxunun və ya sürükləyin", "Tap or drag & drop", "Нажмите или перетащите")}</p>
              </div>
            )}

            {/* Quick overview of other completed types */}
            {uploadedDocs.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {tr("İcmal", "Overview", "Обзор")}
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
                        {docTypeLabel(t)} · {n}
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
                      <p className="text-sm font-semibold text-green-800">{tr("Sənədlər göndərildi", "Documents submitted", "Документы отправлены")}</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        {tr(
                          "Təşəkkür edirik — komandamıza bildirilib. Lazım gələrsə, faylları hələ də əvəz edə bilərsiniz.",
                          "Thanks — our team has been notified. You can still replace files if needed.",
                          "Спасибо — наша команда уведомлена. При необходимости вы можете заменить файлы.",
                        )}
                        {" "}
                        {tr("Göndərildi", "Submitted", "Отправлено")} {new Date(offer.documentsSubmittedAt).toLocaleString()}.
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
                        {tr(
                          "Yüklədiyim sənədlərin düzgün, tam olduğunu və Inflero Travel tərəfindən nəzərdən keçirilməyə hazır olduğunu təsdiq edirəm.",
                          "I confirm the documents I uploaded are correct, complete, and ready for Inflero Travel to review.",
                          "Подтверждаю, что загруженные мной документы верны, полны и готовы к проверке Inflero Travel.",
                        )}
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
                      {docsSubmitting ? tr("Göndərilir…", "Submitting…", "Отправка…") : tr("Sənədləri nəzərdən keçirmə üçün göndər", "Submit documents for review", "Отправить документы на проверку")}
                    </button>
                    {uploadedDocs.length < 1 && (
                      <p className="text-[11px] text-gray-400 text-center">
                        {tr("Göndərməzdən əvvəl ən azı bir sənəd yükləyin.", "Upload at least one document before submitting.", "Загрузите хотя бы один документ перед отправкой.")}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
        </div>

        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 bg-white mt-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#001058] flex items-center justify-center">
              <Plane className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Inflero Travel Management</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            {tr("Təklif", "Offer", "Предложение")} <span className="font-mono">{offer.id}</span> · {tr("Yaradılıb", "Generated", "Создано")} {formatDate(offer.createdAt)}
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

      <Dialog
        open={decisionModal === "accept"}
        onOpenChange={(open) => {
          if (!open) closeDecisionModal();
        }}
      >
        <DialogContent className="sm:max-w-md bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-[#001058]">
              {tr("Təklifi qəbul edirsiniz?", "Accept this offer?", "Принять предложение?")}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {tr(
                "Təsdiqləməklə təklif şərtləri ilə razılaşırsınız.",
                "By confirming you agree to the offer terms.",
                "Подтверждая, вы соглашаетесь с условиями предложения.",
              )}
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-xs text-red-600">{actionError}</p>}
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={closeDecisionModal}
              disabled={busy}
              className="min-h-[42px] px-4 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {tr("Ləğv et", "Cancel", "Отмена")}
            </button>
            <button
              type="button"
              onClick={() => void confirmAccept()}
              disabled={busy}
              className="min-h-[42px] px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              {busy
                ? tr("…", "…", "…")
                : tr("Qəbulu təsdiq et", "Confirm accept", "Подтвердить")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={decisionModal === "decline"}
        onOpenChange={(open) => {
          if (!open) closeDecisionModal();
        }}
      >
        <DialogContent className="sm:max-w-md bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-red-700">
              {tr("Təklifi rədd edirsiniz?", "Decline this offer?", "Отклонить предложение?")}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {tr(
                "İstəyə görə səbəb yazın — təklifi yaxşılaşdırmağa kömək edir.",
                "Optionally tell us why — it helps us improve the offer.",
                "По желанию укажите причину — это поможет улучшить предложение.",
              )}
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={declineNote}
            onChange={(e) => setDeclineNote(e.target.value)}
            rows={3}
            disabled={busy}
            placeholder={tr(
              "Səbəbiniz (istəyə bağlı)...",
              "Your reason (optional)...",
              "Ваша причина (необязательно)...",
            )}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          {actionError && <p className="text-xs text-red-600">{actionError}</p>}
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={closeDecisionModal}
              disabled={busy}
              className="min-h-[42px] px-4 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {tr("Ləğv et", "Cancel", "Отмена")}
            </button>
            <button
              type="button"
              onClick={() => void confirmDecline()}
              disabled={busy}
              className="min-h-[42px] px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              {busy
                ? tr("…", "…", "…")
                : tr("Rədd et", "Decline", "Отклонить")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
