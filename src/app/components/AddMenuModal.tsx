import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface AddMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (menuData: { nameEn: string; nameAz: string }) => void;
}

export function AddMenuModal({ isOpen, onClose, onSave }: AddMenuModalProps) {
  const { t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "az">("en");
  const [menuNameEn, setMenuNameEn] = useState("");
  const [menuNameAz, setMenuNameAz] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMenuNameEn("");
      setMenuNameAz("");
      setSelectedLanguage("en");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (menuNameEn.trim() || menuNameAz.trim()) {
      onSave({ nameEn: menuNameEn, nameAz: menuNameAz });
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
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 xl:px-6 2xl:px-6 py-3 sm:py-3 xl:py-4 2xl:py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-base xl:text-lg 2xl:text-xl font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
            {t.addMenuTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-1.5 xl:p-2 2xl:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4 xl:w-5 xl:h-5 2xl:w-5 2xl:h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 xl:px-6 2xl:px-6 py-4 sm:py-4 xl:py-5 2xl:py-6 space-y-4 sm:space-y-4 xl:space-y-5 2xl:space-y-5">
          <p className="text-xs sm:text-xs xl:text-sm 2xl:text-base text-gray-600 dark:text-gray-400">
            {t.addMenuDescription}
          </p>

          {/* Language Selector */}
          <div>
            <label className="block text-xs sm:text-xs xl:text-sm 2xl:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-1.5 xl:mb-2 2xl:mb-2">
              {t.selectLanguage}
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as "en" | "az")}
              className="w-full px-3 sm:px-3 xl:px-4 2xl:px-4 py-2 sm:py-2 xl:py-2.5 2xl:py-2.5 text-xs sm:text-xs xl:text-sm 2xl:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="en">{t.english}</option>
              <option value="az">{t.azerbaijani}</option>
            </select>
          </div>

          {/* Menu Name (English) */}
          <div>
            <label className="block text-xs sm:text-xs xl:text-sm 2xl:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-1.5 xl:mb-2 2xl:mb-2">
              {t.menuNameEnglish}
            </label>
            <input
              type="text"
              value={menuNameEn}
              onChange={(e) => setMenuNameEn(e.target.value)}
              placeholder={`e.g. Breakfast`}
              className="w-full px-3 sm:px-3 xl:px-4 2xl:px-4 py-2 sm:py-2 xl:py-2.5 2xl:py-2.5 text-xs sm:text-xs xl:text-sm 2xl:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Menu Name (Azerbaijani) */}
          <div>
            <label className="block text-xs sm:text-xs xl:text-sm 2xl:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-1.5 xl:mb-2 2xl:mb-2">
              {t.menuNameAzerbaijani}
            </label>
            <input
              type="text"
              value={menuNameAz}
              onChange={(e) => setMenuNameAz(e.target.value)}
              placeholder={`məs. Səhər yeməyi`}
              className="w-full px-3 sm:px-3 xl:px-4 2xl:px-4 py-2 sm:py-2 xl:py-2.5 2xl:py-2.5 text-xs sm:text-xs xl:text-sm 2xl:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-2 xl:gap-3 2xl:gap-3 px-4 sm:px-5 xl:px-6 2xl:px-6 py-3 sm:py-3 xl:py-4 2xl:py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 sm:px-4 xl:px-5 2xl:px-6 py-2 sm:py-2 xl:py-2.5 2xl:py-2.5 text-xs sm:text-xs xl:text-sm 2xl:text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!menuNameEn.trim() && !menuNameAz.trim()}
            className="px-4 sm:px-4 xl:px-5 2xl:px-6 py-2 sm:py-2 xl:py-2.5 2xl:py-2.5 text-xs sm:text-xs xl:text-sm 2xl:text-base font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
