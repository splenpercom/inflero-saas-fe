import { useState } from "react";
import { Users, X, Search, Star } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";

interface SelectWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (waiterId: string, waiterName: string) => void;
}

interface Waiter {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  activeOrders: number;
  rating: number;
  status: "available" | "busy";
}

export function SelectWaiterModal({
  isOpen,
  onClose,
  onSelect,
}: SelectWaiterModalProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  // Mock data for waiters
  const waiters: Waiter[] = [
    { id: "1", name: "John Smith", role: "Senior Waiter", activeOrders: 3, rating: 4.8, status: "available" },
    { id: "2", name: "Sarah Johnson", role: "Waiter", activeOrders: 5, rating: 4.9, status: "busy" },
    { id: "3", name: "Michael Brown", role: "Head Waiter", activeOrders: 2, rating: 5.0, status: "available" },
    { id: "4", name: "Emily Davis", role: "Waiter", activeOrders: 4, rating: 4.7, status: "available" },
    { id: "5", name: "David Wilson", role: "Senior Waiter", activeOrders: 6, rating: 4.6, status: "busy" },
    { id: "6", name: "Lisa Anderson", role: "Waiter", activeOrders: 1, rating: 4.9, status: "available" },
  ];

  const filteredWaiters = waiters.filter((waiter) =>
    waiter.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    return status === "available"
      ? "bg-green-500"
      : "bg-yellow-500";
  };

  const getStatusLabel = (status: string) => {
    return status === "available"
      ? (language === "en" ? "Available" : "Boş")
      : (language === "en" ? "Busy" : "Məşğul");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === "en" ? "Select Waiter" : "Ofisiant Seç"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "en" ? "Assign a waiter to this order" : "Bu sifariş üçün ofisiant təyin edin"}
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

        {/* Search */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "en" ? "Search waiters..." : "Ofisiantları axtar..."}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Waiters List */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="space-y-3">
            {filteredWaiters.map((waiter) => (
              <button
                key={waiter.id}
                onClick={() => {
                  onSelect(waiter.id, waiter.name);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-lg transition-all group"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                    {getInitials(waiter.name)}
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900",
                    getStatusColor(waiter.status)
                  )}></div>
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {waiter.name}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold rounded-full backdrop-blur-xl",
                      waiter.status === "available"
                        ? "bg-green-100/80 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/50"
                        : "bg-yellow-100/80 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-800/50"
                    )}>
                      {getStatusLabel(waiter.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {waiter.role}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>
                        {waiter.activeOrders} {language === "en" ? "orders" : "sifariş"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-medium">{waiter.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Arrow Indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredWaiters.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "en" ? "No waiters found" : "Ofisiant tapılmadı"}
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