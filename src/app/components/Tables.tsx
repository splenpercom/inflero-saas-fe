import { useState } from "react";
import { LayoutList, LayoutGrid, Layout, ChevronDown, Edit2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";

type ViewMode = "list" | "grid" | "layout";
type TableStatus = "available" | "running" | "reserved";

interface Table {
  id: string;
  name: string;
  area: string;
  seats: number;
  status: TableStatus;
  shape?: "square" | "circle" | "rectangle";
}

export function Tables() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedArea, setSelectedArea] = useState("all");

  // Mock data
  const areas = [
    { id: "all", name: t.allAreas },
    { id: "lounge", name: t.lounge },
    { id: "roofTop", name: t.roofTop },
    { id: "garden", name: t.garden },
  ];

  const tables: Table[] = [
    { id: "T-10", name: "T-10", area: "lounge", seats: 6, status: "available", shape: "square" },
    { id: "T-4", name: "T-4", area: "lounge", seats: 4, status: "available", shape: "square" },
    { id: "T-5", name: "T-5", area: "lounge", seats: 2, status: "available", shape: "circle" },
    { id: "T-9", name: "T-9", area: "lounge", seats: 5, status: "available", shape: "rectangle" },
    { id: "T-1", name: "T-1", area: "roofTop", seats: 6, status: "available", shape: "square" },
    { id: "T-2", name: "T-2", area: "roofTop", seats: 3, status: "available", shape: "circle" },
    { id: "T-8", name: "T-8", area: "roofTop", seats: 3, status: "available", shape: "circle" },
  ];

  const filteredTables = selectedArea === "all" 
    ? tables 
    : tables.filter(table => table.area === selectedArea);

  // Group tables by area
  const tablesByArea = filteredTables.reduce((acc, table) => {
    if (!acc[table.area]) {
      acc[table.area] = [];
    }
    acc[table.area].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  const getAreaName = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : areaId;
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      case "running":
        return "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800";
      case "reserved":
        return "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800";
    }
  };

  const renderListView = () => (
    <div className="space-y-6">
      {Object.entries(tablesByArea).map(([areaId, areaTables]) => (
        <div key={areaId}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {getAreaName(areaId)}
            </h3>
            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
              {areaTables.length} {t.tableLabel}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {areaTables.map((table) => (
              <div
                key={table.id}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer",
                  getStatusColor(table.status)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">
                      {table.name}
                    </div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                      {table.seats} {t.seats}(s)
                    </div>
                  </div>
                  <button className="p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors">
                    <Edit2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <button className="w-full px-2 py-1 text-[10px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {t.assignWaiter}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderGridView = () => (
    <div className="space-y-6">
      {Object.entries(tablesByArea).map(([areaId, areaTables]) => (
        <div key={areaId}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {getAreaName(areaId)}
            </h3>
            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
              {areaTables.length} {t.tableLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {areaTables.map((table) => (
              <div
                key={table.id}
                className={cn(
                  "aspect-square p-3 rounded-lg border transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer flex flex-col items-center justify-center",
                  getStatusColor(table.status)
                )}
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {table.name}
                </div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-2">
                  {table.seats} {t.seats}(s)
                </div>
                <button className="px-2 py-0.5 text-[10px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {t.assignWaiter}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderLayoutView = () => (
    <div className="space-y-6">
      {Object.entries(tablesByArea).map(([areaId, areaTables]) => (
        <div key={areaId}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {getAreaName(areaId)}
            </h3>
            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
              {areaTables.length} {t.tableLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            {areaTables.map((table) => {
              const shapeClasses = {
                square: "w-24 h-24 rounded-lg",
                circle: "w-28 h-28 rounded-full",
                rectangle: "w-32 h-20 rounded-lg",
              };

              return (
                <div
                  key={table.id}
                  className={cn(
                    "p-3 border transition-all duration-300 hover:shadow-lg hover:scale-110 cursor-pointer flex flex-col items-center justify-center",
                    getStatusColor(table.status),
                    shapeClasses[table.shape || "square"]
                  )}
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                    {table.name}
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    {table.seats} {t.seats}(s)
                  </div>
                  <button className="px-2 py-0.5 text-[10px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t.assignWaiter}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.tableView}
        </h1>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors",
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <LayoutList className="w-3.5 h-3.5" />
            {t.list}
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors",
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {t.grid}
          </button>
          <button
            onClick={() => setViewMode("layout")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors",
              viewMode === "layout"
                ? "bg-blue-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <Layout className="w-3.5 h-3.5" />
            {t.layout}
          </button>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button className="flex items-center gap-2 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap">
            {t.filterByAvailability}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add Table Button */}
        <button className="px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap">
          {t.addTable}
        </button>
      </div>

      {/* Area Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => setSelectedArea(area.id)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg transition-colors",
              selectedArea === area.id
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {area.name}
          </button>
        ))}
      </div>

      {/* Tables */}
      {viewMode === "list" && renderListView()}
      {viewMode === "grid" && renderGridView()}
      {viewMode === "layout" && renderLayoutView()}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-end gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">{t.available}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">{t.running}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">{t.reserved}</span>
        </div>
      </div>
    </div>
  );
}