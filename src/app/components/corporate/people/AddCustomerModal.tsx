import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import type { PeopleCustomer, UiPeopleStatus } from "../../../api/people";

import { pickLang } from "../../../i18n/pickLang";
export type CustomerFormData = {
  name: string;
  email: string;
  phone: string;
  status?: UiPeopleStatus;
};

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: CustomerFormData) => void | Promise<void>;
  customer?: PeopleCustomer | null;
  saving?: boolean;
}

export function AddCustomerModal({
  isOpen,
  onClose,
  onSave,
  customer,
  saving = false,
}: AddCustomerModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<UiPeopleStatus>("Active");

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const isEdit = Boolean(customer);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmail("");
      setPhone("");
      setStatus("Active");
      return;
    }
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      setStatus(customer.status);
    } else {
      setStatus("Active");
    }
  }, [isOpen, customer]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ...(isEdit ? { status } : {}),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {isEdit ? tr("Müştərini Redaktə Et", "Edit Customer") : tr("Müştəri Əlavə Et", "Add Customer")}
          </h2>
          <button onClick={onClose} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Ad", "Name")} <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Müştəri adı daxil edin", "Enter customer name")} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("E-poçt", "Email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className={`grid gap-3 ${isEdit ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Telefon", "Phone")}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            {isEdit && (
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Status", "Status")}</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as UiPeopleStatus)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="Active">{tr("Aktiv", "Active")}</option>
                  <option value="Inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button onClick={onClose} disabled={saving} className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs disabled:opacity-50">{tr("Ləğv Et", "Cancel")}</button>
          <button onClick={() => void handleSave()} disabled={!name.trim() || saving} className="px-4 py-1.5 bg-[#14b8a6] text-white rounded-lg text-xs disabled:opacity-50">{saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq Et", "Submit")}</button>
        </div>
      </div>
    </div>
  );
}
