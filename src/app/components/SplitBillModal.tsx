import { Plus, Calculator, ClipboardList, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";
import { useState } from "react";

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  totalAmount: number;
  onComplete: () => void;
}

type SplitMethod = "equal" | "custom" | "items" | null;

interface CustomSplit {
  id: string;
  amount: string;
  paymentMethod: string;
}

export function SplitBillModal({
  isOpen,
  onClose,
  orderNumber,
  totalAmount,
  onComplete,
}: SplitBillModalProps) {
  const { language } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<SplitMethod>(null);
  const [activeSplitTab, setActiveSplitTab] = useState(0);
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>([
    { id: "1", amount: "84", paymentMethod: "Cash" },
    { id: "2", amount: "84", paymentMethod: "Cash" },
  ]);

  if (!isOpen) return null;

  const splitMethods = [
    {
      id: "equal" as SplitMethod,
      icon: Plus,
      title: language === "en" ? "Equal Split" : "Bərabər Böl",
      description: language === "en" ? "Split equally" : "Bərabər paylaşdır",
    },
    {
      id: "custom" as SplitMethod,
      icon: Calculator,
      title: language === "en" ? "Custom Split" : "Xüsusi Böl",
      description: language === "en" ? "Split by amount" : "Məbləğə görə böl",
    },
    {
      id: "items" as SplitMethod,
      icon: ClipboardList,
      title: language === "en" ? "Split by Items" : "Məhsullara görə böl",
      description: language === "en" ? "Split by dishes" : "Yeməklərə görə böl",
    },
  ];

  const formatCurrency = (value: number) => {
    return language === "en" 
      ? `$${value.toFixed(2)}`
      : `${value.toFixed(2)} ₼`;
  };

  const handleSplitMethodSelect = (method: SplitMethod) => {
    setSelectedMethod(method);
  };

  const handleAddNewSplit = () => {
    const newSplit: CustomSplit = {
      id: (customSplits.length + 1).toString(),
      amount: "0",
      paymentMethod: "Cash",
    };
    setCustomSplits([...customSplits, newSplit]);
    setActiveSplitTab(customSplits.length);
  };

  const handleUpdateSplit = (id: string, field: keyof CustomSplit, value: string) => {
    setCustomSplits(customSplits.map(split => 
      split.id === id ? { ...split, [field]: value } : split
    ));
  };

  const handleRemoveSplit = (id: string) => {
    if (customSplits.length > 1) {
      setCustomSplits(customSplits.filter(split => split.id !== id));
      if (activeSplitTab >= customSplits.length - 1) {
        setActiveSplitTab(Math.max(0, customSplits.length - 2));
      }
    }
  };

  const getSplitTotal = () => {
    return customSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
  };

  const paymentMethodOptions = [
    { value: "Cash", label: language === "en" ? "Cash" : "Nağd" },
    { value: "Card", label: language === "en" ? "Card" : "Kart" },
    { value: "UPI", label: "UPI" },
    { value: "Bank Transfer", label: language === "en" ? "Bank Transfer" : "Bank Köçürməsi" },
  ];

  // If custom split method is selected, show custom split interface
  if (selectedMethod === "custom") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {language === "en" ? "Payment" : "Ödəniş"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === "en" ? "Order" : "Sifariş"} #{orderNumber}
                </p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Split Bill Header with Change Method */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {language === "en" ? "Split Bill" : "Hesabı Böl"}
              </h3>
              <button
                onClick={() => setSelectedMethod(null)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                ({language === "en" ? "Change Method" : "Metodu Dəyiş"})
              </button>
            </div>

            {/* Split Tabs */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {customSplits.map((split, index) => (
                <button
                  key={split.id}
                  onClick={() => setActiveSplitTab(index)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    activeSplitTab === index
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-750"
                  )}
                >
                  {language === "en" ? "Split" : "Böl"} {index + 1}
                </button>
              ))}
              <button
                onClick={handleAddNewSplit}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {language === "en" ? "New Split" : "Yeni Bölgü"}
              </button>
            </div>

            {/* Split Details Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {customSplits.map((split, index) => (
                <div key={split.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {language === "en" ? "Split" : "Böl"} {index + 1}
                    </label>
                    {customSplits.length > 1 && (
                      <button
                        onClick={() => handleRemoveSplit(split.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={split.amount}
                      onChange={(e) => handleUpdateSplit(split.id, "amount", e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <select
                      value={split.paymentMethod}
                      onChange={(e) => handleUpdateSplit(split.id, "paymentMethod", e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {paymentMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {language === "en" ? "Total" : "Cəmi"}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 dark:text-blue-400">
                  {language === "en" ? "Payable Amount" : "Ödəniləcək Məbləğ"}
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {language === "en" ? "Split Total" : "Bölgü Cəmi"}
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(getSplitTotal())}
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
                onClick={onComplete}
                className="flex-1 py-3 text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
              >
                {language === "en" ? "Complete Payment" : "Ödənişi Tamamla"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view - show split method options
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === "en" ? "Split Bill" : "Hesabı Böl"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Split Method Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {splitMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => handleSplitMethodSelect(method.id)}
                  className="flex flex-col items-center justify-center gap-4 p-6 rounded-xl transition-all border-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {method.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {method.description}
                    </p>
                  </div>
                </button>
              );
            })}
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
              onClick={onComplete}
              className="flex-1 py-3 text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              {language === "en" ? "Complete Payment" : "Ödənişi Tamamla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}