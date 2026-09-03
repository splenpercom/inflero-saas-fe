import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CreditCard, Lock, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { billingT, fillDays } from "../../i18n/billingTranslations";
import { initiateBillingPayment, syncBillingPayment, type BillingStatus } from "../../api/billing";
import { ApiError } from "../../api/client";

const DISMISS_KEY = "inflero-billing-dismiss";

function readDismissed(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeDismissed(code: string, dueDate: string | null) {
  const map = readDismissed();
  map[code] = dueDate ?? "none";
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify(map));
}

function wasDismissed(code: string, dueDate: string | null): boolean {
  const map = readDismissed();
  return map[code] === (dueDate ?? "none");
}

export function PaymentStatusGate() {
  const { user, isDemo, logout } = useAuth();
  const { language } = useLanguage();
  const t = billingT(language);
  const [paying, setPaying] = useState(false);
  const [forceLocked, setForceLocked] = useState(false);
  const [open, setOpen] = useState(false);

  const billing = (user?.tenant as { billing?: BillingStatus } | undefined)?.billing;

  useEffect(() => {
    const handler = () => setForceLocked(true);
    window.addEventListener("inflero:subscription-locked", handler);
    return () => window.removeEventListener("inflero:subscription-locked", handler);
  }, []);

  useEffect(() => {
    if (!billing || isDemo) {
      setOpen(false);
      return;
    }
    if (billing.locked || billing.code === "LOCKED" || forceLocked) {
      setOpen(true);
      return;
    }
    if (
      billing.code === "WARNING_3_DAYS" ||
      billing.code === "DUE_TODAY" ||
      billing.code === "OVERDUE"
    ) {
      setOpen(!wasDismissed(billing.code, billing.dueDate));
      return;
    }
    setOpen(false);
  }, [billing, forceLocked, isDemo]);

  const locked = forceLocked || billing?.locked || billing?.code === "LOCKED";

  const onPay = useCallback(async () => {
    setPaying(true);
    try {
      const data = await initiateBillingPayment(language === "az" ? "az" : "en");
      window.location.href = data.redirectUrl;
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 402) {
        setForceLocked(true);
      }
      setPaying(false);
    }
  }, [language]);

  const onClose = () => {
    if (!billing || locked) return;
    writeDismissed(billing.code, billing.dueDate);
    setOpen(false);
  };

  if (isDemo || !user || !billing) return null;

  const showBanner =
    !locked &&
    (billing.code === "WARNING_3_DAYS" ||
      billing.code === "DUE_TODAY" ||
      billing.code === "OVERDUE");

  const bannerText =
    billing.code === "DUE_TODAY"
      ? t.bannerDueToday
      : billing.code === "OVERDUE"
        ? fillDays(t.bannerOverdue, billing.daysOverdue)
        : fillDays(t.bannerWarning, billing.daysLeft);

  let title = t.warningTitle;
  let body = fillDays(t.warningBody, billing.daysLeft);
  if (billing.code === "DUE_TODAY") {
    title = t.dueTodayTitle;
    body = t.dueTodayBody;
  } else if (billing.code === "OVERDUE") {
    title = t.overdueTitle;
    body = fillDays(t.overdueBody, billing.daysOverdue);
  } else if (locked) {
    title = t.lockedTitle;
    body = t.lockedBody;
  }

  return (
    <>
      {showBanner && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-4 py-2 flex items-center justify-between gap-3 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">{bannerText}</span>
            {billing.amount && (
              <span className="hidden sm:inline text-xs opacity-80">
                · {t.amountDue}: {billing.amount} ₼
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 text-white text-xs font-medium"
          >
            <CreditCard className="w-3.5 h-3.5" />
            {t.payNow}
          </button>
        </div>
      )}

      {(open || locked) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 ${
              locked ? "ring-2 ring-red-500/40" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    locked
                      ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  }`}
                >
                  {locked ? <Lock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
              </div>
              {!locked && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={t.close}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{body}</p>

            {billing.amount && (
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.amountDue}: {billing.amount} ₼
              </p>
            )}

            <div className={`flex gap-2 ${locked ? "flex-col" : "justify-end"}`}>
              {locked && (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                >
                  {t.logout}
                </button>
              )}
              {!locked && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {t.close}
                </button>
              )}
              <button
                type="button"
                disabled={paying}
                onClick={onPay}
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[#14b8a6] text-white disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {paying ? "…" : t.payNow}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function BillingResultPage() {
  const { refresh } = useAuth();
  const { language } = useLanguage();
  const t = billingT(language);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const statusParam = params.get("status");
  const orderId = params.get("order_id");
  const [status, setStatus] = useState<"success" | "error" | "pending">(
    statusParam === "error" ? "error" : "pending",
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (statusParam === "error") {
        setStatus("error");
        return;
      }
      if (orderId) {
        try {
          const result = await syncBillingPayment(orderId);
          if (cancelled) return;
          if (result.status === "success") setStatus("success");
          else if (result.status === "failed") setStatus("error");
          else setStatus(statusParam === "success" ? "success" : "pending");
        } catch {
          if (!cancelled) setStatus(statusParam === "success" ? "success" : "error");
        }
      } else if (statusParam === "success") {
        setStatus("success");
      }
      try {
        await refresh();
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, refresh, statusParam]);

  const title =
    status === "success"
      ? t.resultSuccessTitle
      : status === "error"
        ? t.resultErrorTitle
        : t.resultPendingTitle;
  const body =
    status === "success"
      ? t.resultSuccessBody
      : status === "error"
        ? t.resultErrorBody
        : t.resultPendingBody;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 space-y-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">{body}</p>
        <div className="flex flex-col gap-2">
          <a
            href="/dashboard"
            className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[#14b8a6] text-white"
          >
            {t.backToDashboard}
          </a>
          {status === "error" && (
            <button
              type="button"
              onClick={async () => {
                const data = await initiateBillingPayment(language === "az" ? "az" : "en");
                window.location.href = data.redirectUrl;
              }}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {t.tryAgain}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
