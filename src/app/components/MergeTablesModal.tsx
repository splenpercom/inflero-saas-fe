import { useState } from "react";
import { Merge, X, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";

interface MergeTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTableId?: string;
  currentTableName?: string;
  onMerge: (tableIds: string[], tableNames: string[]) => void;
}

interface Table {
  id: string;
  name: string;
  area: string;
  status: "available" | "occupied";
}

export function MergeTablesModal({
  isOpen,
  onClose,
  currentTableId,
  currentTableName,
  onMerge,
}: MergeTablesModalProps) {
  const { language } = useLanguage();
  const [selectedTables, setSelectedTables] = useState<string[]>(
    currentTableId ? [currentTableId] : []
  );

  if (!isOpen) return null;

  // Mock data for tables
  const tables: Table[] = [
    { id: "1", name: "T1", area: "Main Hall", status: "occupied" },
    { id: "2", name: "T2", area: "Main Hall", status: "occupied" },
    { id: "3", name: "T3", area: "Main Hall", status: "available" },
    { id: "4", name: "T4", area: "Main Hall", status: "occupied" },
    { id: "5", name: "T5", area: "Terrace", status: "occupied" },
    { id: "6", name: "T6", area: "Terrace", status: "available" },
    { id: "7", name: "T7", area: "VIP", status: "occupied" },
    { id: "8", name: "T8", area: "VIP", status: "available" },
  ];

  const toggleTableSelection = (tableId: string) => {
    if (selectedTables.includes(tableId)) {
      setSelectedTables(selectedTables.filter((id) => id !== tableId));
    } else {
      setSelectedTables([...selectedTables, tableId]);
    }
  };

  const handleMerge = () => {
    if (selectedTables.length < 2) return;
    const tableNames = selectedTables.map(
      (id) => tables.find((t) => t.id === id)?.name || ""
    );
    onMerge(selectedTables, tableNames);
    onClose();
  };

  // Group tables by area
  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.area]) {
      acc[table.area] = [];
    }
    acc[table.area].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/20 flex items-center justify-center">
              <Merge className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === "en" ? "Merge Tables" : "Masaları Birləşdir"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "en" 
                  ? "Select multiple tables to merge orders" 
                  : "Sifarişləri birləşdirmək üçün bir neçə masa seçin"}
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

        {/* Selected Tables Info */}
        {selectedTables.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === "en" ? "Selected:" : "Seçilmiş:"}
                </span>
                <div className="flex items-center gap-2">
                  {selectedTables.map((id) => {
                    const table = tables.find((t) => t.id === id);
                    return (
                      <span
                        key={id}
                        className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-sm font-semibold text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200/50 dark:border-purple-800/50"
                      >
                        {table?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {selectedTables.length} {language === "en" ? "tables" : "masa"}
              </span>
            </div>
          </div>
        )}

        {/* Tables List */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="space-y-6">
            {Object.entries(groupedTables).map(([area, areaTables]) => (
              <div key={area}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                  {area}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {areaTables.map((table) => {
                    const isSelected = selectedTables.includes(table.id);
                    const isDisabled = table.status === "available";
                    
                    return (
                      <button
                        key={table.id}
                        onClick={() => !isDisabled && toggleTableSelection(table.id)}
                        disabled={isDisabled}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all border-2",
                          isSelected
                            ? "bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border-purple-500/50 dark:border-purple-400/50 shadow-lg"
                            : isDisabled
                            ? "bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-xl border-gray-200/30 dark:border-gray-800/30 opacity-50 cursor-not-allowed"
                            : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300/50 dark:hover:border-purple-600/50"
                        )}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Table Name */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg backdrop-blur-xl",
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg"
                            : "bg-gray-100/80 dark:bg-gray-700/80 text-gray-900 dark:text-white"
                        )}>
                          {table.name}
                        </div>

                        {/* Status */}
                        <span className={cn(
                          "text-xs font-medium",
                          isDisabled
                            ? "text-gray-400"
                            : isSelected
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          {isDisabled 
                            ? (language === "en" ? "Available" : "Boş")
                            : (language === "en" ? "Occupied" : "Dolu")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 dark:border-gray-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
            >
              {language === "en" ? "Cancel" : "Ləğv et"}
            </button>
            <button
              onClick={handleMerge}
              disabled={selectedTables.length < 2}
              className={cn(
                "flex-1 py-3 text-sm font-semibold rounded-xl transition-all",
                selectedTables.length >= 2
                  ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                  : "bg-gray-300/50 dark:bg-gray-700/50 backdrop-blur-xl text-gray-500 dark:text-gray-500 cursor-not-allowed"
              )}
            >
              {language === "en" 
                ? `Merge ${selectedTables.length} Tables` 
                : `${selectedTables.length} Masanı Birləşdir`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}