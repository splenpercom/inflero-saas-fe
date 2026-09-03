import { useState } from "react";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { AddMoneyTransferModal } from "./AddMoneyTransferModal";
import { toast } from "sonner";

import { pickLang } from "../../i18n/pickLang";
interface MoneyTransfer {
  id: string;
  date: string;
  referenceNumber: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
}

export function MoneyTransfer() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [transfers, setTransfers] = useState<MoneyTransfer[]>([
    {
      id: "1",
      date: "24 Dec 2024",
      referenceNumber: "#MT842",
      fromAccount: "3298784309485",
      toAccount: "4598489498498",
      amount: 200,
    },
    {
      id: "2",
      date: "10 Dec 2024",
      referenceNumber: "#MT821",
      fromAccount: "5475878970090",
      toAccount: "4494048448994",
      amount: 50,
    },
    {
      id: "3",
      date: "27 Nov 2024",
      referenceNumber: "#MT847",
      fromAccount: "3255465758698",
      toAccount: "6599481186468",
      amount: 800,
    },
    {
      id: "4",
      date: "18 Nov 2024",
      referenceNumber: "#MT874",
      fromAccount: "4353689870544",
      toAccount: "1948948498149",
      amount: 100,
    },
    {
      id: "5",
      date: "06 Nov 2024",
      referenceNumber: "#MT887",
      fromAccount: "4324356677889",
      toAccount: "1686941868478",
      amount: 700,
    },
    {
      id: "6",
      date: "25 Oct 2024",
      referenceNumber: "#MT856",
      fromAccount: "2343547586900",
      toAccount: "1658179744894",
      amount: 1000,
    },
    {
      id: "7",
      date: "14 Oct 2024",
      referenceNumber: "#MT822",
      fromAccount: "3453647664889",
      toAccount: "1418454896454",
      amount: 1200,
    },
    {
      id: "8",
      date: "03 Oct 2024",
      referenceNumber: "#MT844",
      fromAccount: "3354456565687",
      toAccount: "4418848484848",
      amount: 750,
    },
  ]);

  const handleExportPDF = () => {
    toast.info(tr("PDF ixrac funksiyası hazırlanır", "PDF export feature coming soon"));
  };

  const handleExportExcel = () => {
    toast.info(tr("Excel ixrac funksiyası hazırlanır", "Excel export feature coming soon"));
  };

  const handleRefresh = () => {
    toast.success(tr("Pul köçürmələri yeniləndi", "Money transfers refreshed"));
  };

  const handleAddTransfer = () => {
    setIsAddModalOpen(true);
  };

  const handleView = (id: string) => {
    toast.info(tr(`Köçürmə ${id} göstərilir`, `Viewing transfer ${id}`));
  };

  const handleDelete = (id: string) => {
    setTransfers(transfers.filter(t => t.id !== id));
    toast.success(tr("Pul köçürməsi silindi", "Money transfer deleted"));
  };

  const handleAddNewTransfer = (newTransfer: Omit<MoneyTransfer, 'id'>) => {
    const transfer: MoneyTransfer = {
      ...newTransfer,
      id: (transfers.length + 1).toString(),
    };
    setTransfers([transfer, ...transfers]);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Pul Köçürməsi", "Money Transfer")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Pul köçürmələri siyahısını idarə edin", "Manage Money Transfer List")}
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
            onClick={handleAddTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr("Pul Köçürməsi Əlavə Et", "Add Money Transfer")}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
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
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("İSTİNAD NÖMRƏSI", "REFERENCE NUMBER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("GÖNDƏRİLƏN HESAB", "FROM ACCOUNT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ALAN HESAB", "TO ACCOUNT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("MƏBLƏĞ", "AMOUNT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    
                  </th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer, index) => (
                  <tr
                    key={transfer.id}
                    className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50/30 dark:bg-gray-800/10"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {transfer.date}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#14b8a6] dark:text-[#14b8a6] font-medium whitespace-nowrap">
                      {transfer.referenceNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {transfer.fromAccount}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {transfer.toAccount}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {transfer.amount} ₼
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleView(transfer.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          title={tr("Bax", "View")}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(transfer.id)}
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
      </div>
      
      <AddMoneyTransferModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddNewTransfer}
      />
    </div>
  );
}
