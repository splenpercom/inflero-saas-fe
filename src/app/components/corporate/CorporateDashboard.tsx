import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  FileText,
  DollarSign,
  Eye,
  Trash2,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";
import { useNavigate } from "react-router";
import { 
  mockOrders, 
  mockProducts, 
  mockClients, 
  mockSuppliers,
  getDashboardStats,
  getSalesPurchaseData,
  getSalesPurchaseTotals,
  getGeneralInfo,
  getCustomerSummary,
  getSalesAnalytics,
  getSalesByCountry,
  getBestSellerProducts,
  getRecentTransactions,
  getWeeklyEarning,
  getExpiredProducts,
  getRecentlyAddedProducts,
  getStatCards,
  getTopSellingProducts,
  getLowStockProducts,
  getRecentSales,
  getSalesStatsData,
  getRecentTransactionsWidget
} from "../../utils/dashboardData";

import { pickLang } from "../../i18n/pickLang";
// Corporate Dashboard Component - Updated with Real Data v2
export function CorporateDashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("1Y");
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);

  // Get real stats from shared data
  const dashboardStats = getDashboardStats();
  const generalInfo = getGeneralInfo();
  const customerSummary = getCustomerSummary();
  const salesByCountry = getSalesByCountry();
  const salesPurchaseTotals = getSalesPurchaseTotals();
  const weeklyEarning = getWeeklyEarning();
  const statCards = getStatCards();

  // Get real data from utility functions
  const salesAnalyticsData = getSalesAnalytics();
  const purchaseSalesData = getSalesPurchaseData();

  // Top Categories data
  const topCategoriesData = [
    { name: "Electronics", value: 698, color: "#ff9b44", id: "elec" },
    { name: "Sports", value: 545, color: "#ab7df6", id: "sports" },
    { name: "Lifestyle", value: 456, color: "#4e7bf6", id: "lifestyle" },
  ];

  // Order Statistics heatmap data
  const orderStatsData = [
    { day: "Mon", hour: "6 Am", orders: 0 },
    { day: "Mon", hour: "8 Am", orders: 5 },
    { day: "Mon", hour: "10 Am", orders: 10 },
    { day: "Mon", hour: "12 Pm", orders: 15 },
    { day: "Mon", hour: "2 Pm", orders: 8 },
    { day: "Mon", hour: "4 Pm", orders: 6 },
    { day: "Mon", hour: "6 Pm", orders: 12 },
    { day: "Tue", hour: "6 Am", orders: 0 },
    { day: "Tue", hour: "8 Am", orders: 3 },
    { day: "Tue", hour: "10 Am", orders: 12 },
    { day: "Tue", hour: "12 Pm", orders: 18 },
    { day: "Tue", hour: "2 Pm", orders: 10 },
    { day: "Tue", hour: "4 Pm", orders: 8 },
    { day: "Tue", hour: "6 Pm", orders: 14 },
    { day: "Wed", hour: "6 Am", orders: 0 },
    { day: "Wed", hour: "8 Am", orders: 6 },
    { day: "Wed", hour: "10 Am", orders: 14 },
    { day: "Wed", hour: "12 Pm", orders: 20 },
    { day: "Wed", hour: "2 Pm", orders: 12 },
    { day: "Wed", hour: "4 Pm", orders: 10 },
    { day: "Wed", hour: "6 Pm", orders: 16 },
    { day: "Thu", hour: "6 Am", orders: 0 },
    { day: "Thu", hour: "8 Am", orders: 4 },
    { day: "Thu", hour: "10 Am", orders: 8 },
    { day: "Thu", hour: "12 Pm", orders: 16 },
    { day: "Thu", hour: "2 Pm", orders: 11 },
    { day: "Thu", hour: "4 Pm", orders: 7 },
    { day: "Thu", hour: "6 Pm", orders: 13 },
    { day: "Fri", hour: "6 Am", orders: 0 },
    { day: "Fri", hour: "8 Am", orders: 7 },
    { day: "Fri", hour: "10 Am", orders: 16 },
    { day: "Fri", hour: "12 Pm", orders: 22 },
    { day: "Fri", hour: "2 Pm", orders: 14 },
    { day: "Fri", hour: "4 Pm", orders: 12 },
    { day: "Fri", hour: "6 Pm", orders: 18 },
    { day: "Sat", hour: "6 Am", orders: 0 },
    { day: "Sat", hour: "8 Am", orders: 8 },
    { day: "Sat", hour: "10 Am", orders: 18 },
    { day: "Sat", hour: "12 Pm", orders: 24 },
    { day: "Sat", hour: "2 Pm", orders: 16 },
    { day: "Sat", hour: "4 Pm", orders: 14 },
    { day: "Sat", hour: "6 Pm", orders: 20 },
    { day: "Sun", hour: "6 Am", orders: 0 },
    { day: "Sun", hour: "8 Am", orders: 5 },
    { day: "Sun", hour: "10 Am", orders: 12 },
    { day: "Sun", hour: "12 Pm", orders: 20 },
    { day: "Sun", hour: "2 Pm", orders: 10 },
    { day: "Sun", hour: "4 Pm", orders: 8 },
    { day: "Sun", hour: "6 Pm", orders: 15 },
  ];

  // Sales Stats data - Using real data
  const salesStats = getSalesStatsData();
  const salesStatsData = salesStats.data;

  // Customers overview data - connected to real data
  const customersOverviewData = [
    { name: "First Time", value: customerSummary.firstTime, color: "#4e7bf6", id: "first-time" },
    { name: "Return", value: customerSummary.returning, color: "#ff9b44", id: "return" },
  ];

  // Get real data for widgets
  const bestSellerProducts = getBestSellerProducts();
  const recentTransactions = getRecentTransactions();
  const expiredProducts = getExpiredProducts();
  const recentlyAddedProducts = getRecentlyAddedProducts();
  const topSellingProducts = getTopSellingProducts();
  const lowStockProducts = getLowStockProducts();
  const recentSales = getRecentSales();

  // Top Customers
  const topCustomers = [
    {
      name: "Carlos Curran",
      orders: 24,
      amount: 8964.5,
      badge: "USA",
      image: "👨",
    },
    {
      name: "Stan Guenter",
      orders: 22,
      amount: 16985,
      badge: "UAE",
      image: "👨‍💼",
    },
    {
      name: "Richard Wilson",
      orders: 14,
      amount: 5366,
      badge: "Germany",
      image: "👴",
    },
    {
      name: "Mary Bronson",
      orders: 8,
      amount: 4569,
      badge: "Belgium",
      image: "👩",
    },
    {
      name: "Annie Tremblay",
      orders: 14,
      amount: 3569.8,
      badge: "Cleveland",
      image: "👱‍♀️",
    },
  ];

  // Recent Transactions (second widget) - Using real data
  const recentTransactionsWidget = getRecentTransactionsWidget();

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-6">
      {/* Low Stock Alert */}
      {showLowStockAlert && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <p className="text-xs text-orange-900 dark:text-orange-200">
              {pickLang(language, "Sizin məhsulunuz Apple Iphone 15 artıq azdır, hal-hazırda yalnız 5%-dir", "Your Product Apple Iphone 15 is running Low, already below 5%-")}
              <span className="text-orange-600 dark:text-orange-400 font-medium ml-1 cursor-pointer hover:underline">
                {pickLang(language, "Stoku əlavə et", "Add Stock")}
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowLowStockAlert(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
              +12%
            </span>
          </div>
          <div>
            <p className="text-xs text-white/80 mb-1">
              {pickLang(language, "Ümumi Satış", "Total Sales")}
            </p>
            <p className="text-2xl font-bold">43,988,078 ₼</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0026f6] to-[#001db8] rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
              +18%
            </span>
          </div>
          <div>
            <p className="text-xs text-white/80 mb-1">
              {pickLang(language, "Ümumi Satış Qaytarması", "Total Sales Return")}
            </p>
            <p className="text-2xl font-bold">16,478,145 ₼</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
              +18%
            </span>
          </div>
          <div>
            <p className="text-xs text-white/80 mb-1">
              {pickLang(language, "Ümumi Satınalma", "Total Purchase")}
            </p>
            <p className="text-2xl font-bold">24,145,789 ₼</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0026f6] to-[#001db8] rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
              +18%
            </span>
          </div>
          <div>
            <p className="text-xs text-white/80 mb-1">
              {pickLang(language, "Ümumi Qaytarma", "Total Purchase Return")}
            </p>
            <p className="text-2xl font-bold">18,458,747 ₼</p>
          </div>
        </div>
      </div>

      {/* Secondary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                8,458,798 ₼
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pickLang(language, "Mənfəət", "Profit")}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  +35% {pickLang(language, "Keçən Ay", "vs Last Month")}
                </span>
              </div>
            </div>
            <div className="bg-[#e8ebff] dark:bg-[#0026f6]/20 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-[#0026f6] dark:text-[#0026f6]" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                48,988,78 ₼
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pickLang(language, "Ödəniləcək Faktura", "Invoice Due")}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  +35% {pickLang(language, "Keçən Ay", "vs Last Month")}
                </span>
              </div>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3">
              <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                8,980,097 ₼
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pickLang(language, "Ümumi Xərclər", "Total Expenses")}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  +41% {pickLang(language, "Keçən Ay", "vs Last Month")}
                </span>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                78,458,798 ₼
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pickLang(language, "Ümumi Ödəmə Qaytarmaları", "Total Payment Returns")}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <span className="text-xs text-red-600 font-medium">
                  -20% {pickLang(language, "Keçən Ay", "vs Last Month")}
                </span>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <RotateCcw className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Colored Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate("/clients")}
          className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-3xl font-bold mb-1">{mockClients.length}</p>
              <p className="text-xs text-white/90">
                {pickLang(language, "Müştərilər", "Customers")}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <Users className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-3xl font-bold mb-1">110</p>
              <p className="text-xs text-white/90">
                {pickLang(language, "Tədarükçülər", "Suppliers")}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <Users className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0026f6] to-[#001db8] rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-3xl font-bold mb-1">150</p>
              <p className="text-xs text-white/90">
                {pickLang(language, "Satınalma Fakturası", "Purchase Invoice")}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <FileText className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-3xl font-bold mb-1">170</p>
              <p className="text-xs text-white/90">
                {pickLang(language, "Satış Fakturası", "Sales Invoice")}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <FileText className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Purchase Chart - Spans 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {pickLang(language, "Satış & Satınalma", "Sales & Purchase")}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {pickLang(language, "Ümumi Satınalma", "Total Purchase")}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {(salesPurchaseTotals.totalPurchase / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {pickLang(language, "Ümumi Satış", "Total Sales")}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {(salesPurchaseTotals.totalSales / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {["1D", "1W", "1M", "3M", "6M", "1Y"].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedPeriod === period
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div key="purchase-sales-chart-container-1">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart id="chart-purchase-sales-1" data={purchaseSalesData}>
                <CartesianGrid key="grid-ps1" strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  key="xaxis-ps1"
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  key="yaxis-ps1"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar key="bar-sales-1" dataKey="sales" fill="#ff9b44" radius={[8, 8, 0, 0]} />
                <Bar key="bar-purchase-1" dataKey="purchase" fill="#ff6b6b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Information */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Ümumi Məlumat", "Overall Information")}
            </h3>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              {pickLang(language, "Bugün", "Today")}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div 
              onClick={() => navigate("/people/suppliers")}
              className="text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
            >
              <div className="bg-[#e8ebff] dark:bg-[#0026f6]/20 rounded-lg p-3 mb-2 inline-flex">
                <ShoppingBag className="w-5 h-5 text-[#0026f6] dark:text-[#0026f6]" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {pickLang(language, "Təchizatçılar", "Suppliers")}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {generalInfo.suppliers}
              </p>
            </div>

            <div 
              onClick={() => navigate("/clients")}
              className="text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
            >
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 mb-2 inline-flex">
                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {pickLang(language, "Müştəri", "Customer")}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {generalInfo.customers}
              </p>
            </div>

            <div 
              onClick={() => navigate("/orders")}
              className="text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
            >
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 mb-2 inline-flex">
                <ShoppingCart className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {pickLang(language, "Sifarişlər", "Orders")}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {generalInfo.orders}
              </p>
            </div>
          </div>

          {/* Customers Overview Donut */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              {pickLang(language, "Müştərilər İcmalı", "Customers Overview")}
            </h4>
            <div className="flex items-center justify-between gap-4">
              <div key="customers-overview-pie-container" className="flex-shrink-0" style={{ width: 160, height: 160 }}>
                <PieChart id="chart-customers-pie" width={160} height={160}>
                  <Pie
                    data={customersOverviewData}
                    cx={80}
                    cy={80}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {customersOverviewData.map((entry) => (
                      <Cell key={`cell-${entry.id}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {customerSummary.firstTime}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {pickLang(language, "İlk Dəfə", "First Time")}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#001db8]"></div>
                    <span className="text-xs text-green-600 font-medium">
                      +{customerSummary.firstTimeGrowth}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {customerSummary.returning}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {pickLang(language, "Qaytaran", "Return")}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                    <span className="text-xs text-green-600 font-medium">
                      +{customerSummary.returningGrowth}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Analytics & Sales By Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Analytics */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Satış Analitikası", "Sales Analytics")}
            </h3>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              2023
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div key="sales-analytics-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart id="chart-sales-analytics" data={salesAnalyticsData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop key="sales-gradient-start" offset="5%" stopColor="#ff9b44" stopOpacity={0.3} />
                    <stop key="sales-gradient-end" offset="95%" stopColor="#ff9b44" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid-sa" strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                key="xaxis-sa"
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                key="yaxis-sa"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickFormatter={(value) => `${value / 1000}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                key="area-sales-1"
                type="monotone"
                dataKey="sales"
                stroke="#ff9b44"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Sales By Countries */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Ölkələrə görə Satış", "Sales By Countries")}
            </h3>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              {pickLang(language, "Bu Həftə", "This Week")}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-center mb-4 h-32 bg-gradient-to-r from-[#f0f2ff] to-indigo-50 dark:from-[#001db8]/10 dark:to-indigo-950/10 rounded-lg">
            <p className="text-gray-400 text-xs">
              {pickLang(language, "[Dünya Xərit��si Vizuallaşdırması]", "[World Map Visualization]")}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">+{salesByCountry.growth}%</span>
            <span className="text-gray-500 dark:text-gray-400">
              {pickLang(language, "artım keçən həftə ilə müqayisədə", "increase compare to last week")}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Earning, Best Seller & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Earning */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {pickLang(language, "Həftəlik Qazanc", "Weekly Earning")}
            </h3>
            <div className="text-4xl">💰</div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {weeklyEarning.amount.toFixed(2)} ₼
          </p>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-green-600 font-medium">
              +{weeklyEarning.growth}% {pickLang(language, "artım keçən həftə ilə müqayisədə", "increase compare to last week")}
            </span>
          </div>
        </div>

        {/* Best Seller */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Ən Çox Satılan", "Best Seller")}
            </h3>
            <button 
              onClick={() => navigate("/products")}
              className="text-xs text-[#0026f6] dark:text-[#0026f6] hover:underline"
            >
              {pickLang(language, "Hamısını Gör", "View All")}
            </button>
          </div>
          <div className="space-y-3">
            {bestSellerProducts.slice(0, 3).map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{product.image}</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {pickLang(language, "Satış", "Sales")}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {product.sales}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Preview */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Son Əməliyyatlar", "Recent Transactions")}
            </h3>
            <button className="text-xs text-[#0026f6] dark:text-[#0026f6] hover:underline">
              {pickLang(language, "Hamısını Gör", "View All")}
            </button>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{transaction.productImage}</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.productName}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {transaction.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {transaction.amount}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                      transaction.status === "Success" ||
                      transaction.status === "Completed"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : transaction.status === "Cancelled"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expired Products */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {pickLang(language, "Vaxtı Keçmiş Məhsullar", "Expired Products")}
          </h3>
          <button className="text-xs text-[#0026f6] dark:text-[#0026f6] hover:underline">
            {pickLang(language, "Hamısını Gör", "View All")}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-3">
                  {pickLang(language, "Məhsul", "Product")}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-3">
                  SKU
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-3">
                  {pickLang(language, "İstehsal Tarixi", "Manufactured Date")}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-3">
                  {pickLang(language, "Son İstifadə Tarixi", "Expired Date")}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-3">
                  {pickLang(language, "Əməliyyat", "Action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {expiredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{product.image}</div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-gray-600 dark:text-gray-400">
                    {product.sku}
                  </td>
                  <td className="py-3 text-xs text-gray-600 dark:text-gray-400">
                    {product.purchaseDate}
                  </td>
                  <td className="py-3 text-xs text-gray-600 dark:text-gray-400">
                    {product.expiryDate}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase & Sales Stats + Recently Added Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase & Sales Stats - spans 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const colorClasses = {
                orange: {
                  bg: "from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30",
                  border: "border-orange-200 dark:border-orange-900/30",
                  iconBg: "bg-orange-200 dark:bg-orange-900/40",
                  iconColor: "text-orange-600 dark:text-orange-400",
                  textColor: "text-orange-500 dark:text-orange-500",
                },
                cyan: {
                  bg: "from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/30",
                  border: "border-teal-200 dark:border-teal-900/30",
                  iconBg: "bg-teal-200 dark:bg-teal-900/40",
                  iconColor: "text-teal-600 dark:text-teal-400",
                  textColor: "text-teal-500 dark:text-teal-500",
                },
                blue: {
                  bg: "from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/30",
                  border: "border-cyan-200 dark:border-cyan-900/30",
                  iconBg: "bg-cyan-200 dark:bg-cyan-900/40",
                  iconColor: "text-cyan-600 dark:text-cyan-400",
                  textColor: "text-cyan-500 dark:text-cyan-500",
                },
                red: {
                  bg: "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/30",
                  border: "border-red-200 dark:border-red-900/30",
                  iconBg: "bg-red-200 dark:bg-red-900/40",
                  iconColor: "text-red-600 dark:text-red-400",
                  textColor: "text-red-500 dark:text-red-500",
                },
              };
              const colors = colorClasses[card.color as keyof typeof colorClasses];
              
              return (
                <div key={card.id} className={`bg-gradient-to-br ${colors.bg} rounded-xl border ${colors.border} p-4`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${colors.iconBg} rounded-lg p-2`}>
                      <DollarSign className={`w-5 h-5 ${colors.iconColor}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${colors.iconColor} font-medium`}>
                        {card.amount.toLocaleString()} ₼
                      </p>
                      <p className={`text-[10px] ${colors.textColor}`}>
                        {card.title[language as keyof typeof card.title]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Purchase & Sales Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4" />
                {pickLang(language, "Satınalma & Satış", "Purchase & Sales")}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {pickLang(language, "Satış", "Sales")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {pickLang(language, "Satınalma", "Purchase")}
                  </span>
                </div>
                <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  2026
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div key="purchase-sales-chart-container-2">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart id="chart-purchase-sales-2" data={purchaseSalesData}>
                  <CartesianGrid
                    key="grid-ps2"
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    key="xaxis-ps2"
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis
                    key="yaxis-ps2"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar key="bar-sales-2" dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar key="bar-purchase-2" dataKey="purchase" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recently Added Products */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Son Əlavə Olunan Məhsullar", "Recently Added Products")}
            </h3>
            <button 
              onClick={() => navigate("/products")}
              className="text-xs text-[#0026f6] dark:text-[#0026f6] hover:underline cursor-pointer"
            >
              {pickLang(language, "Hamısını Gör", "View All")}
            </button>
          </div>
          <div className="space-y-4">
            {recentlyAddedProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate("/products")}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{product.image}</div>
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.category} • {product.quantity} {product.unit}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {product.price} ₼
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers, Top Categories & Order Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Customers */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Ən Yaxşı Müştərilər", "Top Customers")}
            </h3>
            <button 
              onClick={() => navigate("/clients")}
              className="text-xs text-[#0026f6] dark:text-[#0026f6] hover:underline cursor-pointer"
            >
              {pickLang(language, "Hamısını Gör", "View All")}
            </button>
          </div>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">{customer.image}</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {customer.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {customer.badge}
                      </span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {customer.orders}{" "}
                        {pickLang(language, "Sifariş", "Orders")}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {customer.amount} ₼
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Ən Yaxşı Kateqoriyalar", "Top Categories")}
            </h3>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              {pickLang(language, "Həftəlik", "Weekly")}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div key="top-categories-pie-container" style={{ width: 240, height: 240 }}>
              <PieChart id="chart-top-categories-pie" width={240} height={240}>
                <Pie
                  data={topCategoriesData}
                  cx={120}
                  cy={120}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {topCategoriesData.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {pickLang(language, "Kateqoriya Statistikası", "Category Statistics")}
            </h4>
            {topCategoriesData.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {category.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {category.value}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
              <div 
                onClick={() => navigate("/orders")}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors active:scale-[0.98]"
              >
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {pickLang(language, "Ümumi Sifarişlər", "Total Orders")}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {mockOrders.length}
                </span>
              </div>
              <div 
                onClick={() => navigate("/clients")}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors active:scale-[0.98]"
              >
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {pickLang(language, "Ümumi Müştərilər", "Total Customers")}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {mockClients.length}
                </span>
              </div>
              <div 
                onClick={() => navigate("/products")}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors active:scale-[0.98]"
              >
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {pickLang(language, "Ümumi Məhsul Sayı", "Total Products")}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {mockProducts.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {pickLang(language, "Sifariş Statistikası", "Order Statistics")}
            </h3>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              {pickLang(language, "Həftəlik", "Weekly")}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day, dayIndex) => (
                <div key={day} className="text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                    {day}
                  </p>
                  <div className="space-y-1">
                    {["6 Am", "8 Am", "10 Am", "12 Pm", "2 Pm", "4 Pm", "6 Pm"].map(
                      (hour, hourIndex) => {
                        const value =
                          orderStatsData[dayIndex * 7 + hourIndex]?.orders || 0;
                        const intensity =
                          value === 0
                            ? "bg-gray-100 dark:bg-gray-800"
                            : value < 10
                            ? "bg-orange-200 dark:bg-orange-900/40"
                            : value < 15
                            ? "bg-orange-300 dark:bg-orange-800/60"
                            : value < 20
                            ? "bg-orange-400 dark:bg-orange-700/80"
                            : "bg-orange-500 dark:bg-orange-600";
                        return (
                          <div
                            key={`${day}-${hour}`}
                            className={`w-full h-6 rounded ${intensity}`}
                            title={`${day} ${hour}: ${value} orders`}
                          ></div>
                        );
                      }
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
            <span>6 Am</span>
            <span>12 Pm</span>
            <span>6 Pm</span>
          </div>
        </div>
      </div>

      {/* Top Selling Products, Low Stock & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              {pickLang(language, "Ən Çox Satılan Məhsullar", "Top Selling Products")}
            </h3>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              {pickLang(language, "Bugün", "Today")}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {topSellingProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">{product.image}</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {product.id} • {product.sales}{" "}
                      {pickLang(language, "Satış", "Sales")}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {product.percentage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              {pickLang(language, "Az Stoklu Məhsullar", "Low Stock Products")}
            </h3>
            <button 
              onClick={() => navigate("/products")}
              className="text-xs text-[#0026f6] dark:text-[#0026f6] hover:underline cursor-pointer"
            >
              {pickLang(language, "Hamısını Gör", "View All")}
            </button>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">{product.image}</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      ID: {product.id}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  {product.stock}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#0026f6]" />
              {pickLang(language, "Son Satışlar", "Recent Sales")}
            </h3>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              {pickLang(language, "Həftəlik", "Weekly")}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">{sale.image}</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {sale.name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {sale.category} • {sale.sales} ₼
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                    {sale.date}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      sale.status === "Success"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : sale.status === "Cancelled"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                    }`}
                  >
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Stats & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Stats - spans 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-600" />
                {pickLang(language, "Satış Statistikası", "Sales Statics")}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-600">
                    {salesStats.totalRevenue.toLocaleString()} ₼
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    +{salesStats.revenueGrowth}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {pickLang(language, "Gəlir", "Revenue")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-600">
                    {salesStats.totalExpense.toLocaleString()} ₼
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    {salesStats.expenseGrowth}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {pickLang(language, "Xərc", "Expense")}
                  </span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              2026
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div key="sales-stats-bar-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart id="chart-sales-stats" data={salesStatsData}>
                <CartesianGrid key="grid-ss" strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  key="xaxis-ss"
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  key="yaxis-ss"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar key="bar-revenue-3" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar key="bar-expense-3" dataKey="expense" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              {pickLang(language, "Son Əməliyyatlar", "Recent Transactions")}
            </h3>
            <button 
              onClick={() => navigate("/orders")}
              className="text-xs text-[#0026f6] dark:text-[#0026f6] hover:underline cursor-pointer"
            >
              {pickLang(language, "Hamısını Gör", "View All")}
            </button>
          </div>

          {/* Transaction Type Tabs */}
          <div className="flex items-center gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium bg-orange-500 text-white">
              {pickLang(language, "Satış", "Sale")}
            </button>
            <button className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              {pickLang(language, "Satınalma", "Purchase")}
            </button>
            <button className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              {pickLang(language, "Təklif", "Quotation")}
            </button>
            <button className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              {pickLang(language, "Xərc", "Expenses")}
            </button>
            <button className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              {pickLang(language, "Faktura", "Invoices")}
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactionsWidget.map((transaction, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {transaction.date}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      transaction.status === "Completed"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                    {transaction.customer.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {transaction.customer}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {transaction.customerId}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {transaction.amount} ₼
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
