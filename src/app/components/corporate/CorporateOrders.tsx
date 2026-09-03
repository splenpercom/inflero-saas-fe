import { useState } from "react";
import { Search, Eye, Edit2, Plus, ChevronDown } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";

interface Order {
  id: string;
  client: string;
  orderDate: string;
  deliveryDate: string;
  amount: string;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  items: number;
}

export function CorporateOrders() {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data
  const orders: Order[] = [
    {
      id: "ORD-1245",
      client: "Tech Solutions LLC",
      orderDate: "Mar 4, 2026",
      deliveryDate: "Mar 10, 2026",
      amount: "₼3,450",
      status: "Completed",
      items: 5,
    },
    {
      id: "ORD-1244",
      client: "Global Enterprises",
      orderDate: "Mar 3, 2026",
      deliveryDate: "Mar 9, 2026",
      amount: "₼5,280",
      status: "Processing",
      items: 8,
    },
    {
      id: "ORD-1243",
      client: "Innovation Corp",
      orderDate: "Mar 2, 2026",
      deliveryDate: "Mar 8, 2026",
      amount: "₼2,100",
      status: "Pending",
      items: 3,
    },
    {
      id: "ORD-1242",
      client: "Digital Partners",
      orderDate: "Mar 1, 2026",
      deliveryDate: "Mar 7, 2026",
      amount: "₼4,650",
      status: "Completed",
      items: 6,
    },
    {
      id: "ORD-1241",
      client: "Tech Solutions LLC",
      orderDate: "Feb 28, 2026",
      deliveryDate: "Mar 6, 2026",
      amount: "₼1,890",
      status: "Cancelled",
      items: 2,
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: currentOrders,
    setCurrentPage,
    itemsPerPage: ordersPerPage,
  } = usePagination({
    data: filteredOrders,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${searchQuery}|${statusFilter}`,
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "Pending").length,
    processing: orders.filter(o => o.status === "Processing").length,
    completed: orders.filter(o => o.status === "Completed").length,
    cancelled: orders.filter(o => o.status === "Cancelled").length,
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          Orders
        </h1>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Add Button */}
        <button className="px-2.5 py-1.5 text-xs bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" />
          New Order
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === "all"
              ? "bg-[#0f766e] text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          All ({statusCounts.all})
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === "pending"
              ? "bg-yellow-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Pending ({statusCounts.pending})
        </button>
        <button
          onClick={() => setStatusFilter("processing")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === "processing"
              ? "bg-[#0f766e] text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Processing ({statusCounts.processing})
        </button>
        <button
          onClick={() => setStatusFilter("completed")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === "completed"
              ? "bg-green-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Completed ({statusCounts.completed})
        </button>
        <button
          onClick={() => setStatusFilter("cancelled")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === "cancelled"
              ? "bg-gray-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Cancelled ({statusCounts.cancelled})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">
                      {order.id}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {order.client}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {order.orderDate}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {order.deliveryDate}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {order.items}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-[#14b8a6] dark:text-[#14b8a6]">
                      {order.amount}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        order.status === "Completed"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : order.status === "Processing"
                          ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/30 text-[#14b8a6] dark:text-[#14b8a6]"
                          : order.status === "Pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 text-[#14b8a6] dark:text-[#14b8a6] hover:bg-[#ccfbf1] dark:hover:bg-[#14b8a6]/20 rounded-lg transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4">
        <DataPagination
          totalItems={totalItems}
          itemsPerPage={ordersPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          showText={dataPaginationShowText(tr)}
        />
      </div>
    </div>
  );
}