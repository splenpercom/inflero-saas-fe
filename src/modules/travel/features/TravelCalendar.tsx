import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Plane, FileText, CreditCard,
  ShieldCheck, Hotel, BadgeCheck, Calendar, Clock,
  Phone, MapPin, AlertTriangle, CheckCircle, X,
  Star, TrendingUp, ExternalLink, Loader2,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { useAuth } from "../../../app/context/AuthContext";
import {
  fetchOfferCalendar,
  type OfferCalendarEvent,
  type OfferCalendarEventType,
} from "../../../app/api/offers";
import { notifyFromError } from "../../../app/lib/toast";
import { MonthYearNav, dateToMonthStr, monthStrToDate } from "../ui/MonthYearNav";

// ─── Event types ──────────────────────────────────────────────────────────────

type EventType = OfferCalendarEventType;
type CalEvent = OfferCalendarEvent;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<EventType, {
  label: string; labelAz: string;
  icon: React.ElementType; dotColor: string; cardColor: string; iconBg: string;
}> = {
  departure:       { label: "Departure",       labelAz: "Uçuş",            icon: Plane,         dotColor: "bg-blue-500",    cardColor: "border-blue-200 dark:border-[#14b8a6]/40",    iconBg: "bg-blue-100 dark:bg-[#0f766e]/40 text-blue-600 dark:text-[#14b8a6]"   },
  return:          { label: "Return",           labelAz: "Qayıdış",         icon: Plane,         dotColor: "bg-indigo-500",  cardColor: "border-indigo-200 dark:border-indigo-800", iconBg: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" },
  hotel_checkin:   { label: "Hotel Check-In",   labelAz: "Hotel Giriş",     icon: Hotel,         dotColor: "bg-emerald-500", cardColor: "border-emerald-200 dark:border-emerald-800", iconBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
  hotel_checkout:  { label: "Hotel Check-Out",  labelAz: "Hotel Çıxış",     icon: Hotel,         dotColor: "bg-teal-500",    cardColor: "border-teal-200 dark:border-teal-800",    iconBg: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400"   },
  invoice_due:     { label: "Invoice Due",       labelAz: "Faktura Son Tarix",icon: FileText,     dotColor: "bg-orange-500",  cardColor: "border-orange-200 dark:border-orange-800", iconBg: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" },
  passport_expiry: { label: "Passport Expiry",   labelAz: "Pasport Bitmə",   icon: CreditCard,    dotColor: "bg-red-500",     cardColor: "border-red-200 dark:border-red-800",      iconBg: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"       },
  visa_expiry:     { label: "Visa Expiry",        labelAz: "Viza Bitmə",      icon: ShieldCheck,   dotColor: "bg-red-400",     cardColor: "border-red-200 dark:border-red-800",      iconBg: "bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400"       },
  insurance_expiry:{ label: "Insurance Expiry",   labelAz: "Sığorta Bitmə",   icon: BadgeCheck,    dotColor: "bg-amber-500",   cardColor: "border-amber-200 dark:border-amber-800",  iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
  booking:         { label: "Booking",            labelAz: "Rezervasiya",      icon: Calendar,      dotColor: "bg-purple-500",  cardColor: "border-purple-200 dark:border-purple-800", iconBg: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400" },
};

const CLIENT_STATUS_BADGE: Record<string, string> = {
  vip:      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  active:   "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  inactive: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthRange(view: Date): { from: string; to: string } {
  const y = view.getFullYear();
  const m = view.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return {
    from: `${y}-${String(m + 1).padStart(2, "0")}-01`,
    to: `${y}-${String(m + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`,
  };
}

function formatDisplayDate(d: string) {
  if (!d) return "—";
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

function fmtAZN(n: number) { return n.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " AZN"; }

// ─── Component ────────────────────────────────────────────────────────────────

export function TravelCalendar() {
  const { language } = useLanguage();
  const { isAuthenticated, isDemo } = useAuth();
  const tr = (az: string, en: string) => language === "az" ? az : en;

  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(toDateStr(today));
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  useEffect(() => {
    let cancelled = false;
    if (!(isAuthenticated || isDemo)) {
      setEvents([]);
      setLoading(false);
      return;
    }
    const { from, to } = monthRange(viewDate);
    setLoading(true);
    fetchOfferCalendar({ from, to })
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setEvents([]);
          notifyFromError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewDate, isAuthenticated, isDemo]);

  // ── Build calendar grid ───────────────────────────────────────────────────
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Mon-first

  const calDays: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calDays.length % 7 !== 0) calDays.push(null);

  // ── Events indexed by date ────────────────────────────────────────────────
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  // ── Events for selected date ──────────────────────────────────────────────
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const evs = eventsByDate[selectedDate] ?? [];
    return filterType === "all" ? evs : evs.filter(e => e.type === filterType);
  }, [selectedDate, filterType, eventsByDate]);

  // ── Month overview stats ──────────────────────────────────────────────────
  const monthEvents = events;
  const urgentThisMonth = monthEvents.filter(e => e.urgent).length;
  const departures = monthEvents.filter(e => e.type === "departure").length;
  const invoicesDue = monthEvents.filter(e => e.type === "invoice_due").length;
  const totalRevenue = monthEvents.filter(e => e.type === "invoice_due" && e.amount).reduce((s, e) => s + (e.amount ?? 0), 0);


  const EVENT_TYPES_FILTER: { id: EventType | "all"; label: string; labelAz: string; dot?: string }[] = [
    { id: "all",           label: "All",          labelAz: "Hamısı",       dot: "bg-gray-400" },
    { id: "departure",     label: "Departures",   labelAz: "Uçuşlar",      dot: "bg-blue-500"   },
    { id: "return",        label: "Returns",      labelAz: "Qayıdışlar",   dot: "bg-indigo-500" },
    { id: "hotel_checkin", label: "Hotel",        labelAz: "Otel",         dot: "bg-emerald-500"},
    { id: "invoice_due",   label: "Invoices",     labelAz: "Fakturalar",   dot: "bg-orange-500" },
    { id: "passport_expiry",label:"Passports",    labelAz: "Pasportlar",   dot: "bg-red-500"    },
    { id: "visa_expiry",   label: "Visas",        labelAz: "Vizalar",      dot: "bg-red-400"    },
    { id: "booking",       label: "Bookings",     labelAz: "Rezervasiya",  dot: "bg-purple-500" },
  ];

  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DOW_AZ = ["Baz", "Çər", "Çrş", "Cüm", "Cmt", "Şnb", "Baz"];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="h-full flex flex-col">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="px-4 sm:px-6 xl:px-8 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg xl:text-xl font-semibold text-gray-900 dark:text-white">
              {tr("Səyahət Təqvimi", "Travel Calendar")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tr("Müştəri səyahətlərini, faktura son tarixlərini və sənəd bitmə tarixlərini izləyin", "Track client trips, invoice due dates, and document expiries")}
            </p>
          </div>

          {/* Month stats strip */}
          <div className="hidden sm:flex items-center gap-3">
            {[
              { icon: Plane,        val: loading ? "…" : departures,       label: tr("Uçuş",      "Departures"), color: "text-blue-600 dark:text-[#14b8a6]" },
              { icon: FileText,     val: loading ? "…" : invoicesDue,      label: tr("Faktura",   "Invoices"),   color: "text-orange-600 dark:text-orange-400" },
              { icon: AlertTriangle,val: loading ? "…" : urgentThisMonth,  label: tr("Kritik",    "Urgent"),     color: "text-red-600 dark:text-red-400" },
              { icon: TrendingUp,   val: loading ? "…" : fmtAZN(totalRevenue), label: tr("Dövriyyə","Revenue"), color: "text-emerald-600 dark:text-emerald-400" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-center min-w-[80px]">
                  <div className={`flex items-center justify-center gap-1 text-sm font-bold ${s.color}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{s.val}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main body: calendar left + detail right ───────────────────── */}
        <div className="flex-1 min-h-0 flex gap-4 px-4 sm:px-6 xl:px-8 pb-4 overflow-hidden">

          {/* ── LEFT: Calendar ──────────────────────────────────────────── */}
          <div className="w-80 xl:w-96 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex-shrink-0">

            {/* Month / year nav */}
            <div className="flex flex-col items-center gap-1.5 px-3 py-3 border-b border-gray-200 dark:border-gray-800">
              <MonthYearNav
                value={dateToMonthStr(viewDate)}
                onChange={(ym) => setViewDate(monthStrToDate(ym))}
                language={language}
              />
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {loading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {tr("Yüklənir…", "Loading…")}
                  </span>
                ) : (
                  <>
                    {monthEvents.length} {tr("hadisə", "events")} · {urgentThisMonth} {tr("kritik", "urgent")}
                  </>
                )}
              </p>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
              {(language === "az" ? DOW_AZ : DOW).map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto">
              {calDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-14 border-b border-r border-gray-100 dark:border-gray-800" />;
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = eventsByDate[dateStr] ?? [];
                const isToday = dateStr === toDateStr(today);
                const isSelected = dateStr === selectedDate;
                const hasUrgent = dayEvents.some(e => e.urgent);
                const isWeekend = [5, 6].includes(idx % 7); // Sat, Sun

                const types = [...new Set(dayEvents.map(e => e.type))];

                return (
                  <button
                    type="button"
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative h-14 flex flex-col items-center pt-1.5 pb-1 border-b border-r border-gray-100 dark:border-gray-800 transition-colors group ${
                      isSelected
                        ? "bg-[#14b8a6] dark:bg-[#0f766e]"
                        : isToday
                          ? "bg-blue-50 dark:bg-blue-950/50"
                          : isWeekend
                            ? "bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    {/* Day number */}
                    <span className={`text-xs font-medium leading-none ${
                      isSelected
                        ? "text-white"
                        : isToday
                          ? "text-[#14b8a6] dark:text-[#14b8a6] font-bold"
                          : isWeekend
                            ? "text-gray-400 dark:text-gray-500"
                            : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {day}
                    </span>

                    {/* Today underline */}
                    {isToday && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#14b8a6] dark:bg-blue-400" />
                    )}

                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-1 max-w-[40px]">
                        {types.slice(0, 4).map(t => (
                          <div
                            key={t}
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isSelected ? "opacity-80" : ""
                            } ${EVENT_CONFIG[t]?.dotColor ?? "bg-gray-400"}`}
                          />
                        ))}
                        {types.length > 4 && (
                          <div className={`text-[8px] font-bold leading-none mt-0.5 ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                            +{types.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Urgent indicator */}
                    {hasUrgent && !isSelected && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-3">
              <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{tr("Rəng izahı", "Legend")}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(EVENT_CONFIG).slice(0, 6).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {language === "az" ? cfg.labelAz : cfg.label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{tr("Kritik", "Urgent")} ⚠</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Day detail ────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

            {/* Date header + filter */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
              <div>
                {selectedDate ? (
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDisplayDate(selectedDate)}
                  </h2>
                ) : (
                  <h2 className="text-sm font-semibold text-gray-500">{tr("Tarix seçin", "Select a date")}</h2>
                )}
                {selectedDate && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {loading
                      ? tr("Yüklənir…", "Loading…")
                      : selectedEvents.length === 0
                        ? tr("Bu gün hadisə yoxdur", "No events on this day")
                        : `${selectedEvents.length} ${tr("hadisə", selectedEvents.length === 1 ? "event" : "events")}`}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {EVENT_TYPES_FILTER.map(f => (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                      filterType === f.id
                        ? "bg-[#14b8a6] text-white"
                        : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {f.dot && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.dot}`} />}
                    {language === "az" ? f.labelAz : f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Events list */}
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {loading && (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#14b8a6]" />
                  <p className="text-sm">{tr("Hadisələr yüklənir…", "Loading events…")}</p>
                </div>
              )}

              {!loading && !selectedDate && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-300 dark:text-gray-700">
                  <Calendar className="w-12 h-12" />
                  <p className="text-sm text-gray-400 dark:text-gray-600">{tr("Sol tərəfdən tarix seçin", "Select a date from the left calendar")}</p>
                </div>
              )}

              {!loading && selectedDate && selectedEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-300 dark:text-gray-700">
                  <CheckCircle className="w-10 h-10" />
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    {filterType === "all"
                      ? tr("Bu gün hadisə yoxdur", "No events on this day")
                      : tr("Bu gün seçilmiş növdə hadisə yoxdur", "No events of selected type on this day")}
                  </p>
                </div>
              )}

              {!loading && selectedEvents.map(event => {
                const cfg = EVENT_CONFIG[event.type];
                const EventIcon = cfg.icon;
                const isUrgent = event.urgent;

                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`bg-white dark:bg-gray-900 border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all group ${
                      isUrgent
                        ? "border-red-200 dark:border-red-800 hover:border-red-300"
                        : `${cfg.cardColor} hover:border-gray-300 dark:hover:border-gray-600`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Event type icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                        <EventIcon className="w-4 h-4" />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{event.title}</span>
                            {isUrgent && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {tr("KRİTİK", "URGENT")}
                              </span>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${CLIENT_STATUS_BADGE[event.clientStatus]}`}>
                            {event.clientStatus === "vip" && <Star className="w-2.5 h-2.5 mr-0.5" />}
                            {event.clientStatus.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">{event.detail}</p>

                        {/* Client row */}
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] text-gray-700 dark:text-gray-200 font-bold">
                                {event.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{event.clientName}</span>
                            {event.displayCode && (
                              <span className="text-[10px] text-[#14b8a6] font-medium">{event.displayCode}</span>
                            )}
                          </div>
                          {event.clientPhone && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{event.clientPhone}</span>
                            </div>
                          )}
                          {event.destination && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>{event.destination}</span>
                            </div>
                          )}
                          {event.amount !== undefined && (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400 ml-auto">
                              <FileText className="w-3 h-3" />
                              <span>{fmtAZN(event.amount)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-1 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Event detail modal ─────────────────────────────────────────────── */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const cfg = EVENT_CONFIG[selectedEvent.type];
                    const Icon = cfg.icon;
                    return (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedEvent.title}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{language === "az" ? EVENT_CONFIG[selectedEvent.type].labelAz : EVENT_CONFIG[selectedEvent.type].label}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedEvent(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Date */}
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 dark:text-gray-400 w-20">{tr("Tarix", "Date")}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatDisplayDate(selectedEvent.date)}</span>
                </div>

                {selectedEvent.displayCode && (
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 dark:text-gray-400 w-20">{tr("Təklif", "Offer")}</span>
                    <span className="font-semibold text-[#14b8a6]">{selectedEvent.displayCode}</span>
                  </div>
                )}

                {/* Client */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{tr("Müştəri", "Client")}</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-700 dark:text-gray-200 text-xs font-bold">
                        {selectedEvent.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedEvent.clientName}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${CLIENT_STATUS_BADGE[selectedEvent.clientStatus]}`}>
                          {selectedEvent.clientStatus.toUpperCase()}
                        </span>
                      </div>
                      {selectedEvent.clientPhone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">{selectedEvent.clientPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500 dark:text-gray-400 w-20">{tr("Detallar", "Details")}</span>
                    <span className="text-gray-700 dark:text-gray-300 flex-1">{selectedEvent.detail}</span>
                  </div>
                  {selectedEvent.destination && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400 w-20">{tr("Təyinat", "Destination")}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedEvent.destination}</span>
                    </div>
                  )}
                  {selectedEvent.amount !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400 w-20">{tr("Məbləğ", "Amount")}</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{fmtAZN(selectedEvent.amount)}</span>
                    </div>
                  )}
                  {selectedEvent.urgent && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="text-xs text-red-700 dark:text-red-400 font-medium">
                        {tr("Bu hadisə kritik diqqət tələb edir", "This event requires urgent attention")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 px-4 pb-4">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {tr("Bağla", "Close")}
                </button>
                {selectedEvent.publicToken && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(`/offer-view/${selectedEvent.publicToken}`, "_blank");
                    }}
                    className="flex-1 py-2 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0f766e] rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {tr("Təklifə bax", "View offer")}
                  </button>
                )}
                {selectedEvent.clientPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      const phone = selectedEvent.clientPhone.replace(/\D/g, "");
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Dear ${selectedEvent.clientName}, reminder about: ${selectedEvent.title}. ${selectedEvent.detail}. Please contact us if you have any questions. Inflero Travel.`)}`, "_blank");
                    }}
                    className="flex-1 py-2 text-xs font-medium text-white bg-[#25D366] hover:bg-[#1db954] rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.527 5.851L.057 23.882l6.198-1.459A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.678.865.93-3.584-.234-.368A9.818 9.818 0 1 1 12 21.818z" />
                    </svg>
                    WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
