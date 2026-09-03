import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, Briefcase, Phone, Mail, TrendingUp, TrendingDown, Package, ShoppingCart, Activity, Clock } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserManagementTranslation } from "../../i18n/userManagementTranslations";
import { cn } from "../ui/utils";

import { pickLang } from "../../i18n/pickLang";
export function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const t = (key: any) => getUserManagementTranslation(key, language);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "transactions">("overview");

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  // Mock user data - in a real app, this would be fetched based on the id
  const user = {
    id: id || "1",
    name: "James Kirwin",
    avatar: "👨",
    phone: "+1 234 567 8900",
    email: "james.kirwin@example.com",
    role: "Manager",
    team: "Operations",
    dateOfJoin: "Jan 15, 2023",
    birthday: "March 24, 1990",
    nationality: "American",
    gender: "Male",
    employeeId: "EMP-001",
    department: "Warehouse Management",
    shift: "Morning (9 AM - 5 PM)",
    bloodGroup: "O+",
    address: "123 Main Street, New York, NY 10001",
    about: "Experienced warehouse manager with over 8 years in inventory and stock management. Specializes in optimizing warehouse operations and implementing efficient stock control systems.",
    bankName: "Chase Bank",
    accountNo: "1234567890",
    ifsc: "CHASE001",
    branch: "Manhattan Main Branch",
  };

  // Activity statistics
  const activityStats = [
    { label: tr("Ümumi Satışlar", "Total Sales"), value: "248", change: "+12%", trend: "up", icon: ShoppingCart, color: "brand" },
    { label: tr("Satınalmalar", "Purchases"), value: "142", change: "+8%", trend: "up", icon: Package, color: "blue" },
    { label: tr("Anbar Düzəlişləri", "Stock Adjustments"), value: "67", change: "-3%", trend: "down", icon: Activity, color: "purple" },
    { label: tr("Bu Ay Aktivlik", "This Month Activity"), value: "89", change: "+15%", trend: "up", icon: TrendingUp, color: "green" },
  ];

  // Recent activities
  const recentActivities = [
    {
      id: "1",
      type: "sale",
      title: tr("Satış Əməliyyatı", "Sales Transaction"),
      description: tr("Apple iPhone 15 satıldı - 5 ədəd", "Sold Apple iPhone 15 - 5 units"),
      amount: "7,500 ₼",
      time: "2 hours ago",
      icon: ShoppingCart,
      color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    },
    {
      id: "2",
      type: "purchase",
      title: tr("Satınalma", "Purchase"),
      description: tr("Beats Pro qulaqlıq alındı - 10 ədəd", "Purchased Beats Pro headphones - 10 units"),
      amount: "3,200 ₼",
      time: "5 hours ago",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      id: "3",
      type: "adjustment",
      title: tr("Anbar Düzəlişi", "Stock Adjustment"),
      description: tr("Nike Jordan ehtiyatı düzəldildi - (-8 ədəd)", "Nike Jordan stock adjusted - (-8 units)"),
      amount: "-8 units",
      time: "1 day ago",
      icon: Activity,
      color: "text-[#14b8a6] dark:text-[#14b8a6] bg-[#ccfbf1] dark:bg-[#14b8a6]/20",
    },
    {
      id: "4",
      type: "sale",
      title: tr("Satış Əməliyyatı", "Sales Transaction"),
      description: tr("Macbook Pro satıldı - 2 ədəd", "Sold Macbook Pro - 2 units"),
      amount: "6,000 ₼",
      time: "2 days ago",
      icon: ShoppingCart,
      color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    },
    {
      id: "5",
      type: "adjustment",
      title: tr("Anbar Düzəlişi", "Stock Adjustment"),
      description: tr("Amazon Echo Dot ehtiyatı əlavə edildi - (+50 ədəd)", "Amazon Echo Dot stock added - (+50 units)"),
      amount: "+50 units",
      time: "3 days ago",
      icon: Activity,
      color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  // Transaction history
  const transactionHistory = [
    { id: "1", date: "May 15, 2026", type: "Sale", product: "Apple iPhone 15", quantity: 5, amount: "7,500 ₼", status: "completed" },
    { id: "2", date: "May 15, 2026", type: "Purchase", product: "Beats Pro", quantity: 10, amount: "3,200 ₼", status: "completed" },
    { id: "3", date: "May 14, 2026", type: "Adjustment", product: "Nike Jordan", quantity: -8, amount: "-", status: "completed" },
    { id: "4", date: "May 14, 2026", type: "Sale", product: "Macbook Pro", quantity: 2, amount: "6,000 ₼", status: "completed" },
    { id: "5", date: "May 13, 2026", type: "Adjustment", product: "Amazon Echo Dot", quantity: 50, amount: "-", status: "completed" },
    { id: "6", date: "May 13, 2026", type: "Sale", product: "Apple Watch Series 5", quantity: 3, amount: "2,400 ₼", status: "completed" },
    { id: "7", date: "May 12, 2026", type: "Purchase", product: "Lobar Handy Chair", quantity: 20, amount: "4,000 ₼", status: "completed" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/user-management")}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToList")}
          </button>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#14b8a6] flex items-center justify-center text-3xl border-4 border-[#14b8a6]/20 dark:border-[#14b8a6]/30">
                {user.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {user.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6] dark:text-[#14b8a6] border border-[#14b8a6]/20 dark:border-[#14b8a6]/30">
                    {user.role}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {user.employeeId}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("team")}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.team}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("department")}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.department}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("dateOfJoin")}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.dateOfJoin}</div>
              </div>
              <div className="text-center md:text-right">
                <button
                  onClick={() => navigate(`/user-management/users/${id}/edit`)}
                  className="px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {t("editProfile")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {activityStats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              brand: "from-[#14b8a6] to-[#0d9488]",
              blue: "from-blue-400 to-blue-500",
              purple: "from-purple-400 to-purple-500",
              green: "from-green-400 to-green-500",
            }[stat.color];

            return (
              <div key={index} className={`bg-gradient-to-br ${colorClasses} rounded-lg p-5 text-white shadow-lg hover:shadow-xl transition-all`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1`}>
                    {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-white/80 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-6">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-1 p-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  activeTab === "overview"
                    ? "bg-[#14b8a6] text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {tr("Ümumi Baxış", "Overview")}
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  activeTab === "activity"
                    ? "bg-[#14b8a6] text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {tr("Son Aktivliklər", "Recent Activity")}
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  activeTab === "transactions"
                    ? "bg-[#14b8a6] text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {tr("Əməliyyatlar", "Transactions")}
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("basicInformation")}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("phone")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.phone}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("email")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.email}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("birthday")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.birthday}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("nationality")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.nationality}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("gender")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.gender}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("bloodGroup")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.bloodGroup}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("address")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.address}</div>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("personalInformation")}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("department")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.department}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("shift")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.shift}</div>
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("about")}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{user.about}</p>
                </div>

                {/* Bank Information */}
                <div className="space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("bankInformation")}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("bankName")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.bankName}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("accountNumber")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.accountNo}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("ifscCode")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.ifsc}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("branch")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.branch}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className={`rounded-lg p-2.5 ${activity.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {activity.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {activity.description}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {activity.amount}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                        {tr("TARİX", "DATE")}
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                        {tr("NÖV", "TYPE")}
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                        {tr("MƏHSUL", "PRODUCT")}
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                        {tr("MİQDAR", "QTY")}
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                        {tr("MƏBLƏĞ", "AMOUNT")}
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                        {tr("STATUS", "STATUS")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.map((transaction, index) => (
                      <tr
                        key={transaction.id}
                        className={`border-b border-gray-200 dark:border-gray-800 ${
                          index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                        }`}
                      >
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {transaction.date}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              transaction.type === "Sale" && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                              transaction.type === "Purchase" && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                              transaction.type === "Adjustment" && "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6] dark:text-[#14b8a6]"
                            )}
                          >
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                          {transaction.product}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium">
                          {transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium">
                          {transaction.amount}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                            {tr("Tamamlandı", "Completed")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
