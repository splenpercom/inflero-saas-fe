import React, { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Plane, FileText, CreditCard,
  ShieldCheck, Hotel, BadgeCheck, Calendar, Clock, User,
  Phone, Mail, MapPin, AlertTriangle, CheckCircle, X,
  Star, TrendingUp,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";

// ─── Event types ──────────────────────────────────────────────────────────────

type EventType =
  | "departure"
  | "return"
  | "hotel_checkin"
  | "hotel_checkout"
  | "invoice_due"
  | "passport_expiry"
  | "visa_expiry"
  | "insurance_expiry"
  | "booking";

interface CalEvent {
  id: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientStatus: "vip" | "active" | "inactive";
  title: string;
  detail: string;
  amount?: number;
  destination?: string;
  urgent?: boolean;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const EVENTS: CalEvent[] = [
  // October 2026
  { id: "e1",  type: "departure",       date: "2026-10-01", clientId: "TC001", clientName: "Nigar Babayeva",  clientPhone: "+994514445566", clientStatus: "vip",      title: "Istanbul Departure",         detail: "TK 381 — IST, 09:15. Grand Hyatt Istanbul",   destination: "Istanbul, TR",  urgent: false },
  { id: "e2",  type: "hotel_checkin",   date: "2026-10-01", clientId: "TC002", clientName: "Rauf Quliyev",    clientPhone: "+994703334455", clientStatus: "active",   title: "Cappadocia Check-In",        detail: "Museum Hotel Cappadocia, Cave Suite",          destination: "Nevşehir, TR",  urgent: false },
  { id: "e3",  type: "invoice_due",     date: "2026-10-05", clientId: "TC003", clientName: "Rauf Quliyev",    clientPhone: "+994703334455", clientStatus: "active",   title: "Invoice Due — INV-011",      detail: "Cappadocia Adventure — 3,800 AZN outstanding", amount: 3800, urgent: true },
  { id: "e4",  type: "invoice_due",     date: "2026-10-08", clientId: "TC004", clientName: "Sevinc Əhmədova", clientPhone: "+994506667788", clientStatus: "active",   title: "Invoice Due — INV-012",      detail: "Georgia Mountain Tour — PAID",                 amount: 2600, urgent: false },
  { id: "e5",  type: "hotel_checkout",  date: "2026-10-06", clientId: "TC002", clientName: "Rauf Quliyev",    clientPhone: "+994703334455", clientStatus: "active",   title: "Cappadocia Check-Out",       detail: "Museum Hotel — 5 nights completed",            destination: "Nevşehir, TR",  urgent: false },
  { id: "e6",  type: "return",          date: "2026-10-06", clientId: "TC002", clientName: "Rauf Quliyev",    clientPhone: "+994703334455", clientStatus: "active",   title: "Return Flight — GYD",        detail: "TK 382 — GYD arrival, 17:40",                  destination: "Baku, AZ",      urgent: false },
  { id: "e7",  type: "departure",       date: "2026-10-09", clientId: "TC001", clientName: "Anar Həsənov",    clientPhone: "+994501112233", clientStatus: "vip",      title: "Dubai Departure",            detail: "AZAL 102 — DXB, 22:00. Burj Al Arab",          destination: "Dubai, UAE",    urgent: false },
  { id: "e8",  type: "invoice_due",     date: "2026-10-10", clientId: "TC006", clientName: "Farid Gasimov",   clientPhone: "+994774445566", clientStatus: "active",   title: "Invoice Due — INV-014",      detail: "Antalya All-Inclusive — PAID",                  amount: 9400, urgent: false },
  { id: "e9",  type: "hotel_checkin",   date: "2026-10-09", clientId: "TC001", clientName: "Anar Həsənov",    clientPhone: "+994501112233", clientStatus: "vip",      title: "Burj Al Arab Check-In",      detail: "Diplomatic Suite, 5 nights — Dubai",           destination: "Dubai, UAE",    urgent: false },
  { id: "e10", type: "invoice_due",     date: "2026-10-15", clientId: "TC001", clientName: "Anar Həsənov",    clientPhone: "+994501112233", clientStatus: "vip",      title: "Invoice Due — INV-010",      detail: "Dubai Luxury — 5,540 AZN remaining",           amount: 5540, urgent: true },
  { id: "e11", type: "visa_expiry",     date: "2026-10-20", clientId: "TC005", clientName: "Elçin Nəsirov",   clientPhone: "+994775556677", clientStatus: "inactive", title: "Schengen Visa Expires",      detail: "Passport: AA4567890 — renewal recommended",    urgent: true },
  { id: "e12", type: "return",          date: "2026-10-14", clientId: "TC001", clientName: "Anar Həsənov",    clientPhone: "+994501112233", clientStatus: "vip",      title: "Return from Dubai",          detail: "Emirates EK 086 — GYD, 06:30",                 destination: "Baku, AZ",      urgent: false },
  { id: "e13", type: "invoice_due",     date: "2026-10-20", clientId: "TC003", clientName: "Elçin Nəsirov",   clientPhone: "+994775556677", clientStatus: "inactive", title: "Invoice Due — INV-013",      detail: "Baku City Tour — 700 AZN remaining",           amount: 700,  urgent: false },
  { id: "e14", type: "insurance_expiry",date: "2026-10-31", clientId: "TC001", clientName: "Anar Həsənov",    clientPhone: "+994501112233", clientStatus: "vip",      title: "Insurance Expiring",         detail: "AXA policy #TI-8821 — renew before departure", urgent: true },
  { id: "e15", type: "invoice_due",     date: "2026-10-28", clientId: "TC007", clientName: "Aysel Cafarova",  clientPhone: "+994501112233", clientStatus: "active",   title: "Invoice Due — INV-015",      detail: "Rome & Venice — 3,200 AZN remaining",          amount: 3200, urgent: true },
  { id: "e16", type: "departure",       date: "2026-10-25", clientId: "TC007", clientName: "Aysel Cafarova",  clientPhone: "+994501112233", clientStatus: "active",   title: "Rome Departure",             detail: "ITA AZ 872 — FCO, 08:45",                      destination: "Rome, IT",      urgent: false },
  { id: "e17", type: "hotel_checkin",   date: "2026-10-25", clientId: "TC007", clientName: "Aysel Cafarova",  clientPhone: "+994501112233", clientStatus: "active",   title: "Hotel Eden Rome Check-In",   detail: "Superior Room, 4 nights",                      destination: "Rome, IT",      urgent: false },
  { id: "e18", type: "booking",         date: "2026-10-03", clientId: "TC004", clientName: "Nigar Babayeva",  clientPhone: "+994514445566", clientStatus: "vip",      title: "New Booking Confirmed",      detail: "Maldives Honeymoon Dec 2026 — deposit paid",   destination: "Malé, MV",      urgent: false },
  // November 2026
  { id: "e19", type: "departure",       date: "2026-11-05", clientId: "TC002", clientName: "Leyla Əliyeva",   clientPhone: "+994552223344", clientStatus: "active",   title: "London Departure",           detail: "British Airways BA 182 — LHR",                 destination: "London, UK",    urgent: false },
  { id: "e20", type: "hotel_checkin",   date: "2026-11-05", clientId: "TC002", clientName: "Leyla Əliyeva",   clientPhone: "+994552223344", clientStatus: "active",   title: "The Savoy Check-In",         detail: "Deluxe Room, 6 nights — London",               destination: "London, UK",    urgent: false },
  { id: "e21", type: "invoice_due",     date: "2026-11-10", clientId: "TC002", clientName: "Leyla Əliyeva",   clientPhone: "+994552223344", clientStatus: "active",   title: "Invoice Due — INV-020",      detail: "London Explorer — 4,700 AZN remaining",        amount: 4700, urgent: true },
  { id: "e22", type: "passport_expiry", date: "2026-11-20", clientId: "TC006", clientName: "Sevinc Əhmədova", clientPhone: "+994506667788", clientStatus: "active",   title: "Passport Expiry Warning",    detail: "GE5678901 expires in 35 days — renew now",    urgent: true },
  { id: "e23", type: "return",          date: "2026-11-11", clientId: "TC002", clientName: "Leyla Əliyeva",   clientPhone: "+994552223344", clientStatus: "active",   title: "Return from London",         detail: "BA 183 — GYD arrival, 22:15",                  destination: "Baku, AZ",      urgent: false },
  // September 2026
  { id: "e24", type: "departure",       date: "2026-09-10", clientId: "TC004", clientName: "Nigar Babayeva",  clientPhone: "+994514445566", clientStatus: "vip",      title: "Istanbul Departure",         detail: "TK 381 — IST, Grand Hyatt Istanbul",           destination: "Istanbul, TR",  urgent: false },
  { id: "e25", type: "invoice_due",     date: "2026-09-10", clientId: "TC004", clientName: "Nigar Babayeva",  clientPhone: "+994514445566", clientStatus: "vip",      title: "Invoice Due — INV-006",      detail: "Istanbul Business — 2,000 AZN remaining",      amount: 2000, urgent: true },
  { id: "e26", type: "invoice_due",     date: "2026-09-15", clientId: "TC001", clientName: "Anar Həsənov",    clientPhone: "+994501112233", clientStatus: "vip",      title: "Invoice Due — INV-007",      detail: "Dubai Luxury — FULL 10,540 AZN outstanding",   amount: 10540, urgent: true },
  { id: "e27", type: "return",          date: "2026-09-15", clientId: "TC004", clientName: "Nigar Babayeva",  clientPhone: "+994514445566", clientStatus: "vip",      title: "Return from Istanbul",       detail: "TK 382 — GYD arrival",                         destination: "Baku, AZ",      urgent: false },
  // December 2026
  { id: "e28", type: "departure",       date: "2026-12-10", clientId: "TC004", clientName: "Nigar Babayeva",  clientPhone: "+994514445566", clientStatus: "vip",      title: "Maldives Departure",         detail: "Emirates EK 127 — MLE via Dubai",              destination: "Malé, MV",      urgent: false },
  { id: "e29", type: "hotel_checkin",   date: "2026-12-10", clientId: "TC004", clientName: "Nigar Babayeva",  clientPhone: "+994514445566", clientStatus: "vip",      title: "Soneva Jani Check-In",       detail: "Overwater Villa, 7 nights — North Malé Atoll", destination: "Malé, MV",      urgent: false },
  { id: "e30", type: "insurance_expiry",date: "2026-12-31", clientId: "TC002", clientName: "Leyla Əliyeva",   clientPhone: "+994552223344", clientStatus: "active",   title: "Insurance Expiring",         detail: "Allianz policy — renew for 2027 travel",       urgent: false },
];

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
  const tr = (az: string, en: string) => language === "az" ? az : en;

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(toDateStr(today));
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  // ── Build calendar grid ───────────────────────────────────────────────────
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
    for (const ev of EVENTS) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, []);

  // ── Events for selected date ──────────────────────────────────────────────
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const evs = eventsByDate[selectedDate] ?? [];
    return filterType === "all" ? evs : evs.filter(e => e.type === filterType);
  }, [selectedDate, filterType, eventsByDate]);

  // ── Month overview stats ──────────────────────────────────────────────────
  const monthEvents = useMemo(() => {
    return EVENTS.filter(e => {
      const [y, m] = e.date.split("-").map(Number);
      return y === year && m === month + 1;
    });
  }, [year, month]);

  const urgentThisMonth = monthEvents.filter(e => e.urgent).length;
  const departures = monthEvents.filter(e => e.type === "departure").length;
  const invoicesDue = monthEvents.filter(e => e.type === "invoice_due").length;
  const totalRevenue = monthEvents.filter(e => e.type === "invoice_due" && e.amount).reduce((s, e) => s + (e.amount ?? 0), 0);

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const EVENT_TYPES_FILTER: { id: EventType | "all"; label: string; labelAz: string; dot?: string }[] = [
    { id: "all",           label: "All",          labelAz: "Hamısı",       dot: "bg-gray-400" },
    { id: "departure",     label: "Departures",   labelAz: "Uçuşlar",      dot: "bg-blue-500"   },
    { id: "return",        label: "Returns",      labelAz: "Qayıdışlar",   dot: "bg-indigo-500" },
    { id: "hotel_checkin", label: "Hotel",        labelAz: "Otel",         dot: "bg-emerald-500"},
    { id: "invoice_due",   label: "Invoices",     labelAz: "Fakturalar",   dot: "bg-orange-500" },
    { id: "passport_expiry",label:"Passports",    labelAz: "Pasportlar",   dot: "bg-red-500"    },
    { id: "visa_expiry",   label: "Visas",        labelAz: "Vizalar",      dot: "bg-red-400"    },
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
              { icon: Plane,        val: departures,       label: tr("Uçuş",      "Departures"), color: "text-blue-600 dark:text-[#14b8a6]" },
              { icon: FileText,     val: invoicesDue,      label: tr("Faktura",   "Invoices"),   color: "text-orange-600 dark:text-orange-400" },
              { icon: AlertTriangle,val: urgentThisMonth,  label: tr("Kritik",    "Urgent"),     color: "text-red-600 dark:text-red-400" },
              { icon: TrendingUp,   val: fmtAZN(totalRevenue), label: tr("Dövriyyə","Revenue"), color: "text-emerald-600 dark:text-emerald-400" },
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

            {/* Month nav */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <button onClick={prevMonth} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{monthLabel}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {monthEvents.length} {tr("hadisə", "events")} · {urgentThisMonth} {tr("kritik", "urgent")}
                </p>
              </div>
              <button onClick={nextMonth} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
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
                    {selectedEvents.length === 0
                      ? tr("Bu gün hadisə yoxdur", "No events on this day")
                      : `${selectedEvents.length} ${tr("hadisə", selectedEvents.length === 1 ? "event" : "events")}`}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {EVENT_TYPES_FILTER.map(f => (
                  <button
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
              {!selectedDate && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-300 dark:text-gray-700">
                  <Calendar className="w-12 h-12" />
                  <p className="text-sm text-gray-400 dark:text-gray-600">{tr("Sol tərəfdən tarix seçin", "Select a date from the left calendar")}</p>
                </div>
              )}

              {selectedDate && selectedEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-300 dark:text-gray-700">
                  <CheckCircle className="w-10 h-10" />
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    {filterType === "all"
                      ? tr("Bu gün hadisə yoxdur", "No events on this day")
                      : tr("Bu gün seçilmiş növdə hadisə yoxdur", "No events of selected type on this day")}
                  </p>
                </div>
              )}

              {selectedEvents.map(event => {
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
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{event.clientPhone}</span>
                          </div>
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
                <button onClick={() => setSelectedEvent(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{selectedEvent.clientPhone}</span>
                      </div>
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
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {tr("Bağla", "Close")}
                </button>
                <button
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
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
