import { useState, useMemo, useCallback } from "react";
import { useConfirm } from "../../context/ConfirmContext";
import {
  Search,
  Eye,
  Download,
  Trash2,
  RotateCcw,
  FileText,
  CreditCard,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  X,
  Calendar,
  Lock,
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { ModernSelect } from "./ModernSelect";

type SoftwareType = "Corporate" | "Restaurant" | "Gym/Hospital" | "Stores";

interface Subscription {
  id: string;
  subscriberName: string;
  subscriberLogo: string;
  subscriberLogoColor: string;
  plan: string;
  planType: string;
  billingCycle: string;
  paymentMethod: string;
  amount: number;
  createdDate: string;
  expiringOn: string;
  status: "Paid" | "Pending" | "Expired";
  email: string;
  address: string;
  paymentDetails: string;
  softwareType: SoftwareType;
}

// Mock Data
const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    subscriberName: "BrightWave Innovations",
    subscriberLogo: "B",
    subscriberLogoColor: "bg-purple-500",
    plan: "Advanced",
    planType: "Monthly",
    billingCycle: "30 Days",
    paymentMethod: "Credit Card",
    amount: 200,
    createdDate: "12 Sep 2024",
    expiringOn: "11 Oct 2024",
    status: "Paid",
    email: "michael@example.com",
    address: "3705 Lynn Avenue, Phelps, WI 54554",
    paymentDetails: "Credit Card - 123***********789",
    softwareType: "Corporate",
  },
  {
    id: "2",
    subscriberName: "Stellar Dynamics",
    subscriberLogo: "S",
    subscriberLogoColor: "bg-green-500",
    plan: "Basic",
    planType: "Yearly",
    billingCycle: "365 Days",
    paymentMethod: "Paypal",
    amount: 600,
    createdDate: "24 Oct 2024",
    expiringOn: "23 Oct 2025",
    status: "Paid",
    email: "sophie@example.com",
    address: "123 Main St, New York, NY 10001",
    paymentDetails: "Paypal - sophie@example.com",
    softwareType: "Restaurant",
  },
  {
    id: "3",
    subscriberName: "Quantum Nexus",
    subscriberLogo: "Q",
    subscriberLogoColor: "bg-blue-500",
    plan: "Advanced",
    planType: "Monthly",
    billingCycle: "30 Days",
    paymentMethod: "Debit Card",
    amount: 200,
    createdDate: "18 Feb 2024",
    expiringOn: "17 Mar 2024",
    status: "Paid",
    email: "cameron@example.com",
    address: "456 Tech Ave, San Francisco, CA 94105",
    paymentDetails: "Debit Card - 456***********123",
    softwareType: "Gym/Hospital",
  },
  {
    id: "4",
    subscriberName: "EcoVision Enterprises",
    subscriberLogo: "E",
    subscriberLogoColor: "bg-cyan-500",
    plan: "Advanced",
    planType: "Monthly",
    billingCycle: "30 Days",
    paymentMethod: "Paypal",
    amount: 200,
    createdDate: "17 Oct 2024",
    expiringOn: "16 Nov 2024",
    status: "Paid",
    email: "doris@example.com",
    address: "789 Green Blvd, Portland, OR 97201",
    paymentDetails: "Paypal - doris@example.com",
    softwareType: "Stores",
  },
  {
    id: "5",
    subscriberName: "Aurora Technologies",
    subscriberLogo: "A",
    subscriberLogoColor: "bg-purple-600",
    plan: "Enterprise",
    planType: "Monthly",
    billingCycle: "30 Days",
    paymentMethod: "Credit Card",
    amount: 400,
    createdDate: "20 Jul 2024",
    expiringOn: "19 Aug 2024",
    status: "Paid",
    email: "thomas@example.com",
    address: "321 Innovation Dr, Austin, TX 78701",
    paymentDetails: "Credit Card - 789***********456",
    softwareType: "Corporate",
  },
  {
    id: "6",
    subscriberName: "BlueSky Ventures",
    subscriberLogo: "B",
    subscriberLogoColor: "bg-blue-600",
    plan: "Advanced",
    planType: "Monthly",
    billingCycle: "30 Days",
    paymentMethod: "Paypal",
    amount: 200,
    createdDate: "10 Apr 2024",
    expiringOn: "09 May 2024",
    status: "Paid",
    email: "kathleen@example.com",
    address: "654 Sky Lane, Seattle, WA 98101",
    paymentDetails: "Paypal - kathleen@example.com",
    softwareType: "Restaurant",
  },
];

export function SuperAdminSubscriptions() {
  const askConfirm = useConfirm();
  const [activeTab, setActiveTab] = useState<SoftwareType>("Corporate");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("All Plans");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Last 7 Days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleViewInvoice = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setViewInvoiceOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: "Are you sure you want to delete this subscription?",
      variant: "danger",
    })) {
      // Delete subscription logic here
    }
  };

  // Stats calculations
  const totalTransaction = mockSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const totalSubscribers = mockSubscriptions.length;
  const activeSubscribers = mockSubscriptions.filter((s) => s.status === "Paid").length;
  const expiredSubscribers = mockSubscriptions.filter((s) => s.status === "Expired").length;

  const stats = [
    {
      id: 1,
      title: "Total Transaction",
      value: `${totalTransaction.toLocaleString()} ₼`,
      change: "+18.01%",
      trend: "up",
      color: "orange",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      chartData: [40, 60, 45, 70, 55, 80, 65, 90, 75, 95],
      chartColor: "#F97316",
    },
    {
      id: 2,
      title: "Total Subscribers",
      value: totalSubscribers.toString(),
      change: "+19.01%",
      trend: "up",
      color: "blue",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      chartData: [30, 50, 40, 65, 50, 75, 60, 85, 70, 90],
      chartColor: "#3B82F6",
    },
    {
      id: 3,
      title: "Active Subscribers",
      value: activeSubscribers.toString(),
      change: "+19.01%",
      trend: "up",
      color: "green",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      chartData: [35, 55, 45, 70, 55, 80, 65, 90, 75, 95],
      chartColor: "#10B981",
    },
    {
      id: 4,
      title: "Expired Subscribers",
      value: expiredSubscribers.toString(),
      change: "+19.01%",
      trend: "up",
      color: "red",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      chartData: [20, 40, 30, 55, 40, 65, 50, 75, 60, 80],
      chartColor: "#EF4444",
    },
  ];

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    return mockSubscriptions.filter((subscription) => {
      const matchesSearch =
        subscription.subscriberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = selectedPlan === "All Plans" || subscription.plan === selectedPlan;
      const matchesStatus =
        selectedStatus === "All Status" || subscription.status === selectedStatus;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [searchTerm, selectedPlan, selectedStatus]);

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
          Subscriptions
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Manage your subscriptions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-[11px] text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <span>↑ {stat.change}</span>
                  <span className="text-gray-400">from last week</span>
                </p>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="mt-2.5 h-7">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stat.chartData.map((val, i) => ({ value: val, index: i }))}>
                  <Bar dataKey="value" fill={stat.chartColor} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Software Type Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-1">
        <div className="flex flex-wrap gap-1">
          {(["Corporate", "Restaurant", "Gym/Hospital", "Stores"] as SoftwareType[]).map((type) => {
            const isActive = activeTab === type;
            const isLocked = type !== "Corporate";
            
            return (
              <button
                key={type}
                onClick={() => !isLocked && setActiveTab(type)}
                disabled={isLocked}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                    : isLocked
                    ? "text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {type}
                {isLocked && <Lock className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        {/* Top Action Bar */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800">
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800">
              <FileText className="w-3.5 h-3.5" />
              Excel
            </button>
            <button
              onClick={handleRefresh}
              className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              <ModernSelect
                value={selectedPlan}
                onChange={setSelectedPlan}
                options={["All Plans", "Basic", "Advanced", "Enterprise"]}
                placeholder="Select Plan"
                className="w-36"
              />
              <ModernSelect
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={["All Status", "Paid", "Pending", "Expired"]}
                placeholder="Select Status"
                className="w-36"
              />
              <ModernSelect
                value={sortBy}
                onChange={setSortBy}
                options={["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"]}
                placeholder="Sort By"
                className="w-36"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Subscriber
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Billing Cycle
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Expiring On
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredSubscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full ${subscription.subscriberLogoColor} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}
                      >
                        {subscription.subscriberLogo}
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {subscription.subscriberName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {subscription.plan} ({subscription.planType})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {subscription.billingCycle}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {subscription.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {subscription.amount} ₼
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {subscription.createdDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {subscription.expiringOn}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        subscription.status === "Paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : subscription.status === "Pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      ● {subscription.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewInvoice(subscription)}
                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subscription.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredSubscriptions.length === 0 && (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No subscriptions found
            </p>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {viewInvoiceOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Invoice</h2>
              <button
                onClick={() => setViewInvoiceOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Invoice Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    Inflero
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Multi-Business Management Platform
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Invoice
                  </h3>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p className="flex items-center justify-end gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-semibold">INV0287</span>
                    </p>
                    <p className="flex items-center justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Issue date: {selectedSubscription.createdDate}
                    </p>
                    <p className="flex items-center justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Due date: {selectedSubscription.expiringOn}
                    </p>
                  </div>
                </div>
              </div>

              {/* From and To */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Invoice From:
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p className="font-semibold text-gray-900 dark:text-white">Inflero</p>
                    <p>367 Hillcrest Lane, Irvine, California, United States</p>
                    <p>noreply@inflero.com</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Invoice To:
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedSubscription.subscriberName}
                    </p>
                    <p>{selectedSubscription.address}</p>
                    <p>{selectedSubscription.email}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                        Billing Cycle
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                        Created Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                        Expiring On
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {selectedSubscription.plan} ({selectedSubscription.planType})
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {selectedSubscription.billingCycle}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {selectedSubscription.createdDate}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {selectedSubscription.expiringOn}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold text-gray-900 dark:text-white">
                        {selectedSubscription.amount.toFixed(2)} ₼
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Info and Total */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    Payment info:
                  </h4>
                  <div className="space-y-2 text-xs">
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedSubscription.paymentDetails}
                    </p>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedSubscription.amount.toFixed(2)} ₼
                      </span>
                    </div>
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between md:justify-end gap-8">
                      <span className="text-gray-600 dark:text-gray-400">Sub Total</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedSubscription.amount.toFixed(2)} ₼
                      </span>
                    </div>
                    <div className="flex justify-between md:justify-end gap-8">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        0.00 ₼
                      </span>
                    </div>
                    <div className="flex justify-between md:justify-end gap-8 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="font-bold text-base text-gray-900 dark:text-white">
                        {selectedSubscription.amount.toFixed(2)} ₼
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                  Terms & Conditions:
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">●</span>
                    <span>
                      All payments must be made according to the agreed schedule. Late payments
                      may incur additional fees.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">●</span>
                    <span>
                      We are not liable for any indirect, incidental, or consequential damages,
                      including loss of profits, revenue, or data.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setViewInvoiceOpen(false)}
                  className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}