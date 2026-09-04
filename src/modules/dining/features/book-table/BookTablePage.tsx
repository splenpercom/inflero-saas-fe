import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Users,
  Minus,
  Plus,
  MapPin,
  Phone,
  Mail,
  Wifi,
  Copy,
  Eye,
  EyeOff,
  UtensilsCrossed,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  createPublicDiningBooking,
  fetchPublicDiningBookingConfig,
} from "../../../../app/api/publicDining";
import { ApiError } from "../../../../app/api/client";

const inp = (err?: string) =>
  `w-full px-4 py-3.5 text-base border rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
    err ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-[#14b8a6]"
  }`;

type TableOpt = {
  id: string;
  number: number;
  name: string;
  seats: number;
  area: string | null;
  status: string;
};

type Settings = {
  openTime: string;
  closeTime: string;
  timeSlotDuration: number;
  maxGuestsPerBooking: number;
  advanceBookingDays: number;
  minNoticeHours: number;
  weekdaysOpen: boolean[];
};

type RestaurantInfo = {
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
};

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return ymdLocal(dt);
}

function weekdayIndex(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sun local
}

function isWeekdayOpen(ymd: string, weekdaysOpen: boolean[] | undefined): boolean {
  const days = weekdaysOpen?.length === 7 ? weekdaysOpen : [true, true, true, true, true, true, true];
  return days[weekdayIndex(ymd)] !== false;
}

function slotMeetsNotice(ymd: string, time: string, minNoticeHours: number): boolean {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const scheduled = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0).getTime();
  return scheduled >= Date.now() + Math.max(0, minNoticeHours) * 60 * 60 * 1000;
}

function buildSlots(settings: Settings): string[] {
  const [oh, om] = settings.openTime.split(":").map(Number);
  const [ch, cm] = settings.closeTime.split(":").map(Number);
  const start = oh * 60 + om;
  const end = ch * 60 + cm;
  const step = settings.timeSlotDuration || 30;
  const out: string[] = [];
  for (let m = start; m < end; m += step) {
    out.push(
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
    );
  }
  return out;
}

function EmptySetupNotice({
  title,
  body,
  phone,
}: {
  title: string;
  body: string;
  phone?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center space-y-2">
      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto">
        <UtensilsCrossed className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">{body}</p>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f766e] mt-1"
        >
          <Phone className="w-3.5 h-3.5" />
          {phone}
        </a>
      )}
    </div>
  );
}

function BookingForm({
  tenantSlug,
  branchCode,
  initialTableId,
  tables,
  settings,
  info,
}: {
  tenantSlug: string;
  branchCode?: string;
  initialTableId?: string;
  tables: TableOpt[];
  settings: Settings;
  info: RestaurantInfo;
}) {
  const [selectedTableId, setSelectedTableId] = useState(initialTableId ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form & { table: string }>>({});

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const availableTables = tables.filter((t) => t.status !== "OCCUPIED");
  const noTablesConfigured = tables.length === 0;
  const noTablesAvailable = tables.length > 0 && availableTables.length === 0;
  const today = ymdLocal(new Date());
  const maxDate = addDaysYmd(today, Math.max(0, settings.advanceBookingDays ?? 30));
  const allSlots = useMemo(() => buildSlots(settings), [settings]);
  const dayOpen = form.date ? isWeekdayOpen(form.date, settings.weekdaysOpen) : true;
  const slots = useMemo(() => {
    if (!form.date || !dayOpen) return [];
    return allSlots.filter((t) => slotMeetsNotice(form.date, t, settings.minNoticeHours ?? 0));
  }, [allSlots, form.date, dayOpen, settings.minNoticeHours]);

  useEffect(() => {
    if (form.time && form.date && !slots.includes(form.time)) {
      setForm((f) => ({ ...f, time: "" }));
    }
  }, [form.date, form.time, slots]);

  const validate = () => {
    const e: Partial<typeof form & { table: string }> = {};
    if (!selectedTableId) e.table = "Please select a table";
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.date) e.date = "Required";
    else if (!isWeekdayOpen(form.date, settings.weekdaysOpen)) {
      e.date = "Restaurant is closed on this day";
    } else if (form.date < today || form.date > maxDate) {
      e.date = `Choose a date within the next ${settings.advanceBookingDays} day(s)`;
    }
    if (!form.time) e.time = "Required";
    else if (!slotMeetsNotice(form.date, form.time, settings.minNoticeHours ?? 0)) {
      e.time = `Bookings require at least ${settings.minNoticeHours} hour(s) notice`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (noTablesConfigured || noTablesAvailable) {
      toast.error(
        noTablesConfigured
          ? "Online booking isn’t set up yet. Please call the restaurant."
          : "No tables are available right now.",
      );
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createPublicDiningBooking(tenantSlug, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        guests: form.guests,
        notes: form.notes.trim() || null,
        tableId: selectedTableId,
        ...(branchCode ? { branch: branchCode } : {}),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center px-4 py-10">
        <div className="w-20 h-20 rounded-full bg-[#ccfbf1] flex items-center justify-center mb-5">
          <Check className="w-10 h-10 text-[#0f766e]" />
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-2">Booking Submitted!</p>
        <p className="text-base text-gray-600 mb-1">
          {selectedTable?.name ?? `Table ${selectedTableId}`}
        </p>
        <p className="text-sm text-gray-500 mb-1">
          {form.date} at {form.time}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {form.guests} guest{form.guests !== 1 ? "s" : ""} · {form.name}
        </p>
        <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 mb-8">
          <p className="text-sm text-amber-700">
            We&apos;ll confirm your reservation shortly. Check your phone for updates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", phone: "", date: "", time: "", guests: 2, notes: "" });
            setSelectedTableId(initialTableId ?? "");
          }}
          style={{ touchAction: "manipulation", minHeight: "54px" }}
          className="w-full rounded-2xl bg-[#14b8a6] active:bg-[#0d9488] text-white text-base font-bold transition-colors"
        >
          Book Another Table
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#14b8a6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            1
          </span>
          <p className="text-sm font-bold text-gray-900">
            Choose a Table <span className="text-red-500">*</span>
          </p>
        </div>

        {noTablesConfigured ? (
          <EmptySetupNotice
            title="No tables set up yet"
            body="This restaurant hasn’t published tables for online booking. Please call them to reserve, or try again later."
            phone={info.phone}
          />
        ) : noTablesAvailable ? (
          <EmptySetupNotice
            title="No tables available right now"
            body="All tables are currently occupied. Please call us to check availability or try a different time."
            phone={info.phone}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {availableTables.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTableId(t.id);
                  setForm((f) => ({
                    ...f,
                    guests: Math.min(t.seats, Math.max(f.guests, 1)),
                  }));
                }}
                style={{ touchAction: "manipulation", minHeight: "72px" }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                  selectedTableId === t.id
                    ? "border-[#14b8a6] bg-[#ccfbf1] shadow-sm"
                    : "border-gray-200 bg-white active:border-gray-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selectedTableId === t.id
                      ? "bg-[#14b8a6] text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <span className="text-base font-bold">{t.number}</span>
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold leading-tight ${
                      selectedTableId === t.id ? "text-[#0f766e]" : "text-gray-800"
                    }`}
                  >
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" /> {t.seats} seats
                    {t.area ? ` · ${t.area}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {errors.table && <p className="text-sm text-red-500 mt-2">{errors.table}</p>}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#14b8a6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            2
          </span>
          <p className="text-sm font-bold text-gray-900">Your Details</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              autoComplete="name"
              className={inp(errors.name)}
              style={{ fontSize: "16px" }}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+994 50 000 0000"
              type="tel"
              autoComplete="tel"
              className={inp(errors.phone)}
              style={{ fontSize: "16px" }}
            />
            {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#14b8a6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            3
          </span>
          <p className="text-sm font-bold text-gray-900">Date, Time & Guests</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={today}
              max={maxDate}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, time: "" }))}
              className={inp(errors.date)}
              style={{ fontSize: "16px" }}
            />
            {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
            {form.date && !dayOpen && (
              <p className="text-sm text-amber-600 mt-1">Restaurant is closed on this day.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Time <span className="text-red-500">*</span>
            </label>
            {!form.date ? (
              <p className="text-xs text-gray-400">Select a date to see available times.</p>
            ) : !dayOpen ? (
              <EmptySetupNotice
                title="Closed this day"
                body="The restaurant does not take bookings on this weekday. Please pick another date."
                phone={info.phone}
              />
            ) : slots.length === 0 ? (
              <EmptySetupNotice
                title="No time slots available"
                body={
                  allSlots.length === 0
                    ? "Booking hours aren’t configured yet. Please call the restaurant to reserve."
                    : `No slots left for this date (open ${settings.openTime}–${settings.closeTime}, ${settings.minNoticeHours}h notice required).`
                }
                phone={info.phone}
              />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, time: t }))}
                    style={{ touchAction: "manipulation", minHeight: "44px" }}
                    className={`rounded-xl text-sm font-semibold border-2 transition-all ${
                      form.time === t
                        ? "border-[#14b8a6] bg-[#ccfbf1] text-[#0f766e]"
                        : "border-gray-200 bg-white text-gray-700 active:border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Guests
              {selectedTable && (
                <span className="text-gray-400 font-normal"> (max {selectedTable.seats})</span>
              )}
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, guests: Math.max(1, f.guests - 1) }))}
                style={{ touchAction: "manipulation", minWidth: "48px", minHeight: "48px" }}
                className="rounded-2xl border-2 border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-50 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-bold text-gray-900 w-12 text-center">{form.guests}</span>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    guests: Math.min(
                      selectedTable?.seats ?? settings.maxGuestsPerBooking ?? 12,
                      f.guests + 1,
                    ),
                  }))
                }
                style={{ touchAction: "manipulation", minWidth: "48px", minHeight: "48px" }}
                className="rounded-2xl border-2 border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400">people</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Allergies, special requests, celebrations…"
              className={`${inp()} resize-none`}
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting || noTablesConfigured || noTablesAvailable || slots.length === 0}
        style={{ touchAction: "manipulation", minHeight: "56px" }}
        className="w-full rounded-2xl bg-[#14b8a6] active:bg-[#0d9488] text-white font-bold text-base transition-colors shadow-md shadow-teal-200/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
      >
        <CalendarDays className="w-5 h-5" />
        {submitting ? "Sending…" : "Confirm Booking"}
      </button>
    </div>
  );
}

function InfoFooter({ info, settings }: { info: RestaurantInfo; settings: Settings }) {
  const [copied, setCopied] = useState<"ssid" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const hasContact = Boolean(info.address || info.phone || info.email || info.wifiSsid);
  const wifiPassword = info.wifiPassword?.trim() || null;

  const copy = (text: string, kind: "ssid" | "password") => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (!hasContact) {
    return (
      <div className="mx-4 mt-4 mb-8 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-5 text-center">
        <p className="text-sm font-semibold text-gray-700 mb-1">Restaurant info not published yet</p>
        <p className="text-xs text-gray-500">
          Address, phone, and Wi‑Fi details will appear here once the restaurant adds them.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 mb-8 rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-700">Restaurant Info</p>
      </div>
      <div className="px-4 py-3 space-y-3">
        {info.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(info.address)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3"
            style={{ minHeight: "40px", touchAction: "manipulation" }}
          >
            <MapPin className="w-4 h-4 text-[#14b8a6] mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600 leading-relaxed">{info.address}</span>
          </a>
        )}
        {info.phone && (
          <a
            href={`tel:${info.phone}`}
            className="flex items-center gap-3"
            style={{ minHeight: "40px", touchAction: "manipulation" }}
          >
            <Phone className="w-4 h-4 text-[#14b8a6] flex-shrink-0" />
            <span className="text-sm text-gray-600">{info.phone}</span>
          </a>
        )}
        {info.email && (
          <a
            href={`mailto:${info.email}`}
            className="flex items-center gap-3"
            style={{ minHeight: "40px", touchAction: "manipulation" }}
          >
            <Mail className="w-4 h-4 text-[#14b8a6] flex-shrink-0" />
            <span className="text-sm text-gray-600">{info.email}</span>
          </a>
        )}
        <div className="flex items-start gap-3" style={{ minHeight: "40px" }}>
          <Clock className="w-4 h-4 text-[#14b8a6] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-600">
              Open {settings.openTime} – {settings.closeTime}
            </p>
          </div>
        </div>
        {info.wifiSsid && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Free WiFi</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Network</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate">{info.wifiSsid}</p>
                <button
                  type="button"
                  onClick={() => copy(info.wifiSsid!, "ssid")}
                  style={{ touchAction: "manipulation" }}
                  className="flex-shrink-0 p-1"
                  aria-label="Copy network name"
                >
                  {copied === "ssid" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            {wifiPassword && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Password</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate font-mono tracking-wide">
                    {showPassword
                      ? wifiPassword
                      : "•".repeat(Math.min(Math.max(wifiPassword.length, 8), 24))}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ touchAction: "manipulation" }}
                    className="flex-shrink-0 p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(wifiPassword, "password")}
                    style={{ touchAction: "manipulation" }}
                    className="flex-shrink-0 p-1"
                    aria-label="Copy password"
                  >
                    {copied === "password" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BookTablePage() {
  const { tenantSlug, tableId } = useParams<{ tenantSlug: string; tableId?: string }>();
  const [searchParams] = useSearchParams();
  const branchCode = searchParams.get("branch") || undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableOpt[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [info, setInfo] = useState<RestaurantInfo>({
    name: "Book a table",
    tagline: null,
    address: null,
    phone: null,
    email: null,
    wifiSsid: null,
    wifiPassword: null,
  });

  useEffect(() => {
    if (!tenantSlug) {
      setError("Missing restaurant link");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (await fetchPublicDiningBookingConfig(tenantSlug, {
          branch: branchCode,
          tableId,
        })) as {
          restaurantName?: string;
          restaurant?: RestaurantInfo;
          tables?: TableOpt[];
          settings?: Partial<Settings>;
        };
        setTables(data.tables ?? []);
        const s = data.settings ?? {};
        setSettings({
          openTime: s.openTime ?? "10:00",
          closeTime: s.closeTime ?? "22:00",
          timeSlotDuration: s.timeSlotDuration ?? 30,
          maxGuestsPerBooking: s.maxGuestsPerBooking ?? 12,
          advanceBookingDays: s.advanceBookingDays ?? 30,
          minNoticeHours: s.minNoticeHours ?? 1,
          weekdaysOpen:
            Array.isArray(s.weekdaysOpen) && s.weekdaysOpen.length === 7
              ? s.weekdaysOpen
              : [true, true, true, true, true, true, true],
        });
        setInfo({
          name: data.restaurant?.name || data.restaurantName || "Book a table",
          tagline: data.restaurant?.tagline ?? null,
          address: data.restaurant?.address ?? null,
          phone: data.restaurant?.phone ?? null,
          email: data.restaurant?.email ?? null,
          wifiSsid: data.restaurant?.wifiSsid ?? null,
          wifiPassword: data.restaurant?.wifiPassword ?? null,
        });
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantSlug, branchCode, tableId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }

  if (error || !tenantSlug || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center space-y-3 max-w-sm">
          <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-900">Booking unavailable</p>
          <p className="text-xs text-gray-500">
            {error || "This restaurant hasn’t enabled online table booking yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-50"
      style={{ minHeight: "100svh", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div
        className="bg-[#14b8a6]"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          marginTop: "-env(safe-area-inset-top, 0px)",
        }}
      />

      <div className="bg-gradient-to-br from-[#14b8a6] via-[#14b8a6] to-[#0f766e]">
        <div className="flex items-center px-4 pt-4 pb-2">
          <Link
            to={`/menu/${tenantSlug}`}
            style={{ touchAction: "manipulation", minHeight: "44px", minWidth: "44px" }}
            className="flex items-center gap-2 text-white/80 active:text-white text-sm font-semibold transition-colors -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="flex-1" />
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="px-4 pt-3 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-teal-100" />
            <span className="text-teal-100 text-xs font-semibold uppercase tracking-wider">
              Table Reservation
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-1">{info.name}</h1>
          {info.tagline && <p className="text-teal-50 text-base">{info.tagline}</p>}

          <div className="flex flex-col gap-2 mt-4">
            {info.address && (
              <div className="flex items-center gap-2 bg-white/15 rounded-full px-3 py-2 self-start">
                <MapPin className="w-3.5 h-3.5 text-teal-50 flex-shrink-0" />
                <span className="text-xs text-white font-medium">{info.address}</span>
              </div>
            )}
            {info.phone && (
              <a
                href={`tel:${info.phone}`}
                style={{ touchAction: "manipulation" }}
                className="flex items-center gap-2 bg-white/15 active:bg-white/25 rounded-full px-3 py-2 self-start transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-teal-50 flex-shrink-0" />
                <span className="text-xs text-white font-medium">{info.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-3 -mt-5">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <BookingForm
            tenantSlug={tenantSlug}
            branchCode={branchCode}
            initialTableId={tableId}
            tables={tables}
            settings={settings}
            info={info}
          />
        </div>
      </div>

      <InfoFooter info={info} settings={settings} />
    </div>
  );
}

export default BookTablePage;
