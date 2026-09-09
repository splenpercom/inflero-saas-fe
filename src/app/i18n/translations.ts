export type Language = "en" | "az" | "ru";

export interface Translations {
  // Common
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  remove: string;
  edit: string;
  add: string;
  search: string;
  filter: string;
  export: string;
  
  // Navigation
  dashboard: string;
  menu: string;
  menus: string;
  menuItems: string;
  itemCategories: string;
  itemCategory: string;
  addItemCategory: string;
  searchItemCategory: string;
  modifierGroups: string;
  itemModifiers: string;
  addModifierGroup: string;
  groupName: string;
  options: string;
  tables: string;
  areas: string;
  qrCodes: string;
  waiterRequests: string;
  reservations: string;
  pos: string;
  goToPOS: string;
  orders: string;
  kot: string;
  kotFull: string;
  kitchenKOT: string;
  customers: string;
  staff: string;
  deliveryExecutive: string;
  people: string;
  employees: string;
  expenses: string;
  expenseCategories: string;
  payments: string;
  duePayments: string;
  reports: string;
  salesReport: string;
  itemReport: string;
  categoryReport: string;
  deliveryAppReport: string;
  expenseReport: string;
  canceledOrderReport: string;
  removedQOTItemReport: string;
  taxReport: string;
  refundReport: string;
  cashRegister: string;
  inventory: string;
  kitchen: string;
  settings: string;
  customerSite: string;
  selectBranch: string;
  back: string;
  
  // Header
  ordersBadge: string;
  reservationsBadge: string;
  requestsBadge: string;
  daysLeft: string;
  displayOptions: string;
  customerDisplayScreen: string;
  customerOrderBoard: string;
  myProfile: string;
  accountSettings: string;
  logout: string;
  backToDashboard: string;
  
  // Dashboard
  welcomeMessage: string;
  totalSalesToday: string;
  totalOrdersToday: string;
  activeTables: string;
  occupied: string;
  pending: string;
  newReservations: string;
  today: string;
  salesOverview: string;
  ordersByCategory: string;
  latestOrders: string;
  latestReservations: string;
  latestPayments: string;
  
  // Dashboard - New
  statistics: string;
  todaysOrders: string;
  todaysEarnings: string;
  todaysCustomer: string;
  averageDailyEarnings: string;
  salesThisMonth: string;
  sinceYesterday: string;
  sincePreviousMonth: string;
  paymentMethodToday: string;
  todaysOrdersTitle: string;
  orderServed: string;
  orderConfirmed: string;
  orderPlaced: string;
  dineIn: string;
  delivery: string;
  orderDate: string;
  topSellingDishToday: string;
  topSellingTablesToday: string;
  items: string;
  paid: string;
  billed: string;
  shop: string;
  buyOnEnvato: string;
  
  // Order statuses
  completed: string;
  inProgress: string;
  confirmed: string;
  
  // Payment methods
  card: string;
  cash: string;
  
  // Days
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
  
  // Categories
  mainCourse: string;
  appetizers: string;
  desserts: string;
  beverages: string;
  
  // Other
  table: string;
  tableNo: string;
  guests: string;
  sales: string;
  order: string;
  minsAgo: string;
  
  // Menus Page
  searchYourMenu: string;
  assignMenuToTable: string;
  organizeMenuItems: string;
  addMenu: string;
  addMenuItem: string;
  update: string;
  itemName: string;
  price: string;
  menuName: string;
  isAvailable: string;
  showOnCustomerSite: string;
  action: string;
  actions: string;
  showFilters: string;
  bulkUpload: string;
  searchMenuItem: string;
  itemCount: string;
  noMenusCreated: string;
  createYourFirstMenu: string;
  hideFilters: string;
  bulk: string;
  assignMenu: string;
  noMenuItemsFound: string;
  noMenuItemsInMenu: string;
  addYourFirstMenuItem: string;
  deleteMenu: string;
  deleteMenuConfirm: string;
  yesDelete: string;
  deleteMenuItem: string;
  deleteMenuItemConfirm: string;
  
  // Add Menu Modal
  addMenuTitle: string;
  addMenuDescription: string;
  selectLanguage: string;
  menuNameEnglish: string;
  menuNameAzerbaijani: string;
  menuNamePlaceholder: string;
  english: string;
  azerbaijani: string;
  
  // Assign Menu to Table Modal
  assignMenuToTableTitle: string;
  selectTable: string;
  select: string;
  active: string;
  close: string;
  
  // Menu Items Page
  addMenuItemDescription: string;
  productInformation: string;
  pricingDetails: string;
  itemName: string;
  itemDescription: string;
  itemNamePlaceholder: string;
  itemDescriptionPlaceholder: string;
  chooseMenu: string;
  categoryName: string;
  selectItemCategory: string;
  itemType: string;
  veg: string;
  nonVeg: string;
  egg: string;
  drink: string;
  halal: string;
  other: string;
  preparationTime: string;
  preparationTimePlaceholder: string;
  itemImage: string;
  chooseFile: string;
  supportedFormats: string;
  hasVariations: string;
  hasVariationsHelp: string;
  variations: string;
  addAnotherVariation: string;
  variationNamePlaceholder: string;
  variationName: string;
  defaultDelivery: string;
  editMenuItem: string;
  updateItem: string;
  backToMenus: string;
  editMenuItemDescription: string;
  orderTypesPricing: string;
  dineIn: string;
  minutes: string;
  requiredField: string;
  
  // Add Modifier Group Modal
  addModifierGroupTitle: string;
  addModifierGroupDescription: string;
  modifierNameEnglish: string;
  modifierNamePlaceholder: string;
  descriptionEnglish: string;
  descriptionPlaceholder: string;
  locations: string;
  locationsSelected: string;
  selectMenuItem: string;
  locationsHelpText: string;
  modifierOptions: string;
  option: string;
  optionNameEnglish: string;
  optionNamePlaceholder: string;
  defaultPrice: string;
  orderTypesPricing: string;
  deliveryPlatforms: string;
  baseDeliveryPrice: string;
  addModifierOption: string;
  pickup: string;
  
  // Pricing
  dineInPrice: string;
  pickupPrice: string;
  deliveryPrice: string;
  
  // Item Modifiers Page
  itemModifiersPage: string;
  searchItemModifier: string;
  addItemModifier: string;
  editItemModifier: string;
  modifierGroup: string;
  isRequired: string;
  allowMultipleSelection: string;
  optional: string;
  required: string;
  yes: string;
  no: string;
  noModifiersFound: string;
  enterItemName: string;
  enterModifierGroup: string;
  deleteModifier: string;
  deleteModifierConfirm: string;
  
  // Areas Page
  allAreas: string;
  areaName: string;
  noOfTables: string;
  addArea: string;
  searchArea: string;
  
  // Tables Page
  tableView: string;
  list: string;
  grid: string;
  layout: string;
  filterByAvailability: string;
  addTable: string;
  lounge: string;
  roofTop: string;
  garden: string;
  tableLabel: string;
  assignWaiter: string;
  seats: string;
  available: string;
  running: string;
  reserved: string;
  
  // QR Codes Page
  qrCodesPage: string;
  downloadQR: string;
  copyQR: string;
  regenerateQR: string;
  multipleChoice: string;
  
  // Reservations Page
  reservationsPage: string;
  newReservation: string;
  newReservationDescription: string;
  assignTableDescription: string;
  currentWeek: string;
  to: string;
  searchByNameEmailPhone: string;
  assignTable: string;
  notes: string;
  noNotes: string;
  
  // POS Page
  posPage: string;
  filterByMenu: string;
  filterByCategory: string;
  reset: string;
  orderType: string;
  takeaway: string;
  change: string;
  addCustomerDetails: string;
  orderNumber: string;
  mergeTables: string;
  selectWaiter: string;
  addNote: string;
  addDiscount: string;
  saveAsDraft: string;
  kotAndPrint: string;
  kotBillPrintPayment: string;
  bill: string;
  billAndPayment: string;
  billAndPrint: string;
  displayingAllItems: string;
  pax: string;
  subTotal: string;
  total: string;
  cancelled: string;
  
  // Staff Page
  staffPage: {
    title: string;
    searchPlaceholder: string;
    export: string;
    addMember: string;
    memberName: string;
    emailAddress: string;
    role: string;
    action: string;
    update: string;
    cannotChangeOwnRole: string;
    noStaffFound: string;
    addNewMember: string;
    enterName: string;
    enterEmail: string;
    password: string;
    enterPassword: string;
    cancel: string;
    confirmDelete: string;
  };
  
  // Delivery Executive Page
  deliveryExecutivePage: {
    title: string;
    searchPlaceholder: string;
    export: string;
    addExecutive: string;
    memberName: string;
    phone: string;
    uniqueCode: string;
    totalOrders: string;
    status: string;
    action: string;
    update: string;
    noExecutivesFound: string;
    addNewExecutive: string;
    enterName: string;
    enterPhone: string;
    enterUniqueCode: string;
    password: string;
    enterPassword: string;
    cancel: string;
    confirmDelete: string;
    orders: string;
    showing: string;
    to: string;
    of: string;
    results: string;
  };
  
  // Expenses Page
  expensesPage: {
    title: string;
    searchPlaceholder: string;
    showFilters: string;
    addExpense: string;
    expenseTitle: string;
    category: string;
    amount: string;
    expenseDate: string;
    paymentStatus: string;
    paymentDate: string;
    dueDate: string;
    paymentMethod: string;
    action: string;
    update: string;
    paid: string;
    pending: string;
    cancelled: string;
    creditCard: string;
    cash: string;
    bankTransfer: string;
    noExpensesFound: string;
    addNewExpense: string;
    enterTitle: string;
    selectCategory: string;
    enterAmount: string;
    selectDate: string;
    selectPaymentMethod: string;
    cancel: string;
    confirmDelete: string;
    rent: string;
    equipment: string;
    utilities: string;
    salary: string;
    other: string;
  };
  
  // Expense Categories Page
  expenseCategoriesPage: {
    title: string;
    searchPlaceholder: string;
    addCategory: string;
    categoryName: string;
    description: string;
    action: string;
    update: string;
    noCategoriesFound: string;
    addNewCategory: string;
    enterCategoryName: string;
    enterDescription: string;
    cancel: string;
    confirmDelete: string;
    rent: string;
    rentDesc: string;
    utilities: string;
    utilitiesDesc: string;
    salaries: string;
    salariesDesc: string;
    ingredients: string;
    ingredientsDesc: string;
    equipment: string;
    equipmentDesc: string;
    marketing: string;
    marketingDesc: string;
    insurance: string;
    insuranceDesc: string;
    maintenance: string;
    maintenanceDesc: string;
  };
  
  // Payments Page
  paymentsPage: {
    title: string;
    searchPlaceholder: string;
    export: string;
    id: string;
    amount: string;
    paymentMethod: string;
    transactionId: string;
    order: string;
    dateTime: string;
    action: string;
    refund: string;
    card: string;
    upi: string;
    cash: string;
    bankTransfer: string;
    noPaymentsFound: string;
    ago: string;
  };
  
  // Orders Page
  ordersPage: {
    title: string;
    autoRefresh: string;
    seconds: string;
    all: string;
    allDeliveryApps: string;
    today: string;
    yesterday: string;
    thisWeek: string;
    thisMonth: string;
    custom: string;
    to: string;
    showAllOrders: string;
    showAllWaiter: string;
    businessDayInfo: string;
    newOrder: string;
    mergeOrder: string;
    order: string;
    paid: string;
    pending: string;
    cancelled: string;
    pos: string;
    delivery: string;
    dineIn: string;
    orderDate: string;
    items: string;
    noOrders: string;
    buyOnEmrato: string;
    // Order Detail
    table: string;
    setOrderStatus: string;
    orderPlaced: string;
    orderConfirmed: string;
    orderPreparing: string;
    foodIsReady: string;
    orderServed: string;
    cancelOrder: string;
    moveToOrderConfirmed: string;
    itemName: string;
    qty: string;
    price: string;
    amount: string;
    subTotal: string;
    sgst: string;
    cgst: string;
    total: string;
    balanceReturned: string;
    print: string;
    close: string;
    paymentMethod: string;
    dateTime: string;
    card: string;
  };
  
  // KOT Page
  kotPage: {
    title: string;
    allKitchens: string;
    today: string;
    to: string;
    pending: string;
    inKitchen: string;
    foodIsReady: string;
    cancelled: string;
    order: string;
    orderDate: string;
    pendingConfirmation: string;
    startCooking: string;
    markReady: string;
    cancel: string;
    itemName: string;
    noKOTs: string;
    printKOT: string;
    waiter: string;
  };
  
  // Sales Report Page
  salesReportPage: {
    title: string;
    subtitle: string;
    totalSales: string;
    orders: string;
    traditionalPayments: string;
    paymentGateways: string;
    additionalAmounts: string;
    taxBreakdown: string;
    outstandingPayments: string;
    outstandingOrders: string;
    cash: string;
    card: string;
    upi: string;
    bankTransfer: string;
    totalCharges: string;
    totalTaxes: string;
    discount: string;
    tip: string;
    taxMode: string;
    totalTaxCollection: string;
    sgst: string;
    cgst: string;
    date: string;
    totalOrdersColumn: string;
    taxesFromActualBreakdown: string;
    totalTaxAmount: string;
    paymentMethods: string;
    due: string;
    deliveryFee: string;
    total: string;
    totalExcludingTip: string;
    currentWeek: string;
    allUsers: string;
    export: string;
    to: string;
    order: string;
  };

  // Item Report Page
  itemReportPage: {
    title: string;
    subtitle: string;
    sumOfTotalRevenue: string;
    totalQuantitySold: string;
    searchPlaceholder: string;
    export: string;
    itemName: string;
    itemCategoryName: string;
    quantitySold: string;
    sellingPrice: string;
    totalRevenue: string;
    currentWeek: string;
    to: string;
  };

  // Category Report Page
  categoryReportPage: {
    title: string;
    subtitle: string;
    itemCategory: string;
    quantitySold: string;
    amount: string;
    currentWeek: string;
    to: string;
    export: string;
  };

  // Tax Report Page
  taxReportPage: {
    title: string;
    subtitle: string;
    todayTaxSummary: string;
    todayTaxCollection: string;
    todayOrders: string;
    todayRevenue: string;
    totalTaxes: string;
    totalRevenue: string;
    totalOrders: string;
    totalItemsSold: string;
    today: string;
    to: string;
    taxBreakdownByTaxType: string;
    taxBreakdownByDate: string;
    taxDetailsByOrder: string;
    taxName: string;
    taxRate: string;
    totalTaxAmount: string;
    itemsCount: string;
    ordersCount: string;
    total: string;
    export: string;
    salesDateFor: string;
    timePeriod: string;
  };

  // Refund Report Page
  refundReportPage: {
    title: string;
    subtitle: string;
    totalRefunds: string;
    totalRefundAmount: string;
    totalOriginalAmount: string;
    commissionAdjustment: string;
    currentWeek: string;
    to: string;
    searchPlaceholder: string;
    allRefundTypes: string;
    export: string;
    date: string;
    order: string;
    refundType: string;
    refundReason: string;
    processedBy: string;
    originalPrice: string;
    refundedAmount: string;
    resalePrice: string;
    deliveryApp: string;
    inventoryChange: string;
    noRecordFound: string;
    salesDataFrom: string;
    timePeriodEachDay: string;
  };

  // Delivery App Report Page
  deliveryAppReportPage: {
    title: string;
    subtitle: string;
    totalOrders: string;
    totalRevenue: string;
    totalCommission: string;
    totalDeliveryFees: string;
    netRevenue: string;
    currentWeek: string;
    to: string;
    allDeliveryApps: string;
    deliveryApp: string;
    avgOrderValue: string;
    commissionRate: string;
    noDeliveryAppOrders: string;
    salesDataFrom: string;
    timePeriodEachDay: string;
  };

  // Removed KOT Item Report Page
  removedKOTItemReportPage: {
    title: string;
    subtitle: string;
    totalRemovedItems: string;
    totalRemovedAmount: string;
    topCancellationReasons: string;
    topWaiters: string;
    noDataAvailable: string;
    currentWeek: string;
    to: string;
    allUsers: string;
    allCancellationReasons: string;
    export: string;
    kotNumber: string;
    orderNumber: string;
    removedBy: string;
    itemName: string;
    quantity: string;
    table: string;
    cancellationReason: string;
    removedDate: string;
    totalPrice: string;
    noRemovedKOTItems: string;
  };

  // Expense Report Page
  expenseReportPage: {
    title: string;
    outstandingPaymentTab: string;
    expenseSummaryTab: string;
    currentWeek: string;
    to: string;
    export: string;
    paymentDue: string;
    dueDate: string;
    paymentStatus: string;
    total: string;
    pending: string;
    paid: string;
    category: string;
    totalExpense: string;
    percentageOfTotal: string;
    noOutstandingPayments: string;
    noExpenseSummary: string;
  };

  // Cancelled Order Report Page
  cancelledOrderReportPage: {
    title: string;
    subtitle: string;
    totalCancelledOrders: string;
    totalCancelledAmount: string;
    topCancelledReasons: string;
    noDataAvailable: string;
    currentWeek: string;
    to: string;
    allCancellationReasons: string;
    allUsers: string;
    export: string;
    orderNumber: string;
    orderDate: string;
    cancelledDate: string;
    customer: string;
    tableWaiter: string;
    cancellationReason: string;
    cancelledBy: string;
    orderTotal: string;
    noCancelledOrders: string;
  };

  // Settings Page
  settingsPage: {
    title: string;
    cashRegister: string;
    inventory: string;
    kitchen: string;
    general: string;
    app: string;
    operationalShifts: string;
    branch: string;
    currencies: string;
    email: string;
    taxes: string;
    payment: string;
    theme: string;
    roles: string;
    billing: string;
    reservation: string;
    aboutUs: string;
    customerSite: string;
    receipt: string;
    printer: string;
    delivery: string;
    kot: string;
    cancellationReasons: string;
    order: string;
    refundReasons: string;
    kiosk: string;
    receiptSubtitle: string;
    customerInformation: string;
    showCustomerName: string;
    showCustomerAddress: string;
    showCustomerPhone: string;
    orderDetails: string;
    showWaiterName: string;
    showTotalGuest: string;
    showOrderType: string;
    showRestaurantLogo: string;
    showRestaurantTax: string;
    uploadPaymentQRCode: string;
    showPaymentQRCode: string;
    showPaymentDetails: string;
    showPaymentStatus: string;
    qrCodeDescription: string;
    previewReceipt: string;
    // Printer Tab
    printerSubtitle: string;
    configurePrinterSettings: string;
    desktopAppRequired: string;
    desktopAppRequiredDescription: string;
    addPrinter: string;
    printerTitle: string;
    titleToIdentifyPrinter: string;
    addPrinterName: string;
    printingChoice: string;
    browserPopupPrint: string;
    selectKitchen: string;
    selectKitchenDescription: string;
    defaultKitchen: string;
    vegKitchen: string;
    nonVegKitchen: string;
    assigned: string;
    defaultPrinter: string;
    idle: string;
    selectPosTerminal: string;
    selectPosTerminalDescription: string;
    defaultPosTerminal: string;
    isDefault: string;
    deactivate: string;
    kitchens: string;
    orders: string;
    desktopAppConnection: string;
    domainURL: string;
    apiKey: string;
    resetBranchKey: string;
    instructions: string;
    downloadDesktopApp: string;
    downloadDesktopAppInstruction1: string;
    downloadDesktopAppInstruction2: string;
    downloadDesktopAppInstruction3: string;
    downloadDesktopAppInstruction4: string;
    windows: string;
    macOS: string;
    yourDevice: string;
    downloadForWindows: string;
    downloadForMacOS: string;
    downloadDesktopForWindows: string;
    downloadDesktopForMacOS: string;
    // Delivery Tab
    deliverySubtitle: string;
    deliveryWarning: string;
    feeDetails: string;
    feeCalculationMethod: string;
    fixedRate: string;
    distanceUnit: string;
    kilometersKm: string;
    maximumDeliveryRadius: string;
    fixedFee: string;
    leaveEmptyToDisable: string;
    freeDeliveryOptions: string;
    freeDeliveryOverAmount: string;
    freeDeliveryWithinRadius: string;
    deliverySchedule: string;
    deliveryHomeText: string;
    deliveryCloseEnd: string;
    makeSureTimeRange: string;
    deliveryTimeEstimation: string;
    averageSpeedOfDeliveryRider: string;
    minh: string;
    additionalTimeBuffer: string;
    notAdvisableToAddTooMuchTime: string;
    // KOT Tab
    kotSubtitle: string;
    enableItemLevelStatus: string;
    enableItemLevelStatusDesc: string;
    defaultKOTStatus: string;
    pos: string;
    customerTab: string;
    pending: string;
    pendingDesc: string;
    cooking: string;
    cookingDesc: string;
    // Cancellation Reasons Tab
    cancellationReasonsSubtitle: string;
    reason: string;
    cancellationTypes: string;
    update: string;
    confirmDelete: string;
    restaurantClosingEarly: string;
    other: string;
    customerChangedMind: string;
    customerRequestedToCancel: string;
    paymentIssues: string;
    customerNoLongerWantsOrder: string;
    ingredientNotAvailable: string;
    preparationTimeTooLong: string;
    qualityIssueWithIngredients: string;
    systemErrorTechnicalIssue: string;
    itemPreparedButReturned: string;
    itemDeliveredButRejected: string;
    mistakeInOrder: string;
    productQualityIssue: string;
    generalSubtitle: string;
    restaurantName: string;
    restaurantPhoneNumber: string;
    restaurantEmailAddress: string;
    restaurantAddress: string;
    select: string;
    showTaxIdOnOrders: string;
    taxID: string;
    addMore: string;
    noTaxFound: string;
    additionalCharges: string;
    addCharge: string;
    chargeName: string;
    type: string;
    rate: string;
    orderType: string;
    action: string;
    noChargeFound: string;
    presetAmounts: string;
    buyOnEnvato: string;
    // App Tab
    appSubtitle: string;
    countryTimezoneCurrency: string;
    country: string;
    timeFormat: string;
    dateFormat: string;
    timeZone: string;
    currency: string;
    customerSiteLanguage: string;
    hideTopNavigation: string;
    hideTodaysOrders: string;
    hideTodaysOrdersDesc: string;
    hideNewReservation: string;
    hideNewReservationDesc: string;
    hideNewWaiterRequest: string;
    hideNewWaiterRequestDesc: string;
    // Operational Shifts Tab
    operationalShiftsSubtitle: string;
    selectBranchLabel: string;
    shiftsFor: string;
    addShift: string;
    noShiftsConfigured: string;
    noShiftsMessage: string;
    addFirstShift: string;
    howItWorks: string;
    howItWorksPoint1: string;
    howItWorksPoint2: string;
    howItWorksPoint3: string;
    howItWorksPoint4: string;
    // Branch Tab
    branchSubtitle: string;
    addBranch: string;
    branchName: string;
    branchAddress: string;
    cannotDeleteCurrentBranch: string;
    // Currencies Tab
    currenciesSubtitle: string;
    addCurrency: string;
    currencyName: string;
    currencySymbol: string;
    currencyFormatSample: string;
    cannotDeleteDefaultCurrency: string;
    // Email Tab
    emailSubtitle: string;
    notification: string;
    newOrderReceived: string;
    newOrderReceivedDesc: string;
    reservationConfirmation: string;
    reservationConfirmationDesc: string;
    newReservationReceived: string;
    newReservationReceivedDesc: string;
    orderBill: string;
    orderBillDesc: string;
    staffWelcomeEmail: string;
    staffWelcomeEmailDesc: string;
    emailNotifications: string;
    emailTemplates: string;
    noTemplateFound: string;
    // Taxes Tab
    taxesSubtitle: string;
    taxSettings: string;
    allTaxes: string;
    taxMode: string;
    orderLevelTax: string;
    orderLevelTaxDesc: string;
    itemLevelTax: string;
    itemLevelTaxDesc: string;
    taxCalculationBase: string;
    taxCalculationBaseDesc: string;
    includeServiceCharges: string;
    includeServiceChargesDesc: string;
    includeServiceChargesFormula: string;
    excludeServiceCharges: string;
    excludeServiceChargesDesc: string;
    excludeServiceChargesFormula: string;
    allTaxesApplicable: string;
    addTax: string;
    taxName: string;
    taxPercent: string;
    // Theme Tab
    themeSubtitle: string;
    logo: string;
    uploadLogoForRestaurant: string;
    uploadLogo: string;
    logoSupportedFormats: string;
    favicon: string;
    uploadFaviconFor: string;
    generateFavicon: string;
    uploadFaviconPhone: string;
    uploadFaviconTablet: string;
    uploadFaviconDesktop: string;
    upload: string;
    themeColor: string;
    selectThemeColor: string;
    restaurant: string;
    fresh: string;
    warm: string;
    refresh: string;
    // Roles Tab
    rolesSubtitle: string;
    manageRole: string;
    userPermission: string;
    role: string;
    branchHead: string;
    waiter: string;
    chef: string;
    menu: string;
    createMenu: string;
    showMenu: string;
    updateMenu: string;
    deleteMenu: string;
    menuItem: string;
    createMenuItem: string;
    showMenuItem: string;
    updateMenuItem: string;
    deleteMenuItem: string;
    itemCategory: string;
    createItemCategory: string;
    showItemCategory: string;
    updateItemCategory: string;
    deleteItemCategory: string;
    area: string;
    createArea: string;
    showArea: string;
    updateArea: string;
    deleteArea: string;
    table: string;
    createTable: string;
    showTable: string;
    updateTable: string;
    deleteTable: string;
    reservationPerm: string;
    createReservation: string;
    showReservation: string;
    updateReservation: string;
    deleteReservation: string;
    kotPerm: string;
    manageKOT: string;
    orderPerm: string;
    createOrder: string;
    showOrder: string;
    updateOrder: string;
    deleteOrder: string;
    addDiscountOnPOS: string;
    customer: string;
    createCustomer: string;
    showCustomer: string;
    updateCustomer: string;
    deleteCustomer: string;
    staff: string;
    createStaffMember: string;
    showStaffMember: string;
    updateStaffMember: string;
    deleteStaffMember: string;
    paymentPerm: string;
    showPayments: string;
    report: string;
    showReports: string;
    settings: string;
    manageSettings: string;
    deliveryExecutive: string;
    createDeliveryExecutive: string;
    showDeliveryExecutive: string;
    updateDeliveryExecutive: string;
    deleteDeliveryExecutive: string;
    waiterRequest: string;
    manageWaiterRequest: string;
    expenses: string;
    createExpenses: string;
    showExpenses: string;
    updateExpenses: string;
    deleteExpenses: string;
    createExpenseCategory: string;
    showExpenseCategory: string;
    updateExpenseCategory: string;
    deleteExpenseCategory: string;
    // Manage Role Modal
    manageRoleModal: string;
    roleColumn: string;
    actionColumn: string;
    defaultRoleCannotBeDeleted: string;
    addNewRole: string;
    displayName: string;
    enterDisplayName: string;
    copyPermissionsFromRole: string;
    dontCopyPermissions: string;
    cancel: string;
    createRole: string;
    // Billing Tab
    billingSubtitle: string;
    planDetails: string;
    purchaseHistory: string;
    offlineRequest: string;
    currentPlanName: string;
    currentPlanType: string;
    licenseExpiresOn: string;
    daysLeft: string;
    additionalFeatures: string;
    changeBranch: string;
    exportReport: string;
    tableReservation: string;
    paymentGatewayIntegration: string;
    themeSetting: string;
    customerDisplay: string;
    upgradePlan: string;
    package: string;
    billingCycle: string;
    paymentDate: string;
    nextPaymentDate: string;
    transactionId: string;
    paymentGateway: string;
    amount: string;
    packageDetails: string;
    offline: string;
    paymentBy: string;
    created: string;
    status: string;
    noOfflinePaymentRequestFound: string;
    // Reservation Tab
    reservationSubtitle: string;
    reservationSettings: string;
    enableAdminReservations: string;
    enableAdminReservationsDesc: string;
    enableCustomerReservations: string;
    enableCustomerReservationsDesc: string;
    minimumPartySize: string;
    minimumPartySizeDesc: string;
    disableSlotMinutes: string;
    disableSlotMinutesDesc: string;
    minutes: string;
    timeSlotsSettings: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    slotType: string;
    startTime: string;
    endTime: string;
    timeSlotDifference: string;
    available: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    // About Us Tab
    aboutUsSubtitle: string;
    // Customer Site Tab
    customerSiteSubtitle: string;
    customizeHeaderTab: string;
    orderSettings: string;
    allowCustomerOrders: string;
    allowCustomerOrdersDesc: string;
    customerLoginRequired: string;
    customerLoginRequiredDesc: string;
    allowQROrders: string;
    allowQROrdersDesc: string;
    pickupDaysRange: string;
    enableTipCustomerSite: string;
    enableTipCustomerSiteDesc: string;
    enableTipPOS: string;
    enableTipPOSDesc: string;
    autoConfirmOrderStatus: string;
    autoConfirmOrderStatusDesc: string;
    showVeg: string;
    showVegDesc: string;
    showHalal: string;
    showHalalDesc: string;
    callWaiterSettings: string;
    enableWaiterRequest: string;
    enableWaiterRequestDesc: string;
    onMobile: string;
    onMobileDesc: string;
    onDesktop: string;
    onDesktopDesc: string;
    onlyWhenOpenViaQR: string;
    onlyWhenOpenViaQRDesc: string;
    dineInSettings: string;
    tableRequiredForDineIn: string;
    tableRequiredForDineInDesc: string;
    defaultTableReservationStatus: string;
    defaultTableReservationStatusDesc: string;
    pwaSettings: string;
    enablePWA: string;
    enablePWADesc: string;
    tableSettings: string;
    tableLockTimeout: string;
    tableLockTimeoutDesc: string;
    socialMediaLinks: string;
    facebookLink: string;
    instagramLink: string;
    twitterLink: string;
    yelpLink: string;
    seo: string;
    metaKeyword: string;
    metaDescription: string;
    wifiSettings: string;
    showWiFiIcon: string;
    showWiFiIconDesc: string;
    wifiName: string;
    wifiNameDesc: string;
    wifiPassword: string;
    wifiPasswordDesc: string;
  };

  // Waiter Requests Page
  waiterRequestsPage: {
    title: string;
    autoRefresh: string;
    seconds: string;
    table: string;
    markAttended: string;
    doItLater: string;
    newWaiterRequestFor: string;
    secondsAgo: string;
  };

  // Customers Page
  customersPage: {
    title: string;
    searchPlaceholder: string;
    import: string;
    export: string;
    addCustomer: string;
    customerName: string;
    emailAddress: string;
    phone: string;
    totalOrders: string;
    action: string;
    orders: string;
    update: string;
    noCustomersFound: string;
    showing: string;
    to: string;
    of: string;
    results: string;
  };

  // Products Page
  productsPage: {
    title: string;
    searchPlaceholder: string;
    allCategories: string;
    allBrands: string;
    exportPDF: string;
    exportCSV: string;
    import: string;
    refresh: string;
    addProduct: string;
    sku: string;
    productName: string;
    category: string;
    brand: string;
    price: string;
    unit: string;
    qty: string;
    createdBy: string;
    actions: string;
    importProducts: string;
    step1: string;
    downloadDemoFile: string;
    downloadDemoCSV: string;
    downloadDemoDesc: string;
    step2: string;
    uploadYourFile: string;
    clickToUpload: string;
    dragAndDrop: string;
    csvFiles: string;
    importing: string;
    close: string;
    productList: string;
    generated: string;
    computers: string;
    electronics: string;
    shoes: string;
    furnitures: string;
    bags: string;
    phones: string;
    productsImported: string;
    quantity: string;
  };

  // Registration Flow
  registrationFlow: {
    corporateRegistration: string;
    selectBillingPlan: string;
    monthly: string;
    annual: string;
    savePercent: string;
    corporatePlan: string;
    fullFeaturedSystem: string;
    perMonth: string;
    perBranch: string;
    annualPayment: string;
    perYear: string;
    saveAmount: string;
    start: string;
    selected: string;
    continueBtn: string;
    numberOfBranches: string;
    howManyLocations: string;
    branch: string;
    branches: string;
    businessInformation: string;
    tellUsAboutBusiness: string;
    businessName: string;
    businessNamePlaceholder: string;
    ownerName: string;
    ownerNamePlaceholder: string;
    address: string;
    addressPlaceholder: string;
    contactInformation: string;
    howCanWeReach: string;
    emailAddress: string;
    emailPlaceholder: string;
    phoneNumber: string;
    phonePlaceholder: string;
    confirmation: string;
    reviewInformation: string;
    totalAmount: string;
    calculation: string;
    billingType: string;
    monthlyPayment: string;
    annualPaymentMonthly: string;
    annualTotal: string;
    annualSavings: string;
    packageDetails: string;
    plan: string;
    billingPeriod: string;
    numberOfBranchesLabel: string;
    pricePerBranch: string;
    businessDetails: string;
    businessNameLabel: string;
    ownerLabel: string;
    emailLabel: string;
    phoneLabel: string;
    completeRegistration: string;
    termsText: string;
    back: string;
    stepOf: string;
    complete: string;
    pleaseSelectPackage: string;
    pleaseSelectBranches: string;
    pleaseFillRequired: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common
    loading: "Loading",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    remove: "Remove",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    export: "Export",
    
    // Navigation
    dashboard: "Dashboard",
    menu: "Menu",
    menus: "Menus",
    menuItems: "Menu Items",
    itemCategories: "Item Categories",
    itemCategory: "Item Category",
    addItemCategory: "Add Item Category",
    searchItemCategory: "Search your item category here",
    modifierGroups: "Modifier Groups",
    itemModifiers: "Item Modifiers",
    addModifierGroup: "Add Modifier Group",
    groupName: "Group Name",
    options: "Options",
    tables: "Tables",
    areas: "Areas",
    qrCodes: "QR Codes",
    waiterRequests: "Waiter Requests",
    reservations: "Bookings",
    pos: "POS",
    goToPOS: "Go to POS",
    orders: "Orders",
    kot: "KOT",
    kotFull: "KOT (Kitchen Order Tickets)",
    kitchenKOT: "Kitchen KOT",
    customers: "Customers",
    staff: "Staff",
    deliveryExecutive: "Delivery Executive",
    people: "People",
    employees: "Employees",
    expenses: "Expenses",
    expenseCategories: "Expense Categories",
    payments: "Payments",
    duePayments: "Due Payments",
    reports: "Reports",
    salesReport: "Sales Report",
    itemReport: "Item Report",
    categoryReport: "Category Report",
    deliveryAppReport: "Delivery App Report",
    expenseReport: "Expense Report",
    canceledOrderReport: "Canceled Order Report",
    removedQOTItemReport: "Removed KOT Item Report",
    taxReport: "Tax Report",
    refundReport: "Refund Report",
    cashRegister: "Cash Register",
    inventory: "Inventory",
    kitchen: "Kitchen",
    settings: "Settings",
    customerSite: "Customer Site",
    selectBranch: "Select Branch",
    back: "Back",
    
    // Header
    ordersBadge: "Orders",
    reservationsBadge: "Bookings",
    requestsBadge: "Requests",
    daysLeft: "days left",
    displayOptions: "Display Options",
    customerDisplayScreen: "Customer Display Screen",
    customerOrderBoard: "Customer Order Board",
    myProfile: "My Profile",
    accountSettings: "Account Settings",
    logout: "Logout",
    backToDashboard: "Back to Dashboard",
    
    // Dashboard
    welcomeMessage: "Welcome back! Here's what's happening today.",
    totalSalesToday: "Total Sales Today",
    totalOrdersToday: "Total Orders Today",
    activeTables: "Active Tables",
    occupied: "Occupied",
    pending: "Pending",
    newReservations: "New Bookings",
    today: "Today",
    salesOverview: "Sales Overview",
    ordersByCategory: "Orders by Category",
    latestOrders: "Latest Orders",
    latestReservations: "Latest Bookings",
    latestPayments: "Latest Payments",
    
    // Dashboard - New
    statistics: "Statistics",
    todaysOrders: "Today's Orders",
    todaysEarnings: "Today's Earnings",
    todaysCustomer: "Today's Customers",
    averageDailyEarnings: "Average Daily Earnings",
    salesThisMonth: "Sales This Month",
    sinceYesterday: "Since Yesterday",
    sincePreviousMonth: "Since Previous Month",
    paymentMethodToday: "Payment Method Today",
    todaysOrdersTitle: "Today's Orders",
    orderServed: "Order Served",
    orderConfirmed: "Order Confirmed",
    orderPlaced: "Order Placed",
    dineIn: "Dine In",
    delivery: "Delivery",
    orderDate: "Order Date",
    topSellingDishToday: "Top Selling Dish (Today)",
    topSellingTablesToday: "Top Selling Tables (Today)",
    items: "Items",
    paid: "Paid",
    billed: "Billed",
    shop: "Shop",
    buyOnEnvato: "Buy on Envato",
    
    // Order statuses
    completed: "Completed",
    inProgress: "In Progress",
    confirmed: "Confirmed",
    
    // Payment methods
    card: "Card",
    cash: "Cash",
    
    // Days
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
    
    // Categories
    mainCourse: "Main Course",
    appetizers: "Appetizers",
    desserts: "Desserts",
    beverages: "Beverages",
    
    // Other
    table: "Table",
    tableNo: "Table no.",
    guests: "guests",
    sales: "sales",
    order: "Order",
    minsAgo: "mins ago",
    
    // Menus Page
    searchYourMenu: "Search Your Menu",
    assignMenuToTable: "Assign Menu to Table",
    organizeMenuItems: "Organize Menu Items",
    addMenu: "Add Menu",
    addMenuItem: "Add Menu Item",
    update: "Update",
    price: "Price",
    menuName: "Menu Name",
    isAvailable: "Is Available",
    showOnCustomerSite: "Show on Customer Site",
    action: "Action",
    actions: "Actions",
    showFilters: "Show Filters",
    bulkUpload: "Bulk Upload",
    searchMenuItem: "Search Menu Item",
    itemCount: "Item Count",
    noMenusCreated: "No menus created yet",
    createYourFirstMenu: "Create Your First Menu",
    hideFilters: "Hide Filters",
    bulk: "Bulk",
    assignMenu: "Assign Menu",
    noMenuItemsFound: "No menu items found matching your search",
    noMenuItemsInMenu: "No menu items in this menu yet",
    addYourFirstMenuItem: "Add Your First Menu Item",
    deleteMenu: "Delete Menu",
    deleteMenuConfirm: "Are you sure you want to delete this menu? This action cannot be undone.",
    yesDelete: "Yes, Delete",
    deleteMenuItem: "Delete Menu Item",
    deleteMenuItemConfirm: "Are you sure you want to delete this menu item? This action cannot be undone.",
    
    // Add Menu Modal
    addMenuTitle: "Add Menu",
    addMenuDescription: "Add a new menu to your restaurant.",
    selectLanguage: "Select Language",
    menuNameEnglish: "Menu Name (English)",
    menuNameAzerbaijani: "Menu Name (Azerbaijani)",
    menuNamePlaceholder: "Enter menu name",
    english: "English",
    azerbaijani: "Azerbaijani",
    
    // Assign Menu to Table Modal
    assignMenuToTableTitle: "Assign Menu to Table",
    selectTable: "Select Table",
    select: "Select",
    active: "Active",
    close: "Close",
    
    // Menu Items Page
    addMenuItemDescription: "Add a new menu item to your restaurant.",
    productInformation: "Product Information",
    pricingDetails: "Pricing Details",
    itemName: "Item Name",
    itemDescription: "Item Description",
    itemNamePlaceholder: "Enter item name",
    itemDescriptionPlaceholder: "Enter item description",
    chooseMenu: "Choose Menu",
    categoryName: "Category Name",
    selectItemCategory: "Select Item Category",
    itemType: "Item Type",
    veg: "Veg",
    nonVeg: "Non Veg",
    egg: "Egg",
    drink: "Drink",
    halal: "Halal",
    other: "Other",
    preparationTime: "Preparation Time",
    preparationTimePlaceholder: "Minutes",
    itemImage: "Item Image",
    chooseFile: "Choose File",
    supportedFormats: "Supported formats: PNG, JPG, GIF, SVG. Maximum size: 2MB - Recommended size: 300 x 300 pixels",
    hasVariations: "Has Variations",
    hasVariationsHelp: "Enable this if the item has multiple variations with different prices (e.g., size, flavor)",
    variations: "Variations",
    addAnotherVariation: "Add Another Variation",
    variationNamePlaceholder: "Variation name (e.g., Small, Medium, Large)",
    variationName: "Variation Name",
    defaultDelivery: "Default Delivery",
    editMenuItem: "Edit Menu Item",
    updateItem: "Update Item",
    backToMenus: "Back to Menus",
    editMenuItemDescription: "Update the details below to edit this menu item.",
    orderTypesPricing: "Order Types Pricing",
    minutes: "Minutes",
    requiredField: "*",
    
    // Add Modifier Group Modal
    addModifierGroupTitle: "Add Modifier Group",
    addModifierGroupDescription: "Add a new modifier group to your restaurant.",
    modifierNameEnglish: "Modifier Name (English)",
    modifierNamePlaceholder: "Enter modifier name",
    descriptionEnglish: "Description (English)",
    descriptionPlaceholder: "Enter description",
    locations: "Locations",
    locationsSelected: "Locations Selected",
    selectMenuItem: "Select Menu Item",
    locationsHelpText: "Select the locations where this modifier group will be available.",
    modifierOptions: "Modifier Options",
    option: "Option",
    optionNameEnglish: "Option Name (English)",
    optionNamePlaceholder: "Enter option name",
    defaultPrice: "Default Price",
    deliveryPlatforms: "Delivery Platforms",
    baseDeliveryPrice: "Base Delivery Price",
    addModifierOption: "Add Modifier Option",
    pickup: "Pickup",
    
    // Pricing
    dineInPrice: "Dine In Price",
    pickupPrice: "Pickup Price",
    deliveryPrice: "Delivery Price",
    
    // Item Modifiers Page
    itemModifiersPage: "Item Modifiers",
    searchItemModifier: "Search Item Modifier",
    addItemModifier: "Add Item Modifier",
    editItemModifier: "Edit Item Modifier",
    modifierGroup: "Modifier Group",
    isRequired: "Is Required",
    allowMultipleSelection: "Allow Multiple Selection",
    optional: "Optional",
    required: "Required",
    yes: "Yes",
    no: "No",
    noModifiersFound: "No modifiers found",
    enterItemName: "Enter item name",
    enterModifierGroup: "Enter modifier group",
    deleteModifier: "Delete Modifier",
    deleteModifierConfirm: "Are you sure you want to delete this modifier? This action cannot be undone.",
    
    // Areas Page
    allAreas: "All Areas",
    areaName: "Area Name",
    noOfTables: "Number of Tables",
    addArea: "Add Area",
    searchArea: "Search Area",
    
    // Tables Page
    tableView: "Table View",
    list: "List",
    grid: "Grid",
    layout: "Layout",
    filterByAvailability: "Filter by Availability",
    addTable: "Add Table",
    lounge: "Lounge",
    roofTop: "Roof Top",
    garden: "Garden",
    tableLabel: "Table",
    assignWaiter: "Assign Waiter",
    seats: "Seats",
    available: "Available",
    running: "Running",
    reserved: "Reserved",
    
    // QR Codes Page
    qrCodesPage: "QR Codes",
    downloadQR: "Download QR",
    copyQR: "Copy QR",
    regenerateQR: "Regenerate QR",
    multipleChoice: "Multiple Choice",
    
    // Reservations Page
    reservationsPage: "Bookings",
    newReservation: "New Booking",
    newReservationDescription: "Fill in the details to create a new booking.",
    assignTableDescription: "Select a table to assign to this booking.",
    currentWeek: "Current Week",
    to: "To",
    searchByNameEmailPhone: "Search by name, email or phone number",
    assignTable: "Assign Table",
    notes: "Notes",
    noNotes: "No notes",
    
    // POS Page
    posPage: "Point of Sale",
    filterByMenu: "Filter by Menu",
    filterByCategory: "Filter by Category",
    reset: "Reset",
    orderType: "Order Type",
    takeaway: "Takeaway",
    change: "Change",
    addCustomerDetails: "Add Customer Details",
    orderNumber: "Order #",
    mergeTables: "Merge Tables",
    selectWaiter: "Select Waiter",
    addNote: "Add Note",
    addDiscount: "Add Discount",
    saveAsDraft: "Save as Draft",
    kotAndPrint: "KOT & Print",
    kotBillPrintPayment: "KOT, Bill, Print & Payment",
    bill: "BILL",
    billAndPayment: "Bill & Payment",
    billAndPrint: "Bill & Print",
    displayingAllItems: "Displaying all items",
    pax: "Pax",
    subTotal: "Sub Total",
    total: "Total",
    cancelled: "Cancelled",
    
    // Staff Page
    staffPage: {
      title: "Staff",
      searchPlaceholder: "Search staff member",
      export: "Export",
      addMember: "Add Member",
      memberName: "Member Name",
      emailAddress: "Email Address",
      role: "Role",
      action: "Action",
      update: "Update",
      cannotChangeOwnRole: "You cannot change your own role",
      noStaffFound: "No staff found",
      addNewMember: "Add New Member",
      enterName: "Enter Name",
      enterEmail: "Enter Email",
      password: "Password",
      enterPassword: "Enter Password",
      cancel: "Cancel",
      confirmDelete: "Confirm Delete",
    },
    
    // Delivery Executive Page
    deliveryExecutivePage: {
      title: "Delivery Executives",
      searchPlaceholder: "Search delivery executive",
      export: "Export",
      addExecutive: "Add Executive",
      memberName: "Name",
      phone: "Phone",
      uniqueCode: "Unique Code",
      totalOrders: "Total Orders",
      status: "Status",
      action: "Action",
      update: "Update",
      noExecutivesFound: "No delivery executives found",
      addNewExecutive: "Add New Executive",
      enterName: "Enter Name",
      enterPhone: "Enter Phone",
      enterUniqueCode: "Enter Unique Code",
      password: "Password",
      enterPassword: "Enter Password",
      cancel: "Cancel",
      confirmDelete: "Confirm Delete",
      orders: "Orders",
      showing: "Showing",
      to: "to",
      of: "of",
      results: "results",
    },
    
    // Expenses Page
    expensesPage: {
      title: "Expenses",
      searchPlaceholder: "Search expenses",
      showFilters: "Show Filters",
      addExpense: "Add Expense",
      expenseTitle: "Expense Title",
      category: "Category",
      amount: "Amount",
      expenseDate: "Expense Date",
      paymentStatus: "Payment Status",
      paymentDate: "Payment Date",
      dueDate: "Due Date",
      paymentMethod: "Payment Method",
      action: "Action",
      update: "Update",
      paid: "Paid",
      pending: "Pending",
      cancelled: "Cancelled",
      creditCard: "Credit Card",
      cash: "Cash",
      bankTransfer: "Bank Transfer",
      noExpensesFound: "No expenses found",
      addNewExpense: "Add New Expense",
      enterTitle: "Enter Title",
      selectCategory: "Select Category",
      enterAmount: "Enter Amount",
      selectDate: "Select Date",
      selectPaymentMethod: "Select Payment Method",
      cancel: "Cancel",
      confirmDelete: "Confirm Delete",
      rent: "Rent",
      equipment: "Equipment",
      utilities: "Utilities",
      salary: "Salary",
      other: "Other",
    },
    
    // Expense Categories Page
    expenseCategoriesPage: {
      title: "Expense Categories",
      searchPlaceholder: "Search expense categories",
      addCategory: "Add Category",
      categoryName: "Category Name",
      description: "Description",
      action: "Action",
      update: "Update",
      noCategoriesFound: "No expense categories found",
      addNewCategory: "Add New Category",
      enterCategoryName: "Enter Category Name",
      enterDescription: "Enter Description",
      cancel: "Cancel",
      confirmDelete: "Confirm Delete",
      rent: "Rent",
      rentDesc: "Rent expenses for the restaurant",
      utilities: "Utilities",
      utilitiesDesc: "Utility expenses for the restaurant",
      salaries: "Salaries",
      salariesDesc: "Salaries for the staff",
      ingredients: "Ingredients",
      ingredientsDesc: "Ingredients for the restaurant",
      equipment: "Equipment",
      equipmentDesc: "Equipment expenses for the restaurant",
      marketing: "Marketing",
      marketingDesc: "Marketing expenses for the restaurant",
      insurance: "Insurance",
      insuranceDesc: "Insurance expenses for the restaurant",
      maintenance: "Maintenance",
      maintenanceDesc: "Maintenance expenses for the restaurant",
    },
    
    // Payments Page
    paymentsPage: {
      title: "Payments",
      searchPlaceholder: "Search payments",
      export: "Export",
      id: "ID",
      amount: "Amount",
      paymentMethod: "Payment Method",
      transactionId: "Transaction ID",
      order: "Order",
      dateTime: "Date & Time",
      action: "Action",
      refund: "Refund",
      card: "Card",
      upi: "UPI",
      cash: "Cash",
      bankTransfer: "Bank Transfer",
      noPaymentsFound: "No payments found",
      ago: "ago",
    },
    
    // Orders Page
    ordersPage: {
      title: "Orders",
      autoRefresh: "Auto Refresh",
      seconds: "seconds",
      all: "All",
      allDeliveryApps: "All Delivery Apps",
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      thisMonth: "This Month",
      custom: "Custom",
      to: "To",
      showAllOrders: "Show All Orders",
      showAllWaiter: "Show All Waiter",
      businessDayInfo: "Business Day Information",
      newOrder: "New Order",
      mergeOrder: "Merge Order",
      order: "Order",
      paid: "PAID",
      pending: "PENDING",
      cancelled: "CANCELLED",
      pos: "POS",
      delivery: "DELIVERY",
      dineIn: "DINE IN",
      orderDate: "Order Date",
      items: "Item(s)",
      noOrders: "No orders found",
      buyOnEmrato: "Buy on Emrato",
      // Order Detail
      table: "Table",
      setOrderStatus: "Set Order Status",
      orderPlaced: "Order Placed",
      orderConfirmed: "Order Confirmed",
      orderPreparing: "Order Preparing",
      foodIsReady: "Food is Ready",
      orderServed: "Order Served",
      cancelOrder: "Cancel Order",
      moveToOrderConfirmed: "Move to Order Confirmed",
      itemName: "ITEM NAME",
      qty: "QTY",
      price: "PRICE",
      amount: "AMOUNT",
      subTotal: "Sub Total",
      sgst: "SGST (2.5%)",
      cgst: "CGST (2.5%)",
      total: "Total",
      balanceReturned: "Balance Returned",
      print: "PRINT",
      close: "Close",
      paymentMethod: "PAYMENT METHOD",
      dateTime: "DATE & TIME",
      card: "Card",
    },
    
    // KOT Page
    kotPage: {
      title: "All Kitchen KOT",
      allKitchens: "All Kitchens",
      today: "Today",
      to: "To",
      pending: "Pending",
      inKitchen: "In Kitchen",
      foodIsReady: "Food is Ready",
      cancelled: "Cancelled",
      order: "Order",
      orderDate: "Order Date",
      pendingConfirmation: "PENDING CONFIRMATION",
      startCooking: "Start Cooking",
      markReady: "Mark Ready",
      cancel: "Cancel",
      itemName: "ITEM NAME",
      noKOTs: "No KOTs found",
      printKOT: "Print KOT",
      waiter: "Waiter",
    },
    
    // Sales Report Page
    salesReportPage: {
      title: "Sales Report",
      subtitle: "Sales Report for the selected period",
      totalSales: "Total Sales",
      orders: "Orders",
      traditionalPayments: "Traditional Payments",
      paymentGateways: "Payment Gateways",
      additionalAmounts: "Additional Amounts",
      taxBreakdown: "Tax Breakdown",
      outstandingPayments: "Outstanding Payments",
      outstandingOrders: "Outstanding Orders",
      cash: "Cash",
      card: "Card",
      upi: "UPI",
      bankTransfer: "Bank Transfer",
      totalCharges: "Total Charges",
      totalTaxes: "Total Taxes",
      discount: "Discount",
      tip: "Tip",
      taxMode: "Tax Mode",
      totalTaxCollection: "Total Tax Collection",
      sgst: "SGST",
      cgst: "CGST",
      date: "Date",
      totalOrdersColumn: "Total Orders",
      taxesFromActualBreakdown: "Taxes from Actual Breakdown",
      totalTaxAmount: "Total Tax Amount",
      paymentMethods: "Payment Methods",
      due: "Due",
      deliveryFee: "Delivery Fee",
      total: "Total",
      totalExcludingTip: "Total Excluding Tip",
      currentWeek: "Current Week",
      allUsers: "All Users",
      export: "Export",
      to: "to",
      order: "Order",
    },

    // Item Report Page
    itemReportPage: {
      title: "Item Report",
      subtitle: "Item Report for the selected period",
      sumOfTotalRevenue: "Sum of Total Revenue",
      totalQuantitySold: "Total Quantity Sold",
      searchPlaceholder: "Search item name",
      export: "Export",
      itemName: "Item Name",
      itemCategoryName: "Item Category Name",
      quantitySold: "Quantity Sold",
      sellingPrice: "Selling Price",
      totalRevenue: "Total Revenue",
      currentWeek: "Current Week",
      to: "to",
    },

    // Category Report Page
    categoryReportPage: {
      title: "Category Report",
      subtitle: "Category Report for the selected period",
      itemCategory: "Item Category",
      quantitySold: "Quantity Sold",
      amount: "Amount",
      currentWeek: "Current Week",
      to: "to",
      export: "Export",
    },

    // Tax Report Page
    taxReportPage: {
      title: "Tax Report",
      subtitle: "Tax Report for the selected period",
      todayTaxSummary: "Today's Tax Summary",
      todayTaxCollection: "Today's Tax Collection",
      todayOrders: "Today's Orders",
      todayRevenue: "Today's Revenue",
      totalTaxes: "Total Taxes",
      totalRevenue: "Total Revenue",
      totalOrders: "Total Orders",
      totalItemsSold: "Total Items Sold",
      today: "Today",
      to: "to",
      taxBreakdownByTaxType: "Tax Breakdown by Tax Type",
      taxBreakdownByDate: "Tax Breakdown by Date",
      taxDetailsByOrder: "Tax Details by Order",
      taxName: "Tax Name",
      taxRate: "Tax Rate",
      totalTaxAmount: "Total Tax Amount",
      itemsCount: "Items Count",
      ordersCount: "Orders Count",
      total: "Total",
      export: "Export",
      salesDateFor: "Sales Date for",
      timePeriod: "Time Period",
    },

    // Refund Report Page
    refundReportPage: {
      title: "Refund Report",
      subtitle: "Refund Report for the selected period",
      totalRefunds: "Total Refunds",
      totalRefundAmount: "Total Refund Amount",
      totalOriginalAmount: "Total Original Amount",
      commissionAdjustment: "Commission Adjustment",
      currentWeek: "Current Week",
      to: "to",
      searchPlaceholder: "Search refund type",
      allRefundTypes: "All Refund Types",
      export: "Export",
      date: "Date",
      order: "Order",
      refundType: "Refund Type",
      refundReason: "Refund Reason",
      processedBy: "Processed By",
      originalPrice: "Original Price",
      refundedAmount: "Refunded Amount",
      resalePrice: "Resale Price",
      deliveryApp: "Delivery App",
      inventoryChange: "Inventory Change",
      noRecordFound: "No Record Found",
      salesDataFrom: "Sales Data From",
      timePeriodEachDay: "Time Period Each Day",
    },

    // Delivery App Report Page
    deliveryAppReportPage: {
      title: "Delivery App Report",
      subtitle: "Delivery App Report for the selected period",
      totalOrders: "Total Orders",
      totalRevenue: "Total Revenue",
      totalCommission: "Total Commission",
      totalDeliveryFees: "Total Delivery Fees",
      netRevenue: "Net Revenue",
      currentWeek: "Current Week",
      to: "to",
      allDeliveryApps: "All Delivery Apps",
      deliveryApp: "Delivery App",
      avgOrderValue: "Average Order Value",
      commissionRate: "Commission Rate",
      noDeliveryAppOrders: "No Delivery App Orders",
      salesDataFrom: "Sales Data From",
      timePeriodEachDay: "Time Period Each Day",
    },

    // Removed KOT Item Report Page
    removedKOTItemReportPage: {
      title: "Removed KOT Item Report",
      subtitle: "Removed KOT Item Report for the selected period",
      totalRemovedItems: "Total Removed Items",
      totalRemovedAmount: "Total Removed Amount",
      topCancellationReasons: "Top Cancellation Reasons",
      topWaiters: "Top Waiters",
      noDataAvailable: "No Data Available",
      currentWeek: "Current Week",
      to: "to",
      allUsers: "All Users",
      allCancellationReasons: "All Cancellation Reasons",
      export: "Export",
      kotNumber: "KOT Number",
      orderNumber: "Order Number",
      removedBy: "Removed By",
      itemName: "Item Name",
      quantity: "Quantity",
      table: "Table",
      cancellationReason: "Cancellation Reason",
      removedDate: "Removed Date",
      totalPrice: "Total Price",
      noRemovedKOTItems: "No Removed KOT Items",
    },

    // Expense Report Page
    expenseReportPage: {
      title: "Expense Report",
      outstandingPaymentTab: "Outstanding Payment",
      expenseSummaryTab: "Expense Summary",
      currentWeek: "Current Week",
      to: "to",
      export: "Export",
      paymentDue: "Payment Due",
      dueDate: "Due Date",
      paymentStatus: "Payment Status",
      total: "Total",
      pending: "Pending",
      paid: "Paid",
      category: "Category",
      totalExpense: "Total Expense",
      percentageOfTotal: "Percentage of Total",
      noOutstandingPayments: "No Outstanding Payments",
      noExpenseSummary: "No Expense Summary",
    },

    // Cancelled Order Report Page
    cancelledOrderReportPage: {
      title: "Cancelled Order Report",
      subtitle: "Audit report for cancelled orders showing cancellation reasons and cancelled by",
      totalCancelledOrders: "Total Cancelled Orders",
      totalCancelledAmount: "Total Cancelled Amount",
      topCancelledReasons: "Top Cancelled Reasons",
      noDataAvailable: "No data available",
      currentWeek: "Current Week",
      to: "to",
      allCancellationReasons: "All Cancellation Reasons",
      allUsers: "All Users",
      export: "Export",
      orderNumber: "Order Number",
      orderDate: "Order Date",
      cancelledDate: "Cancelled Date",
      customer: "Customer",
      tableWaiter: "Table/Waiter",
      cancellationReason: "Cancellation Reason",
      cancelledBy: "Cancelled By",
      orderTotal: "Order Total",
      noCancelledOrders: "No cancelled orders found for the selected filters",
    },

    // Settings Page
    settingsPage: {
      title: "Settings",
      cashRegister: "Cash Register",
      inventory: "Inventory",
      kitchen: "Kitchen",
      general: "General",
      app: "App",
      operationalShifts: "Operational Shifts",
      branch: "Branch",
      currencies: "Currencies",
      email: "Email",
      taxes: "Taxes",
      payment: "Payment",
      theme: "Theme",
      roles: "Roles",
      billing: "Billing",
      reservation: "Booking",
      aboutUs: "About Us",
      customerSite: "Customer Site",
      receipt: "Receipt",
      printer: "Printer",
      delivery: "Delivery",
      kot: "KOT",
      cancellationReasons: "Cancellation Reasons",
      order: "Order",
      refundReasons: "Refund Reasons",
      kiosk: "Kiosk",
      receiptSubtitle: "Customize what information appears on customer receipts.",
      customerInformation: "Customer Information",
      showCustomerName: "Show Customer Name",
      showCustomerAddress: "Show Customer Address",
      showCustomerPhone: "Show Customer Phone",
      orderDetails: "Order Details",
      showWaiterName: "Show Waiter Name",
      showTotalGuest: "Show Total guest",
      showOrderType: "Show Order Type",
      showRestaurantLogo: "Show Restaurant Logo",
      showRestaurantTax: "Show Restaurant Tax",
      uploadPaymentQRCode: "Upload Payment QR Code",
      showPaymentQRCode: "Show Payment QR Code",
      showPaymentDetails: "Show Payment Details",
      showPaymentStatus: "Show Payment Status",
      qrCodeDescription: "Supported formats: JPG, PNG, SVG, WEBP. Maximum size: 2MB. Recommended size: 200 x 200 pixels.",
      previewReceipt: "Preview Receipt",
      // Printer Tab
      printerSubtitle: "Configure printer settings for your restaurant.",
      configurePrinterSettings: "Configure printer settings for your restaurant.",
      desktopAppRequired: "Desktop App Required",
      desktopAppRequiredDescription: "For direct printing to work, you need to have the desktop app running in the background on your computer. The desktop app acts as a bridge between your web application and the physical printer.",
      addPrinter: "Add Printer",
      printerTitle: "Title (To identify printer easily)",
      titleToIdentifyPrinter: "Title (To identify printer easily)",
      addPrinterName: "Add Printer Name",
      printingChoice: "Printing Choice",
      browserPopupPrint: "Browser Popup Print",
      selectKitchen: "Select Kitchen",
      selectKitchenDescription: "Select only idle (unassigned) kitchens to assign to this printer",
      defaultKitchen: "Default Kitchen",
      vegKitchen: "Veg Kitchen",
      nonVegKitchen: "Non-Veg Kitchen",
      assigned: "Assigned",
      defaultPrinter: "Default Printer",
      idle: "Idle",
      selectPosTerminal: "Select Pos Terminal",
      selectPosTerminalDescription: "Select only idle (unassigned) POS terminals to assign to this printer",
      defaultPosTerminal: "Default POS Terminal",
      isDefault: "Is Default",
      deactivate: "Deactivate",
      kitchens: "Kitchens",
      orders: "Orders",
      desktopAppConnection: "Desktop App Connection",
      domainURL: "Domain URL",
      apiKey: "API Key",
      resetBranchKey: "Reset Branch Key",
      instructions: "Instructions:",
      downloadDesktopApp: "Download Desktop App",
      downloadDesktopAppInstruction1: "Download and install the desktop app on your computer",
      downloadDesktopAppInstruction2: "Open the desktop app and go to settings",
      downloadDesktopAppInstruction3: "Enter the Domain URL and Branch Key shown above",
      downloadDesktopAppInstruction4: "Click connect to establish the connection",
      windows: "Windows",
      macOS: "macOS",
      yourDevice: "Your Device",
      downloadForWindows: "Download for Windows",
      downloadForMacOS: "Download for macOS",
      downloadDesktopForWindows: "Download the desktop app for Windows to enable direct printing",
      downloadDesktopForMacOS: "Download the desktop app for macOS to enable direct printing",
      // Delivery Tab
      deliverySubtitle: "Configure delivery settings for your restaurant.",
      deliveryWarning: "Delivery settings require branch coordinates. Please update your branch location first.",
      feeDetails: "Fee Details",
      feeCalculationMethod: "Fee Calculation Method",
      fixedRate: "Fixed Rate",
      distanceUnit: "Distance Unit",
      kilometersKm: "Kilometers (km)",
      maximumDeliveryRadius: "Maximum Delivery Radius",
      fixedFee: "Fixed Fee",
      leaveEmptyToDisable: "Leave empty to disable this option",
      freeDeliveryOptions: "Free Delivery Options",
      freeDeliveryOverAmount: "Free Delivery Over Amount",
      freeDeliveryWithinRadius: "Free Delivery Within Radius",
      deliverySchedule: "Delivery Schedule",
      deliveryHomeText: "Delivery Home Text",
      deliveryCloseEnd: "Delivery close End",
      makeSureTimeRange: "Make sure this time range is SAME as V3 Delivery",
      deliveryTimeEstimation: "Delivery Time Estimation",
      averageSpeedOfDeliveryRider: "Average Speed of Delivery Rider",
      minh: "Min/h",
      additionalTimeBuffer: "Additional Time Buffer",
      notAdvisableToAddTooMuchTime: "Not advisable to add too much time to estimate the most possible real time, Default is 0 if not updated",
      // KOT Tab
      kotSubtitle: "Configure Kitchen Order Ticket settings for your restaurant.",
      enableItemLevelStatus: "Enable Item Level Status",
      enableItemLevelStatusDesc: "Enable this to allow statuses to be set at the item level.",
      defaultKOTStatus: "Default KOT Status",
      pos: "POS",
      customerTab: "Customer",
      pending: "Pending",
      pendingDesc: "Initial status when KOT is created and waiting to be processed",
      cooking: "Cooking",
      cookingDesc: "Status when kitchen staff is preparing the order",
      // Cancellation Reasons Tab
      cancellationReasonsSubtitle: "Manage cancellation reasons for orders and KOT items.",
      reason: "REASON",
      cancellationTypes: "CANCELLATION TYPES",
      update: "Update",
      confirmDelete: "Are you sure you want to delete this?",
      default: "Default",
      restaurantClosingEarly: "Restaurant closing early",
      other: "Other",
      customerChangedMind: "Customer changed their mind",
      customerRequestedToCancel: "Customer requested to cancel",
      paymentIssues: "Payment issues",
      customerNoLongerWantsOrder: "Customer no longer wants the order",
      ingredientNotAvailable: "Ingredient not available",
      preparationTimeTooLong: "Preparation time too long",
      qualityIssueWithIngredients: "Quality issue with ingredients",
      systemErrorTechnicalIssue: "System error/Technical issue",
      itemPreparedButReturned: "The item was prepared but returned by the customer.",
      itemDeliveredButRejected: "The item was delivered but rejected.",
      mistakeInOrder: "A mistake in the order.",
      productQualityIssue: "Product quality issue.",
      generalSubtitle: "Enter the general information about your restaurant.",
      restaurantName: "Restaurant Name",
      restaurantPhoneNumber: "Restaurant Phone Number",
      restaurantEmailAddress: "Restaurant Email Address",
      restaurantAddress: "Restaurant Address",
      select: "Select",
      showTaxIdOnOrders: "Show Tax Id on Orders",
      taxID: "Tax ID",
      addMore: "Add More",
      noTaxFound: "No Tax Found",
      additionalCharges: "Additional Charges",
      addCharge: "Add Charge",
      chargeName: "CHARGE NAME",
      type: "TYPE",
      rate: "RATE",
      orderType: "ORDER TYPE",
      action: "ACTION",
      noChargeFound: "No charge found.",
      presetAmounts: "Preset Amounts",
      buyOnEnvato: "Buy on Envato",
      // App Tab
      appSubtitle: "Configure your restaurant's regional settings and customize top navigation visibility.",
      countryTimezoneCurrency: "Restaurant's Country, Timezone & Currency",
      country: "Country",
      timeFormat: "Time Format",
      dateFormat: "Date Format",
      timeZone: "Time Zone",
      currency: "Currency",
      customerSiteLanguage: "Customer Site Language",
      hideTopNavigation: "Hide Top Navigation",
      hideTodaysOrders: "Hide Today's Orders",
      hideTodaysOrdersDesc: "Enable this to hide today's orders widget from top navigation.",
      hideNewReservation: "Hide New Booking",
      hideNewReservationDesc: "Enable this to hide new booking widget from top navigation.",
      hideNewWaiterRequest: "Hide New Waiter Request",
      hideNewWaiterRequestDesc: "Enable this to hide new waiter request widget from top navigation.",
      // Operational Shifts Tab
      operationalShiftsSubtitle: "Configure operational shifts to define business day boundaries. Orders, dashboard, and reports will use these shifts instead of calendar days.",
      selectBranchLabel: "Select Branch",
      shiftsFor: "Shifts for",
      addShift: "Add Shift",
      noShiftsConfigured: "No operational shifts configured",
      noShiftsMessage: "Get started by adding your first operational shift. The system will use calendar days (00:00 - 23:59) until shifts are configured.",
      addFirstShift: "Add first Shift",
      howItWorks: "How It Works",
      howItWorksPoint1: "Business day resets at the previous day's last shift end time (if it extends into today) or at midnight, not at the shift start time",
      howItWorksPoint2: "Orders placed during a shift belong to the calendar day the shift started on",
      howItWorksPoint3: "If no shifts are configured, the system uses calendar days (backward compatible)",
      howItWorksPoint4: "Overnight shifts (e.g., 18:00 - 02:00) are supported and belong to the starting day",
      // Branch Tab
      branchSubtitle: "Manage your restaurant branches and locations.",
      addBranch: "Add Branch",
      branchName: "BRANCH NAME",
      branchAddress: "BRANCH ADDRESS",
      cannotDeleteCurrentBranch: "Cannot delete current branch",
      // Currencies Tab
      currenciesSubtitle: "Manage currencies supported by your restaurant.",
      addCurrency: "Add Currency",
      currencyName: "CURRENCY",
      currencySymbol: "CURRENCY SYMBOL",
      currencyFormatSample: "CURRENCY FORMAT (SAMPLE: 12345.6789)",
      cannotDeleteDefaultCurrency: "Cannot Delete Default Currency",
      // Email Tab
      emailSubtitle: "Configure email notifications for various events.",
      notification: "Notification",
      newOrderReceived: "New Order Received",
      newOrderReceivedDesc: "Restaurant admin will receive an email when a new order is placed by the customer.",
      reservationConfirmation: "Booking Confirmation",
      reservationConfirmationDesc: "Customer will receive an email after making the booking.",
      newReservationReceived: "New Booking Received",
      newReservationReceivedDesc: "Restaurant admin will receive an email when a new booking is made by the customer.",
      orderBill: "Order Bill",
      orderBillDesc: "Customer will receive the order bill via email.",
      staffWelcomeEmail: "Staff Welcome Email",
      staffWelcomeEmailDesc: "Staff Member will welcome email when you add a new staff member.",
      emailNotifications: "Email Notifications",
      emailTemplates: "Email Templates",
      noTemplateFound: "No email templates found",
      // Taxes Tab
      taxesSubtitle: "Manage how taxes are applied to orders and items.",
      taxSettings: "Tax Settings",
      allTaxes: "All Taxes",
      taxMode: "Tax Mode",
      orderLevelTax: "Order-Level Tax",
      orderLevelTaxDesc: "Apply tax on the total order amount.",
      itemLevelTax: "Item-Level Tax",
      itemLevelTaxDesc: "Apply different tax rates to each item.",
      taxCalculationBase: "Tax Calculation Base",
      taxCalculationBaseDesc: "Choose how taxes should be calculated - with or without service charges included in the tax base amount.",
      includeServiceCharges: "Include service charges in tax calculation",
      includeServiceChargesDesc: "Tax will be calculated on (subtotal - discount) + service charges",
      includeServiceChargesFormula: "Tax base = (subtotal - discount) + service charges",
      excludeServiceCharges: "Exclude service charges from tax calculation",
      excludeServiceChargesDesc: "Tax will be calculated on (subtotal - discount) only",
      excludeServiceChargesFormula: "Tax base = (subtotal - discount)",
      allTaxesApplicable: "All taxes will be applicable on creating order.",
      addTax: "Add Tax",
      taxName: "TAX NAME",
      taxPercent: "TAX PERCENT",
      // Theme Tab
      themeSubtitle: "Customize the look and feel of your restaurant dashboard.",
      logo: "Logo",
      uploadLogoForRestaurant: "Upload a logo for your restaurant",
      uploadLogo: "Upload Logo",
      logoSupportedFormats: "Supported formats: PNG, PNG, JPG, GIF, SVG, JPEG. Maximum size: 5 Mb. Recommended size: 57 × 57 pixels.",
      favicon: "Favicon",
      uploadFaviconFor: "Upload a favicon for your",
      generateFavicon: "Generate favicon",
      uploadFaviconPhone: "Upload Favicon for Phone-1024x1024px",
      uploadFaviconTablet: "Upload Favicon for Tablet-512x512px",
      uploadFaviconDesktop: "Upload Favicon for Desktop-192x192px",
      upload: "Upload",
      themeColor: "Theme Color",
      selectThemeColor: "Select the theme color for your restaurant",
      restaurant: "Restaurant",
      fresh: "Fresh",
      warm: "Warm",
      refresh: "REFRESH",
      // Roles Tab
      rolesSubtitle: "Manage user roles and permissions for your restaurant staff.",
      manageRole: "Manage Role",
      userPermission: "USER PERMISSION",
      role: "ROLE",
      branchHead: "BRANCH HEAD",
      waiter: "WAITER",
      chef: "CHEF",
      menu: "MENU",
      createMenu: "Create Menu",
      showMenu: "Show Menu",
      updateMenu: "Update Menu",
      deleteMenu: "Delete Menu",
      menuItem: "MENU ITEM",
      createMenuItem: "Create Menu Item",
      showMenuItem: "Show Menu Item",
      updateMenuItem: "Update Menu Item",
      deleteMenuItem: "Delete Menu Item",
      itemCategory: "ITEM CATEGORY",
      createItemCategory: "Create Item Category",
      showItemCategory: "Show Item Category",
      updateItemCategory: "Update Item Category",
      deleteItemCategory: "Delete Item Category",
      area: "AREA",
      createArea: "Create Area",
      showArea: "Show Area",
      updateArea: "Update Area",
      deleteArea: "Delete Area",
      table: "TABLE",
      createTable: "Create Table",
      showTable: "Show Table",
      updateTable: "Update Table",
      deleteTable: "Delete Table",
      reservationPerm: "BOOKING",
      createReservation: "Create Booking",
      showReservation: "Show Booking",
      updateReservation: "Update Booking",
      deleteReservation: "Delete Booking",
      kotPerm: "KOT",
      manageKOT: "Manage KOT",
      orderPerm: "ORDER",
      createOrder: "Create Order",
      showOrder: "Show Order",
      updateOrder: "Update Order",
      deleteOrder: "Delete Order",
      addDiscountOnPOS: "Add Discount on POS",
      customer: "CUSTOMER",
      createCustomer: "Create Customer",
      showCustomer: "Show Customer",
      updateCustomer: "Update Customer",
      deleteCustomer: "Delete Customer",
      staff: "STAFF",
      createStaffMember: "Create Staff Member",
      showStaffMember: "Show Staff Member",
      updateStaffMember: "Update Staff Member",
      deleteStaffMember: "Delete Staff Member",
      paymentPerm: "PAYMENT",
      showPayments: "Show Payments",
      report: "REPORT",
      showReports: "Show Reports",
      settings: "SETTINGS",
      manageSettings: "Manage Settings",
      deliveryExecutive: "DELIVERY EXECUTIVE",
      createDeliveryExecutive: "Create Delivery Executive",
      showDeliveryExecutive: "Show Delivery Executive",
      updateDeliveryExecutive: "Update Delivery Executive",
      deleteDeliveryExecutive: "Delete Delivery Executive",
      waiterRequest: "WAITER REQUEST",
      manageWaiterRequest: "Manage Waiter Request",
      expenses: "EXPENSES",
      createExpenses: "Create Expenses",
      showExpenses: "Show Expenses",
      updateExpenses: "Update Expenses",
      deleteExpenses: "Delete Expenses",
      createExpenseCategory: "Create Expense Category",
      showExpenseCategory: "Show Expense Category",
      updateExpenseCategory: "Update Expense Category",
      deleteExpenseCategory: "Delete Expense Category",
      // Manage Role Modal
      manageRoleModal: "Manage Role",
      roleColumn: "ROLE",
      actionColumn: "ACTION",
      defaultRoleCannotBeDeleted: "Default role can not be deleted.",
      addNewRole: "Add New Role",
      displayName: "Display Name",
      enterDisplayName: "Enter Display Name",
      copyPermissionsFromRole: "Copy permissions from role (optional)",
      dontCopyPermissions: "Don't copy permissions",
      cancel: "Cancel",
      createRole: "Create Role",
      // Billing Tab
      billingSubtitle: "Manage your subscription plan and billing information",
      planDetails: "Plan Details",
      purchaseHistory: "Purchase History",
      offlineRequest: "Offline Request",
      currentPlanName: "Current Plan Name",
      currentPlanType: "Current Plan Type",
      licenseExpiresOn: "License Expires On",
      daysLeft: "days left",
      additionalFeatures: "Additional Features",
      changeBranch: "Change Branch",
      exportReport: "Export Report",
      tableReservation: "Table Booking",
      paymentGatewayIntegration: "Payment Gateway Integration",
      themeSetting: "Theme Setting",
      customerDisplay: "Customer Display",
      upgradePlan: "Upgrade Plan",
      package: "PACKAGE",
      billingCycle: "BILLING CYCLE",
      paymentDate: "PAYMENT DATE",
      nextPaymentDate: "NEXT PAYMENT DATE",
      transactionId: "TRANSACTION ID",
      paymentGateway: "PAYMENT GATEWAY",
      amount: "AMOUNT",
      packageDetails: "PACKAGE DETAILS",
      offline: "Offline",
      paymentBy: "PAYMENT BY",
      created: "CREATED",
      status: "STATUS",
      noOfflinePaymentRequestFound: "No offline payment request found",
      // Reservation Tab
      reservationSubtitle: "Configure booking settings and time slots for your restaurant",
      reservationSettings: "Booking Settings",
      enableAdminReservations: "Enable Admin Bookings",
      enableAdminReservationsDesc: "Allow staff to create bookings through the admin panel",
      enableCustomerReservations: "Enable Customer Bookings",
      enableCustomerReservationsDesc: "Allow customers to make bookings through the customer site",
      minimumPartySize: "Minimum Party Size",
      minimumPartySizeDesc: "Set the minimum number of guests required for a booking",
      disableSlotMinutes: "Disable Slot Minutes",
      disableSlotMinutesDesc: "Set how many minutes before a time slot that bookings should be disabled. This only applies to bookings for today",
      minutes: "Minutes",
      timeSlotsSettings: "Time Slots Settings",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      slotType: "SLOT TYPE",
      startTime: "START TIME",
      endTime: "END TIME",
      timeSlotDifference: "TIME SLOT DIFFERENCE",
      available: "AVAILABLE",
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      // About Us Tab
      aboutUsSubtitle: "Manage the about us content displayed on your customer site",
      // Customer Site Tab
      customerSiteSubtitle: "Configure settings related to the customer site.",
      customizeHeaderTab: "Customize Header",
      orderSettings: "Order Settings",
      allowCustomerOrders: "Allow Customer to place Orders",
      allowCustomerOrdersDesc: "Enable this to allow customers to place orders.",
      customerLoginRequired: "Customer need to login to place order?",
      customerLoginRequiredDesc: "Enable this to require customers to login before placing orders.",
      allowQROrders: "Allow QR order within radius",
      allowQROrdersDesc: "Only allow QR orders if the customer is within the specified metres radius of the branch.",
      pickupDaysRange: "Pickup Days Range",
      enableTipCustomerSite: "Enable Tip Customer Site",
      enableTipCustomerSiteDesc: "Enable this to allow customers to add tips to their orders.",
      enableTipPOS: "Enable Tip POS",
      enableTipPOSDesc: "Enable this to allow adding tips to their orders in POS.",
      autoConfirmOrderStatus: "Auto Confirm Order Status",
      autoConfirmOrderStatusDesc: "Enable this to automatically confirm orders status and send to KOT.",
      showVeg: "Show Veg",
      showVegDesc: "Show veg items in the menus.",
      showHalal: "Show Halal",
      showHalalDesc: "Show Halal items in the menus.",
      callWaiterSettings: "Call Waiter Settings",
      enableWaiterRequest: "Enable Waiter Request",
      enableWaiterRequestDesc: "Enable this to allow customers to call waiters for service.",
      onMobile: "On Mobile",
      onMobileDesc: "Enable this to allow customers to call waiters on mobile.",
      onDesktop: "On Desktop",
      onDesktopDesc: "Enable this to allow customers to call waiters on desktop.",
      onlyWhenOpenViaQR: "Only When Open via QR Code",
      onlyWhenOpenViaQRDesc: "Enable this to allow customers to call waiters only when they open the app via QR code.",
      dineInSettings: "Dine-in Settings",
      tableRequiredForDineIn: "Table Required for Dine-in",
      tableRequiredForDineInDesc: "Enable this to require customers to select a table for dine-in orders.",
      defaultTableReservationStatus: "Default Table Booking Status",
      defaultTableReservationStatusDesc: "Select the default status for new bookings.",
      pwaSettings: "PWA Settings",
      enablePWA: "Enable PWA App",
      enablePWADesc: "Enable this to allow customers to install your app on their devices.",
      tableSettings: "Table Settings",
      tableLockTimeout: "Table Lock Timeout (Minutes)",
      tableLockTimeoutDesc: "Set how long a table remains locked when a staff member is working on it.",
      socialMediaLinks: "Social Media Links",
      facebookLink: "Facebook Link",
      instagramLink: "Instagram Link",
      twitterLink: "Twitter Link",
      yelpLink: "Yelp Link",
      seo: "SEO",
      metaKeyword: "Meta Keyword",
      metaDescription: "Meta Description",
      wifiSettings: "WiFi Settings",
      showWiFiIcon: "Show WiFi Icon",
      showWiFiIconDesc: "Enable this to show the WiFi icon on the customer site navigation.",
      wifiName: "WiFi Name",
      wifiNameDesc: "Enter the WiFi network name (SSID) for your restaurant.",
      wifiPassword: "WiFi Password",
      wifiPasswordDesc: "Enter the WiFi password for your restaurant.",
    },

    // Waiter Requests Page
    waiterRequestsPage: {
      title: "Waiter Requests",
      autoRefresh: "Auto Refresh",
      seconds: "Seconds",
      table: "Table",
      markAttended: "Mark Attended",
      doItLater: "Do It Later",
      newWaiterRequestFor: "New Waiter Request for Table -",
      secondsAgo: "seconds ago",
    },

    // Customers Page
    customersPage: {
      title: "Customers",
      searchPlaceholder: "Search by name, email or phone number",
      import: "Import",
      export: "Export",
      addCustomer: "Add Customer",
      customerName: "CUSTOMER NAME",
      emailAddress: "EMAIL ADDRESS",
      phone: "PHONE",
      totalOrders: "TOTAL ORDERS",
      action: "ACTION",
      orders: "ORDERS",
      update: "Update",
      noCustomersFound: "No customers found",
      showing: "Showing",
      to: "to",
      of: "of",
      results: "results",
    },
  },
  az: {
    // Common
    loading: "Yüklənir",
    save: "Yadda saxla",
    cancel: "Ləğv et",
    delete: "Sil",
    remove: "Çıxart",
    edit: "Redaktə et",
    add: "Əlavə et",
    search: "Axtar",
    filter: "Filtr",
    export: "İxrac et",
    
    // Navigation
    dashboard: "İdarə Paneli",
    menu: "Menyu",
    menus: "Menyular",
    menuItems: "Menyu Məhsulları",
    itemCategories: "Məhsul Kateqoriyaları",
    itemCategory: "Məhsul Kateqoriyası",
    addItemCategory: "Məhsul Kateqoriyası Əlavə Et",
    searchItemCategory: "Məhsul Kateqoriyanızı burada axtarın",
    modifierGroups: "Modifikator Qrupları",
    itemModifiers: "Məhsul Modifikatorları",
    addModifierGroup: "Modifikator Qrupu Əlavə Et",
    groupName: "Qrup Adı",
    options: "Variantlar",
    tables: "Masalar",
    areas: "Ərazilər",
    qrCodes: "QR Kodlar",
    waiterRequests: "Ofisiant Sorğuları",
    reservations: "Rezervasiyalar",
    pos: "POS",
    goToPOS: "POS-a keç",
    orders: "Sifarişlər",
    kot: "MBS",
    kotFull: "MBS (Mətbəx Bölməsi Sənədi)",
    kitchenKOT: "Mətbəx MBS",
    customers: "Müştərilər",
    staff: "İşçilər",
    deliveryExecutive: "Çatdırılma Meneçeri",
    people: "İnsanlar",
    employees: "İşçilər",
    expenses: "Xərclər",
    expenseCategories: "Xərc Kateqoriyaları",
    payments: "Ödənişlər",
    duePayments: "Ödənilməli Ödənişlər",
    reports: "Hesabatlar",
    salesReport: "Satış Hesabatı",
    itemReport: "Məhsul Hesabatı",
    categoryReport: "Kateqoriya Hesabatı",
    deliveryAppReport: "Çatdırılma Tətbiqi Hesabatı",
    expenseReport: "Xərc Hesabatı",
    canceledOrderReport: "Ləğv Edilmiş Sifariş Hesabatı",
    removedQOTItemReport: "Silinmiş SBS Məhsul Hesabatı",
    taxReport: "Vergi Hesabatı",
    refundReport: "Geri Qaytarılma Hesabatı",
    cashRegister: "Kassa",
    inventory: "İnventar",
    kitchen: "Mətbəx",
    settings: "Parametrlər",
    customerSite: "Müştəri Saytı",
    selectBranch: "Filial Seçin",
    back: "Geri",
    
    // Header
    ordersBadge: "Sifarişlər",
    reservationsBadge: "Rezervasiyalar",
    requestsBadge: "Sorğular",
    daysLeft: "gün qalıb",
    displayOptions: "Ekran Seçimləri",
    customerDisplayScreen: "Müştəri Ekranı",
    customerOrderBoard: "Müştəri Sifariş Lövhəsi",
    myProfile: "Mənim Profilim",
    accountSettings: "Hesab Parametrləri",
    logout: "Çıxış",
    backToDashboard: "İdarə Panelinə Qayıt",
    
    // Dashboard
    welcomeMessage: "Xoş gəlmisiniz! Bu gün baş verənlər.",
    totalSalesToday: "Bu Gün Ümumi Satış",
    totalOrdersToday: "Bu Gün Ümumi Sifarişlər",
    activeTables: "Aktiv Masalar",
    occupied: "Dolu",
    pending: "Gözləyən",
    newReservations: "Yeni Rezervasiyalar",
    today: "Bu gün",
    salesOverview: "Satış İcmalı",
    ordersByCategory: "Kateqoriyaya görə Sifarişlər",
    latestOrders: "Son Sifarişlər",
    latestReservations: "Son Rezervasiyalar",
    latestPayments: "Son Ödənişlər",
    
    // Dashboard - New
    statistics: "Statistikalar",
    todaysOrders: "Bu Günün Sifarişləri",
    todaysEarnings: "Bu Günün Gəliri",
    todaysCustomer: "Bu Günün Müştəriləri",
    averageDailyEarnings: "Orta Günlük Gəlir",
    salesThisMonth: "Bu Ayın Satışları",
    sinceYesterday: "Dünəndən",
    sincePreviousMonth: "Əvvəlki Aydan",
    paymentMethodToday: "Bu Günün Ödəniş Üsulu",
    todaysOrdersTitle: "Bu Günün Sifarişləri",
    orderServed: "Sifariş Təqdim Edildi",
    orderConfirmed: "Sifariş Təsdiqləndi",
    orderPlaced: "Sifariş Yerləşdirildi",
    dineIn: "Restoranda",
    delivery: "Çatdırlma",
    orderDate: "Sifariş Tarixi",
    topSellingDishToday: "Ən Çox Satılan Yemək (Bu Gün)",
    topSellingTablesToday: "Ən Çox Satılan Masalar (Bu Gün)",
    items: "Məhsullar",
    paid: "Ödənilib",
    billed: "Hesab",
    shop: "Mağaza",
    buyOnEnvato: "Envato-dan Alın",
    
    // Order statuses
    completed: "Tamamlandı",
    inProgress: "Davam edir",
    confirmed: "Təsdiqləndi",
    
    // Payment methods
    card: "Kart",
    cash: "Nəğd",
    
    // Days
    mon: "B.e",
    tue: "Ç.a",
    wed: "Ç",
    thu: "C.a",
    fri: "C",
    sat: "Ş",
    sun: "B",
    
    // Categories
    mainCourse: "Əsas Yemək",
    appetizers: "Qəlyanaltılar",
    desserts: "Desertlər",
    beverages: "İçkilər",
    
    // Other
    table: "Masa",
    tableNo: "Masa nömrəsi",
    guests: "qonaq",
    sales: "satış",
    order: "Sifariş",
    minsAgo: "dəq əvvəl",
    
    // Menus Page
    searchYourMenu: "Menyunuzu Axtarın",
    assignMenuToTable: "Menyunu Masaya Təyin Edin",
    organizeMenuItems: "Menyu Məhsullarını Organizə Edin",
    addMenu: "Menyu Əlavə Edin",
    addMenuItem: "Menyu Məhsulu Əlavə Edin",
    update: "Yenilə",
    price: "Qiymət",
    menuName: "Menyu Adı",
    isAvailable: "Mövcuddur",
    showOnCustomerSite: "Müştəri Saytında Göstər",
    action: "Əməliyyat",
    actions: "Əməliyyatlar",
    showFilters: "Filtrləri Göstər",
    bulkUpload: "Toplu Yüklə",
    searchMenuItem: "Menyu Məhsulunu Axtarın",
    itemCount: "Məhsul Sayı",
    noMenusCreated: "Hələ heç bir menyu yaradılmayıb",
    createYourFirstMenu: "İlk Menyunuzu Yaradın",
    hideFilters: "Filtrləri Gizlət",
    bulk: "Toplu",
    assignMenu: "Menyu Təyin Et",
    noMenuItemsFound: "Axtarışınıza uyğun heç bir menyu məhsulu tapılmadı",
    noMenuItemsInMenu: "Bu menyuda hələ heç bir məhsul yoxdur",
    addYourFirstMenuItem: "İlk Menyu Məhsulunuzu Əlavə Edin",
    deleteMenu: "Menyunu Sil",
    deleteMenuConfirm: "Bu menyunu silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün deyil.",
    yesDelete: "Bəli, Sil",
    deleteMenuItem: "Menyu Məhsulunu Sil",
    deleteMenuItemConfirm: "Bu menyu məhsulunu silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün deyil.",
    
    // Add Menu Modal
    addMenuTitle: "Menyu Əlavə Et",
    addMenuDescription: "Restoranınıza yeni bir menyu əlavə edin.",
    selectLanguage: "Dil Seçin",
    menuNameEnglish: "Menyu Adı (İngilis)",
    menuNameAzerbaijani: "Menyu Adı (Azərbaycan)",
    menuNamePlaceholder: "Menyu adını daxil edin",
    english: "İngilis",
    azerbaijani: "Azərbaycan",
    
    // Assign Menu to Table Modal
    assignMenuToTableTitle: "Menyu Masaya Təyin Et",
    selectTable: "Masa Seçin",
    select: "Seçin",
    active: "Aktiv",
    close: "Bağla",
    
    // Menu Items Page
    addMenuItemDescription: "Restoranınıza yeni bir menyu məhsulu əlavə edin.",
    productInformation: "Məhsul Məlumatları",
    pricingDetails: "Qiymət Məlumatları",
    itemName: "Məhsul Adı",
    itemDescription: "Məhsul Təsviri",
    itemNamePlaceholder: "Məhsul adını daxil edin",
    itemDescriptionPlaceholder: "Məhsul təsvirini daxil edin",
    chooseMenu: "Menyu Seçin",
    categoryName: "Kateqoriya Adı",
    selectItemCategory: "Məhsul Kateqoriyası Seçin",
    itemType: "Məhsul Növü",
    veg: "Bitki",
    nonVeg: "Ət",
    egg: "Yumurta",
    drink: "İçki",
    halal: "Halal",
    other: "Digər",
    preparationTime: "Hazırlıq Vaxtı",
    preparationTimePlaceholder: "Dəqiqə",
    itemImage: "Məhsul Şəkli",
    chooseFile: "Fayl Seçin",
    supportedFormats: "Dəstəklənən formatlar: PNG, JPG, GIF, SVG. Maksimum ölçü: 2MB - Tövsiyə olunan ölçü: 300 x 300 piksel",
    hasVariations: "Variantları Var",
    hasVariationsHelp: "Məhsulun fərqli qiymətlərlə bir neçə variantı varsa bunu aktivləşdirin (məs: ölçü, dad)",
    variations: "Variantlar",
    addAnotherVariation: "Başqa Variant Əlavə Et",
    variationNamePlaceholder: "Variant adı (məs: Kiçik, Orta, Böyük)",
    variationName: "Variant Adı",
    defaultDelivery: "Standart Çatdırılma",
    editMenuItem: "Menyu Məhsulunu Redaktə Et",
    updateItem: "Məhsulu Yenilə",
    backToMenus: "Menyulara Qayıt",
    editMenuItemDescription: "Bu menyu məhsulunu redaktə etmək üçün aşağıdakı məlumatları yeniləyin.",
    orderTypesPricing: "Sifariş Növləri üzrə Qiymətlər",
    minutes: "Dəqiqə",
    requiredField: "*",
    
    // Add Modifier Group Modal
    addModifierGroupTitle: "Modifikator Qrupu Əlavə Et",
    addModifierGroupDescription: "Restoranınıza yeni bir modifikator qrupu əlavə edin.",
    modifierNameEnglish: "Modifikator Adı (İngilis dili)",
    modifierNamePlaceholder: "Modifikator adını daxil edin, məsələn: Əlavələr",
    descriptionEnglish: "Təsvir (İngilis dili)",
    descriptionPlaceholder: "Təsviri daxil edin, məsələn: Pizzanız üçün əlavə ədviyyatlar",
    locations: "Yerlər",
    locationsSelected: "seçildi",
    selectMenuItem: "Menyu Məhsulunu Seçin",
    locationsHelpText: "Bu modifikator qrupunun tətbiq ediləcəyi menyu məhsullarını seçin",
    modifierOptions: "Modifikator Seçimləri",
    option: "Seçim",
    optionNameEnglish: "Seçim Adı (İngilis dili)",
    optionNamePlaceholder: "Seçim adını daxil edin, məsələn: Əlavə Pendir",
    defaultPrice: "Standart Qiymət",
    deliveryPlatforms: "Çatdırılma Platformaları",
    baseDeliveryPrice: "Əsas Çatdırılma Qiyməti",
    addModifierOption: "Modifikator Seçimi Əlavə Et",
    pickup: "Götürmə",
    
    // Pricing
    dineInPrice: "Restoranda İstehlak Qiyməti",
    pickupPrice: "Götürmə Qiyməti",
    deliveryPrice: "Çatdırılma Qiyməti",
    
    // Item Modifiers Page
    itemModifiersPage: "Məhsul Modifikatorları",
    searchItemModifier: "Məhsul Modifikatorunu Axtarın",
    addItemModifier: "Məhsul Modifikatoru Əlavə Edin",
    editItemModifier: "Məhsul Modifikatorunu Redaktə Et",
    modifierGroup: "Modifikator Qrupu",
    isRequired: "Tələb Olunur",
    allowMultipleSelection: "Çoxlu Seçimə İcaza Verin",
    optional: "İxtiyari",
    required: "Tələb Olunur",
    yes: "Bəli",
    no: "Xeyr",
    noModifiersFound: "Modifikator tapılmadı",
    enterItemName: "Məhsul adını daxil edin",
    enterModifierGroup: "Modifikator qrupunu daxil edin",
    deleteModifier: "Modifikatoru Sil",
    deleteModifierConfirm: "Bu modifikatoru silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.",
    
    // Areas Page
    allAreas: "Bütün Ərazilər",
    areaName: "Ərazi Adı",
    noOfTables: "Masaların Sayı",
    addArea: "Ərazi Əlavə Et",
    searchArea: "Ərazi Axtarın",
    
    // Tables Page
    tableView: "Masa Baxışı",
    list: "Siyahı",
    grid: "Qızıl",
    layout: "Qatma",
    filterByAvailability: "Mövcudluğa Gözərmək",
    addTable: "Masa Əlavə Et",
    lounge: "Layz",
    roofTop: "Qapı Üstü",
    garden: "Garden",
    tableLabel: "Masa",
    assignWaiter: "Ofisiant Təyin Et",
    seats: "Oturacaqlar",
    available: "Mövcud",
    running: "İşləyir",
    reserved: "Rezerv",
    
    // QR Codes Page
    qrCodesPage: "QR Kodlar",
    downloadQR: "QR Yüklə",
    copyQR: "QR Kopyalayın",
    regenerateQR: "QR Yenilə",
    multipleChoice: "Çoxlu Seçim",
    
    // Reservations Page
    reservationsPage: "Rezervasiyalar",
    newReservation: "Yeni Rezervasiya",
    newReservationDescription: "Yeni rezervasiya yaratmaq üçün məlumatları doldurun.",
    assignTableDescription: "Bu rezervasiyaya təyin etmək üçün masa seçin.",
    currentWeek: "Cari Həftə",
    to: "Kimi",
    searchByNameEmailPhone: "Ad, e-poçt və ya telefon nömrəsi ilə axtarın",
    assignTable: "Masaya Təyin Et",
    notes: "Qeydlər",
    noNotes: "Qeyd yoxdur",
    
    // POS Page
    posPage: "Satış Nöqtəsi",
    filterByMenu: "Menyuya Görə Filtrlə",
    filterByCategory: "Kateqoriyaya Görə Filtrlə",
    reset: "Sıfırla",
    orderType: "Sifariş Növü",
    takeaway: "Aparılma",
    change: "Dəyiş",
    addCustomerDetails: "Müştəri Məlumatları Əlavə Et",
    orderNumber: "Sifariş #",
    mergeTables: "Masaları Birləşdir",
    selectWaiter: "Ofisiant Seç",
    addNote: "Qeyd Əlavə Et",
    addDiscount: "Endirim Əlavə Et",
    saveAsDraft: "Qaralama Olaraq Saxla",
    kotAndPrint: "MBS və Çap",
    kotBillPrintPayment: "MBS, Hesab, Çap və Ödəniş",
    bill: "HESAB",
    billAndPayment: "Hesab və Ödəniş",
    billAndPrint: "Hesab və Çap",
    displayingAllItems: "Bütün məhsullar göstərilir",
    pax: "Nəfər",
    subTotal: "Ara Cəm",
    total: "Cəmi",
    cancelled: "Ləğv edildi",
    
    // Staff Page
    staffPage: {
      title: "İşçilər",
      searchPlaceholder: "İşçini axtarın",
      export: "İxrac et",
      addMember: "Üzv Əlavə Et",
      memberName: "Üzv Adı",
      emailAddress: "E-poçt Ünvanı",
      role: "Röli",
      action: "Əməliyyat",
      update: "Yenilə",
      cannotChangeOwnRole: "Öz rölünüzü dəyişə bilməzsiniz",
      noStaffFound: "İşçi tapılmadı",
      addNewMember: "Yeni Üzv Əlavə Et",
      enterName: "Ad daxil edin",
      enterEmail: "E-poçt daxil edin",
      password: "Şifrə",
      enterPassword: "Şifrə daxil edin",
      cancel: "Ləğv et",
      confirmDelete: "Silinməni təsdiqləyin",
    },
    
    // Delivery Executive Page
    deliveryExecutivePage: {
      title: "Çatdırılma Meneçerləri",
      searchPlaceholder: "Çatdırılma meneçerini axtarın",
      export: "İxrac et",
      addExecutive: "Meneçer Əlavə Et",
      memberName: "Ad",
      phone: "Telefon",
      uniqueCode: "Unikal Kod",
      totalOrders: "Ümumi Sifarişlər",
      status: "Status",
      action: "Əməliyyat",
      update: "Yenilə",
      noExecutivesFound: "Çatdırılma meneçeri tapılmadı",
      addNewExecutive: "Yeni Meneçer Əlavə Et",
      enterName: "Ad daxil edin",
      enterPhone: "Telefon daxil edin",
      enterUniqueCode: "Unikal kod daxil edin",
      password: "Şifrə",
      enterPassword: "Şifrə daxil edin",
      cancel: "Ləğv et",
      confirmDelete: "Silinməni təsdiqləyin",
      orders: "Sifarişlər",
      showing: "Göstərilir",
      to: "kimi",
      of: "dən",
      results: "nəticə",
    },
    
    // Expenses Page
    expensesPage: {
      title: "Xərclər",
      searchPlaceholder: "Xərcləri axtarın",
      showFilters: "Filtrləri Göstər",
      addExpense: "Xərc Əlavə Et",
      expenseTitle: "Xərc Başlığı",
      category: "Kateqoriya",
      amount: "Miqdar",
      expenseDate: "Xərc Tarixi",
      paymentStatus: "Ödəniş Statusu",
      paymentDate: "Ödəniş Tarixi",
      dueDate: "Ödənilmə Tarixi",
      paymentMethod: "Ödəniş Üsulu",
      action: "Əməliyyat",
      update: "Yenilə",
      paid: "Ödənilib",
      pending: "Gözləyir",
      cancelled: "Ləğv edilib",
      creditCard: "Kredit Kartı",
      cash: "Nəğd",
      bankTransfer: "Bank Transferi",
      noExpensesFound: "Xərc tapılmadı",
      addNewExpense: "Yeni Xərc Əlavə Et",
      enterTitle: "Başlığı daxil edin",
      selectCategory: "Kateqoriya seçin",
      enterAmount: "Miqdarı daxil edin",
      selectDate: "Tarixi seçin",
      selectPaymentMethod: "Ödəniş üsulunu seçin",
      cancel: "Ləğv et",
      confirmDelete: "Silinməni təsdiqləyin",
      rent: "Kirayə",
      equipment: "Təbii Avadanlıqlar",
      utilities: "İstehlak",
      salary: "Maaş",
      other: "Digər",
    },
    
    // Expense Categories Page
    expenseCategoriesPage: {
      title: "Xərc Kateqoriyaları",
      searchPlaceholder: "Xərc kateqoriyalarını axtarın",
      addCategory: "Kateqoriya Əlavə Et",
      categoryName: "Kateqoriya Adı",
      description: "Təsviri",
      action: "Əməliyyat",
      update: "Yenilə",
      noCategoriesFound: "Xərc kateqoriyası tapılmadı",
      addNewCategory: "Yeni Kateqoriya Əlavə Et",
      enterCategoryName: "Kateqoriya adını daxil edin",
      enterDescription: "Təsviri daxil edin",
      cancel: "Ləğv et",
      confirmDelete: "Silinməni təsdiqləyin",
      rent: "Kirayə",
      rentDesc: "Restoranın kirayə xərci",
      utilities: "İstehlak",
      utilitiesDesc: "Restoranın istehlak xərci",
      salaries: "Maaşlar",
      salariesDesc: "İşçilərin maaşları",
      ingredients: "Məhsullar",
      ingredientsDesc: "Restoranın məhsulları",
      equipment: "Avadanlıqlar",
      equipmentDesc: "Restoranın avadanlıqları",
      marketing: "Pazarlama",
      marketingDesc: "Restoranın pazarlama xərci",
      insurance: "Sigorta",
      insuranceDesc: "Restoranın sigorta xərci",
      maintenance: "Saxlama",
      maintenanceDesc: "Restoranın saxlama xərci",
    },
    
    // Payments Page
    paymentsPage: {
      title: "Ödənişlər",
      searchPlaceholder: "Ödənişləri axtarın",
      export: "İxrac et",
      id: "ID",
      amount: "Miqdar",
      paymentMethod: "Ödəniş üsulu",
      transactionId: "İşlem ID",
      order: "Sifariş",
      dateTime: "Tarix & Vaxt",
      action: "Əməliyyat",
      refund: "Geri Qaytar",
      card: "Kart",
      upi: "UPI",
      cash: "Nəğd",
      bankTransfer: "Bank Transferi",
      noPaymentsFound: "Ödəniş tapılmadı",
      ago: "öncə",
    },
    
    // Orders Page
    ordersPage: {
      title: "Sifarişlər",
      autoRefresh: "Avtomatik Yenilə",
      seconds: "saniyə",
      all: "Hamısı",
      allDeliveryApps: "Bütün Çatdırılma Tətbiqləri",
      today: "Bu gün",
      yesterday: "Dünən",
      thisWeek: "Bu həftə",
      thisMonth: "Bu ay",
      custom: "Xüsusi",
      to: "kimi",
      showAllOrders: "Bütün Sifarişləri Göstər",
      showAllWaiter: "Bütün Ofisiantları Göstər",
      businessDayInfo: "İş Günü Məlumatı",
      newOrder: "Yeni Sifariş",
      mergeOrder: "Sifarişləri Birləşdir",
      order: "Sifariş",
      paid: "ÖDƏNİLİB",
      pending: "GÖZLƏYİR",
      cancelled: "LƏĞV EDİLİB",
      pos: "POS",
      delivery: "ÇATDİRILMA",
      dineIn: "RESTORANDA",
      orderDate: "Sifariş Tarixi",
      items: "Məhsul",
      noOrders: "Sifariş tapılmadı",
      buyOnEmrato: "Emrato-dan Alın",
      // Order Detail
      table: "Masa",
      setOrderStatus: "Sifariş Statusunu Təyin Et",
      orderPlaced: "Sifariş Verildi",
      orderConfirmed: "Sifariş Təsdiqləndi",
      orderPreparing: "Sifariş Hazırlanır",
      foodIsReady: "Yemək Hazırdır",
      orderServed: "Sifariş Təqdim Edildi",
      cancelOrder: "Sifarişi Ləğv Et",
      moveToOrderConfirmed: "Təsdiqlənmiş Sifarişə Keç",
      itemName: "MƏHSUL ADI",
      qty: "MİQ",
      price: "QİYMƏT",
      amount: "MƏBLƏĞTotalSales",
      subTotal: "Ara Cəm",
      sgst: "SGST (2.5%)",
      cgst: "CGST (2.5%)",
      total: "Cəmi",
      balanceReturned: "Qaytarılan Balans",
      print: "ÇAP ET",
      close: "Bağla",
      paymentMethod: "ÖDƏMƏ ÜSULU",
      dateTime: "TARİX VƏ VAXT",
      card: "Kart",
    },
    
    // KOT Page
    kotPage: {
      title: "Bütün Mətbəx KOT",
      allKitchens: "Bütün Mətbəxlər",
      today: "Bu gün",
      to: "kimi",
      pending: "Gözləyir",
      inKitchen: "Mətbəxdə",
      foodIsReady: "Yemək Hazırdır",
      cancelled: "Ləğv Edilib",
      order: "Sifariş",
      orderDate: "Sifariş Tarixi",
      pendingConfirmation: "TƏSDİQ GÖZLƏYİR",
      startCooking: "Bişirməyə Başla",
      markReady: "Hazır Olaraq İşarələ",
      cancel: "Ləğv Et",
      itemName: "MƏHSUL ADI",
      noKOTs: "KOT tapılmadı",
      printKOT: "KOT Çap Et",
      waiter: "Ofisiant",
    },
    
    // Sales Report Page
    salesReportPage: {
      title: "Satış Hesabatı",
      subtitle: "Seçilmiş müddət üçün satış hesabatı",
      totalSales: "Ümumi Satış",
      orders: "Sifarişlər",
      traditionalPayments: "Mədəni Ödənişlər",
      paymentGateways: "Ödəniş Gatewayləri",
      additionalAmounts: "Əlavə Miqdarlar",
      taxBreakdown: "Vergi Ayrıntıları",
      outstandingPayments: "Ödənilməmiş Ödənişlər",
      outstandingOrders: "Ödənilməmiş Sifarişlər",
      cash: "Nəğd",
      card: "Kart",
      upi: "UPI",
      bankTransfer: "Bank Transferi",
      totalCharges: "Ümumi Xərclər",
      totalTaxes: "Ümumi Vergilər",
      discount: "Endirim",
      tip: "İpucu",
      taxMode: "Vergi Rejimi",
      totalTaxCollection: "Ümumi Vergi Toplamı",
      sgst: "SGST",
      cgst: "CGST",
      date: "Tarix",
      totalOrdersColumn: "Ümumi Sifarişlər",
      taxesFromActualBreakdown: "Faktiki Ayrıntılardan Vergilər",
      totalTaxAmount: "Ümumi Vergi Miqdarı",
      paymentMethods: "Ödəniş Üsulları",
      due: "Ödənilməli",
      deliveryFee: "Çatdırılma Ücreti",
      total: "Ümumi",
      totalExcludingTip: "İpucu Daxil Olmayan Ümumi",
      currentWeek: "Cari Həftə",
      allUsers: "Bütün İstifadəçilər",
      export: "İxrac et",
      to: "kimi",
      order: "Sifariş",
    },

    // Item Report Page
    itemReportPage: {
      title: "Məhsul Hesabatı",
      subtitle: "Seçilmiş müddət üçün məhsul hesabatı",
      sumOfTotalRevenue: "Ümumi Ciro",
      totalQuantitySold: "Satılan Ümumi Məhsul Sayı",
      searchPlaceholder: "Məhsul adını axtarın",
      export: "İxrac et",
      itemName: "Məhsul Adı",
      itemCategoryName: "Məhsul Kateqoriyası Adı",
      quantitySold: "Satılan Məhsul Sayı",
      sellingPrice: "Satış Qiyməti",
      totalRevenue: "Ümumi Ciro",
      currentWeek: "Cari Həftə",
      to: "kimi",
    },

    // Category Report Page
    categoryReportPage: {
      title: "Kateqoriya Hesabatı",
      subtitle: "Seçilmiş müddət üçün kateqoriya hesabatı",
      itemCategory: "Məhsul Kateqoriyası",
      quantitySold: "Satılan Məhsul Sayı",
      amount: "Miqdar",
      currentWeek: "Cari Həftə",
      to: "kimi",
      export: "İxrac et",
    },

    // Tax Report Page
    taxReportPage: {
      title: "Vergi Hesabatı",
      subtitle: "Seçilmiş müddət üçün vergi hesabatı",
      todayTaxSummary: "Bu Günün Vergi Özeti",
      todayTaxCollection: "Bu Günün Vergi Toplamı",
      todayOrders: "Bu Günün Sifarişləri",
      todayRevenue: "Bu Günün Ciro",
      totalTaxes: "Ümumi Vergilər",
      totalRevenue: "Ümumi Ciro",
      totalOrders: "Ümumi Sifarişlər",
      totalItemsSold: "Satılan Ümumi Məhsul Sayı",
      today: "Bu gün",
      to: "kimi",
      taxBreakdownByTaxType: "Vergi Növlərinə Gözərmək",
      taxBreakdownByDate: "Tarixə Gözərmək",
      taxDetailsByOrder: "Sifarişlərə Gözərmək",
      taxName: "Vergi Adı",
      taxRate: "Vergi Oranı",
      totalTaxAmount: "Ümumi Vergi Miqdarı",
      itemsCount: "Məhsul Sayı",
      ordersCount: "Sifariş Sayı",
      total: "Ümumi",
      export: "İxrac et",
      salesDateFor: "Satış Tarixi",
      timePeriod: "Vaxt Məsafəsi",
    },

    // Refund Report Page
    refundReportPage: {
      title: "Geri Qaytarılma Hesabatı",
      subtitle: "Seçilmiş müddət üçün geri qaytarılma hesabatı",
      totalRefunds: "Ümumi Geri Qaytarımlar",
      totalRefundAmount: "Ümumi Geri Qaytarılma Miqdarı",
      totalOriginalAmount: "Ümumi Orijinal Miqdar",
      commissionAdjustment: "Komissiya Tənzimləməsi",
      currentWeek: "Cari Həftə",
      to: "kimi",
      searchPlaceholder: "Geri qaytarılma növünü axtarın",
      allRefundTypes: "Bütün Geri Qaytarılma Növləri",
      export: "İxrac et",
      date: "Tarix",
      order: "Sifariş",
      refundType: "Geri Qaytarılma Növü",
      refundReason: "Geri Qaytarılma Səbəbi",
      processedBy: "İşləndiyi",
      originalPrice: "Orijinal Qiymət",
      refundedAmount: "Geri Qaytarılan Miqdar",
      resalePrice: "Yenidən Satış Qiyməti",
      deliveryApp: "Çatdırılma Tətbiqi",
      inventoryChange: "Anbar Dəyişikliyi",
      noRecordFound: "Qeyd Tapılmadı",
      salesDataFrom: "Satış Məlumatları",
      timePeriodEachDay: "Hər Gün Vaxt Məsafəsi",
    },

    // Delivery App Report Page
    deliveryAppReportPage: {
      title: "Çatdırılma Tətbiqi Hesabatı",
      subtitle: "Seçilmiş müddət üçün çatdırılma tətbiqi hesabatı",
      totalOrders: "Ümumi Sifarişlər",
      totalRevenue: "Ümumi Ciro",
      totalCommission: "Ümumi Komissiya",
      totalDeliveryFees: "Ümumi Çatdırılma Ücreti",
      netRevenue: "Təmiz Ciro",
      currentWeek: "Cari Həftə",
      to: "kimi",
      allDeliveryApps: "Bütün Çatdırılma Tətbiqləri",
      deliveryApp: "Çatdırılma Tətbiqi",
      avgOrderValue: "Orta Sifariş Qiyməti",
      commissionRate: "Komissiya Oranı",
      noDeliveryAppOrders: "Çatdırılma Tətbiqi Sifarişləri Yoxdur",
      salesDataFrom: "Satış Məlumatları",
      timePeriodEachDay: "Hər Gün Vaxt Məsafəsi",
    },

    // Removed KOT Item Report Page
    removedKOTItemReportPage: {
      title: "Silinmiş SBS Məhsul Hesabatı",
      subtitle: "Seçilmiş müddət üçün silinmiş SBS məhsul hesabatı",
      totalRemovedItems: "Ümumi Silinmiş Məhsullar",
      totalRemovedAmount: "Ümumi Silinmiş Miqdar",
      topCancellationReasons: "Ən Yaxşı İmtina Səbəbləri",
      topWaiters: "Ən Yaxşı Ofisiantlar",
      noDataAvailable: "Məlumat Yoxdur",
      currentWeek: "Cari Həftə",
      to: "kimi",
      allUsers: "Bütün İstifadəçilər",
      allCancellationReasons: "Bütün İmtina Səbəbləri",
      export: "İxrac et",
      kotNumber: "SBS Nömrəsi",
      orderNumber: "Sifariş N��mrəsi",
      removedBy: "Silən",
      itemName: "Məhsul Adı",
      quantity: "Miqdar",
      table: "Masa",
      cancellationReason: "İmtina Səbəbi",
      removedDate: "Silinmə Tarixi",
      totalPrice: "Ümumi Qiymət",
      noRemovedKOTItems: "Silinmiş SBS Məhsul Yoxdur",
    },

    // Expense Report Page
    expenseReportPage: {
      title: "Xərc Hesabatı",
      outstandingPaymentTab: "Ödənilməmiş Ödəniş",
      expenseSummaryTab: "Xərc Özeti",
      currentWeek: "Cari Həftə",
      to: "kimi",
      export: "İxrac et",
      paymentDue: "Ödənilməli Ödəniş",
      dueDate: "Ödənilmə Tarixi",
      paymentStatus: "Ödəniş Statusu",
      total: "Ümumi",
      pending: "Gözləyir",
      paid: "Ödənilib",
      category: "Kateqoriya",
      totalExpense: "Ümumi Xərc",
      percentageOfTotal: "Ümumi əsasında faiz",
      noOutstandingPayments: "Ödənilməmiş Ödəniş Yoxdur",
      noExpenseSummary: "Xərc Özeti Yoxdur",
    },

    // Cancelled Order Report Page
    cancelledOrderReportPage: {
      title: "Ləğv Edilmiş Sifariş Hesabatı",
      subtitle: "Ləğv səbəbləri və ləğv edən istifadəçini göstərən ləğv edilmiş sifarişlər üçün audit hesabatı",
      totalCancelledOrders: "Ümumi Ləğv Edilmiş Sifarişlər",
      totalCancelledAmount: "Ümumi Ləğv Edilmiş Məbləğ",
      topCancelledReasons: "Ən Çox Ləğv Səbəbləri",
      noDataAvailable: "Məlumat Yoxdur",
      currentWeek: "Cari Həftə",
      to: "kimi",
      allCancellationReasons: "Bütün Ləğv Səbəbləri",
      allUsers: "Bütün İstifadəçilər",
      export: "İxrac et",
      orderNumber: "Sifariş Nömrəsi",
      orderDate: "Sifariş Tarixi",
      cancelledDate: "Ləğv Edilmə Tarixi",
      customer: "Müştəri",
      tableWaiter: "Masa/Ofisiant",
      cancellationReason: "Ləğv Səbəbi",
      cancelledBy: "Ləğv Edən",
      orderTotal: "Sifariş Cəmi",
      noCancelledOrders: "Seçilmiş filtrlər üçün ləğv edilmiş sifariş tapılmadı",
    },

    // Settings Page
    settingsPage: {
      title: "Parametrlər",
      cashRegister: "Kassa",
      inventory: "İnventar",
      kitchen: "Mətbəx",
      general: "Ümumi",
      app: "Tətbiq",
      operationalShifts: "Əməliyyat Növbələri",
      branch: "Filial",
      currencies: "Valyutalar",
      email: "E-poçt",
      taxes: "Vergilər",
      payment: "Ödəniş",
      theme: "Mövzu",
      roles: "Rollar",
      billing: "Faktura",
      reservation: "Rezervasiya",
      aboutUs: "Haqqımızda",
      customerSite: "Müştəri Saytı",
      receipt: "Qəbz",
      printer: "Printer",
      delivery: "Çatdırılma",
      kot: "SBS",
      cancellationReasons: "İmtina Səbəbləri",
      order: "Sifariş",
      refundReasons: "Geri Qaytarılma Səbəbləri",
      kiosk: "Kiosk",
      receiptSubtitle: "Müştəri qəbzlərində hansı məlumatın görünəcəyini fərdiləşdirin.",
      customerInformation: "Müştəri Məlumatı",
      showCustomerName: "Müştəri Adını Göstər",
      showCustomerAddress: "Müştəri Ünvanını Göstər",
      showCustomerPhone: "Müştəri Telefonunu Göstər",
      orderDetails: "Sifariş Təfərrüatları",
      showWaiterName: "Ofisiant Adını Göstər",
      showTotalGuest: "Ümumi qonaq sayını göstər",
      showOrderType: "Sifariş Növünü Göstər",
      showRestaurantLogo: "Restoran Loqosunu Göstər",
      showRestaurantTax: "Restoran Vergisini Göstər",
      uploadPaymentQRCode: "Ödəniş QR Kodunu Yüklə",
      showPaymentQRCode: "Ödəniş QR Kodunu Göstər",
      showPaymentDetails: "Ödəniş Təfərrüatlarını Göstər",
      showPaymentStatus: "Ödəniş Statusunu Göstər",
      qrCodeDescription: "Dəstəklənən formatlar: JPG, PNG, SVG, WEBP. Maksimum ölçü: 2MB. Tövsiyə olunan ölçü: 200 x 200 piksel.",
      previewReceipt: "Qəbzə Önizləməsi",
      // Printer Tab
      printerSubtitle: "Restoranınız üçün printer parametrlərini konfiqurasiya edin.",
      configurePrinterSettings: "Restoranınız üçün printer parametrlərini konfiqurasiya edin.",
      desktopAppRequired: "Masaüstü Tətbiq Tələb olunur",
      desktopAppRequiredDescription: "Birbaşa çap etmənin işləməsi üçün kompüterinizdə arxa planda işləyən masaüstü tətbiqə ehtiyacınız var. Masaüstü tətbiq veb tətbiqinizlə fiziki printer arasında körpü kimi çıxış edir.",
      addPrinter: "Printer Əlavə Et",
      printerTitle: "Başlıq (Printeri asanlıqla müəyyən etmək üçün)",
      titleToIdentifyPrinter: "Başlıq (Printeri asanlıqla müəyyən etmək üçün)",
      addPrinterName: "Printer Adı Əlavə Et",
      printingChoice: "Çap Seçimi",
      browserPopupPrint: "Brauzer Popup Çap",
      selectKitchen: "Mətbəx Seçin",
      selectKitchenDescription: "Bu printerə təyin etmək üçün yalnız boş (təyin edilməmiş) mətbəxləri seçin",
      defaultKitchen: "Əsas Mətbəx",
      vegKitchen: "Vegetarian Mətbəx",
      nonVegKitchen: "Qeyri-Vegetarian Mətbəx",
      assigned: "Təyin Edilib",
      defaultPrinter: "Əsas Printer",
      idle: "Boş",
      selectPosTerminal: "POS Terminal Seçin",
      selectPosTerminalDescription: "Bu printerə təyin etmək üçün yalnız boş (təyin edilməmiş) POS terminalları seçin",
      defaultPosTerminal: "Əsas POS Terminal",
      isDefault: "Əsasdır",
      deactivate: "Deaktiv et",
      kitchens: "Mətbəxlər",
      orders: "Sifarişlər",
      desktopAppConnection: "Masaüstü Tətbiq Bağlantısı",
      domainURL: "Domen URL",
      apiKey: "API Açarı",
      resetBranchKey: "Filial Açarını Sıfırla",
      instructions: "Təlimatlar:",
      downloadDesktopApp: "Masaüstü Tətbiqi Yüklə",
      downloadDesktopAppInstruction1: "Kompüterinizdə masaüstü tətbiqi endirin və quraşdırın",
      downloadDesktopAppInstruction2: "Masaüstü tətbiqi açın və parametrlərə keçin",
      downloadDesktopAppInstruction3: "Yuxarıda göstərilən Domen URL və Filial Açarını daxil edin",
      downloadDesktopAppInstruction4: "Bağlantını qurmaq üçün bağlan düyməsini basın",
      windows: "Windows",
      macOS: "macOS",
      yourDevice: "Sizin Cihazınız",
      downloadForWindows: "Windows üçün Yüklə",
      downloadForMacOS: "macOS üçün Yüklə",
      downloadDesktopForWindows: "Birbaşa çap etməni aktivləşdirmək üçün Windows üçün masaüstü tətbiqi yükləyin",
      downloadDesktopForMacOS: "Birbaşa çap etməni aktivləşdirmək üçün macOS üçün masaüstü tətbiqi yükləyin",
      // Delivery Tab
      deliverySubtitle: "Restoranınız üçün çatdırılma parametrlərini konfiqurasiya edin.",
      deliveryWarning: "Çatdırılma parametrləri filial koordinatlarını tələb edir. Zəhmət olmasa əvvəlcə filial məkanını yeniləyin.",
      feeDetails: "Haqqın Təfərrüatları",
      feeCalculationMethod: "Haqqın Hesablanma Üsulu",
      fixedRate: "Sabit Tarif",
      distanceUnit: "Məsafə vahidi",
      kilometersKm: "Kilometr (km)",
      maximumDeliveryRadius: "Maksimum Çatdırılma Radiusu",
      fixedFee: "Sabit Haqq",
      leaveEmptyToDisable: "Bu seçimi deaktiv etmək üçün boş buraxın",
      freeDeliveryOptions: "Pulsuz Çatdırılma Seçimləri",
      freeDeliveryOverAmount: "Məbləğdən Çox Pulsuz Çatdırılma",
      freeDeliveryWithinRadius: "Radius Daxilində Pulsuz Çatdırılma",
      deliverySchedule: "Çatdırılma Cədvəli",
      deliveryHomeText: "Çatdırılma Başlanğıc Vaxtı",
      deliveryCloseEnd: "Çatdırılma Bitmə Vaxtı",
      makeSureTimeRange: "Bu vaxt aralığının V3 Çatdırılma ilə EYNİ olduğundan əmin olun",
      deliveryTimeEstimation: "Çatdırılma Vaxt Təxmini",
      averageSpeedOfDeliveryRider: "Çatdırılma Kuryer Orta Sürəti",
      minh: "Dəq/s",
      additionalTimeBuffer: "Əlavə Vaxt Buferi",
      notAdvisableToAddTooMuchTime: "Ən real vaxtı təxmin etmək üçün çox vaxt əlavə etmək tövsiyə edilmir, Yenilənmədiyi halda Defolt 0-dır",
      // KOT Tab
      kotSubtitle: "Restoranınız üçün Mətbəx Sifariş Bileti parametrlərini konfiqurasiya edin.",
      enableItemLevelStatus: "Məhsul Səviyyəsində Statusu Aktivləşdir",
      enableItemLevelStatusDesc: "Statusların məhsul səviyyəsində təyin edilməsinə icazə vermək üçün bunu aktivləşdirin.",
      defaultKOTStatus: "Defolt KOT Statusu",
      pos: "POS",
      customerTab: "Müştəri",
      pending: "Gözləyir",
      pendingDesc: "KOT yaradıldıqda və işlənməyi gözləyərkən ilkin status",
      cooking: "Hazırlanır",
      cookingDesc: "Mətbəx işçiləri sifarişi hazırlayarkən status",
      // Cancellation Reasons Tab
      cancellationReasonsSubtitle: "Sifarişlər və KOT məhsulları üçün imtina səbəblərini idarə edin.",
      reason: "SƏBƏB",
      cancellationTypes: "İMTİNA TİPLƏRİ",
      update: "Yenilə",
      confirmDelete: "Bunu silmək istədiyinizə əminsiniz?",
      default: "Defolt",
      restaurantClosingEarly: "Restoran erkən bağlanır",
      other: "Digər",
      customerChangedMind: "Müştəri fikrini dəyişdi",
      customerRequestedToCancel: "Müştəri ləğv etməyi tələb etdi",
      paymentIssues: "Ödəniş problemləri",
      customerNoLongerWantsOrder: "Müştəri artıq sifarişi istəmir",
      ingredientNotAvailable: "İnqrediyent mövcud deyil",
      preparationTimeTooLong: "Hazırlanma vaxtı çox uzundur",
      qualityIssueWithIngredients: "İnqrediyentlərlə keyfiyyət problemi",
      systemErrorTechnicalIssue: "Sistem xətası/Texniki problem",
      itemPreparedButReturned: "Məhsul hazırlanmışdır, lakin müştəri tərəfindən geri qaytarılıb.",
      itemDeliveredButRejected: "Məhsul çatdırılmışdır, lakin rədd edilib.",
      mistakeInOrder: "Sifarişdə səhv.",
      productQualityIssue: "Məhsulun keyfiyyət problemi.",
      generalSubtitle: "Restoranınız haqqında ümumi məlumatı daxil edin.",
      restaurantName: "Restoran Adı",
      restaurantPhoneNumber: "Restoran Telefon Nömrəsi",
      restaurantEmailAddress: "Restoran E-poçt Ünvanı",
      restaurantAddress: "Restoran Ünvanı",
      select: "Seç",
      showTaxIdOnOrders: "Sifarişlərdə Vergi ID-ni Göstər",
      taxID: "Vergi ID",
      addMore: "Daha Çox Əlavə Et",
      noTaxFound: "Vergi Tapılmadı",
      additionalCharges: "Əlavə Ödənişlər",
      addCharge: "Ödəniş Əlavə Et",
      chargeName: "ÖDƏNİŞ ADI",
      type: "NÖV",
      rate: "DƏRƏCƏ",
      orderType: "SİFARİŞ NÖVÜ",
      action: "ƏMƏLİYYAT",
      noChargeFound: "Ödəniş tapılmadı.",
      presetAmounts: "Əvvəlcədən Təyin Edilmiş Məbləğlər",
      buyOnEnvato: "Envato-dan Alın",
      // App Tab
      appSubtitle: "Restoranınızın regional parametrlərini konfiqurasiya edin və üst naviqasiyanın görünməsini fərdiləşdirin.",
      countryTimezoneCurrency: "Restoranın Ölkəsi, Saat Qurşağı və Valyutası",
      country: "Ölkə",
      timeFormat: "Saat Formatı",
      dateFormat: "Tarix Formatı",
      timeZone: "Saat Qurşağı",
      currency: "Valyuta",
      customerSiteLanguage: "Müştəri Saytı Dili",
      hideTopNavigation: "Üst Naviqasiyanı Gizlət",
      hideTodaysOrders: "Bu Günün Sifarişlərini Gizlət",
      hideTodaysOrdersDesc: "Üst naviqasiyadan bu günün sifarişləri vidjetini gizlətmək üçün bunu aktivləşdirin.",
      hideNewReservation: "Yeni Rezervasiyanı Gizlət",
      hideNewReservationDesc: "Üst naviqasiyadan yeni rezervasiya vidjetini gizlətmək üçün bunu aktivləşdirin.",
      hideNewWaiterRequest: "Yeni Ofisiant Sorğusunu Gizlət",
      hideNewWaiterRequestDesc: "Üst naviqasiyadan yeni ofisiant sorğusu vidjetini gizlətmək üçün bunu aktivləşdirin.",
      // Operational Shifts Tab
      operationalShiftsSubtitle: "İş günü sərhədlərini müəyyən etmək üçün əməliyyat növbələrini konfiqurasiya edin. Sifarişlər, idarə paneli və hesabatlar təqvim günləri əvəzinə bu növbələrdən istifadə edəcək.",
      selectBranchLabel: "Filial Seçin",
      shiftsFor: "üçün Növbələr",
      addShift: "Növbə Əlavə Et",
      noShiftsConfigured: "Əməliyyat növbələri konfiqurasiya edilməyib",
      noShiftsMessage: "İlk əməliyyat növbənizi əlavə edərək başlayın. Növbələr konfiqurasiya edilənə qədər sistem təqvim günlərindən (00:00 - 23:59) istifadə edəcək.",
      addFirstShift: "İlk Növbəni Əlavə Et",
      howItWorks: "Necə İşləyir",
      howItWorksPoint1: "İş günü əvvəlki günün son növbə bitmə vaxtında (bu günə uzanırsa) və ya gecə yarısı sıfırlanır, növbə başlama vaxtında deyil",
      howItWorksPoint2: "Növbə zamanı verilən sifarişlər növbənin başladığı təqvim gününə aiddir",
      howItWorksPoint3: "Əgər növbələr konfiqurasiya edilməyibsə, sistem təqvim günlərindən istifadə edir (geriyə uyğun)",
      howItWorksPoint4: "Gecə növbələri (məsələn, 18:00 - 02:00) dəstəklənir və başlama gününə aiddir",
      // Branch Tab
      branchSubtitle: "Restoran filiallarınızı və yerlərinizi idarə edin.",
      addBranch: "Filial Əlavə Et",
      branchName: "FİLİAL ADI",
      branchAddress: "FİLİAL ÜNVANI",
      cannotDeleteCurrentBranch: "Cari filialı silmək olmaz",
      // Currencies Tab
      currenciesSubtitle: "Restoranınız tərəfindən dəstəklənən valyutaları idarə edin.",
      addCurrency: "Valyuta Əlavə Et",
      currencyName: "VALYUTA",
      currencySymbol: "VALYUTA SİMVOLU",
      currencyFormatSample: "VALYUTA FORMATI (NÜMUNƏ: 12345.6789)",
      cannotDeleteDefaultCurrency: "Defolt Valyutanı Silmək Olmaz",
      // Email Tab
      emailSubtitle: "Müxtəlif hadisələr üçün e-poçt bildirişlərini konfigurasiya edin.",
      notification: "Bildiriş",
      newOrderReceived: "Yeni Sifariş Alındı",
      newOrderReceivedDesc: "Müştəri tərəfindən yeni sifariş verildiyi zaman restoran administratoru e-poçt alacaq.",
      reservationConfirmation: "Rezervasiya Təsdiqi",
      reservationConfirmationDesc: "Müştəri rezervasiya etdikdən sonra e-poçt alacaq.",
      newReservationReceived: "Yeni Rezervasiya Alındı",
      newReservationReceivedDesc: "Müştəri tərəfindən yeni rezervasiya edildikdə restoran administratoru e-poçt alacaq.",
      orderBill: "Sifariş Hesabı",
      orderBillDesc: "Müştəri sifariş hesabını e-poçt vasitəsilə alacaq.",
      staffWelcomeEmail: "İşçi Qarşılama E-poçtu",
      staffWelcomeEmailDesc: "Yeni işçi əlavə etdiyinizdə işçi üzvü qarşılama e-poçtu alacaq.",
      emailNotifications: "E-poçt Bildirişləri",
      emailTemplates: "E-poçt Şablonları",
      noTemplateFound: "E-poçt şablonu tapılmadı",
      // Taxes Tab
      taxesSubtitle: "Sifarişlərə və məhsullara vergilərin necə tətbiq olunacağını idarə edin.",
      taxSettings: "Vergi Parametrləri",
      allTaxes: "Bütün Vergilər",
      taxMode: "Vergi Rejimi",
      orderLevelTax: "Sifariş Səviyyəli Vergi",
      orderLevelTaxDesc: "Ümumi sifariş məbləğinə vergi tətbiq edin.",
      itemLevelTax: "Məhsul Səviyyəli Vergi",
      itemLevelTaxDesc: "Hər məhsula fərqli vergi dərəcələri tətbiq edin.",
      taxCalculationBase: "Vergi Hesablama Bazası",
      taxCalculationBaseDesc: "Vergilərin necə hesablanacağını seçin - xidmət ödənişləri vergi bazasına daxil edilsin və ya yox.",
      includeServiceCharges: "Vergi hesablamaya xidmət ödənişlərini daxil et",
      includeServiceChargesDesc: "Vergi (ara cəm - endirim) + xidmət ödənişləri üzərindən hesablanacaq",
      includeServiceChargesFormula: "Vergi bazası = (ara cəm - endirim) + xidmət ödənişləri",
      excludeServiceCharges: "Vergi hesablamadan xidmət ödənişlərini istisna et",
      excludeServiceChargesDesc: "Vergi yalnız (ara cəm - endirim) üzərindən hesablanacaq",
      excludeServiceChargesFormula: "Vergi bazası = (ara cəm - endirim)",
      allTaxesApplicable: "Sifariş yaradarkən bütün vergilər tətbiq olunacaq.",
      addTax: "Vergi Əlavə Et",
      taxName: "VERGİ ADI",
      taxPercent: "VERGİ FAİZİ",
      // Theme Tab
      themeSubtitle: "Restoran idarəetmə panelinizin görünüşünü fərdiləşdirin.",
      logo: "Loqo",
      uploadLogoForRestaurant: "Restoranınız üçün loqo yükləyin",
      uploadLogo: "Loqo Yüklə",
      logoSupportedFormats: "Dəstəklənən formatlar: PNG, PNG, JPG, GIF, SVG, JPEG. Maksimum ölçü: 5 Mb. Tövsiyə edilən ölçü: 57 × 57 piksel.",
      favicon: "Favicon",
      uploadFaviconFor: "Üçün favicon yükləyin",
      generateFavicon: "Favicon yarat",
      uploadFaviconPhone: "Telefon üçün Favicon Yüklə-1024x1024px",
      uploadFaviconTablet: "Planşet üçün Favicon Yüklə-512x512px",
      uploadFaviconDesktop: "Masaüstü üçün Favicon Yüklə-192x192px",
      upload: "Yüklə",
      themeColor: "Tema Rəngi",
      selectThemeColor: "Restoranınız üçün tema rəngini seçin",
      restaurant: "Restoran",
      fresh: "Təravətli",
      warm: "İsti",
      refresh: "YENİLƏ",
      // Roles Tab
      rolesSubtitle: "Restoran işçiləriniz üçün istifadəçi rolları və icazələri idarə edin.",
      manageRole: "Rolu İdarə Et",
      userPermission: "İSTİFADƏÇİ İCAZƏSİ",
      role: "ROL",
      branchHead: "FİLİAL MÜDÜR",
      waiter: "OFİSİANT",
      chef: "AŞBAZ",
      menu: "MENYU",
      createMenu: "Menyu Yarat",
      showMenu: "Menyunu Göstər",
      updateMenu: "Menyunu Yenilə",
      deleteMenu: "Menyunu Sil",
      menuItem: "MENYU MƏHSULU",
      createMenuItem: "Menyu Məhsulu Yarat",
      showMenuItem: "Menyu Məhsulunu Göstər",
      updateMenuItem: "Menyu Məhsulunu Yenilə",
      deleteMenuItem: "Menyu Məhsulunu Sil",
      itemCategory: "MƏHSUL KATEQORİYASI",
      createItemCategory: "Məhsul Kateqoriyası Yarat",
      showItemCategory: "Məhsul Kateqoriyasını Göstər",
      updateItemCategory: "Məhsul Kateqoriyasını Yenilə",
      deleteItemCategory: "Məhsul Kateqoriyasını Sil",
      area: "SAHƏ",
      createArea: "Sahə Yarat",
      showArea: "Sahəni Göstər",
      updateArea: "Sahəni Yenilə",
      deleteArea: "Sahəni Sil",
      table: "MASA",
      createTable: "Masa Yarat",
      showTable: "Masanı Göstər",
      updateTable: "Masanı Yenilə",
      deleteTable: "Masanı Sil",
      reservationPerm: "REZERVASIYA",
      createReservation: "Rezervasiya Yarat",
      showReservation: "Rezervasiyanı Göstər",
      updateReservation: "Rezervasiyanı Yenilə",
      deleteReservation: "Rezervasiyanı Sil",
      kotPerm: "KOT",
      manageKOT: "KOT İdarə Et",
      orderPerm: "SİFARİŞ",
      createOrder: "Sifariş Yarat",
      showOrder: "Sifarişi Göstər",
      updateOrder: "Sifarişi Yenilə",
      deleteOrder: "Sifarişi Sil",
      addDiscountOnPOS: "POS-da Endirim Əlavə Et",
      customer: "MÜŞTƏRİ",
      createCustomer: "Müştəri Yarat",
      showCustomer: "Müştərini Göstər",
      updateCustomer: "Müştərini Yenilə",
      deleteCustomer: "Müştərini Sil",
      staff: "İŞÇİ",
      createStaffMember: "İşçi Üzvü Yarat",
      showStaffMember: "İşçi Üzvünü Göstər",
      updateStaffMember: "İşçi Üzvünü Yenilə",
      deleteStaffMember: "İşçi Üzvünü Sil",
      paymentPerm: "ÖDƏMƏ",
      showPayments: "Ödəmələri Göstər",
      report: "HESABAT",
      showReports: "Hesabatları Göstər",
      settings: "TƏNZIMLƏMƏLƏR",
      manageSettings: "Tənzimləmələri İdarə Et",
      deliveryExecutive: "ÇATDIRILMAÇİ",
      createDeliveryExecutive: "Çatdırılmaçı Yarat",
      showDeliveryExecutive: "Çatdırılmaçını Göstər",
      updateDeliveryExecutive: "Çatdırılmaçını Yenilə",
      deleteDeliveryExecutive: "Çatdırılmaçını Sil",
      waiterRequest: "OFİSİANT SORĞUSU",
      manageWaiterRequest: "Ofisiant Sorğusunu İdarə Et",
      expenses: "XƏRCLƏr",
      createExpenses: "Xərc Yarat",
      showExpenses: "Xərcləri Göstər",
      updateExpenses: "Xərcləri Yenilə",
      deleteExpenses: "Xərcləri Sil",
      createExpenseCategory: "Xərc Kateqoriyası Yarat",
      showExpenseCategory: "Xərc Kateqoriyasını Göstər",
      updateExpenseCategory: "Xərc Kateqoriyasını Yenilə",
      deleteExpenseCategory: "Xərc Kateqoriyasını Sil",
      // Manage Role Modal
      manageRoleModal: "Rolu İdarə Et",
      roleColumn: "ROL",
      actionColumn: "ƏMƏLIYYAT",
      defaultRoleCannotBeDeleted: "Defolt rolu silmək olmaz.",
      addNewRole: "Yeni Rol Əlavə Et",
      displayName: "Göstərilən Ad",
      enterDisplayName: "Göstərilən Adı Daxil Edin",
      copyPermissionsFromRole: "Roldan icazələri kopyala (isteğe bağlı)",
      dontCopyPermissions: "İcazələri kopyalamayın",
      cancel: "Ləğv et",
      createRole: "Rol Yarat",
      // Billing Tab
      billingSubtitle: "Abunə planınızı və ödəniş məlumatlarınızı idarə edin",
      planDetails: "Plan Təfərrüatları",
      purchaseHistory: "Satınalma Tarixçəsi",
      offlineRequest: "Offline Sorğu",
      currentPlanName: "Cari Plan Adı",
      currentPlanType: "Cari Plan Növü",
      licenseExpiresOn: "Lisenziya Bitmə Tarixi",
      daysLeft: "gün qalıb",
      additionalFeatures: "Əlavə Xüsusiyyətlər",
      changeBranch: "Filialı Dəyişdir",
      exportReport: "Hesabatı İxrac Et",
      tableReservation: "Masa Rezervasiyası",
      paymentGatewayIntegration: "Ödəniş Şlüzü İnteqrasiyası",
      themeSetting: "Tema Parametrləri",
      customerDisplay: "Müştəri Ekranı",
      upgradePlan: "Planı Yüksəlt",
      package: "PAKET",
      billingCycle: "ÖDƏMƏ DÖVRİ",
      paymentDate: "ÖDƏMƏ TARİXİ",
      nextPaymentDate: "NÖVBƏTİ ÖDƏMƏ TARİXİ",
      transactionId: "TRANZAKSİYA ID",
      paymentGateway: "ÖDƏMƏ ŞLÜZU",
      amount: "MƏBLƏĞ",
      packageDetails: "PAKET TƏFƏRRÜATLARİ",
      offline: "Offline",
      paymentBy: "ÖDƏYƏN",
      created: "YARADILDI",
      status: "STATUS",
      noOfflinePaymentRequestFound: "Offline ödəniş sorğusu tapılmadı",
      // Reservation Tab
      reservationSubtitle: "Restoranınız üçün rezervasiya parametrlərini və vaxt slotlarını konfiqurasiya edin",
      reservationSettings: "Rezervasiya Parametrləri",
      enableAdminReservations: "Admin Rezervasiyalarını Aktiv Et",
      enableAdminReservationsDesc: "İşçilərə admin paneli vasitəsilə rezervasiya yaratmağa icazə verin",
      enableCustomerReservations: "Müştəri Rezervasiyalarını Aktiv Et",
      enableCustomerReservationsDesc: "Müştərilərə müştəri saytı vasitəsilə rezervasiya etməyə icazə verin",
      minimumPartySize: "Minimum Qrup Ölçüsü",
      minimumPartySizeDesc: "Rezervasiya üçün tələb olunan minimum qonaq sayını təyin edin",
      disableSlotMinutes: "Slot Dəqiqələrini Söndür",
      disableSlotMinutesDesc: "Vaxt slotundan neçə dəqiqə əvvəl rezervasiyaların bağlanacağını təyin edin. Bu yalnız bu günün rezervasiyalarına aiddir",
      minutes: "Dəqiqə",
      timeSlotsSettings: "Vaxt Slotu Parametrləri",
      monday: "Bazar ertəsi",
      tuesday: "Çərşənbə axşamı",
      wednesday: "Çərşənbə",
      thursday: "Cümə axşamı",
      friday: "Cümə",
      saturday: "Şənbə",
      sunday: "Bazar",
      slotType: "SLOT NÖVÜ",
      startTime: "BAŞLANĞIC VAXTİ",
      endTime: "BİTMƏ VAXTİ",
      timeSlotDifference: "VAXT SLOT FERQI",
      available: "MÖVCUD",
      breakfast: "Səhər yeməyi",
      lunch: "Nahar",
      dinner: "Şam yeməyi",
      // About Us Tab
      aboutUsSubtitle: "Müştəri saytınızda göstərilən 'Haqqımızda' məzmununu idarə edin",
      // Customer Site Tab
      customerSiteSubtitle: "Müştəri saytı ilə əlaqəli parametrləri konfiqurasiya edin.",
      customizeHeaderTab: "Başlığı Fərdiləşdirin",
      orderSettings: "Sifariş Parametrləri",
      allowCustomerOrders: "Müştəriyə Sifariş Verməyə İcazə Ver",
      allowCustomerOrdersDesc: "Müştərilərə sifariş verməyə icazə vermək üçün bunu aktiv edin.",
      customerLoginRequired: "Müştəri sifariş vermək üçün daxil olmalıdır?",
      customerLoginRequiredDesc: "Sifariş verməzdən əvvəl müştərilərdən daxil olmağı tələb etmək üçün bunu aktiv edin.",
      allowQROrders: "Radius daxilində QR sifarişə icazə ver",
      allowQROrdersDesc: "Yalnız müştəri filialın müəyyən edilmiş metr radiusu daxilində olduqda QR sifarişinə icazə verin.",
      pickupDaysRange: "Götürmə Günlərinin Diapazonu",
      enableTipCustomerSite: "Müştəri Saytında Baxşış Aktivləşdir",
      enableTipCustomerSiteDesc: "Müştərilərə sifarişlərinə baxşış əlavə etməyə icazə vermək üçün bunu aktiv edin.",
      enableTipPOS: "POS-da Baxşış Aktivləşdir",
      enableTipPOSDesc: "POS-da sifarişlərə baxşış əlavə etməyə icazə vermək üçün bunu aktiv edin.",
      autoConfirmOrderStatus: "Sifariş Statusunu Avtomatik Təsdiq Et",
      autoConfirmOrderStatusDesc: "Sifariş statusunu avtomatik təsdiq etmək və KOT-a göndərmək üçün bunu aktiv edin.",
      showVeg: "Vegetarian Göstər",
      showVegDesc: "Menyularda vegetarian məhsulları göstərin.",
      showHalal: "Halal Göstər",
      showHalalDesc: "Menyularda Halal məhsulları göstərin.",
      callWaiterSettings: "Ofisiant Çağırma Parametrləri",
      enableWaiterRequest: "Ofisiant Sorğusunu Aktiv Et",
      enableWaiterRequestDesc: "Müştərilərə xidmət üçün ofisiant çağırmağa icazə vermək üçün bunu aktiv edin.",
      onMobile: "Mobil",
      onMobileDesc: "Müştərilərə mobil cihazda ofisiant çağırmağa icazə vermək üçün bunu aktiv edin.",
      onDesktop: "Desktop",
      onDesktopDesc: "Müştərilərə desktop cihazda ofisiant çağırmağa icazə vermək üçün bunu aktiv edin.",
      onlyWhenOpenViaQR: "Yalnız QR Kod vasitəsilə Açıldıqda",
      onlyWhenOpenViaQRDesc: "Müştərilərə yalnız QR kod vasitəsilə tətbiqi açdıqda ofisiant çağırmağa icazə vermək üçün bunu aktiv edin.",
      dineInSettings: "Restoranda Yemək Parametrləri",
      tableRequiredForDineIn: "Restoranda Yemək üçün Masa Tələb Olunur",
      tableRequiredForDineInDesc: "Müştərilərdən restoranda yemək sifarişləri üçün masa seçməyi tələb etmək üçün bunu aktiv edin.",
      defaultTableReservationStatus: "Standart Masa Rezervasiya Statusu",
      defaultTableReservationStatusDesc: "Yeni rezervasiyalar üçün standart statusu seçin.",
      pwaSettings: "PWA Parametrləri",
      enablePWA: "PWA Tətbiqi Aktiv Et",
      enablePWADesc: "Müştərilərə tətbiqinizi cihazlarına quraşdırmağa icazə vermək üçün bunu aktiv edin.",
      tableSettings: "Masa Parametrləri",
      tableLockTimeout: "Masa Kilid Vaxtı (Dəqiqə)",
      tableLockTimeoutDesc: "Bir işçi üzərində işləyərkən masanın nə qədər müddətə kilidli qaldığını təyin edin.",
      socialMediaLinks: "Sosial Media Keçidləri",
      facebookLink: "Facebook Keçidi",
      instagramLink: "Instagram Keçidi",
      twitterLink: "Twitter Keçidi",
      yelpLink: "Yelp Keçidi",
      seo: "SEO",
      metaKeyword: "Meta Açar Söz",
      metaDescription: "Meta Təsvir",
      wifiSettings: "WiFi Parametrləri",
      showWiFiIcon: "WiFi İkonunu Göstər",
      showWiFiIconDesc: "Müştəri saytı naviqasiyasında WiFi ikonunu göstərmək üçün bunu aktiv edin.",
      wifiName: "WiFi Adı",
      wifiNameDesc: "Restoranınız üçün WiFi şəbəkə adını (SSID) daxil edin.",
      wifiPassword: "WiFi Parolu",
      wifiPasswordDesc: "Restoranınız üçün WiFi parolunu daxil edin.",
    },

    // Waiter Requests Page
    waiterRequestsPage: {
      title: "Ofisiant Sorğuları",
      autoRefresh: "Avtomatik Yenilə",
      seconds: "Saniyə",
      table: "Masa",
      markAttended: "İştirak Edildi",
      doItLater: "Sonra Et",
      newWaiterRequestFor: "Masa üçün Yeni Ofisiant Sorğusu -",
      secondsAgo: "saniyə əvvəl",
    },

    // Customers Page
    customersPage: {
      title: "Müştərilər",
      searchPlaceholder: "Ad, e-poçt və ya telefon nömrəsi ilə axtarın",
      import: "İdxal",
      export: "İxrac et",
      addCustomer: "Müştəri Əlavə Et",
      customerName: "MÜŞTƏRİ ADI",
      emailAddress: "E-POÇT ÜNVANI",
      phone: "TELEFON",
      totalOrders: "ÜMUMİ SİFARİŞLƏR",
      action: "ƏMƏLİYYAT",
      orders: "SİFARİŞLƏR",
      update: "Yenilə",
      noCustomersFound: "Müştəri tapılmadı",
      showing: "Göstərilir",
      to: "dan",
      of: "dən",
      results: "nəticə",
    },
  },
  ru: {
    loading: "Загрузка",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    remove: "Убрать",
    edit: "Редактировать",
    add: "Добавить",
    search: "Поиск",
    filter: "Фильтр",
    export: "Экспорт",
    dashboard: "Панель управления",
    menu: "Меню",
    menus: "Меню",
    menuItems: "Позиции меню",
    itemCategories: "Категории товаров",
    itemCategory: "Категория товара",
    addItemCategory: "Добавить категорию товара",
    searchItemCategory: "Поиск категории товара",
    modifierGroups: "Группы модификаторов",
    itemModifiers: "Модификаторы товаров",
    addModifierGroup: "Добавить группу модификаторов",
    groupName: "Название группы",
    options: "Опции",
    tables: "Столы",
    areas: "Зоны",
    qrCodes: "QR-коды",
    waiterRequests: "Вызовы официанта",
    reservations: "Бронирования",
    pos: "POS",
    goToPOS: "Перейти в POS",
    orders: "Заказы",
    kot: "KOT",
    kotFull: "KOT (кухонные тикеты)",
    kitchenKOT: "Кухонный KOT",
    customers: "Клиенты",
    staff: "Персонал",
    deliveryExecutive: "Курьер",
    people: "Люди",
    employees: "Сотрудники",
    expenses: "Расходы",
    expenseCategories: "Категории расходов",
    payments: "Платежи",
    duePayments: "Просроченные платежи",
    reports: "Отчёты",
    salesReport: "Отчёт по продажам",
    itemReport: "Отчёт по товарам",
    categoryReport: "Отчёт по категориям",
    deliveryAppReport: "Отчёт по приложениям доставки",
    expenseReport: "Отчёт по расходам",
    canceledOrderReport: "Отчёт по отменённым заказам",
    removedQOTItemReport: "Отчёт по удалённым позициям KOT",
    taxReport: "Отчёт по налогам",
    refundReport: "Отчёт по возвратам",
    cashRegister: "Касса",
    inventory: "Склад",
    kitchen: "Кухня",
    settings: "Настройки",
    customerSite: "Сайт для клиентов",
    selectBranch: "Выберите филиал",
    back: "Назад",
    ordersBadge: "Заказы",
    reservationsBadge: "Бронирования",
    requestsBadge: "Запросы",
    daysLeft: "дней осталось",
    displayOptions: "Параметры отображения",
    customerDisplayScreen: "Экран для клиентов",
    customerOrderBoard: "Табло заказов",
    myProfile: "Мой профиль",
    accountSettings: "Настройки аккаунта",
    logout: "Выйти",
    backToDashboard: "Назад к панели",
    welcomeMessage: "С возвращением! Вот что происходит сегодня.",
    totalSalesToday: "Продажи за сегодня",
    totalOrdersToday: "Заказы за сегодня",
    activeTables: "Активные столы",
    occupied: "Занято",
    pending: "Ожидает",
    newReservations: "Новые бронирования",
    today: "Сегодня",
    salesOverview: "Обзор продаж",
    ordersByCategory: "Заказы по категориям",
    latestOrders: "Последние заказы",
    latestReservations: "Последние бронирования",
    latestPayments: "Последние платежи",
    statistics: "Статистика",
    todaysOrders: "Заказы сегодня",
    todaysEarnings: "Выручка сегодня",
    todaysCustomer: "Клиенты сегодня",
    averageDailyEarnings: "Средняя дневная выручка",
    salesThisMonth: "Продажи за этот месяц",
    sinceYesterday: "С вчерашнего дня",
    sincePreviousMonth: "С прошлого месяца",
    paymentMethodToday: "Способ оплаты сегодня",
    todaysOrdersTitle: "Заказы сегодня",
    orderServed: "Заказ подан",
    orderConfirmed: "Заказ подтверждён",
    orderPlaced: "Заказ оформлен",
    dineIn: "В зале",
    delivery: "Доставка",
    orderDate: "Дата заказа",
    topSellingDishToday: "Хит продаж (сегодня)",
    topSellingTablesToday: "Самые прибыльные столы (сегодня)",
    items: "Позиции",
    paid: "Оплачено",
    billed: "Выставлен счёт",
    shop: "Магазин",
    buyOnEnvato: "Купить на Envato",
    completed: "Завершено",
    inProgress: "В процессе",
    confirmed: "Подтверждено",
    card: "Карта",
    cash: "Наличные",
    mon: "Пн",
    tue: "Вт",
    wed: "Ср",
    thu: "Чт",
    fri: "Пт",
    sat: "Сб",
    sun: "Вс",
    mainCourse: "Основное блюдо",
    appetizers: "Закуски",
    desserts: "Десерты",
    beverages: "Напитки",
    table: "Стол",
    tableNo: "Стол №",
    guests: "гостей",
    sales: "продажи",
    order: "Заказ",
    minsAgo: "мин назад",
    searchYourMenu: "Поиск по меню",
    assignMenuToTable: "Назначить меню столу",
    organizeMenuItems: "Управление позициями меню",
    addMenu: "Добавить меню",
    addMenuItem: "Добавить позицию меню",
    update: "Обновить",
    price: "Цена",
    menuName: "Название меню",
    isAvailable: "Доступно",
    showOnCustomerSite: "Показывать на сайте клиентов",
    action: "Действие",
    actions: "Действия",
    showFilters: "Показать фильтры",
    bulkUpload: "Массовая загрузка",
    searchMenuItem: "Поиск позиции меню",
    itemCount: "Количество позиций",
    noMenusCreated: "Меню ещё не созданы",
    createYourFirstMenu: "Создайте первое меню",
    hideFilters: "Скрыть фильтры",
    bulk: "Массово",
    assignMenu: "Назначить меню",
    noMenuItemsFound: "По вашему запросу позиции меню не найдены",
    noMenuItemsInMenu: "В этом меню пока нет позиций",
    addYourFirstMenuItem: "Добавьте первую позицию меню",
    deleteMenu: "Удалить меню",
    deleteMenuConfirm: "Вы уверены, что хотите удалить это меню? Это действие нельзя отменить.",
    yesDelete: "Да, удалить",
    deleteMenuItem: "Удалить позицию меню",
    deleteMenuItemConfirm: "Вы уверены, что хотите удалить эту позицию меню? Это действие нельзя отменить.",
    addMenuTitle: "Добавить меню",
    addMenuDescription: "Добавьте новое меню для вашего заведения.",
    selectLanguage: "Выберите язык",
    menuNameEnglish: "Название меню (английский)",
    menuNameAzerbaijani: "Название меню (азербайджанский)",
    menuNamePlaceholder: "Введите название меню",
    english: "Английский",
    azerbaijani: "Азербайджанский",
    assignMenuToTableTitle: "Назначить меню столу",
    selectTable: "Выберите стол",
    select: "Выбрать",
    active: "Активен",
    close: "Закрыть",
    addMenuItemDescription: "Добавьте новую позицию меню для вашего заведения.",
    productInformation: "Информация о товаре",
    pricingDetails: "Цены",
    itemName: "Название позиции",
    itemDescription: "Описание позиции",
    itemNamePlaceholder: "Введите название позиции",
    itemDescriptionPlaceholder: "Введите описание позиции",
    chooseMenu: "Выберите меню",
    categoryName: "Название категории",
    selectItemCategory: "Выберите категорию товара",
    itemType: "Тип позиции",
    veg: "Вегетарианское",
    nonVeg: "Не вегетарианское",
    egg: "С яйцом",
    drink: "Напиток",
    halal: "Халяль",
    other: "Другое",
    preparationTime: "Время приготовления",
    preparationTimePlaceholder: "Минуты",
    itemImage: "Изображение",
    chooseFile: "Выбрать файл",
    supportedFormats: "Поддерживаемые форматы: PNG, JPG, GIF, SVG. Максимальный размер: 2 МБ. Рекомендуемый размер: 300 × 300 пикселей",
    hasVariations: "Есть варианты",
    hasVariationsHelp: "Включите, если у позиции несколько вариантов с разными ценами (например, размер, вкус)",
    variations: "Варианты",
    addAnotherVariation: "Добавить ещё вариант",
    variationNamePlaceholder: "Название варианта (например, Маленький, Средний, Большой)",
    variationName: "Название варианта",
    defaultDelivery: "Доставка по умолчанию",
    editMenuItem: "Редактировать позицию меню",
    updateItem: "Обновить позицию",
    backToMenus: "Назад к меню",
    editMenuItemDescription: "Обновите данные ниже, чтобы изменить эту позицию меню.",
    orderTypesPricing: "Цены по типам заказов",
    minutes: "Минуты",
    requiredField: "*",
    addModifierGroupTitle: "Добавить группу модификаторов",
    addModifierGroupDescription: "Добавьте новую группу модификаторов для вашего заведения.",
    modifierNameEnglish: "Название модификатора (английский)",
    modifierNamePlaceholder: "Введите название модификатора",
    descriptionEnglish: "Описание (английский)",
    descriptionPlaceholder: "Введите описание",
    locations: "Локации",
    locationsSelected: "Локаций выбрано",
    selectMenuItem: "Выберите позицию меню",
    locationsHelpText: "Выберите локации, в которых будет доступна эта группа модификаторов.",
    modifierOptions: "Опции модификатора",
    option: "Опция",
    optionNameEnglish: "Название опции (английский)",
    optionNamePlaceholder: "Введите название опции",
    defaultPrice: "Цена по умолчанию",
    deliveryPlatforms: "Платформы доставки",
    baseDeliveryPrice: "Базовая цена доставки",
    addModifierOption: "Добавить опцию модификатора",
    pickup: "Самовывоз",
    dineInPrice: "Цена в зале",
    pickupPrice: "Цена самовывоза",
    deliveryPrice: "Цена доставки",
    itemModifiersPage: "Модификаторы товаров",
    searchItemModifier: "Поиск модификатора",
    addItemModifier: "Добавить модификатор",
    editItemModifier: "Редактировать модификатор",
    modifierGroup: "Группа модификаторов",
    isRequired: "Обязательно",
    allowMultipleSelection: "Разрешить множественный выбор",
    optional: "Необязательно",
    required: "Обязательно",
    yes: "Да",
    no: "Нет",
    noModifiersFound: "Модификаторы не найдены",
    enterItemName: "Введите название позиции",
    enterModifierGroup: "Введите группу модификаторов",
    deleteModifier: "Удалить модификатор",
    deleteModifierConfirm: "Вы уверены, что хотите удалить этот модификатор? Это действие нельзя отменить.",
    allAreas: "Все зоны",
    areaName: "Название зоны",
    noOfTables: "Количество столов",
    addArea: "Добавить зону",
    searchArea: "Поиск зоны",
    tableView: "Вид столов",
    list: "Список",
    grid: "Сетка",
    layout: "Макет",
    filterByAvailability: "Фильтр по доступности",
    addTable: "Добавить стол",
    lounge: "Лаунж",
    roofTop: "Крыша",
    garden: "Сад",
    tableLabel: "Стол",
    assignWaiter: "Назначить официанта",
    seats: "Места",
    available: "Свободен",
    running: "Занят",
    reserved: "Забронирован",
    qrCodesPage: "QR-коды",
    downloadQR: "Скачать QR",
    copyQR: "Копировать QR",
    regenerateQR: "Пересоздать QR",
    multipleChoice: "Множественный выбор",
    reservationsPage: "Бронирования",
    newReservation: "Новое бронирование",
    newReservationDescription: "Заполните данные, чтобы создать новое бронирование.",
    assignTableDescription: "Выберите стол для этого бронирования.",
    currentWeek: "Текущая неделя",
    to: "До",
    searchByNameEmailPhone: "Поиск по имени, email или телефону",
    assignTable: "Назначить стол",
    notes: "Заметки",
    noNotes: "Нет заметок",
    posPage: "Точка продаж",
    filterByMenu: "Фильтр по меню",
    filterByCategory: "Фильтр по категории",
    reset: "Сбросить",
    orderType: "Тип заказа",
    takeaway: "С собой",
    change: "Изменить",
    addCustomerDetails: "Добавить данные клиента",
    orderNumber: "Заказ №",
    mergeTables: "Объединить столы",
    selectWaiter: "Выберите официанта",
    addNote: "Добавить заметку",
    addDiscount: "Добавить скидку",
    saveAsDraft: "Сохранить как черновик",
    kotAndPrint: "KOT и печать",
    kotBillPrintPayment: "KOT, счёт, печать и оплата",
    bill: "СЧЁТ",
    billAndPayment: "Счёт и оплата",
    billAndPrint: "Счёт и печать",
    displayingAllItems: "Показаны все позиции",
    pax: "Гостей",
    subTotal: "Подытог",
    total: "Итого",
    cancelled: "Отменено",
    staffPage: {
      title: "Персонал",
      searchPlaceholder: "Поиск сотрудника",
      export: "Экспорт",
      addMember: "Добавить сотрудника",
      memberName: "Имя сотрудника",
      emailAddress: "Email",
      role: "Роль",
      action: "Действие",
      update: "Обновить",
      cannotChangeOwnRole: "Вы не можете изменить свою роль",
      noStaffFound: "Сотрудники не найдены",
      addNewMember: "Добавить нового сотрудника",
      enterName: "Введите имя",
      enterEmail: "Введите email",
      password: "Пароль",
      enterPassword: "Введите пароль",
      cancel: "Отмена",
      confirmDelete: "Подтвердить удаление",
    },
    deliveryExecutivePage: {
      title: "Курьеры",
      searchPlaceholder: "Поиск курьера",
      export: "Экспорт",
      addExecutive: "Добавить курьера",
      memberName: "Имя",
      phone: "Телефон",
      uniqueCode: "Уникальный код",
      totalOrders: "Всего заказов",
      status: "Статус",
      action: "Действие",
      update: "Обновить",
      noExecutivesFound: "Курьеры не найдены",
      addNewExecutive: "Добавить нового курьера",
      enterName: "Введите имя",
      enterPhone: "Введите телефон",
      enterUniqueCode: "Введите уникальный код",
      password: "Пароль",
      enterPassword: "Введите пароль",
      cancel: "Отмена",
      confirmDelete: "Подтвердить удаление",
      orders: "Заказы",
      showing: "Показано",
      to: "–",
      of: "из",
      results: "результатов",
    },
    expensesPage: {
      title: "Расходы",
      searchPlaceholder: "Поиск расходов",
      showFilters: "Показать фильтры",
      addExpense: "Добавить расход",
      expenseTitle: "Название расхода",
      category: "Категория",
      amount: "Сумма",
      expenseDate: "Дата расхода",
      paymentStatus: "Статус оплаты",
      paymentDate: "Дата оплаты",
      dueDate: "Срок оплаты",
      paymentMethod: "Способ оплаты",
      action: "Действие",
      update: "Обновить",
      paid: "Оплачено",
      pending: "Ожидает",
      cancelled: "Отменено",
      creditCard: "Кредитная карта",
      cash: "Наличные",
      bankTransfer: "Банковский перевод",
      noExpensesFound: "Расходы не найдены",
      addNewExpense: "Добавить новый расход",
      enterTitle: "Введите название",
      selectCategory: "Выберите категорию",
      enterAmount: "Введите сумму",
      selectDate: "Выберите дату",
      selectPaymentMethod: "Выберите способ оплаты",
      cancel: "Отмена",
      confirmDelete: "Подтвердить удаление",
      rent: "Аренда",
      equipment: "Оборудование",
      utilities: "Коммунальные услуги",
      salary: "Зарплата",
      other: "Другое",
    },
    expenseCategoriesPage: {
      title: "Категории расходов",
      searchPlaceholder: "Поиск категорий расходов",
      addCategory: "Добавить категорию",
      categoryName: "Название категории",
      description: "Описание",
      action: "Действие",
      update: "Обновить",
      noCategoriesFound: "Категории расходов не найдены",
      addNewCategory: "Добавить новую категорию",
      enterCategoryName: "Введите название категории",
      enterDescription: "Введите описание",
      cancel: "Отмена",
      confirmDelete: "Подтвердить удаление",
      rent: "Аренда",
      rentDesc: "Расходы на аренду заведения",
      utilities: "Коммунальные услуги",
      utilitiesDesc: "Коммунальные расходы заведения",
      salaries: "Зарплаты",
      salariesDesc: "Зарплаты сотрудников",
      ingredients: "Ингредиенты",
      ingredientsDesc: "Ингредиенты для заведения",
      equipment: "Оборудование",
      equipmentDesc: "Расходы на оборудование",
      marketing: "Маркетинг",
      marketingDesc: "Расходы на маркетинг",
      insurance: "Страхование",
      insuranceDesc: "Расходы на страхование",
      maintenance: "Обслуживание",
      maintenanceDesc: "Расходы на обслуживание",
    },
    paymentsPage: {
      title: "Платежи",
      searchPlaceholder: "Поиск платежей",
      export: "Экспорт",
      id: "ID",
      amount: "Сумма",
      paymentMethod: "Способ оплаты",
      transactionId: "ID транзакции",
      order: "Заказ",
      dateTime: "Дата и время",
      action: "Действие",
      refund: "Возврат",
      card: "Карта",
      upi: "UPI",
      cash: "Наличные",
      bankTransfer: "Банковский перевод",
      noPaymentsFound: "Платежи не найдены",
      ago: "назад",
    },
    ordersPage: {
      title: "Заказы",
      autoRefresh: "Автообновление",
      seconds: "секунд",
      all: "Все",
      allDeliveryApps: "Все приложения доставки",
      today: "Сегодня",
      yesterday: "Вчера",
      thisWeek: "Эта неделя",
      thisMonth: "Этот месяц",
      custom: "Период",
      to: "До",
      showAllOrders: "Показать все заказы",
      showAllWaiter: "Показать всех официантов",
      businessDayInfo: "Информация о рабочем дне",
      newOrder: "Новый заказ",
      mergeOrder: "Объединить заказ",
      order: "Заказ",
      paid: "ОПЛАЧЕНО",
      pending: "ОЖИДАЕТ",
      cancelled: "ОТМЕНЕНО",
      pos: "POS",
      delivery: "ДОСТАВКА",
      dineIn: "В ЗАЛЕ",
      orderDate: "Дата заказа",
      items: "Позиции",
      noOrders: "Заказы не найдены",
      buyOnEmrato: "Купить на Emrato",
      table: "Стол",
      setOrderStatus: "Установить статус заказа",
      orderPlaced: "Заказ оформлен",
      orderConfirmed: "Заказ подтверждён",
      orderPreparing: "Заказ готовится",
      foodIsReady: "Блюдо готово",
      orderServed: "Заказ подан",
      cancelOrder: "Отменить заказ",
      moveToOrderConfirmed: "Перевести в «Заказ подтверждён»",
      itemName: "НАЗВАНИЕ",
      qty: "КОЛ-ВО",
      price: "ЦЕНА",
      amount: "СУММА",
      subTotal: "Подытог",
      sgst: "SGST (2.5%)",
      cgst: "CGST (2.5%)",
      total: "Итого",
      balanceReturned: "Сдача",
      print: "ПЕЧАТЬ",
      close: "Закрыть",
      paymentMethod: "СПОСОБ ОПЛАТЫ",
      dateTime: "ДАТА И ВРЕМЯ",
      card: "Карта",
    },
    kotPage: {
      title: "Все кухонные KOT",
      allKitchens: "Все кухни",
      today: "Сегодня",
      to: "До",
      pending: "Ожидает",
      inKitchen: "На кухне",
      foodIsReady: "Блюдо готово",
      cancelled: "Отменено",
      order: "Заказ",
      orderDate: "Дата заказа",
      pendingConfirmation: "ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ",
      startCooking: "Начать готовить",
      markReady: "Отметить готовым",
      cancel: "Отмена",
      itemName: "НАЗВАНИЕ",
      noKOTs: "KOT не найдены",
      printKOT: "Печать KOT",
      waiter: "Официант",
    },
    salesReportPage: {
      title: "Отчёт по продажам",
      subtitle: "Отчёт по продажам за выбранный период",
      totalSales: "Всего продаж",
      orders: "Заказы",
      traditionalPayments: "Традиционные платежи",
      paymentGateways: "Платёжные шлюзы",
      additionalAmounts: "Дополнительные суммы",
      taxBreakdown: "Разбивка налогов",
      outstandingPayments: "Неоплаченные платежи",
      outstandingOrders: "Неоплаченные заказы",
      cash: "Наличные",
      card: "Карта",
      upi: "UPI",
      bankTransfer: "Банковский перевод",
      totalCharges: "Всего начислений",
      totalTaxes: "Всего налогов",
      discount: "Скидка",
      tip: "Чаевые",
      taxMode: "Режим налога",
      totalTaxCollection: "Всего собрано налогов",
      sgst: "SGST",
      cgst: "CGST",
      date: "Дата",
      totalOrdersColumn: "Всего заказов",
      taxesFromActualBreakdown: "Налоги по фактической разбивке",
      totalTaxAmount: "Общая сумма налога",
      paymentMethods: "Способы оплаты",
      due: "К оплате",
      deliveryFee: "Стоимость доставки",
      total: "Итого",
      totalExcludingTip: "Итого без чаевых",
      currentWeek: "Текущая неделя",
      allUsers: "Все пользователи",
      export: "Экспорт",
      to: "до",
      order: "Заказ",
    },
    itemReportPage: {
      title: "Отчёт по товарам",
      subtitle: "Отчёт по товарам за выбранный период",
      sumOfTotalRevenue: "Сумма общей выручки",
      totalQuantitySold: "Всего продано",
      searchPlaceholder: "Поиск по названию товара",
      export: "Экспорт",
      itemName: "Название товара",
      itemCategoryName: "Категория товара",
      quantitySold: "Продано",
      sellingPrice: "Цена продажи",
      totalRevenue: "Общая выручка",
      currentWeek: "Текущая неделя",
      to: "до",
    },
    categoryReportPage: {
      title: "Отчёт по категориям",
      subtitle: "Отчёт по категориям за выбранный период",
      itemCategory: "Категория товара",
      quantitySold: "Продано",
      amount: "Сумма",
      currentWeek: "Текущая неделя",
      to: "до",
      export: "Экспорт",
    },
    taxReportPage: {
      title: "Отчёт по налогам",
      subtitle: "Отчёт по налогам за выбранный период",
      todayTaxSummary: "Сводка налогов за сегодня",
      todayTaxCollection: "Налоги собраны сегодня",
      todayOrders: "Заказы сегодня",
      todayRevenue: "Выручка сегодня",
      totalTaxes: "Всего налогов",
      totalRevenue: "Общая выручка",
      totalOrders: "Всего заказов",
      totalItemsSold: "Всего продано позиций",
      today: "Сегодня",
      to: "до",
      taxBreakdownByTaxType: "Разбивка налогов по типу",
      taxBreakdownByDate: "Разбивка налогов по дате",
      taxDetailsByOrder: "Детали налогов по заказу",
      taxName: "Название налога",
      taxRate: "Ставка налога",
      totalTaxAmount: "Общая сумма налога",
      itemsCount: "Кол-во позиций",
      ordersCount: "Кол-во заказов",
      total: "Итого",
      export: "Экспорт",
      salesDateFor: "Дата продаж за",
      timePeriod: "Период",
    },
    refundReportPage: {
      title: "Отчёт по возвратам",
      subtitle: "Отчёт по возвратам за выбранный период",
      totalRefunds: "Всего возвратов",
      totalRefundAmount: "Сумма возвратов",
      totalOriginalAmount: "Исходная сумма",
      commissionAdjustment: "Корректировка комиссии",
      currentWeek: "Текущая неделя",
      to: "до",
      searchPlaceholder: "Поиск типа возврата",
      allRefundTypes: "Все типы возвратов",
      export: "Экспорт",
      date: "Дата",
      order: "Заказ",
      refundType: "Тип возврата",
      refundReason: "Причина возврата",
      processedBy: "Обработал",
      originalPrice: "Исходная цена",
      refundedAmount: "Сумма возврата",
      resalePrice: "Цена перепродажи",
      deliveryApp: "Приложение доставки",
      inventoryChange: "Изменение на складе",
      noRecordFound: "Записи не найдены",
      salesDataFrom: "Данные продаж с",
      timePeriodEachDay: "Период по дням",
    },
    deliveryAppReportPage: {
      title: "Отчёт по приложениям доставки",
      subtitle: "Отчёт по приложениям доставки за выбранный период",
      totalOrders: "Всего заказов",
      totalRevenue: "Общая выручка",
      totalCommission: "Общая комиссия",
      totalDeliveryFees: "Общая стоимость доставки",
      netRevenue: "Чистая выручка",
      currentWeek: "Текущая неделя",
      to: "до",
      allDeliveryApps: "Все приложения доставки",
      deliveryApp: "Приложение доставки",
      avgOrderValue: "Средний чек",
      commissionRate: "Ставка комиссии",
      noDeliveryAppOrders: "Нет заказов из приложений доставки",
      salesDataFrom: "Данные продаж с",
      timePeriodEachDay: "Период по дням",
    },
    removedKOTItemReportPage: {
      title: "Отчёт по удалённым позициям KOT",
      subtitle: "Отчёт по удалённым позициям KOT за выбранный период",
      totalRemovedItems: "Всего удалённых позиций",
      totalRemovedAmount: "Сумма удалённых позиций",
      topCancellationReasons: "Частые причины отмены",
      topWaiters: "Топ официантов",
      noDataAvailable: "Нет данных",
      currentWeek: "Текущая неделя",
      to: "до",
      allUsers: "Все пользователи",
      allCancellationReasons: "Все причины отмены",
      export: "Экспорт",
      kotNumber: "Номер KOT",
      orderNumber: "Номер заказа",
      removedBy: "Удалил",
      itemName: "Название позиции",
      quantity: "Количество",
      table: "Стол",
      cancellationReason: "Причина отмены",
      removedDate: "Дата удаления",
      totalPrice: "Общая цена",
      noRemovedKOTItems: "Нет удалённых позиций KOT",
    },
    expenseReportPage: {
      title: "Отчёт по расходам",
      outstandingPaymentTab: "Неоплаченные платежи",
      expenseSummaryTab: "Сводка расходов",
      currentWeek: "Текущая неделя",
      to: "до",
      export: "Экспорт",
      paymentDue: "К оплате",
      dueDate: "Срок оплаты",
      paymentStatus: "Статус оплаты",
      total: "Итого",
      pending: "Ожидает",
      paid: "Оплачено",
      category: "Категория",
      totalExpense: "Всего расходов",
      percentageOfTotal: "Процент от итога",
      noOutstandingPayments: "Нет неоплаченных платежей",
      noExpenseSummary: "Нет сводки расходов",
    },
    cancelledOrderReportPage: {
      title: "Отчёт по отменённым заказам",
      subtitle: "Аудит отменённых заказов: причины отмены и кто отменил",
      totalCancelledOrders: "Всего отменённых заказов",
      totalCancelledAmount: "Сумма отменённых заказов",
      topCancelledReasons: "Частые причины отмены",
      noDataAvailable: "Нет данных",
      currentWeek: "Текущая неделя",
      to: "до",
      allCancellationReasons: "Все причины отмены",
      allUsers: "Все пользователи",
      export: "Экспорт",
      orderNumber: "Номер заказа",
      orderDate: "Дата заказа",
      cancelledDate: "Дата отмены",
      customer: "Клиент",
      tableWaiter: "Стол/официант",
      cancellationReason: "Причина отмены",
      cancelledBy: "Отменил",
      orderTotal: "Сумма заказа",
      noCancelledOrders: "По выбранным фильтрам отменённые заказы не найдены",
    },
    settingsPage: {
      title: "Настройки",
      cashRegister: "Касса",
      inventory: "Склад",
      kitchen: "Кухня",
      general: "Общие",
      app: "Приложение",
      operationalShifts: "Рабочие смены",
      branch: "Филиал",
      currencies: "Валюты",
      email: "Email",
      taxes: "Налоги",
      payment: "Оплата",
      theme: "Тема",
      roles: "Роли",
      billing: "Биллинг",
      reservation: "Бронирование",
      aboutUs: "О нас",
      customerSite: "Сайт для клиентов",
      receipt: "Чек",
      printer: "Принтер",
      delivery: "Доставка",
      kot: "KOT",
      cancellationReasons: "Причины отмены",
      order: "Заказ",
      refundReasons: "Причины возврата",
      kiosk: "Киоск",
      receiptSubtitle: "Настройте, какая информация отображается на чеках клиента.",
      customerInformation: "Данные клиента",
      showCustomerName: "Показывать имя клиента",
      showCustomerAddress: "Показывать адрес клиента",
      showCustomerPhone: "Показывать телефон клиента",
      orderDetails: "Детали заказа",
      showWaiterName: "Показывать имя официанта",
      showTotalGuest: "Показывать число гостей",
      showOrderType: "Показывать тип заказа",
      showRestaurantLogo: "Показывать логотип заведения",
      showRestaurantTax: "Показывать налог заведения",
      uploadPaymentQRCode: "Загрузить QR для оплаты",
      showPaymentQRCode: "Показывать QR для оплаты",
      showPaymentDetails: "Показывать детали оплаты",
      showPaymentStatus: "Показывать статус оплаты",
      qrCodeDescription: "Поддерживаемые форматы: JPG, PNG, SVG, WEBP. Максимальный размер: 2 МБ. Рекомендуемый размер: 200 × 200 пикселей.",
      previewReceipt: "Предпросмотр чека",
      printerSubtitle: "Настройте параметры принтера для вашего заведения.",
      configurePrinterSettings: "Настройте параметры принтера для вашего заведения.",
      desktopAppRequired: "Требуется десктопное приложение",
      desktopAppRequiredDescription: "Для прямой печати необходимо, чтобы десктопное приложение работало в фоне на вашем компьютере. Оно связывает веб-приложение с физическим принтером.",
      addPrinter: "Добавить принтер",
      printerTitle: "Название (для удобной идентификации принтера)",
      titleToIdentifyPrinter: "Название (для удобной идентификации принтера)",
      addPrinterName: "Добавить название принтера",
      printingChoice: "Способ печати",
      browserPopupPrint: "Печать через всплывающее окно браузера",
      selectKitchen: "Выберите кухню",
      selectKitchenDescription: "Выберите только свободные (неназначенные) кухни для этого принтера",
      defaultKitchen: "Кухня по умолчанию",
      vegKitchen: "Вегетарианская кухня",
      nonVegKitchen: "Невегетарианская кухня",
      assigned: "Назначено",
      defaultPrinter: "Принтер по умолчанию",
      idle: "Свободен",
      selectPosTerminal: "Выберите POS-терминал",
      selectPosTerminalDescription: "Выберите только свободные (неназначенные) POS-терминалы для этого принтера",
      defaultPosTerminal: "POS-терминал по умолчанию",
      isDefault: "По умолчанию",
      deactivate: "Деактивировать",
      kitchens: "Кухни",
      orders: "Заказы",
      desktopAppConnection: "Подключение десктопного приложения",
      domainURL: "URL домена",
      apiKey: "API-ключ",
      resetBranchKey: "Сбросить ключ филиала",
      instructions: "Инструкция:",
      downloadDesktopApp: "Скачать десктопное приложение",
      downloadDesktopAppInstruction1: "Скачайте и установите десктопное приложение на компьютер",
      downloadDesktopAppInstruction2: "Откройте десктопное приложение и перейдите в настройки",
      downloadDesktopAppInstruction3: "Введите URL домена и ключ филиала, указанные выше",
      downloadDesktopAppInstruction4: "Нажмите «Подключить», чтобы установить соединение",
      windows: "Windows",
      macOS: "macOS",
      yourDevice: "Ваше устройство",
      downloadForWindows: "Скачать для Windows",
      downloadForMacOS: "Скачать для macOS",
      downloadDesktopForWindows: "Скачайте десктопное приложение для Windows, чтобы включить прямую печать",
      downloadDesktopForMacOS: "Скачайте десктопное приложение для macOS, чтобы включить прямую печать",
      deliverySubtitle: "Настройте параметры доставки для вашего заведения.",
      deliveryWarning: "Для настроек доставки нужны координаты филиала. Сначала обновите расположение филиала.",
      feeDetails: "Детали тарифа",
      feeCalculationMethod: "Метод расчёта тарифа",
      fixedRate: "Фиксированная ставка",
      distanceUnit: "Единица расстояния",
      kilometersKm: "Километры (км)",
      maximumDeliveryRadius: "Максимальный радиус доставки",
      fixedFee: "Фиксированная плата",
      leaveEmptyToDisable: "Оставьте пустым, чтобы отключить эту опцию",
      freeDeliveryOptions: "Опции бесплатной доставки",
      freeDeliveryOverAmount: "Бесплатная доставка от суммы",
      freeDeliveryWithinRadius: "Бесплатная доставка в радиусе",
      deliverySchedule: "Расписание доставки",
      deliveryHomeText: "Текст на главной доставки",
      deliveryCloseEnd: "Конец закрытия доставки",
      makeSureTimeRange: "Убедитесь, что этот диапазон времени СОВПАДАЕТ с V3 Delivery",
      deliveryTimeEstimation: "Оценка времени доставки",
      averageSpeedOfDeliveryRider: "Средняя скорость курьера",
      minh: "Мин/ч",
      additionalTimeBuffer: "Дополнительный запас времени",
      notAdvisableToAddTooMuchTime: "Не рекомендуется добавлять слишком большой запас — так оценка будет ближе к реальному времени. По умолчанию 0, если не изменено",
      kotSubtitle: "Настройте параметры кухонного тикета (KOT) для вашего заведения.",
      enableItemLevelStatus: "Включить статус на уровне позиции",
      enableItemLevelStatusDesc: "Включите, чтобы задавать статусы на уровне отдельных позиций.",
      defaultKOTStatus: "Статус KOT по умолчанию",
      pos: "POS",
      customerTab: "Клиент",
      pending: "Ожидает",
      pendingDesc: "Начальный статус при создании KOT, пока заказ ждёт обработки",
      cooking: "Готовится",
      cookingDesc: "Статус, когда кухня готовит заказ",
      cancellationReasonsSubtitle: "Управляйте причинами отмены заказов и позиций KOT.",
      reason: "ПРИЧИНА",
      cancellationTypes: "ТИПЫ ОТМЕНЫ",
      update: "Обновить",
      confirmDelete: "Вы уверены, что хотите это удалить?",
      default: "По умолчанию",
      restaurantClosingEarly: "Заведение закрывается раньше",
      other: "Другое",
      customerChangedMind: "Клиент передумал",
      customerRequestedToCancel: "Клиент запросил отмену",
      paymentIssues: "Проблемы с оплатой",
      customerNoLongerWantsOrder: "Клиент больше не хочет заказ",
      ingredientNotAvailable: "Ингредиент недоступен",
      preparationTimeTooLong: "Слишком долгое приготовление",
      qualityIssueWithIngredients: "Проблема с качеством ингредиентов",
      systemErrorTechnicalIssue: "Системная ошибка / техническая проблема",
      itemPreparedButReturned: "Позиция была приготовлена, но возвращена клиентом.",
      itemDeliveredButRejected: "Позиция была доставлена, но отклонена.",
      mistakeInOrder: "Ошибка в заказе.",
      productQualityIssue: "Проблема с качеством товара.",
      generalSubtitle: "Укажите общие сведения о вашем заведении.",
      restaurantName: "Название заведения",
      restaurantPhoneNumber: "Телефон заведения",
      restaurantEmailAddress: "Email заведения",
      restaurantAddress: "Адрес заведения",
      select: "Выбрать",
      showTaxIdOnOrders: "Показывать налоговый ID в заказах",
      taxID: "Налоговый ID",
      addMore: "Добавить ещё",
      noTaxFound: "Налоги не найдены",
      additionalCharges: "Дополнительные начисления",
      addCharge: "Добавить начисление",
      chargeName: "НАЗВАНИЕ НАЧИСЛЕНИЯ",
      type: "ТИП",
      rate: "СТАВКА",
      orderType: "ТИП ЗАКАЗА",
      action: "ДЕЙСТВИЕ",
      noChargeFound: "Начисления не найдены.",
      presetAmounts: "Предустановленные суммы",
      buyOnEnvato: "Купить на Envato",
      appSubtitle: "Настройте региональные параметры заведения и видимость верхней навигации.",
      countryTimezoneCurrency: "Страна, часовой пояс и валюта заведения",
      country: "Страна",
      timeFormat: "Формат времени",
      dateFormat: "Формат даты",
      timeZone: "Часовой пояс",
      currency: "Валюта",
      customerSiteLanguage: "Язык сайта клиентов",
      hideTopNavigation: "Скрыть верхнюю навигацию",
      hideTodaysOrders: "Скрыть заказы сегодня",
      hideTodaysOrdersDesc: "Включите, чтобы скрыть виджет заказов сегодня в верхней навигации.",
      hideNewReservation: "Скрыть новые бронирования",
      hideNewReservationDesc: "Включите, чтобы скрыть виджет новых бронирований в верхней навигации.",
      hideNewWaiterRequest: "Скрыть новые вызовы официанта",
      hideNewWaiterRequestDesc: "Включите, чтобы скрыть виджет новых вызовов официанта в верхней навигации.",
      operationalShiftsSubtitle: "Настройте рабочие смены, чтобы задать границы рабочего дня. Заказы, панель и отчёты будут использовать эти смены вместо календарных дней.",
      selectBranchLabel: "Выберите филиал",
      shiftsFor: "Смены для",
      addShift: "Добавить смену",
      noShiftsConfigured: "Рабочие смены не настроены",
      noShiftsMessage: "Начните с добавления первой рабочей смены. Пока смены не настроены, система использует календарные дни (00:00 – 23:59).",
      addFirstShift: "Добавить первую смену",
      howItWorks: "Как это работает",
      howItWorksPoint1: "Рабочий день начинается с момента окончания последней смены предыдущего дня (если она переходит на сегодня) или с полуночи, а не со времени начала смены",
      howItWorksPoint2: "Заказы в рамках смены относятся к календарному дню начала этой смены",
      howItWorksPoint3: "Если смены не настроены, система использует календарные дни (обратная совместимость)",
      howItWorksPoint4: "Ночные смены (например, 18:00 – 02:00) поддерживаются и относятся к дню начала",
      branchSubtitle: "Управляйте филиалами и локациями заведения.",
      addBranch: "Добавить филиал",
      branchName: "НАЗВАНИЕ ФИЛИАЛА",
      branchAddress: "АДРЕС ФИЛИАЛА",
      cannotDeleteCurrentBranch: "Нельзя удалить текущий филиал",
      currenciesSubtitle: "Управляйте валютами, поддерживаемыми вашим заведением.",
      addCurrency: "Добавить валюту",
      currencyName: "ВАЛЮТА",
      currencySymbol: "СИМВОЛ ВАЛЮТЫ",
      currencyFormatSample: "ФОРМАТ ВАЛЮТЫ (ПРИМЕР: 12345.6789)",
      cannotDeleteDefaultCurrency: "Нельзя удалить валюту по умолчанию",
      emailSubtitle: "Настройте email-уведомления для различных событий.",
      notification: "Уведомление",
      newOrderReceived: "Получен новый заказ",
      newOrderReceivedDesc: "Администратор заведения получит email при оформлении нового заказа клиентом.",
      reservationConfirmation: "Подтверждение бронирования",
      reservationConfirmationDesc: "Клиент получит email после оформления бронирования.",
      newReservationReceived: "Получено новое бронирование",
      newReservationReceivedDesc: "Администратор заведения получит email при новом бронировании клиентом.",
      orderBill: "Счёт заказа",
      orderBillDesc: "Клиент получит счёт заказа по email.",
      staffWelcomeEmail: "Приветственное письмо сотруднику",
      staffWelcomeEmailDesc: "Сотрудник получит приветственное письмо при добавлении нового сотрудника.",
      emailNotifications: "Email-уведомления",
      emailTemplates: "Шаблоны писем",
      noTemplateFound: "Шаблоны писем не найдены",
      taxesSubtitle: "Управляйте применением налогов к заказам и позициям.",
      taxSettings: "Настройки налогов",
      allTaxes: "Все налоги",
      taxMode: "Режим налога",
      orderLevelTax: "Налог на уровне заказа",
      orderLevelTaxDesc: "Применять налог к итоговой сумме заказа.",
      itemLevelTax: "Налог на уровне позиции",
      itemLevelTaxDesc: "Применять разные ставки налога к каждой позиции.",
      taxCalculationBase: "База расчёта налога",
      taxCalculationBaseDesc: "Выберите, как считать налоги — с сервисными сборами в базе или без них.",
      includeServiceCharges: "Включать сервисные сборы в расчёт налога",
      includeServiceChargesDesc: "Налог считается от (подытог − скидка) + сервисные сборы",
      includeServiceChargesFormula: "Налоговая база = (подытог − скидка) + сервисные сборы",
      excludeServiceCharges: "Исключать сервисные сборы из расчёта налога",
      excludeServiceChargesDesc: "Налог считается только от (подытог − скидка)",
      excludeServiceChargesFormula: "Налоговая база = (подытог − скидка)",
      allTaxesApplicable: "Все налоги применяются при создании заказа.",
      addTax: "Добавить налог",
      taxName: "НАЗВАНИЕ НАЛОГА",
      taxPercent: "ПРОЦЕНТ НАЛОГА",
      themeSubtitle: "Настройте внешний вид панели управления заведения.",
      logo: "Логотип",
      uploadLogoForRestaurant: "Загрузите логотип вашего заведения",
      uploadLogo: "Загрузить логотип",
      logoSupportedFormats: "Поддерживаемые форматы: PNG, JPG, GIF, SVG, JPEG. Максимальный размер: 5 МБ. Рекомендуемый размер: 57 × 57 пикселей.",
      favicon: "Favicon",
      uploadFaviconFor: "Загрузить favicon для",
      generateFavicon: "Сгенерировать favicon",
      uploadFaviconPhone: "Загрузить favicon для телефона — 1024×1024 px",
      uploadFaviconTablet: "Загрузить favicon для планшета — 512×512 px",
      uploadFaviconDesktop: "Загрузить favicon для ПК — 192×192 px",
      upload: "Загрузить",
      themeColor: "Цвет темы",
      selectThemeColor: "Выберите цвет темы для вашего заведения",
      restaurant: "Заведение",
      fresh: "Свежий",
      warm: "Тёплый",
      refresh: "ОБНОВИТЬ",
      rolesSubtitle: "Управляйте ролями и правами сотрудников заведения.",
      manageRole: "Управление ролью",
      userPermission: "ПРАВА ПОЛЬЗОВАТЕЛЯ",
      role: "РОЛЬ",
      branchHead: "РУКОВОДИТЕЛЬ ФИЛИАЛА",
      waiter: "ОФИЦИАНТ",
      chef: "ПОВАР",
      menu: "МЕНЮ",
      createMenu: "Создать меню",
      showMenu: "Просматривать меню",
      updateMenu: "Обновлять меню",
      deleteMenu: "Удалять меню",
      menuItem: "ПОЗИЦИЯ МЕНЮ",
      createMenuItem: "Создавать позицию меню",
      showMenuItem: "Просматривать позицию меню",
      updateMenuItem: "Обновлять позицию меню",
      deleteMenuItem: "Удалять позицию меню",
      itemCategory: "КАТЕГОРИЯ ТОВАРА",
      createItemCategory: "Создавать категорию товара",
      showItemCategory: "Просматривать категорию товара",
      updateItemCategory: "Обновлять категорию товара",
      deleteItemCategory: "Удалять категорию товара",
      area: "ЗОНА",
      createArea: "Создавать зону",
      showArea: "Просматривать зону",
      updateArea: "Обновлять зону",
      deleteArea: "Удалять зону",
      table: "СТОЛ",
      createTable: "Создавать стол",
      showTable: "Просматривать стол",
      updateTable: "Обновлять стол",
      deleteTable: "Удалять стол",
      reservationPerm: "БРОНИРОВАНИЕ",
      createReservation: "Создавать бронирование",
      showReservation: "Просматривать бронирование",
      updateReservation: "Обновлять бронирование",
      deleteReservation: "Удалять бронирование",
      kotPerm: "KOT",
      manageKOT: "Управлять KOT",
      orderPerm: "ЗАКАЗ",
      createOrder: "Создавать заказ",
      showOrder: "Просматривать заказ",
      updateOrder: "Обновлять заказ",
      deleteOrder: "Удалять заказ",
      addDiscountOnPOS: "Добавлять скидку в POS",
      customer: "КЛИЕНТ",
      createCustomer: "Создавать клиента",
      showCustomer: "Просматривать клиента",
      updateCustomer: "Обновлять клиента",
      deleteCustomer: "Удалять клиента",
      staff: "ПЕРСОНАЛ",
      createStaffMember: "Создавать сотрудника",
      showStaffMember: "Просматривать сотрудника",
      updateStaffMember: "Обновлять сотрудника",
      deleteStaffMember: "Удалять сотрудника",
      paymentPerm: "ОПЛАТА",
      showPayments: "Просматривать платежи",
      report: "ОТЧЁТ",
      showReports: "Просматривать отчёты",
      settings: "НАСТРОЙКИ",
      manageSettings: "Управлять настройками",
      deliveryExecutive: "КУРЬЕР",
      createDeliveryExecutive: "Создавать курьера",
      showDeliveryExecutive: "Просматривать курьера",
      updateDeliveryExecutive: "Обновлять курьера",
      deleteDeliveryExecutive: "Удалять курьера",
      waiterRequest: "ВЫЗОВ ОФИЦИАНТА",
      manageWaiterRequest: "Управлять вызовами официанта",
      expenses: "РАСХОДЫ",
      createExpenses: "Создавать расходы",
      showExpenses: "Просматривать расходы",
      updateExpenses: "Обновлять расходы",
      deleteExpenses: "Удалять расходы",
      createExpenseCategory: "Создавать категорию расходов",
      showExpenseCategory: "Просматривать категорию расходов",
      updateExpenseCategory: "Обновлять категорию расходов",
      deleteExpenseCategory: "Удалять категорию расходов",
      manageRoleModal: "Управление ролью",
      roleColumn: "РОЛЬ",
      actionColumn: "ДЕЙСТВИЕ",
      defaultRoleCannotBeDeleted: "Роль по умолчанию нельзя удалить.",
      addNewRole: "Добавить новую роль",
      displayName: "Отображаемое имя",
      enterDisplayName: "Введите отображаемое имя",
      copyPermissionsFromRole: "Скопировать права из роли (необязательно)",
      dontCopyPermissions: "Не копировать права",
      cancel: "Отмена",
      createRole: "Создать роль",
      billingSubtitle: "Управляйте тарифным планом и платёжной информацией",
      planDetails: "Детали плана",
      purchaseHistory: "История покупок",
      offlineRequest: "Офлайн-запрос",
      currentPlanName: "Название текущего плана",
      currentPlanType: "Тип текущего плана",
      licenseExpiresOn: "Лицензия действует до",
      daysLeft: "дней осталось",
      additionalFeatures: "Дополнительные функции",
      changeBranch: "Смена филиала",
      exportReport: "Экспорт отчёта",
      tableReservation: "Бронирование столов",
      paymentGatewayIntegration: "Интеграция платёжного шлюза",
      themeSetting: "Настройка темы",
      customerDisplay: "Экран для клиентов",
      upgradePlan: "Улучшить план",
      package: "ПАКЕТ",
      billingCycle: "ПЛАТЁЖНЫЙ ЦИКЛ",
      paymentDate: "ДАТА ОПЛАТЫ",
      nextPaymentDate: "СЛЕДУЮЩАЯ ДАТА ОПЛАТЫ",
      transactionId: "ID ТРАНЗАКЦИИ",
      paymentGateway: "ПЛАТЁЖНЫЙ ШЛЮЗ",
      amount: "СУММА",
      packageDetails: "ДЕТАЛИ ПАКЕТА",
      offline: "Офлайн",
      paymentBy: "ОПЛАТА ЧЕРЕЗ",
      created: "СОЗДАНО",
      status: "СТАТУС",
      noOfflinePaymentRequestFound: "Офлайн-запросы на оплату не найдены",
      reservationSubtitle: "Настройте параметры бронирования и временные слоты для вашего заведения",
      reservationSettings: "Настройки бронирования",
      enableAdminReservations: "Включить бронирования администратором",
      enableAdminReservationsDesc: "Разрешить персоналу создавать бронирования через панель администратора",
      enableCustomerReservations: "Включить бронирования клиентами",
      enableCustomerReservationsDesc: "Разрешить клиентам бронировать через сайт для клиентов",
      minimumPartySize: "Минимальный размер компании",
      minimumPartySizeDesc: "Укажите минимальное число гостей для бронирования",
      disableSlotMinutes: "Отключение слота (минуты)",
      disableSlotMinutesDesc: "За сколько минут до слота отключать бронирование. Применяется только к бронированиям на сегодня",
      minutes: "Минуты",
      timeSlotsSettings: "Настройки временных слотов",
      monday: "Понедельник",
      tuesday: "Вторник",
      wednesday: "Среда",
      thursday: "Четверг",
      friday: "Пятница",
      saturday: "Суббота",
      sunday: "Воскресенье",
      slotType: "ТИП СЛОТА",
      startTime: "ВРЕМЯ НАЧАЛА",
      endTime: "ВРЕМЯ ОКОНЧАНИЯ",
      timeSlotDifference: "ИНТЕРВАЛ СЛОТА",
      available: "ДОСТУПЕН",
      breakfast: "Завтрак",
      lunch: "Обед",
      dinner: "Ужин",
      aboutUsSubtitle: "Управляйте содержимым раздела «О нас» на сайте для клиентов",
      customerSiteSubtitle: "Настройте параметры сайта для клиентов.",
      customizeHeaderTab: "Настройка шапки",
      orderSettings: "Настройки заказов",
      allowCustomerOrders: "Разрешить клиентам оформлять заказы",
      allowCustomerOrdersDesc: "Включите, чтобы клиенты могли оформлять заказы.",
      customerLoginRequired: "Клиенту нужен вход для оформления заказа?",
      customerLoginRequiredDesc: "Включите, чтобы требовать вход перед оформлением заказа.",
      allowQROrders: "Разрешить QR-заказы в радиусе",
      allowQROrdersDesc: "Разрешать QR-заказы только если клиент находится в указанном радиусе (метры) от филиала.",
      pickupDaysRange: "Диапазон дней самовывоза",
      enableTipCustomerSite: "Включить чаевые на сайте клиентов",
      enableTipCustomerSiteDesc: "Включите, чтобы клиенты могли добавлять чаевые к заказам.",
      enableTipPOS: "Включить чаевые в POS",
      enableTipPOSDesc: "Включите, чтобы можно было добавлять чаевые к заказам в POS.",
      autoConfirmOrderStatus: "Автоподтверждение статуса заказа",
      autoConfirmOrderStatusDesc: "Включите, чтобы автоматически подтверждать статус заказа и отправлять в KOT.",
      showVeg: "Показывать вегетарианское",
      showVegDesc: "Показывать вегетарианские позиции в меню.",
      showHalal: "Показывать халяль",
      showHalalDesc: "Показывать халяльные позиции в меню.",
      callWaiterSettings: "Настройки вызова официанта",
      enableWaiterRequest: "Включить вызов официанта",
      enableWaiterRequestDesc: "Включите, чтобы клиенты могли вызывать официанта.",
      onMobile: "На мобильном",
      onMobileDesc: "Включите, чтобы клиенты могли вызывать официанта с мобильного.",
      onDesktop: "На компьютере",
      onDesktopDesc: "Включите, чтобы клиенты могли вызывать официанта с компьютера.",
      onlyWhenOpenViaQR: "Только при открытии через QR",
      onlyWhenOpenViaQRDesc: "Включите, чтобы вызов официанта был доступен только при открытии через QR-код.",
      dineInSettings: "Настройки обслуживания в зале",
      tableRequiredForDineIn: "Стол обязателен для заказа в зале",
      tableRequiredForDineInDesc: "Включите, чтобы клиенты выбирали стол для заказов в зале.",
      defaultTableReservationStatus: "Статус бронирования стола по умолчанию",
      defaultTableReservationStatusDesc: "Выберите статус по умолчанию для новых бронирований.",
      pwaSettings: "Настройки PWA",
      enablePWA: "Включить PWA-приложение",
      enablePWADesc: "Включите, чтобы клиенты могли установить приложение на свои устройства.",
      tableSettings: "Настройки столов",
      tableLockTimeout: "Таймаут блокировки стола (минуты)",
      tableLockTimeoutDesc: "Сколько минут стол остаётся заблокированным, пока сотрудник с ним работает.",
      socialMediaLinks: "Ссылки на соцсети",
      facebookLink: "Ссылка Facebook",
      instagramLink: "Ссылка Instagram",
      twitterLink: "Ссылка Twitter",
      yelpLink: "Ссылка Yelp",
      seo: "SEO",
      metaKeyword: "Meta Keyword",
      metaDescription: "Meta Description",
      wifiSettings: "Настройки Wi‑Fi",
      showWiFiIcon: "Показывать значок Wi‑Fi",
      showWiFiIconDesc: "Включите, чтобы показывать значок Wi‑Fi в навигации сайта клиентов.",
      wifiName: "Имя сети Wi‑Fi",
      wifiNameDesc: "Введите имя сети Wi‑Fi (SSID) вашего заведения.",
      wifiPassword: "Пароль Wi‑Fi",
      wifiPasswordDesc: "Введите пароль Wi‑Fi вашего заведения.",
    },
    waiterRequestsPage: {
      title: "Вызовы официанта",
      autoRefresh: "Автообновление",
      seconds: "Секунд",
      table: "Стол",
      markAttended: "Отметить выполненным",
      doItLater: "Позже",
      newWaiterRequestFor: "Новый вызов официанта для стола —",
      secondsAgo: "секунд назад",
    },
    customersPage: {
      title: "Клиенты",
      searchPlaceholder: "Поиск по имени, email или телефону",
      import: "Импорт",
      export: "Экспорт",
      addCustomer: "Добавить клиента",
      customerName: "ИМЯ КЛИЕНТА",
      emailAddress: "EMAIL",
      phone: "ТЕЛЕФОН",
      totalOrders: "ВСЕГО ЗАКАЗОВ",
      action: "ДЕЙСТВИЕ",
      orders: "ЗАКАЗЫ",
      update: "Обновить",
      noCustomersFound: "Клиенты не найдены",
      showing: "Показано",
      to: "–",
      of: "из",
      results: "результатов",
    },
  }

};

export function getTranslation(lang: Language, key: keyof Translations): string {
  return translations[lang][key] || translations.en[key] || key;
}

/** Subscription payment UI copy (en/az) — see billingTranslations.ts */
export { billingTranslations, billingT, fillDays } from "./billingTranslations";
