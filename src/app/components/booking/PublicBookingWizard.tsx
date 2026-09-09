import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, MapPin, Phone } from "lucide-react";
import { DEFAULT_CONFIG } from "../../utils/reservationConfig";
import {
  createPublicReservation,
  fetchPublicReservationConfig,
  fetchPublicReservationSlots,
  type PublicBranchOption,
  type PublicTenantBranding,
  type ReservationConfig,
  type SlotAvailability,
} from "../../api/publicReservations";
import type { BookingPageMode } from "../../lib/branchBooking";
import { customerBookingPath } from "../../lib/bookingLinks";
import { ApiError } from "../../api/client";
import type { ServiceTypeOption } from "../../lib/serviceTypes";
import {
  DAY_SHORT,
  MONTHS,
  otherServiceFallback,
  pickText,
  serviceOptionLabel,
  type CustomerSiteLang,
} from "../../lib/customerSiteLang";
import { CustomerSiteLanguageSwitcher } from "../CustomerSiteLanguageSwitcher";

const OTHER_SERVICE_VALUE = "other";

function isOtherService(value: string) {
  return value.toLowerCase() === OTHER_SERVICE_VALUE;
}

const DEFAULT_SERVICES: ServiceTypeOption[] = [
  { value: "oil-change", label: "Oil Change", labelAz: "Yağ dəyişimi", labelTr: "Yağ değişimi" },
  { value: "full-service", label: "Full Service", labelAz: "Tam texniki xidmət", labelTr: "Tam bakım" },
  { value: "inspection", label: "Inspection", labelAz: "Texniki baxış", labelTr: "Muayene" },
  { value: "other", label: "Other", labelAz: "Digər", labelTr: "Diğer" },
];

type Step = "date" | "time" | "service" | "contact" | "done";

function dateToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildScheduledAtIso(date: Date, time: string): string {
  const [h, mi] = time.split(":").map(Number);
  const dt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, mi, 0, 0);
  return dt.toISOString();
}

export type PublicBookingWizardProps = {
  tenantSlug: string;
  branchSlug?: string | null;
  /** Optional heading override (website block). */
  title?: string;
  subtext?: string;
  /** Show language switcher above the card. Default true. */
  showLanguageSwitcher?: boolean;
  className?: string;
  onBrandingLoad?: (branding: PublicTenantBranding) => void;
};

/**
 * Shared booking wizard used by /res customer site and My Website reservation block.
 * Same config, slots, and create APIs as the Bookings module.
 */
export function PublicBookingWizard({
  tenantSlug,
  branchSlug = null,
  title,
  subtext,
  showLanguageSwitcher = true,
  className = "",
  onBrandingLoad,
}: PublicBookingWizardProps) {
  const [lang, setLang] = useState<CustomerSiteLang>("az");
  const [company, setCompany] = useState<PublicTenantBranding | null>(null);
  const [resConfig, setResConfig] = useState<ReservationConfig>(DEFAULT_CONFIG);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>(DEFAULT_SERVICES);
  const [bookingMode, setBookingMode] = useState<BookingPageMode>("shared");
  const [branchOptions, setBranchOptions] = useState<PublicBranchOption[]>([]);
  const [activeBranchSlug, setActiveBranchSlug] = useState<string | null>(branchSlug);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("date");
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selTime, setSelTime] = useState("");
  const [selService, setSelService] = useState("");
  const [customService, setCustomService] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");

  const onBrandingLoadRef = useRef(onBrandingLoad);
  onBrandingLoadRef.current = onBrandingLoad;

  useEffect(() => {
    setActiveBranchSlug(branchSlug);
  }, [branchSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setConfigLoading(true);
      setConfigError(null);
      try {
        const data = await fetchPublicReservationConfig(tenantSlug, branchSlug);
        if (cancelled) return;
        setBookingMode(data.mode);
        setCompany(data.tenant);
        onBrandingLoadRef.current?.(data.tenant);
        if (data.mode === "per_branch" && !branchSlug) {
          setBranchOptions(data.branches ?? []);
          return;
        }
        setBranchOptions([]);
        if (data.config) {
          setResConfig(data.config);
          setServiceTypes(data.config.serviceTypes?.length ? data.config.serviceTypes : DEFAULT_SERVICES);
        }
        if (data.branchSlug) setActiveBranchSlug(data.branchSlug);
      } catch (err) {
        if (!cancelled) {
          setConfigError(err instanceof ApiError ? err.message : "Failed to load booking settings");
        }
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, branchSlug]);

  const loadSlots = useCallback(
    async (date: Date) => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const data = await fetchPublicReservationSlots(tenantSlug, dateToYmd(date), activeBranchSlug);
        setSlots(data);
      } catch (err) {
        setSlots([]);
        setSlotsError(err instanceof ApiError ? err.message : "Failed to load time slots");
      } finally {
        setSlotsLoading(false);
      }
    },
    [tenantSlug, activeBranchSlug],
  );

  const t = (en: string, az: string, tr: string) => pickText(lang, en, az, tr);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
  };

  const isPast = (d: number) => {
    const dt = new Date(calYear, calMonth, d);
    dt.setHours(0, 0, 0, 0);
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    return dt < t0;
  };

  const isSel = (d: number) =>
    selDate?.getFullYear() === calYear && selDate?.getMonth() === calMonth && selDate?.getDate() === d;

  const isToday = (d: number) =>
    today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;

  const isWorkingDay = (d: number) => {
    const dt = new Date(calYear, calMonth, d);
    return resConfig.workingDays.includes(dt.getDay());
  };

  const selectDate = (d: number) => {
    if (isPast(d) || !isWorkingDay(d)) return;
    const picked = new Date(calYear, calMonth, d);
    setSelDate(picked);
    setSelTime("");
    setSelService("");
    setCustomService("");
    void loadSlots(picked);
    setStep("time");
  };

  const serviceLabel = (value: string) => {
    if (isOtherService(value)) {
      return customService.trim() || otherServiceFallback(lang);
    }
    const s = serviceTypes.find((x) => x.value === value);
    if (!s) return value;
    return serviceOptionLabel(s, lang);
  };

  const resolvedServiceType = () => {
    if (!selService) return "";
    if (isOtherService(selService)) return customService.trim();
    return selService;
  };

  const selectService = (value: string) => {
    setSelService(value);
    if (!isOtherService(value)) {
      setCustomService("");
      setStep("contact");
    }
  };

  const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;

  const handleSubmit = async () => {
    const serviceType = resolvedServiceType();
    if (!custName || !custPhone || !selDate || !selTime || !serviceType) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createPublicReservation(
        tenantSlug,
        {
          guestName: custName.trim(),
          guestPhone: custPhone.trim(),
          serviceType,
          scheduledAt: buildScheduledAtIso(selDate, selTime),
          branchSlug: activeBranchSlug ?? undefined,
        },
        activeBranchSlug,
      );
      setStep("done");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep("date");
    setSelDate(null);
    setSelTime("");
    setSelService("");
    setCustomService("");
    setCustName("");
    setCustPhone("");
    setSubmitError(null);
    setSlots([]);
  };

  const hourRange = () => {
    const start = `${String(resConfig.startHour).padStart(2, "0")}:${String(resConfig.startMinute).padStart(2, "0")}`;
    const end = `${String(resConfig.endHour).padStart(2, "0")}:${String(resConfig.endMinute).padStart(2, "0")}`;
    return `${start} – ${end}`;
  };

  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  const STEPS: { key: Step; label: string; labelAz: string; labelTr: string }[] = [
    { key: "date", label: "Date", labelAz: "Tarix", labelTr: "Tarih" },
    { key: "time", label: "Time", labelAz: "Saat", labelTr: "Saat" },
    { key: "service", label: "Service", labelAz: "Xidmət", labelTr: "Hizmet" },
    { key: "contact", label: "Contact", labelAz: "Əlaqə", labelTr: "İletişim" },
  ];
  const stepIdx = STEPS.findIndex((s) => s.key === step);

  const heading =
    title?.trim() ||
    t("Book your appointment", "Rezervasiya edin", "Randevu alın");
  const subtitle =
    subtext?.trim() ||
    t(
      "Book your car service appointment in seconds",
      "Avtomobil servis rezervasiyanızı saniyələr içində edin",
      "Araç servis randevunuzu saniyeler içinde alın",
    );

  if (configLoading) {
    return (
      <div className={`rounded-2xl bg-white border border-gray-100 p-8 text-center text-sm text-gray-500 ${className}`}>
        {t("Loading...", "Yüklənir...", "Yükleniyor...")}
      </div>
    );
  }

  if (configError) {
    return (
      <div className={`rounded-2xl bg-white border border-gray-100 p-8 text-center ${className}`}>
        <p className="text-sm font-semibold text-gray-900">
          {t("Booking is currently unavailable.", "Rezervasiya hazırda əlçatan deyil.", "Rezervasyon şu anda kullanılamıyor.")}
        </p>
        <p className="text-xs text-gray-500 mt-2">{configError}</p>
      </div>
    );
  }

  if (bookingMode === "per_branch" && !branchSlug) {
    return (
      <div className={`rounded-2xl bg-white border border-gray-100 overflow-hidden ${className}`}>
        <div className="p-5 text-center border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{heading}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {t("Choose a branch to book your service", "Rezervasiya üçün filial seçin", "Rezervasyon için şube seçin")}
          </p>
        </div>
        <div className="p-4 space-y-2">
          {branchOptions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">
              {t(
                "No branch booking pages are available yet.",
                "Filial rezervasiya səhifələri hələ mövcud deyil.",
                "Şube rezervasyon sayfaları henüz mevcut değil.",
              )}
            </p>
          ) : (
            branchOptions.map((branch) => (
              <Link
                key={branch.storeId}
                to={customerBookingPath(tenantSlug, branch.slug)}
                className="block bg-gray-50 hover:bg-[#f0fdfa] border border-gray-100 hover:border-[#14b8a6]/30 rounded-xl p-4 transition-colors"
              >
                <p className="font-semibold text-[#14b8a6] text-sm">{branch.name}</p>
                {branch.address && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {branch.address}
                  </p>
                )}
                {branch.phone && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 shrink-0" />
                    {branch.phone}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {(title || subtext || showLanguageSwitcher) && (
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{heading}</h3>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
            {company?.name && (
              <p className="text-[10px] text-gray-400 mt-1">
                {company.name}
                {activeBranchSlug ? ` · /res/${tenantSlug}/${activeBranchSlug}` : ` · /res/${tenantSlug}`}
              </p>
            )}
          </div>
          {showLanguageSwitcher && <CustomerSiteLanguageSwitcher lang={lang} onChange={setLang} />}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 overflow-hidden max-w-xl mx-auto w-full">
        {step !== "done" && (
          <div className="flex border-b border-gray-100">
            {STEPS.map((s, i) => {
              const done = stepIdx > i;
              const active = stepIdx === i;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    if (done) setStep(s.key);
                  }}
                  disabled={!done}
                  className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors
                    ${active ? "text-[#14b8a6] border-b-2 border-[#14b8a6]" : done ? "text-green-600 cursor-pointer" : "text-gray-300"}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${active ? "bg-[#14b8a6] text-white" : done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}
                  >
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="hidden sm:block">{pickText(lang, s.label, s.labelAz, s.labelTr)}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === "date" && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-sm font-bold text-gray-900">
                {MONTHS[lang][calMonth]} {calYear}
              </span>
              <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {DAY_SHORT[lang].map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calCells.map((d, i) => {
                if (!d) return <div key={i} />;
                const past = isPast(d);
                const disabled = past || !isWorkingDay(d);
                const sel = isSel(d);
                const tod = isToday(d);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDate(d)}
                    disabled={disabled}
                    className={`aspect-square w-full rounded-xl text-sm font-medium transition-all flex items-center justify-center
                      ${
                        disabled
                          ? "text-gray-200 cursor-not-allowed"
                          : sel
                            ? "bg-[#14b8a6] text-white shadow-md shadow-[#14b8a6]/30 scale-105"
                            : tod
                              ? "border-2 border-[#14b8a6] text-[#14b8a6] hover:bg-[#f0f3ff]"
                              : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              {t("Select a date to continue", "Davam etmək üçün tarix seçin", "Devam etmek için tarih seçin")}
            </p>
            <p className="text-center text-[10px] text-gray-400 mt-1">
              {t(
                `Open hours: ${hourRange()} · ${resConfig.slotIntervalMinutes} min slots`,
                `İş saatları: ${hourRange()} · ${resConfig.slotIntervalMinutes} dəq slotlar`,
                `Çalışma saatleri: ${hourRange()} · ${resConfig.slotIntervalMinutes} dk slotlar`,
              )}
            </p>
          </div>
        )}

        {step === "time" && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => setStep("date")} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <div>
                <p className="text-xs text-gray-400">{t("Selected date", "Seçilmiş tarix", "Seçilen tarih")}</p>
                <p className="text-sm font-bold text-gray-900">{selDate ? fmtDate(selDate) : ""}</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              {t("Available Times", "Mövcud Saatlar", "Müsait Saatler")}
            </p>
            <p className="text-[10px] text-gray-400 mb-3">{hourRange()}</p>
            {slotsLoading && (
              <p className="text-xs text-gray-400 text-center py-6">{t("Loading slots...", "Saatlar yüklənir...", "Saatlar yükleniyor...")}</p>
            )}
            {slotsError && <p className="text-xs text-red-500 text-center py-4">{slotsError}</p>}
            {!slotsLoading && !slotsError && slots.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                {t("No available slots for this date", "Bu tarix üçün boş saat yoxdur", "Bu tarih için müsait saat yok")}
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => {
                const full = slot.available <= 0;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={full}
                    onClick={() => {
                      if (!full) {
                        setSelTime(slot.time);
                        setStep("service");
                      }
                    }}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all
                      ${
                        full
                          ? "border-gray-100 text-gray-300 cursor-not-allowed"
                          : selTime === slot.time
                            ? "bg-[#14b8a6] text-white border-[#14b8a6] shadow-md shadow-[#14b8a6]/20"
                            : "border-gray-200 text-gray-700 hover:border-[#14b8a6]/40 hover:text-[#14b8a6] hover:bg-[#f0f3ff]"
                      }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "service" && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <button type="button" onClick={() => setStep("time")} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <div>
                <p className="text-xs text-gray-400">{t("Appointment", "Görüş", "Randevu")}</p>
                <p className="text-sm font-bold text-gray-900">
                  {selDate ? fmtDate(selDate) : ""} · {selTime}
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              {t("Select Service", "Xidmət seçin", "Hizmet seçin")}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {serviceTypes.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => selectService(s.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold border text-left transition-all
                    ${
                      selService === s.value
                        ? "bg-[#14b8a6] text-white border-[#14b8a6]"
                        : "border-gray-200 text-gray-700 hover:border-[#14b8a6]/40 hover:bg-[#f0f3ff]"
                    }`}
                >
                  {serviceOptionLabel(s, lang)}
                </button>
              ))}
            </div>
            {isOtherService(selService) && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t("Describe your service", "Xidmətinizi təsvir edin", "Hizmetinizi açıklayın")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder={t(
                      "e.g. Wheel alignment, battery replacement",
                      "məs. Təkər balansı, akkumulyator dəyişimi",
                      "örn. Rot ayarı, akü değişimi",
                    )}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent placeholder-gray-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => customService.trim() && setStep("contact")}
                  disabled={!customService.trim()}
                  className="w-full py-3 rounded-xl bg-[#14b8a6] text-white text-sm font-bold hover:bg-[#0f766e] transition-colors shadow-lg shadow-[#14b8a6]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("Continue", "Davam Et", "Devam Et")} →
                </button>
              </div>
            )}
          </div>
        )}

        {step === "contact" && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <button type="button" onClick={() => setStep("service")} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <div>
                <p className="text-xs text-gray-400">{t("Almost done!", "Az qaldı!", "Neredeyse bitti!")}</p>
                <p className="text-sm font-bold text-gray-900">
                  {selDate ? fmtDate(selDate) : ""} · {selTime}
                  {selService && ` · ${serviceLabel(selService)}`}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t("Your Name", "Adınız", "Adınız")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  placeholder={t("Full name", "Ad Soyad", "Ad Soyad")}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent placeholder-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t("Phone Number", "Telefon nömrəsi", "Telefon numarası")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  required
                  placeholder="+994 50 000 00 00"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent placeholder-gray-300"
                />
              </div>
            </div>
            <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
              <p className="font-semibold text-gray-700 mb-2">{t("Booking Summary", "Rezervasiya Xülasəsi", "Rezervasyon Özeti")}</p>
              {[
                {
                  label: t("Date & Time", "Tarix & Saat", "Tarih & Saat"),
                  val: `${selDate ? fmtDate(selDate) : ""} · ${selTime}`,
                },
                ...(selService ? [{ label: t("Service", "Xidmət", "Hizmet"), val: serviceLabel(selService) }] : []),
              ].map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-gray-400">{r.label}</span>
                  <span className="font-semibold text-gray-800">{r.val}</span>
                </div>
              ))}
            </div>
            {submitError && <p className="text-xs text-red-500 text-center mt-2">{submitError}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!custName || !custPhone || submitting}
              className="w-full mt-4 py-3 rounded-xl bg-[#14b8a6] text-white text-sm font-bold hover:bg-[#0f766e] transition-colors shadow-lg shadow-[#14b8a6]/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting
                ? t("Submitting...", "Göndərilir...", "Gönderiliyor...")
                : t("Confirm Booking", "Rezervasiyanı Təsdiqlə", "Rezervasyonu Onayla")}
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              {t("We'll call to confirm within 30 minutes.", "30 dəqiqə ərzində zəng edəcəyik.", "30 dakika içinde onay için arayacağız.")}
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center text-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">
              {t("Booking Received!", "Rezervasiya Alındı!", "Rezervasyon Alındı!")}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t("We'll call you shortly to confirm.", "Tezliklə sizinlə əlaqə saxlayacağıq.", "Onay için kısa süre içinde arayacağız.")}
            </p>
            <div className="bg-gray-50 rounded-xl px-5 py-3 text-sm text-gray-700 font-semibold mb-6 space-y-1 w-full">
              <p>
                {selDate ? fmtDate(selDate) : ""} · {selTime}
              </p>
              {selService && <p className="text-xs text-gray-500">{serviceLabel(selService)}</p>}
              <p className="text-xs text-gray-500">
                {custName} · {custPhone}
              </p>
            </div>
            <button
              type="button"
              onClick={resetAll}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#14b8a6] border border-[#14b8a6]/30 hover:bg-[#f0f3ff] transition-colors"
            >
              {t("New Booking", "Yeni Rezervasiya", "Yeni Rezervasyon")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
