import { useState } from "react";
import { cn } from "../ui/utils";
import {
  Calendar,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

import { pickLang } from "../../i18n/pickLang";
interface AccountStatementItem {
  id: string;
  referenceNumber: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  transactionType: string;
  balance: number;
}

export function AccountStatement() {
  const { t, language } = useLanguage();
  const [dateRange, setDateRange] = useState("01-Jan-2026 - 12-Dec-2026");
  const [selectedAccount, setSelectedAccount] = useState("HBSC - 3298784309485");

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const statementItems: AccountStatementItem[] = [
    {
      id: "1",
      referenceNumber: "#AS842",
      date: "24 Dec 2024",
      category: "Sale",
      description: "Sale of goods",
      amount: 200,
      transactionType: "Credit",
      balance: 4365,
    },
    {
      id: "2",
      referenceNumber: "#AS811",
      date: "10 Dec 2024",
      category: "Refund",
      description: "Refund issued",
      amount: -50,
      transactionType: "Debit",
      balance: 4444,
    },
    {
      id: "3",
      referenceNumber: "#AS847",
      date: "27 Nov 2024",
      category: "Purchase",
      description: "Inventory restocking",
      amount: 800,
      transactionType: "Debit",
      balance: 65145,
    },
    {
      id: "4",
      referenceNumber: "#AS874",
      date: "18 Nov 2024",
      category: "Sale",
      description: "Sale of goods",
      amount: 100,
      transactionType: "Credit",
      balance: 1848,
    },
    {
      id: "5",
      referenceNumber: "#AS8R7",
      date: "08 Nov 2024",
      category: "Purchase",
      description: "Inventory restocking",
      amount: -700,
      transactionType: "Debit",
      balance: 986,
    },
    {
      id: "6",
      referenceNumber: "#AS856",
      date: "25 Oct 2024",
      category: "Utility Payment",
      description: "Electricity Bill",
      amount: -1000,
      transactionType: "Debit",
      balance: 15547,
    },
    {
      id: "7",
      referenceNumber: "#AS822",
      date: "14 Oct 2024",
      category: "Equipment Purchase",
      description: "New POS terminals purchased",
      amount: -1200,
      transactionType: "Debit",
      balance: 141645,
    },
    {
      id: "8",
      referenceNumber: "#AS844",
      date: "03 Oct 2024",
      category: "Refund",
      description: "Refund issued",
      amount: -750,
      transactionType: "Debit",
      balance: 4356,
    },
    {
      id: "9",
      referenceNumber: "#AS832",
      date: "20 Sep 2024",
      category: "Withdraw",
      description: "Withdraw by accountant",
      amount: 400,
      transactionType: "Debit",
      balance: 61489,
    },
  ];

  const getTransactionTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "credit":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "debit":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const translateTransactionType = (type: string) => {
    const typeMap: Record<string, string> = {
      "Credit": tr("Kredit", "Credit"),
      "Debit": tr("Debet", "Debit"),
    };
    return typeMap[type] || type;
  };

  const handleExportPDF = () => {
    alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF functionality coming soon"));
  };

  const handleExportExcel = () => {
    alert(tr("Excel ixrac funksiyası tezliklə əlavə olunacaq", "Export Excel functionality coming soon"));
  };

  const handleRefresh = () => {
    alert(tr("Hesab çıxarışı yenilənir...", "Refreshing account statement..."));
  };

  const handleSubmit = () => {
    alert(tr("Hesab çıxarışı təqdim edilir...", "Submitting account statement..."));
  };

  const totalBalance = 33268.53;

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Hesab Çıxarışı", "Account Statement")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Çıxarışınızı baxın", "View Your Statement")}
          </p>
        </div>

        {/* Actions Bar - Top Right Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("PDF İxrac Et", "Export PDF")}
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("Excel İxrac Et", "Export Excel")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("Yenilə", "Refresh")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {tr("Tarixi Seçin", "Choose Your Date")}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                  placeholder={tr("Tarix aralığı seçin", "Select date range")}
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {tr("Hesab", "Account")}
              </label>
              <div className="relative">
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="appearance-none w-full pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="">{tr("Seçin", "Select")}</option>
                  <option value="HBSC - 3298784309485">HBSC - 3298784309485</option>
                  <option value="NBC - 4324356677889">NBC - 4324356677889</option>
                  <option value="SWIZ - 5475878970090">SWIZ - 5475878970090</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
              >
                {tr("Təqdim Et", "Submit")}
              </button>
            </div>
          </div>
        </div>

        {/* Statement Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Hesab Çıxarışı", "Statement of Account")} : <span className="text-[#0026f6] dark:text-[#0026f6]">{selectedAccount}</span>
          </h2>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("İSTİNAD NÖMRƏSI", "REFERENCE NUMBER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("KATEQORİYA", "CATEGORY")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("TƏSVIR", "DESCRIPTION")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("MƏBLƏĞ", "AMOUNT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ƏMƏLİYYAT NÖVÜ", "TRANSACTION TYPE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("BALANS", "BALANCE")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {statementItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50/30 dark:bg-gray-800/10"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.referenceNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.description}
                    </td>
                    <td className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${
                      item.amount > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {item.amount > 0 ? `+${item.amount} ₼` : `-${Math.abs(item.amount)} ₼`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium",
                          getTransactionTypeBadgeColor(item.transactionType)
                        )}
                      >
                        {translateTransactionType(item.transactionType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.balance} ₼
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Cəmi", "Total")}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {totalBalance.toFixed(2)} ₼
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
