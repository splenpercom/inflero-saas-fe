import { useState } from "react";
import { Printer, X, ChefHat, Calendar } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

type KOTStatus = "pending" | "inKitchen" | "ready" | "cancelled";

interface KOTItem {
  id: string;
  name: string;
  quantity: number;
}

interface KOT {
  id: string;
  kotNumber: string;
  orderNumber: string;
  kitchen: string;
  orderDate: string;
  waiter: string;
  status: KOTStatus;
  items: KOTItem[];
}

export function KOTManagement() {
  const { t } = useLanguage();
  const [kitchenFilter, setKitchenFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [startDate, setStartDate] = useState("12/02/2026");
  const [endDate, setEndDate] = useState("12/02/2026");
  const [statusFilter, setStatusFilter] = useState<"all" | KOTStatus>("all");

  // Safety check
  if (!t || !t.kotPage) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Mock data
  const kots: KOT[] = [
    {
      id: "1",
      kotNumber: "KOT #19",
      orderNumber: "Order #10",
      kitchen: "Non-Veg Kitchen",
      orderDate: "12/02/2026 03:01 AM",
      waiter: "Jacqulyn Bartle",
      status: "pending",
      items: [
        { id: "1", name: "Naan", quantity: 1 },
        { id: "2", name: "Tandoori Roti", quantity: 1 },
      ],
    },
    {
      id: "2",
      kotNumber: "KOT #12",
      orderNumber: "Order #5 (T: 3)",
      kitchen: "Non-Veg Kitchen",
      orderDate: "12/02/2026 03:01 AM",
      waiter: "Jacqulyn Bartle",
      status: "pending",
      items: [{ id: "1", name: "Chicken Manchurian", quantity: 3 }],
    },
    {
      id: "3",
      kotNumber: "KOT #10",
      orderNumber: "Order #4 (T: 3)",
      kitchen: "Non-Veg Kitchen",
      orderDate: "12/02/2026 03:01 AM",
      waiter: "Jacqulyn Bartle",
      status: "pending",
      items: [{ id: "1", name: "Chicken Manchurian", quantity: 3 }],
    },
    {
      id: "4",
      kotNumber: "KOT #3",
      orderNumber: "Order #5 (T: 3)",
      kitchen: "Veg Kitchen",
      orderDate: "12/02/2026 03:01 AM",
      waiter: "Jacqulyn Bartle",
      status: "pending",
      items: [{ id: "1", name: "Idli Sambar", quantity: 2 }],
    },
    {
      id: "5",
      kotNumber: "KOT #4",
      orderNumber: "Order #4 (T: 3)",
      kitchen: "Veg Kitchen",
      orderDate: "12/02/2026 03:01 AM",
      waiter: "Jacqulyn Bartle",
      status: "pending",
      items: [
        { id: "1", name: "Veg Manchow Soup", quantity: 1 },
        { id: "2", name: "Spring Rolls", quantity: 2 },
        { id: "3", name: "Chilli Paneer", quantity: 2 },
      ],
    },
    {
      id: "6",
      kotNumber: "KOT #2",
      orderNumber: "Order #2 (T: 10)",
      kitchen: "Veg Kitchen",
      orderDate: "12/02/2026 03:01 AM",
      waiter: "Jacqulyn Bartle",
      status: "pending",
      items: [{ id: "1", name: "Chilli Paneer", quantity: 2 }],
    },
    {
      id: "7",
      kotNumber: "KOT #1",
      orderNumber: "Order #1 (T: 9)",
      kitchen: "Veg Kitchen",
      orderDate: "12/02/2026 03:01 AM",
      waiter: "Jacqulyn Bartle",
      status: "pending",
      items: [
        { id: "1", name: "Veg Manchow Soup", quantity: 2 },
        { id: "2", name: "Paneer Tikka", quantity: 3 },
        { id: "3", name: "Malai Vada", quantity: 3 },
      ],
    },
  ];

  const getStatusBadge = (status: KOTStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700">
            {t.kotPage.pendingConfirmation}
          </span>
        );
      case "inKitchen":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700">
            {t.kotPage.inKitchen}
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700">
            {t.kotPage.foodIsReady}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
            {t.kotPage.cancelled}
          </span>
        );
    }
  };

  const getStatusCount = (status: KOTStatus) => {
    return kots.filter((kot) => kot.status === status).length;
  };

  const filteredKOTs = kots.filter((kot) => {
    if (statusFilter !== "all" && kot.status !== statusFilter) return false;
    if (kitchenFilter !== "all" && kot.kitchen !== kitchenFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.kotPage.title}
          </h1>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Kitchen Filter */}
            <select
              value={kitchenFilter}
              onChange={(e) => setKitchenFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">{t.kotPage.allKitchens}</option>
              <option value="Veg Kitchen">Veg Kitchen</option>
              <option value="Non-Veg Kitchen">Non-Veg Kitchen</option>
            </select>

            {/* Date Period Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="today">{t.kotPage.today}</option>
              <option value="yesterday">Yesterday</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Start Date"
                />
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t.kotPage.to}
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="End Date"
                />
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                statusFilter === "pending"
                  ? "bg-red-600 text-white"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
              }`}
            >
              {t.kotPage.pending} ({getStatusCount("pending")})
            </button>
            <button
              onClick={() => setStatusFilter("inKitchen")}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                statusFilter === "inKitchen"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
              }`}
            >
              {t.kotPage.inKitchen} ({getStatusCount("inKitchen")})
            </button>
            <button
              onClick={() => setStatusFilter("ready")}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                statusFilter === "ready"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
              }`}
            >
              {t.kotPage.foodIsReady} ({getStatusCount("ready")})
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                statusFilter === "cancelled"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-900/50"
              }`}
            >
              {t.kotPage.cancelled} ({getStatusCount("cancelled")})
            </button>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="px-2.5 py-1.5 text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        {/* KOT Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filteredKOTs.map((kot) => (
            <div
              key={kot.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-3"
            >
              {/* KOT Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {kot.kotNumber}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {kot.orderNumber}
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                  <Printer className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </button>
              </div>

              {/* Kitchen & Date */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                  <ChefHat className="w-3 h-3" />
                  <span>{kot.kitchen}</span>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-500">
                  {kot.orderDate}
                </div>
              </div>

              {/* Waiter */}
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-purple-700 dark:text-purple-300">
                    {kot.waiter.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <span>{kot.waiter}</span>
              </div>

              {/* Status Badge */}
              <div>{getStatusBadge(kot.status)}</div>

              {/* Items List */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.kotPage.itemName}
                </div>
                <div className="space-y-1.5">
                  {kot.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-900 dark:text-white">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.quantity} x
                        </span>
                        <div className="flex gap-1">
                          <button className="p-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                            <ChefHat className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                            <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                {kot.status === "pending" && (
                  <>
                    <button className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <ChefHat className="w-3.5 h-3.5" />
                      {t.kotPage.startCooking}
                    </button>
                    <button className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5" />
                      {t.kotPage.cancel}
                    </button>
                  </>
                )}
                {kot.status === "inKitchen" && (
                  <button className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
                    {t.kotPage.markReady}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredKOTs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
              <ChefHat className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.kotPage.noKOTs}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
