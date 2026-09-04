import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../i18n";
import { toast } from "sonner";
import {
  CalendarDays,
  Search,
  RefreshCw,
  Check,
  X,
  Clock,
  Users,
  Phone,
  StickyNote,
  Plus,
  Minus,
  Settings,
  Save,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  createDiningBooking,
  fetchDiningBookingSettings,
  fetchDiningBookings,
  fetchDiningTables,
  updateDiningBooking,
  upsertDiningBookingSettings,
  type DiningTable,
} from "../../../../app/api/dining";
import { ApiError } from "../../../../app/api/client";
import { useBranchRevision } from "../../../../app/hooks/useBranchRevision";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type UiStatus = "pending" | "confirmed" | "cancelled";

type Booking = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string | null;
  status: BookingStatus;
  tableId: string | null;
  table: { id: string; number: number; name: string } | null;
};

type BookingSettings = {
  openTime: string;
  closeTime: string;
  expiryHours: number;
  maxGuestsPerBooking: number;
  advanceBookingDays: number;
  minNoticeHours: number;
  enableAutoCancel: boolean;
  timeSlotDuration: number;
  weekdaysOpen: boolean[];
};

const DEFAULT_SETTINGS: BookingSettings = {
  openTime: "10:00",
  closeTime: "22:00",
  expiryHours: 2,
  maxGuestsPerBooking: 12,
  advanceBookingDays: 30,
  minNoticeHours: 1,
  enableAutoCancel: false,
  timeSlotDuration: 30,
  weekdaysOpen: [true, true, true, true, true, true, true],
};

const API_TO_UI: Record<BookingStatus, UiStatus> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
};

const STATUS_BADGE: Record<UiStatus, string> = {
  pending:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  confirmed:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  cancelled:
    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

const STATUS_LABEL: Record<UiStatus, { az: string; en: string }> = {
  pending: { az: "Gözləyir", en: "Pending" },
  confirmed: { az: "Təsdiqləndi", en: "Confirmed" },
  cancelled: { az: "Ləğv Edildi", en: "Cancelled" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const AVAILABLE_TIMES = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
];

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function normalizeSettings(raw: Record<string, unknown> | null): BookingSettings {
  if (!raw) return DEFAULT_SETTINGS;
  const weekdays = Array.isArray(raw.weekdaysOpen)
    ? (raw.weekdaysOpen as boolean[])
    : DEFAULT_SETTINGS.weekdaysOpen;
  return {
    openTime: String(raw.openTime ?? DEFAULT_SETTINGS.openTime),
    closeTime: String(raw.closeTime ?? DEFAULT_SETTINGS.closeTime),
    expiryHours: Number(raw.expiryHours ?? DEFAULT_SETTINGS.expiryHours),
    maxGuestsPerBooking: Number(raw.maxGuestsPerBooking ?? DEFAULT_SETTINGS.maxGuestsPerBooking),
    advanceBookingDays: Number(raw.advanceBookingDays ?? DEFAULT_SETTINGS.advanceBookingDays),
    minNoticeHours: Number(raw.minNoticeHours ?? DEFAULT_SETTINGS.minNoticeHours),
    enableAutoCancel: Boolean(raw.enableAutoCancel ?? DEFAULT_SETTINGS.enableAutoCancel),
    timeSlotDuration: Number(raw.timeSlotDuration ?? DEFAULT_SETTINGS.timeSlotDuration),
    weekdaysOpen: weekdays.length === 7 ? weekdays : DEFAULT_SETTINGS.weekdaysOpen,
  };
}

function mapBooking(row: Record<string, unknown>): Booking {
  const table = row.table as Booking["table"] | undefined;
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    date: String(row.date ?? "").slice(0, 10),
    time: String(row.time ?? "").slice(0, 5),
    guests: Number(row.guests ?? 1),
    notes: (row.notes as string | null) ?? null,
    status: (row.status as BookingStatus) ?? "PENDING",
    tableId: (row.tableId as string | null) ?? table?.id ?? null,
    table: table ?? null,
  };
}

function tableLabel(b: Booking) {
  if (b.table) return `#${b.table.number} ${b.table.name}`.trim();
  return "—";
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

function BookingSettingsModal({
  initial,
  onClose,
  language,
  onSaved,
}: {
  initial: BookingSettings;
  onClose: () => void;
  language: string;
  onSaved: (s: BookingSettings) => void;
}) {
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const [settings, setSettings] = useState<BookingSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await upsertDiningBookingSettings(settings);
      const next = normalizeSettings(data as Record<string, unknown>);
      onSaved(next);
      setSaved(true);
      toast.success(tr("Tənzimləmələr saxlanıldı", "Settings saved"));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (i: number) =>
    setSettings((s) => ({
      ...s,
      weekdaysOpen: s.weekdaysOpen.map((v, idx) => (idx === i ? !v : v)),
    }));

  const sel = (field: keyof BookingSettings, value: string | number | boolean) =>
    setSettings((s) => ({ ...s, [field]: value }));

  const inputCls =
    "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";
  const labelCls = "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1";
  const activeBtn = "bg-[#14b8a6] border-[#14b8a6] text-white";
  const idleBtn =
    "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Settings className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Rezervasiya Tənzimləmələri", "Booking Settings")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full p-1 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#14b8a6]" />
              {tr("İş Saatları", "Opening Hours")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{tr("Açılış", "Open Time")}</label>
                <div className="relative">
                  <select
                    value={settings.openTime}
                    onChange={(e) => sel("openTime", e.target.value)}
                    className={`${inputCls} cursor-pointer pr-7 appearance-none`}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>{tr("Bağlanış", "Close Time")}</label>
                <div className="relative">
                  <select
                    value={settings.closeTime}
                    onChange={(e) => sel("closeTime", e.target.value)}
                    className={`${inputCls} cursor-pointer pr-7 appearance-none`}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5">
              {tr("Açıq Günlər", "Open Days")}
            </p>
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    settings.weekdaysOpen[i] ? activeBtn : idleBtn
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>{tr("Zaman aralığı (dəq)", "Time Slot Duration (min)")}</label>
            <div className="flex gap-2">
              {[15, 30, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => sel("timeSlotDuration", m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    settings.timeSlotDuration === m ? activeBtn : idleBtn
                  }`}
                >
                  {m} {tr("dəq", "min")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#14b8a6]" />
              {tr("Rezervasiya Qaydaları", "Booking Rules")}
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    {tr("Min. əvvəlcədən (saat)", "Min. Advance Notice (hrs)")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={settings.minNoticeHours}
                    onChange={(e) => sel("minNoticeHours", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {tr("Maks. öncəlik (gün)", "Max Advance Booking (days)")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.advanceBookingDays}
                    onChange={(e) => sel("advanceBookingDays", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  {tr("Maks. qonaq sayı / rezervasiya", "Max Guests per Booking")}
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.maxGuestsPerBooking}
                  onChange={(e) => sel("maxGuestsPerBooking", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#14b8a6]" />
              {tr("Müddətin bitməsi", "Expiry Rules")}
            </p>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>
                  {tr(
                    "Rezervasiya müddəti bitdikdən sonra (saat)",
                    "Booking expires after booking time (hrs)",
                  )}
                </label>
                <div className="flex gap-2">
                  {[0.5, 1, 2, 4].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => sel("expiryHours", h)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        settings.expiryHours === h ? activeBtn : idleBtn
                      }`}
                    >
                      {h < 1 ? `${h * 60}m` : `${h}h`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {tr("Avtomatik ləğv et", "Auto-cancel expired bookings")}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {tr(
                      "Müddəti bitmiş gözləyən rezervasiyaları ləğv et",
                      "Automatically cancel pending bookings past their time",
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => sel("enableAutoCancel", !settings.enableAutoCancel)}
                  className={`rounded-full border-2 transition-all flex items-center flex-shrink-0 ${
                    settings.enableAutoCancel
                      ? "bg-[#14b8a6] border-[#14b8a6] justify-end"
                      : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 justify-start"
                  }`}
                  style={{ width: "40px", height: "22px" }}
                >
                  <div
                    className="rounded-full bg-white shadow-sm transition-all"
                    style={{ width: "14px", height: "14px", margin: "0 2px" }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {tr("Bağla", "Close")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saved ? tr("Saxlanıldı!", "Saved!") : tr("Yadda saxla", "Save Settings")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function BookingDetailModal({
  booking,
  onRequestStatusChange,
  statusSaving,
  onClose,
  language,
}: {
  booking: Booking;
  onRequestStatusChange: (id: string, status: BookingStatus) => void;
  statusSaving: boolean;
  onClose: () => void;
  language: string;
}) {
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const ui = API_TO_UI[booking.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Booking #{booking.id.slice(0, 6).toUpperCase()}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={statusSaving}
            className="text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-full p-1 transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Status", "Status")}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_BADGE[ui]}`}
            >
              {language === "az" ? STATUS_LABEL[ui].az : STATUS_LABEL[ui].en}
            </span>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {tr("Müştəri", "Guest")}
              </p>
            </div>
            <div className="px-3 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-900 dark:text-white font-medium">{booking.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{booking.phone}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {tr("Rezervasiya", "Reservation")}
              </p>
            </div>
            <div className="px-3 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{tr("Masa", "Table")}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {tableLabel(booking)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{tr("Tarix", "Date")}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">{booking.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{tr("Vaxt", "Time")}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">{booking.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{tr("Qonaq", "Guests")}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {booking.guests} {booking.guests === 1 ? "person" : "people"}
                </span>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {tr("Qeyd", "Notes")}
                </p>
              </div>
              <div className="px-3 py-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">{booking.notes}</p>
              </div>
            </div>
          )}
        </div>

        {booking.status === "PENDING" && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <button
              type="button"
              disabled={statusSaving}
              onClick={() => onRequestStatusChange(booking.id, "CANCELLED")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <X className="w-3 h-3" /> {tr("Ləğv et", "Cancel")}
            </button>
            <button
              type="button"
              disabled={statusSaving}
              onClick={() => onRequestStatusChange(booking.id, "CONFIRMED")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <Check className="w-3 h-3" /> {tr("Təsdiqlə", "Confirm")}
            </button>
          </div>
        )}
        {booking.status === "CONFIRMED" && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              disabled={statusSaving}
              onClick={() => onRequestStatusChange(booking.id, "CANCELLED")}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <X className="w-3 h-3" /> {tr("Ləğv et", "Cancel booking")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingStatusConfirmModal({
  guestName,
  status,
  saving,
  onConfirm,
  onClose,
  language,
}: {
  guestName: string;
  status: "CONFIRMED" | "CANCELLED";
  saving: boolean;
  onConfirm: (cancellationReason?: string) => void;
  onClose: () => void;
  language: string;
}) {
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const isConfirm = status === "CONFIRMED";
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {isConfirm
              ? tr("Rezervasiyanı təsdiqlə", "Confirm booking")
              : tr("Rezervasiyanı ləğv et", "Cancel booking")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isConfirm
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {isConfirm ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {tr("Əminsiniz?", "Are you sure?")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isConfirm
                  ? tr(
                      `"${guestName}" rezervasiyasını təsdiqləmək istəyirsiniz?`,
                      `Confirm booking for "${guestName}"?`,
                    )
                  : tr(
                      `"${guestName}" rezervasiyasını ləğv etmək istəyirsiniz?`,
                      `Cancel booking for "${guestName}"?`,
                    )}
              </p>
            </div>
          </div>

          {!isConfirm && (
            <div>
              <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                {tr("Ləğv səbəbi (istəyə bağlı)", "Cancellation reason (optional)")}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={saving}
                rows={3}
                maxLength={500}
                placeholder={tr("Məs: müştəri zəng etdi…", "e.g. guest called…")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] resize-none disabled:opacity-50"
              />
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3.5 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {tr("Geri", "Back")}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(isConfirm ? undefined : reason.trim() || undefined)}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${
              isConfirm
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {tr("Yenilənir…", "Updating…")}
              </>
            ) : isConfirm ? (
              tr("Təsdiqlə", "Confirm")
            ) : (
              tr("Ləğv et", "Cancel booking")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Booking Modal ────────────────────────────────────────────────────────

function NewBookingModal({
  tables,
  settings,
  onSaved,
  onClose,
  language,
}: {
  tables: DiningTable[];
  settings: BookingSettings;
  onSaved: () => void;
  onClose: () => void;
  language: string;
}) {
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form & { table: string }>>({});
  const [saving, setSaving] = useState(false);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const today = new Date().toISOString().split("T")[0];

  const timeOptions = useMemo(() => {
    const slot = settings.timeSlotDuration || 30;
    const [oh, om] = settings.openTime.split(":").map(Number);
    const [ch, cm] = settings.closeTime.split(":").map(Number);
    const start = oh * 60 + om;
    const end = ch * 60 + cm;
    const out: string[] = [];
    for (let m = start; m < end; m += slot) {
      out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
    }
    return out.length ? out : AVAILABLE_TIMES;
  }, [settings]);

  const validate = () => {
    const e: Partial<typeof form & { table: string }> = {};
    if (!selectedTableId) e.table = tr("Masa seçin", "Select a table");
    if (!form.name.trim()) e.name = tr("Tələb olunur", "Required");
    if (!form.phone.trim()) e.phone = tr("Tələb olunur", "Required");
    if (!form.date) e.date = tr("Tələb olunur", "Required");
    if (!form.time) e.time = tr("Tələb olunur", "Required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createDiningBooking({
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        guests: form.guests,
        notes: form.notes.trim() || null,
        tableId: selectedTableId,
        status: "CONFIRMED",
      });
      toast.success(tr("Rezervasiya yaradıldı", "Booking created"));
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (err?: string) =>
    `w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
      err
        ? "border-red-300 focus:ring-red-400"
        : "border-gray-300 dark:border-gray-700 focus:ring-[#14b8a6]"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Yeni Rezervasiya", "New Booking")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full p-1 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {tr("Masa", "Table")} <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTableId(t.id);
                    setForm((f) => ({ ...f, guests: Math.min(t.seats, f.guests || 2) }));
                  }}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-all ${
                    selectedTableId === t.id
                      ? "border-[#14b8a6] bg-[#ccfbf1] dark:bg-[#14b8a6]/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800"
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      selectedTableId === t.id
                        ? "text-[#0f766e] dark:text-[#14b8a6]"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    #{t.number}
                  </span>
                  <span
                    className={`text-[10px] ${
                      selectedTableId === t.id ? "text-[#14b8a6]" : "text-gray-400"
                    }`}
                  >
                    {t.seats} seats
                  </span>
                </button>
              ))}
            </div>
            {errors.table && <p className="text-[10px] text-red-500 mt-1">{errors.table}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {tr("Ad Soyad", "Full Name")} <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={tr("Ad daxil edin", "Guest name")}
                className={inputCls(errors.name)}
              />
              {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {tr("Telefon", "Phone")} <span className="text-red-500">*</span>
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+994 50 000 0000"
                type="tel"
                className={inputCls(errors.phone)}
              />
              {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {tr("Tarix", "Date")} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputCls(errors.date)}
              />
              {errors.date && <p className="text-[10px] text-red-500 mt-0.5">{errors.date}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {tr("Vaxt", "Time")} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className={`${inputCls(errors.time)} cursor-pointer`}
              >
                <option value="">{tr("Seçin", "Select")}</option>
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.time && <p className="text-[10px] text-red-500 mt-0.5">{errors.time}</p>}
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {tr("Qonaq sayı", "Guests")}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, guests: Math.max(1, f.guests - 1) }))}
                  className="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-semibold text-gray-900 dark:text-white w-6 text-center">
                  {form.guests}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      guests: Math.min(selectedTable?.seats ?? settings.maxGuestsPerBooking, f.guests + 1),
                    }))
                  }
                  className="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
                {selectedTable && (
                  <span className="text-[10px] text-gray-400">
                    {tr("max", "max")} {selectedTable.seats}
                  </span>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {tr("Qeyd", "Notes")}{" "}
                <span className="text-gray-400 font-normal">({tr("ixtiyari", "optional")})</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder={tr("Xüsusi istək, allergiya…", "Allergies, special requests…")}
                className={`${inputCls()} resize-none`}
              />
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {saving ? tr("Saxlanılır…", "Saving…") : tr("Rezerv et", "Book")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function RestaurantBookings() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const branchRevision = useBranchRevision();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UiStatus>("all");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{
    id: string;
    guestName: string;
    status: "CONFIRMED" | "CANCELLED";
  } | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, tableRows, settingsRow] = await Promise.all([
        fetchDiningBookings({ status: "all" }),
        fetchDiningTables(),
        fetchDiningBookingSettings(),
      ]);
      setBookings((rows as Record<string, unknown>[]).map(mapBooking));
      setTables(tableRows);
      setSettings(normalizeSettings(settingsRow as Record<string, unknown>));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, branchRevision]);

  const requestStatusChange = (id: string, status: BookingStatus) => {
    if (status !== "CONFIRMED" && status !== "CANCELLED") return;
    const booking = bookings.find((b) => b.id === id);
    if (!booking || statusSaving) return;
    if (booking.status === "CANCELLED") return;
    if (status === "CONFIRMED" && booking.status !== "PENDING") return;
    if (status === "CANCELLED" && booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return;
    }
    setStatusConfirm({ id, guestName: booking.name, status });
  };

  const updateStatus = async (
    id: string,
    status: BookingStatus,
    cancellationReason?: string,
  ) => {
    if (statusSaving) return;
    setStatusSaving(true);
    try {
      const row = mapBooking(
        (await updateDiningBooking(id, {
          status,
          ...(status === "CANCELLED" && cancellationReason
            ? { cancellationReason }
            : {}),
        })) as Record<string, unknown>,
      );
      setBookings((prev) => prev.map((b) => (b.id === id ? row : b)));
      setDetail((d) => (d?.id === id ? row : d));
      setStatusConfirm(null);
      toast.success(
        status === "CONFIRMED"
          ? tr("Rezervasiya təsdiqləndi", "Booking confirmed")
          : tr("Rezervasiya ləğv edildi", "Booking cancelled"),
      );
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setStatusSaving(false);
    }
  };

  const filtered = bookings.filter((b) => {
    const ui = API_TO_UI[b.status];
    const q = search.toLowerCase();
    const hay = `${b.name} ${b.phone} ${tableLabel(b)} ${b.table?.number ?? ""}`.toLowerCase();
    return (statusFilter === "all" || ui === statusFilter) && (!q || hay.includes(q));
  });

  const counts: Record<UiStatus, number> = {
    pending: bookings.filter((b) => b.status === "PENDING").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
  };

  const today = new Date().toISOString().split("T")[0];
  const todayCount = bookings.filter((b) => b.date === today && b.status !== "CANCELLED").length;

  const filterActive = "bg-[#14b8a6] border-[#14b8a6] text-white";
  const filterIdle =
    "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#14b8a6]" />
            {tr("Masa Rezervasiyaları", "Table Bookings")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {bookings.length} {tr("rezervasiya", "total")} · {todayCount} {tr("bu gün", "today")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {tr("Yenilə", "Refresh")}
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            {tr("Tənzimləmələr", "Settings")}
          </button>
          <button
            type="button"
            onClick={() => setShowNewBooking(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
            {tr("Yeni", "New Booking")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["pending", tr("Gözləyir", "Pending"), "bg-amber-50 dark:bg-amber-900/20", "text-amber-600 dark:text-amber-400", counts.pending],
            ["confirmed", tr("Təsdiqləndi", "Confirmed"), "bg-green-50 dark:bg-green-900/20", "text-green-600 dark:text-green-400", counts.confirmed],
            ["cancelled", tr("Ləğv", "Cancelled"), "bg-red-50 dark:bg-red-900/20", "text-red-600 dark:text-red-400", counts.cancelled],
          ] as const
        ).map(([key, label, bg, fg, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`bg-white dark:bg-gray-900 border rounded-xl p-3 text-left transition-all ${
              statusFilter === key
                ? "border-[#14b8a6] dark:border-[#0d9488] ring-1 ring-[#14b8a6] dark:ring-[#0d9488]"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center mb-1.5`}>
              <CalendarDays className={`w-3.5 h-3.5 ${fg}`} />
            </div>
            <p className={`text-lg font-semibold ${fg}`}>{count}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("Ad, masa, telefon…", "Name, table, phone…")}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors"
          />
        </div>
        {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border flex-shrink-0 ${
              statusFilter === s ? filterActive : filterIdle
            }`}
          >
            {s === "all"
              ? tr("Hamısı", "All")
              : language === "az"
                ? STATUS_LABEL[s].az
                : STATUS_LABEL[s].en}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarDays className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              {bookings.length === 0
                ? tr(
                    "Hələ rezervasiya yoxdur.",
                    "No bookings yet. Bookings come from the public book page or New Booking.",
                  )
                : tr("Nəticə tapılmadı", "No results found")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  {[
                    tr("Masa", "Table"),
                    tr("Ad", "Name"),
                    tr("Tarix", "Date"),
                    tr("Vaxt", "Time"),
                    tr("Qonaq", "Guests"),
                    tr("Status", "Status"),
                    tr("Telefon", "Phone"),
                    tr("Əməliyyat", "Actions"),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => {
                  const ui = API_TO_UI[b.status];
                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                      onClick={() => setDetail(b)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {tableLabel(b)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{b.name}</p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 ${
                            b.date === today ? "font-semibold text-[#0f766e] dark:text-[#14b8a6]" : ""
                          }`}
                        >
                          {b.date === today && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] flex-shrink-0" />
                          )}
                          {b.date}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" /> {b.time}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Users className="w-3 h-3" /> {b.guests}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_BADGE[ui]}`}
                        >
                          {language === "az" ? STATUS_LABEL[ui].az : STATUS_LABEL[ui].en}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{b.phone}</span>
                      </td>
                      <td
                        className="px-3 py-2 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                          <div className="flex items-center gap-1">
                            {b.status === "PENDING" && (
                              <button
                                type="button"
                                disabled={statusSaving}
                                onClick={() => requestStatusChange(b.id, "CONFIRMED")}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                              >
                                {statusSaving &&
                                statusConfirm?.id === b.id &&
                                statusConfirm.status === "CONFIRMED" ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={statusSaving}
                              onClick={() => requestStatusChange(b.id, "CANCELLED")}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                              title={tr("Ləğv et", "Cancel")}
                            >
                              {statusSaving &&
                              statusConfirm?.id === b.id &&
                              statusConfirm.status === "CANCELLED" ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                        {b.notes && (
                          <StickyNote className="w-3 h-3 text-amber-400 mt-1" title={b.notes} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <BookingDetailModal
          booking={detail}
          language={language}
          statusSaving={statusSaving}
          onRequestStatusChange={requestStatusChange}
          onClose={() => {
            if (!statusSaving) setDetail(null);
          }}
        />
      )}

      {statusConfirm && (
        <BookingStatusConfirmModal
          language={language}
          guestName={statusConfirm.guestName}
          status={statusConfirm.status}
          saving={statusSaving}
          onConfirm={(cancellationReason) =>
            void updateStatus(statusConfirm.id, statusConfirm.status, cancellationReason)
          }
          onClose={() => {
            if (!statusSaving) setStatusConfirm(null);
          }}
        />
      )}

      {showNewBooking && (
        <NewBookingModal
          language={language}
          tables={tables}
          settings={settings}
          onSaved={() => void load()}
          onClose={() => setShowNewBooking(false)}
        />
      )}

      {showSettings && (
        <BookingSettingsModal
          language={language}
          initial={settings}
          onSaved={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default RestaurantBookings;
