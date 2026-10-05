import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  FileText,
  FileSpreadsheet,
  Eye,
  Ban,
  RefreshCw,
  Info,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDateTime } from "../../lib/dateFormat";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useAuth } from "../../context/AuthContext";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useConfirm } from "../../context/ConfirmContext";
import { DateInput } from "../ui/DateInput";
import { ModernSelect } from "../ui/ModernSelect";
import {
  fetchFinancePayments,
  voidFinancePayment,
  type FinancePaymentRow,
} from "../../api/finance";
import {
  dateInputToIso,
  formatFinanceDate,
  monthEndIso,
  monthStartIso,
  parseFinanceMoney,
} from "../../lib/financeMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import { PaymentDetailModal } from "./PaymentDetailModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { pickLang } from "../../i18n/pickLang";

export function Payments() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canEdit, canDelete } = useModulePermissions("Finances");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedTarget, setSelectedTarget] = useState("all");
  const [includeVoided, setIncludeVoided] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => monthStartIso().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => monthEndIso().slice(0, 10));
  const [rows, setRows] = useState<FinancePaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedMethod, selectedTarget, includeVoided, dateFrom, dateTo, branchRevision]);

  const loadPayments = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Branch scope comes from the sidebar switcher via x-branch-store-id header.
      const result = await fetchFinancePayments({
        search: debouncedSearch.trim() || undefined,
        method: selectedMethod !== "all" ? selectedMethod : undefined,
        targetType:
          selectedTarget === "POS_ORDER" ||
          selectedTarget === "INVOICE" ||
          selectedTarget === "PURCHASE" ||
          selectedTarget === "PURCHASE_RETURN" ||
          selectedTarget === "SALES_RETURN"
            ? selectedTarget
            : undefined,
        includeVoided: includeVoided || undefined,
        dateFrom: dateFrom ? dateInputToIso(dateFrom) : undefined,
        dateTo: dateTo ? dateInputToIso(dateTo) : undefined,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setRows(Array.isArray(result.items) ? result.items : []);
      setTotalItems(result.total ?? 0);
      const pages = Math.max(1, result.totalPages || 1);
      setTotalPages(pages);
      if (pages > 0 && currentPage > pages) setCurrentPage(pages);
    } catch (err) {
      notifyFromError(err, tr("Ödənişləri yükləmək alınmadı", "Failed to load payments"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    debouncedSearch,
    selectedMethod,
    selectedTarget,
    includeVoided,
    dateFrom,
    dateTo,
    branchRevision,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const postedTotal = useMemo(
    () =>
      rows
        .filter((r) => r.status === "POSTED")
        .reduce((sum, r) => sum + parseFinanceMoney(r.amount), 0),
    [rows],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPayments();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVoidRow = async (row: FinancePaymentRow) => {
    if (!canDelete || isDemo || row.status === "VOIDED") return;
    if (
      !(await askConfirm({
        title: tr("Ödənişi ləğv et", "Void payment"),
        message: tr(
          "Bu ödəniş ləğv ediləcək və sənəd borcu yenilənəcək. Davam edilsin?",
          "This payment will be voided and document dues will be recalculated. Continue?",
        ),
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await voidFinancePayment(row.id);
      notifySuccess(tr("Ödəniş ləğv edildi", "Payment voided"));
      await loadPayments();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const directionLabel = (d: "IN" | "OUT") =>
    d === "OUT" ? tr("Çıxış", "Out") : tr("Giriş", "In");

  const methodLabel = (m: string) => {
    const key = m.toUpperCase();
    if (key === "CASH") return tr("Nağd", "Cash");
    if (key === "CARD" || key === "CREDIT_CARD" || key === "DEBIT_CARD") return tr("Kart", "Card");
    if (key === "BANK_TRANSFER") return tr("Bank köçürməsi", "Bank transfer");
    return m.replace(/_/g, " ");
  };

  const targetLabel = (t: string | null) => {
    if (t === "PURCHASE") return tr("Satınalma", "Purchase");
    if (t === "PURCHASE_RETURN") return tr("Satınalma qaytarması", "Purchase return");
    if (t === "POS_ORDER") return tr("POS", "POS");
    if (t === "INVOICE") return tr("Faktura", "Invoice");
    if (t === "SALES_RETURN") return tr("Satış qaytarması", "Sales return");
    return "—";
  };

  const exportRows = rows.map((item) => [
    formatFinanceDate(item.date),
    item.paymentNumber,
    directionLabel(item.direction),
    item.partyName,
    `${targetLabel(item.targetType)} ${item.documentLabel}`,
    methodLabel(item.method),
    `${parseFinanceMoney(item.amount).toFixed(2)} AZN`,
    item.status === "VOIDED" ? tr("Ləğv edilib", "Voided") : tr("Keçirilib", "Posted"),
  ]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(tr("Ödənişlər", "Payments"), 14, 20);
    doc.setFontSize(10);
    doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);
    autoTable(doc, {
      startY: 36,
      head: [[
        tr("Tarix", "Date"),
        tr("Nömrə", "Number"),
        tr("İstiqamət", "Direction"),
        tr("Tərəf", "Party"),
        tr("Sənəd", "Document"),
        tr("Üsul", "Method"),
        tr("Məbləğ", "Amount"),
        tr("Status", "Status"),
      ]],
      body: exportRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255], fontStyle: "bold" },
    });
    doc.save(`payments-${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = [
      tr("Tarix", "Date"),
      tr("Nömrə", "Number"),
      tr("İstiqamət", "Direction"),
      tr("Tərəf", "Party"),
      tr("Sənəd", "Document"),
      tr("Üsul", "Method"),
      tr("Məbləğ", "Amount"),
      tr("Status", "Status"),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
    XLSX.utils.book_append_sheet(wb, ws, tr("Ödənişlər", "Payments"));
    XLSX.writeFile(wb, `payments-${Date.now()}.xlsx`);
  };

  if (!canView) {
    return (
      <div className="flex-1 p-6 text-sm text-gray-500">
        {tr("Bu səhifəyə baxmaq icazəniz yoxdur", "You do not have permission to view this page")}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Ödənişlər", "Payments")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr(
              "Müştəri və satınalma ödənişləri — baxış və ləğv",
              "Customer and purchase payments — view and void",
            )}
          </p>
          <div className="mt-3 flex gap-2.5 rounded-lg border border-[#14b8a6]/25 bg-[#f0fdfa] dark:bg-[#134e4a]/25 dark:border-[#14b8a6]/30 px-3 py-2.5 max-w-3xl">
            <Info className="w-4 h-4 text-[#0f766e] dark:text-[#5eead4] shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {tr("Ləğv (Void) nədir?", "What does Void do?")}
              </p>
              <p>
                {tr(
                  "Ləğv ödənişi silmir — onu ləğv edilmiş kimi işarələyir. Məbləğ artıq ödənilmiş sayılmır, sənədin borcu yenilənir, qeyd isə audit üçün saxlanılır. Səhv məbləğ üçün: ləğv edin, sonra yeni ödəniş yazın. Ləğv edilənləri görmək üçün «Ləğv edilənləri göstər» seçin.",
                  "Void does not delete a payment — it marks it cancelled. The amount no longer counts as paid, the linked document’s balance is recalculated, and the record is kept for audit. Wrong amount? Void it, then record a new payment. Use “Show voided” to see cancelled payments.",
                  "Аннулирование не удаляет платёж — помечает его как отменённый. Сумма больше не считается оплаченной, баланс документа пересчитывается, запись сохраняется для аудита. Неверная сумма? Аннулируйте и запишите новый платёж. Включите «Показать аннулированные», чтобы видеть отменённые платежи.",
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 max-w-lg">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase">{tr("Qeydlər", "Records")}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalItems}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 col-span-1 sm:col-span-2">
            <p className="text-[10px] text-gray-500 uppercase">{tr("Səhifə cəmi (keçirilmiş)", "Page total (posted)")}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{postedTotal.toFixed(2)} AZN</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={handleExportPDF}
            disabled={!rows.length}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title={tr("PDF İxrac Et", "Export PDF")}
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!rows.length}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title={tr("Excel İxrac Et", "Export Excel")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>
          <button
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            <DateInput
              value={dateFrom}
              onChange={setDateFrom}
              className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <DateInput
              value={dateTo}
              onChange={setDateTo}
              className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <ModernSelect
              value={selectedTarget}
              onChange={setSelectedTarget}
              className="w-[140px]"
              minWidth={140}
              options={[
                { value: "all", label: tr("Növ", "Type") },
                { value: "POS_ORDER", label: tr("POS", "POS") },
                { value: "INVOICE", label: tr("Faktura", "Invoice") },
                { value: "PURCHASE", label: tr("Satınalma", "Purchase") },
                { value: "PURCHASE_RETURN", label: tr("Satınalma qaytarması", "Purchase return") },
                { value: "SALES_RETURN", label: tr("Satış qaytarması", "Sales return") },
              ]}
              placeholder={tr("Növ", "Type")}
            />
            <ModernSelect
              value={selectedMethod}
              onChange={setSelectedMethod}
              className="w-[140px]"
              minWidth={140}
              options={[
                { value: "all", label: tr("Üsul", "Method") },
                { value: "CASH", label: tr("Nağd", "Cash") },
                { value: "CARD", label: tr("Kart", "Card") },
              ]}
              placeholder={tr("Üsul", "Method")}
            />
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeVoided}
                onChange={(e) => setIncludeVoided(e.target.checked)}
                className="rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
              />
              {tr("Ləğv edilənləri göstər", "Show voided")}
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("TARİX", "DATE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("NÖMRƏ", "NUMBER")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("İSTİQAMƏT", "DIR")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("TƏRƏF", "PARTY")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("SƏNƏD", "DOCUMENT")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("ÜSUL", "METHOD")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("MƏBLƏĞ", "AMOUNT")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("STATUS", "STATUS")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-gray-500">
                      {tr("Ödəniş tapılmadı", "No payments found")}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors",
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/10",
                        row.status === "VOIDED" && "opacity-60",
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatFinanceDate(row.date)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {row.paymentNumber}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span
                          className={
                            row.direction === "OUT"
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-emerald-700 dark:text-emerald-300"
                          }
                        >
                          {directionLabel(row.direction)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap max-w-[140px] truncate">
                        {row.partyName}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {targetLabel(row.targetType)} · {row.documentLabel}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {methodLabel(row.method)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {parseFinanceMoney(row.amount).toFixed(2)} AZN
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {row.status === "VOIDED" ? (
                          <span className="text-red-600 dark:text-red-400">{tr("Ləğv", "Voided")}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">{tr("Keçirilib", "Posted")}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDetailId(row.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title={tr("Bax", "View")}
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {canDelete && !isDemo && row.status === "POSTED" ? (
                            <button
                              onClick={() => void handleVoidRow(row)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title={tr("Ləğv et", "Void")}
                            >
                              <Ban className="w-3 h-3" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
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
      </div>

      <PaymentDetailModal
        paymentId={detailId}
        isOpen={detailId != null}
        onClose={() => setDetailId(null)}
        canEdit={canEdit}
        canVoid={canDelete}
        onChanged={() => void loadPayments()}
      />
    </div>
  );
}
