import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Eye,
  Download,
  Trash2,
  RotateCcw,
  FileText,
  X,
  Calendar,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { ModernSelect } from "./ModernSelect";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type SoftwareType = "Corporate" | "Restaurant" | "Gym/Hospital" | "Stores";

interface Transaction {
  id: string;
  invoiceId: string;
  customerName: string;
  customerLogo: string;
  customerLogoColor: string;
  email: string;
  createdDate: string;
  amount: number;
  paymentMethod: string;
  status: "Paid" | "Unpaid" | "Pending";
  address: string;
  billingCycle: string;
  expiringOn: string;
  plan: string;
  softwareType: SoftwareType;
}

// Mock Data
const mockTransactions: Transaction[] = [
  {
    id: "1",
    invoiceId: "INV001",
    customerName: "BrightWave Innovations",
    customerLogo: "B",
    customerLogoColor: "bg-purple-500",
    email: "michael@example.com",
    createdDate: "12 Sep 2024",
    amount: 200,
    paymentMethod: "Credit Card",
    status: "Paid",
    address: "367 Hillcrest Lane, Irvine, California, United States",
    billingCycle: "30 Days",
    expiringOn: "12 Oct 2024",
    plan: "Advanced (Monthly)",
    softwareType: "Corporate",
  },
  {
    id: "2",
    invoiceId: "INV002",
    customerName: "Stellar Dynamics",
    customerLogo: "S",
    customerLogoColor: "bg-green-500",
    email: "sophie@example.com",
    createdDate: "24 Oct 2024",
    amount: 600,
    paymentMethod: "Paypal",
    status: "Paid",
    address: "123 Main St, New York, NY 10001",
    billingCycle: "365 Days",
    expiringOn: "23 Oct 2025",
    plan: "Basic (Yearly)",
    softwareType: "Restaurant",
  },
  {
    id: "3",
    invoiceId: "INV003",
    customerName: "Quantum Nexus",
    customerLogo: "Q",
    customerLogoColor: "bg-blue-500",
    email: "cameron@example.com",
    createdDate: "18 Feb 2024",
    amount: 200,
    paymentMethod: "Debit Card",
    status: "Paid",
    address: "456 Tech Ave, San Francisco, CA 94105",
    billingCycle: "30 Days",
    expiringOn: "17 Mar 2024",
    plan: "Advanced (Monthly)",
    softwareType: "Gym/Hospital",
  },
  {
    id: "4",
    invoiceId: "INV004",
    customerName: "EcoVision Enterprises",
    customerLogo: "E",
    customerLogoColor: "bg-cyan-500",
    email: "doris@example.com",
    createdDate: "17 Oct 2024",
    amount: 200,
    paymentMethod: "Paypal",
    status: "Paid",
    address: "789 Green Blvd, Portland, OR 97201",
    billingCycle: "30 Days",
    expiringOn: "16 Nov 2024",
    plan: "Advanced (Monthly)",
    softwareType: "Stores",
  },
  {
    id: "5",
    invoiceId: "INV005",
    customerName: "Aurora Technologies",
    customerLogo: "A",
    customerLogoColor: "bg-purple-600",
    email: "thomas@example.com",
    createdDate: "20 Jul 2024",
    amount: 400,
    paymentMethod: "Credit Card",
    status: "Paid",
    address: "321 Innovation Dr, Austin, TX 78701",
    billingCycle: "30 Days",
    expiringOn: "19 Aug 2024",
    plan: "Enterprise (Monthly)",
    softwareType: "Corporate",
  },
  {
    id: "6",
    invoiceId: "INV006",
    customerName: "BlueSky Ventures",
    customerLogo: "B",
    customerLogoColor: "bg-blue-600",
    email: "kathleen@example.com",
    createdDate: "10 Apr 2024",
    amount: 200,
    paymentMethod: "Paypal",
    status: "Paid",
    address: "654 Sky Lane, Seattle, WA 98101",
    billingCycle: "30 Days",
    expiringOn: "09 May 2024",
    plan: "Advanced (Monthly)",
    softwareType: "Restaurant",
  },
  {
    id: "7",
    invoiceId: "INV007",
    customerName: "TerraFusion Energy",
    customerLogo: "T",
    customerLogoColor: "bg-orange-500",
    email: "bruce@example.com",
    createdDate: "29 Aug 2024",
    amount: 4800,
    paymentMethod: "Credit Card",
    status: "Paid",
    address: "987 Energy Way, Houston, TX 77001",
    billingCycle: "365 Days",
    expiringOn: "28 Aug 2025",
    plan: "Enterprise (Yearly)",
    softwareType: "Corporate",
  },
  {
    id: "8",
    invoiceId: "INV008",
    customerName: "UrbanPulse Design",
    customerLogo: "U",
    customerLogoColor: "bg-pink-500",
    email: "estelle@example.com",
    createdDate: "22 Feb 2024",
    amount: 50,
    paymentMethod: "Credit Card",
    status: "Unpaid",
    address: "159 Design St, Los Angeles, CA 90001",
    billingCycle: "30 Days",
    expiringOn: "22 Mar 2024",
    plan: "Basic (Monthly)",
    softwareType: "Gym/Hospital",
  },
];

export function SuperAdminPurchaseTransaction() {
  const [activeTab, setActiveTab] = useState<SoftwareType>("Corporate");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("All Methods");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Last 7 Days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  // Memoized filtering for better performance
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPaymentMethod =
        selectedPaymentMethod === "All Methods" ||
        transaction.paymentMethod === selectedPaymentMethod;
      const matchesStatus =
        selectedStatus === "All Status" || transaction.status === selectedStatus;
      return matchesSearch && matchesPaymentMethod && matchesStatus;
    });
  }, [searchTerm, selectedPaymentMethod, selectedStatus, transactions]);

  // Optimized handlers with useCallback
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleViewInvoice = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewInvoiceOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setTransactionToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (transactionToDelete) {
      setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete));
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  }, [transactionToDelete]);

  // Export to PDF
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Purchase Transaction Report", 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated: ${formatNowDate()}`, 14, 32);

    const tableData = filteredTransactions.map((transaction) => [
      transaction.invoiceId,
      transaction.customerName,
      transaction.email,
      transaction.createdDate,
      `${transaction.amount} ?`,
      transaction.paymentMethod,
      transaction.status,
    ]);

    autoTable(doc, {
      head: [["Invoice ID", "Customer", "Email", "Created Date", "Amount", "Payment Method", "Status"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] },
    });

    doc.save(`purchase_transactions_${new Date().getTime()}.pdf`);
  }, [filteredTransactions]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const data = filteredTransactions.map((transaction) => ({
      "Invoice ID": transaction.invoiceId,
      "Customer": transaction.customerName,
      "Email": transaction.email,
      "Created Date": transaction.createdDate,
      "Amount": `${transaction.amount} ?`,
      "Payment Method": transaction.paymentMethod,
      "Status": transaction.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `purchase_transactions_${new Date().getTime()}.xlsx`);
  }, [filteredTransactions]);

  return (
    <div className="p-3 sm:p-4 lg:p-5 xl:p-6 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
          Purchase Transaction
        </h1>
        <p className="text-[11px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400">
          Manage your purchase transaction
        </p>
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

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Top Action Bar */}
        <div className="p-2.5 sm:p-3 lg:p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] sm:text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
            >
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">PDF</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[11px] sm:text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800"
            >
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Excel</span>
            </button>
            <button
              onClick={handleRefresh}
              className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 ${
                isRefreshing ? "animate-spin" : ""
              }`}
              aria-label="Refresh"
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600 dark:text-gray-400" />
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
                placeholder="Search by invoice, customer, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              <ModernSelect
                value={selectedPaymentMethod}
                onChange={setSelectedPaymentMethod}
                options={["All Methods", "Credit Card", "Debit Card", "Paypal"]}
                placeholder="Payment Method"
                className="w-36"
              />
              <ModernSelect
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={["All Status", "Paid", "Unpaid", "Pending"]}
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

        {/* Table - Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 lg:px-4 py-2.5 lg:py-3 text-left text-[10px] lg:text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Invoice ID
                </th>
                <th className="px-3 lg:px-4 py-2.5 lg:py-3 text-left text-[10px] lg:text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Customer
                </th>
                <th className="px-3 lg:px-4 py-2.5 lg:py-3 text-left text-[10px] lg:text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Email
                </th>
                <th className="px-3 lg:px-4 py-2.5 lg:py-3 text-left text-[10px] lg:text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Created Date
                </th>
                <th className="px-3 lg:px-4 py-2.5 lg:py-3 text-left text-[10px] lg:text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Amount
                </th>
                <th className="px-3 lg:px-4 py-2.5 lg:py-3 text-left text-[10px] lg:text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Payment Method
                </th>
                <th className="px-3 lg:px-4 py-2.5 lg:py-3 text-left text-[10px] lg:text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 lg:px-4 py-2.5 lg:py-3 text-right text-[10px] lg:text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-3 lg:px-4 py-2.5 lg:py-3">
                    <span className="text-[11px] lg:text-xs font-medium text-gray-900 dark:text-white">
                      {transaction.invoiceId}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 py-2.5 lg:py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full ${transaction.customerLogoColor} flex items-center justify-center text-white font-semibold text-[11px] flex-shrink-0`}
                      >
                        {transaction.customerLogo}
                      </div>
                      <span className="text-[11px] lg:text-xs font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                        {transaction.customerName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-2.5 lg:py-3">
                    <span className="text-[11px] lg:text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px] block">
                      {transaction.email}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 py-2.5 lg:py-3">
                    <span className="text-[11px] lg:text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {transaction.createdDate}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 py-2.5 lg:py-3">
                    <span className="text-[11px] lg:text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      ${transaction.amount}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 py-2.5 lg:py-3">
                    <span className="text-[11px] lg:text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {transaction.paymentMethod}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 py-2.5 lg:py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] lg:text-[11px] font-medium whitespace-nowrap ${
                        transaction.status === "Paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : transaction.status === "Pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      ? {transaction.status}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 py-2.5 lg:py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewInvoice(transaction)}
                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        title="View Invoice"
                        aria-label="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                        title="Download"
                        aria-label="Download Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(transaction.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete"
                        aria-label="Delete Transaction"
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

        {/* Card View - Mobile */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full ${transaction.customerLogoColor} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}
                  >
                    {transaction.customerLogo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {transaction.customerName}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {transaction.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap flex-shrink-0 ${
                    transaction.status === "Paid"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : transaction.status === "Pending"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  }`}
                >
                  ? {transaction.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Invoice:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {transaction.invoiceId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                    ${transaction.amount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Payment:</span>
                  <span className="ml-1 text-gray-900 dark:text-white">
                    {transaction.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Date:</span>
                  <span className="ml-1 text-gray-900 dark:text-white">
                    {transaction.createdDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handleViewInvoice(transaction)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-medium transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-medium transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
                <button
                  onClick={() => handleDeleteClick(transaction.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-medium transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No transactions found</p>
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {viewInvoiceOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Invoice</h3>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p className="flex items-center justify-end gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-semibold">{selectedTransaction.invoiceId}</span>
                    </p>
                    <p className="flex items-center justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Issue date: {selectedTransaction.createdDate}
                    </p>
                    <p className="flex items-center justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Due date: {selectedTransaction.expiringOn}
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
                      {selectedTransaction.customerName}
                    </p>
                    <p>{selectedTransaction.address}</p>
                    <p>{selectedTransaction.email}</p>
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
                        {selectedTransaction.plan}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {selectedTransaction.billingCycle}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {selectedTransaction.createdDate}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {selectedTransaction.expiringOn}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold text-gray-900 dark:text-white">
                        ${selectedTransaction.amount.toFixed(2)}
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
                      {selectedTransaction.paymentMethod} - 123***********789
                    </p>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${selectedTransaction.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between md:justify-end gap-8">
                      <span className="text-gray-600 dark:text-gray-400">Sub Total</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${selectedTransaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between md:justify-end gap-8">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="font-semibold text-gray-900 dark:text-white">$0.00</span>
                    </div>
                    <div className="flex justify-between md:justify-end gap-8 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="font-bold text-base text-gray-900 dark:text-white">
                        ${selectedTransaction.amount.toFixed(2)}
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
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">?</span>
                    <span>
                      All payments must be made according to the agreed schedule. Late payments may
                      incur additional fees.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">?</span>
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

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="relative bg-gradient-to-r from-red-500 to-red-600 px-6 py-6 flex-shrink-0">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTransactionToDelete(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Delete Transaction</h2>
                  <p className="text-red-100 text-sm mt-0.5">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  Warning: This will permanently delete the transaction
                </p>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 ml-4 list-disc">
                  <li>All transaction data will be removed</li>
                  <li>Invoice records will be lost</li>
                  <li>This action is irreversible</li>
                </ul>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this transaction? Please confirm your action.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTransactionToDelete(null);
                }}
                className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}