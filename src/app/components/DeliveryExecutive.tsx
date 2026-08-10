import { useState } from "react";
import { Search, Download, Plus, Pencil, Trash2, User, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";

interface Executive {
  id: string;
  name: string;
  phone: string;
  uniqueCode: string;
  totalOrders: number;
  status: "Available" | "Busy" | "Offline";
}

export function DeliveryExecutive() {
  const { t } = useLanguage();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddExecutiveModalOpen, setIsAddExecutiveModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [executives, setExecutives] = useState<Executive[]>([
    {
      id: "1",
      name: "Juanita Wiegand",
      phone: "+918227268172",
      uniqueCode: "GFMC1",
      totalOrders: 0,
      status: "Available",
    },
    {
      id: "2",
      name: "Willa Gutmann",
      phone: "+914044154856",
      uniqueCode: "NOO02",
      totalOrders: 0,
      status: "Available",
    },
    {
      id: "3",
      name: "Agustin Hermiston",
      phone: "+911977756064",
      uniqueCode: "AVDX3",
      totalOrders: 0,
      status: "Available",
    },
    {
      id: "4",
      name: "Pearl Pagac",
      phone: "+917704376555",
      uniqueCode: "JBD24",
      totalOrders: 0,
      status: "Available",
    },
    {
      id: "5",
      name: "Amani Wiza",
      phone: "+916598534707",
      uniqueCode: "BKI55",
      totalOrders: 0,
      status: "Available",
    },
    {
      id: "6",
      name: "Christine Lowe",
      phone: "+913046720195",
      uniqueCode: "UAJV6",
      totalOrders: 0,
      status: "Available",
    },
    {
      id: "7",
      name: "Savion Schimmel",
      phone: "+913541078869",
      uniqueCode: "L1DD7",
      totalOrders: 0,
      status: "Available",
    },
  ]);

  const [newExecutive, setNewExecutive] = useState({
    name: "",
    phone: "",
    uniqueCode: "",
    password: "",
  });

  const filteredExecutives = executives.filter(
    (exec) =>
      exec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exec.phone.includes(searchQuery) ||
      exec.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredExecutives.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExecutives = filteredExecutives.slice(startIndex, startIndex + itemsPerPage);

  const handleAddExecutive = () => {
    if (newExecutive.name && newExecutive.phone && newExecutive.uniqueCode && newExecutive.password) {
      const executive: Executive = {
        id: Date.now().toString(),
        name: newExecutive.name,
        phone: newExecutive.phone,
        uniqueCode: newExecutive.uniqueCode,
        totalOrders: 0,
        status: "Available",
      };
      setExecutives([...executives, executive]);
      setNewExecutive({ name: "", phone: "", uniqueCode: "", password: "" });
      setIsAddExecutiveModalOpen(false);
    }
  };

  const handleDeleteExecutive = async (id: string) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: t.deliveryExecutivePage.confirmDelete,
      variant: "danger",
    })) {
      setExecutives(executives.filter((exec) => exec.id !== id));
    }
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Phone", "Unique Code", "Total Orders", "Status"],
      ...executives.map((e) => [e.name, e.phone, e.uniqueCode, e.totalOrders, e.status]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "delivery-executives.csv";
    a.click();
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {t.deliveryExecutivePage.title}
          </h1>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={t.deliveryExecutivePage.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.deliveryExecutivePage.export}</span>
              </button>
              <button
                onClick={() => setIsAddExecutiveModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.deliveryExecutivePage.addExecutive}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.deliveryExecutivePage.memberName}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.deliveryExecutivePage.phone}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.deliveryExecutivePage.uniqueCode}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.deliveryExecutivePage.totalOrders}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.deliveryExecutivePage.status}
                  </th>
                  <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.deliveryExecutivePage.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {paginatedExecutives.map((executive) => (
                  <tr
                    key={executive.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {executive.name}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {executive.phone}
                      </div>
                    </td>

                    {/* Unique Code */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900 dark:text-white">
                        {executive.uniqueCode}
                      </div>
                    </td>

                    {/* Total Orders */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="inline-flex items-center px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-medium text-gray-900 dark:text-white">
                        {executive.totalOrders} {t.deliveryExecutivePage.orders}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded uppercase ${
                          executive.status === "Available"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : executive.status === "Busy"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {executive.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{t.deliveryExecutivePage.update}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExecutive(executive.id)}
                          className="p-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
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
          {filteredExecutives.length === 0 && (
            <div className="text-center py-8">
              <User className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.deliveryExecutivePage.noExecutivesFound}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredExecutives.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {t.deliveryExecutivePage.showing} {startIndex + 1} {t.deliveryExecutivePage.to}{" "}
                {Math.min(startIndex + itemsPerPage, filteredExecutives.length)} {t.deliveryExecutivePage.of}{" "}
                {filteredExecutives.length} {t.deliveryExecutivePage.results}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 py-1 text-[10px] rounded font-medium transition-colors ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Executive Modal */}
      {isAddExecutiveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg w-full max-w-md shadow-xl">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.deliveryExecutivePage.addNewExecutive}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-4 py-3 space-y-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.deliveryExecutivePage.memberName}
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={newExecutive.name}
                    onChange={(e) =>
                      setNewExecutive({ ...newExecutive, name: e.target.value })
                    }
                    placeholder={t.deliveryExecutivePage.enterName}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.deliveryExecutivePage.phone}
                </label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-3.5 h-3.5" />
                  <input
                    type="tel"
                    value={newExecutive.phone}
                    onChange={(e) =>
                      setNewExecutive({ ...newExecutive, phone: e.target.value })
                    }
                    placeholder={t.deliveryExecutivePage.enterPhone}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Unique Code */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.deliveryExecutivePage.uniqueCode}
                </label>
                <input
                  type="text"
                  value={newExecutive.uniqueCode}
                  onChange={(e) =>
                    setNewExecutive({ ...newExecutive, uniqueCode: e.target.value })
                  }
                  placeholder={t.deliveryExecutivePage.enterUniqueCode}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.deliveryExecutivePage.password}
                </label>
                <input
                  type="password"
                  value={newExecutive.password}
                  onChange={(e) =>
                    setNewExecutive({ ...newExecutive, password: e.target.value })
                  }
                  placeholder={t.deliveryExecutivePage.enterPassword}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex gap-2 justify-end">
              <button
                onClick={() => setIsAddExecutiveModalOpen(false)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t.deliveryExecutivePage.cancel}
              </button>
              <button
                onClick={handleAddExecutive}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t.deliveryExecutivePage.addExecutive}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}