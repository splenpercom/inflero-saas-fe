import { useState, useMemo, useCallback } from "react";
import { ShoppingCart, Clock, UtensilsCrossed, Search, ChevronLeft, ArrowLeft, MapPin, Phone, Sun, Moon, Home, ShoppingBag, User, Mail, PhoneCall, Wifi, Info, Copy, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../i18n/ThemeContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router";

type OrderType = "dineIn" | "delivery" | "pickup";
type Page = "home" | "order" | "book" | "about" | "contact";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  prepTime: string;
  isVeg: boolean;
  image: string;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

// Move static data outside component for better performance
const MENU_CATEGORIES: MenuCategory[] = [
  {
    name: "North Indian Delights",
    items: [
      {
        id: 1,
        name: "Paneer Tikka",
        description: "Grilled cottage cheese marinated in spicy yogurt.",
        price: 250,
        category: "Starters",
        prepTime: "15 Minutes",
        isVeg: true,
        image: "",
      },
      {
        id: 2,
        name: "Chicken Manchurian",
        description: "Crispy chicken in tangy sauce.",
        price: 260,
        category: "Starters",
        prepTime: "20 Minutes",
        isVeg: false,
        image: "",
      },
    ],
  },
  {
    name: "South Indian Sensations",
    items: [
      {
        id: 3,
        name: "Idli Sambar",
        description: "Steamed rice cakes with lentil soup.",
        price: 90,
        category: "Main Course",
        prepTime: "12 Minutes",
        isVeg: true,
        image: "",
      },
      {
        id: 4,
        name: "Medu Vada",
        description: "Crispy lentil fritters with chutney and sambar.",
        price: 60,
        category: "Starters",
        prepTime: "23 Minutes",
        isVeg: true,
        image: "",
      },
    ],
  },
  {
    name: "Indo-Chinese Fusion",
    items: [
      {
        id: 5,
        name: "Spring Rolls",
        description: "Crispy rolls stuffed with a mix of vegetables and...",
        price: 150,
        category: "Starters",
        prepTime: "17 Minutes",
        isVeg: true,
        image: "",
      },
      {
        id: 6,
        name: "Veg Manchow Soup",
        description: "Spicy vegetable soup with crispy fried noodles.",
        price: 120,
        category: "Starters",
        prepTime: "12 Minutes",
        isVeg: true,
        image: "",
      },
    ],
  },
];

const ALL_CATEGORIES = ["Starters", "Main Course", "Breads", "Rice"];

export function CustomerSite() {
  const { t, language, setLanguage } = useLanguage();
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(null);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);

  // Memoized callback for clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  }, []);

  // Memoize menu items calculation
  const allMenuItems = useMemo(() => 
    MENU_CATEGORIES.flatMap((cat) => cat.items),
    []
  );

  // Memoize filtered items
  const filteredItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesVeg = !vegOnly || item.isVeg;
      return matchesSearch && matchesCategory && matchesVeg;
    });
  }, [allMenuItems, searchQuery, selectedCategory, vegOnly]);

  const renderNavbar = () => (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Back to Dashboard Button - Temporary */}
          <button
            onClick={() => navigate("/dashboard")}
            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.backToDashboard}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(to bottom right, ${theme.themeColor}, ${theme.themeColor}dd)` }}
            >
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">Demo Restaurant</h1>
              <div className="flex items-center gap-1 text-xs" style={{ color: theme.themeColor }}>
                <MapPin className="w-3 h-3" />
                <span>Averymouth</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => {
                setCurrentPage("home");
              }}
              className="text-sm font-medium transition-colors"
              style={{ 
                color: currentPage === "home" ? theme.themeColor : undefined
              }}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage("book")}
              className="text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:opacity-80"
              style={{ 
                color: currentPage === "book" ? theme.themeColor : undefined
              }}
            >
              Book a Table
            </button>
            <button
              onClick={() => setCurrentPage("about")}
              className="text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:opacity-80"
              style={{ 
                color: currentPage === "about" ? theme.themeColor : undefined
              }}
            >
              About
            </button>
            <button
              onClick={() => setCurrentPage("contact")}
              className="text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:opacity-80"
              style={{ 
                color: currentPage === "contact" ? theme.themeColor : undefined
              }}
            >
              Contact
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button 
              className="px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: theme.themeColor }}
            >
              <Phone className="w-4 h-4" />
              Call Waiter
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderOrderTypeModal = () => {
    if (!showOrderTypeModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Select Order Type
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 text-center">
            Choose your order type to proceed
          </p>

          <div className="grid grid-cols-3 gap-4">
            {/* Dine In */}
            <button
              onClick={() => {
                setSelectedOrderType("dineIn");
                setShowOrderTypeModal(false);
                setCurrentPage("order");
              }}
              className="group relative p-6 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:opacity-90 transition-all"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-colors">
                  <Home className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Dine In</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Enjoy your meal at our restaurant</p>
                </div>
              </div>
            </button>

            {/* Delivery - Selected State */}
            <button
              onClick={() => {
                setSelectedOrderType("delivery");
                setShowOrderTypeModal(false);
                setCurrentPage("order");
              }}
              className="group relative p-6 border-2 rounded-xl transition-all"
              style={{ 
                borderColor: theme.themeColor,
                backgroundColor: `${theme.themeColor}10`
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.themeColor }}
                >
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Delivery</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Get it delivered to your doorstep</p>
                </div>
              </div>
            </button>

            {/* Pickup */}
            <button
              onClick={() => {
                setSelectedOrderType("pickup");
                setShowOrderTypeModal(false);
                setCurrentPage("order");
              }}
              className="group relative p-6 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:opacity-90 transition-all"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-colors">
                  <ShoppingBag className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Pickup</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Order ahead and pick up later</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-100 dark:from-gray-950 dark:via-blue-950/10 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section with Glass Effect */}
        <div className="glass-card p-12 mb-8 border border-white/30 dark:border-white/10 shadow-glass-lg smooth-transition relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <div className="relative z-10">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Ready to Satisfy Your Cravings? 🍽️
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto mb-8">
              Explore our delicious menu and enjoy fresh, quality meals prepared with love.
            </p>
            <div className="text-center">
              <button
                onClick={() => setShowOrderTypeModal(true)}
                className="px-10 py-4 text-white rounded-xl text-lg font-bold smooth-transition hover:scale-105 shadow-lg"
                style={{ 
                  background: `linear-gradient(to right, ${theme.themeColor}, ${theme.themeColor}dd)`, 
                  boxShadow: `0 10px 40px ${theme.themeColor}40`
                }}
              >
                Start Your Order
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* WiFi Password Section */}
          <div className="glass-card glass-hover p-8 border border-white/30 dark:border-white/10 shadow-glass-lg smooth-transition">
            <div className="flex items-start gap-4 mb-6">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(to br, ${theme.themeColor}, ${theme.themeColor}dd)`, 
                  boxShadow: `0 8px 24px ${theme.themeColor}30`
                }}
              >
                <Wifi className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Free WiFi
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect to our complimentary high-speed internet
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="glass p-4 rounded-xl border border-white/20 dark:border-white/10">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Network Name</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Demo_Restaurant_WiFi</p>
              </div>
              <div className="glass p-4 rounded-xl border border-white/20 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Password</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Welcome2024!</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard("Welcome2024!")}
                    className="ml-4 p-3 glass-hover rounded-xl border border-white/20 dark:border-white/10 smooth-transition hover:scale-110"
                    style={{ color: theme.themeColor }}
                  >
                    {copiedWifi ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Details Section */}
          <div className="glass-card glass-hover p-8 border border-white/30 dark:border-white/10 shadow-glass-lg smooth-transition">
            <div className="flex items-start gap-4 mb-6">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(to br, ${theme.themeColor}, ${theme.themeColor}dd)`, 
                  boxShadow: `0 8px 24px ${theme.themeColor}30`
                }}
              >
                <Info className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Restaurant Info
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Everything you need to know about us
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="glass p-4 rounded-xl border border-white/20 dark:border-white/10 flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5" style={{ color: theme.themeColor }} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Opening Hours</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Mon - Fri: 8:00 AM - 11:00 PM</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Sat - Sun: 9:00 AM - 12:00 AM</p>
                </div>
              </div>
              <div className="glass p-4 rounded-xl border border-white/20 dark:border-white/10 flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5" style={{ color: theme.themeColor }} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Contact</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">+1 (757) 447-8051</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">demo.restaurant@example.com</p>
                </div>
              </div>
              <div className="glass p-4 rounded-xl border border-white/20 dark:border-white/10 flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5" style={{ color: theme.themeColor }} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Location</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">220 Jacobs Island Suite 883</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Crystelfurt, DE 56184-5019</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card glass-hover p-6 border border-white/30 dark:border-white/10 shadow-glass smooth-transition text-center">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
              style={{ 
                background: `linear-gradient(to br, #10b981, #059669)`, 
                boxShadow: `0 8px 24px #10b98130`
              }}
            >
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Fresh Ingredients</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We use only the freshest, locally-sourced ingredients in all our dishes
            </p>
          </div>
          <div className="glass-card glass-hover p-6 border border-white/30 dark:border-white/10 shadow-glass smooth-transition text-center">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
              style={{ 
                background: `linear-gradient(to br, #f59e0b, #d97706)`, 
                boxShadow: `0 8px 24px #f59e0b30`
              }}
            >
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Fast Delivery</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quick preparation and delivery times to get your food fresh and hot
            </p>
          </div>
          <div className="glass-card glass-hover p-6 border border-white/30 dark:border-white/10 shadow-glass smooth-transition text-center">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
              style={{ 
                background: `linear-gradient(to br, #ef4444, #dc2626)`, 
                boxShadow: `0 8px 24px #ef444430`
              }}
            >
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">24/7 Support</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Our friendly staff is always available to assist you with your orders
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrderPage = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div 
          className="rounded-2xl p-8 mb-8"
          style={{ 
            background: `linear-gradient(to right, ${theme.themeColor}15, ${theme.themeColor}25)`
          }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Ready to Satisfy Your Cravings? Place Your Order Now!
          </h1>
        </div>

        {/* Menu Categories */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {MENU_CATEGORIES.map((cat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-5 h-5" style={{ color: theme.themeColor }} />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{cat.items.length} Item(s)</p>
            </div>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            style={selectedCategory === "all" ? {
              backgroundColor: theme.themeColor,
              color: 'white'
            } : {}}
          >
            Show All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
              style={selectedCategory === cat ? {
                backgroundColor: theme.themeColor,
                color: 'white',
                borderColor: theme.themeColor
              } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search your menu item here"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              '--tw-ring-color': theme.themeColor 
            } as React.CSSProperties}
          />
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className={`w-4 h-4 rounded ${vegOnly ? "bg-green-600" : "bg-gray-300 dark:bg-gray-700"}`} />
            <span>Veg</span>
          </button>
        </div>

        {/* Menu Items Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {selectedCategory === "all" ? "All Items" : selectedCategory}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-40 bg-gray-200 dark:bg-gray-800">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    {item.isVeg ? (
                      <div className="w-5 h-5 border-2 border-green-600 rounded flex items-center justify-center bg-white">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-red-600 rounded flex items-center justify-center bg-white">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Preparation Time : {item.prepTime}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{item.price.toFixed(2)}₼</span>
                    <button 
                      className="px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                      style={{ backgroundColor: theme.themeColor }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookTablePage = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div 
          className="rounded-2xl p-12 mb-8"
          style={{ 
            background: `linear-gradient(to right, ${theme.themeColor}15, ${theme.themeColor}25)`
          }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Book a Table and Savor the Experience.
          </h1>
        </div>

        {/* Booking Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Select your booking details</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="12/02/2026"
              className="px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                '--tw-ring-color': theme.themeColor 
              } as React.CSSProperties}
            />
            <select 
              className="px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                '--tw-ring-color': theme.themeColor 
              } as React.CSSProperties}
            >
              <option>1 Guests</option>
              <option>2 Guests</option>
              <option>3 Guests</option>
              <option>4 Guests</option>
            </select>
            <select 
              className="px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                '--tw-ring-color': theme.themeColor 
              } as React.CSSProperties}
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
            </select>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Select Time Slot</h3>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {["08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"].map((time) => (
                <button
                  key={time}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    '--hover-bg': `${theme.themeColor}20`
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.themeColor}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.classList.contains('dark') 
                      ? e.currentTarget.style.backgroundColor = '' 
                      : e.currentTarget.style.backgroundColor = '';
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Any special request?</label>
            <textarea
              rows={4}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{ 
                '--tw-ring-color': theme.themeColor 
              } as React.CSSProperties}
              placeholder="Enter your special requests here..."
            />
          </div>

          <button 
            className="w-full px-6 py-3 text-white rounded-lg text-base font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.themeColor }}
          >
            <User className="w-5 h-5" />
            Login to make reservation
          </button>
        </div>
      </div>
    </div>
  );

  const renderAboutPage = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-8">About Us</h1>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="space-y-6 text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            <p>
              Welcome to our restaurant, where great food and good vibes come together! We're a local, family-owned spot that loves bringing people together over delicious meals and unforgettable moments. Whether you're here for a quick bite, a family dinner, or a celebration, we're all about making your time with us special.
            </p>

            <p>
              Our menu is packed with dishes made from fresh, quality ingredients because we believe food should taste as good as it makes you feel. From our signature dishes to seasonal specials, there's always something to excite your taste buds.
            </p>

            <p>
              But we're not just about the food—we're about community. We love seeing familiar faces and welcoming new ones. Our team is a fun, friendly bunch dedicated to serving you with a smile and making sure every visit feels like coming home.
            </p>

            <p>
              So, come on in, grab a seat, and let us take care of the rest. We can't wait to share our love of food with you!
            </p>

            <p className="text-center font-semibold text-lg">
              See you soon! 🍴✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactPage = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-12">Contact</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.themeColor}20` }}
              >
                <MapPin className="w-6 h-6" style={{ color: theme.themeColor }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Our address</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  220 Jacobs Island Suite 883<br />Crystelfurt, DE 56184-5019
                </p>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.themeColor}20` }}
              >
                <Mail className="w-6 h-6" style={{ color: theme.themeColor }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Our Email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">demo.restaurant@example.com</p>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 md:col-span-2">
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.themeColor}20` }}
              >
                <PhoneCall className="w-6 h-6" style={{ color: theme.themeColor }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Call Us</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">+17574478051</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {renderNavbar()}
        {currentPage === "home" && renderHomePage()}
        {currentPage === "order" && renderOrderPage()}
        {currentPage === "book" && renderBookTablePage()}
        {currentPage === "about" && renderAboutPage()}
        {currentPage === "contact" && renderContactPage()}
        {renderOrderTypeModal()}
      </div>
    </div>
  );
}