import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { DateInput } from "./ui/DateInput";

export function ExpenseReport() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"outstanding" | "summary">("outstanding");
  const [dateFrom, setDateFrom] = useState("2026-02-09");
  const [dateTo, setDateTo] = useState("2026-02-15");

  // Mock data for Outstanding Payment Report
  const outstandingPayments = [
    {
      id: 1,
      paymentDue: 55005.0,
      dueDate: "2026-02-11",
      status: "pending",
    },
  ];

  // Mock data for Expense Summary Report
  const expenseSummary = [
    {
      category: "EQUIPMENT",
      totalExpense: 55005.0,
      percentage: 90.81,
    },
    {
      category: "RENT",
      totalExpense: 5568.0,
      percentage: 9.19,
    },
  ];

  const totalOutstanding = outstandingPayments.reduce((sum, p) => sum + p.paymentDue, 0);
  const totalExpenses = expenseSummary.reduce((sum, e) => sum + e.totalExpense, 0);

  const handleExport = () => {
    if (activeTab === "outstanding") {
      const csv = [
        ["Payment Due", "Due Date", "Payment Status"],
        ...outstandingPayments.map((p) => [
          `${p.paymentDue.toFixed(2)}₼`,
          p.dueDate,
          p.status === "pending" ? "PENDING" : "PAID",
        ]),
        ["Total", "", `${totalOutstanding.toFixed(2)}₼`],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "outstanding-payment-report.csv";
      a.click();
    } else {
      const csv = [
        ["Category", "Total Expense", "Percentage of Total"],
        ...expenseSummary.map((e) => [
          e.category,
          `${e.totalExpense.toFixed(2)}₼`,
          `${e.percentage.toFixed(2)}%`,
        ]),
        ["Total", `${totalExpenses.toFixed(2)}₼`, ""],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "expense-summary-report.csv";
      a.click();
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-4">
          <button
            onClick={() => setActiveTab("outstanding")}
            className={`px-3 py-2 text-xs font-medium transition-colors relative ${
              activeTab === "outstanding"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.expenseReportPage.outstandingPaymentTab}
            {activeTab === "outstanding" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-3 py-2 text-xs font-medium transition-colors relative ${
              activeTab === "summary"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.expenseReportPage.expenseSummaryTab}
            {activeTab === "summary" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
            )}
          </button>
        </div>

        {/* Outstanding Payment Report */}
        {activeTab === "outstanding" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
                {t.expenseReportPage.outstandingPaymentTab} {t.expenseReportPage.title}
              </h1>
            </div>

            {/* Filters Row */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Period Dropdown */}
                <div className="relative">
                  <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option>{t.expenseReportPage.currentWeek}</option>
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
                  {t.expenseReportPage.to}
                </span>

                {/* Date To */}
                <DateInput
                  value={dateTo}
                  onChange={setDateTo}
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
                  <span>{t.expenseReportPage.export}</span>
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
                        {t.expenseReportPage.paymentDue}
                      </th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                        {t.expenseReportPage.dueDate}
                      </th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                        {t.expenseReportPage.paymentStatus}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {payment.paymentDue.toFixed(2)}₼
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {payment.dueDate}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              payment.status === "pending"
                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400"
                                : "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                            }`}
                          >
                            {payment.status === "pending"
                              ? t.expenseReportPage.pending.toUpperCase()
                              : t.expenseReportPage.paid.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-300 dark:border-gray-700">
                      <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white">
                        {t.expenseReportPage.total}
                      </td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white">
                        {totalOutstanding.toFixed(2)}₼
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Expense Summary Report */}
        {activeTab === "summary" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
                {t.expenseReportPage.expenseSummaryTab} {t.expenseReportPage.title}
              </h1>
            </div>

            {/* Filters Row */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Period Dropdown */}
                <div className="relative">
                  <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option>{t.expenseReportPage.currentWeek}</option>
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
                  {t.expenseReportPage.to}
                </span>

                {/* Date To */}
                <DateInput
                  value={dateTo}
                  onChange={setDateTo}
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
                  <span>{t.expenseReportPage.export}</span>
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
                        {t.expenseReportPage.category}
                      </th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                        {t.expenseReportPage.totalExpense}
                      </th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                        {t.expenseReportPage.percentageOfTotal}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseSummary.map((expense, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">
                          {expense.category}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {expense.totalExpense.toFixed(2)}₼
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {expense.percentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-300 dark:border-gray-700">
                      <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white">
                        {t.expenseReportPage.total}
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white">
                        {totalExpenses.toFixed(2)}₼
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
