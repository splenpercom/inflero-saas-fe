import { useState } from "react";
import { Download, TrendingUp, Package, ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { DateInput } from "./ui/DateInput";

interface ItemData {
  itemName: string;
  categoryName: string;
  quantitySold: number;
  sellingPrice: number;
  totalRevenue: number;
}

export function ItemReport() {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState("2026-02-09");
  const [dateTo, setDateTo] = useState("2026-02-15");
  const [timeFrom, setTimeFrom] = useState("12:00");
  const [timeTo, setTimeTo] = useState("23:59");
  const [searchTerm, setSearchTerm] = useState("");

  const [items] = useState<ItemData[]>([
    {
      itemName: "Naan",
      categoryName: "Breads",
      quantitySold: 6,
      sellingPrice: 40.0,
      totalRevenue: 240.0,
    },
    {
      itemName: "Chicken Manchurian",
      categoryName: "Main Course",
      quantitySold: 5,
      sellingPrice: 260.0,
      totalRevenue: 1300.0,
    },
    {
      itemName: "Vegetable Hakka Noodles",
      categoryName: "Main Course",
      quantitySold: 4,
      sellingPrice: 180.0,
      totalRevenue: 720.0,
    },
    {
      itemName: "Tandoori Roti",
      categoryName: "Breads",
      quantitySold: 3,
      sellingPrice: 25.0,
      totalRevenue: 75.0,
    },
    {
      itemName: "Uttapam",
      categoryName: "Main Course",
      quantitySold: 3,
      sellingPrice: 130.0,
      totalRevenue: 390.0,
    },
    {
      itemName: "Spring Rolls",
      categoryName: "Starters",
      quantitySold: 3,
      sellingPrice: 150.0,
      totalRevenue: 450.0,
    },
    {
      itemName: "Idli Sambar",
      categoryName: "Main Course",
      quantitySold: 2,
      sellingPrice: 90.0,
      totalRevenue: 180.0,
    },
    {
      itemName: "Medu Vada",
      categoryName: "Starters",
      quantitySold: 2,
      sellingPrice: 80.0,
      totalRevenue: 160.0,
    },
  ]);

  // Calculate totals
  const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantitySold, 0);

  // Filter items based on search
  const filteredItems = items.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      [
        "Item Name",
        "Item Category Name",
        "Quantity Sold",
        "Selling Price",
        "Total Revenue",
      ],
      ...filteredItems.map((item) => [
        item.itemName,
        item.categoryName,
        item.quantitySold,
        `${item.sellingPrice.toFixed(2)}₼`,
        `${item.totalRevenue.toFixed(2)}₼`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "item-report.csv";
    a.click();
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {t.itemReportPage.title}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            View detailed sales and performance of items (Sales Data From{" "}
            {dateFrom} {t.itemReportPage.to} {dateTo}, Time Period Each Day{" "}
            {timeFrom} - {timeTo})
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Sum of Total Revenue */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-purple-700 dark:text-purple-300">
                {t.itemReportPage.sumOfTotalRevenue}
              </span>
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
              {totalRevenue.toFixed(2)}₼
            </div>
          </div>

          {/* Total Quantity Sold */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-green-700 dark:text-green-300">
                {t.itemReportPage.totalQuantitySold}
              </span>
              <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
              {totalQuantity}
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Dropdown */}
            <div className="relative">
              <select className="appearance-none px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>{t.itemReportPage.currentWeek}</option>
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
              {t.itemReportPage.to}
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
              {t.itemReportPage.to}
            </span>

            {/* Time To */}
            <input
              type="time"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Search Input */}
            <input
              type="text"
              placeholder={t.itemReportPage.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.itemReportPage.export}</span>
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
                    {t.itemReportPage.itemName}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.itemReportPage.itemCategoryName}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.itemReportPage.quantitySold}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.itemReportPage.sellingPrice}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {t.itemReportPage.totalRevenue}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredItems.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {item.itemName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                      {item.categoryName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {item.quantitySold}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {item.sellingPrice.toFixed(2)}₼
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                      {item.totalRevenue.toFixed(2)}₼
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