import { useState } from "react";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  RotateCcw,
  ChevronDown,
  Send,
  Lock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";

type SoftwareType = "Corporate" | "Restaurant" | "Gym/Hospital" | "Stores";

export function SuperAdminDashboard() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<SoftwareType>("Corporate");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Stats Data
  const stats = [
    {
      id: 1,
      title: "Total Companies",
      value: "5468",
      change: "+13.09%",
      trend: "up",
      icon: Building2,
      color: "orange",
      chartData: [20, 25, 22, 28, 24, 30, 27, 32],
    },
    {
      id: 2,
      title: "Active Companies",
      value: "4598",
      change: "-3.2%",
      trend: "down",
      icon: Building2,
      color: "purple",
      chartData: [25, 22, 26, 24, 20, 22, 19, 21],
    },
    {
      id: 3,
      title: "Total Subscribers",
      value: "3698",
      change: "+8.1%",
      trend: "up",
      icon: Users,
      color: "blue",
      chartData: [15, 18, 16, 20, 22, 25, 23, 26],
    },
    {
      id: 4,
      title: "Total Earnings",
      value: "89,878.58 ₼",
      change: "+10.6%",
      trend: "up",
      icon: DollarSign,
      color: "green",
      chartData: [30, 32, 35, 33, 38, 36, 40, 42],
    },
  ];

  // Companies Chart Data
  const companiesData = [
    { day: "M", count: 40 },
    { day: "Tu", count: 70 },
    { day: "W", count: 30 },
    { day: "T", count: 130 },
    { day: "F", count: 100 },
    { day: "S", count: 120 },
    { day: "Su", count: 110 },
  ];

  // Revenue Chart Data
  const revenueData = [
    { month: "Jan", revenue: 30 },
    { month: "Feb", revenue: 35 },
    { month: "Mar", revenue: 38 },
    { month: "Apr", revenue: 45 },
    { month: "May", revenue: 48 },
    { month: "Jun", revenue: 52 },
    { month: "Jul", revenue: 50 },
    { month: "Aug", revenue: 55 },
    { month: "Sep", revenue: 58 },
    { month: "Oct", revenue: 25 },
    { month: "Nov", revenue: 68 },
    { month: "Dec", revenue: 72 },
  ];

  // Top Plans Data
  const topPlansData = [
    { name: "Basic", value: 60, color: "#3B82F6" },
    { name: "Premium", value: 20, color: "#F59E0B" },
    { name: "Enterprise", value: 20, color: "#EF4444" },
  ];

  // Recent Transactions
  const recentTransactions = [
    {
      id: "#12147",
      company: "Stellar Dynamics",
      date: "14 Jan 2026",
      amount: "+245 ₼",
      plan: "Basic",
      avatar: "S",
      color: "bg-green-500",
    },
    {
      id: "#86592",
      company: "Quantum Nexus",
      date: "14 Jan 2026",
      amount: "-395 ₼",
      plan: "Enterprise",
      avatar: "Q",
      color: "bg-blue-500",
    },
    {
      id: "#2467",
      company: "Aurora Technologies",
      date: "14 Jan 2026",
      amount: "+145 ₼",
      plan: "Advanced",
      avatar: "A",
      color: "bg-purple-500",
    },
    {
      id: "#3412",
      company: "TerraFusion Energy",
      date: "14 Jan 2026",
      amount: "+145 ₼",
      plan: "Enterprise",
      avatar: "T",
      color: "bg-orange-500",
    },
    {
      id: "#3462",
      company: "Epicurean Delights",
      date: "14 Jan 2026",
      amount: "-977 ₼",
      plan: "Premium",
      avatar: "E",
      color: "bg-pink-500",
    },
  ];

  // Recently Registered
  const recentlyRegistered = [
    {
      name: "Pitch",
      plan: "Basic (Monthly)",
      users: 150,
      avatar: "P",
      color: "bg-gray-800",
    },
    {
      name: "Initech",
      plan: "Enterprise (Yearly)",
      users: 200,
      avatar: "I",
      color: "bg-purple-600",
    },
    {
      name: "Umbrella Corp",
      plan: "Advanced (Monthly)",
      users: 129,
      avatar: "U",
      color: "bg-orange-500",
    },
    {
      name: "Capital Partners",
      plan: "Enterprise (Monthly)",
      users: 103,
      avatar: "C",
      color: "bg-orange-600",
    },
    {
      name: "Massive Dynamic",
      plan: "Premium (Yearly)",
      users: 108,
      avatar: "M",
      color: "bg-gray-700",
    },
  ];

  // Recent Plan Expired
  const recentPlanExpired = [
    {
      name: "Silicon Corp",
      date: "10 Apr 2026",
      avatar: "S",
      color: "bg-blue-500",
    },
    {
      name: "Hubspot",
      date: "12 Jun 2026",
      avatar: "H",
      color: "bg-orange-500",
    },
    {
      name: "Lieon Industries",
      date: "16 Jun 2026",
      avatar: "L",
      color: "bg-gray-600",
    },
    {
      name: "TerraFusion Energy",
      date: "12 May 2026",
      avatar: "T",
      color: "bg-orange-600",
    },
    {
      name: "Epicurean Delights",
      date: "15 May 2026",
      avatar: "E",
      color: "bg-blue-600",
    },
  ];

  const tabs: { name: SoftwareType; locked: boolean }[] = [
    { name: "Corporate", locked: false },
    { name: "Restaurant", locked: true },
    { name: "Gym/Hospital", locked: true },
    { name: "Stores", locked: true },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-4">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30 p-4 sm:p-5 overflow-hidden backdrop-blur-sm">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome Back, Adrian
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                14 New Companies Subscribed Today
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 px-2.5 py-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">03/09/2026 - 03/15/2026</span>
                <span className="sm:hidden">This Week</span>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30">
                Companies
              </button>
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
                All Packages
              </button>
              <button
                onClick={handleRefresh}
                className={`p-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-1">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => !tab.locked && setActiveTab(tab.name)}
              disabled={tab.locked}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.name
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                  : tab.locked
                  ? "text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.name}
              {tab.locked && <Lock className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 relative overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-2.5">
              <div
                className={`w-9 h-9 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}
              >
                <stat.icon
                  className={`w-4 h-4 text-${stat.color}-600 dark:text-${stat.color}-400`}
                />
              </div>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
                  stat.trend === "up"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
              {stat.title}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            {/* Mini Chart */}
            <div className="mt-2.5 h-7">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stat.chartData.map((val, i) => ({ value: val, index: i, id: `${stat.id}-${i}` }))}>
                  <Bar
                    dataKey="value"
                    fill={
                      stat.color === "orange"
                        ? "#F97316"
                        : stat.color === "purple"
                        ? "#A855F7"
                        : stat.color === "blue"
                        ? "#3B82F6"
                        : "#10B981"
                    }
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Companies Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Companies
            </h3>
            <button className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              This Week
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 mr-2">
              <TrendingUp className="w-3 h-3" />
              +8%
            </span>
            5 Companies from last month
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={companiesData}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                stroke="#9CA3AF"
              />
              <Tooltip />
              <Bar dataKey="count" fill="#1F2937" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Revenue
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Monthly Overview
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10 }}
                stroke="#9CA3AF"
              />
              <Tooltip />
              <Bar dataKey="revenue" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Plans Pie Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Top Plans
            </h3>
            <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              View All
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={topPlansData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {topPlansData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {topPlansData.map((plan) => (
              <div key={plan.name} className="text-center">
                <div
                  className="w-2.5 h-2.5 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: plan.color }}
                />
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {plan.name}
                </p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {plan.value}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Recent Transactions, Recently Registered, Recent Plan Expired */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h3>
            <button className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full ${transaction.color} flex items-center justify-center text-white font-semibold text-xs`}
                >
                  {transaction.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {transaction.company}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {transaction.id} • {transaction.date}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-bold ${
                      transaction.amount.startsWith("+")
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {transaction.amount}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {transaction.plan}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Registered */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recently Registered
            </h3>
            <button className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentlyRegistered.map((company, index) => (
              <div
                key={index}
                className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full ${company.color} flex items-center justify-center text-white font-semibold text-xs`}
                >
                  {company.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {company.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {company.plan}
                  </p>
                </div>
                <p className="text-[11px] font-semibold text-gray-900 dark:text-white">
                  {company.users} Users
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Plan Expired */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Plan Expired
            </h3>
            <button className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentPlanExpired.map((company, index) => (
              <div
                key={index}
                className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full ${company.color} flex items-center justify-center text-white font-semibold text-xs`}
                >
                  {company.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {company.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Expired: {company.date}
                  </p>
                </div>
                <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  Remind
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}