import { useState, useEffect } from "react";
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

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleFormData) => void | Promise<void>;
  vehicle?: CustomerVehicle | null;
  saving?: boolean;
}

export function AddVehicleModal({
  isOpen,
  onClose,
  onSave,
  vehicle,
  saving = false,
}: AddVehicleModalProps) {
  const { language } = useLanguage();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [mileage, setMileage] = useState("");
  const [vin, setVin] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<UiPeopleStatus>("Active");

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const isEdit = Boolean(vehicle);

  useEffect(() => {
    if (!isOpen) return;
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(vehicle.year != null ? String(vehicle.year) : "");
      setPlate(vehicle.plate);
      setMileage(vehicle.mileage != null ? String(vehicle.mileage) : "");
      setVin(vehicle.vin);
      setNotes(vehicle.notes);
      setStatus(vehicle.status);
    } else {
      setMake("");
      setModel("");
      setYear("");
      setPlate("");
      setMileage("");
      setVin("");
      setNotes("");
      setStatus("Active");
    }
  }, [isOpen, vehicle]);

  const handleSave = async () => {
    if (!make.trim() && !model.trim() && !plate.trim()) return;
    await onSave({ make, model, year, plate, mileage, vin, notes, status });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {isEdit ? tr("Avtomobili Redaktə Et", "Edit Vehicle") : tr("Avtomobil Əlavə Et", "Add Vehicle")}
          </h2>
          <button onClick={onClose} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">{tr("Marka", "Make")}</label>
              <input value={make} onChange={(e) => setMake(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">{tr("Model", "Model")}</label>
              <input value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">{tr("İl", "Year")}</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">{tr("Nömrə", "Plate")}</label>
              <input value={plate} onChange={(e) => setPlate(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">{tr("Yürüş (km)", "Mileage")}</label>
              <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">VIN</label>
              <input value={vin} onChange={(e) => setVin(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">{tr("Qeydlər", "Notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          {isEdit && (
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">{tr("Status", "Status")}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as UiPeopleStatus)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="Active">{tr("Aktiv", "Active")}</option>
                <option value="Inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
              </select>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs disabled:opacity-50">{tr("Ləğv Et", "Cancel")}</button>
          <button onClick={() => void handleSave()} disabled={saving} className="px-4 py-1.5 bg-[#0026f6] text-white rounded-lg text-xs disabled:opacity-50">{saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq Et", "Submit")}</button>
        </div>
      </div>
    </div>
  );
}
