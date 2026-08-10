import { useState } from "react";
import {
  Download,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Package,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { DateInput } from "./ui/DateInput";

interface TaxBreakdown {
  taxName: string;
  taxRate: number;
  totalTaxAmount: number;
  itemsCount?: number;
  ordersCount?: number;
}

export function TaxReport() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"type" | "date" | "order">("type");
  const [dateFrom, setDateFrom] = useState("2026-11-02");
  const [dateTo, setDateTo] = useState("2026-11-02");
  const [timeFrom, setTimeFrom] = useState("12:00");
  const [timeTo, setTimeTo] = useState("23:59");

  const [taxData] = useState<TaxBreakdown[]>([
    {
      taxName: "SGST",
      taxRate: 2.5,
      totalTaxAmount: 76.88,
    },
    {
      taxName: "CGST",
      taxRate: 2.5,
      totalTaxAmount: 76.88,
    },
  ]);

  const totalTax = taxData.reduce((sum, tax) => sum + tax.totalTaxAmount, 0);
  const totalRevenue = 3229.0;
  const totalOrders = 5;
  const totalItemsSold = 25;

  const handleExport = () => {
    const csv = [
      ["Tax Name", "Tax Rate (%)", "Total Tax Amount", "Items Count", "Orders Count"],
      ...taxData.map((tax) => [
        tax.taxName,
        `${tax.taxRate}%`,
        `${tax.totalTaxAmount.toFixed(2)}₼`,
        tax.itemsCount || "-",
        tax.ordersCount || "-",
      ]),
      ["Total", "", `${totalTax.toFixed(2)}₼`, totalItemsSold, totalOrders],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tax-report.csv";
    a.click();
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {t.taxReportPage.title}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t.taxReportPage.salesDateFor} {dateFrom}, {t.taxReportPage.timePeriod} {timeFrom} - {timeTo}
          </p>
        </div>

        {/* Today's Tax Summary Card */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {t.taxReportPage.todayTaxSummary}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                {t.taxReportPage.todayTaxCollection}
              </p>
              <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                {totalTax.toFixed(2)}₼
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                {t.taxReportPage.todayOrders}
              </p>
              <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                {totalOrders}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                {t.taxReportPage.todayRevenue}
              </p>
              <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                {totalRevenue.toFixed(2)}₼
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Total Taxes */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-purple-700 dark:text-purple-300">
                {t.taxReportPage.totalTaxes}
              </span>
              <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
              {totalTax.toFixed(2)}₼
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-green-700 dark:text-green-300">
                {t.taxReportPage.totalRevenue}
              </span>
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
              {totalRevenue.toFixed(2)}₼
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {t.taxReportPage.totalOrders}
              </span>
              <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
              {totalOrders}
            </div>
          </div>

          {/* Total Items Sold */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-purple-700 dark:text-purple-300">
                {t.taxReportPage.totalItemsSold}
              </span>
              <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
              {totalItemsSold}
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option>{t.taxReportPage.today}</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>

            {/* Date From */}
            <DateInput
              value={dateFrom}
              onChange={setDateFrom}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t.taxReportPage.to}
            </span>

            {/* Date To */}
            <DateInput
              value={dateTo}
              onChange={setDateTo}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {/* Time From */}
            <input
              type="time"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t.taxReportPage.to}
            </span>

            {/* Time To */}
            <input
              type="time"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {/* Spacer */}
            <div className="flex-1 min-w-[100px]"></div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.taxReportPage.export}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-4">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab("type")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === "type"
                  ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              {t.taxReportPage.taxBreakdownByTaxType}
            </button>
            <button
              onClick={() => setActiveTab("date")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === "date"
                  ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {t.taxReportPage.taxBreakdownByDate}
            </button>
            <button
              onClick={() => setActiveTab("order")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === "order"
                  ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {t.taxReportPage.taxDetailsByOrder}
            </button>
          </div>
        </div>

        {/* Table Section */}
        {activeTab === "type" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.taxReportPage.taxBreakdownByTaxType}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {t.taxReportPage.taxName}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {t.taxReportPage.taxRate} (%)
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {t.taxReportPage.totalTaxAmount}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {t.taxReportPage.itemsCount}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {t.taxReportPage.ordersCount}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {taxData.map((tax, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {tax.taxName}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {tax.taxRate.toFixed(2)}%
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {tax.totalTaxAmount.toFixed(2)}₼
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        -
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        -
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-gray-800/50 font-semibold">
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {t.taxReportPage.total}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      -
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {totalTax.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {totalItemsSold}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {totalOrders}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "date" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.taxReportPage.taxBreakdownByDate} - Coming Soon
            </p>
          </div>
        )}

        {activeTab === "order" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.taxReportPage.taxDetailsByOrder} - Coming Soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
