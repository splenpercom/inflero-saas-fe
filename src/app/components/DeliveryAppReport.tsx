import { useState } from "react";
import { ShoppingBag, DollarSign, TrendingUp, CheckCircle, ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { DateInput } from "./ui/DateInput";

export function DeliveryAppReport() {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState("2026-02-09");
  const [dateTo, setDateTo] = useState("2026-02-15");
  const [timeFrom, setTimeFrom] = useState("12:00");
  const [timeTo, setTimeTo] = useState("23:59");

  const totalOrders = 0;
  const totalRevenue = 0.0;
  const totalCommission = 0.0;
  const totalDeliveryFees = 0.0;
  const netRevenue = 0.0;

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {t.deliveryAppReportPage.title}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Track orders and commissions from delivery platforms ({t.deliveryAppReportPage.salesDataFrom} {dateFrom} {t.deliveryAppReportPage.to} {dateTo}, {t.deliveryAppReportPage.timePeriodEachDay} {timeFrom} - {timeTo})
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {/* Total Orders */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {t.deliveryAppReportPage.totalOrders}
              </span>
              <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
              {totalOrders}
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-purple-700 dark:text-purple-300">
                {t.deliveryAppReportPage.totalRevenue}
              </span>
              <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
              {totalRevenue.toFixed(2)}₼
            </div>
          </div>

          {/* Total Commission */}
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-orange-700 dark:text-orange-300">
                {t.deliveryAppReportPage.totalCommission}
              </span>
              <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-semibold text-orange-900 dark:text-orange-100">
              {totalCommission.toFixed(2)}₼
            </div>
          </div>

          {/* Total Delivery Fees */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-purple-700 dark:text-purple-300">
                {t.deliveryAppReportPage.totalDeliveryFees}
              </span>
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
              {totalDeliveryFees.toFixed(2)}₼
            </div>
          </div>

          {/* Net Revenue */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-green-700 dark:text-green-300">
                {t.deliveryAppReportPage.netRevenue}
              </span>
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
              {netRevenue.toFixed(2)}₼
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>{t.deliveryAppReportPage.currentWeek}</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>

            {/* Date From */}
            <DateInput
              value={dateFrom}
              onChange={setDateFrom}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t.deliveryAppReportPage.to}
            </span>

            {/* Date To */}
            <DateInput
              value={dateTo}
              onChange={setDateTo}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Time From */}
            <input
              type="time"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t.deliveryAppReportPage.to}
            </span>

            {/* Time To */}
            <input
              type="time"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Spacer */}
            <div className="flex-1 min-w-[100px]"></div>
          </div>
        </div>

        {/* Second Filters Row */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* All Delivery Apps Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>{t.deliveryAppReportPage.allDeliveryApps}</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.deliveryAppReportPage.deliveryApp}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.deliveryAppReportPage.totalOrders}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.deliveryAppReportPage.totalRevenue}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.deliveryAppReportPage.totalDeliveryFees}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.deliveryAppReportPage.avgOrderValue}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.deliveryAppReportPage.commissionRate}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.deliveryAppReportPage.totalCommission}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.deliveryAppReportPage.netRevenue}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Empty State */}
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No delivery app orders found for the selected period
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