import { useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { toast } from "sonner";
import { DateInput } from "../ui/DateInput";

import { pickLang } from "../../i18n/pickLang";
interface AddMoneyTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transfer: {
    date: string;
    referenceNumber: string;
    fromAccount: string;
    toAccount: string;
    amount: number;
    note?: string;
  }) => void;
}

export function AddMoneyTransferModal({
  isOpen,
  onClose,
  onAdd,
}: AddMoneyTransferModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    referenceNumber: "",
    fromAccount: "",
    toAccount: "",
    amount: "",
    note: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromAccount || !formData.toAccount || !formData.amount) {
      toast.error(
        tr(
          "Zəhmət olmasa bütün tələb olunan sahələri doldurun",
          "Please fill in all required fields"
        )
      );
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error(tr("Məbləğ 0-dan böyük olmalıdır", "Amount must be greater than 0"));
      return;
    }

    if (formData.fromAccount === formData.toAccount) {
      toast.error(
        tr(
          "Göndərən və alan hesablar eyni ola bilməz",
          "From and To accounts cannot be the same"
        )
      );
      return;
    }

    const newTransfer = {
      date: formData.date,
      referenceNumber:
        formData.referenceNumber ||
        `#MT${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`,
      fromAccount: formData.fromAccount,
      toAccount: formData.toAccount,
      amount: parseFloat(formData.amount),
      note: formData.note,
    };

    onAdd(newTransfer);
    toast.success(
      tr(
        "Pul köçürməsi uğurla əlavə edildi",
        "Money transfer added successfully"
      )
    );
    setFormData({
      date: new Date().toISOString().split("T")[0],
      referenceNumber: "",
      fromAccount: "",
      toAccount: "",
      amount: "",
      note: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tr("Pul Köçürməsi Əlavə Et", "Add Money Transfer")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Tarix", "Date")} <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={formData.date}
              onChange={(date) =>
                setFormData({ ...formData, date })
              }
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              required
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("İstinad Nömrəsi", "Reference Number")}{" "}
              <span className="text-gray-400 text-[10px]">
                ({tr("avtomatik", "auto")})
              </span>
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) =>
                setFormData({ ...formData, referenceNumber: e.target.value })
              }
              placeholder={tr("Avtomatik yaradılacaq", "Will be auto-generated")}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
            />
          </div>

          {/* From Account */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Göndərən Hesab", "From Account")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.fromAccount}
              onChange={(e) =>
                setFormData({ ...formData, fromAccount: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              required
            >
              <option value="">
                {tr("Hesab seçin", "Select account")}
              </option>
              <option value="3298784309485">Bank of America - 3298784309485</option>
              <option value="5475878970090">Chase Bank - 5475878970090</option>
              <option value="3255465758698">Wells Fargo - 3255465758698</option>
              <option value="4353689870544">Citibank - 4353689870544</option>
              <option value="4324356677889">Capital Bank - 4324356677889</option>
            </select>
          </div>

          {/* To Account */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Alan Hesab", "To Account")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.toAccount}
              onChange={(e) =>
                setFormData({ ...formData, toAccount: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              required
            >
              <option value="">
                {tr("Hesab seçin", "Select account")}
              </option>
              <option value="4598489498498">PNC Bank - 4598489498498</option>
              <option value="4494048448994">TD Bank - 4494048448994</option>
              <option value="6599481186468">US Bank - 6599481186468</option>
              <option value="1948948498149">HSBC - 1948948498149</option>
              <option value="1686941868478">Santander - 1686941868478</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Məbləğ", "Amount")} (₼){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="0.00"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tr("Qeyd", "Note")}
            </label>
            <textarea
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              placeholder={tr("Qeyd əlavə edin...", "Add a note...")}
              rows={3}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {tr("Ləğv et", "Cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] rounded-lg transition-colors"
            >
              {tr("Əlavə Et", "Add Transfer")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
