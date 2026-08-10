import { useState } from "react";
import { FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";

interface TaxItem {
  id: string;
  reference: string;
  supplier: string;
  date: string;
  store: string;
  amount: number;
  paymentMethod: string;
  discount: number;
  taxAmount: number;
}

export function TaxReport() {
  const [activeTab, setActiveTab] = useState<"purchase" | "sales">("purchase");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = useReportDateRange("month");

  const purchaseTaxItems: TaxItem[] = [
    {
      id: "1",
      reference: "#4237022",
      supplier: "A-Z Store",
      date: "06 Nov 2024",
      store: "Volt Vault",
      amount: 5700,
      paymentMethod: "Cash",
      discount: 5700,
      taxAmount: 5700,
    },
    {
      id: "2",
      reference: "#4237300",
      supplier: "Apex Computers",
      date: "24 Dec 2024",
      store: "Electro Mart",
      amount: 5200,
      paymentMethod: "Stripe",
      discount: 5200,
      taxAmount: 5200,
    },
    {
      id: "3",
      reference: "#7598221",
      supplier: "Sigma Chairs",
      date: "30 Sep 2024",
      store: "Urban Mart",
      amount: 5450,
      paymentMethod: "Stripe",
      discount: 5450,
      taxAmount: 5450,
    },
    {
      id: "4",
      reference: "#7593525",
      supplier: "Beats Headphones",
      date: "10 Dec 2024",
      store: "Quantum Gadgets",
      amount: 550,
      paymentMethod: "Paypal",
      discount: 550,
      taxAmount: 550,
    },
    {
      id: "5",
      reference: "#7599385",
      supplier: "Aesthetic Bags",
      date: "14 Oct 2024",
      store: "Prima Mart",
      amount: 51200,
      paymentMethod: "Paypal",
      discount: 51200,
      taxAmount: 51200,
    },
    {
      id: "6",
      reference: "#8744439",
      supplier: "Hatimi Kitchenwares",
      date: "25 Oct 2024",
      store: "Elite Retail",
      amount: 51000,
      paymentMethod: "Cash",
      discount: 51000,
      taxAmount: 51000,
    },
    {
      id: "7",
      reference: "#8745225",
      supplier: "Best Accessories",
      date: "18 Nov 2024",
      store: "Gadget World",
      amount: 5100,
      paymentMethod: "Paypal",
      discount: 5100,
      taxAmount: 5100,
    },
    {
      id: "8",
      reference: "#8745248",
      supplier: "Zenith Bags",
      date: "10 Sep 2024",
      store: "Travel Mart",
      amount: 5300,
      paymentMethod: "Cash",
      discount: 5300,
      taxAmount: 5300,
    },
    {
      id: "9",
      reference: "#8745478",
      supplier: "Alpha Mobiles",
      date: "03 Oct 2024",
      store: "NorTech Store",
      amount: 5750,
      paymentMethod: "Stripe",
      discount: 5750,
      taxAmount: 5750,
    },
    {
      id: "10",
      reference: "#9814521",
      supplier: "Dazzle Shoes",
      date: "27 Nov 2024",
      store: "Prima Bazaar",
      amount: 5800,
      paymentMethod: "Cash",
      discount: 5800,
      taxAmount: 5800,
    },
  ];

  const salesTaxItems: TaxItem[] = [
    {
      id: "1",
      reference: "#5237022",
      supplier: "Customer A",
      date: "05 Nov 2024",
      store: "Volt Vault",
      amount: 6700,
      paymentMethod: "Cash",
      discount: 6700,
      taxAmount: 6700,
    },
    {
      id: "2",
      reference: "#5237300",
      supplier: "Customer B",
      date: "23 Dec 2024",
      store: "Electro Mart",
      amount: 6200,
      paymentMethod: "Stripe",
      discount: 6200,
      taxAmount: 6200,
    },
  ];

  const currentItems = activeTab === "purchase" ? purchaseTaxItems : salesTaxItems;

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
        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab("purchase")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors  ₼{
              activeTab === "purchase"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Purchase Tax
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors  ₼{
              activeTab === "sales"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Sales Tax
          </button>
        </div>

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {activeTab === "purchase" ? "Purchase Tax" : "Sales Tax"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === "purchase" ? "View Reports of Purchase Tax" : "View Reports of Sales Tax"}
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
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Store</option>
                <option value="store1">Volt Vault</option>
                <option value="store2">Electro Mart</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Supplier Filter */}
            <div className="relative">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Supplier</option>
                <option value="supplier1">A-Z Store</option>
                <option value="supplier2">Apex Computers</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer min-w-[120px]"
              >
                <option value="all">Payment Method</option>
                <option value="cash">Cash</option>
                <option value="card">Credit Card</option>
                <option value="paypal">Paypal</option>
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

        {/* Tax Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Table Header with Export Buttons */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {activeTab === "purchase" ? "Purchase Tax Report" : "Sales Tax Report"}
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
                    Reference
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Supplier
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Store
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Amount
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Payment Method
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Discount
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    Tax Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 dark:border-gray-800  ₼{
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.reference}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.supplier}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.store}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                       ₼{item.amount}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.paymentMethod}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                       ₼{item.discount}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                       ₼{item.taxAmount}
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
