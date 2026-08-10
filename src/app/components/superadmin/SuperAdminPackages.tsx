import { useState } from "react";
import {
  Package,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Plus,
  X,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import { ModernSelect } from "./ModernSelect";
import { ModalSelect } from "./ModalSelect";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type SoftwareType = "Corporate" | "Restaurant" | "Gym/Hospital" | "Stores";

interface PackagePlan {
  id: string;
  name: string;
  type: string;
  subscribers: number;
  price: number;
  createdDate: string;
  status: "Active" | "Inactive";
  position: string;
  currency: string;
  discountType: string;
  discount: number;
  limitationsInvoices: string;
  maxCustomers: string;
  product: string;
  supplier: string;
  modules: string[];
  accessTrial: boolean;
  trialDays: number;
  isRecommended: boolean;
  description: string;
  softwareType: SoftwareType;
}

const mockPackages: PackagePlan[] = [
  {
    id: "1",
    name: "Basic",
    type: "Monthly",
    subscribers: 56,
    price: 50,
    createdDate: "14 Jan 2024",
    status: "Active",
    position: "1",
    currency: "AZN",
    discountType: "Percentage",
    discount: 0,
    limitationsInvoices: "100",
    maxCustomers: "50",
    product: "Standard",
    supplier: "Inflero",
    modules: ["Employees", "Clients", "Invoices", "Payments"],
    accessTrial: true,
    trialDays: 14,
    isRecommended: false,
    description: "Perfect for small businesses getting started",
    softwareType: "Corporate",
  },
  {
    id: "2",
    name: "Advanced",
    type: "Monthly",
    subscribers: 99,
    price: 200,
    createdDate: "21 Jan 2024",
    status: "Active",
    position: "2",
    currency: "AZN",
    discountType: "Fixed",
    discount: 10,
    limitationsInvoices: "500",
    maxCustomers: "200",
    product: "Professional",
    supplier: "Inflero",
    modules: ["Employees", "Clients", "Projects", "Invoices", "Estimates", "Payments", "Reports", "Goals"],
    accessTrial: true,
    trialDays: 30,
    isRecommended: true,
    description: "Most popular plan for growing businesses",
    softwareType: "Corporate",
  },
  {
    id: "3",
    name: "Premium",
    type: "Monthly",
    subscribers: 58,
    price: 300,
    createdDate: "10 Feb 2024",
    status: "Active",
    position: "3",
    currency: "AZN",
    discountType: "Percentage",
    discount: 5,
    limitationsInvoices: "1000",
    maxCustomers: "500",
    product: "Premium",
    supplier: "Inflero",
    modules: ["Employees", "Clients", "Projects", "Tickets", "Invoices", "Estimates", "Payments", "Taxes", "Reports", "Goals", "Assets"],
    accessTrial: true,
    trialDays: 30,
    isRecommended: false,
    description: "Advanced features for established businesses",
    softwareType: "Corporate",
  },
  {
    id: "4",
    name: "Enterprise",
    type: "Monthly",
    subscribers: 67,
    price: 400,
    createdDate: "18 Feb 2024",
    status: "Active",
    position: "4",
    currency: "AZN",
    discountType: "Fixed",
    discount: 50,
    limitationsInvoices: "Unlimited",
    maxCustomers: "Unlimited",
    product: "Enterprise",
    supplier: "Inflero",
    modules: ["Employees", "Clients", "Projects", "Tickets", "Invoices", "Estimates", "Payments", "Taxes", "Reports", "Goals", "Assets", "Activities", "Contacts", "Deals", "Leads", "Pipelines"],
    accessTrial: true,
    trialDays: 45,
    isRecommended: false,
    description: "Complete solution with all features unlocked",
    softwareType: "Corporate",
  },
  {
    id: "5",
    name: "Basic",
    type: "Yearly",
    subscribers: 78,
    price: 600,
    createdDate: "15 Mar 2024",
    status: "Active",
    position: "5",
    currency: "AZN",
    discountType: "Percentage",
    discount: 20,
    limitationsInvoices: "1200",
    maxCustomers: "600",
    product: "Standard",
    supplier: "Inflero",
    modules: ["Employees", "Clients", "Invoices", "Payments"],
    accessTrial: true,
    trialDays: 14,
    isRecommended: false,
    description: "Annual subscription with cost savings",
    softwareType: "Corporate",
  },
];

const allModules = [
  "Employees", "Invoices", "Reports", "Contacts",
  "Clients", "Estimates", "Goals", "Deals",
  "Projects", "Payments", "Assets", "Leads",
  "Tickets", "Taxes", "Activities", "Pipelines",
];

export function SuperAdminPackages() {
  const [activeTab, setActiveTab] = useState<SoftwareType>("Corporate");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Last 7 Days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackagePlan | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackagePlan[]>(mockPackages);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    position: "",
    currency: "",
    discountType: "",
    discount: "",
    limitationsInvoices: "",
    maxCustomers: "",
    product: "",
    supplier: "",
    modules: [] as string[],
    accessTrial: false,
    trialDays: "",
    isRecommended: false,
    status: "Active",
    description: "",
    setFree: false,
    softwareType: "Corporate" as SoftwareType,
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleEdit = (pkg: PackagePlan) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      type: pkg.type,
      position: pkg.position,
      currency: pkg.currency,
      discountType: pkg.discountType,
      discount: pkg.discount.toString(),
      limitationsInvoices: pkg.limitationsInvoices,
      maxCustomers: pkg.maxCustomers,
      product: pkg.product,
      supplier: pkg.supplier,
      modules: pkg.modules,
      accessTrial: pkg.accessTrial,
      trialDays: pkg.trialDays.toString(),
      isRecommended: pkg.isRecommended,
      status: pkg.status,
      description: pkg.description,
      setFree: pkg.price === 0,
      softwareType: pkg.softwareType,
    });
    setEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setPackageToDelete(id);
    setDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      position: "",
      currency: "",
      discountType: "",
      discount: "",
      limitationsInvoices: "",
      maxCustomers: "",
      product: "",
      supplier: "",
      modules: [],
      accessTrial: false,
      trialDays: "",
      isRecommended: false,
      status: "Active",
      description: "",
      setFree: false,
      softwareType: "Corporate" as SoftwareType,
    });
  };

  const handleModuleToggle = (module: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter((m) => m !== module)
        : [...prev.modules, module],
    }));
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.length === allModules.length ? [] : [...allModules],
    }));
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Packages Report", 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated: ${formatNowDate()}`, 14, 32);

    // Prepare table data
    const tableData = filteredPackages.map((pkg) => [
      pkg.name,
      pkg.type,
      pkg.subscribers.toString(),
      `${pkg.price} ?`,
      pkg.createdDate,
      pkg.status,
    ]);

    // Generate table
    autoTable(doc, {
      head: [["Plan Name", "Plan Type", "Subscribers", "Price", "Created Date", "Status"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] }, // Orange color
    });

    // Save the PDF
    doc.save(`packages_report_${new Date().getTime()}.pdf`);
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredPackages.map((pkg) => ({
      "Plan Name": pkg.name,
      "Plan Type": pkg.type,
      "Subscribers": pkg.subscribers,
      "Price": `${pkg.price} ?`,
      "Created Date": pkg.createdDate,
      "Status": pkg.status,
      "Currency": pkg.currency,
      "Discount Type": pkg.discountType,
      "Discount": pkg.discount,
      "Max Customers": pkg.maxCustomers,
      "Trial Days": pkg.trialDays,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Packages");
    XLSX.writeFile(wb, `packages_report_${new Date().getTime()}.xlsx`);
  };

  // Stats
  const totalPlans = packages.length;
  const activePlans = packages.filter((p) => p.status === "Active").length;
  const inactivePlans = packages.filter((p) => p.status === "Inactive").length;
  const planTypes = new Set(packages.map((p) => p.type)).size;

  const stats = [
    {
      id: 1,
      title: "Total Plans",
      value: totalPlans.toString().padStart(2, "0"),
      icon: Package,
      color: "orange",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      id: 2,
      title: "Active Plans",
      value: activePlans.toString().padStart(2, "0"),
      icon: Package,
      color: "green",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      id: 3,
      title: "Inactive Plans",
      value: inactivePlans.toString().padStart(2, "0"),
      icon: Package,
      color: "red",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      id: 4,
      title: "No of Plan Types",
      value: planTypes.toString().padStart(2, "0"),
      icon: Package,
      color: "cyan",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All Status" || pkg.status === selectedStatus;
    const matchesSoftwareType = pkg.softwareType === activeTab;
    return matchesSearch && matchesStatus && matchesSoftwareType;
  });

  const tabs: { name: SoftwareType; locked: boolean }[] = [
    { name: "Corporate", locked: false },
    { name: "Restaurant", locked: true },
    { name: "Gym/Hospital", locked: true },
    { name: "Stores", locked: true },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
            Packages
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Manage your packages
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setFormData({ ...formData, softwareType: activeTab });
            setAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-orange-600/30"
        >
          <Plus className="w-4 h-4" />
          Add Packages
        </button>
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

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Top Action Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            All Packages ({filteredPackages.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800"
            >
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
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
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
                  Plan Name
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Plan Type
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Total Subscribers
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Price
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
              {filteredPackages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {pkg.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {pkg.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {pkg.subscribers}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {pkg.price} ?
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {pkg.createdDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        pkg.status === "Active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
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
        {filteredPackages.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              No packages found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 flex-shrink-0">
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                  resetForm();
                }}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editModalOpen ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editModalOpen ? "Edit Plan" : "Add Plan"}
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                {editModalOpen ? "Update plan information" : "Create a new subscription plan"}
              </p>
            </div>

            {/* Content */}
            <form className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Upload Image */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-xl">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Upload Profile Image
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Image should be below 4 mb
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter plan name"
                  />
                </div>

                {/* Plan Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan Type <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value })}
                    options={["Monthly", "Yearly"]}
                    placeholder="Select plan type"
                  />
                </div>

                {/* Plan Position */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan Position <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={formData.position}
                    onChange={(value) => setFormData({ ...formData, position: value })}
                    options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
                    placeholder="Select position"
                  />
                </div>

                {/* Plan Currency */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan Currency <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={formData.currency}
                    onChange={(value) => setFormData({ ...formData, currency: value })}
                    options={["AZN", "USD", "EUR", "GBP"]}
                    placeholder="Select currency"
                  />
                </div>

                {/* Plan Price with Set Free Toggle */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Plan Currency <span className="text-red-500">*</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.setFree}
                        onChange={(e) => setFormData({ ...formData, setFree: e.target.checked })}
                        className="appearance-none w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-500 bg-white checked:bg-orange-600 checked:border-orange-600 cursor-pointer transition-all relative checked:after:content-['?'] checked:after:absolute checked:after:text-white checked:after:text-[10px] checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:font-bold"
                      />
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                        Set 0 for free
                      </span>
                    </label>
                  </div>
                  <ModalSelect
                    value={formData.currency}
                    onChange={(value) => setFormData({ ...formData, currency: value })}
                    options={["AZN", "USD", "EUR", "GBP"]}
                    placeholder="Select currency"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={formData.discountType}
                    onChange={(value) => setFormData({ ...formData, discountType: value })}
                    options={["Percentage", "Fixed"]}
                    placeholder="Select discount type"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Discount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter discount"
                  />
                </div>

                {/* Limitations Invoices */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Limitations Invoices
                  </label>
                  <input
                    type="text"
                    value={formData.limitationsInvoices}
                    onChange={(e) => setFormData({ ...formData, limitationsInvoices: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter limit"
                  />
                </div>

                {/* Max Customers */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Max Customers
                  </label>
                  <input
                    type="text"
                    value={formData.maxCustomers}
                    onChange={(e) => setFormData({ ...formData, maxCustomers: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter max customers"
                  />
                </div>

                {/* Product */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Product
                  </label>
                  <input
                    type="text"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter product"
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter supplier"
                  />
                </div>

                {/* Software Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Software Type <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={formData.softwareType}
                    onChange={(value) => setFormData({ ...formData, softwareType: value })}
                    options={["Corporate", "Restaurant", "Gym/Hospital", "Stores"]}
                    placeholder="Select software type"
                  />
                </div>
              </div>

              {/* Plan Modules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Plan Modules
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    {formData.modules.length === allModules.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allModules.map((module) => (
                    <label
                      key={module}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.modules.includes(module)}
                        onChange={() => handleModuleToggle(module)}
                        className="appearance-none w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-500 bg-white checked:bg-orange-600 checked:border-orange-600 cursor-pointer transition-all relative checked:after:content-['?'] checked:after:absolute checked:after:text-white checked:after:text-[10px] checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:font-bold"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {module}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Access Trial & Trial Days */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accessTrial}
                      onChange={(e) => setFormData({ ...formData, accessTrial: e.target.checked })}
                      className="appearance-none w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-500 bg-white checked:bg-orange-600 checked:border-orange-600 cursor-pointer transition-all relative checked:after:content-['?'] checked:after:absolute checked:after:text-white checked:after:text-[10px] checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:font-bold"
                    />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Access Trial
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Trial Days
                  </label>
                  <input
                    type="number"
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all"
                    placeholder="Enter trial days"
                  />
                </div>
              </div>

              {/* Is Recommended & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecommended}
                      onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                      className="appearance-none w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-500 bg-white checked:bg-orange-600 checked:border-orange-600 cursor-pointer transition-all relative checked:after:content-['?'] checked:after:absolute checked:after:text-white checked:after:text-[10px] checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:font-bold"
                    />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Is Recommended
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <ModalSelect
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value })}
                    options={["Active", "Inactive"]}
                    placeholder="Select status"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 dark:focus:border-orange-600 transition-all resize-none"
                  placeholder="Enter plan description"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                  resetForm();
                }}
                className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                  resetForm();
                }}
                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1.5"
              >
                {editModalOpen ? (
                  <>
                    <Edit2 className="w-3.5 h-3.5" />
                    Update Package
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add Package
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-red-500 to-red-600 px-6 py-6 flex-shrink-0">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPackageToDelete(null);
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
                  <h2 className="text-xl font-bold text-white">
                    Delete Plan
                  </h2>
                  <p className="text-red-100 text-sm mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  Warning: This will permanently delete the package
                </p>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 ml-4 list-disc">
                  <li>All package data will be removed</li>
                  <li>Subscribers will lose access</li>
                  <li>This action is irreversible</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this package? Please confirm your action.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPackageToDelete(null);
                }}
                className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 flex items-center gap-2"
                onClick={() => {
                  if (packageToDelete) {
                    setPackages(packages.filter((pkg) => pkg.id !== packageToDelete));
                    setDeleteModalOpen(false);
                    setPackageToDelete(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}