import { useState, useEffect } from "react";
import { Bell, Check, AlertCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface WaiterRequest {
  id: number;
  tableNumber: string;
  area: string;
  timestamp: number;
  isAttended: boolean;
}

export function WaiterRequests() {
  const { t } = useLanguage();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<WaiterRequest | null>(null);

  // Mock data
  const [requests, setRequests] = useState<WaiterRequest[]>([
    {
      id: 1,
      tableNumber: "T-2",
      area: "Lounge",
      timestamp: Date.now() - 14000,
      isAttended: false,
    },
    {
      id: 2,
      tableNumber: "T-7",
      area: "Garden",
      timestamp: Date.now() - 19000,
      isAttended: false,
    },
    {
      id: 3,
      tableNumber: "T-4",
      area: "Garden",
      timestamp: Date.now() - 19000,
      isAttended: false,
    },
  ]);

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio("data:audio/wav;base64,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");
    audio.play().catch(() => {
      // Silently fail if audio playback is blocked
    });
  };

  // Simulate new request (in real app, this would come from websocket/API)
  useEffect(() => {
    if (autoRefresh) {
      const timer = setInterval(() => {
        // Simulate random new request
        if (Math.random() > 0.7) {
          const newRequest: WaiterRequest = {
            id: Date.now(),
            tableNumber: `T-${Math.floor(Math.random() * 20) + 1}`,
            area: Math.random() > 0.5 ? "Lounge" : "Garden",
            timestamp: Date.now(),
            isAttended: false,
          };
          setRequests((prev) => [newRequest, ...prev]);
          setCurrentRequest(newRequest);
          setShowModal(true);
          playNotificationSound();
        }
      }, refreshInterval * 1000);

      return () => clearInterval(timer);
    }
  }, [autoRefresh, refreshInterval]);

  const handleMarkAttended = (id: number) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, isAttended: true } : req))
    );
    setShowModal(false);
  };

  const handleDoItLater = () => {
    setShowModal(false);
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    return `${seconds} ${t.waiterRequestsPage.secondsAgo}`;
  };

  // Group requests by area
  const groupedRequests = requests.reduce((acc, request) => {
    if (!request.isAttended) {
      if (!acc[request.area]) {
        acc[request.area] = [];
      }
      acc[request.area].push(request);
    }
    return acc;
  }, {} as Record<string, WaiterRequest[]>);

  const pendingCount = requests.filter((r) => !r.isAttended).length;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Page Header */}
      <div className="flex-shrink-0 px-4 sm:px-4 xl:px-6 2xl:px-8 py-3 sm:py-3 xl:py-4 2xl:py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {t.waiterRequestsPage.title} ({pendingCount})
          </h1>

          {/* Auto Refresh Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  autoRefresh ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    autoRefresh ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {t.waiterRequestsPage.autoRefresh}
              </span>
            </div>

            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 {t.waiterRequestsPage.seconds}</option>
              <option value={10}>10 {t.waiterRequestsPage.seconds}</option>
              <option value={15}>15 {t.waiterRequestsPage.seconds}</option>
              <option value={30}>30 {t.waiterRequestsPage.seconds}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-4 xl:px-6 2xl:px-8 py-4">
        <div className="space-y-6">
          {Object.entries(groupedRequests).map(([area, areaRequests]) => (
            <div key={area}>
              {/* Area Header */}
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {area}
                </h2>
                <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                  {areaRequests.length} {t.waiterRequestsPage.table}
                </span>
              </div>

              {/* Request Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {areaRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    {/* Table Number Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2.5 py-1 text-sm font-semibold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded">
                        {request.tableNumber}
                      </span>
                    </div>

                    {/* Time and Waiter Icon */}
                    <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500 dark:text-gray-400">
                      <Bell className="w-3.5 h-3.5" />
                      <span>{getTimeAgo(request.timestamp)}</span>
                    </div>

                    {/* Mark Attended Button */}
                    <button
                      onClick={() => handleMarkAttended(request.id)}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t.waiterRequestsPage.markAttended}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {pendingCount === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No pending waiter requests
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showModal && currentRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-xl">
            {/* Alert Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            {/* Message */}
            <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-6">
              {t.waiterRequestsPage.newWaiterRequestFor} {currentRequest.tableNumber}
            </h3>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAttended(currentRequest.id)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {t.waiterRequestsPage.markAttended}
              </button>
              <button
                onClick={handleDoItLater}
                className="flex-1 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t.waiterRequestsPage.doItLater}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}