import { useState } from "react";
import { X, Truck, Store, ShoppingBag, Home, ClipboardList } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useNavigate } from "react-router";
import { cn } from "./ui/utils";

interface OrderTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrderType: "delivery" | "dine-in" | "pickup";
  onSelectOrderType: (type: "delivery" | "dine-in" | "pickup") => void;
}

export function OrderTypeModal({
  isOpen,
  onClose,
  currentOrderType,
  onSelectOrderType,
}: OrderTypeModalProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [setAsDefault, setSetAsDefault] = useState(false);

  if (!isOpen) return null;

  const orderTypes = [
    {
      id: "delivery" as const,
      icon: Truck,
      label: language === "en" ? "Delivery" : "Çatdırılma",
      color: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500 dark:border-blue-400",
    },
    {
      id: "dine-in" as const,
      icon: Store,
      label: language === "en" ? "Dine In" : "Restorandda",
      color: "from-purple-500/20 to-purple-600/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      borderColor: "border-purple-500 dark:border-purple-400",
    },
    {
      id: "pickup" as const,
      icon: ShoppingBag,
      label: language === "en" ? "Pickup" : "Götürmə",
      color: "from-green-500/20 to-green-600/20",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-500 dark:border-green-400",
    },
  ];

  const handleSelectType = (type: "delivery" | "dine-in" | "pickup") => {
    onSelectOrderType(type);
    if (setAsDefault) {
      // Save to localStorage or backend
      localStorage.setItem("defaultOrderType", type);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {language === "en" ? "Select Order Type" : "Sifariş Növünü Seçin"}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Home className="w-4 h-4" />
                {language === "en" ? "Dashboard" : "Panel"}
              </button>
              <button
                onClick={() => navigate("/orders")}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                {language === "en" ? "Orders" : "Sifarişlər"}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === "en" ? "Choose your order type to proceed" : "Davam etmək üçün sifariş növünü seçin"}
          </p>
        </div>

        <div className="p-6">
          {/* Set as Default Checkbox */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {language === "en" ? "Set as default" : "Standart olaraq təyin et"}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {language === "en" ? "Skip this selection next time." : "Növbəti dəfə bu seçimi keç."}
                </div>
              </div>
            </label>
          </div>

          {/* Order Type Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {orderTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = currentOrderType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-4 p-6 rounded-xl transition-all border-2",
                    isSelected
                      ? `bg-gradient-to-br ${type.color} backdrop-blur-xl ${type.borderColor} shadow-lg`
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform",
                      isSelected
                        ? `bg-gradient-to-br ${type.color} backdrop-blur-xl border border-white/20 scale-110`
                        : "bg-gray-50 dark:bg-gray-700"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-8 h-8",
                        isSelected ? type.iconColor : "text-gray-600 dark:text-gray-400"
                      )}
                    />
                  </div>
                  <div className="text-center">
                    <h3
                      className={cn(
                        "font-semibold",
                        isSelected
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {type.label}
                    </h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
