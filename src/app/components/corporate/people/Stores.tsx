import { useState } from "react";
import { cn } from "../../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useConfirm } from "../../../context/ConfirmContext";
import { AddStoreModal } from "./AddStoreModal";

import { pickLang } from "../../../i18n/pickLang";
interface Store {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

export function Stores() {
  const { t, language } = useLanguage();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const stores: Store[] = [
    {
      id: "1",
      code: "STR001",
      name: "Downtown Branch",
      email: "downtown@inflero.com",
      phone: "+12345678901",
      address: "123 Main St, Downtown",
      status: "Active",
    },
    {
      id: "2",
      code: "STR002",
      name: "Airport Branch",
      email: "airport@inflero.com",
      phone: "+12345678902",
      address: "Airport Terminal 2",
      status: "Active",
    },
    {
      id: "3",
      code: "STR003",
      name: "Mall Branch",
      email: "mall@inflero.com",
      phone: "+12345678903",
      address: "City Center Mall, Level 2",
      status: "Active",
    },
    {
      id: "4",
      code: "STR004",
      name: "Beach Branch",
      email: "beach@inflero.com",
      phone: "+12345678904",
      address: "456 Seaside Blvd",
      status: "Inactive",
    },
    {
      id: "5",
      code: "STR005",
      name: "Uptown Branch",
      email: "uptown@inflero.com",
      phone: "+12345678905",
      address: "789 Uptown Ave",
      status: "Active",
    },
    {
      id: "6",
      code: "STR006",
      name: "Suburb Branch",
      email: "suburb@inflero.com",
      phone: "+12345678906",
      address: "321 Suburb Road",
      status: "Active",
    },
  ];

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      "Active": tr("Aktiv", "Active"),
      "Inactive": tr("Qeyri-aktiv", "Inactive"),
    };
    return statusMap[status] || status;
  };

  const handleExportPDF = () => {
    alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF functionality coming soon"));
  };

  const handleExportExcel = () => {
    alert(tr("Excel ixrac funksiyası tezliklə əlavə olunacaq", "Export Excel functionality coming soon"));
  };

  const handleRefresh = () => {
    alert(tr("Mağazalar yenilənir...", "Refreshing stores..."));
  };

  const handleAddStore = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveStore = (storeData: any) => {
    alert(tr("Mağaza uğurla əlavə edildi!", "Store added successfully!"));
  };

  const handleView = (id: string) => {
    alert(tr(`Mağaza ${id} baxılır`, `View store ${id}`));
  };

  const handleEdit = (id: string) => {
    alert(tr(`Mağaza ${id} redaktə edilir`, `Edit store ${id}`));
  };

  const handleDelete = async (id: string) => {
    if (await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu mağazanı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this store?"),
      variant: "danger",
    })) {
      alert(tr(`Mağaza ${id} silinir`, `Delete store ${id}`));
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Mağazalar", "Stores")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Mağazalarınızı idarə edin", "Manage your stores")}
          </p>
        </div>

        {/* Actions Bar - Top Right Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("PDF İxrac Et", "Export PDF")}
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("Excel İxrac Et", "Export Excel")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("Yenilə", "Refresh")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleAddStore}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr("Mağaza Əlavə Et", "Add Store")}</span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 ml-auto">
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer"
                >
                  <option value="all">{tr("Status", "Status")}</option>
                  <option value="active">{tr("Aktiv", "Active")}</option>
                  <option value="inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
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
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("KOD", "CODE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("MAĞAZA ADI", "STORE NAME")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("E-POÇT", "EMAIL")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("TELEFON", "PHONE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ÜNVAN", "ADDRESS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("STATUS", "STATUS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store, index) => (
                  <tr
                    key={store.id}
                    className={`border-b border-gray-200 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {store.code}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs text-gray-900 dark:text-white">
                        {store.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {store.email}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {store.phone}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {store.address}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                        store.status === "Active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                      )}>
                        {translateStatus(store.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(store.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          title={tr("Bax", "View")}
                        >
                          <Eye className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleEdit(store.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          title={tr("Redaktə Et", "Edit")}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDelete(store.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={tr("Sil", "Delete")}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Store Modal */}
        <AddStoreModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveStore}
        />
      </div>
    </div>
  );
}