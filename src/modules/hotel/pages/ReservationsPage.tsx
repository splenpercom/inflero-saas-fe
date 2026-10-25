import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  createHotelReservation,
  fetchHotelReservations,
  fetchHotelRooms,
  updateHotelReservation,
  type HotelReservation,
  type HotelReservationStatus,
  type HotelRoom,
} from "../../../app/api/hotel";
import { createCustomer, fetchCustomers, type PeopleCustomer } from "../../../app/api/people";
import {
  createTenantUser,
  fetchTenantRoles,
  fetchTenantUsers,
  type TenantUserRow,
} from "../../../app/api/userManagement";
import { ApiError } from "../../../app/api/client";
import { useAuth } from "../../../app/context/AuthContext";
import { useBranch } from "../../../app/context/BranchContext";
import { useBranchRevision } from "../../../app/hooks/useBranchRevision";
import { useModulePermissions } from "../../../app/hooks/useModulePermissions";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { pickLang } from "../../../app/i18n/pickLang";
import { ModernSelect } from "../../../app/components/ui/ModernSelect";
import { DateInput } from "../../../app/components/ui/DateInput";
import {
  AddCustomerModal,
  type CustomerFormData,
} from "../../../app/components/corporate/people/AddCustomerModal";
import {
  AddUserModal,
  type AddUserFormData,
} from "../../../app/components/corporate/AddUserModal";
import { StatusPillDropdown } from "../../my-website/features/orders/WebOrderUi";
import { HotelRoomFormModal } from "../components/HotelRoomFormModal";

/** Active reservation status (BOOKED is legacy alias of RESERVED). */
type UiReservationStatus = "RESERVED" | "CANCELLED";

const inputCls =
  "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]";

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

type ResForm = {
  roomId: string;
  customerId: string;
  guestName: string;
  guestPhone: string;
  assigneeUserId: string;
  checkInAt: string;
  checkOutAt: string;
  status: HotelReservationStatus;
  notes: string;
};

function emptyForm(): ResForm {
  return {
    roomId: "",
    customerId: "",
    guestName: "",
    guestPhone: "",
    assigneeUserId: "",
    checkInAt: "",
    checkOutAt: "",
    status: "RESERVED",
    notes: "",
  };
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeStatus(status: HotelReservationStatus): UiReservationStatus {
  return status === "CANCELLED" ? "CANCELLED" : "RESERVED";
}

function fromReservation(r: HotelReservation): ResForm {
  return {
    roomId: r.roomId ?? "",
    customerId: r.customerId ?? "",
    guestName: r.guestName ?? "",
    guestPhone: r.guestPhone ?? "",
    assigneeUserId: r.assigneeUserId ?? "",
    checkInAt: toLocalInput(r.checkInAt),
    checkOutAt: toLocalInput(r.checkOutAt),
    status: normalizeStatus(r.status),
    notes: r.notes ?? "",
  };
}

const STATUS_STYLE: Record<UiReservationStatus, string> = {
  RESERVED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function ReservationsPage() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => pickLang(language, az, en);
  const { isDemo, isAuthenticated, user: authUser } = useAuth();
  const { branchId } = useBranch();
  const { canCreate, canEdit } = useModulePermissions("Hotel Reservations");
  const { canCreate: canCreateRoom } = useModulePermissions("Hotel Rooms");
  const { canCreate: canCreateCustomer } = useModulePermissions("Customers");
  const { canCreate: canCreateEmployee } = useModulePermissions("User Management");
  const branchRevision = useBranchRevision();
  const isOwnerActor = authUser?.isTenantOwner === true;

  const [rows, setRows] = useState<HotelReservation[]>([]);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [customers, setCustomers] = useState<PeopleCustomer[]>([]);
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [roleOptions, setRoleOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UiReservationStatus>("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "upcoming" | "past" | "no_dates" | "custom"
  >("all");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HotelReservation | null>(null);
  const [form, setForm] = useState<ResForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);

  const load = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [res, roomList, cust, emp] = await Promise.all([
        fetchHotelReservations({ status: "all", limit: 500 }),
        fetchHotelRooms(),
        fetchCustomers().catch(() => [] as PeopleCustomer[]),
        fetchTenantUsers().catch(() => [] as TenantUserRow[]),
      ]);
      setRows(res);
      setRooms(roomList);
      setCustomers(cust);
      setUsers(emp.filter((u) => u.status === "Active"));
    } catch (err) {
      toast.error(errMsg(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDemo, branchRevision, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const branchCustomers = useMemo(() => {
    if (!branchId) return customers;
    return customers.filter((c) => c.storeId === branchId);
  }, [customers, branchId]);

  const branchUsers = useMemo(() => {
    if (!branchId) return users;
    return users.filter(
      (u) =>
        u.storeId === branchId ||
        u.managedStoreIds.includes(branchId) ||
        (u.isTenantOwner && u.id === authUser?.id),
    );
  }, [users, branchId, authUser?.id]);

  useEffect(() => {
    if (!employeeModalOpen) return;
    let cancelled = false;
    fetchTenantRoles()
      .then((rows) => {
        if (cancelled) return;
        setRoleOptions(
          rows
            .filter((r) => {
              const n = r.name.toLowerCase();
              if (n === "administrator") return false;
              if (!isOwnerActor && n === "manager") return false;
              return true;
            })
            .map((r) => ({ id: r.id, name: r.name })),
        );
      })
      .catch(() => {
        if (!cancelled) setRoleOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeModalOpen, isOwnerActor]);

  const roomFilterOptions = useMemo(() => {
    const ids = new Set(rows.map((r) => r.roomId).filter(Boolean) as string[]);
    return rooms
      .filter((r) => ids.has(r.id) || r.status === "active")
      .map((r) => ({
        value: r.id,
        label: `${r.number != null ? `#${r.number} ` : ""}${r.name}`,
      }));
  }, [rooms, rows]);

  const customerFilterOptions = useMemo(() => {
    const allowed = new Set(branchCustomers.map((c) => c.id));
    const fromRows = new Map<string, string>();
    for (const r of rows) {
      if (r.customerId && r.customer?.name && allowed.has(r.customerId)) {
        fromRows.set(r.customerId, r.customer.name);
      }
    }
    for (const c of branchCustomers) {
      if (!fromRows.has(c.id)) fromRows.set(c.id, c.name);
    }
    return Array.from(fromRows.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [branchCustomers, rows]);

  const assigneeFilterOptions = useMemo(() => {
    const allowed = new Set(branchUsers.map((u) => u.id));
    const fromRows = new Map<string, string>();
    for (const r of rows) {
      if (r.assigneeUserId && r.assignee?.name && allowed.has(r.assigneeUserId)) {
        fromRows.set(r.assigneeUserId, r.assignee.name);
      }
    }
    for (const u of branchUsers) {
      if (!fromRows.has(u.id)) fromRows.set(u.id, u.name || u.email);
    }
    return Array.from(fromRows.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [branchUsers, rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("az");
    const now = Date.now();
    return rows.filter((r) => {
      if (statusFilter !== "all" && normalizeStatus(r.status) !== statusFilter) return false;
      if (roomFilter !== "all" && r.roomId !== roomFilter) return false;
      if (customerFilter === "none") {
        if (r.customerId) return false;
      } else if (customerFilter !== "all" && r.customerId !== customerFilter) {
        return false;
      }
      if (assigneeFilter === "none") {
        if (r.assigneeUserId) return false;
      } else if (assigneeFilter !== "all" && r.assigneeUserId !== assigneeFilter) {
        return false;
      }
      if (dateFilter === "no_dates") {
        if (r.checkInAt || r.checkOutAt) return false;
      } else if (dateFilter === "upcoming") {
        const t = r.checkInAt ? new Date(r.checkInAt).getTime() : NaN;
        if (!Number.isFinite(t) || t < now) return false;
      } else if (dateFilter === "past") {
        const t = r.checkOutAt
          ? new Date(r.checkOutAt).getTime()
          : r.checkInAt
            ? new Date(r.checkInAt).getTime()
            : NaN;
        if (!Number.isFinite(t) || t >= now) return false;
      } else if (dateFilter === "custom") {
        if (!rangeFrom && !rangeTo) return true;
        const stayStart = r.checkInAt
          ? new Date(r.checkInAt).getTime()
          : r.checkOutAt
            ? new Date(r.checkOutAt).getTime()
            : NaN;
        const stayEnd = r.checkOutAt
          ? new Date(r.checkOutAt).getTime()
          : r.checkInAt
            ? new Date(r.checkInAt).getTime()
            : NaN;
        if (!Number.isFinite(stayStart) || !Number.isFinite(stayEnd)) return false;
        const fromMs = rangeFrom ? new Date(`${rangeFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
        const toMs = rangeTo ? new Date(`${rangeTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
        // Overlap: stay intersects [from, to]
        if (stayEnd < fromMs || stayStart > toMs) return false;
      }
      if (!q) return true;
      const hay = [
        r.room?.name,
        r.room?.number != null ? String(r.room.number) : "",
        r.customer?.name,
        r.customer?.phone,
        r.guestName,
        r.guestPhone,
        r.assignee?.name,
        r.assignee?.email,
        r.notes,
        r.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("az");
      return hay.includes(q);
    });
  }, [
    rows,
    search,
    statusFilter,
    roomFilter,
    customerFilter,
    assigneeFilter,
    dateFilter,
    rangeFrom,
    rangeTo,
  ]);

  const filtersActive =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    roomFilter !== "all" ||
    customerFilter !== "all" ||
    assigneeFilter !== "all" ||
    dateFilter !== "all" ||
    rangeFrom !== "" ||
    rangeTo !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRoomFilter("all");
    setCustomerFilter("all");
    setAssigneeFilter("all");
    setDateFilter("all");
    setRangeFrom("");
    setRangeTo("");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (r: HotelReservation) => {
    setEditing(r);
    setForm(fromReservation(r));
    setModalOpen(true);
  };

  const activeRooms = useMemo(() => rooms.filter((r) => r.status === "active"), [rooms]);

  const statusOptions = useMemo(
    () => [
      {
        value: "RESERVED" as const,
        label: tr("Rezerv", "Reserved"),
        colorClass: STATUS_STYLE.RESERVED,
      },
      {
        value: "CANCELLED" as const,
        label: tr("Ləğv", "Cancelled"),
        colorClass: STATUS_STYLE.CANCELLED,
      },
    ],
    [language],
  );

  const updateRowStatus = async (id: string, next: UiReservationStatus) => {
    const prev = rows.find((r) => r.id === id);
    if (!prev || normalizeStatus(prev.status) === next) return;
    setUpdatingStatusId(id);
    setRows((list) => list.map((r) => (r.id === id ? { ...r, status: next } : r)));
    try {
      const updated = await updateHotelReservation(id, { status: next });
      setRows((list) => list.map((r) => (r.id === id ? updated : r)));
      toast.success(tr("Status yeniləndi", "Status updated"));
    } catch (err) {
      setRows((list) => list.map((r) => (r.id === id ? prev : r)));
      toast.error(errMsg(err));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const roomId = form.roomId || null;
      const customerId = form.customerId || null;

      if (!roomId && !customerId && !form.guestName.trim()) {
        toast.warning(
          tr("Otaq və ya müştəri / qonaq adı lazımdır", "Room or customer / guest name is required"),
        );
        setSaving(false);
        return;
      }

      const body = {
        roomId,
        customerId,
        guestName: form.guestName.trim() || null,
        guestPhone: form.guestPhone.trim() || null,
        assigneeUserId: form.assigneeUserId || null,
        checkInAt: form.checkInAt ? new Date(form.checkInAt).toISOString() : null,
        checkOutAt: form.checkOutAt ? new Date(form.checkOutAt).toISOString() : null,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (editing) await updateHotelReservation(editing.id, body);
      else await createHotelReservation(body);

      toast.success(
        editing
          ? tr("Rezervasiya yeniləndi", "Reservation updated")
          : tr("Rezervasiya yaradıldı", "Reservation created"),
      );
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {tr("Rezervasiyalar", "Reservations")}
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {tr("Otel otaq rezervasiyaları", "Hotel room reservations")}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            <Plus className="w-3.5 h-3.5" />
            {tr("Rezervasiya", "Reservation")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            className={`${inputCls} pl-8`}
            placeholder={tr(
              "Qonaq, otaq, telefon, qeyd axtar...",
              "Search guest, room, phone, notes...",
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ModernSelect
          className="w-[130px]"
          minWidth={130}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          options={[
            { value: "all", label: tr("Status", "Status") },
            { value: "RESERVED", label: tr("Rezerv", "Reserved") },
            { value: "CANCELLED", label: tr("Ləğv", "Cancelled") },
          ]}
        />
        <ModernSelect
          className="w-[150px]"
          minWidth={150}
          value={roomFilter}
          onChange={setRoomFilter}
          searchable={roomFilterOptions.length > 6}
          searchPlaceholder={tr("Otaq axtar...", "Search room...")}
          options={[
            { value: "all", label: tr("Otaq", "Room") },
            ...roomFilterOptions,
          ]}
        />
        <ModernSelect
          className="w-[160px]"
          minWidth={160}
          value={customerFilter}
          onChange={setCustomerFilter}
          searchable={customerFilterOptions.length > 6}
          searchPlaceholder={tr("Müştəri axtar...", "Search customer...")}
          options={[
            { value: "all", label: tr("Müştəri", "Customer") },
            { value: "none", label: tr("Müştərisiz", "No customer") },
            ...customerFilterOptions,
          ]}
        />
        <ModernSelect
          className="w-[160px]"
          minWidth={160}
          value={assigneeFilter}
          onChange={setAssigneeFilter}
          searchable={assigneeFilterOptions.length > 6}
          searchPlaceholder={tr("İşçi axtar...", "Search employee...")}
          options={[
            { value: "all", label: tr("İşçi", "Employee") },
            { value: "none", label: tr("Təyin olunmayıb", "Unassigned") },
            ...assigneeFilterOptions,
          ]}
        />
        <ModernSelect
          className="w-[150px]"
          minWidth={150}
          value={dateFilter}
          onChange={(v) => {
            const next = v as typeof dateFilter;
            setDateFilter(next);
            if (next !== "custom") {
              setRangeFrom("");
              setRangeTo("");
            }
          }}
          options={[
            { value: "all", label: tr("Tarix", "Dates") },
            { value: "upcoming", label: tr("Gələcək", "Upcoming") },
            { value: "past", label: tr("Keçmiş", "Past") },
            { value: "no_dates", label: tr("Tarixsiz", "No dates") },
            { value: "custom", label: tr("Aralıq", "Custom range") },
          ]}
        />
        {dateFilter === "custom" && (
          <div className="flex items-center gap-1.5">
            <DateInput
              value={rangeFrom}
              onChange={setRangeFrom}
              className="w-[132px]"
              placeholder={tr("Başlanğıc", "From")}
            />
            <span className="text-xs text-gray-400">—</span>
            <DateInput
              value={rangeTo}
              onChange={setRangeTo}
              className="w-[132px]"
              placeholder={tr("Son", "To")}
            />
          </div>
        )}
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <X className="w-3 h-3" />
            {tr("Təmizlə", "Clear")}
          </button>
        )}
        {!loading && rows.length > 0 && (
          <span className="text-[10px] text-gray-400 ml-auto">
            {filteredRows.length}/{rows.length}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-xs text-gray-400">
          {tr("Rezervasiya yoxdur", "No reservations yet")}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-xs text-gray-400">
          {tr("Uyğun rezervasiya tapılmadı", "No reservations match filters")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left">
                <th className="px-3 py-2 text-[10px] uppercase text-gray-500">{tr("Otaq", "Room")}</th>
                <th className="px-3 py-2 text-[10px] uppercase text-gray-500">{tr("Müştəri", "Customer")}</th>
                <th className="px-3 py-2 text-[10px] uppercase text-gray-500">{tr("İşçi", "Assignee")}</th>
                <th className="px-3 py-2 text-[10px] uppercase text-gray-500">{tr("Giriş / Çıxış", "Check-in / out")}</th>
                <th className="px-3 py-2 text-[10px] uppercase text-gray-500">{tr("Status", "Status")}</th>
                <th className="px-3 py-2 text-[10px] uppercase text-gray-500" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-3 py-2.5 text-xs text-gray-900 dark:text-white">
                    {r.room?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300">
                    {r.customer?.name || r.guestName || "—"}
                    {(r.customer?.phone || r.guestPhone) && (
                      <span className="block text-[10px] text-gray-400">
                        {r.customer?.phone || r.guestPhone}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300">
                    {r.assignee?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-gray-600 dark:text-gray-400">
                    {r.checkInAt ? new Date(r.checkInAt).toLocaleString() : "—"}
                    <br />
                    {r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {canEdit ? (
                      <StatusPillDropdown
                        value={normalizeStatus(r.status)}
                        disabled={updatingStatusId === r.id}
                        title={tr("Statusu dəyişmək üçün klikləyin", "Click to change status")}
                        options={statusOptions}
                        onChange={(next) => void updateRowStatus(r.id, next)}
                      />
                    ) : (
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLE[normalizeStatus(r.status)]}`}
                      >
                        {normalizeStatus(r.status) === "CANCELLED"
                          ? tr("Ləğv", "Cancelled")
                          : tr("Rezerv", "Reserved")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {canEdit && (
                      <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editing
                  ? tr("Rezervasiyanı redaktə et", "Edit reservation")
                  : tr("Yeni rezervasiya", "New reservation")}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase">{tr("Otaq", "Room")}</label>
                <div className="flex items-center gap-1.5">
                  <ModernSelect
                    className="flex-1 min-w-0"
                    value={form.roomId}
                    onChange={(roomId) => setForm((f) => ({ ...f, roomId }))}
                    placeholder={tr("Seçin", "Select")}
                    searchable
                    searchPlaceholder={tr("Otaq axtar...", "Search room...")}
                    options={[
                      { value: "", label: tr("Seçin", "Select") },
                      ...activeRooms.map((r) => ({
                        value: r.id,
                        label: `${r.number != null ? `#${r.number} ` : ""}${r.name}`,
                      })),
                    ]}
                  />
                  {canCreateRoom && (
                    <button
                      type="button"
                      title={tr("Yeni otaq", "New room")}
                      onClick={() => setRoomModalOpen(true)}
                      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 text-[#14b8a6] hover:bg-[#14b8a6]/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">{tr("Müştəri", "Customer")}</label>
                <div className="flex items-center gap-1.5">
                  <ModernSelect
                    className="flex-1 min-w-0"
                    value={form.customerId}
                    onChange={(customerId) => setForm((f) => ({ ...f, customerId }))}
                    placeholder={tr("Seçin", "Select")}
                    searchable
                    searchPlaceholder={tr("Müştəri axtar...", "Search customer...")}
                    options={[
                      { value: "", label: tr("Seçin", "Select") },
                      ...branchCustomers.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                  {canCreateCustomer && (
                    <button
                      type="button"
                      title={tr("Yeni müştəri", "New customer")}
                      onClick={() => setCustomerModalOpen(true)}
                      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 text-[#14b8a6] hover:bg-[#14b8a6]/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">{tr("Qonaq", "Guest")}</label>
                <p className="text-[10px] text-gray-400 mb-1.5">
                  {tr(
                    "İstəyə bağlı — müştəri seçilibsə; və ya walk-in üçün",
                    "Optional if a customer is selected; use for walk-ins",
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">{tr("Ad", "Name")}</label>
                    <input
                      className={inputCls}
                      value={form.guestName}
                      onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">{tr("Telefon", "Phone")}</label>
                    <input
                      className={inputCls}
                      value={form.guestPhone}
                      onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">{tr("Təyin olunmuş işçi", "Assignee")}</label>
                <div className="flex items-center gap-1.5">
                  <ModernSelect
                    className="flex-1 min-w-0"
                    value={form.assigneeUserId}
                    onChange={(assigneeUserId) => setForm((f) => ({ ...f, assigneeUserId }))}
                    placeholder={tr("Seçin", "Select")}
                    searchable
                    searchPlaceholder={tr("İşçi axtar...", "Search employee...")}
                    options={[
                      { value: "", label: tr("Seçin", "Select") },
                      ...branchUsers.map((u) => ({ value: u.id, label: u.name || u.email })),
                    ]}
                  />
                  {canCreateEmployee && (
                    <button
                      type="button"
                      title={tr("Yeni işçi", "New employee")}
                      onClick={() => setEmployeeModalOpen(true)}
                      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 text-[#14b8a6] hover:bg-[#14b8a6]/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase">{tr("Giriş", "Check-in")}</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={form.checkInAt}
                    onChange={(e) => setForm((f) => ({ ...f, checkInAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase">{tr("Çıxış", "Check-out")}</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={form.checkOutAt}
                    onChange={(e) => setForm((f) => ({ ...f, checkOutAt: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">{tr("Status", "Status")}</label>
                <ModernSelect
                  value={normalizeStatus(form.status)}
                  onChange={(v) => setForm((f) => ({ ...f, status: v as UiReservationStatus }))}
                  options={[
                    { value: "RESERVED", label: tr("Rezerv", "Reserved") },
                    { value: "CANCELLED", label: tr("Ləğv", "Cancelled") },
                  ]}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">{tr("Qeyd", "Notes")}</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700">
                {tr("Ləğv et", "Cancel")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#14b8a6] text-white disabled:opacity-50"
              >
                {saving ? tr("Saxlanılır...", "Saving...") : tr("Saxla", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <HotelRoomFormModal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        zIndexClassName="z-[60]"
        onSaved={(room) => {
          setRooms((prev) => {
            if (prev.some((r) => r.id === room.id)) {
              return prev.map((r) => (r.id === room.id ? room : r));
            }
            return [...prev, room];
          });
          if (room.status === "active") {
            setForm((f) => ({ ...f, roomId: room.id }));
          }
        }}
      />

      <AddCustomerModal
        isOpen={customerModalOpen}
        onClose={() => {
          if (!savingCustomer) setCustomerModalOpen(false);
        }}
        saving={savingCustomer}
        onSave={async (data: CustomerFormData) => {
          setSavingCustomer(true);
          try {
            const created = await createCustomer({
              name: data.name,
              email: data.email || null,
              phone: data.phone || null,
              status: data.status,
            });
            setCustomers((prev) => {
              if (prev.some((c) => c.id === created.id)) return prev;
              return [...prev, { ...created, storeId: created.storeId ?? branchId }];
            });
            setForm((f) => ({ ...f, customerId: created.id }));
            setCustomerModalOpen(false);
            toast.success(tr("Müştəri yaradıldı", "Customer created"));
          } catch (err) {
            toast.error(errMsg(err));
          } finally {
            setSavingCustomer(false);
          }
        }}
      />

      <AddUserModal
        key={employeeModalOpen ? "add-employee-open" : "add-employee-closed"}
        isOpen={employeeModalOpen}
        onClose={() => {
          if (!savingEmployee) setEmployeeModalOpen(false);
        }}
        roles={roleOptions}
        showBranchSelect={false}
        saving={savingEmployee}
        onSave={async (data: AddUserFormData) => {
          if (!data.roleId) {
            toast.warning(tr("Rol seçin", "Select a role"));
            return;
          }
          if (data.password !== data.confirmPassword) {
            toast.warning(tr("Şifrələr uyğun gəlmir", "Passwords do not match"));
            return;
          }
          if (!branchId) {
            toast.warning(
              tr("İşçi əlavə etmək üçün filial seçin", "Select a branch to add an employee"),
            );
            return;
          }
          setSavingEmployee(true);
          try {
            const created = await createTenantUser({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              password: data.password,
              roleId: data.roleId,
              storeId: branchId,
              dateOfBirth: data.dateOfBirth || null,
              dateOfJoin: data.joiningDate || null,
            });
            setUsers((prev) => {
              if (prev.some((u) => u.id === created.id)) return prev;
              return [...prev, { ...created, storeId: created.storeId ?? branchId }];
            });
            setForm((f) => ({ ...f, assigneeUserId: created.id }));
            setEmployeeModalOpen(false);
            toast.success(tr("İşçi əlavə edildi", "Employee added"));
          } catch (err) {
            toast.error(errMsg(err));
          } finally {
            setSavingEmployee(false);
          }
        }}
      />
    </div>
  );
}
