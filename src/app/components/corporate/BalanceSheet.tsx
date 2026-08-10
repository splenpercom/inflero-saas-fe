import { useState } from "react";
import {
  Search,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

import { pickLang } from "../../i18n/pickLang";
interface BalanceItem {
  id: string;
  name: string;
  bankAccountNumber: string;
  credit: number;
  debit: number;
  balance: number;
}

export function BalanceSheet() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const balanceItems: BalanceItem[] = [
    {
      id: "1",
      name: "Ava Mason",
      bankAccountNumber: "SWIZ - 3456565767787",
      credit: 614848,
      debit: -450,
      balance: 614389,
    },
    {
      id: "2",
      name: "Caspian Marigold",
      bankAccountNumber: "NBC - 4324356677889",
      credit: 1686,
      debit: -700,
      balance: 986,
    },
    {
      id: "3",
      name: "Emma James",
      bankAccountNumber: "NBC - 2343547586900",
      credit: 16547,
      debit: -1000,
      balance: 15547,
    },
    {
      id: "4",
      name: "Isabella Jackson",
      bankAccountNumber: "IBO - 3434565776768",
      credit: 77818,
      debit: -300,
      balance: 77518,
    },
    {
      id: "5",
      name: "Olivia Ethan",
      bankAccountNumber: "IBO - 3453647664889",
      credit: 141845,
      debit: -1200,
      balance: 141645,
    },
    {
      id: "6",
      name: "Orion Astrid",
      bankAccountNumber: "IBO - 4353689870544",
      credit: 1948,
      debit: -100,
      balance: 1848,
    },
    {
      id: "7",
      name: "Quilton Elysia",
      bankAccountNumber: "SWIZ - 5475878970090",
      credit: 4494,
      debit: -50,
      balance: 4444,
    },
    {
      id: "8",
      name: "Sophia Liam",
      bankAccountNumber: "SWIZ - 3354456565687",
      credit: 44188,
      debit: -750,
      balance: 4356,
    },
  ];

  const handleExportPDF = () => {
    alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF functionality coming soon"));
  };

  const handleExportExcel = () => {
    alert(tr("Excel ixrac funksiyası tezliklə əlavə olunacaq", "Export Excel functionality coming soon"));
  };

  const handleRefresh = () => {
    alert(tr("Balans hesabatı yenilənir...", "Refreshing balance sheet..."));
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Balans Hesabatı", "Balance Sheet")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Balans hesabatınızı baxın", "View Your Balance Sheet")}
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

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
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
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("AD", "NAME")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("BANK VƏ HESAB NÖMRƏSI", "BANK & ACCOUNT NUMBER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("KREDİT", "CREDIT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("DEBİT", "DEBIT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("BALANS", "BALANCE")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {balanceItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50/30 dark:bg-gray-800/10"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.bankAccountNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.credit} ₼
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                      {item.debit < 0 ? `-${Math.abs(item.debit)} ₼` : `${item.debit} ₼`}
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
      </div>
    </div>
  );
}
