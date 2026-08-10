import { useState } from "react";
import { X, DollarSign, FileText, Users, Download, ChevronDown, Clock } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { DateInput } from "./ui/DateInput";

export function RemovedKOTReport() {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState("2026-02-09");
  const [dateTo, setDateTo] = useState("2026-02-15");
  const [timeFrom, setTimeFrom] = useState("12:00");
  const [timeTo, setTimeTo] = useState("23:59");

  const totalRemovedItems = 0;
  const totalRemovedAmount = 0.0;

  const handleExport = () => {
    const csv = [
      [
        "KOT Number",
        "Order Number",
        "Removed By",
        "Item Name",
        "Quantity",
        "Table",
        "Cancellation Reason",
        "Removed Date",
        "Total Price",
      ],
      // No data to export
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "removed-kot-items.csv";
    a.click();
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {t.removedKOTItemReportPage.title}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t.removedKOTItemReportPage.subtitle}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Total Removed Items */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-red-700 dark:text-red-300">
                {t.removedKOTItemReportPage.totalRemovedItems}
              </span>
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-semibold text-red-900 dark:text-red-100">
              {totalRemovedItems}
            </div>
          </div>

          {/* Total Removed Amount */}
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-orange-700 dark:text-orange-300">
                {t.removedKOTItemReportPage.totalRemovedAmount}
              </span>
              <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-semibold text-orange-900 dark:text-orange-100">
              {totalRemovedAmount.toFixed(2)}₼
            </div>
          </div>

          {/* Top Cancellation Reasons */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                {t.removedKOTItemReportPage.topCancellationReasons}
              </span>
              <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl font-semibold text-yellow-900 dark:text-yellow-100">
              {t.removedKOTItemReportPage.noDataAvailable}
            </div>
          </div>

          {/* Top Waiters */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {t.removedKOTItemReportPage.topWaiters}
              </span>
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t.removedKOTItemReportPage.noDataAvailable}
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option>{t.removedKOTItemReportPage.currentWeek}</option>
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
              {t.removedKOTItemReportPage.to}
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

            <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t.removedKOTItemReportPage.to}
            </span>

            {/* Time To */}
            <input
              type="time"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />

            {/* All Users Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option>{t.removedKOTItemReportPage.allUsers}</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>

            {/* All Cancellation Reasons Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option>{t.removedKOTItemReportPage.allCancellationReasons}</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>

            {/* Spacer */}
            <div className="flex-1 min-w-[100px]"></div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.removedKOTItemReportPage.export}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.kotNumber}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.orderNumber}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.removedBy}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.itemName}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.quantity}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.table}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.cancellationReason}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.removedDate}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.removedKOTItemReportPage.totalPrice}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Empty State */}
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t.removedKOTItemReportPage.noRemovedKOTItems}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
