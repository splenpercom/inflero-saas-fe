import { useLanguage } from "../i18n/LanguageContext";

export function OrdersSimple() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t?.ordersPage?.title || "Orders"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          This is the orders page.
        </p>
      </div>
    </div>
  );
}
