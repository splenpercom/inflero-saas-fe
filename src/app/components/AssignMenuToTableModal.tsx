import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface Menu {
  id: number;
  name: string;
}

interface AssignMenuToTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { tableId: string; selectedMenuIds: number[]; isActive: boolean }) => void;
  menus: Menu[];
}

export function AssignMenuToTableModal({
  isOpen,
  onClose,
  onSave,
  menus,
}: AssignMenuToTableModalProps) {
  const { t } = useLanguage();
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock table data
  const tables = [
    { id: "1", name: "Table 1" },
    { id: "2", name: "Table 2" },
    { id: "3", name: "Table 3" },
    { id: "4", name: "Table 4" },
    { id: "5", name: "Table 5" },
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTable("");
      setSelectedMenuIds([]);
      setIsActive(true);
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleSave = () => {
    if (selectedTable && selectedMenuIds.length > 0) {
      onSave({
        tableId: selectedTable,
        selectedMenuIds,
        isActive,
      });
      onClose();
    }
  };

  const toggleMenuSelection = (menuId: number) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSelectedTableName = () => {
    const table = tables.find((t) => t.id === selectedTable);
    return table ? table.name : t.select || "Select";
  };

  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);
    setIsDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50 dark:border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
            {t.assignMenuToTableTitle || "ASSIGN MENU TO TABLE"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Custom Dropdown for Table Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.table || "Masa"}
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-[#0026f6]/30 focus:border-[#0026f6] transition-all duration-200"
              >
                <span className={selectedTable ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}>
                  {getSelectedTableName()}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Placeholder option */}
                    <button
                      type="button"
                      onClick={() => handleTableSelect("")}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors ${
                        !selectedTable ? "bg-[#0026f6]/10" : ""
                      }`}
                    >
                      <span className="text-gray-400 dark:text-gray-500">{t.select || "Seçin"}</span>
                      {!selectedTable && (
                        <Check className="w-5 h-5 text-[#0026f6]" />
                      )}
                    </button>
                    
                    {tables.map((table) => (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => handleTableSelect(table.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors ${
                          selectedTable === table.id ? "bg-[#0026f6]/10" : ""
                        }`}
                      >
                        <span className="text-gray-900 dark:text-white">{table.name}</span>
                        {selectedTable === table.id && (
                          <Check className="w-5 h-5 text-[#0026f6]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Name Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.menuName || "Menu Name"}
            </label>

            {/* Menu List */}
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {menus.map((menu, index) => (
                  <label
                    key={menu.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      index > 0 ? "border-t border-gray-200/50 dark:border-gray-700/50" : ""
                    }`}
                  >
                    <span className="text-sm text-gray-900 dark:text-white">
                      {menu.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleMenuSelection(menu.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 ${
                        selectedMenuIds.includes(menu.id)
                          ? "bg-gradient-to-br from-[#0026f6] to-[#004bb5] shadow-lg shadow-[#0026f6]/30"
                          : "bg-gray-200/80 dark:bg-gray-700/80 hover:bg-gray-300/80 dark:hover:bg-gray-600/80"
                      }`}
                    >
                      {selectedMenuIds.includes(menu.id) && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Active Checkbox */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 ${
                  isActive
                    ? "bg-gradient-to-br from-[#0026f6] to-[#004bb5] shadow-lg shadow-[#0026f6]/30"
                    : "bg-gray-200/80 dark:bg-gray-700/80 hover:bg-gray-300/80 dark:hover:bg-gray-600/80"
                }`}
              >
                {isActive && (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                )}
              </button>
              <span className="text-sm text-gray-900 dark:text-white font-medium">
                {t.active || "Active"}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start gap-3 px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={handleSave}
            disabled={!selectedTable || selectedMenuIds.length === 0}
            className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-[#0026f6] to-[#004bb5] hover:from-[#004bb5] hover:to-[#003d8f] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#0026f6]/20 hover:shadow-xl hover:shadow-[#0026f6]/30"
          >
            {t.save || "Yadda saxla"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
          >
            {t.close || "Bağla"}
          </button>
        </div>
      </div>
    </div>
  );
}