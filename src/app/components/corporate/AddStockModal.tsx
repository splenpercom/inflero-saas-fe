import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { ModernSelect } from "../ui/ModernSelect";

import { pickLang } from "../../i18n/pickLang";
interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stockData: {
    warehouse: string;
    store: string;
    responsiblePerson: string;
    product: string;
  }) => void;
}

export function AddStockModal({ isOpen, onClose, onSave }: AddStockModalProps) {
  const { language } = useLanguage();
  const [warehouse, setWarehouse] = useState("");
  const [store, setStore] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [product, setProduct] = useState("");

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setWarehouse("");
      setStore("");
      setResponsiblePerson("");
      setProduct("");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (warehouse && store && responsiblePerson && product) {
      onSave({ warehouse, store, responsiblePerson, product });
      onClose();
    }
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Stok Əlavə Et", "Add Stock")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Warehouse */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Anbar", "Warehouse")} <span className="text-red-500">*</span>
            </label>
            <ModernSelect
              value={warehouse}
              onChange={setWarehouse}
              className="w-full"
              placeholder={tr("Seçin", "Select")}
              options={[
                { value: "", label: tr("Seçin", "Select") },
                { value: "warehouse1", label: tr("Anbar 1", "Warehouse 1") },
                { value: "warehouse2", label: tr("Anbar 2", "Warehouse 2") },
                { value: "warehouse3", label: tr("Anbar 3", "Warehouse 3") },
              ]}
            />
          </div>

          {/* Store */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Mağaza", "Store")} <span className="text-red-500">*</span>
            </label>
            <ModernSelect
              value={store}
              onChange={setStore}
              className="w-full"
              placeholder={tr("Seçin", "Select")}
              options={[
                { value: "", label: tr("Seçin", "Select") },
                { value: "store1", label: tr("Mağaza 1", "Store 1") },
                { value: "store2", label: tr("Mağaza 2", "Store 2") },
                { value: "store3", label: tr("Mağaza 3", "Store 3") },
              ]}
            />
          </div>

          {/* Responsible Person */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məsul Şəxs", "Responsible Person")} <span className="text-red-500">*</span>
            </label>
            <ModernSelect
              value={responsiblePerson}
              onChange={setResponsiblePerson}
              className="w-full"
              placeholder={tr("Seçin", "Select")}
              options={[
                { value: "", label: tr("Seçin", "Select") },
                { value: "person1", label: tr("Ali Məmmədov", "Ali Mammadov") },
                { value: "person2", label: tr("Leyla İsmayılova", "Leyla Ismayilova") },
                { value: "person3", label: tr("Rəşad Həsənov", "Rashad Hasanov") },
              ]}
            />
          </div>

          {/* Product */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məhsul", "Product")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder={tr("Məhsul Axtar", "Select Product")}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!warehouse || !store || !responsiblePerson || !product}
            className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tr("Stok Əlavə Et", "Add Stock")}
          </button>
        </div>
      </div>
    </div>
  );
}