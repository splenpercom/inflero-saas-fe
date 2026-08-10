import { useState } from "react";
import { Download, Copy, RefreshCw } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";

type TableStatus = "available" | "running" | "reserved";

interface QRCode {
  id: string;
  tableName: string;
  area: string;
  seats: number;
  status: TableStatus;
  qrCode: string;
}

export function QRCodes() {
  const { t } = useLanguage();
  const [selectedArea, setSelectedArea] = useState("all");

  // Mock data
  const areas = [
    { id: "all", name: t.allAreas },
    { id: "lounge", name: t.lounge },
    { id: "roofTop", name: t.roofTop },
    { id: "garden", name: t.garden },
  ];

  const qrCodes: QRCode[] = [
    { id: "T-10", tableName: "T-10", area: "lounge", seats: 4, status: "available", qrCode: "qr-placeholder" },
    { id: "T-4", tableName: "T-4", area: "lounge", seats: 4, status: "running", qrCode: "qr-placeholder" },
    { id: "T-5", tableName: "T-5", area: "lounge", seats: 2, status: "reserved", qrCode: "qr-placeholder" },
    { id: "T-9", tableName: "T-9", area: "lounge", seats: 5, status: "available", qrCode: "qr-placeholder" },
    { id: "T-1", tableName: "T-1", area: "roofTop", seats: 6, status: "available", qrCode: "qr-placeholder" },
    { id: "T-2", tableName: "T-2", area: "roofTop", seats: 3, status: "available", qrCode: "qr-placeholder" },
    { id: "T-8", tableName: "T-8", area: "roofTop", seats: 3, status: "running", qrCode: "qr-placeholder" },
    { id: "T-3", tableName: "T-3", area: "garden", seats: 4, status: "available", qrCode: "qr-placeholder" },
  ];

  const filteredQRCodes = selectedArea === "all" 
    ? qrCodes 
    : qrCodes.filter(qr => qr.area === selectedArea);

  // Group QR codes by area
  const qrCodesByArea = filteredQRCodes.reduce((acc, qr) => {
    if (!acc[qr.area]) {
      acc[qr.area] = [];
    }
    acc[qr.area].push(qr);
    return acc;
  }, {} as Record<string, QRCode[]>);

  const getAreaName = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : areaId;
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case "available":
        return (
          <span className="px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
            {t.available}
          </span>
        );
      case "running":
        return (
          <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
            {t.running}
          </span>
        );
      case "reserved":
        return (
          <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
            {t.reserved}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.qrCodesPage}
        </h1>
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

      {/* Featured QR Code - First item from selected area */}
      {filteredQRCodes.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 max-w-xs">
            {/* QR Code Image */}
            <div className="bg-white p-3 rounded-lg mb-3">
              <div className="w-40 h-40 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Simple QR code pattern */}
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="black" />
                  <rect x="30" y="10" width="10" height="10" fill="black" />
                  <rect x="50" y="10" width="10" height="10" fill="black" />
                  <rect x="70" y="10" width="10" height="10" fill="black" />
                  <rect x="10" y="30" width="10" height="10" fill="black" />
                  <rect x="30" y="30" width="10" height="10" fill="black" />
                  <rect x="50" y="30" width="10" height="10" fill="black" />
                  <rect x="70" y="30" width="10" height="10" fill="black" />
                  <rect x="10" y="50" width="10" height="10" fill="black" />
                  <rect x="30" y="50" width="10" height="10" fill="black" />
                  <rect x="50" y="50" width="10" height="10" fill="black" />
                  <rect x="70" y="50" width="10" height="10" fill="black" />
                  <rect x="10" y="70" width="10" height="10" fill="black" />
                  <rect x="30" y="70" width="10" height="10" fill="black" />
                  <rect x="50" y="70" width="10" height="10" fill="black" />
                  <rect x="70" y="70" width="10" height="10" fill="black" />
                </svg>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Download className="w-3.5 h-3.5" />
                {t.downloadQR}
              </button>
              <button className="p-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Codes Grid by Area */}
      <div className="space-y-6">
        {Object.entries(qrCodesByArea).map(([areaId, areaQRCodes]) => (
          <div key={areaId}>
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {getAreaName(areaId)}
              </h3>
              <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                {areaQRCodes.length} {t.tableLabel}
              </span>
            </div>

            {/* QR Codes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {areaQRCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
                >
                  {/* Table Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">
                      {qr.tableName}
                    </div>
                    {getStatusBadge(qr.status)}
                  </div>
                  
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-2">
                    {qr.seats} {t.seats}(s)
                  </div>

                  {/* QR Code Image */}
                  <div className="bg-white p-2 rounded mb-2">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Simple QR code pattern */}
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <rect x="10" y="10" width="10" height="10" fill="black" />
                        <rect x="30" y="10" width="10" height="10" fill="black" />
                        <rect x="50" y="10" width="10" height="10" fill="black" />
                        <rect x="70" y="10" width="10" height="10" fill="black" />
                        <rect x="10" y="30" width="10" height="10" fill="black" />
                        <rect x="30" y="30" width="10" height="10" fill="black" />
                        <rect x="50" y="30" width="10" height="10" fill="black" />
                        <rect x="70" y="30" width="10" height="10" fill="black" />
                        <rect x="10" y="50" width="10" height="10" fill="black" />
                        <rect x="30" y="50" width="10" height="10" fill="black" />
                        <rect x="50" y="50" width="10" height="10" fill="black" />
                        <rect x="70" y="50" width="10" height="10" fill="black" />
                        <rect x="10" y="70" width="10" height="10" fill="black" />
                        <rect x="30" y="70" width="10" height="10" fill="black" />
                        <rect x="50" y="70" width="10" height="10" fill="black" />
                        <rect x="70" y="70" width="10" height="10" fill="black" />
                      </svg>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button className="p-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Download className="w-3 h-3" />
                    </button>
                    <button className="p-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="p-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}