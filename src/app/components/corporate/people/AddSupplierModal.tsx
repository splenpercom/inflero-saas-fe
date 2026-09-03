import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import type { PeopleSupplier, UiPeopleStatus } from "../../../api/people";

import { pickLang } from "../../../i18n/pickLang";
export type SupplierFormData = {
  name: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  status: UiPeopleStatus;
};

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: SupplierFormData) => void | Promise<void>;
  supplier?: PeopleSupplier | null;
  saving?: boolean;
}

export function AddSupplierModal({
  isOpen,
  onClose,
  onSave,
  supplier,
  saving = false,
}: AddSupplierModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<UiPeopleStatus | "">("");

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const isEdit = Boolean(supplier);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmail("");
      setPhone("");
      setCountry("");
      setCompany("");
      setStatus("");
      return;
    }
    if (supplier) {
      setName(supplier.name);
      setEmail(supplier.email);
      setPhone(supplier.phone);
      setCountry(supplier.country);
      setCompany(supplier.company);
      setStatus(supplier.status);
    } else {
      setStatus("Active");
    }
  }, [isOpen, supplier]);

  const handleSave = async () => {
    if (!name.trim() || !status) return;
    await onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      country: country.trim(),
      company: company.trim(),
      status,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {isEdit ? tr("Təchizatçını Redaktə Et", "Edit Supplier") : tr("Təchizatçı Əlavə Et", "Add Supplier")}
          </h2>
          <button
            onClick={onClose}
            className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Ad", "Name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tr("Təchizatçı adı daxil edin", "Enter supplier name")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("E-poçt", "Email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tr("E-poçt daxil edin", "Enter email")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Telefon", "Phone")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={tr("Telefon nömrəsi daxil edin", "Enter phone number")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Ölkə", "Country")}
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={tr("Ölkə daxil edin", "Enter country")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Şirkət", "Company")}
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={tr("Şirkət adı daxil edin", "Enter company name")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Status", "Status")} <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UiPeopleStatus)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
              >
                <option value="Active">{tr("Aktiv", "Active")}</option>
                <option value="Inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!name.trim() || !status || saving}
            className="px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq Et", "Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
