import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ScrollText } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useAuth } from "../../context/AuthContext";
import { DateInput } from "../ui/DateInput";
import { ModernSelect } from "../ui/ModernSelect";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import {
  dateInputToIso,
  formatFinanceDate,
  monthEndIso,
  monthStartIso,
} from "../../lib/financeMappers";
import { notifyFromError } from "../../lib/toast";
import { fetchDeletionLogs, type DeletionLogRow } from "../../api/audit";

const ENTITY_LABELS: Record<string, { az: string; en: string; ru: string }> = {
  PosOrder: { az: "POS sifariş", en: "POS order", ru: "POS заказ" },
  Invoice: { az: "Qaimə", en: "Invoice", ru: "Счёт" },
  SalesReturn: { az: "Satış qaytarma", en: "Sales return", ru: "Возврат продажи" },
  Purchase: { az: "Satınalma", en: "Purchase", ru: "Закупка" },
  PurchaseReturn: { az: "Satınalma qaytarma", en: "Purchase return", ru: "Возврат закупки" },
  Payment: { az: "Ödəniş", en: "Payment", ru: "Платёж" },
  Expense: { az: "Xərc", en: "Expense", ru: "Расход" },
  Income: { az: "Gəlir", en: "Income", ru: "Доход" },
  BankAccount: { az: "Bank hesabı", en: "Bank account", ru: "Банковский счёт" },
  MoneyTransfer: { az: "Pul köçürməsi", en: "Money transfer", ru: "Перевод" },
  ExpenseCategory: { az: "Xərc kateqoriyası", en: "Expense category", ru: "Категория расхода" },
  IncomeCategory: { az: "Gəlir kateqoriyası", en: "Income category", ru: "Категория дохода" },
  Product: { az: "Məhsul", en: "Product", ru: "Товар" },
  Category: { az: "Kateqoriya", en: "Category", ru: "Категория" },
  SubCategory: { az: "Alt kateqoriya", en: "Subcategory", ru: "Подкатегория" },
  Brand: { az: "Brend", en: "Brand", ru: "Бренд" },
  Unit: { az: "Vahid", en: "Unit", ru: "Единица" },
  VariantAttribute: { az: "Variant", en: "Variant attribute", ru: "Атрибут варианта" },
  Warranty: { az: "Zəmanət", en: "Warranty", ru: "Гарантия" },
  Customer: { az: "Müştəri", en: "Customer", ru: "Клиент" },
  Supplier: { az: "Təchizatçı", en: "Supplier", ru: "Поставщик" },
  Biller: { az: "Kassir", en: "Biller", ru: "Кассир" },
  Vehicle: { az: "Nəqliyyat", en: "Vehicle", ru: "Транспорт" },
  Reservation: { az: "Rezervasiya", en: "Reservation", ru: "Бронирование" },
  DiningTable: { az: "Masa", en: "Dining table", ru: "Стол" },
  StockAdjustment: { az: "Stok düzəlişi", en: "Stock adjustment", ru: "Корректировка склада" },
  StockTransfer: { az: "Stok transferi", en: "Stock transfer", ru: "Складской трансфер" },
  Store: { az: "Filial", en: "Store", ru: "Филиал" },
  Warehouse: { az: "Anbar", en: "Warehouse", ru: "Склад" },
  User: { az: "İstifadəçi", en: "User", ru: "Пользователь" },
  Role: { az: "Rol", en: "Role", ru: "Роль" },
  Department: { az: "Şöbə", en: "Department", ru: "Отдел" },
  TenantSettingsAsset: { az: "Ayar faylı", en: "Settings asset", ru: "Файл настроек" },
};

function formatDateTime(iso: string, language: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const locale = language === "az" ? "az-AZ" : language === "ru" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function DeletionLogs() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView } = useModulePermissions("Settings");
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => monthStartIso().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => monthEndIso().slice(0, 10));
  const [rows, setRows] = useState<DeletionLogRow[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, entityType, dateFrom, dateTo]);

  const entityTypeLabel = useCallback(
    (type: string) => {
      const m = ENTITY_LABELS[type];
      if (!m) return type;
      return pickLang(language, m.az, m.en, m.ru);
    },
    [language],
  );

  const loadLogs = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchDeletionLogs({
        search: debouncedSearch.trim() || undefined,
        entityType: entityType !== "all" ? entityType : undefined,
        dateFrom: dateFrom ? dateInputToIso(dateFrom) : undefined,
        dateTo: dateTo ? dateInputToIso(dateTo) : undefined,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setRows(Array.isArray(result.items) ? result.items : []);
      setEntityTypes(Array.isArray(result.entityTypes) ? result.entityTypes : []);
      setTotalItems(result.total ?? 0);
      const pages = Math.max(1, result.totalPages || 1);
      setTotalPages(pages);
      if (pages > 0 && currentPage > pages) setCurrentPage(pages);
    } catch (err) {
      notifyFromError(
        err,
        pickLang(
          language,
          "Jurnalları yükləmək alınmadı",
          "Failed to load deletion logs",
          "Не удалось загрузить журнал удалений",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    debouncedSearch,
    entityType,
    dateFrom,
    dateTo,
    currentPage,
    itemsPerPage,
    language,
  ]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const entityOptions = useMemo(
    () => [
      { value: "all", label: tr("Bütün tiplər", "All types", "Все типы") },
      ...entityTypes.map((t) => ({ value: t, label: entityTypeLabel(t) })),
    ],
    [entityTypes, entityTypeLabel, tr],
  );

  if (!canView) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-6">
        <p className="text-sm text-gray-500">
          {tr("Bu səhifəyə giriş yoxdur", "You do not have access to this page")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#0d9488]" />
              {tr("Silinmə jurnalları", "Deletion logs", "Журнал удалений")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              {tr(
                "Silinmiş qeydlər — tarix/saat və kim sildiyi. Yalnız bu funksiya işə salındıqdan sonra silinmələr göstərilir.",
                "Deleted records with date/time and who deleted them. Only deletions after this feature was enabled are listed.",
                "Удалённые записи с датой/временем и автором. Показаны только удаления после включения функции.",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              void loadLogs().finally(() => setIsRefreshing(false));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? "animate-spin" : ""}`} />
            {tr("Yenilə", "Refresh", "Обновить")}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr("Axtar…", "Search…", "Поиск…")}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="w-44">
              <ModernSelect
                value={entityType}
                onChange={setEntityType}
                options={entityOptions}
              />
            </div>
            <DateInput value={dateFrom} onChange={setDateFrom} className="w-36" />
            <span className="text-xs text-gray-400">{tr("–", "to", "–")}</span>
            <DateInput value={dateTo} onChange={setDateTo} className="w-36" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2.5 font-medium">{tr("Tarix / saat", "Date / time", "Дата / время")}</th>
                  <th className="px-3 py-2.5 font-medium">{tr("Tip", "Type", "Тип")}</th>
                  <th className="px-3 py-2.5 font-medium">{tr("Qeyd", "Record", "Запись")}</th>
                  <th className="px-3 py-2.5 font-medium">{tr("Silən", "Deleted by", "Удалил")}</th>
                  <th className="px-3 py-2.5 font-medium">{tr("Vasitası ilə", "Via", "Через")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...", "Загрузка...")}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500">
                      {tr(
                        "Silinmə tapılmadı. Köhnə silinmələr jurnalda görünməyə bilər.",
                        "No deletions found. Older deletions may not appear in this log.",
                        "Удаления не найдены. Старые удаления могут не отображаться.",
                      )}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const who =
                      row.deletedBy?.name?.trim() ||
                      row.actorName?.trim() ||
                      row.deletedBy?.email?.trim() ||
                      tr("Naməlum", "Unknown", "Неизвестно");
                    const record =
                      row.label?.trim() ||
                      `${row.entityId.slice(0, 8)}…`;
                    const via =
                      row.trigger === "cascade" && row.rootEntityType
                        ? entityTypeLabel(row.rootEntityType)
                        : row.trigger === "void"
                          ? tr("Ləğv", "Void", "Аннулирование")
                          : "—";
                    return (
                      <tr key={row.id} className="text-xs text-gray-700 dark:text-gray-200">
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {formatDateTime(row.createdAt, language)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{entityTypeLabel(row.entityType)}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-900 dark:text-white">{record}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{row.entityId}</div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{who}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-500">{via}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              showText={dataPaginationShowText(tr)}
            />
          </div>
        </div>
        <p className="mt-2 text-[10px] text-gray-400">
          {tr(
            `Tarix aralığı: ${formatFinanceDate(dateFrom)} – ${formatFinanceDate(dateTo)}`,
            `Date range: ${formatFinanceDate(dateFrom)} – ${formatFinanceDate(dateTo)}`,
          )}
        </p>
      </div>
    </div>
  );
}
