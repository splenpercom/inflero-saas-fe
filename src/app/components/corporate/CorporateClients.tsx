import { useState } from "react";
import { Search, Edit2, Trash2, Plus, Building2, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
interface Client {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: string;
  status: "Active" | "Inactive";
}

export function CorporateClients() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });

  // Mock data
  const clients: Client[] = [
    {
      id: 1,
      companyName: "Tech Solutions LLC",
      contactPerson: "John Smith",
      email: "john@techsolutions.com",
      phone: "+994 50 123 4567",
      address: "Baku, Azerbaijan",
      totalOrders: 24,
      totalSpent: "₼12,450",
      status: "Active",
    },
    {
      id: 2,
      companyName: "Global Enterprises",
      contactPerson: "Sarah Johnson",
      email: "sarah@global.com",
      phone: "+994 51 234 5678",
      address: "Baku, Azerbaijan",
      totalOrders: 18,
      totalSpent: "₼9,820",
      status: "Active",
    },
    {
      id: 3,
      companyName: "Innovation Corp",
      contactPerson: "Mike Davis",
      email: "mike@innovation.com",
      phone: "+994 55 345 6789",
      address: "Baku, Azerbaijan",
      totalOrders: 31,
      totalSpent: "₼18,650",
      status: "Active",
    },
    {
      id: 4,
      companyName: "Digital Partners",
      contactPerson: "Emily Chen",
      email: "emily@digitalpartners.com",
      phone: "+994 70 456 7890",
      address: "Baku, Azerbaijan",
      totalOrders: 12,
      totalSpent: "₼5,200",
      status: "Inactive",
    },
  ];

  const filteredClients = clients.filter((client) =>
    client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = () => {
    setShowAddModal(false);
    setFormData({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    });
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          Clients
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
            placeholder="Search clients..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2.5 py-1.5 text-xs bg-[#001db8] hover:bg-[#001fc4] text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Client
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Orders
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Spent
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
              {filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    No clients found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#0026f6] dark:text-[#0026f6]" />
                        {client.companyName}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {client.contactPerson}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {client.email}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {client.phone}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {client.totalOrders}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-[#0026f6] dark:text-[#0026f6]">
                      {client.totalSpent}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        client.status === "Active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button className="p-1.5 text-[#0026f6] dark:text-[#0026f6] hover:bg-[#e8ebff] dark:hover:bg-[#0026f6]/20 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full p-6">
            {/* Header */}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Add New Client
            </h2>

            {/* Form */}
            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Tech Solutions LLC"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@company.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+994 50 123 4567"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddClient}
                className="px-4 py-2 text-sm font-semibold bg-[#001db8] hover:bg-[#001fc4] text-white rounded-lg transition-colors"
              >
                Save Client
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    companyName: "",
                    contactPerson: "",
                    email: "",
                    phone: "",
                    address: "",
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}