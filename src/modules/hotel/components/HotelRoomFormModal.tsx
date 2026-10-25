import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  createHotelRoom,
  updateHotelRoom,
  type HotelBedConfigItem,
  type HotelRoom,
} from "../../../app/api/hotel";
import { ApiError } from "../../../app/api/client";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { pickLang } from "../../../app/i18n/pickLang";
import { ModernSelect } from "../../../app/components/ui/ModernSelect";
import { facilityLabel } from "../facilityLabels";

const FACILITY_PRESETS = ["smoking", "balcony", "sea_view", "wifi", "ac", "mini_bar", "bathtub"];
const BED_TYPES = ["SINGLE", "DOUBLE", "QUEEN", "KING"];

const inputCls =
  "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]";

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

type RoomForm = {
  name: string;
  number: string;
  weekdayPrice: string;
  weekendPrice: string;
  maxGuests: string;
  facilities: string[];
  beds: HotelBedConfigItem[];
  status: "ACTIVE" | "INACTIVE";
};

function emptyForm(): RoomForm {
  return {
    name: "",
    number: "",
    weekdayPrice: "",
    weekendPrice: "",
    maxGuests: "",
    facilities: [],
    beds: [{ type: "QUEEN", count: 1 }],
    status: "ACTIVE",
  };
}

function fromRoom(r: HotelRoom): RoomForm {
  return {
    name: r.name,
    number: r.number != null ? String(r.number) : "",
    weekdayPrice: r.weekdayPrice != null ? String(r.weekdayPrice) : "",
    weekendPrice: r.weekendPrice != null ? String(r.weekendPrice) : "",
    maxGuests: r.maxGuests != null ? String(r.maxGuests) : "",
    facilities: [...(r.facilities ?? [])],
    beds: r.bedConfig?.length ? r.bedConfig.map((b) => ({ ...b })) : [],
    status: r.status === "inactive" ? "INACTIVE" : "ACTIVE",
  };
}

type Props = {
  open: boolean;
  editing?: HotelRoom | null;
  onClose: () => void;
  onSaved: (room: HotelRoom) => void;
  /** Higher when stacked over another modal (e.g. reservation form). */
  zIndexClassName?: string;
};

export function HotelRoomFormModal({
  open,
  editing = null,
  onClose,
  onSaved,
  zIndexClassName = "z-50",
}: Props) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => pickLang(language, az, en);
  const [form, setForm] = useState<RoomForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [facilityDraft, setFacilityDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromRoom(editing) : emptyForm());
    setFacilityDraft("");
  }, [open, editing]);

  if (!open) return null;

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning(tr("Otaq adı tələb olunur", "Room name is required"));
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        number: form.number.trim() ? Number(form.number) : null,
        weekdayPrice: form.weekdayPrice.trim() ? Number(form.weekdayPrice) : null,
        weekendPrice: form.weekendPrice.trim() ? Number(form.weekendPrice) : null,
        maxGuests: form.maxGuests.trim() ? Number(form.maxGuests) : null,
        facilities: form.facilities,
        bedConfig: form.beds.length ? form.beds : null,
        status: form.status,
      };
      const room = editing
        ? await updateHotelRoom(editing.id, body)
        : await createHotelRoom(body);
      toast.success(
        editing ? tr("Otaq yeniləndi", "Room updated") : tr("Otaq yaradıldı", "Room created"),
      );
      onSaved(room);
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4 bg-black/40`}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {editing ? tr("Otağı redaktə et", "Edit room") : tr("Yeni otaq", "New room")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] text-gray-400 uppercase">{tr("Ad", "Name")} *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 uppercase">{tr("Nömrə", "Number")}</label>
              <input
                className={inputCls}
                value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase">
                {tr("Maks. qonaq", "Max guests")}
              </label>
              <input
                className={inputCls}
                value={form.maxGuests}
                onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 uppercase">
                {tr("Həftəiçi qiymət", "Weekday price")}
              </label>
              <input
                className={inputCls}
                value={form.weekdayPrice}
                onChange={(e) => setForm((f) => ({ ...f, weekdayPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase">
                {tr("Həftəsonu qiymət", "Weekend price")}
              </label>
              <input
                className={inputCls}
                value={form.weekendPrice}
                onChange={(e) => setForm((f) => ({ ...f, weekendPrice: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase">{tr("İmkanlar", "Facilities")}</label>
            <div className="flex flex-wrap gap-1 mt-1 mb-2">
              {FACILITY_PRESETS.map((p) => {
                const on = form.facilities.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        facilities: on ? f.facilities.filter((x) => x !== p) : [...f.facilities, p],
                      }))
                    }
                    className={`px-2 py-0.5 rounded-full text-[10px] border ${
                      on
                        ? "bg-[#14b8a6] border-[#14b8a6] text-white"
                        : "border-gray-300 dark:border-gray-700 text-gray-600"
                    }`}
                  >
                    {facilityLabel(p, language)}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1">
              <input
                className={inputCls}
                placeholder={tr("Öz tag-ınız", "Custom tag")}
                value={facilityDraft}
                onChange={(e) => setFacilityDraft(e.target.value)}
              />
              <button
                type="button"
                className="px-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700"
                onClick={() => {
                  const t = facilityDraft.trim();
                  if (!t || form.facilities.includes(t)) return;
                  setForm((f) => ({ ...f, facilities: [...f.facilities, t] }));
                  setFacilityDraft("");
                }}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-gray-400 uppercase">{tr("Çarpayılar", "Beds")}</label>
              <button
                type="button"
                className="text-[10px] text-[#14b8a6]"
                onClick={() =>
                  setForm((f) => ({ ...f, beds: [...f.beds, { type: "SINGLE", count: 1 }] }))
                }
              >
                + {tr("əlavə et", "add")}
              </button>
            </div>
            <div className="space-y-1.5 mt-1">
              {form.beds.map((b, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <ModernSelect
                    className="!w-[132px] shrink-0"
                    minWidth={132}
                    value={b.type}
                    onChange={(type) =>
                      setForm((f) => ({
                        ...f,
                        beds: f.beds.map((x, j) => (j === i ? { ...x, type } : x)),
                      }))
                    }
                    options={BED_TYPES.map((t) => ({ value: t, label: t }))}
                  />
                  <input
                    className="w-14 shrink-0 px-2 py-1.5 text-xs text-center border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    type="number"
                    min={1}
                    value={b.count}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        beds: f.beds.map((x, j) =>
                          j === i ? { ...x, count: Math.max(1, Number(e.target.value) || 1) } : x,
                        ),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="shrink-0 px-1.5 text-xs text-red-500"
                    onClick={() =>
                      setForm((f) => ({ ...f, beds: f.beds.filter((_, j) => j !== i) }))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase">{tr("Status", "Status")}</label>
            <ModernSelect
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v as "ACTIVE" | "INACTIVE" }))}
              options={[
                { value: "ACTIVE", label: tr("Aktiv", "Active") },
                { value: "INACTIVE", label: tr("Passiv", "Inactive") },
              ]}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700"
          >
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
  );
}
