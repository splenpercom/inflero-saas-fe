import { useState } from "react";
import {
  Download,
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  FileText,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { DateInput } from "./ui/DateInput";

interface DailyReport {
  date: string;
  totalOrders: number;
  sgst: number;
  cgst: number;
  totalTax: number;
  cash: number;
  upi: number;
  card: number;
  bankTransfer: number;
  due: number;
  deliveryFee: number;
  discount: number;
  tip: number;
  total: number;
  totalExcludingTip: number;
}

export function SalesReport() {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState("2026-02-09");
  const [dateTo, setDateTo] = useState("2026-02-15");
  const [timeFrom, setTimeFrom] = useState("00:00");
  const [timeTo, setTimeTo] = useState("23:59");

  const [reports] = useState<DailyReport[]>([
    {
      date: "10/02/2026",
      totalOrders: 2,
      sgst: 36.5,
      cgst: 36.5,
      totalTax: 73.0,
      cash: 0.0,
      upi: 189.0,
      card: 1344.0,
      bankTransfer: 0.0,
      due: 0.0,
      deliveryFee: 0.0,
      discount: 0.0,
      tip: 0.0,
      total: 1533.0,
      totalExcludingTip: 1533.0,
    },
    {
      date: "11/02/2026",
      totalOrders: 5,
      sgst: 76.88,
      cgst: 76.88,
      totalTax: 153.75,
      cash: 2473.0,
      upi: 756.0,
      card: 0.0,
      bankTransfer: 0.0,
      due: 0.0,
      deliveryFee: 0.0,
      discount: 0.0,
      tip: 0.0,
      total: 3229.0,
      totalExcludingTip: 3229.0,
    },
  ]);

  // Calculate totals
  const totalSales = reports.reduce((sum, r) => sum + r.total, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.totalOrders, 0);
  const totalCash = reports.reduce((sum, r) => sum + r.cash, 0);
  const totalCard = reports.reduce((sum, r) => sum + r.card, 0);
  const totalUPI = reports.reduce((sum, r) => sum + r.upi, 0);
  const totalBankTransfer = reports.reduce((sum, r) => sum + r.bankTransfer, 0);
  const totalTaxes = reports.reduce((sum, r) => sum + r.totalTax, 0);
  const totalSGST = reports.reduce((sum, r) => sum + r.sgst, 0);
  const totalCGST = reports.reduce((sum, r) => sum + r.cgst, 0);

  const handleExport = () => {
    const csv = [
      [
        "Date",
        "Total Orders",
        "SGST (2.5%)",
        "CGST (2.5%)",
        "Total Tax Amount",
        "Cash",
        "UPI",
        "Card",
        "Bank Transfer",
        "Due",
        "Delivery Fee",
        "Discount",
        "Tip",
        "Total",
        "Total (Excluding Tip)",
      ],
      ...reports.map((r) => [
        r.date,
        r.totalOrders,
        `${r.sgst.toFixed(2)}₼`,
        `${r.cgst.toFixed(2)}₼`,
        `${r.totalTax.toFixed(2)}₼`,
        `${r.cash.toFixed(2)}₼`,
        `${r.upi.toFixed(2)}₼`,
        `${r.card.toFixed(2)}₼`,
        `${r.bankTransfer.toFixed(2)}₼`,
        `${r.due.toFixed(2)}₼`,
        `${r.deliveryFee.toFixed(2)}₼`,
        `${r.discount.toFixed(2)}₼`,
        `${r.tip.toFixed(2)}₼`,
        `${r.total.toFixed(2)}₼`,
        `${r.totalExcludingTip.toFixed(2)}₼`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-report.csv";
    a.click();
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {t.salesReportPage.title}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Check and track your restaurant's earnings (Sales Data From{" "}
            {dateFrom} {t.salesReportPage.to} {dateTo}, Time Period Each Day{" "}
            {timeFrom} - {timeTo})
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
          {/* Total Sales */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-purple-700 dark:text-purple-300">
                {t.salesReportPage.totalSales}
              </span>
              <DollarSign className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-1">
              {totalSales.toFixed(2)}₼
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400">
              {t.salesReportPage.orders}: {totalOrders}
            </div>
          </div>

          {/* Traditional Payments */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-green-700 dark:text-green-300">
                {t.salesReportPage.traditionalPayments}
              </span>
              <Wallet className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
              {totalSales.toFixed(2)}₼
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-green-700 dark:text-green-300">
                <span>{t.salesReportPage.cash}</span>
                <span>{totalCash.toFixed(2)}₼</span>
              </div>
              <div className="flex justify-between text-green-700 dark:text-green-300">
                <span>{t.salesReportPage.card}</span>
                <span>{totalCard.toFixed(2)}₼</span>
              </div>
              <div className="flex justify-between text-green-700 dark:text-green-300">
                <span>{t.salesReportPage.upi}</span>
                <span>{totalUPI.toFixed(2)}₼</span>
              </div>
              <div className="flex justify-between text-green-700 dark:text-green-300">
                <span>{t.salesReportPage.bankTransfer}</span>
                <span>{totalBankTransfer.toFixed(2)}₼</span>
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-cyan-700 dark:text-cyan-300">
                {t.salesReportPage.paymentGateways}
              </span>
              <CreditCard className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-lg font-semibold text-cyan-900 dark:text-cyan-100">
              0.00₼
            </div>
          </div>

          {/* Additional Amounts */}
          <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-pink-700 dark:text-pink-300">
                {t.salesReportPage.additionalAmounts}
              </span>
              <Receipt className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-pink-700 dark:text-pink-300">
                <span>{t.salesReportPage.totalCharges}</span>
                <span className="text-red-600 dark:text-red-400">0.00₼</span>
              </div>
              <div className="flex justify-between text-pink-700 dark:text-pink-300">
                <span>{t.salesReportPage.totalTaxes}</span>
                <span className="text-red-600 dark:text-red-400">
                  {totalTaxes.toFixed(2)}₼
                </span>
              </div>
              <div className="flex justify-between text-pink-700 dark:text-pink-300">
                <span>{t.salesReportPage.discount}</span>
                <span className="text-red-600 dark:text-red-400">0.00₼</span>
              </div>
              <div className="flex justify-between text-pink-700 dark:text-pink-300">
                <span>{t.salesReportPage.tip}</span>
                <span className="text-red-600 dark:text-red-400">0.00₼</span>
              </div>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-purple-700 dark:text-purple-300">
                {t.salesReportPage.taxBreakdown}
              </span>
              <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-purple-700 dark:text-purple-300">
                <span>{t.salesReportPage.taxMode}</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {t.salesReportPage.order}
                </span>
              </div>
              <div className="flex justify-between text-purple-700 dark:text-purple-300">
                <span>{t.salesReportPage.totalTaxCollection}</span>
                <span>{totalTaxes.toFixed(2)}₼</span>
              </div>
              <div className="flex justify-between text-purple-700 dark:text-purple-300">
                <span>{t.salesReportPage.sgst} (2.50%)</span>
                <span>{totalSGST.toFixed(2)}₼</span>
              </div>
              <div className="flex justify-between text-purple-700 dark:text-purple-300">
                <span>{t.salesReportPage.cgst} (2.50%)</span>
                <span>{totalCGST.toFixed(2)}₼</span>
              </div>
            </div>
          </div>

          {/* Outstanding Payments */}
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-orange-700 dark:text-orange-300">
                {t.salesReportPage.outstandingPayments}
              </span>
              <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-1">
              0.00₼
            </div>
            <div className="text-[10px] text-orange-600 dark:text-orange-400">
              {t.salesReportPage.outstandingOrders}: 0
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option>{t.salesReportPage.currentWeek}</option>
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
              {t.salesReportPage.to}
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
              {t.salesReportPage.to}
            </span>

            {/* Time To */}
            <input
              type="time"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {/* User Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option>{t.salesReportPage.allUsers}</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.salesReportPage.export}</span>
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
                    {t.salesReportPage.date}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.totalOrdersColumn}
                  </th>
                  <th
                    colSpan={3}
                    className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 border-l border-gray-200 dark:border-gray-800 whitespace-nowrap"
                  >
                    {t.salesReportPage.taxesFromActualBreakdown}
                  </th>
                  <th
                    colSpan={4}
                    className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 border-l border-gray-200 dark:border-gray-800 whitespace-nowrap"
                  >
                    {t.salesReportPage.paymentMethods}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 border-l border-gray-200 dark:border-gray-800 whitespace-nowrap">
                    {t.salesReportPage.due}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.deliveryFee}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.discount}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.tip}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.total}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.totalExcludingTip}
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 border-l border-gray-200 dark:border-gray-800 whitespace-nowrap">
                    {t.salesReportPage.sgst} (2.5%)
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.cgst} (2.5%)
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.totalTaxAmount}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 border-l border-gray-200 dark:border-gray-800 whitespace-nowrap">
                    {t.salesReportPage.cash}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.upi}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.card}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.salesReportPage.bankTransfer}
                  </th>
                  <th colSpan={6} className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {reports.map((report, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.date}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.totalOrders}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-800">
                      {report.sgst.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.cgst.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.totalTax.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-800">
                      {report.cash.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.upi.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.card.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.bankTransfer.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-800">
                      {report.due.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.deliveryFee.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.discount.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.tip.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                      {report.total.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {report.totalExcludingTip.toFixed(2)}₼
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
