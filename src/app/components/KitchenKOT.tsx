import { useState } from "react";
import { ChevronDown, Printer, Clock, ChefHat, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface KOTItem {
  id: string;
  name: string;
  quantity: number;
  status: "pending" | "cooking" | "ready";
}

interface KOT {
  id: string;
  kotNumber: string;
  orderNumber: string;
  kitchen: string;
  timestamp: string;
  itemCount: number;
  status: "pending" | "in-kitchen" | "ready" | "served" | "cancelled";
  waiter: string;
  table: string;
  items: KOTItem[];
  priority?: "high" | "normal";
  elapsedTime?: string;
}

export function KitchenKOT() {
  const { t } = useLanguage();
  const [kitchenFilter, setKitchenFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [startDate, setStartDate] = useState("25/02/2026");
  const [endDate, setEndDate] = useState("25/02/2026");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in-kitchen" | "ready" | "served" | "cancelled">("all");

  // Mock KOT data
  const [kots, setKots] = useState<KOT[]>([
    {
      id: "1",
      kotNumber: "KOT #21",
      orderNumber: "Order #14",
      kitchen: "Veg Kitchen",
      timestamp: "24.02.2026 03:01 AM",
      itemCount: 1,
      status: "pending",
      waiter: "Jayaglyn Bastle",
      table: "Table 5",
      priority: "high",
      elapsedTime: "2 min",
      items: [
        { id: "1", name: "Chili Paneer", quantity: 2, status: "pending" }
      ]
    },
    {
      id: "2",
      kotNumber: "KOT #13",
      orderNumber: "Order #5",
      kitchen: "Non-Veg Kitchen",
      timestamp: "24.02.2026 03:01 AM",
      itemCount: 1,
      status: "pending",
      waiter: "Jayaglyn Bastle",
      table: "Table 7",
      elapsedTime: "5 min",
      items: [
        { id: "1", name: "Butter Chicken", quantity: 3, status: "pending" }
      ]
    },
    {
      id: "3",
      kotNumber: "KOT #11",
      orderNumber: "Order #1",
      kitchen: "Non-Veg Kitchen",
      timestamp: "24.02.2026 03:01 AM",
      itemCount: 1,
      status: "in-kitchen",
      waiter: "Jayaglyn Bastle",
      table: "Table 3",
      elapsedTime: "12 min",
      items: [
        { id: "1", name: "Hyderabadi Chicken Biryani", quantity: 1, status: "cooking" }
      ]
    },
    {
      id: "4",
      kotNumber: "KOT #9",
      orderNumber: "Order #2",
      kitchen: "Veg Kitchen",
      timestamp: "24.02.2026",
      itemCount: 2,
      status: "in-kitchen",
      waiter: "Jayaglyn Bastle",
      table: "Table 5",
      elapsedTime: "18 min",
      items: [
        { id: "1", name: "Vegetable Hakka Noodles", quantity: 2, status: "cooking" },
        { id: "2", name: "Dal Makhani", quantity: 3, status: "cooking" }
      ]
    },
    {
      id: "5",
      kotNumber: "KOT #4",
      orderNumber: "Order #4",
      kitchen: "Veg Kitchen",
      timestamp: "24.02.2026 03:07 AM",
      itemCount: 3,
      status: "ready",
      waiter: "Jayaglyn Bastle",
      table: "Table 3",
      elapsedTime: "25 min",
      items: [
        { id: "1", name: "Veg Manchow Soup", quantity: 3, status: "ready" },
        { id: "2", name: "Medu Vada", quantity: 3, status: "ready" },
        { id: "3", name: "Idli Sambar", quantity: 2, status: "ready" }
      ]
    },
    {
      id: "6",
      kotNumber: "KOT #3",
      orderNumber: "Order #3",
      kitchen: "Veg Kitchen",
      timestamp: "24.02.2026 03:01 AM",
      itemCount: 1,
      status: "pending",
      waiter: "Jayaglyn Bastle",
      table: "Table 8",
      elapsedTime: "3 min",
      items: [
        { id: "1", name: "Naan", quantity: 1, status: "pending" }
      ]
    },
    {
      id: "7",
      kotNumber: "KOT #2",
      orderNumber: "Order #2",
      kitchen: "Veg Kitchen",
      timestamp: "24.02.2026 03:01 AM",
      itemCount: 3,
      status: "pending",
      waiter: "Jayaglyn Bastle",
      table: "Table 2",
      priority: "high",
      elapsedTime: "1 min",
      items: [
        { id: "1", name: "Paneer Tikka", quantity: 3, status: "pending" },
        { id: "2", name: "Medu Vada", quantity: 2, status: "pending" },
        { id: "3", name: "Spring Rolls", quantity: 2, status: "pending" }
      ]
    },
    {
      id: "8",
      kotNumber: "KOT #1",
      orderNumber: "Order #1",
      kitchen: "Veg Kitchen",
      timestamp: "24.02.2026",
      itemCount: 3,
      status: "in-kitchen",
      waiter: "Jayaglyn Bastle",
      table: "Table 1",
      elapsedTime: "15 min",
      items: [
        { id: "1", name: "Spring Rolls", quantity: 1, status: "ready" },
        { id: "2", name: "Medu Vada", quantity: 1, status: "cooking" },
        { id: "3", name: "Naan", quantity: 3, status: "cooking" }
      ]
    }
  ]);

  const updateKOTStatus = (kotId: string, newStatus: "pending" | "in-kitchen" | "ready" | "served" | "cancelled") => {
    setKots(kots.map(kot => 
      kot.id === kotId 
        ? { 
            ...kot, 
            status: newStatus,
            items: kot.items.map(item => ({
              ...item,
              status: newStatus === "in-kitchen" ? "cooking" : newStatus === "ready" ? "ready" : "pending"
            }))
          } 
        : kot
    ));
  };

  const updateItemStatus = (kotId: string, itemId: string, newStatus: "pending" | "cooking" | "ready") => {
    setKots(kots.map(kot => {
      if (kot.id === kotId) {
        const updatedItems = kot.items.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        );
        
        // Check if all items are ready
        const allItemsReady = updatedItems.every(item => item.status === "ready");
        const anyItemCooking = updatedItems.some(item => item.status === "cooking");
        
        // Determine new KOT status based on items
        let newKotStatus = kot.status;
        if (allItemsReady) {
          newKotStatus = "ready";
        } else if (anyItemCooking) {
          newKotStatus = "in-kitchen";
        }
        
        return {
          ...kot,
          items: updatedItems,
          status: newKotStatus
        };
      }
      return kot;
    }));
  };

  const filteredKots = kots.filter(kot => {
    if (statusFilter !== "all" && kot.status !== statusFilter) return false;
    if (kitchenFilter !== "all") {
      if (kitchenFilter === "veg" && !kot.kitchen.toLowerCase().includes("veg")) return false;
      if (kitchenFilter === "non-veg" && !kot.kitchen.toLowerCase().includes("non-veg")) return false;
    }
    return true;
  });

  const statusCounts = {
    pending: kots.filter(k => k.status === "pending").length,
    inKitchen: kots.filter(k => k.status === "in-kitchen").length,
    ready: kots.filter(k => k.status === "ready").length,
    served: kots.filter(k => k.status === "served").length,
    cancelled: kots.filter(k => k.status === "cancelled").length,
  };

  const printKOT = (kot: KOT) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150] // Thermal printer size (80mm width)
    });

    // Parse timestamp to extract date and time
    const timestampParts = kot.timestamp.split(' ');
    const date = timestampParts[0] || '25/02/2026';
    const time = timestampParts.slice(1).join(' ') || '03:01 AM';

    // Set font
    doc.setFont("helvetica");
    
    // Kitchen name
    doc.setFontSize(8);
    doc.text(kot.kitchen, 40, 10, { align: 'center' });
    
    // KOT Number - larger and bold
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(kot.kotNumber, 40, 18, { align: 'center' });
    
    // Dotted line
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('...................................................', 0, 23);
    
    // Order info and Table info
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(kot.orderNumber, 5, 30);
    doc.text(kot.table, 75, 30, { align: 'right' });
    
    // Date and Time
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${date}`, 5, 36);
    doc.text(`Time: ${time}`, 75, 36, { align: 'right' });
    
    // Waiter
    doc.text(`Waiter: ${kot.waiter}`, 5, 41);
    
    // Dotted line
    doc.text('...................................................', 0, 45);
    
    // Items table header
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text('Item Name', 5, 51);
    doc.text('Qty', 72, 51, { align: 'right' });
    
    // Items list
    doc.setFont("helvetica", "normal");
    let yPosition = 57;
    
    kot.items.forEach((item, index) => {
      // Item name
      doc.text(item.name, 5, yPosition);
      // Quantity
      doc.text(item.quantity.toString(), 72, yPosition, { align: 'right' });
      yPosition += 6;
    });

    // Add border around the bill
    doc.setLineWidth(0.3);
    doc.rect(2, 5, 76, yPosition + 5);
    
    // Save/Download the PDF
    doc.save(`${kot.kotNumber.replace('#', '')}.pdf`);
  };

  const renderKOTCard = (kot: KOT) => {
    return (
      <div 
        key={kot.id} 
        className={cn(
          "bg-white dark:bg-gray-900 rounded-lg shadow-sm smooth-transition hover:shadow-md relative overflow-hidden",
          "border-[1.5px]",
          kot.status === "pending" && "border-red-300/60 dark:border-red-500/40",
          kot.status === "in-kitchen" && "border-yellow-400/60 dark:border-yellow-500/40",
          kot.status === "ready" && "border-green-500/60 dark:border-green-500/40",
          kot.status === "served" && "border-green-500/60 dark:border-green-500/40",
          kot.status === "cancelled" && "border-gray-400/40 dark:border-gray-600/40"
        )}
      >
        {/* Card Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-3">
            {/* Left side */}
            <div>
              <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-1">
                {kot.kotNumber}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {kot.itemCount} Item{kot.itemCount > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <ChefHat className="w-3.5 h-3.5" />
                <span>{kot.waiter}</span>
              </div>
            </div>
            
            {/* Right side */}
            <div className="text-right">
              <div className="text-sm font-medium mb-0.5">
                <span className="text-purple-600 dark:text-purple-400">{kot.orderNumber}</span>
                <span className="text-blue-600 dark:text-blue-400 ml-1">({kot.table.replace('Table ', 'T-')})</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {kot.timestamp}
              </div>
              {/* Status Badge */}
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 text-xs font-bold rounded",
                kot.status === "pending" && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700",
                kot.status === "in-kitchen" && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700",
                kot.status === "ready" && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700",
                kot.status === "served" && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
                kot.status === "cancelled" && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700"
              )}>
                {kot.status === "pending" && "PENDING"}
                {kot.status === "in-kitchen" && "IN KITCHEN"}
                {kot.status === "ready" && "FOOD IS READY"}
                {kot.status === "served" && "FOOD IS SERVED"}
                {kot.status === "cancelled" && "CANCELLED"}
              </span>
            </div>
          </div>

          {/* Items Header */}
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Item Name
          </div>

          {/* Items List */}
          <div className="space-y-2 mb-3">
            {kot.items.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-2 flex-1">
                  {kot.status === "in-kitchen" && <span className="text-yellow-500">🍜</span>}
                  <span className="text-sm text-gray-900 dark:text-white">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{item.quantity} ×</span> {item.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {kot.status === "pending" && (
                    <>
                      <button 
                        onClick={() => updateItemStatus(kot.id, item.id, "cooking")}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded smooth-transition whitespace-nowrap"
                      >
                        Start Cooking
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded smooth-transition">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">✎</span>
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded smooth-transition">
                        ×
                      </button>
                    </>
                  )}
                  {kot.status === "in-kitchen" && item.status === "cooking" && (
                    <>
                      <button 
                        onClick={() => updateItemStatus(kot.id, item.id, "ready")}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-medium rounded border border-teal-300 dark:border-teal-700 smooth-transition whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Ready
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded smooth-transition">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">✎</span>
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded smooth-transition">
                        ×
                      </button>
                    </>
                  )}
                  {kot.status === "ready" && (
                    <>
                      <button 
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded border border-blue-300 dark:border-blue-700 cursor-not-allowed opacity-60 whitespace-nowrap"
                        disabled
                      >
                        Start Cooking
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded cursor-not-allowed opacity-60" disabled>
                        <span className="text-gray-400 dark:text-gray-600 text-sm">✎</span>
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-600 rounded cursor-not-allowed opacity-60" disabled>
                        ×
                      </button>
                    </>
                  )}
                  {item.status === "ready" && kot.status === "in-kitchen" && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-4 pb-4 pt-2 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => printKOT(kot)}
            className="w-10 h-10 flex items-center justify-center border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 smooth-transition"
          >
            <Printer className="w-4 h-4" />
          </button>
          
          {kot.status === "pending" && (
            <>
              <button 
                onClick={() => updateKOTStatus(kot.id, "in-kitchen")}
                className="flex-1 h-10 px-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-[11px] font-medium rounded smooth-transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <ChefHat className="w-3.5 h-3.5 flex-shrink-0" />
                Start Cooking
              </button>
              <button 
                onClick={() => updateKOTStatus(kot.id, "cancelled")}
                className="h-10 px-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-[11px] font-medium rounded smooth-transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Cancel
              </button>
            </>
          )}
          
          {kot.status === "in-kitchen" && (
            <>
              <button 
                onClick={() => updateKOTStatus(kot.id, "ready")}
                className="flex-1 h-10 px-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-[11px] font-medium rounded smooth-transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Food is Ready
              </button>
              <button 
                onClick={() => updateKOTStatus(kot.id, "cancelled")}
                className="h-10 px-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-[11px] font-medium rounded smooth-transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Cancel
              </button>
            </>
          )}
          
          {kot.status === "ready" && (
            <>
              <button 
                onClick={() => updateKOTStatus(kot.id, "served")}
                className="flex-1 h-10 px-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-[11px] font-medium rounded smooth-transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Food is Served
              </button>
              <button 
                onClick={() => updateKOTStatus(kot.id, "cancelled")}
                className="h-10 px-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-[11px] font-medium rounded smooth-transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Cancel
              </button>
            </>
          )}
          
          {kot.status === "served" && (
            <div className="flex-1 h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded text-center flex items-center justify-center">
              Order Served
            </div>
          )}
          
          {kot.status === "cancelled" && (
            <div className="flex-1 h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded text-center flex items-center justify-center">
              Order Cancelled
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Kitchen KOT
          </h1>

          {/* Filters Row */}
          <div className="glass-card p-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Kitchen Filter */}
              <div className="relative">
                <select
                  value={kitchenFilter}
                  onChange={(e) => setKitchenFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 smooth-transition"
                >
                  <option value="all">All Kitchens</option>
                  <option value="veg">Veg Kitchen</option>
                  <option value="non-veg">Non-Veg Kitchen</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 smooth-transition"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="custom">Custom Range</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>

              {/* Date Range */}
              {dateFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="w-28 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 smooth-transition"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                    className="w-28 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 smooth-transition"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded smooth-transition",
                statusFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "glass-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              All ({kots.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded smooth-transition",
                statusFilter === "pending"
                  ? "bg-blue-600 text-white"
                  : "glass-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              Pending ({statusCounts.pending})
            </button>
            <button
              onClick={() => setStatusFilter("in-kitchen")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded smooth-transition",
                statusFilter === "in-kitchen"
                  ? "bg-blue-600 text-white"
                  : "glass-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              Cooking ({statusCounts.inKitchen})
            </button>
            <button
              onClick={() => setStatusFilter("ready")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded smooth-transition",
                statusFilter === "ready"
                  ? "bg-green-600 text-white"
                  : "glass-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              Ready ({statusCounts.ready})
            </button>
            <button
              onClick={() => setStatusFilter("served")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded smooth-transition",
                statusFilter === "served"
                  ? "bg-green-600 text-white"
                  : "glass-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              Served ({statusCounts.served})
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded smooth-transition",
                statusFilter === "cancelled"
                  ? "bg-gray-600 text-white"
                  : "glass-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              Cancelled ({statusCounts.cancelled})
            </button>
          </div>
        </div>

        {/* KOT Grid */}
        {filteredKots.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <ChefHat className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredKots.map(renderKOTCard)}
          </div>
        )}
      </div>
    </div>
  );
}