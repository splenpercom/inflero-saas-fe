import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import type { StoreRecord, StoreManagerCandidate } from "../../../api/stores";
import type { UiPeopleStatus } from "../../../api/people";

import { pickLang } from "../../../i18n/pickLang";
export type BranchFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  status: UiPeopleStatus;
  branchManagerUserId: string;
};

interface AddWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BranchFormData) => void | Promise<void>;
  store?: StoreRecord | null;
  managers: StoreManagerCandidate[];
  saving?: boolean;
  /** When false (Branch Management off / first sole store), manager is optional. */
  requireBranchManager?: boolean;
}

export function AddWarehouseModal({
  isOpen,
  onClose,
  onSave,
  store,
  managers,
  saving = false,
  requireBranchManager = true,
}: AddWarehouseModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<UiPeopleStatus | "">("");
  const [branchManagerUserId, setBranchManagerUserId] = useState("");

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const isEdit = Boolean(store);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setStatus("");
      setBranchManagerUserId("");
      return;
    }
    if (store) {
      setName(store.name);
      setEmail(store.email ?? "");
      setPhone(store.phone ?? "");
      setAddress(store.address ?? "");
      setStatus(store.status);
      setBranchManagerUserId(store.branchManagerId ?? "");
    } else {
      setStatus("Active");
      if (managers.length === 1) setBranchManagerUserId(managers[0].id);
    }
  }, [isOpen, store, managers]);

  const handleSave = async () => {
    if (!name.trim() || !status) return;
    if (!isEdit && requireBranchManager && !branchManagerUserId) return;
    await onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status,
      branchManagerUserId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {isEdit ? tr("Filialı Redaktə Et", "Edit Branch") : tr("Filial Əlavə Et", "Add Branch")}
          </h2>
          <button onClick={onClose} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Ad", "Name")} <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("E-poçt", "Email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Telefon", "Phone")}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Ünvan", "Address")}</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Status", "Status")} <span className="text-red-500">*</span></label>
              <select value={status} onChange={(e) => setStatus(e.target.value as UiPeopleStatus)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="Active">{tr("Aktiv", "Active")}</option>
                <option value="Inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
              </select>
            </div>
          </div>
          {!isEdit && requireBranchManager && (
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Filial Meneceri", "Branch Manager")} <span className="text-red-500">*</span>
              </label>
              <select
                value={branchManagerUserId}
                onChange={(e) => setBranchManagerUserId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">{tr("Seç", "Select")}</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.roleName})
                  </option>
                ))}
              </select>
              {managers.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">
                  {tr("Filial meneceri üçün uyğun istifadəçi yoxdur (Manager/Administrator, başqa filialı idarə etmir).", "No eligible branch manager (active Manager/Administrator not already managing another branch).")}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button onClick={onClose} disabled={saving} className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs disabled:opacity-50">{tr("Ləğv Et", "Cancel")}</button>
          <button
            onClick={() => void handleSave()}
            disabled={
              !name.trim() ||
              !status ||
              saving ||
              (!isEdit && requireBranchManager && !branchManagerUserId)
            }
            className="px-4 py-1.5 bg-[#14b8a6] text-white rounded-lg text-xs disabled:opacity-50"
          >
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq Et", "Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
