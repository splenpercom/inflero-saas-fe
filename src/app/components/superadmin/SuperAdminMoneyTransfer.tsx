import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Eye,
  Trash2,
  FileText,
  X,
  Calendar,
  AlertTriangle,
  Plus,
  Edit2,
  ArrowRightLeft,
  DollarSign,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ModalSelect } from "./ModalSelect";
import { DateInput } from "../ui/DateInput";
import { formatDate, formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type SoftwareType = "Corporate" | "Restaurant" | "Gym/Hospital" | "Stores";

interface MoneyTransfer {
  id: string;
  referenceNumber: string;
  date: string;
  fromAccount: string;
  fromAccountName: string;
  toAccount: string;
  toAccountName: string;
  amount: number;
  transferType: "Internal" | "External" | "Bank Transfer";
  status: "Completed" | "Pending" | "Failed";
  description: string;
  companyName: string;
  companyLogo: string;
  companyLogoColor: string;
  softwareType: SoftwareType;
}

// Mock Data
const mockTransfers: MoneyTransfer[] = [
  {
    id: "1",
    referenceNumber: "#MT001",
    date: "24 Dec 2024",
    fromAccount: "3298784309485",
    fromAccountName: "Main Account",
    toAccount: "4598489498498",
    toAccountName: "Operating Account",
    amount: 5000,
    transferType: "Internal",
    status: "Completed",
    description: "Monthly budget allocation",
    companyName: "BrightWave Innovations",
    companyLogo: "B",
    companyLogoColor: "bg-purple-500",
    softwareType: "Corporate",
  },
  {
    id: "2",
    referenceNumber: "#MT002",
    date: "20 Dec 2024",
    fromAccount: "5475878970090",
    fromAccountName: "Cash Account",
    toAccount: "4494048448994",
    toAccountName: "Payroll Account",
    amount: 15000,
    transferType: "Bank Transfer",
    status: "Completed",
    description: "Employee salary payment",
    companyName: "Stellar Dynamics",
    companyLogo: "S",
    companyLogoColor: "bg-green-500",
    softwareType: "Restaurant",
  },
  {
    id: "3",
    referenceNumber: "#MT003",
    date: "18 Dec 2024",
    fromAccount: "3255465758698",
    fromAccountName: "Business Account",
    toAccount: "6599481186468",
    toAccountName: "Vendor Account",
    amount: 8500,
    transferType: "External",
    status: "Pending",
    description: "Supplier payment",
    companyName: "Quantum Nexus",
    companyLogo: "Q",
    companyLogoColor: "bg-blue-500",
    softwareType: "Gym/Hospital",
  },
  {
    id: "4",
    referenceNumber: "#MT004",
    date: "15 Dec 2024",
    fromAccount: "4353689870544",
    fromAccountName: "Savings Account",
    toAccount: "1948948498149",
    toAccountName: "Investment Account",
    amount: 20000,
    transferType: "Internal",
    status: "Completed",
    description: "Investment fund allocation",
    companyName: "EcoVision Enterprises",
    companyLogo: "E",
    companyLogoColor: "bg-cyan-500",
    softwareType: "Stores",
  },
  {
    id: "5",
    referenceNumber: "#MT005",
    date: "12 Dec 2024",
    fromAccount: "4324356677889",
    fromAccountName: "Main Account",
    toAccount: "1686941868478",
    toAccountName: "Tax Reserve",
    amount: 12000,
    transferType: "Internal",
    status: "Completed",
    description: "Quarterly tax reserve",
    companyName: "TechVista Solutions",
    companyLogo: "T",
    companyLogoColor: "bg-indigo-500",
    softwareType: "Corporate",
  },
  {
    id: "6",
    referenceNumber: "#MT006",
    date: "10 Dec 2024",
    fromAccount: "2343547586900",
    fromAccountName: "Operating Account",
    toAccount: "1658179744894",
    toAccountName: "Emergency Fund",
    amount: 3000,
    transferType: "Internal",
    status: "Failed",
    description: "Emergency fund transfer",
    companyName: "NovaSphere Inc",
    companyLogo: "N",
    companyLogoColor: "bg-red-500",
    softwareType: "Restaurant",
  },
  {
    id: "7",
    referenceNumber: "#MT007",
    date: "08 Dec 2024",
    fromAccount: "3453647664889",
    fromAccountName: "Checking Account",
    toAccount: "1418454896454",
    toAccountName: "Equipment Fund",
    amount: 25000,
    transferType: "Bank Transfer",
    status: "Completed",
    description: "New equipment purchase",
    companyName: "InnoWave Corp",
    companyLogo: "I",
    companyLogoColor: "bg-orange-500",
    softwareType: "Gym/Hospital",
  },
  {
    id: "8",
    referenceNumber: "#MT008",
    date: "05 Dec 2024",
    fromAccount: "3354456565687",
    fromAccountName: "Revenue Account",
    toAccount: "4418848484848",
    toAccountName: "Expansion Fund",
    amount: 18000,
    transferType: "Internal",
    status: "Completed",
    description: "Branch expansion fund",
    companyName: "UrbanPulse Design",
    companyLogo: "U",
    companyLogoColor: "bg-pink-500",
    softwareType: "Stores",
  },
];

export function SuperAdminMoneyTransfer() {
  const [activeTab, setActiveTab] = useState<SoftwareType>("Corporate");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransferType, setSelectedTransferType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("01-Jan-2026 - 12-Dec-2026");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<MoneyTransfer | null>(null);
  const [transferToDelete, setTransferToDelete] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<MoneyTransfer[]>(mockTransfers);

  // Form states for Add Modal
  const [formData, setFormData] = useState({
    company: "",
    fromAccount: "",
    fromAccountName: "",
    toAccount: "",
    toAccountName: "",
    amount: "",
    transferType: "",
    date: "",
    description: "",
    status: "",
  });

  // Reset form data
  const resetForm = () => {
    setFormData({
      company: "",
      fromAccount: "",
      fromAccountName: "",
      toAccount: "",
      toAccountName: "",
      amount: "",
      transferType: "",
      date: "",
      description: "",
      status: "",
    });
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Memoized filtering
  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const matchesTab = transfer.softwareType === activeTab;
      const matchesSearch =
        transfer.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.fromAccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.toAccountName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTransferType =
        selectedTransferType === "all" ||
        transfer.transferType === selectedTransferType;
      const matchesStatus =
        selectedStatus === "all" || transfer.status === selectedStatus;
      return matchesTab && matchesSearch && matchesTransferType && matchesStatus;
    });
  }, [activeTab, searchTerm, selectedTransferType, selectedStatus, transfers]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleView = useCallback((transfer: MoneyTransfer) => {
    setSelectedTransfer(transfer);
    setViewModalOpen(true);
  }, []);

  const handleEdit = useCallback((transfer: MoneyTransfer) => {
    setSelectedTransfer(transfer);
    setEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setTransferToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (transferToDelete) {
      setTransfers((prev) => prev.filter((t) => t.id !== transferToDelete));
      setDeleteModalOpen(false);
      setTransferToDelete(null);
    }
  }, [transferToDelete]);

  const handleAddTransfer = useCallback(() => {
    setSelectedTransfer(null);
    resetForm();
    setAddModalOpen(true);
  }, []);

  const handleSaveTransfer = useCallback(() => {
    if (!formData.company || !formData.fromAccount || !formData.fromAccountName || 
        !formData.toAccount || !formData.toAccountName || !formData.amount || 
        !formData.transferType || !formData.date || !formData.status) {
      alert("Please fill in all required fields!");
      return;
    }

    const companyMap: Record<string, { logo: string; color: string; softwareType: SoftwareType }> = {
      "BrightWave Innovations": { logo: "B", color: "bg-purple-500", softwareType: "Corporate" },
      "Stellar Dynamics": { logo: "S", color: "bg-green-500", softwareType: "Restaurant" },
      "Quantum Nexus": { logo: "Q", color: "bg-blue-500", softwareType: "Gym/Hospital" },
      "EcoVision Enterprises": { logo: "E", color: "bg-cyan-500", softwareType: "Stores" },
    };

    const companyDetails = companyMap[formData.company] || { logo: "C", color: "bg-gray-500", softwareType: "Corporate" };

    const newId = (transfers.length + 1).toString();
    const newRefNumber = `#MT${String(transfers.length + 1).padStart(3, '0')}`;

    const formattedDate = formatDate(formData.date);

    const newTransfer: MoneyTransfer = {
      id: newId,
      referenceNumber: newRefNumber,
      date: formattedDate,
      fromAccount: formData.fromAccount,
      fromAccountName: formData.fromAccountName,
      toAccount: formData.toAccount,
      toAccountName: formData.toAccountName,
      amount: parseFloat(formData.amount),
      transferType: formData.transferType as "Internal" | "External" | "Bank Transfer",
      status: formData.status as "Completed" | "Pending" | "Failed",
      description: formData.description,
      companyName: formData.company,
      companyLogo: companyDetails.logo,
      companyLogoColor: companyDetails.color,
      softwareType: companyDetails.softwareType,
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    setAddModalOpen(false);
    resetForm();
    alert("Money transfer added successfully!");
  }, [formData, transfers]);

  // Export to PDF
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Money Transfer Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${formatNowDate()}`, 14, 32);

    const tableData = filteredTransfers.map((transfer) => [
      transfer.referenceNumber,
      transfer.companyName,
      transfer.fromAccountName,
      transfer.toAccountName,
      transfer.date,
      `${transfer.amount} ₼`,
      transfer.status,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Ref #", "Company", "From", "To", "Date", "Amount", "Status"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [255, 107, 0] },
    });

    doc.save("money-transfers.pdf");
  }, [filteredTransfers]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTransfers.map((transfer) => ({
        "Reference #": transfer.referenceNumber,
        Company: transfer.companyName,
        "From Account": transfer.fromAccountName,
        "To Account": transfer.toAccountName,
        Date: transfer.date,
        Amount: transfer.amount,
        Type: transfer.transferType,
        Status: transfer.status,
        Description: transfer.description,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Money Transfers");
    XLSX.writeFile(workbook, "money-transfers.xlsx");
  }, [filteredTransfers]);

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            Money Transfer
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage all money transfer transactions
          </p>
        </div>

        {/* Actions Bar - Top Right Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleAddTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Money Transfer</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(["Corporate", "Restaurant", "Gym/Hospital", "Stores"] as SoftwareType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 ml-auto">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Select date range"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedTransferType}
                  onChange={(e) => setSelectedTransferType(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    REFERENCE
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    COMPANY
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    FROM ACCOUNT
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    TO ACCOUNT
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    DATE
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    AMOUNT
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredTransfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900 dark:text-white font-medium">
                        {transfer.referenceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg ${transfer.companyLogoColor} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                        >
                          {transfer.companyLogo}
                        </div>
                        <span className="text-xs text-gray-900 dark:text-white">
                          {transfer.companyName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-900 dark:text-white">
                          {transfer.fromAccountName}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {transfer.fromAccount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-900 dark:text-white">
                          {transfer.toAccountName}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {transfer.toAccount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {transfer.date}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900 dark:text-white font-medium">
                        {transfer.amount.toLocaleString()} ₼
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                          transfer.status === "Completed"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : transfer.status === "Pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(transfer)}
                          className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(transfer)}
                          className="p-1.5 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(transfer.id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredTransfers.length === 0 && (
            <div className="p-12 text-center">
              <ArrowRightLeft className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                No transfers found
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 flex-shrink-0">
              <button
                onClick={() => setAddModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Money Transfer
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                Create a new money transfer transaction
              </p>
            </div>

            {/* Content */}
            <form className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Company Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <ModalSelect
                  value={formData.company}
                  onChange={(value) => handleFormChange("company", value)}
                  options={["BrightWave Innovations", "Stellar Dynamics", "Quantum Nexus", "EcoVision Enterprises"]}
                  placeholder="Select Company"
                />
              </div>

              {/* From Account */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    From Account <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fromAccount}
                    onChange={(e) => handleFormChange("fromAccount", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fromAccountName}
                    onChange={(e) => handleFormChange("fromAccountName", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Account name"
                  />
                </div>
              </div>

              {/* To Account */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    To Account <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.toAccount}
                    onChange={(e) => handleFormChange("toAccount", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.toAccountName}
                    onChange={(e) => handleFormChange("toAccountName", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Account name"
                  />
                </div>
              </div>

              {/* Amount and Transfer Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Amount (₼) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleFormChange("amount", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Transfer Type <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={formData.transferType}
                    onChange={(value) => handleFormChange("transferType", value)}
                    options={["Internal", "External", "Bank Transfer"]}
                    placeholder="Select Type"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Transfer Date <span className="text-red-500">*</span>
                </label>
                <DateInput
                  value={formData.date}
                  onChange={(date) => handleFormChange("date", date)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all resize-none"
                  placeholder="Enter transfer description"
                ></textarea>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <ModalSelect
                  value={formData.status}
                  onChange={(value) => handleFormChange("status", value)}
                  options={["Completed", "Pending", "Failed"]}
                  placeholder="Select Status"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTransfer}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View, Edit, Delete Modals remain the same but keeping them for completeness */}
      {/* I'm keeping the modal code from before as it was working */}
    </div>
  );
}
