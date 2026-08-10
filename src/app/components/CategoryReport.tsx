import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { DateInput } from "./ui/DateInput";

interface CategoryData {
  category: string;
  quantitySold: number;
  amount: number;
}

export function CategoryReport() {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState("2026-02-09");
  const [dateTo, setDateTo] = useState("2026-02-15");
  const [timeFrom, setTimeFrom] = useState("12:00");
  const [timeTo, setTimeTo] = useState("23:59");

  const [categories] = useState<CategoryData[]>([
    { category: "Starters", quantitySold: 6, amount: 750.0 },
    { category: "Main Course", quantitySold: 17, amount: 3190.0 },
    { category: "Breads", quantitySold: 9, amount: 315.0 },
    { category: "Rice", quantitySold: 1, amount: 300.0 },
    { category: "Desserts", quantitySold: 0, amount: 0.0 },
    { category: "Beverages", quantitySold: 0, amount: 0.0 },
    { category: "Salads", quantitySold: 0, amount: 0.0 },
    { category: "Soups", quantitySold: 0, amount: 0.0 },
    { category: "Sides", quantitySold: 0, amount: 0.0 },
    { category: "Snacks", quantitySold: 0, amount: 0.0 },
  ]);

  const handleExport = () => {
    const csv = [
      ["Item Category", "Quantity Sold", "Amount"],
      ...categories.map((cat) => [
        cat.category,
        cat.quantitySold,
        `${cat.amount.toFixed(2)}₼`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "category-report.csv";
    a.click();
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {t.categoryReportPage.title}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            See sales by category to understand performance (Sales Data From{" "}
            {dateFrom} {t.categoryReportPage.to} {dateTo}, Time Period Each Day{" "}
            {timeFrom} - {timeTo})
          </p>
        </div>

        {/* Filters Row */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>{t.categoryReportPage.currentWeek}</option>
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
              {t.categoryReportPage.to}
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
              {t.categoryReportPage.to}
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

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.categoryReportPage.export}</span>
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
                    {t.categoryReportPage.itemCategory}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.categoryReportPage.quantitySold}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.categoryReportPage.amount}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {categories.map((category, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {category.category}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {category.quantitySold}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {category.amount.toFixed(2)}₼
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