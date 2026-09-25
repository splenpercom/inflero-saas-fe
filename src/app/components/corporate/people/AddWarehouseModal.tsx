import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import {
  fetchStoreManagerCandidates,
  type StoreManagerCandidate,
  type StoreRecord,
} from "../../../api/stores";
import type { UiPeopleStatus } from "../../../api/people";
import { ModernSelect } from "../../ui/ModernSelect";

import { pickLang } from "../../../i18n/pickLang";
export type BranchFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  status: UiPeopleStatus;
  /** Edit only — empty string clears manager. */
  branchManagerUserId?: string;
};

interface AddWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BranchFormData) => void | Promise<void>;
  store?: StoreRecord | null;
  saving?: boolean;
}

export function AddWarehouseModal({
  isOpen,
  onClose,
  onSave,
  store,
  saving = false,
}: AddWarehouseModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<UiPeopleStatus | "">("");
  const [branchManagerUserId, setBranchManagerUserId] = useState("");
  const [managers, setManagers] = useState<StoreManagerCandidate[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);

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
      setManagers([]);
      setManagersLoading(false);
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
      setBranchManagerUserId("");
    }
  }, [isOpen, store]);

  useEffect(() => {
    if (!isOpen || !store?.id) {
      setManagers([]);
      return;
    }
    let cancelled = false;
    setManagersLoading(true);
    void fetchStoreManagerCandidates(store.id)
      .then((rows) => {
        if (cancelled) return;
        const merged = [...rows];
        if (
          store.branchManager &&
          !merged.some((m) => m.id === store.branchManager!.id)
        ) {
          merged.unshift({
            id: store.branchManager.id,
            firstName: store.branchManager.firstName,
            lastName: store.branchManager.lastName,
            email: store.branchManager.email,
            roleName: tr("Menecer", "Manager"),
          });
        }
        setManagers(merged);
      })
      .catch(() => {
        if (cancelled) return;
        if (store.branchManager) {
          setManagers([
            {
              id: store.branchManager.id,
              firstName: store.branchManager.firstName,
              lastName: store.branchManager.lastName,
              email: store.branchManager.email,
              roleName: tr("Menecer", "Manager"),
            },
          ]);
        } else {
          setManagers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setManagersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, store, language]);

  const handleSave = async () => {
    if (!name.trim() || !status) return;
    await onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status,
      ...(isEdit ? { branchManagerUserId } : {}),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
              <ModernSelect
                value={status}
                onChange={(value) => setStatus(value as UiPeopleStatus)}
                className="w-full"
                options={[
                  { value: "Active", label: tr("Aktiv", "Active") },
                  { value: "Inactive", label: tr("Qeyri-aktiv", "Inactive") },
                ]}
              />
            </div>
          </div>
          {isEdit ? (
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Filial Meneceri", "Branch Manager")}
              </label>
              <ModernSelect
                value={branchManagerUserId}
                onChange={setBranchManagerUserId}
                className="w-full"
                disabled={managersLoading}
                options={[
                  { value: "", label: tr("Menecer yoxdur", "No manager") },
                  ...managers.map((m) => ({
                    value: m.id,
                    label: `${m.firstName} ${m.lastName} (${m.roleName})`,
                  })),
                ]}
              />
              {managersLoading && (
                <p className="text-[10px] text-gray-500 mt-1">
                  {tr("Menecerlər yüklənir...", "Loading managers...")}
                </p>
              )}
              {!managersLoading && managers.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">
                  {tr(
                    "Uyğun menecer yoxdur (Manager/Administrator).",
                    "No eligible managers (Manager/Administrator).",
                  )}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {tr(
                "Menecer təyinatı İstifadəçi idarəetməsindən edilir.",
                "Assign managers later from User Management.",
              )}
            </p>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button onClick={onClose} disabled={saving} className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs disabled:opacity-50">{tr("Ləğv Et", "Cancel")}</button>
          <button
            onClick={() => void handleSave()}
            disabled={!name.trim() || !status || saving}
            className="px-4 py-1.5 bg-[#14b8a6] text-white rounded-lg text-xs disabled:opacity-50"
          >
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq Et", "Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
