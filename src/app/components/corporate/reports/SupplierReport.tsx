import { useState } from "react";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_REPORT_PAGE_SIZE } from "../../../hooks/usePagination";
import { FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import { useLanguage } from "../../../i18n/LanguageContext";

import { pickLang } from "../../../i18n/pickLang";
interface SupplierItem {
  id: string;
  reference: string;
  supplierId: string;
  supplierName: string;
  supplierIcon: string;
  totalItems: number;
  amount: number;
  paymentMethod: string;
  status: "Pending" | "Received" | "Ordered";
}

export function SupplierReport() {
  const { language } = useLanguage();
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = useReportDateRange("month");

  const supplierItems: SupplierItem[] = [
    { id: "1", reference: "INVPO2011", supplierId: "SU006", supplierName: "Hatimi Hardwares", supplierIcon: "🔨", totalItems: 45, amount: 750, paymentMethod: "Cash", status: "Pending" },
    { id: "2", reference: "INVPO2014", supplierId: "SU007", supplierName: "Aesthetic Bags", supplierIcon: "👜", totalItems: 21, amount: 1500, paymentMethod: "Credit Card", status: "Received" },
    { id: "3", reference: "INVPO2017", supplierId: "SU010", supplierName: "Zenith Bags", supplierIcon: "🎒", totalItems: 15, amount: 1700, paymentMethod: "Stripe", status: "Pending" },
    { id: "4", reference: "INVPO2026", supplierId: "SU001", supplierName: "Apex Computers", supplierIcon: "💻", totalItems: 10, amount: 1000, paymentMethod: "Cash", status: "Received" },
    { id: "5", reference: "INVPO2031", supplierId: "SU002", supplierName: "Beats Headphones", supplierIcon: "🎧", totalItems: 15, amount: 1500, paymentMethod: "Paypal", status: "Pending" },
    { id: "6", reference: "INVPO2033", supplierId: "SU004", supplierName: "Best Accessories", supplierIcon: "⌚", totalItems: 14, amount: 2000, paymentMethod: "Stripe", status: "Ordered" },
    { id: "7", reference: "INVPO2042", supplierId: "SU003", supplierName: "Dazzle Shoes", supplierIcon: "👟", totalItems: 22, amount: 1500, paymentMethod: "Paypal", status: "Received" },
    { id: "8", reference: "INVPO2042", supplierId: "SU005", supplierName: "A-Z Store", supplierIcon: "🏪", totalItems: 12, amount: 800, paymentMethod: "Paypal", status: "Received" },
    { id: "9", reference: "INVPO2047", supplierId: "SU009", supplierName: "Sigma Chairs", supplierIcon: "🪑", totalItems: 25, amount: 2500, paymentMethod: "Credit Card", status: "Ordered" },
  ];

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedItems,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: supplierItems,
    itemsPerPage: DEFAULT_REPORT_PAGE_SIZE,
    resetKey: `${selectedSupplier}|${selectedStatus}|${selectedPaymentMethod}|${preset}|${customFrom}|${customTo}`,
  });
  const totalAmount = supplierItems.reduce((sum, item) => sum + item.amount, 0);

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
            Supplier Report
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View Reports of Supplier
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
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Supplier</option>
                <option value="supplier1">Supplier 1</option>
                <option value="supplier2">Supplier 2</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Status</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="ordered">Ordered</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Payment Method</option>
                <option value="cash">Cash</option>
                <option value="card">Credit Card</option>
                <option value="paypal">Paypal</option>
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

        {/* Supplier Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Table Header with Export Buttons */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Supplier Report
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
                    Total Items
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Amount
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Payment Method
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
                      {item.totalItems}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                       ₼{item.amount}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.paymentMethod}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium  ₼{
                          item.status === "Pending"
                            ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/30 text-[#14b8a6] dark:text-[#14b8a6]"
                            : item.status === "Received"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
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
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white"> ₼{totalAmount.toLocaleString()}.53</span>
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
