import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import type { ProductDetail } from "../../api/inventory";
import { CreateProduct } from "./CreateProduct";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (product: ProductDetail) => void;
}

/**
 * Hosts the Create Product form in a modal with a single internal scrollbar
 * (header sticky; body scrolls; no page-level overflow).
 */
export function CreateProductModal({ isOpen, onClose, onCreated }: CreateProductModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Məhsul əlavə et", "Add Product")}
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {tr("Yeni məhsul yaradın", "Create a new product")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={tr("Bağla", "Close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4">
          <CreateProduct
            embedded
            onCancel={onClose}
            onCreated={(product) => {
              onCreated(product);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
