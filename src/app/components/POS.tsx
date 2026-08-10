import { useState } from "react";
import { Search, Grid3x3, List, ChevronDown, Plus, Minus, Trash2, StickyNote, X, Users, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";
import { PaymentModal } from "./PaymentModal";
import { AssignTableModal } from "./AssignTableModal";
import { MergeTablesModal } from "./MergeTablesModal";
import { OrderTypeModal } from "./OrderTypeModal";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
  note?: string;
  originalPrice?: number;
}

export function POS() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMenu, setSelectedMenu] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAssignTableModal, setShowAssignTableModal] = useState(false);
  const [showMergeTablesModal, setShowMergeTablesModal] = useState(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showResetOrderTypeModal, setShowResetOrderTypeModal] = useState(false);
  const [assignedTable, setAssignedTable] = useState<{ id: string; name: string; area: string } | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [mergedTables, setMergedTables] = useState<string[]>([]);
  const [orderType, setOrderType] = useState<"dine-in" | "delivery" | "pickup">("dine-in");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      id: "4",
      name: "Tandoori Roti",
      price: 25,
      originalPrice: 25,
      image: "https://images.unsplash.com/photo-1653550027228-e3202a24ccc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW5kb29yaSUyMHJvdGklMjBicmVhZHxlbnwxfHx8fDE3NzA4MTg0NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Breads",
      quantity: 1,
    },
    {
      id: "5",
      name: "Naan",
      price: 40,
      image: "https://images.unsplash.com/photo-1697155406014-04dc649b0953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWFuJTIwYnJlYWQlMjBpbmRpYW58ZW58MXx8fHwxNzcwNzkzODc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Breads",
      quantity: 1,
    },
    {
      id: "6",
      name: "Masala Dosa",
      price: 120,
      originalPrice: 120,
      image: "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXNhbGElMjBkb3NhJTIwY3Jpc3B5fGVufDF8fHx8MTc3MDc5MjQ1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Main Course",
      quantity: 1,
    },
  ]);

  // Play sound effect when item is added
  const playAddSound = () => {
    // Create a simple, pleasant beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for the "chi-ching" sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // First tone (higher pitch)
    oscillator1.connect(gainNode);
    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    
    // Second tone (slightly lower, for richness)
    oscillator2.connect(gainNode);
    oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.1);
    
    gainNode.connect(audioContext.destination);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.15);
    oscillator2.stop(audioContext.currentTime + 0.15);
  };

  // Mock data for customers
  const customers = [
    { id: "1", name: "John Smith", phone: "+1234567890" },
    { id: "2", name: "Sarah Johnson", phone: "+1234567891" },
    { id: "3", name: "Mike Davis", phone: "+1234567892" },
    { id: "4", name: "Emily Wilson", phone: "+1234567893" },
    { id: "5", name: "David Brown", phone: "+1234567894" },
    { id: "6", name: "Lisa Anderson", phone: "+1234567895" },
    { id: "7", name: "James Miller", phone: "+1234567896" },
    { id: "8", name: "Jennifer Taylor", phone: "+1234567897" },
  ];

  // Mock data for employees
  const employees = [
    { id: "1", name: "John Smith" },
    { id: "2", name: "Sarah Johnson" },
    { id: "3", name: "Mike Davis" },
    { id: "4", name: "Emily Wilson" },
    { id: "5", name: "David Brown" },
    { id: "6", name: "Lisa Anderson" },
  ];

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.phone.includes(customerSearchQuery)
  );

  // Mock data for menu items with different images
  const menuItems: MenuItem[] = [
    { id: "1", name: "Butter Chicken", price: 320, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzcwNzkyNDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Main Course" },
    { id: "2", name: "Paneer Tikka", price: 250, image: "https://images.unsplash.com/photo-1666001120694-3ebe8fd207be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYW5lZXIlMjB0aWtrYSUyMGluZGlhbnxlbnwxfHx8fDE3NzA3OTI1MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Appetizers" },
    { id: "3", name: "Dal Makhani", price: 180, image: "https://images.unsplash.com/photo-1586981114766-708f09a71e20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYWwlMjBtYWtoYW5pJTIwbGVudGlsc3xlbnwxfHx8fDE3NzA4MTg0NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Main Course" },
    { id: "4", name: "Tandoori Roti", price: 25, image: "https://images.unsplash.com/photo-1653550027228-e3202a24ccc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW5kb29yaSUyMHJvdGklMjBicmVhZHxlbnwxfHx8fDE3NzA4MTg0NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Breads" },
    { id: "5", name: "Naan", price: 40, image: "https://images.unsplash.com/photo-1697155406014-04dc649b0953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWFuJTIwYnJlYWQlMjBpbmRpYW58ZW58MXx8fHwxNzcwNzkzODc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Breads" },
    { id: "6", name: "Masala Dosa", price: 120, image: "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXNhbGElMjBkb3NhJTIwY3Jpc3B5fGVufDF8fHx8MTc3MDc5MjQ1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Main Course" },
    { id: "7", name: "Idli Sambar", price: 90, image: "https://images.unsplash.com/photo-1668236499396-a62d2d1cb0cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpZGxpJTIwc2FtYmFyJTIwc291dGglMjBpbmRpYW58ZW58MXx8fHwxNzcwNzQ2ODA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Breakfast" },
    { id: "8", name: "Medu Vada", price: 80, image: "https://images.unsplash.com/photo-1683533678036-46ec6a0163d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YWRhJTIwc291dGglMjBpbmRpYW4lMjBzbmFja3xlbnwxfHx8fDE3NzA4MTg0NjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Breakfast" },
    { id: "9", name: "Uttapam", price: 130, image: "https://images.unsplash.com/photo-1644289450169-bc58aa16bacb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1dHRhcGFtJTIwaW5kaWFuJTIwYnJlYWtmYXN0fGVufDF8fHx8MTc3MDgxODQ2M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Breakfast" },
    { id: "10", name: "Hyderabadi Chicken Biryani", price: 300, image: "https://images.unsplash.com/photo-1697155406055-2db32d47ca07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlja2VuJTIwYmlyeWFuaSUyMHJpY2V8ZW58MXx8fHwxNzcwNzg4Mzc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Biryani" },
    { id: "11", name: "Chicken Manchurian", price: 260, image: "https://images.unsplash.com/photo-1597577652129-7ffad9d37ad4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlja2VuJTIwbWFuY2h1cmlhbiUyMGluZG8lMjBjaGluZXNlfGVufDF8fHx8MTc3MDgxODQ1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Chinese" },
    { id: "12", name: "Vegetable Hakka Noodles", price: 180, image: "https://images.unsplash.com/photo-1601565960311-8a7f4e1ab709?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWtrYSUyMG5vb2RsZXMlMjB2ZWdldGFibGV8ZW58MXx8fHwxNzcwODE4NDU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Chinese" },
    { id: "13", name: "Chili Paneer", price: 240, image: "https://images.unsplash.com/photo-1650080892550-c3a9a3ed1345?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsaSUyMHBhbmVlciUyMHNwaWN5fGVufDF8fHx8MTc3MDgxODQ1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Chinese" },
    { id: "14", name: "Spring Rolls", price: 150, image: "https://images.unsplash.com/photo-1577859584099-38d38a4aacb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcHJpbmclMjByb2xscyUyMGNyaXNweXxlbnwxfHx8fDE3NzA4MTg0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Chinese" },
    { id: "15", name: "Veg Manchow Soup", price: 120, image: "https://images.unsplash.com/photo-1768703321790-e09a80a46f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5jaG93JTIwc291cCUyMGFzaWFufGVufDF8fHx8MTc3MDgxODQ1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", category: "Soups" },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItemToOrder = (item: MenuItem) => {
    // Check if dine-in and no table assigned
    if (orderType === "dine-in" && !assignedTable) {
      // Show assign table modal instead
      setShowAssignTableModal(true);
      return;
    }
    
    const existingItem = orderItems.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setOrderItems(orderItems.map(orderItem =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }]);
    }
    playAddSound();
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    } else {
      setOrderItems(orderItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = (subtotal: number) => {
    if (discountValue === 0) return 0;
    if (discountType === "percentage") {
      return subtotal * (discountValue / 100);
    }
    return discountValue;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    return subtotal - discount;
  };

  return (
    <div className="fixed inset-0 flex bg-gray-50 dark:bg-gray-950 z-50">
      {/* Left Panel - Menu Items */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800">
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div>
                <h1 className="font-bold text-sm text-gray-900 dark:text-white">Inflero</h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{t.posPage}</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchMenuItem}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset Button */}
            <button 
              onClick={() => setShowResetOrderTypeModal(true)}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {t.reset}
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            {/* Filter by Menu */}
            <div className="relative">
              <select
                value={selectedMenu}
                onChange={(e) => setSelectedMenu(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-7"
                style={{
                  backgroundImage: 'none'
                }}
              >
                <option value="" className="bg-blue-600 text-white font-semibold">{t.filterByMenu}</option>
                <option value="North Indian Delights">North Indian Delights</option>
                <option value="South Indian Sensations">South Indian Sensations</option>
                <option value="Indo-Chinese Fusion">Indo-Chinese Fusion</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter by Category */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-7"
                style={{
                  backgroundImage: 'none'
                }}
              >
                <option value="" className="bg-blue-600 text-white font-semibold">{t.filterByCategory}</option>
                <option value="Starters">Starters (4)</option>
                <option value="Main Course">Main Course (8)</option>
                <option value="Breads">Breads (2)</option>
                <option value="Rice">Rice (1)</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Menu Items Grid - Scrollable without visible scrollbar */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
          <div className={cn(
            "grid gap-3",
            viewMode === "grid" 
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
              : "grid-cols-1"
          )}>
            {filteredMenuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => addItemToOrder(item)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <button className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-900 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Plus className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    {item.price.toFixed(2)} ₼
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Displaying all items text */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            {t.displayingAllItems}
          </div>
        </div>
      </div>

      {/* Right Panel - Order Details */}
      <div className="w-[400px] flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
        {/* Order Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          {/* Order Type and Change */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">{t.orderType}:</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">{t.dineIn}</span>
            </div>
            <button
              onClick={() => setShowOrderTypeModal(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t.change}
            </button>
          </div>

          {/* Customer Selection - Show when items exist */}
          {orderItems.length > 0 && (
            <div className="mb-3">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Users className="w-3.5 h-3.5" />
                {language === "en" ? "Customer" : "Müştəri"}
              </label>
              <div className="relative">
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setCustomerSearchQuery("");
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-7"
                >
                  <option value="">{language === "en" ? "Select Customer" : "Müştəri Seçin"}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Service Employee Selection - Show when customer is selected */}
          {orderItems.length > 0 && selectedCustomer && (
            <div className="mb-3">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <UserCircle2 className="w-3.5 h-3.5" />
                {language === "en" ? "Service Employee" : "Xidmət İşçisi"}
              </label>
              <div className="relative">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-7"
                >
                  <option value="">{language === "en" ? "Select Employee" : "İşçi Seçin"}</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Order Number and Actions */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.orderNumber}11
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAssignTableModal(true)}
                className={cn(
                  "px-2 py-1 text-[10px] font-medium rounded transition-all",
                  assignedTable
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                {assignedTable ? `📍 ${assignedTable.name}` : t.assignTable}
              </button>
              <button
                onClick={() => setShowMergeTablesModal(true)}
                className={cn(
                  "px-2 py-1 text-[10px] font-medium rounded transition-all",
                  mergedTables.length > 0
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md"
                    : "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                {mergedTables.length > 0 ? `🔗 ${mergedTables.length} tables` : t.mergeTables}
              </button>
            </div>
          </div>

          {/* Pax and Waiter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">{t.pax}:</span>
              <input
                type="number"
                defaultValue="1"
                className="w-12 px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Waiter Dropdown */}
            <div className="relative flex-1">
              <select
                value={selectedWaiter}
                onChange={(e) => setSelectedWaiter(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-6"
              >
                <option value="">{t.selectWaiter}</option>
                <option value="John Smith">John Smith</option>
                <option value="Sarah Johnson">Sarah Johnson</option>
                <option value="Mike Davis">Mike Davis</option>
                <option value="Emily Wilson">Emily Wilson</option>
                <option value="David Brown">David Brown</option>
                <option value="Lisa Anderson">Lisa Anderson</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Order Items List - Scrollable without visible scrollbar */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="pb-3 border-b border-gray-200 dark:border-gray-800">
                {/* Item Name and Price */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.originalPrice && item.originalPrice !== item.price && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                          {item.originalPrice.toFixed(2)} ₼
                        </span>
                      )}
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {item.price.toFixed(2)} ₼
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quantity Controls and Note */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                    <Plus className="w-3 h-3" />
                    {t.addNote}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary and Actions */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          {/* Add Discount Button */}
          <button
            onClick={() => setShowDiscountModal(true)}
            className="w-full flex items-center justify-center gap-2 mb-3 px-3 py-2 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5" />
            {discountValue > 0
              ? `${t.discount}: ${discountType === "percentage" ? `${discountValue}%` : `${discountValue.toFixed(2)} ₼`}`
              : t.addDiscount
            }
          </button>

          {/* Summary */}
          <div className="space-y-2 mb-3 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>{orderItems.length} {t.items}</span>
              <span>{orderItems.length}</span>
            </div>
            <div className="flex justify-between text-gray-900 dark:text-white">
              <span>{t.subTotal}</span>
              <span>{calculateSubtotal().toFixed(2)} ₼</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-purple-600 dark:text-purple-400">
                <span>{t.discount} ({discountType === "percentage" ? `${discountValue}%` : `${discountValue.toFixed(2)} ₼`})</span>
                <span>-{calculateDiscount(calculateSubtotal()).toFixed(2)} ₼</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-800">
              <span>{t.total}</span>
              <span>{calculateTotal().toFixed(2)} ₼</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Save as Draft */}
            <button className="w-full py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
              {t.saveAsDraft}
            </button>

            {/* KOT Buttons Row */}
            <div className="grid grid-cols-3 gap-2">
              <button className="h-14 px-1 text-[10px] font-semibold bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center">
                KOT
              </button>
              <button className="h-14 px-1 text-[10px] font-semibold bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center">
                KOT & Print
              </button>
              <button className="h-14 px-1 text-[10px] font-semibold bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center text-center leading-tight">
                KOT, Bill, Print & Payment
              </button>
            </div>

            {/* Bill Buttons Row */}
            <div className="grid grid-cols-3 gap-2">
              <button className="py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                {t.bill}
              </button>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="py-2 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {t.billAndPayment}
              </button>
              <button className="py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                {t.billAndPrint}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderNumber="14"
        totalAmount={calculateTotal()}
      />

      {/* Assign Table Modal */}
      <AssignTableModal
        isOpen={showAssignTableModal}
        onClose={() => setShowAssignTableModal(false)}
        onAssign={(tableId, tableName, areaName) => {
          setAssignedTable({ id: tableId, name: tableName, area: areaName });
        }}
      />

      {/* Merge Tables Modal */}
      <MergeTablesModal
        isOpen={showMergeTablesModal}
        onClose={() => setShowMergeTablesModal(false)}
        currentTableId={assignedTable?.id}
        currentTableName={assignedTable?.name}
        onMerge={(tableIds, tableNames) => {
          setMergedTables(tableNames);
        }}
      />

      {/* Order Type Modal */}
      <OrderTypeModal
        isOpen={showOrderTypeModal}
        onClose={() => setShowOrderTypeModal(false)}
        currentOrderType={orderType}
        onSelectOrderType={(type) => {
          setOrderType(type);
        }}
      />

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === "en" ? "Add Discount" : "Endirim Əlavə Et"}
              </h2>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Discount Type Selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === "en" ? "Discount Type" : "Endirim Növü"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDiscountType("percentage")}
                  className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                    discountType === "percentage"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {language === "en" ? "Percentage (%)" : "Faiz (%)"}
                </button>
                <button
                  onClick={() => setDiscountType("fixed")}
                  className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                    discountType === "fixed"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {language === "en" ? "Fixed Amount (₼)" : "Sabit Məbləğ (₼)"}
                </button>
              </div>
            </div>

            {/* Discount Value Input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === "en" ? "Discount Value" : "Endirim Dəyəri"}
              </label>
              <input
                type="number"
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                step={discountType === "percentage" ? "1" : "0.01"}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={discountType === "percentage" ? "0-100" : "0.00"}
              />
            </div>

            {/* Preview */}
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">{language === "en" ? "Subtotal" : "Ara Cəmi"}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{calculateSubtotal().toFixed(2)} ₼</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-purple-600 dark:text-purple-400">{language === "en" ? "Discount" : "Endirim"}:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">-{calculateDiscount(calculateSubtotal()).toFixed(2)} ₼</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-purple-200 dark:border-purple-700">
                <span className="font-semibold text-gray-900 dark:text-white">{language === "en" ? "New Subtotal" : "Yeni Ara Cəmi"}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{(calculateSubtotal() - calculateDiscount(calculateSubtotal())).toFixed(2)} ₼</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDiscountValue(0);
                  setShowDiscountModal(false);
                }}
                className="flex-1 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {language === "en" ? "Remove Discount" : "Endirimi Sil"}
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="flex-1 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {language === "en" ? "Apply Discount" : "Endirimi Tətbiq Et"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Order Type Modal */}
      {showResetOrderTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === "en" ? "Select Order Type" : "Sifariş Növünü Seçin"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {language === "en" ? "Choose your order type to proceed" : "Davam etmək üçün sifariş növünü seçin"}
                </p>
              </div>
              
              {/* Navigation Links */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowResetOrderTypeModal(false);
                    navigate("/dashboard");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {t.dashboard}
                </button>
                <button
                  onClick={() => {
                    setShowResetOrderTypeModal(false);
                    navigate("/orders");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t.orders}
                </button>
              </div>
            </div>

            {/* Set as Default Checkbox */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {language === "en" ? "Set as default" : "Standart olaraq təyin edin"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {language === "en" ? "Skip this selection next time." : "Növbəti dəfə bu seçimi atlayın."}
                  </div>
                </div>
              </label>
            </div>

            {/* Order Type Options */}
            <div className="grid grid-cols-3 gap-4">
              {/* Delivery */}
              <button
                onClick={() => {
                  setOrderType("delivery");
                  setOrderItems([]);
                  setAssignedTable(null);
                  setSelectedWaiter("");
                  setShowResetOrderTypeModal(false);
                }}
                className="group p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 rounded-xl transition-all hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 transition-colors">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {t.delivery}
                  </div>
                </div>
              </button>

              {/* Dine In */}
              <button
                onClick={() => {
                  setOrderType("dine-in");
                  setOrderItems([]);
                  setAssignedTable(null);
                  setSelectedWaiter("");
                  setShowResetOrderTypeModal(false);
                }}
                className="group p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 rounded-xl transition-all hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 transition-colors">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {t.dineIn}
                  </div>
                </div>
              </button>

              {/* Pickup */}
              <button
                onClick={() => {
                  setOrderType("pickup");
                  setOrderItems([]);
                  setAssignedTable(null);
                  setSelectedWaiter("");
                  setShowResetOrderTypeModal(false);
                }}
                className="group p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 rounded-xl transition-all hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 transition-colors">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {t.pickup}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}