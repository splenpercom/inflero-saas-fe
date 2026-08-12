import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link } from "react-router";
import { cn } from "../ui/utils";
import { DateInput } from "../ui/DateInput";
import {
  Search,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  List,
  Settings,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { generateTimeSlots, DEFAULT_CONFIG, type ReservationConfig } from "../../utils/reservationConfig";
import {
  fetchReservations,
  fetchReservationSettings,
  updateReservationSettings,
  createReservation,
  updateReservation,
  deleteReservation,
} from "../../api/reservations";
import { fetchCustomers, type PeopleCustomer } from "../../api/people";
import {
  apiReservationToUi,
  combineScheduledAt,
  type ReservationUi,
  type ReservationStatus,
} from "../../lib/reservationMappers";
import {
  AZ_MONTHS_LONG,
  EN_MONTHS_LONG,
  RU_MONTHS_LONG,
  formatDate,
  formatDateLong,
} from "../../lib/dateFormat";
import { DEFAULT_SERVICE_TYPES, resolveServiceType, serviceLabelFor as serviceLabel } from "../../lib/serviceTypes";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { usePendingReservationCount } from "../../hooks/usePendingReservationCount";
import { customerBookingPath, customerBookingUrl } from "../../lib/bookingLinks";
import type { BranchLandingPage } from "../../lib/branchBooking";
import { BranchBookingPagesEditor } from "./BranchBookingPagesEditor";

import { pickLang } from "../../i18n/pickLang";
import { DataPagination } from "../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
type Reservation = ReservationUi;

const STATUS_CONFIG: Record<ReservationStatus, { label: string; labelAz: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", labelAz: "Gözləyir", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700", icon: AlertCircle },
  confirmed: { label: "Confirmed", labelAz: "Təsdiqlənib", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700", icon: CheckCircle },
  completed: { label: "Completed", labelAz: "Tamamlandı", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", labelAz: "Ləğv edildi", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700", icon: XCircle },
};

export function Reservations() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, user } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Reservations");
  const branchRevision = useBranchRevision();
  const { acknowledge: acknowledgeReservations } = usePendingReservationCount();
  const location = useLocation();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const tenantSlug = user?.tenant?.slug ?? null;
  const bookingShareUrl = tenantSlug ? customerBookingUrl(tenantSlug) : null;

  const copyBookingLink = async () => {
    if (!bookingShareUrl) return;
    try {
      await navigator.clipboard.writeText(bookingShareUrl);
      notifySuccess(tr("Rezervasiya linki kopyalandı", "Booking link copied"));
    } catch {
      notifyFromError(new Error(tr("Link kopyalanmadı", "Could not copy link")));
    }
  };

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "daily" | "weekly" | "monthly">("list");
  const [navDate, setNavDate] = useState(() => new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewReservation, setViewReservation] = useState<Reservation | null>(null);
  const [editReservation, setEditReservation] = useState<Reservation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [resConfig, setResConfig] = useState<ReservationConfig>(DEFAULT_CONFIG);
  const [draftConfig, setDraftConfig] = useState<ReservationConfig>(DEFAULT_CONFIG);
  const [serviceTypes, setServiceTypes] = useState(DEFAULT_SERVICE_TYPES);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState<PeopleCustomer[]>([]);

  const [formMode, setFormMode] = useState<"registered" | "guest">("registered");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formGuestName, setFormGuestName] = useState("");
  const [formGuestPhone, setFormGuestPhone] = useState("");
  const [formService, setFormService] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<ReservationStatus>("pending");

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const loadReservations = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setReservations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchReservations({ limit: viewMode === "list" ? 200 : 500 });
      setReservations(rows.map(apiReservationToUi));
    } catch (err) {
      notifyFromError(err, tr("Rezervasiyaları yükləmək alınmadı", "Failed to load reservations"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, language, branchRevision, viewMode]);

  const loadSettings = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) return;
    try {
      const cfg = await fetchReservationSettings();
      setResConfig(cfg);
      setDraftConfig(cfg);
      if (cfg.serviceTypes?.length) setServiceTypes(cfg.serviceTypes);
    } catch {
      /* keep defaults */
    }
  }, [isDemo, isAuthenticated, canView, branchRevision]);

  useEffect(() => {
    void loadReservations();
    void loadSettings();
  }, [loadReservations, loadSettings]);

  useEffect(() => {
    if (location.pathname === "/dashboard/reservations") {
      acknowledgeReservations();
    }
  }, [location.pathname, acknowledgeReservations]);

  const loadCustomers = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) return;
    try {
      const rows = await fetchCustomers();
      setCustomers(rows);
    } catch {
      setCustomers([]);
    }
  }, [isDemo, isAuthenticated, branchRevision]);

  const resetForm = () => {
    setFormMode("registered");
    setFormCustomerId("");
    setFormGuestName("");
    setFormGuestPhone("");
    setFormService("");
    setFormDate("");
    setFormTime("");
    setFormNotes("");
    setFormStatus("pending");
  };

  const openAddModal = () => {
    resetForm();
    void loadCustomers();
    void loadSettings();
    setIsAddModalOpen(true);
  };

  const openEditModal = (res: Reservation) => {
    void loadCustomers();
    void loadSettings();
    const isGuest = !res.customerId && res.source === "customer_site";
    setFormMode(isGuest ? "guest" : "registered");
    setEditReservation(res);
    setFormCustomerId(res.customerId);
    setFormGuestName(res.customerName !== "—" ? res.customerName : "");
    setFormGuestPhone(res.customerPhone);
    setFormService(serviceLabel(res.serviceType, language, serviceTypes));
    setFormDate(res.date);
    setFormTime(res.time);
    setFormNotes(res.notes);
    setFormStatus(res.status);
  };

  const handleSave = async () => {
    const serviceType = resolveServiceType(formService, serviceTypes);
    if (!serviceType || !formDate || !formTime) return;
    if (formMode === "registered" && !formCustomerId) return;
    if (formMode === "guest" && (!formGuestName.trim() || !formGuestPhone.trim())) return;
    if (isDemo || !isAuthenticated) return;
    if (editReservation ? !canEdit : !canCreate) return;

    setSaving(true);
    try {
      const scheduledAt = combineScheduledAt(formDate, formTime);

      if (editReservation) {
        const updated = await updateReservation(editReservation.id, {
          customerId: formMode === "registered" ? formCustomerId : null,
          vehicleId: null,
          guestName: formMode === "guest" ? formGuestName.trim() : null,
          guestPhone: formMode === "guest" ? formGuestPhone.trim() : null,
          guestPlateSuffix: null,
          serviceType,
          scheduledAt,
          mileage: null,
          notes: formNotes.trim() || null,
          status: formStatus,
        });
        setReservations((prev) =>
          prev.map((r) => (r.id === editReservation.id ? apiReservationToUi(updated) : r)),
        );
        setEditReservation(null);
        notifySuccess(tr("Rezervasiya yeniləndi", "Reservation updated"));
      } else {
        const created = await createReservation({
          customerId: formMode === "registered" ? formCustomerId : null,
          vehicleId: null,
          guestName: formMode === "guest" ? formGuestName.trim() : null,
          guestPhone: formMode === "guest" ? formGuestPhone.trim() : null,
          guestPlateSuffix: null,
          serviceType,
          scheduledAt,
          mileage: null,
          notes: formNotes.trim() || null,
          status: formStatus,
        });
        setReservations((prev) => [apiReservationToUi(created), ...prev]);
        setIsAddModalOpen(false);
        notifySuccess(tr("Rezervasiya əlavə edildi", "Reservation created"));
      }
      resetForm();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !(isAuthenticated || isDemo) || !canDelete) return;
    setSaving(true);
    try {
      await deleteReservation(deleteId);
      setReservations((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
      notifySuccess(tr("Rezervasiya ləğv edildi", "Reservation cancelled"));
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    if (isDemo || !isAuthenticated || !canEdit) return;
    try {
      const updated = await updateReservation(id, { status });
      setReservations((prev) => prev.map((r) => (r.id === id ? apiReservationToUi(updated) : r)));
      setViewReservation((prev) => (prev?.id === id ? apiReservationToUi(updated) : prev));
      notifySuccess(tr("Status yeniləndi", "Status updated"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReservations();
    setIsRefreshing(false);
  };

  const filtered = reservations.filter((r) => {
    const matchSearch =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = selectedStatus === "all" || r.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedReservations,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: filtered,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${searchQuery}|${selectedStatus}|${viewMode}`,
  });

  const serviceLabelFor = (value: string) => serviceLabel(value, language, serviceTypes);

  const filteredServiceTypes = useMemo(() => {
    const q = formService.trim().toLowerCase();
    if (!q) return serviceTypes;
    return serviceTypes.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.labelAz.toLowerCase().includes(q) ||
        s.value.toLowerCase().includes(q),
    );
  }, [formService, serviceTypes]);

  const exportCsv = () => {
    const headers = ["ID", "Customer", "Phone", "Service", "Date", "Time", "Status", "Source"];
    const rows = filtered.map((r) => [
      r.id,
      r.customerName,
      r.customerPhone,
      serviceLabelFor(r.serviceType),
      r.date,
      r.time,
      r.status,
      r.source,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isFormValid =
    formService &&
    formDate &&
    formTime &&
    (formMode === "registered"
      ? formCustomerId
      : formGuestName.trim() && formGuestPhone.trim());

  // --- Date navigation helpers ---
  const fmtDate = (d: Date) => d.toISOString().split("T")[0];

  const getWeekStart = (d: Date) => {
    const copy = new Date(d);
    const day = copy.getDay(); // 0=Sun
    copy.setDate(copy.getDate() - day);
    return copy;
  };

  const navigate = (dir: -1 | 1) => {
    setNavDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "daily") d.setDate(d.getDate() + dir);
      else if (viewMode === "weekly") d.setDate(d.getDate() + dir * 7);
      else if (viewMode === "monthly") d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const navLabel = () => {
    const m = language === "az" ? AZ_MONTHS_LONG : language === "ru" ? RU_MONTHS_LONG : EN_MONTHS_LONG;
    if (viewMode === "daily") return formatDateLong(navDate, language);
    if (viewMode === "weekly") {
      const ws = getWeekStart(navDate);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return `${ws.getDate()} ${m[ws.getMonth()]} – ${we.getDate()} ${m[we.getMonth()]} ${we.getFullYear()}`;
    }
    return `${m[navDate.getMonth()]} ${navDate.getFullYear()}`;
  };

  const resForDate = (dateStr: string) =>
    reservations.filter((r) => {
      const matchSearch = r.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === "all" || r.status === selectedStatus;
      return r.date === dateStr && matchSearch && matchStatus;
    });

  // Week days for weekly view
  const weekDays = (() => {
    const ws = getWeekStart(navDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws); d.setDate(d.getDate() + i); return d;
    });
  })();

  // Month grid for monthly view
  const monthDays = (() => {
    const year = navDate.getFullYear();
    const month = navDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days: (Date | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  })();

  const DAY_HEADERS = language === "az"
    ? ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şnb", "Baz"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Slot hours for daily view
  const HOURS = generateTimeSlots(resConfig);

  // Shared modal form JSX
  const renderForm = () => (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFormMode("registered")}
          className={cn(
            "flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors",
            formMode === "registered"
              ? "bg-[#0026f6] text-white border-[#0026f6]"
              : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300",
          )}
        >
          {tr("Qeydiyyatlı müştəri", "Registered customer")}
        </button>
        <button
          type="button"
          onClick={() => setFormMode("guest")}
          className={cn(
            "flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors",
            formMode === "guest"
              ? "bg-[#0026f6] text-white border-[#0026f6]"
              : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300",
          )}
        >
          {tr("Qonaq / walk-in", "Guest walk-in")}
        </button>
      </div>

      {formMode === "registered" ? (
      <>
      {/* Customer */}
      <div>
        <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
          {tr("Müştəri", "Customer")} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setCustomerDropdownOpen(!customerDropdownOpen); setServiceDropdownOpen(false); }}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
          >
            <span className={formCustomerId ? "" : "text-gray-400"}>
              {formCustomerId ? customers.find((c) => c.id === formCustomerId)?.name : tr("Müştəri seçin", "Select customer")}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {customerDropdownOpen && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setCustomerDropdownOpen(false)} />
              <div className="absolute z-[110] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setFormCustomerId(c.id); setCustomerDropdownOpen(false); }}
                    className={cn("w-full px-2.5 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", formCustomerId === c.id && "bg-[#e8ebff] dark:bg-[#0026f6]/20 text-[#0026f6] dark:text-[#0026f6]")}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>{c.name}</span>
                      <span className="text-gray-400 ml-auto">{c.phone}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      </>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Ad", "Name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formGuestName}
              onChange={(e) => setFormGuestName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Telefon", "Phone")} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formGuestPhone}
              onChange={(e) => setFormGuestPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
            />
          </div>
        </div>
      )}

      {/* Service Type */}
      <div>
        <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
          {tr("Xidmət növü", "Service Type")} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={formService}
              onChange={(e) => {
                setFormService(e.target.value);
                setServiceDropdownOpen(true);
              }}
              onFocus={() => {
                setServiceDropdownOpen(true);
                setCustomerDropdownOpen(false);
              }}
              placeholder={tr("Xidmət seçin və ya yazın", "Select or type service")}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
            />
            <button
              type="button"
              onClick={() => {
                setServiceDropdownOpen(!serviceDropdownOpen);
                setCustomerDropdownOpen(false);
              }}
              className="shrink-0 p-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/80"
              aria-label={tr("Xidmət siyahısı", "Service list")}
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", serviceDropdownOpen && "rotate-180")} />
            </button>
          </div>
          {serviceDropdownOpen && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setServiceDropdownOpen(false)} />
              <div className="absolute z-[110] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredServiceTypes.length === 0 ? (
                  <p className="px-2.5 py-2 text-xs text-gray-500 dark:text-gray-400">
                    {tr("Siyahıda uyğun xidmət yoxdur — özünüz yaza bilərsiniz", "No matching services — type your own")}
                  </p>
                ) : (
                  filteredServiceTypes.map((s) => {
                    const label = pickLang(language, s.labelAz, s.label);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          setFormService(label);
                          setServiceDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-2.5 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          formService.trim().toLowerCase() === label.toLowerCase() &&
                            "bg-[#e8ebff] dark:bg-[#0026f6]/20 text-[#0026f6] dark:text-[#0026f6]",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
            {tr("Tarix", "Date")} <span className="text-red-500">*</span>
          </label>
          <DateInput
            value={formDate}
            onChange={setFormDate}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
            {tr("Saat", "Time")} <span className="text-red-500">*</span>
          </label>
          <select
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
          >
            <option value="">{tr("Saat seçin", "Select time")}</option>
            {generateTimeSlots(resConfig).map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status (edit only) */}
      {editReservation && (
        <div>
          <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
            {tr("Status", "Status")}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
            >
              <span>{STATUS_CONFIG[formStatus].label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {statusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setStatusDropdownOpen(false)} />
                <div className="absolute z-[110] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  {(Object.keys(STATUS_CONFIG) as ReservationStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setFormStatus(s); setStatusDropdownOpen(false); }}
                      className={cn("w-full px-2.5 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", formStatus === s && "bg-[#e8ebff] dark:bg-[#0026f6]/20 text-[#0026f6] dark:text-[#0026f6]")}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
          {tr("Qeydlər", "Notes")}
        </label>
        <textarea
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder={tr("Əlavə qeydlər...", "Additional notes...")}
          rows={2}
          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] resize-none"
        />
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Rezervasiyalar", "Reservations")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Avtomobil servis rezervasiyalarını idarə edin", "Manage car service reservations")}
          </p>
        </div>

        {tenantSlug && !isDemo && (
          <div className="mb-4 flex flex-col gap-2 p-3 rounded-lg border border-[#0026f6]/20 bg-[#0026f6]/5 dark:bg-[#0026f6]/10">
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                {tr("Müştəri rezervasiya linki", "Customer booking link")}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {resConfig.bookingPageMode === "per_branch"
                  ? tr(
                      "Hər filialın öz rezervasiya səhifəsi var. Linkləri Rezervasiya Parametrlərindən idarə edin.",
                      "Each branch has its own booking page. Manage links in Reservation Settings.",
                    )
                  : tr(
                      "Bütün filiallar üçün tək ümumi rezervasiya səhifəsi.",
                      "One shared booking page for all branches.",
                    )}
              </p>
            </div>
            {resConfig.bookingPageMode === "per_branch" ? (
              <div className="space-y-2">
                {(Object.entries(resConfig.branchPages ?? {}) as [string, BranchLandingPage][])
                  .filter(([, page]) => page.enabled !== false)
                  .map(([storeId, page]) => {
                    const url = customerBookingUrl(tenantSlug, undefined, page.slug);
                    return (
                      <div key={storeId} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate flex-1">
                          <span className="font-medium">{page.name ?? page.slug}:</span> {customerBookingPath(tenantSlug, page.slug)}
                        </p>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(url).then(() => notifySuccess(tr("Link kopyalandı", "Link copied")))}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {tr("Kopyala", "Copy")}
                          </button>
                          <Link
                            to={customerBookingPath(tenantSlug, page.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#0026f6] text-white rounded-lg"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {tr("Aç", "Open")}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex-1">{bookingShareUrl}</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void copyBookingLink()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {tr("Kopyala", "Copy")}
                  </button>
                  <Link
                    to={customerBookingPath(tenantSlug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#0026f6] text-white rounded-lg font-medium hover:bg-[#001fc4]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {tr("Aç", "Open")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {(["pending", "confirmed", "completed", "cancelled"] as ReservationStatus[]).map((s) => {
            const count = reservations.filter((r) => r.status === s).length;
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {pickLang(language, cfg.labelAz, cfg.label)}
                  </span>
                  <cfg.icon className={cn("w-3.5 h-3.5", s === "pending" ? "text-yellow-500" : s === "confirmed" ? "text-blue-500" : s === "completed" ? "text-green-500" : "text-red-500")} />
                </div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Actions Bar */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => void handleRefresh()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>
          {canEdit && (
          <button
            onClick={() => { setDraftConfig({ ...resConfig }); setShowSettings(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{tr("Parametrlər", "Settings")}</span>
          </button>
          )}
          {canCreate && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr("Rezervasiya Əlavə Et", "Add Reservation")}</span>
          </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
            </div>

            <div className="flex gap-2 ml-auto items-center">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
                {([
                  { mode: "list" as const, labelEn: "List", labelAz: "Siyahı", Icon: List },
                  { mode: "daily" as const, labelEn: "Daily", labelAz: "Günlük", Icon: Calendar },
                  { mode: "weekly" as const, labelEn: "Weekly", labelAz: "Həftəlik", Icon: Calendar },
                  { mode: "monthly" as const, labelEn: "Monthly", labelAz: "Aylıq", Icon: Calendar },
                ]).map(({ mode, labelEn, labelAz, Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      viewMode === mode
                        ? "bg-white dark:bg-gray-900 text-[#0026f6] dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    {mode === "list" && <List className="w-3 h-3" />}
                    {mode === "daily" && <span className="text-[10px] font-bold">D</span>}
                    {mode === "weekly" && <span className="text-[10px] font-bold">W</span>}
                    {mode === "monthly" && <span className="text-[10px] font-bold">M</span>}
                    <span>{pickLang(language, labelAz, labelEn)}</span>
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Bütün statuslar", "All Statuses")}</option>
                  <option value="pending">{tr("Gözləyir", "Pending")}</option>
                  <option value="confirmed">{tr("Təsdiqlənib", "Confirmed")}</option>
                  <option value="completed">{tr("Tamamlandı", "Completed")}</option>
                  <option value="cancelled">{tr("Ləğv edildi", "Cancelled")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Navigation Bar (Daily / Weekly / Monthly) */}
        {viewMode !== "list" && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">{navLabel()}</span>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── DAILY VIEW ── */}
        {viewMode === "daily" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-4">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {HOURS.map((hour) => {
                const slotRes = resForDate(fmtDate(navDate)).filter((r) => r.time.startsWith(hour.slice(0, 2)));
                return (
                  <div key={hour} className="flex">
                    <div className="w-16 flex-shrink-0 px-3 py-3 text-[10px] text-gray-400 font-medium border-r border-gray-100 dark:border-gray-800 flex items-start justify-end">
                      {hour}
                    </div>
                    <div className="flex-1 px-3 py-2 min-h-[52px]">
                      {slotRes.length === 0 ? (
                        <span className="text-[10px] text-gray-300 dark:text-gray-700 select-none">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {slotRes.map((r) => {
                            const cfg = STATUS_CONFIG[r.status];
                            return (
                              <button
                                key={r.id}
                                onClick={() => setViewReservation(r)}
                                className={cn("text-left w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium hover:opacity-90 transition-opacity", cfg.color)}
                              >
                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{r.time}</span>
                                <span className="font-semibold">{r.customerName}</span>
                                <span className="ml-auto hidden sm:inline">{serviceLabelFor(r.serviceType).split("/")[0].trim()}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── WEEKLY VIEW ── */}
        {viewMode === "weekly" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
              {weekDays.map((d, i) => {
                const isToday = fmtDate(d) === todayStr;
                const count = resForDate(fmtDate(d)).length;
                return (
                  <div
                    key={i}
                    className={cn("px-2 py-2.5 text-center border-r last:border-r-0 border-gray-100 dark:border-gray-800", isToday && "bg-[#e8ebff] dark:bg-[#0026f6]/20")}
                  >
                    <p className="text-[10px] text-gray-400 font-medium">{DAY_HEADERS[d.getDay()]}</p>
                    <p className={cn("text-sm font-semibold mt-0.5", isToday ? "text-[#0026f6] dark:text-white" : "text-gray-700 dark:text-gray-300")}>{d.getDate()}</p>
                    {count > 0 && (
                      <span className="inline-block mt-0.5 w-4 h-4 rounded-full bg-[#0026f6] dark:bg-white text-white dark:text-[#0026f6] text-[9px] font-bold leading-4">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Reservations per day */}
            <div className="grid grid-cols-7 min-h-[180px]">
              {weekDays.map((d, i) => {
                const dayRes = resForDate(fmtDate(d));
                const isToday = fmtDate(d) === todayStr;
                return (
                  <div key={i} className={cn("px-1.5 py-2 border-r last:border-r-0 border-gray-100 dark:border-gray-800 flex flex-col gap-1", isToday && "bg-[#f5f6ff] dark:bg-[#0026f6]/10")}>
                    {dayRes.length === 0 ? (
                      <span className="text-[9px] text-gray-300 dark:text-gray-700 px-1">—</span>
                    ) : (
                      dayRes.map((r) => {
                        const cfg = STATUS_CONFIG[r.status];
                        return (
                          <button
                            key={r.id}
                            onClick={() => setViewReservation(r)}
                            className={cn("w-full text-left px-1.5 py-1 rounded text-[9px] font-medium border hover:opacity-80 transition-opacity leading-tight", cfg.color)}
                          >
                            <div className="flex items-center gap-0.5">
                              <Clock className="w-2 h-2 flex-shrink-0" />
                              <span>{r.time}</span>
                            </div>
                            <div className="truncate mt-0.5">{r.customerName}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MONTHLY VIEW ── */}
        {viewMode === "monthly" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-4">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
              {DAY_HEADERS.map((h) => (
                <div key={h} className="px-2 py-2 text-center text-[10px] font-medium text-gray-400 border-r last:border-r-0 border-gray-100 dark:border-gray-800">{h}</div>
              ))}
            </div>
            {/* Month grid */}
            <div className="grid grid-cols-7">
              {monthDays.map((d, i) => {
                if (!d) return <div key={i} className="border-r last:border-r-0 border-b border-gray-100 dark:border-gray-800 min-h-[80px] bg-gray-50/50 dark:bg-gray-800/20" />;
                const dateStr = fmtDate(d);
                const dayRes = resForDate(dateStr);
                const isToday = dateStr === todayStr;
                return (
                  <div key={i} className={cn("border-r last:border-r-0 border-b border-gray-100 dark:border-gray-800 min-h-[80px] p-1.5", isToday && "bg-[#f5f6ff] dark:bg-[#0026f6]/10")}>
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold mb-1", isToday ? "bg-[#0026f6] text-white" : "text-gray-600 dark:text-gray-400")}>
                      {d.getDate()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayRes.slice(0, 2).map((r) => {
                        const cfg = STATUS_CONFIG[r.status];
                        return (
                          <button
                            key={r.id}
                            onClick={() => setViewReservation(r)}
                            className={cn("w-full text-left px-1 py-0.5 rounded text-[8px] font-medium border hover:opacity-80 transition-opacity truncate", cfg.color)}
                          >
                            {r.time} {r.customerName}
                          </button>
                        );
                      })}
                      {dayRes.length > 2 && (
                        <span className="text-[8px] text-gray-400 px-1">+{dayRes.length - 2} {tr("daha", "more")}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LIST VIEW (Table) ── */}
        {viewMode === "list" && (
        <>{/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("ID", "ID")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("MÜŞTƏRİ", "CUSTOMER")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("XİDMƏT", "SERVICE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("TARİX & SAAT", "DATE & TIME")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("STATUS", "STATUS")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("ƏMƏLİYYATLAR", "ACTIONS")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-400">
                      {tr("Rezervasiya tapılmadı", "No reservations found")}
                    </td>
                  </tr>
                ) : (
                  pagedReservations.map((res, index) => {
                    const cfg = STATUS_CONFIG[res.status];
                    return (
                      <tr
                        key={res.id}
                        className={`border-b border-gray-200 dark:border-gray-800 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}
                      >
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{res.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div>
                            <p className="text-xs text-gray-900 dark:text-white">{res.customerName}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                              <Phone className="w-2.5 h-2.5" />{res.customerPhone}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {serviceLabelFor(res.serviceType).split("/")[0].trim()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(res.date, language)}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{res.time}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border", cfg.color)}>
                            <cfg.icon className="w-2.5 h-2.5" />
                            {pickLang(language, cfg.labelAz, cfg.label)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewReservation(res)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title={tr("Bax", "View")}
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            {canEdit && (
                            <button
                              onClick={() => openEditModal(res)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title={tr("Redaktə Et", "Edit")}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            )}
                            {canDelete && (
                            <button
                              onClick={() => setDeleteId(res.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title={tr("Sil", "Delete")}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              showText={{
                showing: tr("Göstərilir", "Showing"),
                to: tr("-", "to"),
                of: tr("/", "of"),
                results: tr("nəticə", "results"),
              }}
            />
          </div>
        </div>
        </>
        )}
      </div>

      {/* Reservation Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Rezervasiya Parametrləri", "Reservation Settings")}
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  {tr("Rezervasiya səhifəsi", "Booking page")}
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingPageMode"
                      checked={(draftConfig.bookingPageMode ?? "shared") === "shared"}
                      onChange={() => setDraftConfig((d) => ({ ...d, bookingPageMode: "shared" }))}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium block">{tr("Ümumi səhifə", "Shared page for all branches")}</span>
                      <span className="text-[10px] text-gray-500">{tr("Bütün filiallar üçün tək link", "One link for every branch")}</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingPageMode"
                      checked={draftConfig.bookingPageMode === "per_branch"}
                      onChange={() => setDraftConfig((d) => ({ ...d, bookingPageMode: "per_branch", branchPages: d.branchPages ?? {} }))}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium block">{tr("Filial üzrə ayrı səhifələr", "Separate page per branch")}</span>
                      <span className="text-[10px] text-gray-500">{tr("Hər filial üçün öz məlumat və link", "Custom info and link for each branch")}</span>
                    </span>
                  </label>
                </div>
              </div>

              {draftConfig.bookingPageMode === "per_branch" && (
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    {tr("Filial səhifələri", "Branch landing pages")}
                  </label>
                  <BranchBookingPagesEditor
                    tenantSlug={tenantSlug}
                    branchPages={draftConfig.branchPages ?? {}}
                    onChange={(branchPages) => setDraftConfig((d) => ({ ...d, branchPages }))}
                    tr={tr}
                  />
                </div>
              )}

              {/* Slot Interval */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  {tr("Zaman Aralığı", "Time Slot Interval")}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[15, 20, 30, 45, 60].map(min => (
                    <button key={min} type="button"
                      onClick={() => setDraftConfig(d => ({ ...d, slotIntervalMinutes: min }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${draftConfig.slotIntervalMinutes === min ? "bg-[#0026f6] text-white border-[#0026f6]" : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#0026f6]/50"}`}>
                      {min} {tr("dəq", "min")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity per slot */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  {tr("Hər Slot üçün Maks. Rezervasiya", "Max Reservations per Slot")}
                </label>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setDraftConfig(d => ({ ...d, capacityPerSlot: Math.max(1, d.capacityPerSlot - 1) }))}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-lg transition-colors">−</button>
                  <span className="text-lg font-bold text-gray-900 dark:text-white w-8 text-center">{draftConfig.capacityPerSlot}</span>
                  <button type="button"
                    onClick={() => setDraftConfig(d => ({ ...d, capacityPerSlot: Math.min(20, d.capacityPerSlot + 1) }))}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-lg transition-colors">+</button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{tr("hər zaman slotu üçün rezervasiya", "bookings per time slot")}</span>
                </div>
              </div>

              {/* Working hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">{tr("Başlama Saatı", "Start Time")}</label>
                  <input type="time"
                    value={`${String(draftConfig.startHour).padStart(2,"0")}:${String(draftConfig.startMinute).padStart(2,"0")}`}
                    onChange={e => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      setDraftConfig(d => ({ ...d, startHour: h, startMinute: m }));
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">{tr("Bitmə Saatı", "End Time")}</label>
                  <input type="time"
                    value={`${String(draftConfig.endHour).padStart(2,"0")}:${String(draftConfig.endMinute).padStart(2,"0")}`}
                    onChange={e => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      setDraftConfig(d => ({ ...d, endHour: h, endMinute: m }));
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]" />
                </div>
              </div>

              {/* Working days */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">{tr("İş Günləri", "Working Days")}</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { d: 1, en: "Mon", az: "B.e" },
                    { d: 2, en: "Tue", az: "Ça" },
                    { d: 3, en: "Wed", az: "Çər" },
                    { d: 4, en: "Thu", az: "Ca" },
                    { d: 5, en: "Fri", az: "Cüm" },
                    { d: 6, en: "Sat", az: "Şnb" },
                    { d: 0, en: "Sun", az: "Baz" },
                  ].map(({ d, en, az }) => {
                    const active = draftConfig.workingDays.includes(d);
                    return (
                      <button key={d} type="button"
                        onClick={() => setDraftConfig(prev => ({
                          ...prev,
                          workingDays: active
                            ? prev.workingDays.filter(x => x !== d)
                            : [...prev.workingDays, d],
                        }))}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${active ? "bg-[#0026f6] text-white border-[#0026f6]" : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-[#0026f6]/40"}`}>
                        {pickLang(language, az, en)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{tr("Slot Önizləməsi", "Slot Preview")}</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {generateTimeSlots(draftConfig).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-400">{s}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">{generateTimeSlots(draftConfig).length} {tr("slot cəmi", "slots total")} · {tr("maks", "max")} {draftConfig.capacityPerSlot} {tr("hər slota", "per slot")}</p>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setShowSettings(false)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors">
                {tr("Ləğv Et", "Cancel")}
              </button>
              {canEdit && (
              <button
                onClick={() => void (async () => {
                  if (isDemo || !isAuthenticated) {
                    setResConfig({ ...draftConfig });
                    setShowSettings(false);
                    return;
                  }
                  if (!canEdit) return;
                  setSaving(true);
                  try {
                    const saved = await updateReservationSettings({
                      ...draftConfig,
                      serviceTypes,
                    });
                    setResConfig(saved);
                    setDraftConfig(saved);
                    if (saved.serviceTypes?.length) setServiceTypes(saved.serviceTypes);
                    setShowSettings(false);
                    notifySuccess(tr("Parametrlər yadda saxlanıldı", "Settings saved"));
                  } catch (err) {
                    notifyFromError(err);
                  } finally {
                    setSaving(false);
                  }
                })()}
                disabled={saving}
                className="px-4 py-1.5 bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {tr("Yadda Saxla", "Save")}
              </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Reservation Modal */}
      {isAddModalOpen && canCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Rezervasiya Əlavə Et", "Add Reservation")}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderForm()}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {tr("Ləğv Et", "Cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={!isFormValid || saving}
                className="px-4 py-1.5 bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tr("Təsdiq Et", "Submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reservation Modal */}
      {editReservation && canEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Rezervasiyanı Redaktə Et", "Edit Reservation")}
              </h2>
              <button onClick={() => { setEditReservation(null); resetForm(); }} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderForm()}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
              <button
                onClick={() => { setEditReservation(null); resetForm(); }}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {tr("Ləğv Et", "Cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={!isFormValid || saving}
                className="px-4 py-1.5 bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tr("Yadda Saxla", "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Reservation Modal */}
      {viewReservation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Rezervasiya Detalları", "Reservation Details")}
              </h2>
              <button onClick={() => setViewReservation(null)} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Rezervasiya ID", "Reservation ID")}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">{viewReservation.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Müştəri", "Customer")}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">{viewReservation.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Telefon", "Phone")}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{viewReservation.customerPhone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Filial", "Branch")}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {viewReservation.branchName ?? tr("Ümumi", "All branches")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Xidmət", "Service")}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{serviceLabelFor(viewReservation.serviceType).split("/")[0].trim()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Tarix & Saat", "Date & Time")}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(viewReservation.date, language)} — {viewReservation.time}</span>
              </div>
              {viewReservation.notes && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{tr("Qeydlər", "Notes")}</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{viewReservation.notes}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Status", "Status")}</span>
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border", STATUS_CONFIG[viewReservation.status].color)}>
                  {pickLang(language, STATUS_CONFIG[viewReservation.status].labelAz, STATUS_CONFIG[viewReservation.status].label)}
                </span>
              </div>
              {/* Quick status change */}
              {canEdit && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{tr("Statusu dəyiş", "Change Status")}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(["pending", "confirmed", "completed", "cancelled"] as ReservationStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { handleStatusChange(viewReservation.id, s); setViewReservation({ ...viewReservation, status: s }); }}
                      className={cn("px-2.5 py-1 text-[10px] rounded-lg border font-medium transition-colors", viewReservation.status === s ? STATUS_CONFIG[s].color + " ring-1 ring-offset-1 ring-current" : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}
                    >
                      {pickLang(language, STATUS_CONFIG[s].labelAz, STATUS_CONFIG[s].label)}
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
              {canEdit && (
              <button
                onClick={() => { setViewReservation(null); openEditModal(viewReservation); }}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {tr("Redaktə Et", "Edit")}
              </button>
              )}
              <button
                onClick={() => setViewReservation(null)}
                className="px-4 py-1.5 bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white rounded-lg text-xs font-medium transition-colors"
              >
                {tr("Bağla", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && canDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tr("Rezervasiyanı Sil", "Delete Reservation")}
              </h2>
              <button onClick={() => setDeleteId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{tr("Əminsiniz?", "Are you sure?")}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tr("Bu rezervasiya həmişəlik silinəcək.", "This reservation will be permanently deleted.")}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
                {tr("Ləğv Et", "Cancel")}
              </button>
              <button onClick={() => void handleDelete()} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {tr("Sil", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
