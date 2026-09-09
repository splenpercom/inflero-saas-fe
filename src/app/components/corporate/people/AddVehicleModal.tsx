import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import type { CustomerVehicle, UiPeopleStatus } from "../../../api/people";
import { pickLang } from "../../../i18n/pickLang";

export type VehicleFormData = {
  make: string;
  model: string;
  year: string;
  plate: string;
  mileage: string;
  vin: string;
  notes: string;
  status: UiPeopleStatus;
};

export function AddVehicleModal({
  isOpen,
  onClose,
  onSave,
  vehicle,
  saving = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleFormData) => void | Promise<void>;
  vehicle?: CustomerVehicle | null;
  saving?: boolean;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => pickLang(language, az, en);
  const [form, setForm] = useState<VehicleFormData>({
    make: "", model: "", year: "", plate: "", mileage: "", vin: "", notes: "", status: "Active",
  });

  useEffect(() => {
    if (!isOpen) return;
    setForm(vehicle ? {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year == null ? "" : String(vehicle.year),
      plate: vehicle.plate,
      mileage: vehicle.mileage == null ? "" : String(vehicle.mileage),
      vin: vehicle.vin,
      notes: vehicle.notes,
      status: vehicle.status,
    } : { make: "", model: "", year: "", plate: "", mileage: "", vin: "", notes: "", status: "Active" });
  }, [isOpen, vehicle]);

  if (!isOpen) return null;
  const field = (key: keyof VehicleFormData, label: string, type = "text") => (
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
          <h2 className="text-sm font-semibold">{vehicle ? tr("Avtomobili redaktə et", "Edit vehicle") : tr("Avtomobil əlavə et", "Add vehicle")}</h2>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {field("make", tr("Marka", "Make"))}
          {field("model", tr("Model", "Model"))}
          {field("year", tr("İl", "Year"), "number")}
          {field("plate", tr("Nömrə", "Plate"))}
          {field("mileage", tr("Yürüş (km)", "Mileage"), "number")}
          {field("vin", "VIN")}
          <label className="col-span-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            {tr("Qeydlər", "Notes")}
            <textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs dark:border-gray-700 dark:bg-gray-800" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t p-4 dark:border-gray-800">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-xs">{tr("Ləğv et", "Cancel")}</button>
          <button
            type="button"
            disabled={saving || (!form.make.trim() && !form.model.trim() && !form.plate.trim())}
            onClick={() => void onSave(form)}
            className="rounded-lg bg-[#14b8a6] px-4 py-2 text-xs text-white disabled:opacity-50"
          >
            {saving ? tr("Saxlanılır...", "Saving...") : tr("Yadda saxla", "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}
