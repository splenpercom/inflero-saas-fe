import { useState } from "react";
import { Search, Edit2, Trash2, Plus } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface Area {
  id: number;
  name: string;
  tableCount: number;
}

export function Areas() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [areaName, setAreaName] = useState("");

  // Mock data
  const areas: Area[] = [
    { id: 1, name: "Lounge", tableCount: 4 },
    { id: 2, name: "Roof Top", tableCount: 3 },
    { id: 3, name: "Garden", tableCount: 3 },
  ];

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddArea = () => {
    // Handle add area logic here
    setShowAddAreaModal(false);
    setAreaName("");
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.allAreas}
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
            placeholder={t.searchArea}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddAreaModal(true)}
          className="px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.addArea}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.areaName}
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.noOfTables}
                </th>
                <th className="text-center px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAreas.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    No areas found
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area) => (
                  <tr
                    key={area.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">
                      {area.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {area.tableCount}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          {t.update}
                        </button>
                        <button className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
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

      {/* Add Area Modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-6">
            {/* Header */}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t.addArea}
            </h2>

            {/* Form */}
            <div className="space-y-4">
              {/* Area Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.areaName}
                </label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Rooftop"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddArea}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t.save}
              </button>
              <button
                onClick={() => {
                  setShowAddAreaModal(false);
                  setAreaName("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}