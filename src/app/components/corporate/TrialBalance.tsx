import { useState, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { fetchTrialBalance, type TrialBalanceRow } from "../../api/finance";
import {
  dateInputToIso,
  formatFinanceDate,
  monthEndIso,
  monthStartIso,
  parseFinanceMoney,
} from "../../lib/financeMappers";
import { notifyFromError } from "../../lib/toast";
import { DateInput } from "../ui/DateInput";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../i18n/pickLang";
export function TrialBalance() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView } = useModulePermissions("Finances");

  const [dateFrom, setDateFrom] = useState(() => monthStartIso().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => monthEndIso().slice(0, 10));
  const [items, setItems] = useState<TrialBalanceRow[]>([]);
  const [totalDebit, setTotalDebit] = useState("0.00");
  const [totalCredit, setTotalCredit] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const isBalanced = parseFinanceMoney(totalDebit) === parseFinanceMoney(totalCredit);

  const loadReport = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) return;
    if (!dateFrom || !dateTo) {
      notifyFromError(new Error(tr("Tarix aralığını seçin", "Please select a date range")));
      return;
    }
    setLoading(true);
    try {
      const result = await fetchTrialBalance({
        dateFrom: dateInputToIso(dateFrom),
        dateTo: dateInputToIso(dateTo),
      });
      setItems(Array.isArray(result.items) ? result.items : []);
      setTotalDebit(result.totalDebit);
      setTotalCredit(result.totalCredit);
      setLoaded(true);
    } catch (err) {
      notifyFromError(err, tr("Sınaq balansını yükləmək alınmadı", "Failed to load trial balance"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, dateFrom, dateTo, language]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadReport();
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportRows = items.map((item) => [
    item.code,
    item.name,
    parseFinanceMoney(item.debit).toFixed(2),
    parseFinanceMoney(item.credit).toFixed(2),
  ]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(tr("Sınaq Balansı", "Trial Balance"), 14, 20);
    doc.setFontSize(10);
    doc.text(`${formatFinanceDate(dateInputToIso(dateFrom))} — ${formatFinanceDate(dateInputToIso(dateTo))}`, 14, 28);
    doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 34);
    autoTable(doc, {
      startY: 40,
      head: [[tr("Kod", "Code"), tr("Hesab Adı", "Account Name"), tr("Debet", "Debit"), tr("Kredit", "Credit")]],
      body: exportRows,
      foot: [[tr("Cəmi", "Total"), "", parseFinanceMoney(totalDebit).toFixed(2), parseFinanceMoney(totalCredit).toFixed(2)]],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [0, 38, 246], textColor: [255, 255, 255], fontStyle: "bold" },
      footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
    });
    doc.save(`trial-balance-${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = [tr("Kod", "Code"), tr("Hesab Adı", "Account Name"), tr("Debet", "Debit"), tr("Kredit", "Credit")];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ...exportRows,
      [tr("Cəmi", "Total"), "", parseFinanceMoney(totalDebit).toFixed(2), parseFinanceMoney(totalCredit).toFixed(2)],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, tr("Sınaq Balansı", "Trial Balance"));
    XLSX.writeFile(wb, `trial-balance-${Date.now()}.xlsx`);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">{tr("Sınaq Balansı", "Trial Balance")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tr("Kirayəçi üzrə sınaq balansı (bütün filiallar)", "Tenant-wide trial balance (all branches)")}</p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button onClick={handleExportPDF} disabled={!loaded || !items.length} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("PDF İxrac Et", "Export PDF")}><FileText className="w-3.5 h-3.5 text-red-500" /></button>
          <button onClick={handleExportExcel} disabled={!loaded || !items.length} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("Excel İxrac Et", "Export Excel")}><FileSpreadsheet className="w-3.5 h-3.5 text-green-500" /></button>
          <button onClick={() => void handleRefresh()} disabled={isRefreshing || !loaded} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("Yenilə", "Refresh")}><RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} /></button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tr("Tarixdən", "Date From")}</label>
              <DateInput value={dateFrom} onChange={setDateFrom} className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tr("Tarixə", "Date To")}</label>
              <DateInput value={dateTo} onChange={setDateTo} className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]" />
            </div>
            <div className="flex items-end lg:col-span-2">
              <button onClick={() => void loadReport()} disabled={loading || !dateFrom || !dateTo} className="w-full px-4 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                {loading ? tr("Yüklənir...", "Loading...") : tr("Hesabatı Göstər", "Run Report")}
              </button>
            </div>
          </div>
        </div>

        {loaded && (
          <div className={cn("mb-4 px-4 py-2 rounded-lg text-xs font-medium border", isBalanced ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300")}>
            {isBalanced
              ? tr("Balanslı — debet və kredit bərabərdir", "Balanced — debits equal credits")
              : tr("Uyğunsuzluq — debet və kredit fərqlidir", "Out of balance — debits and credits differ")}
            {" · "}
            {tr("Cəmi Debet", "Total Debit")}: {parseFinanceMoney(totalDebit).toFixed(2)} AZN
            {" · "}
            {tr("Cəmi Kredit", "Total Credit")}: {parseFinanceMoney(totalCredit).toFixed(2)} AZN
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("KOD", "CODE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("HESAB ADI", "ACCOUNT NAME")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("DEBİT", "DEBIT")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("KREDİT", "CREDIT")}</th>
                </tr>
              </thead>
              <tbody>
                {!loaded ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Tarix seçib hesabatı işə salın", "Select dates and run the report")}</td></tr>
                ) : loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Bu dövr üçün məlumat yoxdur", "No data for this period")}</td></tr>
                ) : (
                  <>
                    {items.map((item, index) => (
                      <tr key={item.accountId} className={cn("border-b border-gray-200 dark:border-gray-800", index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/10")}>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono">{item.code}</td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">{item.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">{parseFinanceMoney(item.debit) > 0 ? `${parseFinanceMoney(item.debit).toFixed(2)} AZN` : "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">{parseFinanceMoney(item.credit) > 0 ? `${parseFinanceMoney(item.credit).toFixed(2)} AZN` : "—"}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 dark:bg-gray-800 font-semibold border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan={2} className="px-4 py-3 text-xs text-gray-900 dark:text-white">{tr("Cəmi", "Total")}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">{parseFinanceMoney(totalDebit).toFixed(2)} AZN</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">{parseFinanceMoney(totalCredit).toFixed(2)} AZN</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
