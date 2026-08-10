import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../i18n/ThemeContext";
import { useConfirm } from "../context/ConfirmContext";
import { FileText, Clock, Plus, Trash2, Info, Printer, Globe, Copy, X, Monitor, Download, Apple, Edit2 } from "lucide-react";

type SettingsTab =
  | "general"
  | "app"
  | "operationalShifts"
  | "branch"
  | "currencies"
  | "email"
  | "taxes"
  | "payment"
  | "theme"
  | "roles"
  | "billing"
  | "reservation"
  | "aboutUs"
  | "customerSite"
  | "receipt"
  | "printer"
  | "delivery"
  | "kot"
  | "cancellationReasons"
  | "refundReasons"
  | "order"
  | "kiosk";

export function Settings() {
  const { t } = useLanguage();
  const theme = useTheme();
  const askConfirm = useConfirm();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [restaurantName, setRestaurantName] = useState("Demo Restaurant");
  const [phoneCountry, setPhoneCountry] = useState("select");
  const [phoneNumber, setPhoneNumber] = useState("1234274842");
  const [email, setEmail] = useState("demo.restaurant@example.com");
  const [address, setAddress] = useState(
    "351 Kuhe Turnpike Apt. 051\nLake Ludwigchester, MA 96560-2524"
  );
  const [showTaxIdOnOrders, setShowTaxIdOnOrders] = useState(false);
  const [taxEntries, setTaxEntries] = useState<Array<{ taxName: string; taxId: string }>>([
    { taxName: "", taxId: "" }
  ]);
  const [presetAmounts] = useState([50.0, 100.0, 500.0, 1000.0]);
  
  // App Tab States
  const [country, setCountry] = useState("United States");
  const [timeFormat, setTimeFormat] = useState("12 Hour (10:32 AM)");
  const [dateFormat, setDateFormat] = useState("d/m/Y");
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [currency, setCurrency] = useState("Dollars (USD)");
  const [customerSiteLanguage, setCustomerSiteLanguage] = useState("English (English)");
  const [hideTodaysOrders, setHideTodaysOrders] = useState(false);
  const [hideNewReservation, setHideNewReservation] = useState(false);
  const [hideNewWaiterRequest, setHideNewWaiterRequest] = useState(false);

  // Operational Shifts Tab States
  const [selectedBranchForShifts, setSelectedBranchForShifts] = useState("Georgianafort");

  // Branch Tab States
  const [branches, setBranches] = useState([
    {
      id: 1,
      name: "Georgianafort",
      address: "1159 Kassulke Villages Suite 268 Port Damonton, VT 64309",
      isCurrent: true,
    },
    {
      id: 2,
      name: "Moscickside",
      address: "444 McGlynn Junctions Starkheaven, MI 06751-8177",
      isCurrent: false,
    },
  ]);

  const handleDeleteBranch = (id: number) => {
    setBranches(branches.filter((branch) => branch.id !== id));
  };

  // Currencies Tab States
  const [currencies, setCurrencies] = useState([
    {
      id: 1,
      name: "Manat",
      symbol: "AZN (₼)",
      isDefault: true,
    },
    {
      id: 2,
      name: "Dollars",
      symbol: "USD ($)",
      isDefault: false,
    },
    {
      id: 3,
      name: "Euros",
      symbol: "EUR (€)",
      isDefault: false,
    },
    {
      id: 4,
      name: "Pounds",
      symbol: "GBP (£)",
      isDefault: false,
    },
  ]);

  const handleDeleteCurrency = (id: number) => {
    setCurrencies(currencies.filter((curr) => curr.id !== id));
  };

  const formatCurrency = (amount: number, symbol: string) => {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    // Extract symbol only (e.g., "₼" from "AZN (₼)")
    const symbolOnly = symbol.match(/\((.+)\)/)?.[1] || symbol;
    return `${formatted} ${symbolOnly}`;
  };

  // Email Tab States
  const [emailNewOrder, setEmailNewOrder] = useState(true);
  const [emailReservationConfirmation, setEmailReservationConfirmation] = useState(true);
  const [emailNewReservation, setEmailNewReservation] = useState(true);
  const [emailOrderBill, setEmailOrderBill] = useState(true);
  const [emailStaffWelcome, setEmailStaffWelcome] = useState(true);

  // Taxes Tab States
  const [taxSubTab, setTaxSubTab] = useState<"settings" | "list">("settings");
  const [taxMode, setTaxMode] = useState<"order" | "item">("order");
  const [taxCalculationBase, setTaxCalculationBase] = useState<"include" | "exclude">("exclude");
  const [taxes, setTaxes] = useState([
    { id: 1, name: "SGST", percent: 2.5 },
    { id: 2, name: "CGST", percent: 2.5 },
  ]);

  const handleDeleteTax = (id: number) => {
    setTaxes(taxes.filter((tax) => tax.id !== id));
  };

  // Theme Tab States - Using context
  const themeColors = {
    restaurant: ["#dc2626", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#14b8a6", "#3b82f6", "#8b5cf6"],
    fresh: ["#a7f3d0", "#fef08a", "#fed7aa", "#bae6fd", "#a5b4fc", "#f9a8d4", "#ddd6fe", "#c7d2fe"],
    warm: ["#fb923c", "#ec4899", "#d946ef", "#fbbf24", "#facc15", "#06b6d4", "#0891b2", "#7c3aed"],
  };

  // File upload handlers
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        theme.setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Roles Tab States
  const [showManageRoleModal, setShowManageRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [copyFromRole, setCopyFromRole] = useState("");
  const [roles, setRoles] = useState([
    { id: 1, name: "Branch Head", isDefault: true },
    { id: 2, name: "Waiter", isDefault: true },
    { id: 3, name: "Chef", isDefault: true },
  ]);
  
  // Permission states for each role and permission combination
  type PermissionState = "granted" | "denied" | "neutral";
  const [permissions, setPermissions] = useState<{ [roleId: number]: { [permission: string]: PermissionState } }>({
    1: {}, // Branch Head - will have all permissions granted
    2: {}, // Waiter
    3: {}, // Chef
  });

  const permissionCategories = [
    {
      category: t.settingsPage.menu,
      permissions: [
        t.settingsPage.createMenu,
        t.settingsPage.showMenu,
        t.settingsPage.updateMenu,
        t.settingsPage.deleteMenu,
      ],
    },
    {
      category: t.settingsPage.menuItem,
      permissions: [
        t.settingsPage.createMenuItem,
        t.settingsPage.showMenuItem,
        t.settingsPage.updateMenuItem,
        t.settingsPage.deleteMenuItem,
      ],
    },
    {
      category: t.settingsPage.itemCategory,
      permissions: [
        t.settingsPage.createItemCategory,
        t.settingsPage.showItemCategory,
        t.settingsPage.updateItemCategory,
        t.settingsPage.deleteItemCategory,
      ],
    },
    {
      category: t.settingsPage.area,
      permissions: [
        t.settingsPage.createArea,
        t.settingsPage.showArea,
        t.settingsPage.updateArea,
        t.settingsPage.deleteArea,
      ],
    },
    {
      category: t.settingsPage.table,
      permissions: [
        t.settingsPage.createTable,
        t.settingsPage.showTable,
        t.settingsPage.updateTable,
        t.settingsPage.deleteTable,
      ],
    },
    {
      category: t.settingsPage.reservationPerm,
      permissions: [
        t.settingsPage.createReservation,
        t.settingsPage.showReservation,
        t.settingsPage.updateReservation,
        t.settingsPage.deleteReservation,
      ],
    },
    {
      category: t.settingsPage.kotPerm,
      permissions: [t.settingsPage.manageKOT],
    },
    {
      category: t.settingsPage.orderPerm,
      permissions: [
        t.settingsPage.createOrder,
        t.settingsPage.showOrder,
        t.settingsPage.updateOrder,
        t.settingsPage.deleteOrder,
        t.settingsPage.addDiscountOnPOS,
      ],
    },
    {
      category: t.settingsPage.customer,
      permissions: [
        t.settingsPage.createCustomer,
        t.settingsPage.showCustomer,
        t.settingsPage.updateCustomer,
        t.settingsPage.deleteCustomer,
      ],
    },
    {
      category: t.settingsPage.staff,
      permissions: [
        t.settingsPage.createStaffMember,
        t.settingsPage.showStaffMember,
        t.settingsPage.updateStaffMember,
        t.settingsPage.deleteStaffMember,
      ],
    },
    {
      category: t.settingsPage.paymentPerm,
      permissions: [t.settingsPage.showPayments],
    },
    {
      category: t.settingsPage.report,
      permissions: [t.settingsPage.showReports],
    },
    {
      category: t.settingsPage.settings,
      permissions: [t.settingsPage.manageSettings],
    },
    {
      category: t.settingsPage.deliveryExecutive,
      permissions: [
        t.settingsPage.createDeliveryExecutive,
        t.settingsPage.showDeliveryExecutive,
        t.settingsPage.updateDeliveryExecutive,
        t.settingsPage.deleteDeliveryExecutive,
      ],
    },
    {
      category: t.settingsPage.waiterRequest,
      permissions: [t.settingsPage.manageWaiterRequest],
    },
    {
      category: t.settingsPage.expenses,
      permissions: [
        t.settingsPage.createExpenses,
        t.settingsPage.showExpenses,
        t.settingsPage.updateExpenses,
        t.settingsPage.deleteExpenses,
        t.settingsPage.createExpenseCategory,
        t.settingsPage.showExpenseCategory,
        t.settingsPage.updateExpenseCategory,
        t.settingsPage.deleteExpenseCategory,
      ],
    },
  ];

  const togglePermission = (roleId: number, permission: string) => {
    setPermissions((prev) => {
      const current = prev[roleId]?.[permission] || "neutral";
      const next = current === "denied" ? "granted" : current === "granted" ? "neutral" : "denied";
      return {
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [permission]: next,
        },
      };
    });
  };

  const handleCreateRole = () => {
    if (newRoleName.trim()) {
      const newRole = {
        id: roles.length + 1,
        name: newRoleName,
        isDefault: false,
      };
      setRoles([...roles, newRole]);
      setNewRoleName("");
      setCopyFromRole("");
      setShowManageRoleModal(false);
    }
  };

  const handleDeleteRole = (id: number) => {
    setRoles(roles.filter((role) => role.id !== id));
  };

  // Billing Tab States
  const [billingSubTab, setBillingSubTab] = useState<"planDetails" | "purchaseHistory" | "offlineRequest">("planDetails");
  const [purchaseHistory] = useState([
    {
      id: 1,
      package: "Premium Plan",
      billingCycle: "Monthly",
      paymentDate: "15 Jan, 2026",
      nextPaymentDate: "15 Feb, 2026",
      transactionId: "TXN-12345678",
      paymentGateway: "Stripe",
      amount: 199.00,
      packageDetails: "Premium Plan - Full Access",
    },
    {
      id: 2,
      package: "Basic Plan",
      billingCycle: "Monthly",
      paymentDate: "15 Dec, 2025",
      nextPaymentDate: "15 Jan, 2026",
      transactionId: "TXN-12345677",
      paymentGateway: "PayPal",
      amount: 99.00,
      packageDetails: "Basic Plan - Limited Access",
    },
  ]);

  // Reservation Tab States
  const [enableAdminReservations, setEnableAdminReservations] = useState(true);
  const [enableCustomerReservations, setEnableCustomerReservations] = useState(true);
  const [minimumPartySize, setMinimumPartySize] = useState(1);
  const [disableSlotMinutes, setDisableSlotMinutes] = useState(30);
  const [selectedDay, setSelectedDay] = useState<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday">("monday");
  
  // About Us Tab State
  const [aboutUsContent, setAboutUsContent] = useState(
    "Welcome to our restaurant, where great food and good vibes come together! We're a local, family-owned spot that loves bringing people together over delicious meals and unforgettable moments. Whether you're here for a quick bite, a family dinner, or a celebration, we're all about making your time with us special.\n\n" +
    "Our menu is packed with dishes made from fresh, quality ingredients because we believe food should taste as good as it makes you feel. From our signature dishes to seasonal specials, there's always something to excite your taste buds.\n\n" +
    "But we're not just about the food—we're about community. We love seeing familiar faces and welcoming new ones. Our team is a fun, friendly bunch dedicated to serving you with a smile and making sure every visit feels like coming home.\n\n" +
    "So, come on in, grab a seat, and let us take care of the rest. We can't wait to share our love of food with you!\n\n" +
    "See you soon! 🍴✨"
  );
  
  type TimeSlot = {
    id: number;
    type: string;
    startTime: string;
    endTime: string;
    slotDifference: number;
    available: boolean;
  };

  type DaySchedule = {
    [key: string]: TimeSlot[];
  };

  const [timeSlots, setTimeSlots] = useState<DaySchedule>({
    monday: [
      { id: 1, type: "Breakfast", startTime: "8:00 AM", endTime: "11:00 AM", slotDifference: 30, available: true },
      { id: 2, type: "Lunch", startTime: "12:00 PM", endTime: "5:00 PM", slotDifference: 60, available: true },
      { id: 3, type: "Dinner", startTime: "6:00 PM", endTime: "10:00 PM", slotDifference: 60, available: true },
    ],
    tuesday: [
      { id: 1, type: "Breakfast", startTime: "8:00 AM", endTime: "11:00 AM", slotDifference: 30, available: true },
      { id: 2, type: "Lunch", startTime: "12:00 PM", endTime: "5:00 PM", slotDifference: 60, available: true },
      { id: 3, type: "Dinner", startTime: "6:00 PM", endTime: "10:00 PM", slotDifference: 60, available: true },
    ],
    wednesday: [
      { id: 1, type: "Breakfast", startTime: "8:00 AM", endTime: "11:00 AM", slotDifference: 30, available: true },
      { id: 2, type: "Lunch", startTime: "12:00 PM", endTime: "5:00 PM", slotDifference: 60, available: true },
      { id: 3, type: "Dinner", startTime: "6:00 PM", endTime: "10:00 PM", slotDifference: 60, available: true },
    ],
    thursday: [
      { id: 1, type: "Breakfast", startTime: "8:00 AM", endTime: "11:00 AM", slotDifference: 30, available: true },
      { id: 2, type: "Lunch", startTime: "12:00 PM", endTime: "5:00 PM", slotDifference: 60, available: true },
      { id: 3, type: "Dinner", startTime: "6:00 PM", endTime: "10:00 PM", slotDifference: 60, available: true },
    ],
    friday: [
      { id: 1, type: "Breakfast", startTime: "8:00 AM", endTime: "11:00 AM", slotDifference: 30, available: true },
      { id: 2, type: "Lunch", startTime: "12:00 PM", endTime: "5:00 PM", slotDifference: 60, available: true },
      { id: 3, type: "Dinner", startTime: "6:00 PM", endTime: "10:00 PM", slotDifference: 60, available: true },
    ],
    saturday: [
      { id: 1, type: "Breakfast", startTime: "8:00 AM", endTime: "11:00 AM", slotDifference: 30, available: true },
      { id: 2, type: "Lunch", startTime: "12:00 PM", endTime: "5:00 PM", slotDifference: 60, available: true },
      { id: 3, type: "Dinner", startTime: "6:00 PM", endTime: "10:00 PM", slotDifference: 60, available: true },
    ],
    sunday: [
      { id: 1, type: "Breakfast", startTime: "8:00 AM", endTime: "11:00 AM", slotDifference: 30, available: true },
      { id: 2, type: "Lunch", startTime: "12:00 PM", endTime: "5:00 PM", slotDifference: 60, available: true },
      { id: 3, type: "Dinner", startTime: "6:00 PM", endTime: "10:00 PM", slotDifference: 60, available: true },
    ],
  });

  const handleTimeSlotAvailability = (day: string, slotId: number) => {
    setTimeSlots({
      ...timeSlots,
      [day]: timeSlots[day].map((slot) =>
        slot.id === slotId ? { ...slot, available: !slot.available } : slot
      ),
    });
  };

  const handleTimeSlotChange = (day: string, slotId: number, field: 'startTime' | 'endTime' | 'slotDifference', value: string | number) => {
    setTimeSlots({
      ...timeSlots,
      [day]: timeSlots[day].map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      ),
    });
  };

  // Customer Site Tab States
  const [customerSiteSubTab, setCustomerSiteSubTab] = useState<"customerSite" | "customizeHeader">("customerSite");
  const [allowCustomerOrders, setAllowCustomerOrders] = useState(true);
  const [customerLoginRequired, setCustomerLoginRequired] = useState(false);
  const [allowQROrders, setAllowQROrders] = useState(false);
  const [pickupDaysRange, setPickupDaysRange] = useState(7);
  const [enableTipCustomerSite, setEnableTipCustomerSite] = useState(true);
  const [enableTipPOS, setEnableTipPOS] = useState(false);
  const [autoConfirmOrderStatus, setAutoConfirmOrderStatus] = useState(false);
  const [showVeg, setShowVeg] = useState(false);
  const [showHalal, setShowHalal] = useState(false);
  const [enableWaiterRequest, setEnableWaiterRequest] = useState(true);
  const [enableWaiterRequestMobile, setEnableWaiterRequestMobile] = useState(true);
  const [enableWaiterRequestDesktop, setEnableWaiterRequestDesktop] = useState(false);
  const [onlyWhenOpenViaQR, setOnlyWhenOpenViaQR] = useState(false);
  const [tableRequiredForDineIn, setTableRequiredForDineIn] = useState(false);
  const [defaultTableReservationStatus, setDefaultTableReservationStatus] = useState("Confirmed");
  const [enablePWA, setEnablePWA] = useState(false);
  const [tableLockTimeout, setTableLockTimeout] = useState(10);
  const [facebookLink, setFacebookLink] = useState("https://www.facebook.com/");
  const [instagramLink, setInstagramLink] = useState("https://www.instagram.com/");
  const [twitterLink, setTwitterLink] = useState("https://www.twitter.com/");
  const [yelpLink, setYelpLink] = useState("");
  const [metaKeyword, setMetaKeyword] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [showWiFiIcon, setShowWiFiIcon] = useState(false);
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  // Receipt Tab States
  const [showCustomerName, setShowCustomerName] = useState(true);
  const [showCustomerAddress, setShowCustomerAddress] = useState(false);
  const [showCustomerPhone, setShowCustomerPhone] = useState(false);
  const [showTableNo, setShowTableNo] = useState(true);
  const [showWaiterName, setShowWaiterName] = useState(false);
  const [showTotalGuest, setShowTotalGuest] = useState(false);
  const [showOrderType, setShowOrderType] = useState(true);
  const [showRestaurantLogo, setShowRestaurantLogo] = useState(true);
  const [showRestaurantTax, setShowRestaurantTax] = useState(true);
  const [paymentQRCode, setPaymentQRCode] = useState<string | null>(null);
  const [showPaymentQRCode, setShowPaymentQRCode] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);

  // Printer Settings
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [printerName, setPrinterName] = useState("");
  const [printingChoice, setPrintingChoice] = useState("Browser Popup Print");
  const [selectedKitchens, setSelectedKitchens] = useState<string[]>([]);
  const [selectedPosTerminals, setSelectedPosTerminals] = useState<string[]>([]);
  const [isDefaultPrinter, setIsDefaultPrinter] = useState(false);
  const [domainURL, setDomainURL] = useState("https://tabletrack.froid.works");
  const [apiKey, setAPIKey] = useState("••••••••••••••••");

  // Delivery Settings
  const [feeCalculationMethod, setFeeCalculationMethod] = useState("Fixed Rate");
  const [distanceUnit, setDistanceUnit] = useState("Kilometers (km)");
  const [maximumDeliveryRadius, setMaximumDeliveryRadius] = useState("5");
  const [fixedFee, setFixedFee] = useState("0.00");
  const [freeDeliveryOverAmount, setFreeDeliveryOverAmount] = useState("0.00");
  const [freeDeliveryWithinRadius, setFreeDeliveryWithinRadius] = useState("0.00");
  const [deliveryHomeTime, setDeliveryHomeTime] = useState("10:58 AM");
  const [deliveryCloseTime, setDeliveryCloseTime] = useState("10:58 AM");
  const [averageSpeed, setAverageSpeed] = useState("30");
  const [additionalTimeBuffer, setAdditionalTimeBuffer] = useState("0");

  // KOT Settings
  const [enableItemLevelStatus, setEnableItemLevelStatus] = useState(true);
  const [posPendingStatus, setPosPendingStatus] = useState(true);
  const [posCookingStatus, setPosCookingStatus] = useState(false);
  const [customerPendingStatus, setCustomerPendingStatus] = useState(true);
  const [customerCookingStatus, setCustomerCookingStatus] = useState(false);

  // Cancellation Reasons Settings
  interface CancellationReason {
    id: number;
    reason: string;
    types: ("order" | "kot")[];
    isDefault?: boolean;
  }

  const [cancellationReasons, setCancellationReasons] = useState<CancellationReason[]>([
    { id: 1, reason: t.settingsPage.restaurantClosingEarly, types: ["order", "kot"] },
    { id: 2, reason: t.settingsPage.other, types: ["order", "kot"], isDefault: true },
    { id: 3, reason: t.settingsPage.customerChangedMind, types: ["order"] },
    { id: 4, reason: t.settingsPage.customerRequestedToCancel, types: ["order"] },
    { id: 5, reason: t.settingsPage.paymentIssues, types: ["order"] },
    { id: 6, reason: t.settingsPage.customerNoLongerWantsOrder, types: ["order"] },
    { id: 7, reason: t.settingsPage.ingredientNotAvailable, types: ["kot"] },
    { id: 8, reason: t.settingsPage.preparationTimeTooLong, types: ["kot"] },
    { id: 9, reason: t.settingsPage.qualityIssueWithIngredients, types: ["kot"] },
    { id: 10, reason: t.settingsPage.systemErrorTechnicalIssue, types: ["order", "kot"] },
  ]);
  const [showCancellationReasonModal, setShowCancellationReasonModal] = useState(false);
  const [editingCancellationReason, setEditingCancellationReason] = useState<CancellationReason | null>(null);
  const [cancellationReasonText, setCancellationReasonText] = useState("");
  const [cancellationReasonTypes, setCancellationReasonTypes] = useState<("order" | "kot")[]>(["order"]);

  // Refund Reasons
  interface RefundReason {
    id: number;
    reason: string;
  }

  const [refundReasons, setRefundReasons] = useState<RefundReason[]>([
    { id: 1, reason: t.settingsPage.itemPreparedButReturned },
    { id: 2, reason: t.settingsPage.itemDeliveredButRejected },
    { id: 3, reason: t.settingsPage.mistakeInOrder },
    { id: 4, reason: t.settingsPage.productQualityIssue },
  ]);
  const [showRefundReasonModal, setShowRefundReasonModal] = useState(false);
  const [editingRefundReason, setEditingRefundReason] = useState<RefundReason | null>(null);
  const [refundReasonText, setRefundReasonText] = useState("");

  const tabs = [
    { key: "general" as const, label: t.settingsPage.general },
    { key: "app" as const, label: t.settingsPage.app },
    { key: "operationalShifts" as const, label: t.settingsPage.operationalShifts },
    { key: "branch" as const, label: t.settingsPage.branch },
    { key: "currencies" as const, label: t.settingsPage.currencies },
    { key: "email" as const, label: t.settingsPage.email },
    { key: "taxes" as const, label: t.settingsPage.taxes },
    { key: "payment" as const, label: t.settingsPage.payment },
    { key: "theme" as const, label: t.settingsPage.theme },
    { key: "roles" as const, label: t.settingsPage.roles },
  ];

  const secondRowTabs = [
    { key: "billing" as const, label: t.settingsPage.billing },
    { key: "reservation" as const, label: t.settingsPage.reservation },
    { key: "aboutUs" as const, label: t.settingsPage.aboutUs },
    { key: "customerSite" as const, label: t.settingsPage.customerSite },
    { key: "receipt" as const, label: t.settingsPage.receipt },
    { key: "printer" as const, label: t.settingsPage.printer },
    { key: "delivery" as const, label: t.settingsPage.delivery },
    { key: "kot" as const, label: t.settingsPage.kot },
    { key: "cancellationReasons" as const, label: t.settingsPage.cancellationReasons },
    { key: "refundReasons" as const, label: t.settingsPage.refundReasons },
    { key: "order" as const, label: t.settingsPage.order },
    { key: "kiosk" as const, label: t.settingsPage.kiosk },
  ];

  const handleAddTaxEntry = () => {
    setTaxEntries([...taxEntries, { taxName: "", taxId: "" }]);
  };

  const handleRemoveTaxEntry = (index: number) => {
    if (taxEntries.length > 1) {
      setTaxEntries(taxEntries.filter((_, i) => i !== index));
    }
  };

  const handleTaxEntryChange = (index: number, field: "taxName" | "taxId", value: string) => {
    const updatedEntries = [...taxEntries];
    updatedEntries[index][field] = value;
    setTaxEntries(updatedEntries);
  };

  const handleAddCancellationReason = () => {
    setCancellationReasonText("");
    setCancellationReasonTypes(["order"]);
    setEditingCancellationReason(null);
    setShowCancellationReasonModal(true);
  };

  const handleEditCancellationReason = (reason: CancellationReason) => {
    setCancellationReasonText(reason.reason);
    setCancellationReasonTypes(reason.types);
    setEditingCancellationReason(reason);
    setShowCancellationReasonModal(true);
  };

  const handleDeleteCancellationReason = async (id: number) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: t.settingsPage.confirmDelete || "Are you sure you want to delete this cancellation reason?",
      variant: "danger",
    })) {
      setCancellationReasons(cancellationReasons.filter(r => r.id !== id));
    }
  };

  const handleSaveCancellationReason = () => {
    if (!cancellationReasonText.trim()) {
      alert("Please enter a reason");
      return;
    }
    if (cancellationReasonTypes.length === 0) {
      alert("Please select at least one cancellation type");
      return;
    }

    if (editingCancellationReason) {
      setCancellationReasons(cancellationReasons.map(r => 
        r.id === editingCancellationReason.id 
          ? { ...r, reason: cancellationReasonText, types: cancellationReasonTypes }
          : r
      ));
    } else {
      const newReason: CancellationReason = {
        id: Math.max(...cancellationReasons.map(r => r.id), 0) + 1,
        reason: cancellationReasonText,
        types: cancellationReasonTypes,
      };
      setCancellationReasons([...cancellationReasons, newReason]);
    }
    setShowCancellationReasonModal(false);
  };

  // Refund Reasons Handlers
  const handleAddRefundReason = () => {
    setRefundReasonText("");
    setEditingRefundReason(null);
    setShowRefundReasonModal(true);
  };

  const handleEditRefundReason = (reason: RefundReason) => {
    setRefundReasonText(reason.reason);
    setEditingRefundReason(reason);
    setShowRefundReasonModal(true);
  };

  const handleDeleteRefundReason = async (id: number) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: t.settingsPage.confirmDelete || "Are you sure you want to delete this refund reason?",
      variant: "danger",
    })) {
      setRefundReasons(refundReasons.filter(r => r.id !== id));
    }
  };

  const handleSaveRefundReason = () => {
    if (!refundReasonText.trim()) {
      alert("Please enter a reason");
      return;
    }

    if (editingRefundReason) {
      setRefundReasons(refundReasons.map(r => 
        r.id === editingRefundReason.id 
          ? { ...r, reason: refundReasonText }
          : r
      ));
    } else {
      const newReason: RefundReason = {
        id: Math.max(...refundReasons.map(r => r.id), 0) + 1,
        reason: refundReasonText,
      };
      setRefundReasons([...refundReasons, newReason]);
    }
    setShowRefundReasonModal(false);
  };

  const handleSave = () => {
    alert("Settings saved!");
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Tabs - Two Rows */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-4">
          {/* First Row of Tabs */}
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Second Row of Tabs */}
          <div className="flex flex-wrap">
            {secondRowTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* General Tab Content */}
        {activeTab === "general" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.general}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.generalSubtitle}
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column - Restaurant Information */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.restaurantName}
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Restaurant Phone Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.restaurantPhoneNumber}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="select">{t.settingsPage.select}</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+994">+994 (AZ)</option>
                    </select>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Restaurant Email Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.restaurantEmailAddress}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Restaurant Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.restaurantAddress}
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                {/* Tax ID Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  {/* Toggle */}
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setShowTaxIdOnOrders(!showTaxIdOnOrders)}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                        showTaxIdOnOrders
                          ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {showTaxIdOnOrders && (
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
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {t.settingsPage.showTaxIdOnOrders}
                    </span>
                  </label>

                  {/* Tax Entries */}
                  {showTaxIdOnOrders && (
                    <div className="space-y-3">
                      {taxEntries.map((entry, index) => (
                        <div key={index} className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              {t.settingsPage.taxName}
                            </label>
                            <input
                              type="text"
                              value={entry.taxName}
                              onChange={(e) => handleTaxEntryChange(index, "taxName", e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              {t.settingsPage.taxID}
                            </label>
                            <input
                              type="text"
                              value={entry.taxId}
                              onChange={(e) => handleTaxEntryChange(index, "taxId", e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        </div>
                      ))}
                      
                      <button
                        onClick={handleAddTaxEntry}
                        className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {t.settingsPage.addMore}
                      </button>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t.save}
                </button>

                {/* Additional Charges Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                      {t.settingsPage.additionalCharges}
                    </h3>
                    <button className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors">
                      {t.settingsPage.addCharge}
                    </button>
                  </div>

                  {/* Table */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                          <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                            {t.settingsPage.chargeName}
                          </th>
                          <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                            {t.settingsPage.type}
                          </th>
                          <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                            {t.settingsPage.rate}
                          </th>
                          <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                            {t.settingsPage.orderType}
                          </th>
                          <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                            {t.settingsPage.action}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400"
                          >
                            {t.settingsPage.noChargeFound}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Show Tax Id on Orders */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    {t.settingsPage.showTaxIdOnOrders}
                  </h3>
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.settingsPage.noTaxFound}
                    </p>
                  </div>
                </div>

                {/* Preset Amounts */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                      {t.settingsPage.presetAmounts}
                    </h3>
                    <button className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-colors">
                      {t.edit}
                    </button>
                  </div>

                  {/* Amounts Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {presetAmounts.map((amount, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center"
                      >
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {amount.toFixed(2)}₼
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* App Tab Content */}
        {activeTab === "app" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.app}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.appSubtitle}
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column - Country, Timezone & Currency */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.settingsPage.countryTimezoneCurrency}
                </h2>

                {/* Country */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.country}
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-white"
                  >
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                    <option>Australia</option>
                    <option>Germany</option>
                    <option>France</option>
                    <option>Azerbaijan</option>
                  </select>
                </div>

                {/* Time Format */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.timeFormat}
                  </label>
                  <select
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-white"
                  >
                    <option>12 Hour (10:32 AM)</option>
                    <option>24 Hour (22:32)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.dateFormat}
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-white"
                  >
                    <option>d/m/Y</option>
                    <option>m/d/Y</option>
                    <option>Y-m-d</option>
                    <option>d.m.Y</option>
                  </select>
                </div>

                {/* Time Zone */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.timeZone}
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-white"
                  >
                    <option>America/New_York</option>
                    <option>America/Los_Angeles</option>
                    <option>America/Chicago</option>
                    <option>Europe/London</option>
                    <option>Europe/Paris</option>
                    <option>Europe/Berlin</option>
                    <option>Asia/Baku</option>
                    <option>Asia/Dubai</option>
                    <option>Asia/Tokyo</option>
                    <option>Australia/Sydney</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.currency}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-white"
                  >
                    <option>Dollars (USD)</option>
                    <option>Euros (EUR)</option>
                    <option>Pounds (GBP)</option>
                    <option>Manat (AZN)</option>
                    <option>Yen (JPY)</option>
                  </select>
                </div>

                {/* Customer Site Language */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.customerSiteLanguage}
                  </label>
                  <select
                    value={customerSiteLanguage}
                    onChange={(e) => setCustomerSiteLanguage(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-white"
                  >
                    <option>English (English)</option>
                    <option>Azerbaijani (Azərbaycanca)</option>
                    <option>Spanish (Español)</option>
                    <option>French (Français)</option>
                    <option>German (Deutsch)</option>
                  </select>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {t.save}
                </button>
              </div>

              {/* Right Column - Hide Top Navigation */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.settingsPage.hideTopNavigation}
                </h2>

                {/* Hide Today's Orders */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setHideTodaysOrders(!hideTodaysOrders)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      hideTodaysOrders
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {hideTodaysOrders && (
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
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                      onClick={() => setHideTodaysOrders(!hideTodaysOrders)}
                    >
                      {t.settingsPage.hideTodaysOrders}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.settingsPage.hideTodaysOrdersDesc}
                    </p>
                  </div>
                </div>

                {/* Hide New Reservation */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setHideNewReservation(!hideNewReservation)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      hideNewReservation
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {hideNewReservation && (
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
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                      onClick={() => setHideNewReservation(!hideNewReservation)}
                    >
                      {t.settingsPage.hideNewReservation}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.settingsPage.hideNewReservationDesc}
                    </p>
                  </div>
                </div>

                {/* Hide New Waiter Request */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setHideNewWaiterRequest(!hideNewWaiterRequest)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      hideNewWaiterRequest
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {hideNewWaiterRequest && (
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
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                      onClick={() => setHideNewWaiterRequest(!hideNewWaiterRequest)}
                    >
                      {t.settingsPage.hideNewWaiterRequest}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.settingsPage.hideNewWaiterRequestDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Operational Shifts Tab Content */}
        {activeTab === "operationalShifts" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.operationalShifts}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.operationalShiftsSubtitle}
              </p>
            </div>

            {/* Select Branch */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.settingsPage.selectBranchLabel}
              </label>
              <select
                value={selectedBranchForShifts}
                onChange={(e) => setSelectedBranchForShifts(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-white"
              >
                <option>Georgianafort</option>
                <option>Downtown Branch</option>
                <option>Airport Branch</option>
                <option>Mall Branch</option>
              </select>
            </div>

            {/* Shifts Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.settingsPage.shiftsFor} {selectedBranchForShifts}
                </h2>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  {t.settingsPage.addShift}
                </button>
              </div>

              {/* Empty State */}
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {t.settingsPage.noShiftsConfigured}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                  {t.settingsPage.noShiftsMessage}
                </p>
                <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  {t.settingsPage.addFirstShift}
                </button>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.settingsPage.howItWorks}
                </h2>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t.settingsPage.howItWorksPoint1}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t.settingsPage.howItWorksPoint2}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t.settingsPage.howItWorksPoint3}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t.settingsPage.howItWorksPoint4}
                  </span>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Branch Tab Content */}
        {activeTab === "branch" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.branch}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.branchSubtitle}
              </p>
            </div>

            {/* Add Branch Button */}
            <div className="mb-4">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" />
                {t.settingsPage.addBranch}
              </button>
            </div>

            {/* Branches Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.branchName}
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.branchAddress}
                      </th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.action}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {branches.map((branch) => (
                      <tr
                        key={branch.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                          {branch.name}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {branch.address}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors">
                              {t.update}
                            </button>
                            {branch.isCurrent ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {t.settingsPage.cannotDeleteCurrentBranch}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDeleteBranch(branch.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                title={t.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Currencies Tab Content */}
        {activeTab === "currencies" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.currencies}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.currenciesSubtitle}
              </p>
            </div>

            {/* Add Currency Button */}
            <div className="mb-4">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" />
                {t.settingsPage.addCurrency}
              </button>
            </div>

            {/* Currencies Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.currencyName}
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.currencySymbol}
                      </th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.action}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {currencies.map((curr) => (
                      <tr
                        key={curr.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                          {curr.name}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {curr.symbol}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors">
                              {t.update}
                            </button>
                            {curr.isDefault ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {t.settingsPage.cannotDeleteDefaultCurrency}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDeleteCurrency(curr.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                title={t.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Email Tab Content */}
        {activeTab === "email" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.email}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.emailSubtitle}
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column - Email Notifications */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.settingsPage.emailNotifications}
                </h2>

                {/* New Order */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailNewOrder(!emailNewOrder)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      emailNewOrder
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {emailNewOrder && (
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
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                      onClick={() => setEmailNewOrder(!emailNewOrder)}
                    >
                      {t.settingsPage.newOrderReceived}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.settingsPage.newOrderReceivedDesc}
                    </p>
                  </div>
                </div>

                {/* Reservation Confirmation */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailReservationConfirmation(!emailReservationConfirmation)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      emailReservationConfirmation
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {emailReservationConfirmation && (
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
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                      onClick={() => setEmailReservationConfirmation(!emailReservationConfirmation)}
                    >
                      {t.settingsPage.reservationConfirmation}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.settingsPage.reservationConfirmationDesc}
                    </p>
                  </div>
                </div>

                {/* New Reservation */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailNewReservation(!emailNewReservation)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      emailNewReservation
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {emailNewReservation && (
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
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                      onClick={() => setEmailNewReservation(!emailNewReservation)}
                    >
                      {t.settingsPage.newReservationReceived}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.settingsPage.newReservationReceivedDesc}
                    </p>
                  </div>
                </div>

                {/* Order Bill */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailOrderBill(!emailOrderBill)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      emailOrderBill
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {emailOrderBill && (
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
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                      onClick={() => setEmailOrderBill(!emailOrderBill)}
                    >
                      {t.settingsPage.orderBill}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.settingsPage.orderBillDesc}
                    </p>
                  </div>
                </div>

                {/* Staff Welcome */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailStaffWelcome(!emailStaffWelcome)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                      emailStaffWelcome
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {emailStaffWelcome && (
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
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                      onClick={() => setEmailStaffWelcome(!emailStaffWelcome)}
                    >
                      {t.settingsPage.staffWelcomeEmail}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.settingsPage.staffWelcomeEmailDesc}
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  {t.save}
                </button>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Email Templates */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    {t.settingsPage.emailTemplates}
                  </h3>
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.settingsPage.noTemplateFound}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Taxes Tab Content */}
        {activeTab === "taxes" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.taxes}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.taxesSubtitle}
              </p>
            </div>

            {/* Sub Tabs */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-4">
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setTaxSubTab("settings")}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    taxSubTab === "settings"
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-b-2 border-red-600 dark:border-red-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {t.settingsPage.taxSettings}
                </button>
                <button
                  onClick={() => setTaxSubTab("list")}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    taxSubTab === "list"
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-b-2 border-red-600 dark:border-red-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {t.settingsPage.allTaxes}
                </button>
              </div>
            </div>

            {/* Tax Settings Sub Tab */}
            {taxSubTab === "settings" && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-6">
                {/* Tax Mode Section */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    {t.settingsPage.taxMode}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Order-Level Tax */}
                    <button
                      onClick={() => setTaxMode("order")}
                      className={`relative flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${
                        taxMode === "order"
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={taxMode === "order"}
                        onChange={() => setTaxMode("order")}
                        className="mt-0.5 w-4 h-4 text-red-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-red-500 dark:focus:ring-red-400"
                      />
                      <div className="flex-1 text-left">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                          {t.settingsPage.orderLevelTax}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.orderLevelTaxDesc}
                        </div>
                      </div>
                    </button>

                    {/* Item-Level Tax */}
                    <button
                      onClick={() => setTaxMode("item")}
                      className={`relative flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${
                        taxMode === "item"
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={taxMode === "item"}
                        onChange={() => setTaxMode("item")}
                        className="mt-0.5 w-4 h-4 text-red-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-red-500 dark:focus:ring-red-400"
                      />
                      <div className="flex-1 text-left">
                        <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                          {t.settingsPage.itemLevelTax}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.itemLevelTaxDesc}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Tax Calculation Base Section */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                    {t.settingsPage.taxCalculationBase}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {t.settingsPage.taxCalculationBaseDesc}
                  </p>
                  <div className="space-y-3">
                    {/* Include Service Charges */}
                    <button
                      onClick={() => setTaxCalculationBase("include")}
                      className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left ${
                        taxCalculationBase === "include"
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={taxCalculationBase === "include"}
                        onChange={() => setTaxCalculationBase("include")}
                        className="mt-0.5 w-4 h-4 text-red-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-red-500 dark:focus:ring-red-400"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                          {t.settingsPage.includeServiceCharges}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {t.settingsPage.includeServiceChargesDesc}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-[10px] text-gray-700 dark:text-gray-300 font-mono">
                          {t.settingsPage.includeServiceChargesFormula}
                        </div>
                      </div>
                    </button>

                    {/* Exclude Service Charges */}
                    <button
                      onClick={() => setTaxCalculationBase("exclude")}
                      className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left ${
                        taxCalculationBase === "exclude"
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={taxCalculationBase === "exclude"}
                        onChange={() => setTaxCalculationBase("exclude")}
                        className="mt-0.5 w-4 h-4 text-red-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-red-500 dark:focus:ring-red-400"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                          {t.settingsPage.excludeServiceCharges}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {t.settingsPage.excludeServiceChargesDesc}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-[10px] text-gray-700 dark:text-gray-300 font-mono">
                          {t.settingsPage.excludeServiceChargesFormula}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t.save}
                </button>
              </div>
            )}

            {/* All Taxes Sub Tab */}
            {taxSubTab === "list" && (
              <>
                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t.settingsPage.allTaxesApplicable}
                  </p>
                </div>

                {/* Add Tax Button */}
                <div className="mb-4">
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    {t.settingsPage.addTax}
                  </button>
                </div>

                {/* Taxes Table */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            {t.settingsPage.taxName}
                          </th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            {t.settingsPage.taxPercent}
                          </th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            {t.action}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {taxes.map((tax) => (
                          <tr
                            key={tax.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                              {tax.name}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                              {tax.percent}%
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors">
                                  {t.update}
                                </button>
                                <button
                                  onClick={() => handleDeleteTax(tax.id)}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                  title={t.delete}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Theme Tab Content */}
        {activeTab === "theme" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.theme}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.themeSubtitle}
              </p>
            </div>

            {/* Logo Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.logo}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t.settingsPage.uploadLogoForRestaurant}
              </p>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-3">
                <div className="flex flex-col items-center">
                  {theme.logoUrl ? (
                    <div className="w-24 h-24 mb-3 rounded-lg overflow-hidden border-2 border-red-200 dark:border-red-800">
                      <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {theme.logoUrl ? t.settingsPage.changeLogo || "Change Logo" : t.settingsPage.uploadLogo}
                  </label>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-4">
                {t.settingsPage.logoSupportedFormats}
              </p>

              {/* Show Restaurant Name Checkbox */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => theme.setShowRestaurantNameWithLogo(!theme.showRestaurantNameWithLogo)}
                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                    theme.showRestaurantNameWithLogo
                      ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {theme.showRestaurantNameWithLogo && (
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
                  <label
                    className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer"
                    onClick={() => theme.setShowRestaurantNameWithLogo(!theme.showRestaurantNameWithLogo)}
                  >
                    {t.settingsPage.showRestaurantNameWithLogo}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t.settingsPage.showRestaurantNameWithLogoDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Favicon Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.favicon}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t.settingsPage.uploadFaviconFor}{" "}
                <a href="#" className="text-red-600 dark:text-red-400 hover:underline">
                  {t.settingsPage.generateFavicon}
                </a>
              </p>

              {/* Favicon Upload Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  t.settingsPage.uploadFaviconPhone,
                  t.settingsPage.uploadFaviconTablet,
                  t.settingsPage.uploadFaviconDesktop,
                  t.settingsPage.uploadFaviconPhone,
                  t.settingsPage.uploadFaviconTablet,
                  t.settingsPage.uploadFaviconDesktop,
                ].map((label, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 text-center mb-2">
                        {label}
                      </p>
                      <button className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors w-full">
                        {t.settingsPage.upload}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme Color Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.settingsPage.themeColor}
                </h2>
                <button className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors">
                  {t.settingsPage.refresh}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {t.settingsPage.selectThemeColor}
              </p>

              {/* Restaurant Colors */}
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingsPage.restaurant}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {themeColors.restaurant.map((color) => (
                    <button
                      key={color}
                      onClick={() => theme.setThemeColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        theme.themeColor === color
                          ? "ring-2 ring-offset-2 ring-red-500 dark:ring-red-400 dark:ring-offset-gray-900 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Fresh Colors */}
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingsPage.fresh}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {themeColors.fresh.map((color) => (
                    <button
                      key={color}
                      onClick={() => theme.setThemeColor(color)}
                      className={`w-8 h-8 rounded-full transition-all border border-gray-200 dark:border-gray-700 ${
                        theme.themeColor === color
                          ? "ring-2 ring-offset-2 ring-red-500 dark:ring-red-400 dark:ring-offset-gray-900 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Warm Colors */}
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingsPage.warm}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {themeColors.warm.map((color) => (
                    <button
                      key={color}
                      onClick={() => theme.setThemeColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        theme.themeColor === color
                          ? "ring-2 ring-offset-2 ring-red-500 dark:ring-red-400 dark:ring-offset-gray-900 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.save}
              </button>
            </div>
          </>
        )}

        {/* Roles Tab Content */}
        {activeTab === "roles" && (
          <>
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                  {t.settingsPage.roles}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t.settingsPage.rolesSubtitle}
                </p>
              </div>
              <button
                onClick={() => setShowManageRoleModal(true)}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.settingsPage.manageRole}
              </button>
            </div>

            {/* Permissions Matrix */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                      <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">
                        {t.settingsPage.userPermission}
                      </th>
                      {roles.map((role) => (
                        <th
                          key={role.id}
                          className="px-4 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] text-gray-400 dark:text-gray-500">{t.settingsPage.role}</span>
                            <span className="text-[10px] font-semibold">{role.name.toUpperCase()}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionCategories.flatMap((category, categoryIndex) => [
                      // Category Header Row
                      <tr key={`category-${categoryIndex}`} className="bg-gray-50 dark:bg-gray-900">
                        <td
                          colSpan={roles.length + 1}
                          className="px-4 py-2 text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-t border-gray-200 dark:border-gray-800"
                        >
                          {category.category}
                        </td>
                      </tr>,
                      // Permission Rows
                      ...category.permissions.map((permission, permissionIndex) => (
                        <tr
                          key={`permission-${categoryIndex}-${permissionIndex}`}
                          className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                            {permission}
                          </td>
                          {roles.map((role) => {
                            const state = permissions[role.id]?.[permission] || "neutral";
                            return (
                              <td key={role.id} className="px-4 py-3 text-center">
                                <button
                                  onClick={() => togglePermission(role.id, permission)}
                                  className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                                    state === "denied"
                                      ? "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50"
                                      : state === "granted"
                                      ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  {state === "denied" ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                  ) : state === "granted" ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ])}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-4">
              <button
                onClick={handleSave}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.save}
              </button>
            </div>
          </>
        )}

        {/* Manage Role Modal */}
        {showManageRoleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t.settingsPage.manageRoleModal}
                  </h2>
                  <button
                    onClick={() => setShowManageRoleModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Roles Table */}
                <div className="mb-6">
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                          <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                            #
                          </th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t.settingsPage.roleColumn}
                          </th>
                          <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t.settingsPage.actionColumn}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role, index) => (
                          <tr key={role.id} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                            <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium">
                              {role.name}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {role.isDefault ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {t.settingsPage.defaultRoleCannotBeDeleted}
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add New Role Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.addNewRole}
                  </h3>
                  
                  {/* Display Name */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.settingsPage.displayName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder={t.settingsPage.enterDisplayName}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  {/* Copy Permissions Dropdown */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.settingsPage.copyPermissionsFromRole}
                    </label>
                    <select
                      value={copyFromRole}
                      onChange={(e) => setCopyFromRole(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">{t.settingsPage.dontCopyPermissions}</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowManageRoleModal(false)}
                      className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors"
                    >
                      {t.settingsPage.cancel}
                    </button>
                    <button
                      onClick={handleCreateRole}
                      disabled={!newRoleName.trim()}
                      className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.settingsPage.createRole}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab Content */}
        {activeTab === "billing" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.billing}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.billingSubtitle}
              </p>
            </div>

            {/* Sub Tabs */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-4">
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setBillingSubTab("planDetails")}
                  className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    billingSubTab === "planDetails"
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {t.settingsPage.planDetails}
                </button>
                <button
                  onClick={() => setBillingSubTab("purchaseHistory")}
                  className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    billingSubTab === "purchaseHistory"
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {t.settingsPage.purchaseHistory}
                </button>
                <button
                  onClick={() => setBillingSubTab("offlineRequest")}
                  className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    billingSubTab === "offlineRequest"
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {t.settingsPage.offlineRequest}
                </button>
              </div>
            </div>

            {/* Plan Details Content */}
            {billingSubTab === "planDetails" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column - Current Plan */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.currentPlanName}
                  </h2>
                  
                  {/* Plan Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t.settingsPage.currentPlanType}:
                      </span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        Premium Plan
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t.settingsPage.licenseExpiresOn}:
                      </span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        15 Mar, 2026
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t.settingsPage.daysLeft}:
                      </span>
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        31 {t.settingsPage.daysLeft}
                      </span>
                    </div>
                  </div>

                  {/* Upgrade Button */}
                  <button className="w-full px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors">
                    {t.settingsPage.upgradePlan}
                  </button>
                </div>

                {/* Right Column - Additional Features */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.additionalFeatures}
                  </h2>
                  
                  {/* Features List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.changeBranch}
                      </span>
                      <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.exportReport}
                      </span>
                      <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.tableReservation}
                      </span>
                      <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.paymentGatewayIntegration}
                      </span>
                      <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.themeSetting}
                      </span>
                      <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.customerDisplay}
                      </span>
                      <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History Content */}
            {billingSubTab === "purchaseHistory" && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.package}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.billingCycle}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.paymentDate}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.nextPaymentDate}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.transactionId}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.paymentGateway}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.amount}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.packageDetails}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                            {item.package}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                            {item.billingCycle}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                            {item.paymentDate}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                            {item.nextPaymentDate}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                            {item.transactionId}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                            {item.paymentGateway}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.amount, "AZN (₼)")}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                            {item.packageDetails}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Offline Request Content */}
            {billingSubTab === "offlineRequest" && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.package}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.billingCycle}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.paymentBy}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.created}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t.settingsPage.status}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                        >
                          {t.settingsPage.noOfflinePaymentRequestFound}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reservation Tab Content */}
        {activeTab === "reservation" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.reservation}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.reservationSubtitle}
              </p>
            </div>

            {/* Reservation Settings Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t.settingsPage.reservationSettings}
              </h2>

              {/* Enable Settings Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Enable Admin Reservations */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                      {t.settingsPage.enableAdminReservations}
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t.settingsPage.enableAdminReservationsDesc}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setEnableAdminReservations(!enableAdminReservations)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        enableAdminReservations ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableAdminReservations ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Enable Customer Reservations */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                      {t.settingsPage.enableCustomerReservations}
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t.settingsPage.enableCustomerReservationsDesc}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setEnableCustomerReservations(!enableCustomerReservations)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        enableCustomerReservations ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableCustomerReservations ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Party Size and Slot Minutes Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Minimum Party Size */}
                <div>
                  <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                    {t.settingsPage.minimumPartySize}
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {t.settingsPage.minimumPartySizeDesc}
                  </p>
                  <input
                    type="number"
                    value={minimumPartySize}
                    onChange={(e) => setMinimumPartySize(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                    min="1"
                  />
                </div>

                {/* Disable Slot Minutes */}
                <div>
                  <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                    {t.settingsPage.disableSlotMinutes}
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {t.settingsPage.disableSlotMinutesDesc}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={disableSlotMinutes}
                      onChange={(e) => setDisableSlotMinutes(Number(e.target.value))}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      min="0"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t.settingsPage.minutes}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </div>

            {/* Time Slots Settings Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t.settingsPage.timeSlotsSettings}
              </h2>

              {/* Day Tabs */}
              <div className="mb-4 flex flex-wrap gap-1">
                {[
                  { key: "monday" as const, label: t.settingsPage.monday },
                  { key: "tuesday" as const, label: t.settingsPage.tuesday },
                  { key: "wednesday" as const, label: t.settingsPage.wednesday },
                  { key: "thursday" as const, label: t.settingsPage.thursday },
                  { key: "friday" as const, label: t.settingsPage.friday },
                  { key: "saturday" as const, label: t.settingsPage.saturday },
                  { key: "sunday" as const, label: t.settingsPage.sunday },
                ].map((day) => (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedDay === day.key
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              {/* Day Label */}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                {selectedDay === "monday" && t.settingsPage.monday}
                {selectedDay === "tuesday" && t.settingsPage.tuesday}
                {selectedDay === "wednesday" && t.settingsPage.wednesday}
                {selectedDay === "thursday" && t.settingsPage.thursday}
                {selectedDay === "friday" && t.settingsPage.friday}
                {selectedDay === "saturday" && t.settingsPage.saturday}
                {selectedDay === "sunday" && t.settingsPage.sunday}
              </h3>

              {/* Time Slots Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.slotType}
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.startTime}
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.endTime}
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.timeSlotDifference}
                      </th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {t.settingsPage.available}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {timeSlots[selectedDay].map((slot) => (
                      <tr key={slot.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                          {slot.type === "Breakfast" && t.settingsPage.breakfast}
                          {slot.type === "Lunch" && t.settingsPage.lunch}
                          {slot.type === "Dinner" && t.settingsPage.dinner}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleTimeSlotChange(selectedDay, slot.id, 'startTime', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleTimeSlotChange(selectedDay, slot.id, 'endTime', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          <input
                            type="number"
                            value={slot.slotDifference}
                            onChange={(e) => handleTimeSlotChange(selectedDay, slot.id, 'slotDifference', parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleTimeSlotAvailability(selectedDay, slot.id)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              slot.available ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                slot.available ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </>
        )}

        {/* About Us Tab Content */}
        {activeTab === "aboutUs" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.aboutUs}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.aboutUsSubtitle}
              </p>
            </div>

            {/* About Us Editor Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              {/* Toolbar */}
              <div className="flex items-center gap-1 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors"
                  title="Bold"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 4v12h4.5a3.5 3.5 0 001.48-6.67A3.5 3.5 0 0013.5 4H6zm2 2h3.5a1.5 1.5 0 010 3H8V6zm0 5h4.5a1.5 1.5 0 010 3H8v-3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors"
                  title="Italic"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 4v2h2.5l-4 8H6v2h6v-2h-2.5l4-8H16V4h-6z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors"
                  title="Link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors"
                  title="Strikethrough"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 10h8a1 1 0 110 2H6a1 1 0 110-2zm0-4h8a1 1 0 110 2H6a1 1 0 110-2zm8 8H6a1 1 0 110-2h8a1 1 0 110 2z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors"
                  title="Quote"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 00-1-1H6zm0 2v8h8V6H6z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors"
                  title="Bullet List"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors"
                  title="Numbered List"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Text Area */}
              <textarea
                value={aboutUsContent}
                onChange={(e) => setAboutUsContent(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border-0 text-gray-900 dark:text-white focus:outline-none resize-none"
                rows={15}
                placeholder="Enter your about us content here..."
              />

              {/* Save Button */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: theme.themeColor }}
                >
                  {t.save}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Customer Site Tab Content */}
        {activeTab === "customerSite" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.customerSite}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.customerSiteSubtitle}
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-4">
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setCustomerSiteSubTab("customerSite")}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                    customerSiteSubTab === "customerSite"
                      ? "border-b-2"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                  style={{
                    color: customerSiteSubTab === "customerSite" ? theme.themeColor : undefined,
                    borderBottomColor: customerSiteSubTab === "customerSite" ? theme.themeColor : undefined,
                  }}
                >
                  {t.settingsPage.customerSite}
                </button>
                <button
                  onClick={() => setCustomerSiteSubTab("customizeHeader")}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                    customerSiteSubTab === "customizeHeader"
                      ? "border-b-2"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                  style={{
                    color: customerSiteSubTab === "customizeHeader" ? theme.themeColor : undefined,
                    borderBottomColor: customerSiteSubTab === "customizeHeader" ? theme.themeColor : undefined,
                  }}
                >
                  {t.settingsPage.customizeHeaderTab}
                </button>
              </div>
            </div>

            {/* Customer Site Sub-tab Content */}
            {customerSiteSubTab === "customerSite" && (
              <>
                {/* Order Settings Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.orderSettings}
                  </h2>

                  <div className="space-y-4">
                    {/* Allow Customer Orders */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.allowCustomerOrders}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.allowCustomerOrdersDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setAllowCustomerOrders(!allowCustomerOrders)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            allowCustomerOrders ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: allowCustomerOrders ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              allowCustomerOrders ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Customer Login Required */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.customerLoginRequired}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.customerLoginRequiredDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setCustomerLoginRequired(!customerLoginRequired)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            customerLoginRequired ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: customerLoginRequired ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              customerLoginRequired ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Allow QR Orders */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.allowQROrders}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.allowQROrdersDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setAllowQROrders(!allowQROrders)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            allowQROrders ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: allowQROrders ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              allowQROrders ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Pickup Days Range */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.pickupDaysRange}
                        </label>
                        <input
                          type="number"
                          value={pickupDaysRange}
                          onChange={(e) => setPickupDaysRange(Number(e.target.value))}
                          className="mt-2 w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Enable Tip Customer Site */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.enableTipCustomerSite}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.enableTipCustomerSiteDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setEnableTipCustomerSite(!enableTipCustomerSite)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            enableTipCustomerSite ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: enableTipCustomerSite ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enableTipCustomerSite ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Enable Tip POS */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.enableTipPOS}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.enableTipPOSDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setEnableTipPOS(!enableTipPOS)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            enableTipPOS ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: enableTipPOS ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enableTipPOS ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Auto Confirm Order Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.autoConfirmOrderStatus}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.autoConfirmOrderStatusDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setAutoConfirmOrderStatus(!autoConfirmOrderStatus)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            autoConfirmOrderStatus ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: autoConfirmOrderStatus ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              autoConfirmOrderStatus ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Show Veg */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.showVeg}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.showVegDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setShowVeg(!showVeg)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            showVeg ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: showVeg ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              showVeg ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Show Halal */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.showHalal}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.showHalalDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setShowHalal(!showHalal)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            showHalal ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: showHalal ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              showHalal ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Waiter Settings Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.callWaiterSettings}
                  </h2>

                  <div className="space-y-4">
                    {/* Enable Waiter Request */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.enableWaiterRequest}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.enableWaiterRequestDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setEnableWaiterRequest(!enableWaiterRequest)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            enableWaiterRequest ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: enableWaiterRequest ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enableWaiterRequest ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* On Mobile */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.onMobile}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.onMobileDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setEnableWaiterRequestMobile(!enableWaiterRequestMobile)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            enableWaiterRequestMobile ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: enableWaiterRequestMobile ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enableWaiterRequestMobile ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* On Desktop */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.onDesktop}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.onDesktopDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setEnableWaiterRequestDesktop(!enableWaiterRequestDesktop)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            enableWaiterRequestDesktop ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: enableWaiterRequestDesktop ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enableWaiterRequestDesktop ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Only When Open Via QR */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.onlyWhenOpenViaQR}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.onlyWhenOpenViaQRDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setOnlyWhenOpenViaQR(!onlyWhenOpenViaQR)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            onlyWhenOpenViaQR ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: onlyWhenOpenViaQR ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              onlyWhenOpenViaQR ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dine-in Settings Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.dineInSettings}
                  </h2>

                  <div className="space-y-4">
                    {/* Table Required for Dine-in */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.tableRequiredForDineIn}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.tableRequiredForDineInDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setTableRequiredForDineIn(!tableRequiredForDineIn)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            tableRequiredForDineIn ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: tableRequiredForDineIn ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              tableRequiredForDineIn ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Default Table Reservation Status */}
                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                        {t.settingsPage.defaultTableReservationStatus}
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {t.settingsPage.defaultTableReservationStatusDesc}
                      </p>
                      <select
                        value={defaultTableReservationStatus}
                        onChange={(e) => setDefaultTableReservationStatus(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* PWA Settings Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.pwaSettings}
                  </h2>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                        {t.settingsPage.enablePWA}
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t.settingsPage.enablePWADesc}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setEnablePWA(!enablePWA)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          enablePWA ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                        style={{ backgroundColor: enablePWA ? theme.themeColor : undefined }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            enablePWA ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Settings Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.tableSettings}
                  </h2>

                  <div>
                    <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                      {t.settingsPage.tableLockTimeout}
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t.settingsPage.tableLockTimeoutDesc}
                    </p>
                    <input
                      type="number"
                      value={tableLockTimeout}
                      onChange={(e) => setTableLockTimeout(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                {/* Social Media Links Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.socialMediaLinks}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
                        {t.settingsPage.facebookLink}
                      </label>
                      <input
                        type="text"
                        value={facebookLink}
                        onChange={(e) => setFacebookLink(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
                        {t.settingsPage.instagramLink}
                      </label>
                      <input
                        type="text"
                        value={instagramLink}
                        onChange={(e) => setInstagramLink(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
                        {t.settingsPage.twitterLink}
                      </label>
                      <input
                        type="text"
                        value={twitterLink}
                        onChange={(e) => setTwitterLink(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
                        {t.settingsPage.yelpLink}
                      </label>
                      <input
                        type="text"
                        value={yelpLink}
                        onChange={(e) => setYelpLink(e.target.value)}
                        placeholder="Enter your Yelp URL"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* SEO Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.seo}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
                        {t.settingsPage.metaKeyword}
                      </label>
                      <input
                        type="text"
                        value={metaKeyword}
                        onChange={(e) => setMetaKeyword(e.target.value)}
                        placeholder="Enter Comma Saperated keyword"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
                        {t.settingsPage.metaDescription}
                      </label>
                      <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Enter Meta Description"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* WiFi Settings Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t.settingsPage.wifiSettings}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                          {t.settingsPage.showWiFiIcon}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t.settingsPage.showWiFiIconDesc}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setShowWiFiIcon(!showWiFiIcon)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            showWiFiIcon ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ backgroundColor: showWiFiIcon ? theme.themeColor : undefined }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              showWiFiIcon ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                        {t.settingsPage.wifiName}
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {t.settingsPage.wifiNameDesc}
                      </p>
                      <input
                        type="text"
                        value={wifiName}
                        onChange={(e) => setWifiName(e.target.value)}
                        placeholder="e.g., Restaurant_WiFi"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 block">
                        {t.settingsPage.wifiPassword}
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {t.settingsPage.wifiPasswordDesc}
                      </p>
                      <input
                        type="password"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="Enter WiFi password"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    className="px-2.5 py-1.5 text-xs text-white rounded-lg transition-colors"
                    style={{ backgroundColor: theme.themeColor }}
                  >
                    {t.save}
                  </button>
                </div>
              </>
            )}

            {/* Customize Header Sub-tab Content */}
            {customerSiteSubTab === "customizeHeader" && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t.settingsPage.customizeHeaderTab}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Content for this section is coming soon...
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Receipt Tab Content */}
        {activeTab === "receipt" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.receipt}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.settingsPage.receiptSubtitle}
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Left Column - Customer Information & Order Details */}
              <div className="space-y-4">
                {/* Customer Information */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    {t.settingsPage.customerInformation}
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowCustomerName(!showCustomerName)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showCustomerName
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showCustomerName && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showCustomerName}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowCustomerAddress(!showCustomerAddress)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showCustomerAddress
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showCustomerAddress && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showCustomerAddress}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowCustomerPhone(!showCustomerPhone)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showCustomerPhone
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showCustomerPhone && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showCustomerPhone}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    {t.settingsPage.orderDetails}
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowTableNo(!showTableNo)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showTableNo
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showTableNo && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.tableNo}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowWaiterName(!showWaiterName)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showWaiterName
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showWaiterName && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showWaiterName}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowTotalGuest(!showTotalGuest)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showTotalGuest
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showTotalGuest && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showTotalGuest}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowOrderType(!showOrderType)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showOrderType
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showOrderType && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showOrderType}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - General & Payment Details */}
              <div className="space-y-4">
                {/* General */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    {t.settingsPage.general}
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowRestaurantLogo(!showRestaurantLogo)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showRestaurantLogo
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showRestaurantLogo && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showRestaurantLogo}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowRestaurantTax(!showRestaurantTax)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showRestaurantTax
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showRestaurantTax && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showRestaurantTax}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    {t.settingsPage.paymentDetails}
                  </h3>
                  <div className="space-y-3">
                    {/* Upload Payment QR Code */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t.settingsPage.uploadPaymentQRCode}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setPaymentQRCode(event.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        {paymentQRCode && (
                          <button
                            onClick={() => setPaymentQRCode(null)}
                            className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {t.remove}
                          </button>
                        )}
                      </div>
                      {paymentQRCode && (
                        <div className="mt-2">
                          <img
                            src={paymentQRCode}
                            alt="Payment QR Code"
                            className="w-24 h-24 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t.settingsPage.qrCodeDescription}
                          </p>
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowPaymentQRCode(!showPaymentQRCode)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showPaymentQRCode
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showPaymentQRCode && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showPaymentQRCode}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showPaymentDetails
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showPaymentDetails && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showPaymentDetails}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowPaymentStatus(!showPaymentStatus)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          showPaymentStatus
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {showPaymentStatus && (
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.showPaymentStatus}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {t.settingsPage.previewReceipt}
              </button>
              <button
                onClick={handleSave}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.save}
              </button>
            </div>
          </>
        )}

        {/* Printer Tab Content */}
        {activeTab === "printer" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.printer}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.settingsPage.printerSubtitle}
              </p>
            </div>

            {/* Desktop App Required Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <Info className="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    {t.settingsPage.desktopAppRequired}
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t.settingsPage.desktopAppRequiredDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Add Printer Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddPrinterModal(true)}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5"
                style={{
                  background: `linear-gradient(to right, ${theme.themeColor}, ${theme.themeColor}dd)`,
                }}
              >
                <Plus className="size-3.5" />
                {t.settingsPage.addPrinter}
              </button>
            </div>

            {/* Printer Cards */}
            <div className="space-y-4 mb-6">
              {/* Default Printer Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Printer className="size-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                          {t.settingsPage.defaultPrinter}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          Default
                        </span>
                      </div>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                        {t.active}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t.edit}
                    </button>
                    <button className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t.settingsPage.deactivate}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t.settingsPage.kitchens} (1):
                    </span>
                    <ul className="ml-4 mt-1">
                      <li className="text-xs text-gray-700 dark:text-gray-300 list-disc">
                        {t.settingsPage.defaultKitchen}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t.settingsPage.orders} (1):
                    </span>
                    <ul className="ml-4 mt-1">
                      <li className="text-xs text-gray-700 dark:text-gray-300 list-disc">
                        {t.settingsPage.defaultPosTerminal}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t.settingsPage.printingChoice}:
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="size-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {t.settingsPage.browserPopupPrint}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop App Connection Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="size-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                  {t.settingsPage.desktopAppConnection}
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.domainURL}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={domainURL}
                      onChange={(e) => setDomainURL(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://tabletrack.froid.works"
                    />
                    <button className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.apiKey}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setAPIKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <Copy className="size-3.5" />
                    </button>
                    <button className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
                      <X className="size-3.5" />
                      {t.settingsPage.resetBranchKey}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {t.settingsPage.instructions}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700 dark:text-blue-300">
                  <li>{t.settingsPage.downloadDesktopAppInstruction1}</li>
                  <li>{t.settingsPage.downloadDesktopAppInstruction2}</li>
                  <li>{t.settingsPage.downloadDesktopAppInstruction3}</li>
                  <li>{t.settingsPage.downloadDesktopAppInstruction4}</li>
                </ol>
              </div>
            </div>

            {/* Download Desktop App Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="size-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                  {t.settingsPage.downloadDesktopApp}
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Windows */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Monitor className="size-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {t.settingsPage.windows}
                        <span className="px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          {t.settingsPage.yourDevice}
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {t.settingsPage.downloadDesktopForWindows}
                      </p>
                    </div>
                  </div>
                  <button className="w-full px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <Download className="size-4" />
                    {t.settingsPage.downloadForWindows}
                  </button>
                </div>

                {/* macOS */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Apple className="size-6 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                        {t.settingsPage.macOS}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {t.settingsPage.downloadDesktopForMacOS}
                      </p>
                    </div>
                  </div>
                  <button className="w-full px-3 py-2 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <Download className="size-4" />
                    {t.settingsPage.downloadForMacOS}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delivery Tab Content */}
        {activeTab === "delivery" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.delivery}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.settingsPage.deliverySubtitle}
              </p>
            </div>

            {/* Warning Banner */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6 flex items-center justify-between">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {t.settingsPage.deliveryWarning}
              </p>
              <button className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors font-medium">
                Branch 12
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6">
              {/* Fee Details Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">
                  {t.settingsPage.feeDetails}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Fee Calculation Method */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.feeCalculationMethod}
                    </label>
                    <select
                      value={feeCalculationMethod}
                      onChange={(e) => setFeeCalculationMethod(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option>{t.settingsPage.fixedRate}</option>
                    </select>
                  </div>

                  {/* Distance Unit */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.distanceUnit}
                    </label>
                    <select
                      value={distanceUnit}
                      onChange={(e) => setDistanceUnit(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option>{t.settingsPage.kilometersKm}</option>
                    </select>
                  </div>

                  {/* Maximum Delivery Radius */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.maximumDeliveryRadius}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={maximumDeliveryRadius}
                        onChange={(e) => setMaximumDeliveryRadius(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                        km
                      </span>
                    </div>
                  </div>

                  {/* Fixed Fee */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.fixedFee}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fixedFee}
                        onChange={(e) => setFixedFee(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                        ₼
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free Delivery Options Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">
                  {t.settingsPage.freeDeliveryOptions}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Free Delivery Over Amount */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.freeDeliveryOverAmount}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={freeDeliveryOverAmount}
                        onChange={(e) => setFreeDeliveryOverAmount(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                        ₼
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      {t.settingsPage.leaveEmptyToDisable}
                    </p>
                  </div>

                  {/* Free Delivery Within Radius */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.freeDeliveryWithinRadius}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={freeDeliveryWithinRadius}
                        onChange={(e) => setFreeDeliveryWithinRadius(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                        km
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      {t.settingsPage.leaveEmptyToDisable}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Schedule Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">
                  {t.settingsPage.deliverySchedule}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Delivery Home Text */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.deliveryHomeText}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={deliveryHomeTime}
                        onChange={(e) => setDeliveryHomeTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent pr-9"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      {t.settingsPage.makeSureTimeRange}
                    </p>
                  </div>

                  {/* Delivery close End */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.deliveryCloseEnd}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={deliveryCloseTime}
                        onChange={(e) => setDeliveryCloseTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent pr-9"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Time Estimation Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">
                  {t.settingsPage.deliveryTimeEstimation}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Average Speed of Delivery Rider */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.averageSpeedOfDeliveryRider}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={averageSpeed}
                        onChange={(e) => setAverageSpeed(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                        {t.settingsPage.minh}
                      </span>
                    </div>
                  </div>

                  {/* Additional Time Buffer */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.additionalTimeBuffer}
                    </label>
                    <input
                      type="text"
                      value={additionalTimeBuffer}
                      onChange={(e) => setAdditionalTimeBuffer(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      {t.settingsPage.notAdvisableToAddTooMuchTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={handleSave}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.save}
              </button>
            </div>
          </>
        )}

        {/* KOT Tab Content */}
        {activeTab === "kot" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.kot}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.settingsPage.kotSubtitle}
              </p>
            </div>

            {/* Enable Item Level Status */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setEnableItemLevelStatus(!enableItemLevelStatus)}
                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                    enableItemLevelStatus
                      ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {enableItemLevelStatus && (
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
                  <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                    {t.settingsPage.enableItemLevelStatus}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t.settingsPage.enableItemLevelStatusDesc}
                  </div>
                </div>
              </label>
            </div>

            {/* Default KOT Status */}
            <div>
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">
                {t.settingsPage.defaultKOTStatus}
              </h2>

              {/* Cards Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* POS Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-purple-50 dark:bg-purple-900/20">
                    <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      {t.settingsPage.pos}
                    </h3>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    {/* Pending Status */}
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <button
                        type="button"
                        onClick={() => setPosPendingStatus(!posPendingStatus)}
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          posPendingStatus
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {posPendingStatus && (
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
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          {t.settingsPage.pending}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t.settingsPage.pendingDesc}
                        </div>
                      </div>
                    </label>

                    {/* Cooking Status */}
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <button
                        type="button"
                        onClick={() => setPosCookingStatus(!posCookingStatus)}
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          posCookingStatus
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {posCookingStatus && (
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
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          {t.settingsPage.cooking}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t.settingsPage.cookingDesc}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Customer Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-purple-50 dark:bg-purple-900/20">
                    <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      {t.settingsPage.customerTab}
                    </h3>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    {/* Pending Status */}
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <button
                        type="button"
                        onClick={() => setCustomerPendingStatus(!customerPendingStatus)}
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          customerPendingStatus
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {customerPendingStatus && (
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
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          {t.settingsPage.pending}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t.settingsPage.pendingDesc}
                        </div>
                      </div>
                    </label>

                    {/* Cooking Status */}
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <button
                        type="button"
                        onClick={() => setCustomerCookingStatus(!customerCookingStatus)}
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                          customerCookingStatus
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {customerCookingStatus && (
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
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          {t.settingsPage.cooking}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t.settingsPage.cookingDesc}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-start gap-3 mt-6">
              <button
                onClick={handleSave}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.save}
              </button>
            </div>
          </>
        )}

        {/* Cancellation Reasons Tab Content */}
        {activeTab === "cancellationReasons" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.cancellationReasons}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.settingsPage.cancellationReasonsSubtitle}
              </p>
            </div>

            {/* Content Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              {/* Header with Add Button */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-gray-900 dark:text-white">
                    {t.settingsPage.cancellationReasons}
                  </h2>
                  <button
                    onClick={handleAddCancellationReason}
                    className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {t.add}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        {t.settingsPage.reason}
                      </th>
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        {t.settingsPage.cancellationTypes}
                      </th>
                      <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        {t.settingsPage.action}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {cancellationReasons.map((reason) => (
                      <tr
                        key={reason.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs text-gray-900 dark:text-white">
                          {reason.reason}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {reason.types.includes("order") && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded">
                                Order
                              </span>
                            )}
                            {reason.types.includes("kot") && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded">
                                KOT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {reason.isDefault ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t.settingsPage.default}
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditCancellationReason(reason)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  {t.settingsPage.update}
                                </button>
                                <button
                                  onClick={() => handleDeleteCancellationReason(reason.id)}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Refund Reasons Tab Content */}
        {activeTab === "refundReasons" && (
          <>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {t.settingsPage.refundReasons}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.settingsPage.refundReasonsSubtitle}
              </p>
            </div>

            {/* Content Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              {/* Header with Add Button */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-gray-900 dark:text-white">
                    {t.settingsPage.refundReasons}
                  </h2>
                  <button
                    onClick={handleAddRefundReason}
                    className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {t.add}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        {t.settingsPage.reason}
                      </th>
                      <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        {t.settingsPage.action}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {refundReasons.map((reason) => (
                      <tr key={reason.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 text-xs text-gray-900 dark:text-white">
                          {reason.reason}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditRefundReason(reason)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              {t.settingsPage.update}
                            </button>
                            <button
                              onClick={() => handleDeleteRefundReason(reason.id)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== "general" && activeTab !== "app" && activeTab !== "operationalShifts" && activeTab !== "branch" && activeTab !== "currencies" && activeTab !== "email" && activeTab !== "taxes" && activeTab !== "theme" && activeTab !== "roles" && activeTab !== "billing" && activeTab !== "reservation" && activeTab !== "aboutUs" && activeTab !== "customerSite" && activeTab !== "receipt" && activeTab !== "printer" && activeTab !== "delivery" && activeTab !== "kot" && activeTab !== "cancellationReasons" && activeTab !== "refundReasons" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {tabs.find((tab) => tab.key === activeTab)?.label ||
                  secondRowTabs.find((tab) => tab.key === activeTab)?.label}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Content for this section is coming soon...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Cancellation Reason Modal */}
      {showCancellationReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCancellationReason ? t.settingsPage.update : t.add} {t.settingsPage.cancellationReasons}
                </h2>
                <button
                  onClick={() => setShowCancellationReasonModal(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="size-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                {/* Reason Text */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.reason}
                  </label>
                  <input
                    type="text"
                    value={cancellationReasonText}
                    onChange={(e) => setCancellationReasonText(e.target.value)}
                    placeholder="Enter cancellation reason"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Cancellation Types */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.settingsPage.cancellationTypes}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cancellationReasonTypes.includes("order")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCancellationReasonTypes([...cancellationReasonTypes, "order"]);
                          } else {
                            setCancellationReasonTypes(cancellationReasonTypes.filter(t => t !== "order"));
                          }
                        }}
                        className="size-4 rounded border-gray-300 dark:border-gray-700 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-900 dark:text-white">Order</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cancellationReasonTypes.includes("kot")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCancellationReasonTypes([...cancellationReasonTypes, "kot"]);
                          } else {
                            setCancellationReasonTypes(cancellationReasonTypes.filter(t => t !== "kot"));
                          }
                        }}
                        className="size-4 rounded border-gray-300 dark:border-gray-700 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-900 dark:text-white">KOT</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setShowCancellationReasonModal(false)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveCancellationReason}
                  className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Refund Reason Modal */}
      {showRefundReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingRefundReason ? t.settingsPage.update : t.add} {t.settingsPage.refundReasons}
                </h2>
                <button
                  onClick={() => setShowRefundReasonModal(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="size-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                {/* Reason Text */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.settingsPage.reason}
                  </label>
                  <input
                    type="text"
                    value={refundReasonText}
                    onChange={(e) => setRefundReasonText(e.target.value)}
                    placeholder="Enter refund reason"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setShowRefundReasonModal(false)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveRefundReason}
                  className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Printer Modal */}
      {showAddPrinterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.settingsPage.addPrinter}
                </h2>
                <button
                  onClick={() => setShowAddPrinterModal(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="size-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.titleToIdentifyPrinter}
                    </label>
                    <input
                      type="text"
                      value={printerName}
                      onChange={(e) => setPrinterName(e.target.value)}
                      placeholder={t.settingsPage.addPrinterName}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Printing Choice */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.settingsPage.printingChoice}
                    </label>
                    <select
                      value={printingChoice}
                      onChange={(e) => setPrintingChoice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option>{t.settingsPage.browserPopupPrint}</option>
                    </select>
                  </div>
                </div>

                {/* Select Kitchen */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                    {t.settingsPage.selectKitchen}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                    {t.settingsPage.selectKitchenDescription}
                  </p>
                  <div className="space-y-2">
                    {/* Default Kitchen */}
                    <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedKitchens.includes("default")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedKitchens([...selectedKitchens, "default"]);
                            } else {
                              setSelectedKitchens(selectedKitchens.filter(k => k !== "default"));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
                          style={{ accentColor: theme.themeColor }}
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {t.settingsPage.defaultKitchen}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">
                          {t.settingsPage.assigned}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {t.settingsPage.defaultPrinter}
                        </span>
                      </div>
                    </label>

                    {/* Veg Kitchen */}
                    <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedKitchens.includes("veg")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedKitchens([...selectedKitchens, "veg"]);
                            } else {
                              setSelectedKitchens(selectedKitchens.filter(k => k !== "veg"));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
                          style={{ accentColor: theme.themeColor }}
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {t.settingsPage.vegKitchen}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                        {t.settingsPage.idle}
                      </span>
                    </label>

                    {/* Non-Veg Kitchen */}
                    <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedKitchens.includes("nonveg")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedKitchens([...selectedKitchens, "nonveg"]);
                            } else {
                              setSelectedKitchens(selectedKitchens.filter(k => k !== "nonveg"));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
                          style={{ accentColor: theme.themeColor }}
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {t.settingsPage.nonVegKitchen}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                        {t.settingsPage.idle}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Select POS Terminal */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                    {t.settingsPage.selectPosTerminal}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                    {t.settingsPage.selectPosTerminalDescription}
                  </p>
                  <div className="space-y-2">
                    {/* Default POS Terminal */}
                    <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="posTerminal"
                          checked={selectedPosTerminals.includes("default")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPosTerminals(["default"]);
                            }
                          }}
                          className="w-4 h-4 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
                          style={{ accentColor: theme.themeColor }}
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {t.settingsPage.defaultPosTerminal}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                        {t.settingsPage.idle}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Is Default */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefaultPrinter}
                    onChange={(e) => setIsDefaultPrinter(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
                    style={{ accentColor: theme.themeColor }}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {t.settingsPage.isDefault}
                  </span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setShowAddPrinterModal(false)}
                  className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    // Save printer logic here
                    setShowAddPrinterModal(false);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors"
                  style={{
                    background: `linear-gradient(to right, ${theme.themeColor}, ${theme.themeColor}dd)`,
                  }}
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}