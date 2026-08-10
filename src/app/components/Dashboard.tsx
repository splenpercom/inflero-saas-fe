import { AlertCircle, ChefHat } from "lucide-react";
import { memo, useMemo } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { formatDate, formatDateLong, formatMonthYear, formatTime } from "../lib/dateFormat";
import { useOrders } from "../contexts/OrderContext";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  UtensilsCrossed,
  Truck,
  Banknote,
  CreditCard,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "up" | "down";
  subText: string;
}

const StatCard = memo(function StatCard({ title, value, change, changeType, subText }: StatCardProps) {
  return (
    <div className="glass-card glass-hover p-3 xl:p-4 border border-white/30 dark:border-white/10 shadow-glass">
      <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
        {title}
      </h3>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs">
        {changeType === "up" ? (
          <TrendingUp className="w-3 h-3 text-green-500" />
        ) : (
          <TrendingDown className="w-3 h-3 text-blue-500" />
        )}
        <span className={changeType === "up" ? "text-green-500 font-medium" : "text-blue-500 font-medium"}>
          {change}
        </span>
        <span className="text-gray-500 dark:text-gray-400">{subText}</span>
      </div>
    </div>
  );
});

interface OrderCardProps {
  orderNumber: string;
  type: string;
  date: string;
  time: string;
  items: number;
  price: string;
  status: "paid" | "billed" | "pending";
  orderStatus: string;
  server: string;
  badge: "pos" | "shop";
  icon: string;
}

function OrderCard({
  orderNumber,
  type,
  date,
  time,
  items,
  price,
  status,
  orderStatus,
  server,
  badge,
  icon,
}: OrderCardProps) {
  const { t } = useLanguage();
  
  const statusColors = {
    paid: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800",
    billed: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
  };

  const badgeColors = {
    pos: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800",
    shop: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
  };

  const statusDotColors = {
    "Order Served": "bg-green-500",
    "Order Confirmed": "bg-blue-500",
    "Order Placed": "bg-yellow-500",
  };

  return (
    <div className="glass-card mb-2.5 glass-hover p-3 border border-white/30 dark:border-white/10">
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center flex-shrink-0 border border-blue-200/30 dark:border-blue-500/30">
          {icon === "utensils" ? (
            <UtensilsCrossed className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : icon === "truck" ? (
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">
              {icon}
            </span>
          )}
        </div>

        {/* Order Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-gray-900 dark:text-white font-semibold text-sm">
                {orderNumber}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {type}
              </p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${statusColors[status]}`}
              >
                {status === "paid" ? t.paid : status === "billed" ? t.billed : "Pending"}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${badgeColors[badge]}`}
              >
                {badge === "pos" ? "POS" : t.shop}
              </span>
            </div>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1.5">
            {t.orderDate}: {date} {time}
          </p>

          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
            {items} {t.items}
          </p>

          {/* Price and Status */}
          <div className="flex items-center justify-between">
            <p className="text-gray-900 dark:text-white text-base font-bold">
              {price}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    statusDotColors[orderStatus as keyof typeof statusDotColors] ||
                    "bg-gray-500"
                  }`}
                />
                <span className="text-gray-600 dark:text-gray-400 text-xs">
                  {orderStatus}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 text-xs">
                  {server}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { t, language } = useLanguage();
  const {
    getTodayOrders,
    getTodayEarnings,
    getTodayCustomers,
    getMonthlyEarnings,
    getAverageDailyEarnings,
    getPaymentMethodTotals,
    getTopSellingDishes,
    getTopSellingTables,
  } = useOrders();

  // Calculate live stats
  const todayOrders = useMemo(() => getTodayOrders(), [getTodayOrders]);
  const todaysOrderCount = todayOrders.length;
  const todaysEarnings = useMemo(() => getTodayEarnings(), [getTodayEarnings]);
  const todaysCustomers = useMemo(() => getTodayCustomers(), [getTodayCustomers]);
  const monthlyEarnings = useMemo(() => getMonthlyEarnings(), [getMonthlyEarnings]);
  const avgDailyEarnings = useMemo(() => getAverageDailyEarnings(), [getAverageDailyEarnings]);
  const paymentMethods = useMemo(() => getPaymentMethodTotals(), [getPaymentMethodTotals]);
  const topDishes = useMemo(() => getTopSellingDishes(5), [getTopSellingDishes]);
  const topTables = useMemo(() => getTopSellingTables(5), [getTopSellingTables]);

  const currentMonthName = formatMonthYear(new Date(), language);

  // Map dish images
  const dishImages: { [key: string]: string } = {
    "Paneer Tikka": "https://images.unsplash.com/photo-1666001120694-3ebe8fd207be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYW5lZXIlMjB0aWtrYSUyMGluZGlhbnxlbnwxfHx8fDE3NzA3OTI1MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "Butter Chicken": "https://images.unsplash.com/photo-1714799263303-29e7d638578a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXIlMjBjaGlja2VuJTIwaW5kaWFufGVufDF8fHx8MTc3MDg5Njg5NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "Vegetable Hakka Noodles": "https://images.unsplash.com/photo-1601565960311-8a7f4e1ab709?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWtrYSUyMG5vb2RsZXMlMjB2ZWdldGFibGV8ZW58MXx8fHwxNzcwODE4NDU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "Veg Manchow Soup": "https://images.unsplash.com/photo-1633364468491-b0df288c7da7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHNvdXAlMjBib3dsJTIwaG90fGVufDF8fHx8MTc3MDg5NjkwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "Spring Rolls": "https://images.unsplash.com/photo-1577859584099-38d38a4aacb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcHJpbmclMjByb2xscyUyMGNyaXNweXxlbnwxfHx8fDE3NzA4MTg0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  };

  // Default dish image
  const defaultDishImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

  // Mock data for the chart (could be calculated from order history later)
  const chartData = [
    { date: "08/02/2026", earnings: 5400 },
    { date: "09/02/2026", earnings: 9450 },
    { date: "10/02/2026", earnings: todaysEarnings },
  ];

  // Format today's orders for display
  const ordersData = todayOrders.slice(0, 10).map((order) => ({
    orderNumber: order.orderNumber,
    type: order.type === "dineIn" ? t.dineIn : order.type === "delivery" ? t.delivery : order.customerName,
    date: formatDate(order.createdAt, language),
    time: formatTime(order.createdAt, language),
    items: order.itemCount,
    price: formatCurrency(order.total),
    status: order.status as "paid" | "billed" | "pending",
    orderStatus: order.location === "Order Served" ? t.orderServed : order.location === "Order Confirmed" ? t.orderConfirmed : t.orderPlaced,
    server: order.waiter,
    badge: (order.type === "pos" ? "pos" : "shop") as "pos" | "shop",
    icon: order.tableNumber || (order.type === "delivery" ? "utensils" : "--"),
  }));

  const currentDate = formatDateLong(new Date(), language);

  const currentTime = formatTime(new Date(), language);

  return (
    <div className="p-4 xl:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">
          {t.dashboard}
        </h1>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>
            {currentDate}, {currentTime}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-5">
        {/* Left Column - Statistics and Chart */}
        <div className="lg:col-span-2 space-y-4 xl:space-y-5">
          {/* Statistics Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {t.statistics}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                title={t.todaysOrders}
                value={todaysOrderCount}
                change="↑900%"
                changeType="up"
                subText={t.sinceYesterday}
              />
              <StatCard
                title={t.todaysEarnings}
                value={formatCurrency(todaysEarnings)}
                change="↑625.73%"
                changeType="up"
                subText={t.sinceYesterday}
              />
              <StatCard
                title={t.todaysCustomer}
                value={todaysCustomers}
                change="↑400%"
                changeType="up"
                subText={t.sinceYesterday}
              />
              <StatCard
                title={`${t.averageDailyEarnings} (${currentMonthName})`}
                value={formatCurrency(avgDailyEarnings)}
                change="↑109603.2%"
                changeType="up"
                subText={t.sincePreviousMonth}
              />
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg xl:text-xl font-bold text-gray-900 dark:text-white">
                  49,321.44₼
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {t.salesThisMonth}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-500">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    ↑109603.2%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.sincePreviousMonth}
                </p>
              </div>
            </div>

            <div className="h-48 xl:h-56 w-full min-h-[192px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop key="stop-1" offset="0%" stopColor="#0026f6" stopOpacity={0.8} />
                      <stop key="stop-2" offset="100%" stopColor="#0066ff" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    key="cartesian-grid"
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                    opacity={0.5}
                  />
                  <XAxis
                    key="x-axis"
                    dataKey="date"
                    stroke="#9ca3af"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    className="dark:stroke-gray-500"
                  />
                  <YAxis
                    key="y-axis"
                    stroke="#9ca3af"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(value) => `${value}₼`}
                    className="dark:stroke-gray-500"
                  />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#111827",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#6b7280", fontWeight: 500 }}
                    formatter={(value: any) => [`${value}₼`, "Earnings"]}
                  />
                  <Line
                    key="line-earnings"
                    type="monotone"
                    dataKey="earnings"
                    stroke="url(#lineGradient)"
                    strokeWidth={2.5}
                    dot={{ fill: "#0026f6", r: 4 }}
                    activeDot={{ r: 6, fill: "#0026f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {t.paymentMethodToday}
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-200 dark:border-green-800">
                    <Banknote className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t.cash}
                  </span>
                </div>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {formatCurrency(paymentMethods.cash)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                    <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t.card}
                  </span>
                </div>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {formatCurrency(paymentMethods.card)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Selling Dish (Today) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              {t.topSellingDishToday}
            </h3>
            <div className="space-y-3">
              {topDishes.map((dish, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium w-5">{index + 1}</span>
                  <img 
                    src={dishImages[dish.name] || defaultDishImage} 
                    alt={dish.name}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{dish.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{dish.quantity} Qty</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(dish.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Tables (Today) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              {t.topSellingTablesToday}
            </h3>
            <div className="space-y-3">
              {topTables.map((table, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium w-5">#{index + 1}</span>
                  <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{table.table}</span>
                  </div>
                  <div className="flex-1"></div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(table.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Today's Orders */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {t.todaysOrdersTitle}
            </h2>
            <div className="overflow-y-auto max-h-[calc(100vh-12rem)] scrollbar-hide">
              {ordersData.map((order, index) => (
                <OrderCard key={index} {...order} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}