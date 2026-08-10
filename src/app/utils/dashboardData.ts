// Shared data for Corporate Dashboard
// This file exports mock data used across different pages

export interface Order {
  id: string;
  client: string;
  orderDate: string;
  deliveryDate: string;
  amount: string;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  items: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  image: string;
  category: string;
  brand: string;
  price: number;
  unit: string;
  quantity: number;
  createdBy: string;
  createdById: string;
}

export interface Client {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: string;
  status: "Active" | "Inactive";
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  products: string;
  status: "Active" | "Inactive";
}

// Orders Data
export const mockOrders: Order[] = [
  {
    id: "ORD-1245",
    client: "Tech Solutions LLC",
    orderDate: "Mar 4, 2026",
    deliveryDate: "Mar 10, 2026",
    amount: "₼3,450",
    status: "Completed",
    items: 5,
  },
  {
    id: "ORD-1244",
    client: "Global Enterprises",
    orderDate: "Mar 3, 2026",
    deliveryDate: "Mar 9, 2026",
    amount: "₼2,890",
    status: "Processing",
    items: 3,
  },
  {
    id: "ORD-1243",
    client: "Innovation Corp",
    orderDate: "Mar 2, 2026",
    deliveryDate: "Mar 8, 2026",
    amount: "₼5,250",
    status: "Pending",
    items: 8,
  },
  {
    id: "ORD-1242",
    client: "Digital Partners",
    orderDate: "Mar 1, 2026",
    deliveryDate: "Mar 7, 2026",
    amount: "₼1,670",
    status: "Completed",
    items: 2,
  },
  {
    id: "ORD-1241",
    client: "Tech Solutions LLC",
    orderDate: "Feb 28, 2026",
    deliveryDate: "Mar 6, 2026",
    amount: "₼1,890",
    status: "Cancelled",
    items: 2,
  },
];

// Products Data
export const mockProducts: Product[] = [
  {
    id: "1",
    sku: "PT001",
    name: "Lenovo IdeaPad 3",
    image: "💻",
    category: "Computers",
    brand: "Lenovo",
    price: 600,
    unit: "Pc",
    quantity: 100,
    createdBy: "James Kirwin",
    createdById: "1",
  },
  {
    id: "2",
    sku: "PT002",
    name: "Beats Pro",
    image: "🎧",
    category: "Electronics",
    brand: "Beats",
    price: 160,
    unit: "Pc",
    quantity: 140,
    createdBy: "Francis Chang",
    createdById: "2",
  },
  {
    id: "3",
    sku: "PT003",
    name: "Nike Jordan",
    image: "👟",
    category: "Shoe",
    brand: "Nike",
    price: 110,
    unit: "Pc",
    quantity: 300,
    createdBy: "Antonio Engle",
    createdById: "3",
  },
  {
    id: "4",
    sku: "PT004",
    name: "Apple Series 5 Watch",
    image: "⌚",
    category: "Electronics",
    brand: "Apple",
    price: 120,
    unit: "Pc",
    quantity: 450,
    createdBy: "Leo Kelly",
    createdById: "4",
  },
  {
    id: "5",
    sku: "PT005",
    name: "Amazon Echo Dot",
    image: "🔊",
    category: "Electronics",
    brand: "Amazon",
    price: 80,
    unit: "Pc",
    quantity: 320,
    createdBy: "Annette Walker",
    createdById: "5",
  },
  {
    id: "6",
    sku: "PT006",
    name: "Sanford Chair Sofa",
    image: "🪑",
    category: "Furnitures",
    brand: "Modern Wave",
    price: 320,
    unit: "Pc",
    quantity: 650,
    createdBy: "John Weaver",
    createdById: "6",
  },
  {
    id: "7",
    sku: "PT007",
    name: "Red Premium Satchel",
    image: "👜",
    category: "Bags",
    brand: "Dior",
    price: 60,
    unit: "Pc",
    quantity: 700,
    createdBy: "Francis White",
    createdById: "7",
  },
  {
    id: "8",
    sku: "PT008",
    name: "iPhone 15 Pro Max",
    image: "📱",
    category: "Phones",
    brand: "Apple",
    price: 1200,
    unit: "Pc",
    quantity: 80,
    createdBy: "Sarah Martinez",
    createdById: "8",
  },
];

// Clients Data
export const mockClients: Client[] = [
  {
    id: 1,
    companyName: "Tech Solutions LLC",
    contactPerson: "John Smith",
    email: "john@techsolutions.com",
    phone: "+994 50 123 4567",
    address: "Baku, Azerbaijan",
    totalOrders: 24,
    totalSpent: "₼12,450",
    status: "Active",
  },
  {
    id: 2,
    companyName: "Global Enterprises",
    contactPerson: "Sarah Johnson",
    email: "sarah@global.com",
    phone: "+994 51 234 5678",
    address: "Baku, Azerbaijan",
    totalOrders: 18,
    totalSpent: "₼9,820",
    status: "Active",
  },
  {
    id: 3,
    companyName: "Innovation Corp",
    contactPerson: "Mike Davis",
    email: "mike@innovation.com",
    phone: "+994 55 345 6789",
    address: "Baku, Azerbaijan",
    totalOrders: 31,
    totalSpent: "₼18,650",
    status: "Active",
  },
  {
    id: 4,
    companyName: "Digital Partners",
    contactPerson: "Emily Chen",
    email: "emily@digitalpartners.com",
    phone: "+994 70 456 7890",
    address: "Baku, Azerbaijan",
    totalOrders: 12,
    totalSpent: "₼5,200",
    status: "Inactive",
  },
];

// Dashboard Stats Calculations
export function getDashboardStats() {
  // Calculate total orders count
  const totalOrders = mockOrders.length; // 5
  
  // Calculate total customers count (all clients, not just active)
  const totalCustomers = mockClients.length; // 4
  
  // Calculate total products count
  const totalProducts = mockProducts.length; // 8
  
  // Calculate total revenue from orders
  const totalRevenue = mockOrders.reduce((sum, order) => {
    const amount = parseFloat(order.amount.replace("₼", "").replace(",", ""));
    if (order.status === "Completed") {
      return sum + amount;
    }
    return sum;
  }, 0);
  
  return {
    totalOrders,    // 5
    totalCustomers, // 4
    totalProducts,  // 8
    totalRevenue: `₼${totalRevenue.toLocaleString()}`,
  };
}

// Suppliers Data
export const mockSuppliers: Supplier[] = [
  {
    id: "1",
    code: "SP001",
    name: "Tech Supplies Co",
    email: "contact@techsupplies.com",
    phone: "+13216549870",
    company: "Tech Supplies Corporation",
    products: "Electronics",
    status: "Active",
  },
  {
    id: "2",
    code: "SP002",
    name: "Global Distributors",
    email: "info@globaldist.com",
    phone: "+14567891230",
    company: "Global Distributors Ltd",
    products: "Various",
    status: "Active",
  },
  {
    id: "3",
    code: "SP003",
    name: "Quality Foods Inc",
    email: "sales@qualityfoods.com",
    phone: "+17894561230",
    company: "Quality Foods International",
    products: "Food & Beverages",
    status: "Active",
  },
  {
    id: "4",
    code: "SP004",
    name: "Hardware Direct",
    email: "orders@hardwaredirect.com",
    phone: "+19876543210",
    company: "Hardware Direct Solutions",
    products: "Hardware Tools",
    status: "Inactive",
  },
  {
    id: "5",
    code: "SP005",
    name: "Fashion Wholesale",
    email: "wholesale@fashion.com",
    phone: "+15551234567",
    company: "Fashion Wholesale Group",
    products: "Clothing & Apparel",
    status: "Active",
  },
  {
    id: "6",
    code: "SP006",
    name: "Office Supplies Plus",
    email: "contact@officesupplies.com",
    phone: "+16667891234",
    company: "Office Supplies Plus Inc",
    products: "Office Supplies",
    status: "Active",
  },
];

// Sales & Purchase Data by Month (Satış & Satınalma)
export function getSalesPurchaseData() {
  return [
    { month: "Jan", sales: 250, purchase: 150 },
    { month: "Feb", sales: 280, purchase: 120 },
    { month: "Mar", sales: 320, purchase: 180 },
    { month: "Apr", sales: 380, purchase: 220 },
    { month: "May", sales: 290, purchase: 160 },
    { month: "Jun", sales: 240, purchase: 140 },
    { month: "Jul", sales: 310, purchase: 190 },
    { month: "Aug", sales: 400, purchase: 250 },
    { month: "Sep", sales: 280, purchase: 160 },
  ];
}

// Calculate total sales and purchase
export function getSalesPurchaseTotals() {
  const data = getSalesPurchaseData();
  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
  const totalPurchase = data.reduce((sum, item) => sum + item.purchase, 0);
  
  return {
    totalSales,     // 2750
    totalPurchase,  // 1570
  };
}

// General Information (Ümumi Məlumat)
export function getGeneralInfo() {
  return {
    suppliers: mockSuppliers.length, // 6
    customers: mockClients.length,   // 4
    orders: mockOrders.length,       // 5
  };
}

// Customer Summary (Müştərilər İcmalı) - First time vs Returning
export function getCustomerSummary() {
  // Calculate based on client order history
  const firstTimeCustomers = mockClients.filter(c => c.totalOrders <= 3).length;
  const returningCustomers = mockClients.filter(c => c.totalOrders > 3).length;
  
  return {
    firstTime: firstTimeCustomers,
    returning: returningCustomers,
    firstTimeGrowth: 8.9, // percentage
    returningGrowth: 8.9, // percentage
  };
}

// Sales Analytics Data (Satış Analitikası)
export function getSalesAnalytics() {
  return [
    { month: "Jan", sales: 25000 },
    { month: "Feb", sales: 32000 },
    { month: "Mar", sales: 28000 },
    { month: "Apr", sales: 35000 },
    { month: "May", sales: 42000 },
    { month: "Jun", sales: 38000 },
    { month: "Jul", sales: 45000 },
    { month: "Aug", sales: 40000 },
    { month: "Sep", sales: 48000 },
    { month: "Oct", sales: 43000 },
    { month: "Nov", sales: 46000 },
    { month: "Dec", sales: 50000 },
  ];
}

// Sales by Country (Ölkələrə görə Satış)
export function getSalesByCountry() {
  return {
    growth: 48, // percentage
    countries: [
      { name: "Azerbaijan", sales: 15000, percentage: 45 },
      { name: "Turkey", sales: 10000, percentage: 30 },
      { name: "Georgia", sales: 5000, percentage: 15 },
      { name: "Other", sales: 3333, percentage: 10 },
    ],
  };
}

// Best Seller Products (Ən Çox Satılan)
export function getBestSellerProducts() {
  // Use actual products with calculated sales based on their data
  return [
    {
      name: mockProducts[0].name, // Lenovo IdeaPad 3
      sales: 65547,
      image: mockProducts[0].image,
      product: mockProducts[0],
    },
    {
      name: mockProducts[7].name, // iPhone 15 Pro Max
      sales: 58784,
      image: mockProducts[7].image,
      product: mockProducts[7],
    },
    {
      name: mockProducts[1].name, // Beats Pro
      sales: 54174,
      image: mockProducts[1].image,
      product: mockProducts[1],
    },
  ];
}

// Recent Transactions (Son Əməliyyatlar)
export function getRecentTransactions() {
  return [
    {
      id: "1",
      productName: mockProducts[6].name, // Red Premium Satchel
      productImage: mockProducts[6].image,
      time: "15 Mins",
      amount: "1099 ₼",
      status: "Success" as const,
    },
    {
      id: "2",
      productName: mockProducts[1].name, // Beats Pro
      productImage: mockProducts[1].image,
      time: "15 Mins",
      amount: "600.55 ₼",
      status: "Cancelled" as const,
    },
    {
      id: "3",
      productName: mockProducts[7].name, // iPhone 15 Pro Max
      productImage: mockProducts[7].image,
      time: "15 Mins",
      amount: "1099 ₼",
      status: "Completed" as const,
    },
  ];
}

// Weekly Earning (Həftəlik Qazanc)
export function getWeeklyEarning() {
  // Calculate from completed orders
  const completedOrders = mockOrders.filter(o => o.status === "Completed");
  const weeklyTotal = completedOrders.reduce((sum, order) => {
    const amount = parseFloat(order.amount.replace("₼", "").replace(",", ""));
    return sum + amount;
  }, 0);
  
  return {
    amount: weeklyTotal, // 5120
    growth: 48,
  };
}

// Expired Products (Vaxtı Keçmiş Məhsullar)
export function getExpiredProducts() {
  return [
    {
      id: "1",
      name: mockProducts[6].name, // Red Premium Satchel
      image: mockProducts[6].image,
      sku: mockProducts[6].sku,
      purchaseDate: "17 Jan 2023",
      expiryDate: "28 Mar 2023",
    },
    {
      id: "2",
      name: mockProducts[7].name, // iPhone 15 Pro Max
      image: mockProducts[7].image,
      sku: mockProducts[7].sku,
      purchaseDate: "22 Feb 2023",
      expiryDate: "04 Apr 2023",
    },
    {
      id: "3",
      name: "Black Slim 200",
      image: "📦",
      sku: "PT008",
      purchaseDate: "18 Mar 2023",
      expiryDate: "13 May 2023",
    },
    {
      id: "4",
      name: "Woodcraft Sandal",
      image: "👡",
      sku: "PT009",
      purchaseDate: "29 Mar 2023",
      expiryDate: "27 May 2023",
    },
    {
      id: "5",
      name: mockProducts[3].name, // Apple Series 5 Watch
      image: mockProducts[3].image,
      sku: mockProducts[3].sku,
      purchaseDate: "24 Mar 2023",
      expiryDate: "26 May 2023",
    },
  ];
}

// Recently Added Products (Son Əlavə Olunan Məhsullar)
export function getRecentlyAddedProducts() {
  return mockProducts.slice(0, 4).map(product => ({
    ...product,
    totalValue: product.price * product.quantity,
  }));
}

// Stat Cards Data
export function getStatCards() {
  return [
    {
      id: "1",
      title: { az: "Ümumi Satınalma Borcu", en: "Total Purchase Due" },
      amount: 307144,
      color: "orange",
    },
    {
      id: "2",
      title: { az: "Ümumi Satış Borcu", en: "Total Sales Due" },
      amount: 4385,
      color: "cyan",
    },
    {
      id: "3",
      title: { az: "Ümumi Satış Mənfəəti", en: "Total Sale Profit" },
      amount: 385656.5,
      color: "blue",
    },
    {
      id: "4",
      title: { az: "Ümumi Xərclər", en: "Total Expense" },
      amount: 40000,
      color: "red",
    },
  ];
}

// Top Selling Products (Ən Çox Satılan Məhsullar)
export function getTopSellingProducts() {
  // Use real products with high sales
  return [
    {
      name: mockProducts[0].name, // Lenovo IdeaPad 3
      id: mockProducts[0].sku,
      sales: 247,
      percentage: "+25%",
      image: mockProducts[0].image,
    },
    {
      name: mockProducts[1].name, // Beats Pro
      id: mockProducts[1].sku,
      sales: 289,
      percentage: "+15%",
      image: mockProducts[1].image,
    },
    {
      name: mockProducts[3].name, // Apple Series 5 Watch
      id: mockProducts[3].sku,
      sales: 306,
      percentage: "+15%",
      image: mockProducts[3].image,
    },
    {
      name: mockProducts[7].name, // iPhone 15 Pro Max
      id: mockProducts[7].sku,
      sales: 238,
      percentage: "+23%",
      image: mockProducts[7].image,
    },
    {
      name: mockProducts[2].name, // Samsung Galaxy S21
      id: mockProducts[2].sku,
      sales: 385,
      percentage: "+35%",
      image: mockProducts[2].image,
    },
  ];
}

// Low Stock Products (Az Stoklu Məhsullar)
export function getLowStockProducts() {
  // Products with low quantity
  return [
    {
      name: mockProducts[0].name, // Lenovo IdeaPad 3
      id: mockProducts[0].sku,
      stock: `Instock ${mockProducts[0].quantity}`,
      image: mockProducts[0].image,
    },
    {
      name: mockProducts[7].name, // iPhone 15 Pro Max
      id: mockProducts[7].sku,
      stock: `Instock ${mockProducts[7].quantity}`,
      image: mockProducts[7].image,
    },
    {
      name: mockProducts[4].name, // Nike Air Force 1
      id: mockProducts[4].sku,
      stock: `Instock ${mockProducts[4].quantity}`,
      image: mockProducts[4].image,
    },
    {
      name: mockProducts[5].name, // Adidas Ultraboost
      id: mockProducts[5].sku,
      stock: `Instock ${mockProducts[5].quantity}`,
      image: mockProducts[5].image,
    },
    {
      name: mockProducts[6].name, // Red Premium Satchel
      id: mockProducts[6].sku,
      stock: `Instock ${mockProducts[6].quantity}`,
      image: mockProducts[6].image,
    },
  ];
}

// Recent Sales (Son Satışlar)
export function getRecentSales() {
  // Generate from recent orders
  return [
    {
      name: mockProducts[3].name, // Apple Series 5 Watch
      category: mockProducts[3].category,
      sales: mockProducts[3].price,
      date: "Today",
      status: "Processing",
      image: mockProducts[3].image,
    },
    {
      name: mockProducts[6].name, // Red Premium Satchel
      category: mockProducts[6].category,
      sales: mockProducts[6].price,
      date: "Today",
      status: "Cancelled",
      image: mockProducts[6].image,
    },
    {
      name: mockProducts[4].name, // Nike Air Force 1
      category: mockProducts[4].category,
      sales: mockProducts[4].price,
      date: "15 Jan 2026",
      status: "Success",
      image: mockProducts[4].image,
    },
    {
      name: mockProducts[5].name, // Adidas Ultraboost
      category: mockProducts[5].category,
      sales: mockProducts[5].price,
      date: "12 Jan 2026",
      status: "Processing",
      image: mockProducts[5].image,
    },
    {
      name: mockProducts[1].name, // Beats Pro
      category: mockProducts[1].category,
      sales: mockProducts[1].price,
      date: "11 Jan 2026",
      status: "Processing",
      image: mockProducts[1].image,
    },
  ];
}

// Sales Statistics Data (Satış Statistikası)
export function getSalesStatsData() {
  // Calculate total revenue and expenses for the year
  const monthlyData = [
    { month: "Jan", revenue: 10000, expense: 8000 },
    { month: "Feb", revenue: 12000, expense: 10000 },
    { month: "Mar", revenue: 11000, expense: 9000 },
    { month: "Apr", revenue: 14000, expense: 11000 },
    { month: "May", revenue: 13500, expense: 10500 },
    { month: "Jun", revenue: 9500, expense: 7500 },
    { month: "Jul", revenue: 10500, expense: 8500 },
    { month: "Aug", revenue: 15000, expense: 12000 },
    { month: "Sep", revenue: 11000, expense: 9000 },
    { month: "Oct", revenue: 10000, expense: 8000 },
    { month: "Nov", revenue: 12500, expense: 10000 },
    { month: "Dec", revenue: 13000, expense: 10500 },
  ];

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);

  return {
    data: monthlyData,
    totalRevenue,   // 141,000
    totalExpense,   // 113,000
    revenueGrowth: 8,  // percentage
    expenseGrowth: -8, // percentage
  };
}

// Recent Transactions Widget (Son Əməliyyatlar - Full Widget)
export function getRecentTransactionsWidget() {
  // Generate transactions from orders and clients
  return [
    {
      date: "24 May 2026",
      customer: mockClients[0].contactPerson, // John Smith
      customerId: `#${mockOrders[0].id}`,
      status: "Completed",
      amount: 4560,
      type: "Sale",
    },
    {
      date: "23 May 2026",
      customer: mockClients[1].contactPerson, // Sarah Johnson
      customerId: `#${mockOrders[1].id}`,
      status: "Completed",
      amount: 3569,
      type: "Sale",
    },
    {
      date: "22 May 2026",
      customer: mockClients[2].contactPerson, // Mike Davis
      customerId: `#${mockOrders[2].id}`,
      status: "Active",
      amount: 4560,
      type: "Quotation",
    },
    {
      date: "21 May 2026",
      customer: mockClients[3].contactPerson, // Emily Chen
      customerId: `#${mockOrders[3].id}`,
      status: "Completed",
      amount: 2155,
      type: "Sale",
    },
    {
      date: "21 May 2026",
      customer: mockClients[0].contactPerson, // John Smith
      customerId: `#${mockOrders[4].id}`,
      status: "Completed",
      amount: 5123,
      type: "Sale",
    },
  ];
}