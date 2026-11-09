import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLanguage } from "../../app/i18n/LanguageContext";
import { pickLang } from "../../app/i18n/pickLang";

type Props = {
  isOpen: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (data: { name: string; percent: number }) => void | Promise<void>;
};

export function CreateLoyaltyRateModal({ isOpen, saving = false, onClose, onSave }: Props) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("5");

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setPercent("5");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const p = Number(percent);
    if (!name.trim() || !Number.isFinite(p) || p < 0 || p > 100) return;
    await onSave({ name: name.trim(), percent: p });
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Yeni cashback tarifi", "New cashback rate")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <label className="block text-xs text-gray-500 dark:text-gray-400">
            {tr("Ad", "Name")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="block text-xs text-gray-500 dark:text-gray-400">
            {tr("Faiz (%)", "Percent (%)")}
            <input
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              type="number"
              min={0}
              max={100}
              step="0.01"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() => void handleSave()}
            className="rounded-lg bg-[#14b8a6] px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            {saving ? tr("Saxlanılır...", "Saving...") : tr("Yarat", "Create")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
