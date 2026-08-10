import { useState } from "react";
import { MapPin, Users, X, Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";

interface AssignTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (tableId: string, tableName: string, areaName: string) => void;
}

interface Table {
  id: string;
  name: string;
  area: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
}

export function AssignTableModal({
  isOpen,
  onClose,
  onAssign,
}: AssignTableModalProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("all");

  if (!isOpen) return null;

  // Mock data for tables
  const tables: Table[] = [
    { id: "1", name: "T1", area: "Main Hall", capacity: 4, status: "available" },
    { id: "2", name: "T2", area: "Main Hall", capacity: 2, status: "occupied" },
    { id: "3", name: "T3", area: "Main Hall", capacity: 6, status: "available" },
    { id: "4", name: "T4", area: "Main Hall", capacity: 4, status: "reserved" },
    { id: "5", name: "T5", area: "Terrace", capacity: 4, status: "available" },
    { id: "6", name: "T6", area: "Terrace", capacity: 8, status: "available" },
    { id: "7", name: "T7", area: "VIP", capacity: 10, status: "available" },
    { id: "8", name: "T8", area: "VIP", capacity: 6, status: "occupied" },
  ];

  const areas = ["all", ...Array.from(new Set(tables.map((t) => t.area)))];

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = selectedArea === "all" || table.area === selectedArea;
    const isAvailable = table.status === "available"; // Only show available tables
    return matchesSearch && matchesArea && isAvailable;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
      case "occupied":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800";
      case "reserved":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return language === "en" ? "Available" : "Boş";
      case "occupied":
        return language === "en" ? "Occupied" : "Dolu";
      case "reserved":
        return language === "en" ? "Reserved" : "Rezerv";
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === "en" ? "Assign Table" : "Masa Təyin Et"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "en" ? "Select a table for this order" : "Bu sifariş üçün masa seçin"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "en" ? "Search tables..." : "Masaları axtar..."}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Area Filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                  selectedArea === area
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50"
                )}
              >
                {area === "all" ? (language === "en" ? "All Areas" : "Bütün Sahələr") : area}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <button
                key={table.id}
                onClick={() => {
                  if (table.status === "available") {
                    onAssign(table.id, table.name, table.area);
                    onClose();
                  }
                }}
                disabled={table.status !== "available"}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all border-2",
                  table.status === "available"
                    ? "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg cursor-pointer"
                    : "bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-xl border-gray-200/30 dark:border-gray-800/30 opacity-60 cursor-not-allowed"
                )}
              >
                {/* Table Icon */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center border-2 backdrop-blur-xl",
                  table.status === "available"
                    ? "bg-gradient-to-br from-green-500/20 to-green-400/20 border-green-300/50 dark:border-green-700/50"
                    : table.status === "occupied"
                    ? "bg-gradient-to-br from-red-500/20 to-red-400/20 border-red-300/50 dark:border-red-700/50"
                    : "bg-gradient-to-br from-yellow-500/20 to-yellow-400/20 border-yellow-300/50 dark:border-yellow-700/50"
                )}>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {table.name}
                  </span>
                </div>

                {/* Table Info */}
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {table.area}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{table.capacity}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={cn(
                  "absolute top-2 right-2 px-2 py-1 text-[10px] font-semibold rounded-lg border backdrop-blur-xl",
                  getStatusColor(table.status)
                )}>
                  {getStatusLabel(table.status)}
                </div>
              </button>
            ))}
          </div>

          {filteredTables.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "en" ? "No tables found" : "Masa tapılmadı"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 dark:border-gray-800/50">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-semibold bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
          >
            {language === "en" ? "Cancel" : "Ləğv et"}
          </button>
        </div>
      </div>
    </div>
  );
}