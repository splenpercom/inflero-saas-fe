import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";

import { pickLang } from "../../../i18n/pickLang";
interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (storeData: {
    code: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
  }) => void;
}

export function AddStoreModal({ isOpen, onClose, onSave }: AddStoreModalProps) {
  const { language } = useLanguage();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setStatus("");
    }
  }, [isOpen]);

  const generateCode = () => {
    const randomCode = "STR" + Math.floor(Math.random() * 10000).toString().padStart(3, "0");
    setCode(randomCode);
  };

  const handleSave = () => {
    if (code && name && email && phone && address && status) {
      onSave({
        code,
        name,
        email,
        phone,
        address,
        status,
      });
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Mağaza Əlavə Et", "Add Store")}
          </h2>
          <button
            onClick={onClose}
            className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Row 1: Code, Name, Email */}
          <div className="grid grid-cols-3 gap-3">
            {/* Code */}
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Kod", "Code")} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={tr("Məsələn: STR001", "e.g., STR001")}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="px-2.5 py-1.5 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Ad", "Name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tr("Mağaza adı daxil edin", "Enter store name")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("E-poçt", "Email")} <span className="text-red-500">*</span>
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

          {/* Row 2: Phone, Address, Status */}
          <div className="grid grid-cols-3 gap-3">
            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Telefon", "Phone")} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={tr("Telefon nömrəsi daxil edin", "Enter phone number")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Ünvan", "Address")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={tr("Ünvan daxil edin", "Enter address")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Status", "Status")} <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
              >
                <option value="">{tr("Seç", "Select")}</option>
                <option value="Active">{tr("Aktiv", "Active")}</option>
                <option value="Inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!code || !name || !email || !phone || !address || !status}
            className="px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tr("Təsdiq Et", "Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
