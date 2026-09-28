import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Printer, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { pickLang } from "../../i18n/pickLang";
import { fetchSalesReport } from "../../api/reports";
import { formatReportCurrency, parseReportMoney } from "../../lib/reportMappers";
import { formatDate } from "../../lib/dateFormat";
import { printDailySalesSummary } from "../../lib/posPrint";
import { APP_LOGO_LIGHT } from "../../lib/branding";
import { getCompanyLogoUrl } from "../../lib/userDisplay";
import { notifyFromError, notifySuccess, notifyWarning } from "../../lib/toast";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { DateInput } from "../ui/DateInput";
import { ModernSelect } from "../ui/ModernSelect";

type DaySalesRow = {
  name: string;
  qty: number;
  amount: number;
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const v = String(i).padStart(2, "0");
  return { value: v, label: v };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const v = String(i).padStart(2, "0");
  return { value: v, label: v };
});

function localYmd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local wall-clock HH:mm (24h). */
function localHm(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function parseHm(hm: string): { hour: number; minute: number } {
  const [hRaw, mRaw] = (hm || "00:00").split(":");
  const hour = Math.min(23, Math.max(0, Number(hRaw) || 0));
  const minute = Math.min(59, Math.max(0, Number(mRaw) || 0));
  return { hour, minute };
}

/** Sales from local midnight of `ymd` through `ymd` + `hm` (inclusive end). */
function localDayRangeToTime(ymd: string, hm: string): { dateFrom: string; dateTo: string } {
  const [y, m, d] = ymd.split("-").map(Number);
  const { hour, minute } = parseHm(hm);
  const from = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  const to = new Date(y, (m || 1) - 1, d || 1, hour, minute, 59, 999);
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

function formatYmdHm24(
  ymd: string,
  hm: string,
  language?: Parameters<typeof formatDate>[1],
): string {
  const { hour, minute } = parseHm(hm);
  return `${formatDate(parseYmdLocal(ymd), language)} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function DaySalesBillModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const { user, hasModule } = useAuth();
  const branchRevision = useBranchRevision();
  /** QZ multi-printer routing is a Dining feature; others use the browser print dialog. */
  const diningEnabled = hasModule("DINING");
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  const [selectedDate, setSelectedDate] = useState(localYmd);
  const [selectedTime, setSelectedTime] = useState(localHm);
  const [items, setItems] = useState<DaySalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const { hour: selectedHour, minute: selectedMinute } = useMemo(
    () => parseHm(selectedTime),
    [selectedTime],
  );

  const hourValue = String(selectedHour).padStart(2, "0");
  const minuteValue = String(selectedMinute).padStart(2, "0");

  const total = useMemo(
    () => items.reduce((sum, row) => sum + row.amount, 0),
    [items],
  );
  const totalQty = useMemo(
    () => items.reduce((sum, row) => sum + row.qty, 0),
    [items],
  );

  const rangeLabel = useMemo(
    () => formatYmdHm24(selectedDate, selectedTime, language),
    [selectedDate, selectedTime, language],
  );

  const loadDay = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const { dateFrom, dateTo } = localDayRangeToTime(selectedDate, selectedTime);
      const report = await fetchSalesReport({ dateFrom, dateTo, limit: 500 });
      setItems(
        (report.items ?? [])
          .map((row) => ({
            name: row.productName?.trim() || row.sku || "—",
            qty: Number(row.soldQty) || 0,
            amount: parseReportMoney(row.soldAmount),
          }))
          .filter((row) => row.qty > 0 || row.amount > 0),
      );
    } catch (err) {
      notifyFromError(err, pt("Failed to load day sales", "Günün satışlarını yükləmək alınmadı"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedTime, language, branchRevision]);

  useEffect(() => {
    if (!open) return;
    setSelectedDate(localYmd());
    setSelectedTime(localHm());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void loadDay();
  }, [open, loadDay]);

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      const logoSrc =
        getCompanyLogoUrl(user?.tenant, false) ??
        getCompanyLogoUrl(user?.tenant, true) ??
        APP_LOGO_LIGHT;

      await printDailySalesSummary({
        language,
        forceBrowser: !diningEnabled,
        payload: {
          date: rangeLabel,
          companyName: user?.tenant?.name?.trim() || "Inflero",
          logoSrc,
          siteFooter: "app.inflero.com",
          items,
          total,
        },
      });
      if (items.length === 0) {
        notifyWarning(
          pt("No sales for this period — empty bill printed", "Bu dövr üçün satış yoxdur — boş hesab çap olundu"),
        );
      } else {
        notifySuccess(pt("Day sales bill sent to printer", "Günün satış hesabı printerə göndərildi"));
      }
    } catch (err) {
      notifyFromError(err, pt("Failed to print day sales", "Günün satışlarını çap etmək alınmadı"));
    } finally {
      setPrinting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-sales-bill-title"
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3
            id="day-sales-bill-title"
            className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#14b8a6]" />
            {pt("Day sales bill", "Günün satış hesabı")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={pt("Close", "Bağla")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                {pt("Select date", "Tarix seçin")}
              </span>
              <DateInput
                value={selectedDate}
                onChange={(v) => setSelectedDate(v || localYmd())}
                defaultYearsAgo={0}
                className="w-full !py-2 !text-sm"
              />
            </div>

            <div className="min-w-0">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                {pt("Time (24h)", "Saat (24s)")}
              </span>
              <div className="flex items-center gap-1.5">
                <ModernSelect
                  value={hourValue}
                  onChange={(h) => setSelectedTime(`${h}:${minuteValue}`)}
                  options={HOUR_OPTIONS}
                  minWidth={72}
                  className="flex-1"
                  buttonClassName="!py-2 !text-sm"
                  placeholder={pt("HH", "SS")}
                />
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                  :
                </span>
                <ModernSelect
                  value={minuteValue}
                  onChange={(m) => setSelectedTime(`${hourValue}:${m}`)}
                  options={MINUTE_OPTIONS}
                  minWidth={72}
                  className="flex-1"
                  buttonClassName="!py-2 !text-sm"
                  placeholder={pt("MM", "DD")}
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {pt(
              "Sales from 00:00 through the selected time on that date.",
              "Satışlar həmin günün 00:00-dan seçilmiş saata qədər.",
            )}
          </p>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                {rangeLabel}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {pt(
                  `${items.length} products · ${totalQty} qty`,
                  `${items.length} məhsul · ${totalQty} əd`,
                )}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-500 dark:text-gray-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {pt("Loading…", "Yüklənir…")}
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                  {pt("No sales for this period", "Bu dövr üçün satış yoxdur")}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((row) => (
                    <li
                      key={`${row.name}-${row.qty}-${row.amount}`}
                      className="flex items-start justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {row.name}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {row.qty} {pt("qty", "əd")}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatReportCurrency(row.amount)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {pt("TOTAL", "CƏMİ")}
              </span>
              <span className="text-sm font-bold text-[#14b8a6]">
                {formatReportCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {pt("Close", "Bağla")}
          </button>
          <button
            type="button"
            onClick={() => void handlePrint()}
            disabled={loading || printing}
            className="flex-1 py-2 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {printing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5" />
            )}
            {pt("Print", "Çap et")}
          </button>
        </div>
      </div>
    </div>
  );
}
