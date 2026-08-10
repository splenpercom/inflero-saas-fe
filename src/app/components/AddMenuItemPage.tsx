import { useState, useRef, useEffect } from "react";
import { Info, DollarSign, Upload, X, ArrowLeft, Leaf, Egg, Fish, Coffee, Plus, Trash2, Circle, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useNavigate } from "react-router";
import { useMenu } from "../contexts/MenuContext";

interface Variation {
  id: string;
  name: string;
  dineInPrice: string;
  pickupPrice: string;
  deliveryPrice: string;
  dineInEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
}

export function AddMenuItemPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    categories,
    menus,
    addMenuItem,
  } = useMenu();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    menuId: "",
    categoryId: "",
    itemType: "veg" as "veg" | "non-veg" | "drink" | "egg" | "halal" | "other",
    preparationTime: "",
    isAvailable: true,
    basePrice: "",
    dineInPrice: "",
    pickupPrice: "",
    deliveryPrice: "",
    hasVariations: false,
    dineInEnabled: false,
    pickupEnabled: false,
    deliveryEnabled: false,
  });

  const [variations, setVariations] = useState<Variation[]>([
    { id: "1", name: "", dineInPrice: "", pickupPrice: "", deliveryPrice: "", dineInEnabled: false, pickupEnabled: false, deliveryEnabled: false },
  ]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Dropdown states
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setIsMenuDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const itemTypes = [
    { id: "veg", name: t.veg, icon: Leaf, color: "text-green-600" },
    { id: "non-veg", name: t.nonVeg, icon: Fish, color: "text-blue-600" },
    { id: "egg", name: t.egg, icon: Egg, color: "text-orange-600" },
    { id: "drink", name: t.drink, icon: Coffee, color: "text-blue-600" },
    { id: "halal", name: t.halal, icon: Leaf, color: "text-emerald-600" },
    { id: "other", name: t.other, icon: Info, color: "text-gray-600" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const addVariation = () => {
    setVariations([...variations, { 
      id: Date.now().toString(), 
      name: "", 
      dineInPrice: "",
      pickupPrice: "",
      deliveryPrice: "",
      dineInEnabled: false,
      pickupEnabled: false,
      deliveryEnabled: false,
    }]);
  };

  const removeVariation = (id: string) => {
    if (variations.length > 1) {
      setVariations(variations.filter((v) => v.id !== id));
    }
  };

  const updateVariation = (id: string, field: "name" | "dineInPrice" | "pickupPrice" | "deliveryPrice" | "dineInEnabled" | "pickupEnabled" | "deliveryEnabled", value: string | boolean) => {
    setVariations(
      variations.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.categoryId) {
      alert("Please fill in all required fields: Item Name and Category");
      return;
    }

    if (formData.hasVariations) {
      const hasInvalidVariations = variations.some(v => !v.name.trim());
      if (hasInvalidVariations) {
        alert("Please fill in all variation names");
        return;
      }
    }

    const newItem = addMenuItem({
      name: formData.name.trim(),
      description: formData.description.trim(),
      categoryId: formData.categoryId,
      price: 0,
      isAvailable: formData.isAvailable,
      isVeg: formData.itemType === "veg",
      modifierGroupIds: [],
      preparationTime: parseInt(formData.preparationTime) || undefined,
      sortOrder: 0,
    });

    alert("Menu item added successfully!");
    navigate("/menus");
  };

  const handleCancel = () => {
    navigate("/menus");
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/menus")}
          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.backToMenus || "Back to Menus"}
        </button>
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.addMenuItem}
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {t.addMenuItemDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Product Information */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-semibold text-sm text-gray-900 dark:text-white">
                {t.productInformation}
              </h2>
            </div>

            <div className="space-y-3">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.itemName} <span className="text-blue-500">{t.requiredField}</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.itemNamePlaceholder}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Item Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.itemDescription}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.itemDescriptionPlaceholder}
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Choose Menu & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.chooseMenu}
                  </label>
                  <div
                    ref={menuDropdownRef}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-[#0026f6] focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-[#0026f6] transition-all"
                    >
                      <span className={formData.menuId ? "" : "text-gray-400"}>
                        {formData.menuId ? menus.find(menu => menu.id === formData.menuId)?.name : "--"}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isMenuDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isMenuDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto py-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <button
                            onClick={() => {
                              setFormData({ ...formData, menuId: "" });
                              setIsMenuDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:bg-[#0026f6]/10 dark:hover:bg-[#0026f6]/20 transition-colors"
                          >
                            --
                          </button>
                          {menus.map((menu) => (
                            <button
                              key={menu.id}
                              onClick={() => {
                                setFormData({ ...formData, menuId: menu.id });
                                setIsMenuDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-all group ${
                                formData.menuId === menu.id
                                  ? "bg-[#0026f6]/10 dark:bg-[#0026f6]/20 text-[#0026f6] font-medium"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-[#0026f6]/10 dark:hover:bg-[#0026f6]/20"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{menu.name}</span>
                                {formData.menuId === menu.id && (
                                  <Check className="w-3 h-3 text-[#0026f6]" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.selectItemCategory} <span className="text-blue-500">{t.requiredField}</span>
                  </label>
                  <div
                    ref={categoryDropdownRef}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-[#0026f6] focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-[#0026f6] transition-all"
                    >
                      <span className={formData.categoryId ? "" : "text-gray-400"}>
                        {formData.categoryId ? categories.find(category => category.id === formData.categoryId)?.name : "--"}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isCategoryDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isCategoryDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <style>{`
                            .max-h-48::-webkit-scrollbar {
                              display: none;
                            }
                          `}</style>
                          <button
                            onClick={() => {
                              setFormData({ ...formData, categoryId: "" });
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:bg-[#0026f6]/10 dark:hover:bg-[#0026f6]/20 transition-colors"
                          >
                            --
                          </button>
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => {
                                setFormData({ ...formData, categoryId: category.id });
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-all group ${
                                formData.categoryId === category.id
                                  ? "bg-[#0026f6]/10 dark:bg-[#0026f6]/20 text-[#0026f6] font-medium"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-[#0026f6]/10 dark:hover:bg-[#0026f6]/20"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{category.name}</span>
                                {formData.categoryId === category.id && (
                                  <Check className="w-3 h-3 text-[#0026f6]" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Item Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.itemType}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {itemTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.itemType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setFormData({ ...formData, itemType: type.id as any })}
                        className={`px-2 py-1.5 text-xs rounded-lg border transition-all flex items-center justify-center gap-1 ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400"
                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Icon className={`w-3 h-3 ${isSelected ? type.color : ""}`} />
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preparation Time & Availability */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.preparationTime}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                      placeholder={t.preparationTimePlaceholder}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.isAvailable}
                  </label>
                  <select 
                    value={formData.isAvailable ? "yes" : "no"} 
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === "yes" })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              {/* Item Image */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.itemImage}
                </label>
                {previewUrl ? (
                  <div className="relative w-full aspect-square max-w-xs mx-auto">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full aspect-square max-w-xs mx-auto px-3 py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 mb-2 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t.chooseFile}
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 px-2">
                      {t.supportedFormats}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Pricing Details */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-orange-100 dark:bg-orange-950 rounded-lg">
                <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="font-semibold text-sm text-gray-900 dark:text-white">
                {t.pricingDetails}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Has Variations */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasVariations: !formData.hasVariations })}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      formData.hasVariations
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {formData.hasVariations && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t.hasVariations}
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.hasVariationsHelp}
                    </p>
                  </div>
                </label>
              </div>

              {!formData.hasVariations ? (
                <>
                  {/* Order Types Pricing */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.orderTypesPricing}
                    </h3>

                    {/* Dine In */}
                    <div className="mb-3">
                      <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, dineInEnabled: !formData.dineInEnabled })}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                            formData.dineInEnabled
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          {formData.dineInEnabled && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {t.dineIn}
                        </span>
                      </label>
                      {formData.dineInEnabled && (
                        <div className="relative ml-5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.dineInPrice}
                            onChange={(e) => setFormData({ ...formData, dineInPrice: e.target.value })}
                            placeholder="0.00"
                            className="w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            ₼
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pickup */}
                    <div className="mb-3">
                      <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, pickupEnabled: !formData.pickupEnabled })}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                            formData.pickupEnabled
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          {formData.pickupEnabled && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {t.pickup}
                        </span>
                      </label>
                      {formData.pickupEnabled && (
                        <div className="relative ml-5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.pickupPrice}
                            onChange={(e) => setFormData({ ...formData, pickupPrice: e.target.value })}
                            placeholder="0.00"
                            className="w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            ₼
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Default Delivery */}
                    <div>
                      <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, deliveryEnabled: !formData.deliveryEnabled })}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                            formData.deliveryEnabled
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          {formData.deliveryEnabled && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {t.defaultDelivery}
                        </span>
                      </label>
                      {formData.deliveryEnabled && (
                        <div className="relative ml-5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.deliveryPrice}
                            onChange={(e) => setFormData({ ...formData, deliveryPrice: e.target.value })}
                            placeholder="0.00"
                            className="w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            ₼
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Variations */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t.variations} <span className="text-blue-500">{t.requiredField}</span>
                      </label>
                      <button
                        onClick={addVariation}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {t.addAnotherVariation}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {variations.map((variation, index) => (
                        <div key={variation.id} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-start gap-2 mb-3">
                            <input
                              type="text"
                              value={variation.name}
                              onChange={(e) => updateVariation(variation.id, "name", e.target.value)}
                              placeholder={`Variation name (e.g., Small, Medium, Large)`}
                              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {variations.length > 1 && (
                              <button
                                onClick={() => removeVariation(variation.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Order Types Pricing */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t.orderTypesPricing}
                            </h4>

                            {/* Dine In */}
                            <div className="mb-2">
                              <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                                <button
                                  type="button"
                                  onClick={() => updateVariation(variation.id, "dineInEnabled", !variation.dineInEnabled)}
                                  className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                                    variation.dineInEnabled
                                      ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                                  }`}
                                >
                                  {variation.dineInEnabled && (
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                  Dine In
                                </span>
                              </label>
                              {variation.dineInEnabled && (
                                <div className="relative ml-5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variation.dineInPrice}
                                    onChange={(e) => updateVariation(variation.id, "dineInPrice", e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    ₼
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Pickup */}
                            <div className="mb-2">
                              <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                                <button
                                  type="button"
                                  onClick={() => updateVariation(variation.id, "pickupEnabled", !variation.pickupEnabled)}
                                  className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                                    variation.pickupEnabled
                                      ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                                  }`}
                                >
                                  {variation.pickupEnabled && (
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                  Pickup
                                </span>
                              </label>
                              {variation.pickupEnabled && (
                                <div className="relative ml-5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variation.pickupPrice}
                                    onChange={(e) => updateVariation(variation.id, "pickupPrice", e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    ₼
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Default Delivery */}
                            <div>
                              <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                                <button
                                  type="button"
                                  onClick={() => updateVariation(variation.id, "deliveryEnabled", !variation.deliveryEnabled)}
                                  className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                                    variation.deliveryEnabled
                                      ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                                  }`}
                                >
                                  {variation.deliveryEnabled && (
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                  Default Delivery
                                </span>
                              </label>
                              {variation.deliveryEnabled && (
                                <div className="relative ml-5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variation.deliveryPrice}
                                    onChange={(e) => updateVariation(variation.id, "deliveryPrice", e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    ₼
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                      Add different variations of this item with their respective prices (e.g., sizes, flavors, etc.)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-6">
        <button
          onClick={handleSave}
          className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}