import { useState } from "react";
import { FileText, FileSpreadsheet } from "lucide-react";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";

interface MonthlyData {
  month: string;
  sales: number;
  service: number;
  purchaseReturn: number;
  grossProfit: number;
  salesExpense: number;
  purchase: number;
  salesReturn: number;
  totalExpense: number;
  netProfit: number;
}

export function ProfitLoss() {
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = useReportDateRange("month");

  const monthlyData: MonthlyData[] = [
    {
      month: "Jan 2026",
      sales: 50000,
      service: 530000,
      purchaseReturn: 57000,
      grossProfit: 58000,
      salesExpense: 550000,
      purchase: 530000,
      salesReturn: 57000,
      totalExpense: 58000,
      netProfit: 58000,
    },
    {
      month: "Feb 2026",
      sales: 550000,
      service: 530000,
      purchaseReturn: 57000,
      grossProfit: 58000,
      salesExpense: 550000,
      purchase: 530000,
      salesReturn: 57000,
      totalExpense: 58000,
      netProfit: 58000,
    },
    {
      month: "Mar 2026",
      sales: 550000,
      service: 530000,
      purchaseReturn: 57000,
      grossProfit: 58000,
      salesExpense: 550000,
      purchase: 530000,
      salesReturn: 57000,
      totalExpense: 58000,
      netProfit: 58000,
    },
    {
      month: "Apr 2026",
      sales: 550000,
      service: 530000,
      purchaseReturn: 57000,
      grossProfit: 58000,
      salesExpense: 550000,
      purchase: 530000,
      salesReturn: 57000,
      totalExpense: 58000,
      netProfit: 58000,
    },
    {
      month: "May 2026",
      sales: 550000,
      service: 530000,
      purchaseReturn: 57000,
      grossProfit: 58000,
      salesExpense: 550000,
      purchase: 530000,
      salesReturn: 57000,
      totalExpense: 58000,
      netProfit: 58000,
    },
    {
      month: "Jun 2026",
      sales: 550000,
      service: 530000,
      purchaseReturn: 57000,
      grossProfit: 58000,
      salesExpense: 550000,
      purchase: 530000,
      salesReturn: 57000,
      totalExpense: 58000,
      netProfit: 58000,
    },
  ];

  const handleExportPDF = () => {
    alert("Exporting PDF...");
  };

  const handleExportExcel = () => {
    alert("Exporting Excel...");
  };

  const handleGenerateReport = () => {
    alert("Generating report...");
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            Profit / Loss Report
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View Reports of Profit / Loss Report
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <ReportDateRangeFilter
              preset={preset}
              onPresetChange={setPreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              className="flex-1 max-w-md"
            />

            {/* Export and Generate Buttons */}
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
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 dark:border-orange-500/30"
              >
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Generate Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profit/Loss Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/50">
                    {/* Empty header for row labels */}
                  </th>
                  {monthlyData.map((data) => (
                    <th
                      key={data.month}
                      className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap"
                    >
                      {data.month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Income Section */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900">
                    Income
                  </td>
                  {monthlyData.map((data) => (
                    <td key={`income-{data.month}`} className="px-3 py-2"></td>
                  ))}
                </tr>

                {/* Sales */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/30">
                    Sales
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`sales-{data.month}`}
                      className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.sales.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>

                {/* Service */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900">
                    Service
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`service-{data.month}`}
                      className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.service.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>

                {/* Purchase Return */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/30">
                    Purchase Return
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`pr-{data.month}`}
                      className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.purchaseReturn.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>

                {/* Gross Profit */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900">
                    Gross Profit
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`gp-{data.month}`}
                      className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.grossProfit.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>

                {/* Expenses Section */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                  <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/30">
                    Expenses
                  </td>
                  {monthlyData.map((data) => (
                    <td key={`exp-{data.month}`} className="px-3 py-2"></td>
                  ))}
                </tr>

                {/* Sales */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900">
                    Sales
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`exp-sales-{data.month}`}
                      className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.salesExpense.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>

                {/* Purchase */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/30">
                    Purchase
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`purchase-{data.month}`}
                      className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.purchase.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>

                {/* Sales Return */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900">
                    Sales Return
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`sr-{data.month}`}
                      className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.salesReturn.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>

                {/* Total Expense */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                  <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/30">
                    Total Expense
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`te-{data.month}`}
                      className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.totalExpense.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>

                {/* Net Profit */}
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900">
                    Net Profit
                  </td>
                  {monthlyData.map((data) => (
                    <td
                      key={`np-{data.month}`}
                      className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {data.netProfit.toLocaleString()} ₼
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
