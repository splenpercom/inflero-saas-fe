import { useState, useMemo } from "react";
import { useConfirm } from "../../context/ConfirmContext";
import {
  Building2,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Plus,
  X,
  FileText,
  AlertTriangle,
  Lock,
  Image as ImageIcon,
  Eye,
  EyeOff,
  DollarSign,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Languages,
  CheckCircle,
  Upload as UploadIcon,
} from "lucide-react";
import { ModernSelect } from "./ModernSelect";
import { ModalSelect } from "./ModalSelect";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type SoftwareType = "Corporate" | "Restaurant" | "Gym/Hospital" | "Stores";

interface Company {
  id: string;
  name: string;
  email: string;
  accountUrl: string;
  plan: string;
  planType: string;
  createdDate: string;
  status: "Active" | "Inactive";
  logo: string;
  logoColor: string;
  phone: string;
  website: string;
  currency: string;
  language: string;
  address: string;
  price: number;
  registerDate: string;
  expiringOn: string;
  softwareType: SoftwareType;
}

// Mock Data
const mockCompanies: Company[] = [
  {
    id: "1",
    name: "BrightWave Innovations",
    email: "michael@example.com",
    accountUrl: "bwi.example.com",
    plan: "Advanced",
    planType: "Monthly",
    createdDate: "12 Sep 2024",
    status: "Active",
    logo: "B",
    logoColor: "bg-purple-500",
    phone: "+1 (555) 123-4567",
    website: "www.brightwave.com",
    currency: "USD",
    language: "English",
    address: "3705 Lynn Avenue, Phelps, WI 54554",
    price: 200,
    registerDate: "12 Sep 2024",
    expiringOn: "11 Oct 2024",
    softwareType: "Corporate",
  },
  {
    id: "2",
    name: "Stellar Dynamics",
    email: "sophie@example.com",
    accountUrl: "stellar.example.com",
    plan: "Basic",
    planType: "Yearly",
    createdDate: "24 Oct 2024",
    status: "Active",
    logo: "S",
    logoColor: "bg-green-500",
    phone: "+1 (555) 234-5678",
    website: "www.stellardynamics.com",
    currency: "EUR",
    language: "English",
    address: "123 Main St, New York, NY 10001",
    price: 600,
    registerDate: "24 Oct 2024",
    expiringOn: "23 Oct 2025",
    softwareType: "Restaurant",
  },
  {
    id: "3",
    name: "Quantum Nexus",
    email: "cameron@example.com",
    accountUrl: "quantum.example.com",
    plan: "Advanced",
    planType: "Monthly",
    createdDate: "18 Feb 2024",
    status: "Active",
    logo: "Q",
    logoColor: "bg-blue-500",
    phone: "+1 (555) 345-6789",
    website: "www.quantumnexus.com",
    currency: "USD",
    language: "English",
    address: "456 Tech Ave, San Francisco, CA 94105",
    price: 200,
    registerDate: "18 Feb 2024",
    expiringOn: "17 Mar 2024",
    softwareType: "Gym/Hospital",
  },
  {
    id: "4",
    name: "EcoVision Enterprises",
    email: "doris@example.com",
    accountUrl: "ecovision.example.com",
    plan: "Advanced",
    planType: "Monthly",
    createdDate: "17 Oct 2024",
    status: "Active",
    logo: "E",
    logoColor: "bg-cyan-500",
    phone: "+1 (555) 456-7890",
    website: "www.ecovision.com",
    currency: "USD",
    language: "English",
    address: "789 Green Blvd, Portland, OR 97201",
    price: 200,
    registerDate: "17 Oct 2024",
    expiringOn: "16 Nov 2024",
    softwareType: "Stores",
  },
  {
    id: "5",
    name: "Aurora Technologies",
    email: "thomas@example.com",
    accountUrl: "aurora.example.com",
    plan: "Enterprise",
    planType: "Monthly",
    createdDate: "20 Jul 2024",
    status: "Active",
    logo: "A",
    logoColor: "bg-purple-600",
    phone: "+1 (555) 567-8901",
    website: "www.auroratech.com",
    currency: "CAD",
    language: "English",
    address: "321 Innovation Dr, Austin, TX 78701",
    price: 400,
    registerDate: "20 Jul 2024",
    expiringOn: "19 Aug 2024",
    softwareType: "Corporate",
  },
  {
    id: "6",
    name: "BlueSky Ventures",
    email: "kathleen@example.com",
    accountUrl: "bluesky.example.com",
    plan: "Advanced",
    planType: "Monthly",
    createdDate: "10 Apr 2024",
    status: "Active",
    logo: "B",
    logoColor: "bg-blue-600",
    phone: "+1 (555) 678-9012",
    website: "www.blueskyventures.com",
    currency: "GBP",
    language: "English",
    address: "654 Sky Lane, Seattle, WA 98101",
    price: 200,
    registerDate: "10 Apr 2024",
    expiringOn: "09 May 2024",
    softwareType: "Restaurant",
  },
  {
    id: "7",
    name: "Pinnacle Solutions",
    email: "robert@example.com",
    accountUrl: "pinnacle.example.com",
    plan: "Basic",
    planType: "Monthly",
    createdDate: "05 Nov 2024",
    status: "Inactive",
    logo: "P",
    logoColor: "bg-red-500",
    phone: "+1 (555) 789-0123",
    website: "www.pinnaclesolutions.com",
    currency: "USD",
    language: "Spanish",
    address: "987 Business Park, Miami, FL 33101",
    price: 100,
    registerDate: "05 Nov 2024",
    expiringOn: "04 Dec 2024",
    softwareType: "Gym/Hospital",
  },
];

export function SuperAdminCompanies() {
  const askConfirm = useConfirm();
  const [activeTab, setActiveTab] = useState<SoftwareType>("Corporate");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("All Plans");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Last 7 Days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
    setViewModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: "Are you sure you want to delete this company?",
      variant: "danger",
    })) {
      // Delete company logic here
    }
  };

  // Stats calculations
  const totalCompanies = mockCompanies.length;
  const activeCompanies = mockCompanies.filter((c) => c.status === "Active").length;
  const inactiveCompanies = mockCompanies.filter((c) => c.status === "Inactive").length;
  const totalRevenue = mockCompanies.reduce((sum, c) => sum + c.price, 0);

  const stats = [
    {
      id: 1,
      title: "Total Companies",
      value: totalCompanies.toString(),
      icon: Building2,
      color: "orange",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      id: 2,
      title: "Active Companies",
      value: activeCompanies.toString(),
      icon: Building2,
      color: "green",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      id: 3,
      title: "Inactive Companies",
      value: inactiveCompanies.toString(),
      icon: Building2,
      color: "red",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      id: 4,
      title: "Total Revenue",
      value: `${totalRevenue} ₼`,
      icon: DollarSign,
      color: "blue",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
  ];

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return mockCompanies.filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = selectedPlan === "All Plans" || company.plan === selectedPlan;
      const matchesStatus = selectedStatus === "All Status" || company.status === selectedStatus;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [searchTerm, selectedPlan, selectedStatus]);

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
            Companies
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Manage your companies
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-orange-600/30"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Top Action Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            All Companies ({filteredCompanies.length})
          </h2>
          <div className="flex items-center gap-2">
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

        {/* Modern Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all"
              />
            </div>

            {/* Modern Dropdowns */}
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
                options={["All Status", "Active", "Inactive"]}
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
                  Company
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Created Date
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
              {filteredCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${company.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}
                      >
                        {company.logo}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {company.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {company.accountUrl}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {company.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {company.plan}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {company.planType}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {company.createdDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        company.status === "Active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleView(company)}
                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
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
        {filteredCompanies.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              No companies found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Modern View Modal */}
      {viewModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 flex-shrink-0">
              <button
                onClick={() => setViewModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div
                  className={`w-20 h-20 rounded-2xl ${selectedCompany.logoColor} flex items-center justify-center text-white font-bold text-3xl shadow-xl`}
                >
                  {selectedCompany.logo}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {selectedCompany.name}
                  </h2>
                  <p className="text-orange-100 text-sm">{selectedCompany.accountUrl}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCompany.status === "Active"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {selectedCompany.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                        Email Address
                      </p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {selectedCompany.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                        Phone Number
                      </p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {selectedCompany.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                        Website
                      </p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {selectedCompany.website}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                        Address
                      </p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {selectedCompany.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  Subscription Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border border-orange-200 dark:border-orange-800">
                    <p className="text-[11px] text-orange-700 dark:text-orange-400 mb-1">
                      Plan
                    </p>
                    <p className="text-lg font-bold text-orange-900 dark:text-orange-300">
                      {selectedCompany.plan}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {selectedCompany.planType}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800">
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 mb-1">
                      Register Date
                    </p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                      {selectedCompany.registerDate}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800">
                    <p className="text-[11px] text-green-700 dark:text-green-400 mb-1">
                      Expiring On
                    </p>
                    <p className="text-sm font-bold text-green-900 dark:text-green-300">
                      {selectedCompany.expiringOn}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                        Currency
                      </p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {selectedCompany.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Languages className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                        Language
                      </p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {selectedCompany.language}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleEdit(selectedCompany);
                }}
                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Edit Modal */}
      {editModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 flex-shrink-0">
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Edit Company
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                Update company information
              </p>
            </div>

            {/* Content */}
            <form className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Profile Image */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div
                  className={`w-20 h-20 rounded-2xl ${selectedCompany.logoColor} flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-xl`}
                >
                  {selectedCompany.logo}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Company Logo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Upload a logo (JPG, PNG - Max 4MB)
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1.5"
                    >
                      <UploadIcon className="w-3.5 h-3.5" />
                      Upload
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedCompany.name}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter company name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    defaultValue={selectedCompany.email}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="company@example.com"
                  />
                </div>

                {/* Account URL */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Account URL
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedCompany.accountUrl}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="company.example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    defaultValue={selectedCompany.phone}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedCompany.website}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="www.company.com"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedCompany.address}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter full address"
                  />
                </div>

                {/* Plan */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={selectedCompany.plan}
                    onChange={() => {}}
                    options={["Basic", "Advanced", "Enterprise"]}
                    placeholder="Select Plan"
                  />
                </div>

                {/* Plan Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan Type <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={selectedCompany.planType}
                    onChange={() => {}}
                    options={["Monthly", "Yearly"]}
                    placeholder="Select Plan Type"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={selectedCompany.currency}
                    onChange={() => {}}
                    options={["USD", "EUR", "GBP", "CAD"]}
                    placeholder="Select Currency"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={selectedCompany.language}
                    onChange={() => {}}
                    options={["English", "Spanish", "French", "German"]}
                    placeholder="Select Language"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <ModalSelect
                    value={selectedCompany.status}
                    onChange={() => {}}
                    options={["Active", "Inactive"]}
                    placeholder="Select Status"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Add Modal */}
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
                Add New Company
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                Create a new company account
              </p>
            </div>

            {/* Content */}
            <form className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Profile Image */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-xl">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Company Logo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Upload a logo (JPG, PNG - Max 4MB)
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1.5"
                    >
                      <UploadIcon className="w-3.5 h-3.5" />
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter company name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="company@example.com"
                  />
                </div>

                {/* Account URL */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Account URL
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="company.example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="www.company.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all pr-10"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all pr-10"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter full address"
                  />
                </div>

                {/* Plan */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value=""
                    onChange={() => {}}
                    options={["Basic", "Advanced", "Enterprise"]}
                    placeholder="Select Plan"
                  />
                </div>

                {/* Plan Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan Type <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value=""
                    onChange={() => {}}
                    options={["Monthly", "Yearly"]}
                    placeholder="Select Plan Type"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value=""
                    onChange={() => {}}
                    options={["USD", "EUR", "GBP", "CAD"]}
                    placeholder="Select Currency"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value=""
                    onChange={() => {}}
                    options={["English", "Spanish", "French", "German"]}
                    placeholder="Select Language"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <ModalSelect
                    value="Active"
                    onChange={() => {}}
                    options={["Active", "Inactive"]}
                    placeholder="Select Status"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}