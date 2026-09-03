import { useState } from "react";
import { FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_REPORT_PAGE_SIZE } from "../../../hooks/usePagination";

interface StockHistoryItem {
  id: string;
  sku: string;
  productImage: string;
  productName: string;
  initialQty: number;
  addedQty: number;
  soldQty: number;
  defectiveQty: number;
  finalQty: number;
}

export function StockHistory() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = useReportDateRange("month");

  const stockHistoryItems: StockHistoryItem[] = [
    {
      id: "1",
      sku: "PT001",
      productImage: "💻",
      productName: "Lenovo IdeaPad 3",
      initialQty: 5000,
      addedQty: 100,
      soldQty: 100,
      defectiveQty: 100,
      finalQty: 100,
    },
    {
      id: "2",
      sku: "PT002",
      productImage: "🎧",
      productName: "Beats Pro",
      initialQty: 10,
      addedQty: 140,
      soldQty: 140,
      defectiveQty: 140,
      finalQty: 140,
    },
    {
      id: "3",
      sku: "PT003",
      productImage: "👟",
      productName: "Nike Jordan",
      initialQty: 8,
      addedQty: 300,
      soldQty: 300,
      defectiveQty: 300,
      finalQty: 300,
    },
    {
      id: "4",
      sku: "PT004",
      productImage: "⌚",
      productName: "Apple Series 5 Watch",
      initialQty: 10,
      addedQty: 450,
      soldQty: 450,
      defectiveQty: 450,
      finalQty: 450,
    },
    {
      id: "5",
      sku: "PT005",
      productImage: "🔊",
      productName: "Amazon Echo Dot",
      initialQty: 5,
      addedQty: 320,
      soldQty: 320,
      defectiveQty: 320,
      finalQty: 320,
    },
    {
      id: "6",
      sku: "PT006",
      productImage: "🪑",
      productName: "Sanford Chair Sofa",
      initialQty: 7,
      addedQty: 850,
      soldQty: 850,
      defectiveQty: 850,
      finalQty: 850,
    },
    {
      id: "7",
      sku: "PT007",
      productImage: "🛍️",
      productName: "Red Premium Satchel",
      initialQty: 10,
      addedQty: 700,
      soldQty: 700,
      defectiveQty: 700,
      finalQty: 700,
    },
    {
      id: "8",
      sku: "PT008",
      productImage: "📱",
      productName: "iPhone 14 Pro",
      initialQty: 12,
      addedQty: 630,
      soldQty: 630,
      defectiveQty: 630,
      finalQty: 630,
    },
    {
      id: "9",
      sku: "PT009",
      productImage: "🪑",
      productName: "Gaming Chair",
      initialQty: 10,
      addedQty: 410,
      soldQty: 410,
      defectiveQty: 410,
      finalQty: 410,
    },
    {
      id: "10",
      sku: "PT010",
      productImage: "🎒",
      productName: "Brewers Backpack",
      initialQty: 30,
      addedQty: 550,
      soldQty: 550,
      defectiveQty: 550,
      finalQty: 550,
    },
  ];

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedItems,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: stockHistoryItems,
    itemsPerPage: DEFAULT_REPORT_PAGE_SIZE,
    resetKey: `${selectedCategory}|${selectedProduct}|${preset}|${customFrom}|${customTo}`,
  });

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
            Stock History
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View Reports of Stock History
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <ReportDateRangeFilter
              preset={preset}
              onPresetChange={setPreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              className="flex-1"
            />

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Category</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Product Filter */}
            <div className="relative">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Products</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 dark:border-orange-500/30"
            >
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Generate Report</span>
            </button>
          </div>
        </div>

        {/* Stock History Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Table Header with Export Buttons */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Customer Report
            </h2>
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    SKU
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Product
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Initial Quantity
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Added Quantity
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Sold Quantity
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Defective Quantity
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Final Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.sku}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-sm border border-gray-300 dark:border-gray-700">
                          {item.productImage}
                        </div>
                        <span className="text-xs text-gray-900 dark:text-white">
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.initialQty}
                    </td>
                    <td className="px-3 py-2 text-xs text-[#14b8a6] dark:text-[#14b8a6] font-medium whitespace-nowrap">
                      {item.addedQty}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.soldQty}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.defectiveQty}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.finalQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-3">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
