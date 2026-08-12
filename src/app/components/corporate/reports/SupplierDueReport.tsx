import { useState } from "react";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_REPORT_PAGE_SIZE } from "../../../hooks/usePagination";
import { FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import { useLanguage } from "../../../i18n/LanguageContext";

import { pickLang } from "../../../i18n/pickLang";
interface SupplierDueItem {
  id: string;
  reference: string;
  supplierId: string;
  supplierName: string;
  supplierIcon: string;
  totalAmount: number;
  paid: number;
  due: number;
  status: "Paid" | "Pending" | "Overdue";
}

export function SupplierDueReport() {
  const { language } = useLanguage();
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [selectedReference, setSelectedReference] = useState("all");
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = useReportDateRange("month");

  const supplierDueItems: SupplierDueItem[] = [
    { id: "1", reference: "INVPO2011", supplierId: "SU006", supplierName: "Hatimi Hardwares", supplierIcon: "🔨", totalAmount: 750, paid: 750, due: 0, status: "Paid" },
    { id: "2", reference: "INVPO2014", supplierId: "SU007", supplierName: "Aesthetic Bags", supplierIcon: "👜", totalAmount: 1300, paid: 1300, due: 0, status: "Pending" },
    { id: "3", reference: "INVPO2017", supplierId: "SU010", supplierName: "Zenith Bags", supplierIcon: "🎒", totalAmount: 1700, paid: 1700, due: 0, status: "Overdue" },
    { id: "4", reference: "INVPO2026", supplierId: "SU001", supplierName: "Apex Computers", supplierIcon: "💻", totalAmount: 1000, paid: 1000, due: 0, status: "Paid" },
    { id: "5", reference: "INVPO2033", supplierId: "SU004", supplierName: "Best Accessories", supplierIcon: "⌚", totalAmount: 2000, paid: 2000, due: 0, status: "Paid" },
    { id: "6", reference: "INVPO2042", supplierId: "SU003", supplierName: "Dazzle Shoes", supplierIcon: "👟", totalAmount: 1500, paid: 1500, due: 0, status: "Paid" },
    { id: "7", reference: "INVPO2042", supplierId: "SU005", supplierName: "A-Z Store", supplierIcon: "🏪", totalAmount: 800, paid: 800, due: 0, status: "Paid" },
    { id: "8", reference: "INVPO2047", supplierId: "SU009", supplierName: "Sigma Chairs", supplierIcon: "🪑", totalAmount: 2300, paid: 2300, due: 0, status: "Paid" },
    { id: "9", reference: "INVPO2056", supplierId: "SU008", supplierName: "Alpha Mobiles", supplierIcon: "📱", totalAmount: 1100, paid: 1100, due: 0, status: "Paid" },
  ];

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedItems,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: supplierDueItems,
    itemsPerPage: DEFAULT_REPORT_PAGE_SIZE,
    resetKey: `${selectedSupplier}|${selectedPaymentStatus}|${selectedReference}|${preset}|${customFrom}|${customTo}`,
  });
  const totalAmount = supplierDueItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalPaid = supplierDueItems.reduce((sum, item) => sum + item.paid, 0);
  const totalDue = supplierDueItems.reduce((sum, item) => sum + item.due, 0);

  const handleExportPDF = () => {
    alert(t("PDF yüklənir...", "Exporting PDF..."));
  };

  const handleExportExcel = () => {
    alert(t("Excel yüklənir...", "Exporting Excel..."));
  };

  const handleGenerateReport = () => {
    alert(t("Hesabat yaradılır...", "Generating report..."));
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            Supplier Due
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View Reports of Supplier Due
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <ReportDateRangeFilter
              preset={preset}
              onPresetChange={setPreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              className="flex-1"
            />

            {/* Supplier Filter */}
            <div className="relative">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Supplier</option>
                <option value="supplier1">Supplier 1</option>
                <option value="supplier2">Supplier 2</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment Status Filter */}
            <div className="relative">
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Payment Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Reference Filter */}
            <div className="relative">
              <select
                value={selectedReference}
                onChange={(e) => setSelectedReference(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Reference</option>
                <option value="ref1">Reference 1</option>
                <option value="ref2">Reference 2</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 dark:border-orange-500/30"
            >
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Generate Report</span>
            </button>
          </div>
        </div>

        {/* Supplier Due Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Table Header with Export Buttons */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Supplier Due Report
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Reference
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    ID
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Supplier
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Total Amount
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Paid
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Due
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 dark:border-gray-800  ₼{
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.reference}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.supplierId}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-sm border border-gray-300 dark:border-gray-700">
                          {item.supplierIcon}
                        </div>
                        <span className="text-xs text-gray-900 dark:text-white">
                          {item.supplierName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                       ₼{item.totalAmount}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                       ₼{item.paid}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                       ₼{item.due.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium  ₼{
                          item.status === "Paid"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : item.status === "Pending"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Footer */}
          <div className="border-t-2 border-gray-300 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900 dark:text-white"> ₼{totalAmount}</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900 dark:text-white"> ₼{totalPaid}.53</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white"> ₼{totalDue.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-3">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              showText={{
                showing: t("Göstərilir", "Showing"),
                to: t("-", "to"),
                of: t("/", "of"),
                results: t("nəticə", "results"),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
