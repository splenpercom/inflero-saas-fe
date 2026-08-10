import { useState } from "react";
import { FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import { useLanguage } from "../../../i18n/LanguageContext";

import { pickLang } from "../../../i18n/pickLang";
interface CustomerItem {
  id: string;
  reference: string;
  code: string;
  customerName: string;
  customerIcon: string;
  totalOrders: number;
  amount: number;
  paymentMethod: string;
  status: "Completed";
}

export function CustomerReport() {
  const { language } = useLanguage();
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = useReportDateRange("month");

  const customerItems: CustomerItem[] = [
    { id: "1", reference: "INV2011", code: "CU006", customerName: "Martha Betts", customerIcon: "👩", totalOrders: 46, amount: 750, paymentMethod: "Cash", status: "Completed" },
    { id: "2", reference: "INV2014", code: "CU007", customerName: "Daniel Judd", customerIcon: "👨", totalOrders: 21, amount: 1300, paymentMethod: "Credit Card", status: "Completed" },
    { id: "3", reference: "INV2026", code: "CU001", customerName: "Carl Evans", customerIcon: "👨‍💼", totalOrders: 10, amount: 1000, paymentMethod: "Cash", status: "Completed" },
    { id: "4", reference: "INV2031", code: "CU002", customerName: "Minerva Rameriz", customerIcon: "👩‍💼", totalOrders: 15, amount: 1500, paymentMethod: "Paypal", status: "Completed" },
    { id: "5", reference: "INV2033", code: "CU004", customerName: "Patricia Lewis", customerIcon: "👩‍🦰", totalOrders: 14, amount: 2000, paymentMethod: "Stripe", status: "Completed" },
    { id: "6", reference: "INV2042", code: "CU003", customerName: "Robert Lamon", customerIcon: "👨‍🦱", totalOrders: 22, amount: 1500, paymentMethod: "Paypal", status: "Completed" },
    { id: "7", reference: "INV2042", code: "CU005", customerName: "Mark Joslyn", customerIcon: "👨‍🦲", totalOrders: 12, amount: 800, paymentMethod: "Paypal", status: "Completed" },
    { id: "8", reference: "INV2047", code: "CU009", customerName: "Richard Fralick", customerIcon: "👨‍🦳", totalOrders: 15, amount: 1700, paymentMethod: "Credit Card", status: "Completed" },
    { id: "9", reference: "INV2056", code: "CU008", customerName: "Emma Bates", customerIcon: "👩‍🦳", totalOrders: 78, amount: 1100, paymentMethod: "Stripe", status: "Completed" },
  ];

  const totalAmount = customerItems.reduce((sum, item) => sum + item.amount, 0);

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
            Customer Report
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View Reports of Customer
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

            {/* Customer Filter */}
            <div className="relative">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Customer</option>
                <option value="customer1">Customer 1</option>
                <option value="customer2">Customer 2</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Payment Method</option>
                <option value="cash">Cash</option>
                <option value="card">Credit Card</option>
                <option value="paypal">Paypal</option>
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
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

        {/* Customer Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Table Header with Export Buttons */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Customer Report
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
                    Code
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Customer
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Total Orders
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
                {customerItems.map((item, index) => (
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
                      {item.code}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-sm border border-gray-300 dark:border-gray-700">
                          {item.customerIcon}
                        </div>
                        <span className="text-xs text-gray-900 dark:text-white">
                          {item.customerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.totalOrders}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                       ₼{item.amount}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.paymentMethod}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
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
              <span className="text-sm font-semibold text-gray-900 dark:text-white"> ₼{totalAmount}.53</span>
            </div>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span>Rows Per Page:</span>
              <select className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>- Entries</span>
            </div>
            <div className="flex gap-1">
              <button className="w-7 h-7 rounded flex items-center justify-center border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                ‹
              </button>
              <button className="w-7 h-7 rounded flex items-center justify-center bg-orange-500 text-white">
                1
              </button>
              <button className="w-7 h-7 rounded flex items-center justify-center border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
