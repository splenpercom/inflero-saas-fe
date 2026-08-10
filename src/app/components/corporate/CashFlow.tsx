import { useState } from "react";
import {
  Search,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

import { pickLang } from "../../i18n/pickLang";
interface CashFlowItem {
  id: string;
  date: string;
  bankAccountNumber: string;
  description: string;
  credit: number;
  debit: number;
  accountBalance: number;
  totalBalance: number;
  paymentMethod: string;
}

export function CashFlow() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const cashFlowItems: CashFlowItem[] = [
    {
      id: "1",
      date: "03 Oct 2024",
      bankAccountNumber: "SWIZ - 3354456565687",
      description: "Cash payments for operating",
      credit: 1100,
      debit: 0,
      accountBalance: 1100,
      totalBalance: 9899,
      paymentMethod: "Stripe",
    },
    {
      id: "2",
      date: "08 Nov 2024",
      bankAccountNumber: "NBC - 4324356677889",
      description: "Loan received (short-term)",
      credit: 800,
      debit: 0,
      accountBalance: 800,
      totalBalance: 9898,
      paymentMethod: "Cash",
    },
    {
      id: "3",
      date: "10 Dec 2024",
      bankAccountNumber: "SWIZ - 5475878970090",
      description: "Cash payments to employees",
      credit: 0,
      debit: 1400,
      accountBalance: 1400,
      totalBalance: 9899,
      paymentMethod: "Paypal",
    },
    {
      id: "4",
      date: "10 Sep 2024",
      bankAccountNumber: "IBO - 3434565776768",
      description: "Cash receipts from sales",
      credit: 1700,
      debit: 0,
      accountBalance: 1700,
      totalBalance: 4569,
      paymentMethod: "Cash",
    },
    {
      id: "5",
      date: "14 Oct 2024",
      bankAccountNumber: "IBO - 3453647664889",
      description: "Owner's equity contribution",
      credit: 1300,
      debit: 0,
      accountBalance: 1300,
      totalBalance: 4368,
      paymentMethod: "Paypal",
    },
    {
      id: "6",
      date: "18 Nov 2024",
      bankAccountNumber: "IBO - 4353689870544",
      description: "Sale of old equipment",
      credit: 1000,
      debit: 1000,
      accountBalance: 1000,
      totalBalance: 1552,
      paymentMethod: "Paypal",
    },
    {
      id: "7",
      date: "20 Sep 2024",
      bankAccountNumber: "SWIZ - 3456565767787",
      description: "Cash payments to suppliers",
      credit: 2300,
      debit: 0,
      accountBalance: 2300,
      totalBalance: 4368,
      paymentMethod: "Stripe",
    },
    {
      id: "8",
      date: "24 Dec 2024",
      bankAccountNumber: "HBSC - 3298784309485",
      description: "Cash receipts from sales",
      credit: 1000,
      debit: 0,
      accountBalance: 1000,
      totalBalance: 989898,
      paymentMethod: "Stripe",
    },
    {
      id: "9",
      date: "25 Oct 2024",
      bankAccountNumber: "NBC - 2343547586900",
      description: "Repayment of long-term loan",
      credit: 0,
      debit: 750,
      accountBalance: 0,
      totalBalance: 9963,
      paymentMethod: "Cash",
    },
    {
      id: "10",
      date: "27 Nov 2024",
      bankAccountNumber: "SWIZ - 3255465758698",
      description: "Purchase of POS equipment",
      credit: 1800,
      debit: 0,
      accountBalance: 1800,
      totalBalance: 93058,
      paymentMethod: "Cash",
    },
  ];

  const handleExportPDF = () => {
    alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF functionality coming soon"));
  };

  const handleExportExcel = () => {
    alert(tr("Excel ixrac funksiyası tezliklə əlavə olunacaq", "Export Excel functionality coming soon"));
  };

  const handleRefresh = () => {
    alert(tr("Pul axını yenilənir...", "Refreshing cash flow..."));
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Pul Axını", "Cash Flow")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Pul axınlarınızı baxın", "View Your Cashflows")}
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

        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
            </div>

            {/* Payment Method Filter */}
            <div className="flex gap-2 ml-auto">
              <div className="relative">
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Ödəniş Üsulu", "Payment Method")}</option>
                  <option value="stripe">Stripe</option>
                  <option value="cash">{tr("Nağd", "Cash")}</option>
                  <option value="paypal">Paypal</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("BANK VƏ HESAB NÖMRƏSI", "BANK & ACCOUNT NUMBER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("TƏSVIR", "DESCRIPTION")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("KREDİT", "CREDIT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("DEBİT", "DEBIT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("HESAB BALANSI", "ACCOUNT BALANCE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ÜMUMI BALANS", "TOTAL BALANCE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ÖDƏNİŞ ÜSULU", "PAYMENT METHOD")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {cashFlowItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50/30 dark:bg-gray-800/10"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.bankAccountNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.credit} ₼
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.debit.toFixed(2)} ₼
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.accountBalance} ₼
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.totalBalance} ₼
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.paymentMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {tr("Səhifə başına sətir:", "Row Per Page:")} <span className="font-medium">10</span> - {tr("Qeydlər", "Entries")}{" "}
              <span className="font-medium">10</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white text-xs font-medium">
                1
              </button>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
