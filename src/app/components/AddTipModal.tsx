import { useState } from "react";
import { DollarSign, Percent, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";

interface AddTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTotal: number;
  onSave: (tipAmount: number, tipNote: string) => void;
}

export function AddTipModal({
  isOpen,
  onClose,
  currentTotal,
  onSave,
}: AddTipModalProps) {
  const { language } = useLanguage();
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [tipNote, setTipNote] = useState("");

  if (!isOpen) return null;

  const suggestedPercentages = [5, 10, 15, 20];

  const calculateTipFromPercentage = (percentage: number) => {
    return (currentTotal * percentage) / 100;
  };

  const getTipAmount = () => {
    if (customAmount) {
      return parseFloat(customAmount) || 0;
    }
    if (selectedPercentage !== null) {
      return calculateTipFromPercentage(selectedPercentage);
    }
    return 0;
  };

  const getNewTotal = () => {
    return currentTotal + getTipAmount();
  };

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} ₼`;
  };

  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPercentage(null);
  };

  const handleSave = () => {
    onSave(getTipAmount(), tipNote);
  };

  const handleClearCustomAmount = () => {
    setCustomAmount("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === "en" ? "Add Tip" : "Bəxşiş Əlavə et"}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Suggested Tip Percentages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === "en" ? "Suggested Tip" : "Təklif olunan bəxşiş"}
              </label>
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Percent className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  {language === "en" ? "%" : "%"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {suggestedPercentages.map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  className={cn(
                    "py-3 rounded-xl text-sm font-semibold transition-all border-2",
                    selectedPercentage === percentage
                      ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600"
                  )}
                >
                  {percentage}%
                </button>
              ))}
            </div>
            {selectedPercentage !== null && (
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(calculateTipFromPercentage(selectedPercentage))}
                </p>
              </div>
            )}
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === "en" ? "Custom Amount" : "Xüsusi Məbləğ"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                ₼
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-10 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {customAmount && (
                <button
                  onClick={handleClearCustomAmount}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Tip Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === "en" ? "Tip Note" : "Bəxşiş Qeydi"}{" "}
              <span className="text-gray-400">
                ({language === "en" ? "Optional" : "İstəyə bağlı"})
              </span>
            </label>
            <textarea
              value={tipNote}
              onChange={(e) => setTipNote(e.target.value)}
              placeholder={language === "en" ? "Add a note with your tip..." : "Bəxşişinizlə qeyd əlavə edin..."}
              rows={4}
              className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {language === "en" ? "Current total" : "Cari cəmi"}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(currentTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600 dark:text-purple-400">
                {language === "en" ? "Tip Amount" : "Bəxşiş Məbləği"}
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                + {formatCurrency(getTipAmount())}
              </span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">
                {language === "en" ? "New Total" : "Yeni Cəmi"}
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(getNewTotal())}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {language === "en" ? "Cancel" : "Ləğv et"}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              {language === "en" ? "Save" : "Yadda saxla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}