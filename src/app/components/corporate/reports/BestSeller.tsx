import { useState } from "react";
import { cn } from "../../ui/utils";
import {
  Search,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import { useLanguage } from "../../../i18n/LanguageContext";

import { pickLang } from "../../../i18n/pickLang";
interface BestSellerItem {
  id: string;
  sku: string;
  productImage: string;
  productName: string;
  brand: string;
  category: string;
  soldQty: number;
  soldAmount: number;
  instockQty: number;
}

export function BestSeller() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = useReportDateRange("month");

  const bestSellers: BestSellerItem[] = [
    {
      id: "1",
      sku: "PT061",
      productImage: "💻",
      productName: "Lenovo IdeaPad 3",
      brand: "Lenovo",
      category: "Computers",
      soldQty: 8,
      soldAmount: 51030,
      instockQty: 100,
    },
    {
      id: "2",
      sku: "PT062",
      productImage: "🎧",
      productName: "Beats Pro",
      brand: "Beats",
      category: "Electronics",
      soldQty: 10,
      soldAmount: 51690,
      instockQty: 140,
    },
    {
      id: "3",
      sku: "PT063",
      productImage: "👟",
      productName: "Nike Jordan",
      brand: "Nike",
      category: "Shoes",
      soldQty: 8,
      soldAmount: 5885,
      instockQty: 300,
    },
    {
      id: "4",
      sku: "PT064",
      productImage: "⌚",
      productName: "Apple Series 5 Watch",
      brand: "Apple",
      category: "Electronics",
      soldQty: 10,
      soldAmount: 51200,
      instockQty: 450,
    },
    {
      id: "5",
      sku: "PT065",
      productImage: "🔊",
      productName: "Amazon Echo Dot",
      brand: "Amazon",
      category: "Electronics",
      soldQty: 5,
      soldAmount: 5400,
      instockQty: 320,
    },
    {
      id: "6",
      sku: "PT066",
      productImage: "🪑",
      productName: "Sanford Chair Sofa",
      brand: "Modern Wave",
      category: "Furniture",
      soldQty: 7,
      soldAmount: 52240,
      instockQty: 850,
    },
    {
      id: "7",
      sku: "PT067",
      productImage: "🛍️",
      productName: "Red Premium Satchel",
      brand: "Gucci",
      category: "Bags",
      soldQty: 16,
      soldAmount: 5600,
      instockQty: 700,
    },
    {
      id: "8",
      sku: "PT068",
      productImage: "📱",
      productName: "iPhone 14 Pro",
      brand: "Apple",
      category: "Phones",
      soldQty: 12,
      soldAmount: 56480,
      instockQty: 850,
    },
    {
      id: "9",
      sku: "PT069",
      productImage: "🪑",
      productName: "Gaming Chair",
      brand: "Archie",
      category: "Furniture",
      soldQty: 10,
      soldAmount: 52000,
      instockQty: 410,
    },
    {
      id: "10",
      sku: "PT610",
      productImage: "🎒",
      productName: "Brewers Backpack",
      brand: "The North Face",
      category: "Bags",
      soldQty: 20,
      soldAmount: 5600,
      instockQty: 550,
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
            Bestseller Products Report
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View Reports of Best Selling Products
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

            {/* Store Filter */}
            <div className="relative">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Store</option>
                <option value="store1">Store 1</option>
                <option value="store2">Store 2</option>
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

        {/* Best Sellers Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Table Header with Export Buttons */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Best Sellers
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
                    {tr("MƏHSUL ADI", "PRODUCT NAME")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("BREND", "BRAND")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("KATEQORİYA", "CATEGORY")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("SATILAN MİQDAR", "SOLD QTY")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("SATILAN MƏBLƏĞ", "SOLD AMOUNT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ANBARDA MİQDAR", "INSTOCK QTY")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((item, index) => (
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
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.brand}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.soldQty}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.soldAmount.toFixed(0)} ₼
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {item.instockQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span>Rows Per Page:</span>
              <select className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>- Entries</span>
            </div>
            <div className="flex gap-1">
              <button className="w-7 h-7 rounded flex items-center justify-center border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                ‹
              </button>
              <button className="w-7 h-7 rounded flex items-center justify-center bg-orange-500 text-white">
                1
              </button>
              <button className="w-7 h-7 rounded flex items-center justify-center border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}