import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  deleteHotelRoom,
  fetchHotelRooms,
  type HotelRoom,
} from "../../../app/api/hotel";
import { ApiError } from "../../../app/api/client";
import { useAuth } from "../../../app/context/AuthContext";
import { useBranchRevision } from "../../../app/hooks/useBranchRevision";
import { useModulePermissions } from "../../../app/hooks/useModulePermissions";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { pickLang } from "../../../app/i18n/pickLang";
import { useConfirm } from "../../../app/context/ConfirmContext";
import { ModernSelect } from "../../../app/components/ui/ModernSelect";
import { HotelRoomFormModal } from "../components/HotelRoomFormModal";
import { facilityLabel } from "../facilityLabels";

const inputCls =
  "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]";

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export function RoomsPage() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => pickLang(language, az, en);
  const { isDemo, isAuthenticated } = useAuth();
  const { canCreate, canEdit, canDelete } = useModulePermissions("Hotel Rooms");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();

  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [guestsFilter, setGuestsFilter] = useState<"all" | "1" | "2" | "3" | "4+">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HotelRoom | null>(null);

  const load = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) {
      setRooms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRooms(await fetchHotelRooms());
    } catch (err) {
      toast.error(errMsg(err));
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDemo, branchRevision]);

  useEffect(() => {
    void load();
  }, [load]);

  const facilityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rooms) for (const f of r.facilities) set.add(f);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("az");
    return rooms.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (facilityFilter !== "all" && !r.facilities.includes(facilityFilter)) return false;
      if (guestsFilter !== "all") {
        const g = r.maxGuests;
        if (g == null) return false;
        if (guestsFilter === "4+") {
          if (g < 4) return false;
        } else if (g !== Number(guestsFilter)) {
          return false;
        }
      }
      if (!q) return true;
      const hay = `${r.number ?? ""} ${r.name} ${(r.facilities ?? []).join(" ")}`.toLocaleLowerCase("az");
      return hay.includes(q);
    });
  }, [rooms, search, statusFilter, facilityFilter, guestsFilter]);

  const filtersActive =
    search.trim() !== "" || statusFilter !== "all" || facilityFilter !== "all" || guestsFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFacilityFilter("all");
    setGuestsFilter("all");
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (r: HotelRoom) => {
    setEditing(r);
    setModalOpen(true);
  };

  const onDelete = async (r: HotelRoom) => {
    const ok = await askConfirm({
      title: tr("Otağı sil", "Delete room"),
      message: tr(`“${r.name}” silinsin?`, `Delete “${r.name}”?`),
      confirmLabel: tr("Sil", "Delete"),
      cancelLabel: tr("Ləğv et", "Cancel"),
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteHotelRoom(r.id);
      toast.success(tr("Otaq silindi", "Room deleted"));
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {tr("Otaqlar", "Rooms")}
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {tr("Filial üzrə otaq kataloqu", "Branch room catalog")}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            <Plus className="w-3.5 h-3.5" />
            {tr("Otaq əlavə et", "Add room")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            className={`${inputCls} pl-8`}
            placeholder={tr("Ad, nömrə, imkan axtar...", "Search name, number, facility...")}
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
            { value: "active", label: tr("Aktiv", "Active") },
            { value: "inactive", label: tr("Passiv", "Inactive") },
          ]}
        />
        <ModernSelect
          className="w-[140px]"
          minWidth={140}
          value={facilityFilter}
          onChange={setFacilityFilter}
          searchable={facilityOptions.length > 6}
          searchPlaceholder={tr("İmkan axtar...", "Search facility...")}
          options={[
            { value: "all", label: tr("İmkan", "Facility") },
            ...facilityOptions.map((f) => ({
              value: f,
              label: facilityLabel(f, language),
            })),
          ]}
        />
        <ModernSelect
          className="w-[130px]"
          minWidth={130}
          value={guestsFilter}
          onChange={(v) => setGuestsFilter(v as typeof guestsFilter)}
          options={[
            { value: "all", label: tr("Qonaq", "Guests") },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4+", label: "4+" },
          ]}
        />
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
        {!loading && rooms.length > 0 && (
          <span className="text-[10px] text-gray-400 ml-auto">
            {filteredRooms.length}/{rooms.length}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
      ) : rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-xs text-gray-400">
          {tr("Otaq yoxdur", "No rooms yet")}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-xs text-gray-400">
          {tr("Uyğun otaq tapılmadı", "No rooms match filters")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {r.number != null ? `#${r.number} · ` : ""}
                    {r.name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {r.status === "active" ? tr("Aktiv", "Active") : tr("Passiv", "Inactive")}
                    {r.maxGuests != null ? ` · ${r.maxGuests} ${tr("nəfər", "guests")}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => void onDelete(r)}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                {r.weekdayPrice != null && (
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {tr("Həftəiçi", "Weekday")}: {r.weekdayPrice}
                  </span>
                )}
                {r.weekendPrice != null && (
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {tr("Həftəsonu", "Weekend")}: {r.weekendPrice}
                  </span>
                )}
              </div>
              {r.facilities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.facilities.map((f) => (
                    <span
                      key={f}
                      className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#14b8a6]/10 text-[#0f766e]"
                    >
                      {facilityLabel(f, language)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <HotelRoomFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          void load();
        }}
      />
    </div>
  );
}
