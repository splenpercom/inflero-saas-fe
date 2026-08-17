import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { DEFAULT_CONFIG } from "../utils/reservationConfig";
import {
  fetchPublicReservationConfig,
  fetchPublicReservationSlots,
  createPublicReservation,
  type PublicTenantBranding,
  type PublicBranchOption,
  type ReservationConfig,
  type SlotAvailability,
} from "../api/publicReservations";
import type { BookingPageMode } from "../lib/branchBooking";
import { customerBookingPath } from "../lib/bookingLinks";
import { ApiError } from "../api/client";
import type { ServiceTypeOption } from "../lib/serviceTypes";
import {
  type CustomerSiteLang,
  MONTHS,
  DAY_SHORT,
  WEEKDAYS,
  pickText,
  serviceOptionLabel,
  otherServiceFallback,
} from "../lib/customerSiteLang";
import { CustomerSiteLanguageSwitcher } from "./CustomerSiteLanguageSwitcher";
import {
  Car, Clock, Phone, Mail, MapPin, Menu, X,
  ChevronLeft, ChevronRight, Check, Instagram, Facebook, ArrowLeft,
} from "lucide-react";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 14.07l-2.967-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.943.515z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FALLBACK_COMPANY: PublicTenantBranding = {
  name: "Inflero",
  slug: "demo",
  phone: "+994 50 123 45 67",
  companyEmail: "noreply@inflero.com",
  address: "Baku, Azerbaijan",
  website: null,
  companyLogoUrl: null,
  companyDarkLogoUrl: null,
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    telegram: "https://t.me/inflero",
    whatsapp: "https://wa.me/994501234567",
  },
  latitude: 40.4093,
  longitude: 49.8671,
};

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

export function CarServiceCustomerSite({
  tenantSlug,
  branchSlug = null,
}: {
  tenantSlug: string;
  branchSlug?: string | null;
}) {
  const [lang, setLang] = useState<CustomerSiteLang>("az");
  const [company, setCompany] = useState<PublicTenantBranding>(FALLBACK_COMPANY);
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [step, setStep] = useState<Step>("date");
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selDate,  setSelDate]  = useState<Date | null>(null);
  const [selTime,  setSelTime]  = useState("");
  const [selService, setSelService] = useState("");
  const [customService, setCustomService] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone,setCustPhone]= useState("");

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
    return () => { cancelled = true; };
  }, [tenantSlug, branchSlug]);

  const loadSlots = useCallback(async (date: Date) => {
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
  }, [resConfig, tenantSlug, activeBranchSlug]);

  const t = (en: string, az: string, tr: string) => pickText(lang, en, az, tr);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); };

  const isPast = (d: number) => {
    const dt = new Date(calYear, calMonth, d);
    dt.setHours(0,0,0,0);
    const t0 = new Date(); t0.setHours(0,0,0,0);
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

  const fmtDate = (d: Date) =>
    `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;

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
    setStep("date"); setSelDate(null); setSelTime(""); setSelService(""); setCustomService("");
    setCustName(""); setCustPhone("");
    setSubmitError(null); setSlots([]);
  };

  const hourRange = () => {
    const start = `${String(resConfig.startHour).padStart(2, "0")}:${String(resConfig.startMinute).padStart(2, "0")}`;
    const end = `${String(resConfig.endHour).padStart(2, "0")}:${String(resConfig.endMinute).padStart(2, "0")}`;
    return `${start} – ${end}`;
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const NAV = [
    { id: "booking",  label: t("Book", "Rezerv Et", "Rezervasyon") },
    { id: "location", label: t("Location", "Ünvan", "Konum") },
    { id: "contact",  label: t("Contact", "Əlaqə", "İletişim") },
  ];

  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  const STEPS: { key: Step; label: string; labelAz: string; labelTr: string }[] = [
    { key: "date",    label: "Date",    labelAz: "Tarix",    labelTr: "Tarih" },
    { key: "time",    label: "Time",    labelAz: "Saat",     labelTr: "Saat" },
    { key: "service", label: "Service", labelAz: "Xidmət",   labelTr: "Hizmet" },
    { key: "contact", label: "Contact", labelAz: "Əlaqə",    labelTr: "İletişim" },
  ];
  const stepIdx = STEPS.findIndex(s => s.key === step);

  const social = company.socialLinks ?? {};
  const mapLat = company.latitude ?? 40.4093;
  const mapLng = company.longitude ?? 49.8671;
  const landingPath = customerBookingPath(tenantSlug, activeBranchSlug);

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm text-gray-500">
        {t("Loading...", "Yüklənir...", "Yükleniyor...")}
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        {company.companyLogoUrl && (
          <img src={company.companyLogoUrl} alt={company.name} className="h-14 max-w-48 object-contain mb-4" />
        )}
        <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
        <p className="mt-3 text-sm text-gray-500">
          {t("Booking is currently unavailable.", "Rezervasiya hazırda əlçatan deyil.", "Rezervasyon şu anda kullanılamıyor.")}
        </p>
        {company.phone && <a className="mt-4 text-sm font-semibold text-[#0026f6]" href={`tel:${company.phone}`}>{company.phone}</a>}
        <a className="mt-1 text-sm text-gray-500" href={`mailto:${company.companyEmail}`}>{company.companyEmail}</a>
      </div>
    );
  }

  if (bookingMode === "per_branch" && !branchSlug) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0026f6] to-[#001570] text-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Car className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{company.name}</h1>
          <p className="text-white/70 text-sm mt-2">
            {t("Choose a branch to book your service", "Rezervasiya üçün filial seçin", "Rezervasyon için şube seçin")}
          </p>
          <div className="mt-8 space-y-3 text-left">
            {branchOptions.length === 0 ? (
              <p className="text-center text-white/60 text-sm">
                {t("No branch booking pages are available yet.", "Filial rezervasiya səhifələri hələ mövcud deyil.", "Şube rezervasyon sayfaları henüz mevcut değil.")}
              </p>
            ) : (
              branchOptions.map((branch) => (
                <Link
                  key={branch.storeId}
                  to={customerBookingPath(tenantSlug, branch.slug)}
                  className="block bg-white text-gray-900 rounded-xl p-4 hover:shadow-lg transition-shadow"
                >
                  <p className="font-semibold text-[#0026f6]">{branch.name}</p>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0026f6] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {company.companyLogoUrl ? (
                <img src={company.companyLogoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Car className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-[#0026f6]">{company.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{landingPath}</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-[#0026f6] hover:bg-gray-50 rounded-lg transition-colors font-medium">
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CustomerSiteLanguageSwitcher lang={lang} onChange={setLang} />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-2 space-y-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                {n.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <section id="booking" className="bg-gradient-to-b from-[#0026f6] to-[#001570] pt-10 pb-16 sm:pt-14 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4">

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">{company.name}</h1>
            <p className="text-white/60 text-sm mt-2">
              {t("Book your car service appointment in seconds", "Avtomobil servis rezervasiyanızı saniyələr içində edin", "Araç servis randevunuzu saniyeler içinde alın")}
            </p>
            {configError && (
              <p className="text-amber-200 text-xs mt-2">{configError}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 max-w-xl mx-auto overflow-hidden">

            {step !== "done" && (
              <div className="flex border-b border-gray-100">
                {STEPS.map((s, i) => {
                  const done = stepIdx > i;
                  const active = stepIdx === i;
                  return (
                    <button
                      key={s.key}
                      onClick={() => { if (done) setStep(s.key); }}
                      disabled={!done}
                      className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors
                        ${active ? "text-[#0026f6] border-b-2 border-[#0026f6]" : done ? "text-green-600 cursor-pointer" : "text-gray-300"}`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                        ${active ? "bg-[#0026f6] text-white" : done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                        {done ? <Check className="w-3 h-3" /> : i + 1}
                      </span>
                      <span className="hidden sm:block">{pickText(lang, s.label, s.labelAz, s.labelTr ?? s.label)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === "date" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="text-sm font-bold text-gray-900">
                    {MONTHS[lang][calMonth]} {calYear}
                  </span>
                  <button onClick={nextMonth}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-7 mb-2">
                  {DAY_SHORT[lang].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calCells.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const past = isPast(d);
                    const disabled = past || !isWorkingDay(d);
                    const sel  = isSel(d);
                    const tod  = isToday(d);
                    return (
                      <button key={i} onClick={() => selectDate(d)} disabled={disabled}
                        className={`aspect-square w-full rounded-xl text-sm font-medium transition-all flex items-center justify-center
                          ${disabled ? "text-gray-200 cursor-not-allowed"
                          : sel   ? "bg-[#0026f6] text-white shadow-md shadow-[#0026f6]/30 scale-105"
                          : tod   ? "border-2 border-[#0026f6] text-[#0026f6] hover:bg-[#f0f3ff]"
                          :         "text-gray-700 hover:bg-gray-100"}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                  {t("Select a date to continue", "Davam etmək üçün tarix seçin", "Devam etmek için tarih seçin")}
                </p>
                <p className="text-center text-[10px] text-gray-400 mt-1">
                  {t(`Open hours: ${hourRange()} · ${resConfig.slotIntervalMinutes} min slots`, `İş saatları: ${hourRange()} · ${resConfig.slotIntervalMinutes} dəq slotlar`, `Çalışma saatleri: ${hourRange()} · ${resConfig.slotIntervalMinutes} dk slotlar`)}
                </p>
              </div>
            )}

            {step === "time" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setStep("date")}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                    <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <div>
                    <p className="text-xs text-gray-400">{t("Selected date", "Seçilmiş tarix", "Seçilen tarih")}</p>
                    <p className="text-sm font-bold text-gray-900">{selDate ? fmtDate(selDate) : ""}</p>
                  </div>
                </div>

                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{t("Available Times", "Mövcud Saatlar", "Müsait Saatler")}</p>
                <p className="text-[10px] text-gray-400 mb-3">{hourRange()}</p>

                {slotsLoading && (
                  <p className="text-xs text-gray-400 text-center py-6">{t("Loading slots...", "Saatlar yüklənir...", "Saatlar yükleniyor...")}</p>
                )}
                {slotsError && (
                  <p className="text-xs text-red-500 text-center py-4">{slotsError}</p>
                )}
                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">{t("No available slots for this date", "Bu tarix üçün boş saat yoxdur", "Bu tarih için müsait saat yok")}</p>
                )}

                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const full = slot.available <= 0;
                    return (
                    <button
                      key={slot.time}
                      disabled={full}
                      onClick={() => { if (!full) { setSelTime(slot.time); setStep("service"); } }}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all
                        ${full ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : selTime === slot.time
                          ? "bg-[#0026f6] text-white border-[#0026f6] shadow-md shadow-[#0026f6]/20"
                          : "border-gray-200 text-gray-700 hover:border-[#0026f6]/40 hover:text-[#0026f6] hover:bg-[#f0f3ff]"}`}
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
                  <button onClick={() => setStep("time")}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                    <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <div>
                    <p className="text-xs text-gray-400">{t("Appointment", "Görüş", "Randevu")}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selDate ? fmtDate(selDate) : ""} · {selTime}
                    </p>
                  </div>
                </div>

                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{t("Select Service", "Xidmət seçin", "Hizmet seçin")}</p>
                <div className="grid grid-cols-1 gap-2">
                  {serviceTypes.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => selectService(s.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-semibold border text-left transition-all
                        ${selService === s.value
                          ? "bg-[#0026f6] text-white border-[#0026f6]"
                          : "border-gray-200 text-gray-700 hover:border-[#0026f6]/40 hover:bg-[#f0f3ff]"}`}
                    >
                      {serviceOptionLabel(s, lang)}
                    </button>
                  ))}
                </div>

                {isOtherService(selService) && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t("Describe your service", "Xidmətinizi təsvir edin", "Hizmetinizi açıklayın")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customService}
                        onChange={(e) => setCustomService(e.target.value)}
                        placeholder={t("e.g. Wheel alignment, battery replacement", "məs. Təkər balansı, akkumulyator dəyişimi", "örn. Rot ayarı, akü değişimi")}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent placeholder-gray-300"
                      />
                    </div>
                    <button
                      onClick={() => customService.trim() && setStep("contact")}
                      disabled={!customService.trim()}
                      className="w-full py-3 rounded-xl bg-[#0026f6] text-white text-sm font-bold hover:bg-[#001fc4] transition-colors shadow-lg shadow-[#0026f6]/20 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  <button onClick={() => setStep("service")}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
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
                    <input type="text" value={custName} onChange={e => setCustName(e.target.value)} required
                      placeholder={t("Full name", "Ad Soyad", "Ad Soyad")}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent placeholder-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t("Phone Number", "Telefon nömrəsi", "Telefon numarası")} <span className="text-red-500">*</span>
                    </label>
                    <input type="tel" value={custPhone} onChange={e => setCustPhone(e.target.value)} required
                      placeholder="+994 50 000 00 00"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent placeholder-gray-300" />
                  </div>
                </div>

                <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                  <p className="font-semibold text-gray-700 mb-2">{t("Booking Summary", "Rezervasiya Xülasəsi", "Rezervasyon Özeti")}</p>
                  {[
                    { label: t("Date & Time", "Tarix & Saat", "Tarih & Saat"), val: `${selDate ? fmtDate(selDate) : ""} · ${selTime}` },
                    ...(selService ? [{ label: t("Service", "Xidmət", "Hizmet"), val: serviceLabel(selService) }] : []),
                  ].map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-gray-400">{r.label}</span>
                      <span className="font-semibold text-gray-800">{r.val}</span>
                    </div>
                  ))}
                </div>

                {submitError && (
                  <p className="text-xs text-red-500 text-center mt-2">{submitError}</p>
                )}

                <button onClick={handleSubmit} disabled={!custName || !custPhone || submitting}
                  className="w-full mt-4 py-3 rounded-xl bg-[#0026f6] text-white text-sm font-bold hover:bg-[#001fc4] transition-colors shadow-lg shadow-[#0026f6]/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  {submitting ? t("Submitting...", "Göndərilir...", "Gönderiliyor...") : t("Confirm Booking", "Rezervasiyanı Təsdiqlə", "Rezervasyonu Onayla")}
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
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">{t("Booking Received!", "Rezervasiya Alındı!", "Rezervasyon Alındı!")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("We'll call you shortly to confirm.", "Tezliklə sizinlə əlaqə saxlayacağıq.", "Onay için kısa süre içinde arayacağız.")}</p>
                <div className="bg-gray-50 rounded-xl px-5 py-3 text-sm text-gray-700 font-semibold mb-6 space-y-1 w-full">
                  <p>{selDate ? fmtDate(selDate) : ""} · {selTime}</p>
                  {selService && <p className="text-xs text-gray-500">{serviceLabel(selService)}</p>}
                  <p className="text-xs text-gray-500">{custName} · {custPhone}</p>
                </div>
                <button onClick={resetAll}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#0026f6] border border-[#0026f6]/30 hover:bg-[#f0f3ff] transition-colors">
                  {t("New Booking", "Yeni Rezervasiya", "Yeni Rezervasyon")}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-white/50 text-xs mt-5">
            {t("Prefer to call?", "Zəng etmək istəyirsiniz?", "Aramayı mı tercih edersiniz?")}
            {" "}
            <a href={`tel:${company.phone ?? ""}`} className="text-white/80 font-semibold hover:text-white underline underline-offset-2">
              {company.phone ?? "—"}
            </a>
          </p>
        </div>
      </section>

      <section id="location" className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">

          <h2 className="text-xl font-bold text-gray-900 mb-8" id="contact">{t("Find & Contact Us", "Bizi Tapın & Əlaqə", "Bizi Bulun & İletişim")}</h2>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-72 sm:h-80 lg:h-auto">
              <iframe
                title="Location"
                src={`https://www.google.com/maps?q=${mapLat},${mapLng}&z=15&output=embed`}
                width="100%" height="100%"
                style={{ border: 0, minHeight: 280 }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4">

              <div className="space-y-2">
                <a href={`tel:${company.phone ?? ""}`}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#0026f6]/20 hover:bg-[#f8f9ff] transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-[#0026f6]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0026f6] transition-colors">
                    <Phone className="w-4 h-4 text-[#0026f6] group-hover:text-white transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t("Phone", "Telefon", "Telefon")}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{company.phone ?? "—"}</p>
                  </div>
                </a>

                <a href={`mailto:${company.companyEmail}`}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#0026f6]/20 hover:bg-[#f8f9ff] transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-[#0026f6]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0026f6] transition-colors">
                    <Mail className="w-4 h-4 text-[#0026f6] group-hover:text-white transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t("Email", "E-poçt", "E-posta")}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{company.companyEmail}</p>
                  </div>
                </a>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-[#0026f6]/8 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-[#0026f6]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t("Address", "Ünvan", "Adres")}</p>
                    <p className="text-sm font-semibold text-gray-900">{company.address ?? "—"}</p>
                    {company.address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(company.address)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-[#0026f6] hover:underline mt-0.5 inline-block">
                      {t("Get directions →", "Marşrut al →", "Yol tarifi al →")}
                    </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <Clock className="w-3.5 h-3.5 text-[#0026f6]" />
                  <span className="text-xs font-bold text-gray-700">{t("Working Hours", "İş Saatları", "Çalışma Saatleri")}</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-green-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {t("Open", "Açıq", "Açık")}
                  </span>
                </div>
                {WEEKDAYS.en.map((day, i) => {
                  const dayNum = [1, 2, 3, 4, 5, 6, 0][i];
                  const isOpen = resConfig.workingDays.includes(dayNum);
                  const startStr = `${String(resConfig.startHour).padStart(2, "0")}:${String(resConfig.startMinute).padStart(2, "0")}`;
                  const endStr = `${String(resConfig.endHour).padStart(2, "0")}:${String(resConfig.endMinute).padStart(2, "0")}`;
                  return (
                    <div key={day} className="flex justify-between items-center px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-600">{WEEKDAYS[lang][i]}</span>
                      <span className={`text-xs font-bold ${isOpen ? "text-[#0026f6]" : "text-gray-300"}`}>
                        {isOpen ? `${startStr} – ${endStr}` : t("Closed", "Qapalı", "Kapalı")}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">{t("Follow Us", "Bizi izləyin", "Bizi takip edin")}</p>
                <div className="flex gap-2">
                  {[
                    { icon: Instagram,   href: social.instagram, color: "hover:bg-pink-500",    label: "Instagram" },
                    { icon: Facebook,    href: social.facebook,  color: "hover:bg-blue-600",    label: "Facebook" },
                    { icon: TelegramIcon,href: social.telegram,  color: "hover:bg-sky-500",     label: "Telegram" },
                    { icon: WhatsAppIcon,href: social.whatsapp,  color: "hover:bg-green-500",   label: "WhatsApp" },
                  ].filter((x) => x.href).map(({ icon: Icon, href, color, label }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
                      className={`w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 ${color} hover:text-white hover:border-transparent transition-all`}>
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0026f6] py-7">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-white">{company.name}</p>
              <p className="text-[10px] text-white/40">{landingPath}</p>
            </div>
          </div>
          <p className="text-[10px] text-white/30">
            {t("Powered by", "Gücləndirilmiş", "Destekleyen")} <span className="font-semibold text-white/50">Inflero</span> · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
