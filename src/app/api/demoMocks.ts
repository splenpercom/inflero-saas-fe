import { ApiError } from "./client";
import { buildDemoDashboardSummary } from "./demoDashboardSummary";
import { mockClients, mockProducts, mockSuppliers } from "../utils/dashboardData";

const DEMO_STORE_ID = "demo-store-1";
const DEMO_WAREHOUSE_ID = "demo-wh-1";
const NOW = "2026-06-16T10:00:00.000Z";
const DATE = "2026-06-16";

function ok<T>(data: T) {
  return { success: true, data };
}

function paged<T>(items: T[], page = 1, pageSize = 10) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

function parsePath(path: string): [string, URLSearchParams] {
  const q = path.indexOf("?");
  if (q === -1) return [path, new URLSearchParams()];
  return [path.slice(0, q), new URLSearchParams(path.slice(q + 1))];
}

const DEMO_CATEGORIES = [
  { id: "cat-1", name: "Electronics", slug: "electronics", status: "ACTIVE", createdAt: NOW, createdOn: "16 Jun 2026" },
  { id: "cat-2", name: "Computers", slug: "computers", status: "ACTIVE", createdAt: NOW, createdOn: "16 Jun 2026" },
  { id: "cat-3", name: "Shoes", slug: "shoes", status: "ACTIVE", createdAt: NOW, createdOn: "15 Jun 2026" },
  { id: "cat-4", name: "Furnitures", slug: "furnitures", status: "ACTIVE", createdAt: NOW, createdOn: "14 Jun 2026" },
];

const DEMO_BRANDS = [
  { id: "br-1", code: "APL", name: "Apple", logo: null, status: "ACTIVE", createdAt: NOW, createdDate: "16 Jun 2026" },
  { id: "br-2", code: "LEN", name: "Lenovo", logo: null, status: "ACTIVE", createdAt: NOW, createdDate: "16 Jun 2026" },
  { id: "br-3", code: "NIK", name: "Nike", logo: null, status: "ACTIVE", createdAt: NOW, createdDate: "15 Jun 2026" },
];

const DEMO_UNITS = [
  { id: "u-1", name: "Piece", shortName: "Pc", noOfProducts: 12, status: "ACTIVE", createdAt: NOW, createdDate: "16 Jun 2026" },
  { id: "u-2", name: "Box", shortName: "Box", noOfProducts: 3, status: "ACTIVE", createdAt: NOW, createdDate: "15 Jun 2026" },
];

const DEMO_SUBCATEGORIES = [
  {
    id: "sub-1",
    name: "Laptops",
    categoryId: "cat-2",
    category: "Computers",
    categoryCode: "CMP",
    description: null,
    image: null,
    status: "ACTIVE",
    createdAt: NOW,
    createdDate: "16 Jun 2026",
  },
  {
    id: "sub-2",
    name: "Headphones",
    categoryId: "cat-1",
    category: "Electronics",
    categoryCode: "ELC",
    description: null,
    image: null,
    status: "ACTIVE",
    createdAt: NOW,
    createdDate: "15 Jun 2026",
  },
];

const DEMO_VARIANTS = [
  { id: "va-1", variant: "Color", values: "Black, White, Blue", status: "ACTIVE", createdAt: NOW, createdDate: "16 Jun 2026" },
  { id: "va-2", variant: "Size", values: "S, M, L, XL", status: "ACTIVE", createdAt: NOW, createdDate: "15 Jun 2026" },
];

function productListItems() {
  return mockProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.name.toLowerCase().replace(/\s+/g, "-"),
    productType: "SINGLE" as const,
    image: p.image,
    category: p.category,
    brand: p.brand,
    price: String(p.price),
    purchasePrice: String(Math.round(p.price * 0.72)),
    unit: p.unit,
    quantity: p.quantity,
    createdBy: p.createdBy,
    createdById: p.createdById,
    status: "ACTIVE" as const,
    quantityAlert: 15,
    expiryDate: null as string | null,
  }));
}

function productDetail(id: string) {
  const base = productListItems().find((p) => p.id === id) ?? productListItems()[0];
  return {
    ...base,
    description: "Demo product for preview.",
    categoryId: "cat-1",
    subCategoryId: "sub-1",
    subCategory: "Laptops",
    brandId: "br-1",
    unitId: "u-1",
    warrantyId: null,
    warranty: "1 Year",
    barcodeSymbology: null,
    itemBarcode: null,
    variantAttributeId: null,
    taxType: null,
    taxPercent: null,
    discountType: null,
    discountValue: null,
    manufacturer: base.brand,
    manufacturedDate: null,
    images: [base.image],
    stocks: [
      {
        id: "stk-1",
        warehouseId: DEMO_WAREHOUSE_ID,
        storeId: DEMO_STORE_ID,
        warehouse: "Main Warehouse",
        store: "Main Branch",
        quantity: base.quantity,
      },
    ],
  };
}

const DEMO_VEHICLES = [
  {
    id: "veh-1",
    customerId: "cust-1",
    make: "Toyota",
    model: "Camry",
    year: 2019,
    plate: "77-AB-001",
    mileage: 45200,
    vin: "JTDBR32E890123456",
    notes: "",
    status: "Active" as const,
    createdAt: NOW,
  },
  {
    id: "veh-2",
    customerId: "cust-1",
    make: "BMW",
    model: "X5",
    year: 2021,
    plate: "10-BC-555",
    mileage: 28000,
    vin: "WBAFR9C50BC123456",
    notes: "",
    status: "Active" as const,
    createdAt: NOW,
  },
  {
    id: "veh-3",
    customerId: "cust-2",
    make: "Mercedes",
    model: "E-Class",
    year: 2020,
    plate: "99-XY-777",
    mileage: 35000,
    vin: "WDDZF4JB0LA123456",
    notes: "",
    status: "Active" as const,
    createdAt: NOW,
  },
];

function demoCustomerVehicles(customerId: string) {
  return DEMO_VEHICLES.filter((v) => v.customerId === customerId);
}

const DEMO_CUSTOMERS = mockClients.map((c, i) => {
  const id = `cust-${c.id}`;
  const vehicles = demoCustomerVehicles(id);
  const plates = vehicles.map((v) => v.plate).filter(Boolean);
  return {
    id,
    code: `CU${String(i + 1).padStart(3, "0")}`,
    name: c.contactPerson,
    email: c.email,
    phone: c.phone,
    country: "Azerbaijan",
    status: c.status,
    vehicleCount: vehicles.length,
    plates,
  };
});

function filterDemoCustomers(params: URLSearchParams) {
  const search = (params.get("search") ?? "").trim().toLowerCase();
  const status = params.get("status");
  let rows = [...DEMO_CUSTOMERS];
  if (status === "active") rows = rows.filter((c) => c.status === "Active");
  if (status === "inactive") rows = rows.filter((c) => c.status === "Inactive");
  if (search) {
    rows = rows.filter((c) => {
      const haystack = [
        c.code,
        c.name,
        c.email,
        c.phone,
        c.country,
        ...c.plates,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }
  return rows;
}

const DEMO_SUPPLIERS = mockSuppliers.map((s) => ({
  id: s.id,
  code: s.code,
  name: s.name,
  email: s.email,
  phone: s.phone,
  country: "Azerbaijan",
  company: s.company,
  status: s.status,
}));

const DEMO_BILLERS = [
  { id: "bill-1", code: "BL001", name: "James Kirwin", email: "james@demo.local", commissionType: null, commissionValue: null },
  { id: "bill-2", code: "BL002", name: "Francis Chang", email: "francis@demo.local", commissionType: "PERCENT", commissionValue: "10" },
];

const DEMO_POS_ORDERS = [
  {
    id: "pos-1",
    customerId: "cust-1",
    customerAvatar: "",
    customerName: "Carl Evans",
    reference: "POS-1001",
    date: NOW,
    status: "Completed",
    grandTotal: 1240,
    paid: 1240,
    due: 0,
    paymentStatus: "Paid",
    biller: "James Kirwin",
    storeId: DEMO_STORE_ID,
  },
  {
    id: "pos-2",
    customerId: "cust-2",
    customerAvatar: "",
    customerName: "Minerva Rameriz",
    reference: "POS-1002",
    date: "2026-06-15T14:30:00.000Z",
    status: "Pending",
    grandTotal: 860,
    paid: 400,
    due: 460,
    paymentStatus: "Partial",
    biller: "Francis Chang",
    storeId: DEMO_STORE_ID,
  },
];

const DEMO_INVOICES = [
  {
    id: "inv-1",
    invoiceNo: "INV001",
    customerAvatar: "",
    customerName: "Carl Evans",
    dueDate: "2026-06-24T00:00:00.000Z",
    amount: 1000,
    paid: 1000,
    amountDue: 0,
    status: "Paid",
  },
  {
    id: "inv-2",
    invoiceNo: "INV002",
    customerAvatar: "",
    customerName: "Minerva Rameriz",
    dueDate: "2026-06-24T00:00:00.000Z",
    amount: 1500,
    paid: 0,
    amountDue: 1500,
    status: "Unpaid",
  },
];

const DEMO_EXPENSE_CATEGORIES = [
  { id: "ec-1", name: "Parts & Materials", description: null, isActive: true, createdAt: NOW },
  { id: "ec-2", name: "Utilities", description: null, isActive: true, createdAt: NOW },
  { id: "ec-3", name: "Rent", description: null, isActive: true, createdAt: NOW },
];

const DEMO_INCOME_CATEGORIES = [
  { id: "ic-1", name: "Service Revenue", description: null, isActive: true, createdAt: NOW },
  { id: "ic-2", name: "Parts Sales", description: null, isActive: true, createdAt: NOW },
];

const DEMO_EXPENSES = [
  {
    id: "exp-1",
    reference: "EXP-001",
    expenseName: "Shop rent",
    category: "Rent",
    categoryId: "ec-3",
    accountId: "ba-1",
    description: "Monthly rent",
    date: DATE,
    amount: "760.00",
    status: "APPROVED",
  },
  {
    id: "exp-2",
    reference: "EXP-002",
    expenseName: "Oil filters stock",
    category: "Parts & Materials",
    categoryId: "ec-1",
    accountId: "ba-1",
    description: "Inventory replenishment",
    date: "2026-06-14",
    amount: "420.00",
    status: "PENDING",
  },
];

const DEMO_INCOMES = [
  {
    id: "inc-1",
    reference: "INC-001",
    date: DATE,
    store: "Main Branch",
    storeId: DEMO_STORE_ID,
    category: "Service Revenue",
    categoryId: "ic-1",
    notes: "Daily services",
    amount: "1850.00",
    accountId: "ba-1",
    bankLabel: "Kapital Bank · ****4521",
  },
  {
    id: "inc-2",
    reference: "INC-002",
    date: "2026-06-15",
    store: "Main Branch",
    storeId: DEMO_STORE_ID,
    category: "Parts Sales",
    categoryId: "ic-2",
    notes: "Counter sales",
    amount: "640.00",
    accountId: "ba-2",
    bankLabel: "ABB · ****8830",
  },
];

const DEMO_BANK_ACCOUNTS = [
  {
    id: "ba-1",
    accountHolderName: "Inflero LLC",
    accountNo: "AZ12KAPI00000000001234",
    type: "BANK",
    openingBalance: "5000.00",
    currentBalance: "12480.00",
    notes: "Primary operating account",
    status: "ACTIVE",
    createdAt: NOW,
  },
  {
    id: "ba-2",
    accountHolderName: "Inflero LLC",
    accountNo: "AZ98ABB00000000005678",
    type: "BANK",
    openingBalance: "2000.00",
    currentBalance: "4320.00",
    notes: "Petty cash",
    status: "ACTIVE",
    createdAt: NOW,
  },
];

const DEMO_PURCHASES = [
  {
    id: "pur-1",
    productIcon: "📦",
    productName: "Brake pads (set)",
    date: NOW,
    supplierName: "AutoParts Supply Co.",
    reference: "PUR-2001",
    status: "Received",
    total: 980,
    paid: 980,
    due: 0,
    paymentStatus: "Paid",
    storeId: DEMO_STORE_ID,
    stockReceived: true,
  },
  {
    id: "pur-2",
    productIcon: "🛢️",
    productName: "Engine oil 5W-30",
    date: "2026-06-14T09:00:00.000Z",
    supplierName: "Oil Distributors Ltd",
    reference: "PUR-2002",
    status: "Ordered",
    total: 540,
    paid: 200,
    due: 340,
    paymentStatus: "Partial",
    storeId: DEMO_STORE_ID,
    stockReceived: false,
  },
];

const DEMO_STOCK_LEVELS = productListItems().slice(0, 6).map((p, i) => ({
  id: `sl-${i + 1}`,
  warehouse: "Main Warehouse",
  store: "Main Branch",
  warehouseId: DEMO_WAREHOUSE_ID,
  storeId: DEMO_STORE_ID,
  productId: p.id,
  productName: p.name,
  productSku: p.sku,
  productImage: p.image,
  date: DATE,
  qty: p.quantity,
  managedById: "bill-1",
  personName: "James Kirwin",
}));

const DEMO_ADJUSTMENTS = [
  {
    id: "adj-1",
    warehouse: "Main Warehouse",
    store: "Main Branch",
    productName: "Lenovo IdeaPad 3",
    productImage: "💻",
    date: DATE,
    personName: "James Kirwin",
    customerName: null,
    qty: -2,
  },
  {
    id: "adj-2",
    warehouse: "Main Warehouse",
    store: "Main Branch",
    productName: "Beats Pro",
    productImage: "🎧",
    date: "2026-06-15",
    personName: "Francis Chang",
    customerName: null,
    qty: 5,
  },
];

const DEMO_TRANSFERS = [
  {
    id: "tr-1",
    fromWarehouse: "Main Warehouse",
    toWarehouse: "Service Bay Store",
    noOfProducts: 2,
    quantityTransferred: 15,
    refNumber: "TRF-301",
    date: DATE,
    isDeposited: false,
    approvalStatus: "APPROVED",
  },
];

const DEMO_RESERVATIONS = [
  {
    id: "res-1",
    storeId: DEMO_STORE_ID,
    customerId: "cust-1",
    vehicleId: "veh-1",
    guestName: null,
    guestPhone: null,
    guestPlateSuffix: null,
    serviceType: "Oil Change",
    scheduledAt: "2026-06-16T09:00:00.000Z",
    mileage: 45200,
    notes: null,
    status: "confirmed" as const,
    source: "internal" as const,
    createdAt: NOW,
    customerName: "Anar Həsənov",
    vehicleLabel: "Toyota Camry · 77-AB-001",
    branchName: "Main Branch",
  },
  {
    id: "res-2",
    storeId: DEMO_STORE_ID,
    customerId: "cust-2",
    vehicleId: "veh-2",
    guestName: null,
    guestPhone: null,
    guestPlateSuffix: null,
    serviceType: "Brake Service",
    scheduledAt: "2026-06-16T11:00:00.000Z",
    mileage: 32100,
    notes: "Front pads",
    status: "pending" as const,
    source: "customer_site" as const,
    createdAt: NOW,
    customerName: "Leyla Əliyeva",
    vehicleLabel: "Mercedes C200 · 10-LE-200",
    branchName: "Main Branch",
  },
];

const DEMO_USERS = [
  {
    id: "user-1",
    email: "admin@demo.local",
    firstName: "Demo",
    lastName: "Admin",
    phone: "+994501234567",
    employeeId: "EMP001",
    status: "ACTIVE",
    team: "Management",
    department: null,
    departmentId: null,
    dateOfJoin: "2024-01-15T00:00:00.000Z",
    dateOfBirth: null,
    gender: null,
    address: null,
    shift: null,
    bloodGroup: null,
    about: null,
    bankName: null,
    accountNo: null,
    ifsc: null,
    storeId: null,
    store: null,
    role: { id: "role-1", name: "Administrator" },
  },
  {
    id: "user-2",
    email: "staff@demo.local",
    firstName: "James",
    lastName: "Kirwin",
    phone: "+994507654321",
    employeeId: "EMP002",
    status: "ACTIVE",
    team: "Sales",
    department: null,
    departmentId: null,
    dateOfJoin: "2024-06-01T00:00:00.000Z",
    dateOfBirth: null,
    gender: null,
    address: null,
    shift: null,
    bloodGroup: null,
    about: null,
    bankName: null,
    accountNo: null,
    ifsc: null,
    storeId: DEMO_STORE_ID,
    store: { id: DEMO_STORE_ID, name: "Main Branch", code: "HQ" },
    role: { id: "role-2", name: "Staff" },
  },
];

const DEMO_ROLES = [
  {
    id: "role-1",
    name: "Administrator",
    status: "ACTIVE",
    createdAt: NOW,
    permissions: [{ module: "Dashboard", view: true, create: true, edit: true, delete: true }],
  },
  {
    id: "role-2",
    name: "Staff",
    status: "ACTIVE",
    createdAt: NOW,
    permissions: [{ module: "Sales", view: true, create: true, edit: false, delete: false }],
  },
];

const DEMO_STORES = [
  {
    id: DEMO_STORE_ID,
    code: "HQ",
    name: "Main Branch",
    email: "branch@demo.local",
    phone: "+994121234567",
    address: "28 May St, Baku",
    status: "ACTIVE",
    branchManagerId: "user-1",
    branchManager: {
      id: "user-1",
      firstName: "Demo",
      lastName: "Admin",
      email: "admin@demo.local",
    },
  },
  {
    id: "demo-store-2",
    code: "SB",
    name: "Service Bay",
    email: null,
    phone: null,
    address: "Narimanov, Baku",
    status: "ACTIVE",
    branchManagerId: null,
    branchManager: null,
  },
];

const DEMO_WAREHOUSES = [
  { id: DEMO_WAREHOUSE_ID, name: "Main Warehouse", code: "WH01", address: "Baku", status: "ACTIVE" },
  { id: "demo-wh-2", name: "Service Bay Store", code: "WH02", address: "Narimanov", status: "ACTIVE" },
];

const DEMO_SALES_REPORT_ITEMS = productListItems().slice(0, 5).map((p, i) => ({
  productId: p.id,
  sku: p.sku,
  productName: p.name,
  brand: p.brand,
  category: p.category,
  soldQty: 12 + i * 3,
  soldAmount: String((12 + i * 3) * parseFloat(p.price)),
  instockQty: p.quantity,
}));

function salesReportResult() {
  return {
    dateFrom: "2026-06-01",
    dateTo: "2026-06-16",
    totals: {
      totalPaid: "8420.00",
      totalDue: "1260.00",
      totalUnpaid: "540.00",
      purchase: "10220.00",
    },
    items: DEMO_SALES_REPORT_ITEMS,
  };
}

function billerReportResult() {
  return {
    dateFrom: "2026-06-01",
    dateTo: "2026-06-16",
    totals: {
      totalOrders: 24,
      totalRevenue: 10220,
      totalItemsSold: 86,
      activeBillers: 2,
    },
    items: [
      {
        billerId: "bill-1",
        billerCode: "BL001",
        billerName: "James Kirwin",
        orderCount: 14,
        totalRevenue: 6420,
        paidAmount: 5980,
        dueAmount: 320,
        unpaidAmount: 120,
        itemsSold: 52,
        avgOrderValue: 458.57,
        uniqueProducts: 18,
        categories: [
          { category: "Electronics", soldQty: 22, soldAmount: 3200 },
          { category: "Computers", soldQty: 14, soldAmount: 2100 },
          { category: "Accessories", soldQty: 16, soldAmount: 1120 },
        ],
      },
      {
        billerId: "bill-2",
        billerCode: "BL002",
        billerName: "Francis Chang",
        orderCount: 10,
        totalRevenue: 3800,
        paidAmount: 3440,
        dueAmount: 260,
        unpaidAmount: 100,
        itemsSold: 34,
        avgOrderValue: 380,
        uniqueProducts: 12,
        categories: [
          { category: "Shoes", soldQty: 12, soldAmount: 1440 },
          { category: "Furnitures", soldQty: 8, soldAmount: 1280 },
          { category: "Electronics", soldQty: 14, soldAmount: 1080 },
        ],
      },
    ],
  };
}

function profitLossResult() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return {
    dateFrom: "2026-01-01",
    dateTo: "2026-06-16",
    items: months.map((month, i) => {
      const sales = 8000 + i * 1200;
      const service = 450 + i * 80;
      const purchase = 2200 + i * 150;
      const totalExpense = 3500 + i * 400;
      const grossProfit = sales + service;
      const netProfit = grossProfit - totalExpense;
      return {
        monthStart: `2026-${String(i + 1).padStart(2, "0")}-01`,
        month,
        sales,
        service,
        purchaseReturn: 120,
        grossProfit,
        salesExpense: 280 + i * 20,
        purchase,
        salesReturn: 60,
        totalExpense,
        netProfit,
      };
    }),
  };
}

const DEMO_EXPENSE_REPORT_ITEMS = [
  {
    id: "exp-1",
    expenseName: "Shop rent",
    category: "Rent",
    description: "Monthly rent",
    date: DATE,
    amount: 760,
    status: "APPROVED",
  },
  {
    id: "exp-2",
    expenseName: "Oil filters stock",
    category: "Parts & Materials",
    description: "Inventory replenishment",
    date: "2026-06-14",
    amount: 420,
    status: "PENDING",
  },
];

function annualReportResult(year: number) {
  return {
    year,
    monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    rows: [
      { label: "Revenue", values: [8400, 9200, 11800, 10400, 13600, 15200, 14100, 12800, 13200, 14500, 15100, 16800] },
      { label: "Expenses", values: [3800, 4100, 5200, 4600, 5900, 6840, 6100, 5800, 6000, 6200, 6400, 7000] },
    ],
  };
}

function productReportResult() {
  return {
    dateFrom: "2026-06-01",
    dateTo: "2026-06-16",
    items: DEMO_SALES_REPORT_ITEMS.map((r) => {
      const revenue = parseFloat(r.soldAmount);
      const totalOrdered = r.soldQty;
      return {
        productId: r.productId,
        sku: r.sku,
        productName: r.productName,
        category: r.category,
        brand: r.brand,
        qty: r.instockQty,
        price: totalOrdered > 0 ? Math.round((revenue / totalOrdered) * 100) / 100 : 0,
        totalOrdered,
        revenue,
      };
    }),
  };
}

function posOrderDetail(id: string) {
  const row = DEMO_POS_ORDERS.find((o) => o.id === id) ?? DEMO_POS_ORDERS[0];
  const item = productListItems()[0];
  return {
    id: row.id,
    reference: row.reference,
    documentNo: row.reference,
    date: row.date,
    status: "COMPLETED",
    statusLabel: row.status,
    grandTotal: String(row.grandTotal),
    paid: String(row.paid),
    due: String(row.due),
    paymentStatus: row.paymentStatus,
    paymentMethod: "CASH",
    shipping: null,
    taxPercent: null,
    discount: null,
    storeId: row.storeId,
    customerId: row.customerId,
    customerName: row.customerName,
    billerId: "bill-1",
    billerName: row.biller,
    payments: [],
    items: [
      {
        id: "li-1",
        productId: item.id,
        productName: item.name,
        sku: item.sku,
        quantity: 2,
        price: item.price,
      },
    ],
  };
}

function invoiceDetail(id: string) {
  const row = DEMO_INVOICES.find((i) => i.id === id) ?? DEMO_INVOICES[0];
  return {
    id: row.id,
    invoiceNo: row.invoiceNo,
    documentNo: row.invoiceNo,
    createdAt: NOW,
    dueDate: row.dueDate,
    customerId: "cust-1",
    customer: {
      id: "cust-1",
      code: "CU001",
      name: row.customerName,
      email: "carl@demo.local",
      phone: "+994501111111",
      country: "Azerbaijan",
    },
    notes: null,
    subtotal: String(row.amount),
    tax: "0",
    discount: "0",
    total: String(row.amount),
    paid: String(row.paid),
    amountDue: String(row.amountDue),
    status: row.status,
    items: [
      {
        id: "ili-1",
        productId: "1",
        productName: "Lenovo IdeaPad 3",
        description: "Lenovo IdeaPad 3",
        quantity: 1,
        unitPrice: String(row.amount),
        total: String(row.amount),
        sku: "PT001",
      },
    ],
    payments: [],
    posOrderId: null,
  };
}

function purchaseDetail(id: string) {
  const row = DEMO_PURCHASES.find((p) => p.id === id) ?? DEMO_PURCHASES[0];
  return {
    id: row.id,
    reference: row.reference,
    documentNo: row.reference,
    date: row.date,
    supplierId: "sup-1",
    supplierName: row.supplierName,
    storeId: row.storeId,
    storeName: "Main Branch",
    stockReceivedAt: row.stockReceived ? NOW : null,
    orderTax: null,
    discount: null,
    shipping: null,
    total: String(row.total),
    paid: String(row.paid),
    due: String(row.due),
    status: "RECEIVED",
    statusLabel: row.status,
    paymentStatus: row.paymentStatus,
    description: null,
    payments: [],
    items: [
      {
        id: "pli-1",
        productId: "1",
        productName: row.productName,
        sku: "PT001",
        quantity: 10,
        purchasePrice: "45.00",
        discount: "0",
        taxPercent: "0",
        taxAmount: "0",
        unitCost: "45.00",
        totalCost: "450.00",
      },
    ],
  };
}

function transferDetail(id: string) {
  const item = productListItems()[0];
  return {
    id,
    fromWarehouseId: DEMO_WAREHOUSE_ID,
    toWarehouseId: "demo-wh-2",
    fromWarehouse: "Main Warehouse",
    toWarehouse: "Service Bay Store",
    referenceNumber: "TRF-301",
    documentNo: "TRF-301",
    notes: null,
    date: DATE,
    isDeposited: false,
    approvalStatus: "APPROVED",
    approvedAt: NOW,
    rejectedAt: null,
    rejectReason: null,
    createdBy: { id: "user-1", name: "Demo Admin" },
    approvedBy: { id: "user-1", name: "Demo Admin" },
    rejectedBy: null,
    items: [
      {
        id: "ti-1",
        productId: item.id,
        productName: item.name,
        sku: item.sku,
        transferredQty: 10,
        soldQty: 0,
        returnedQty: 0,
        remainingQty: 10,
      },
    ],
  };
}

const DEMO_TENANT_SETTINGS = {
  id: "settings-1",
  tenantId: "tenant-demo",
  companyName: "Inflero (Demo)",
  companyEmail: "hello@demo.local",
  phone: "+994121234567",
  fax: null,
  website: "https://demo.local",
  address: "28 May Street",
  country: "Azerbaijan",
  state: null,
  city: "Baku",
  postalCode: "AZ1000",
  currency: "AZN",
  currencySymbol: "₼",
  currencyPosition: "after",
  decimalSeparator: ".",
  thousandSeparator: ",",
  companyIcon: null,
  favicon: null,
  companyLogo: null,
  companyDarkLogo: null,
  socialLinks: {
    instagram: "https://instagram.com/demo",
    facebook: null,
    telegram: null,
    whatsapp: null,
    tiktok: null,
  },
  latitude: 40.4093,
  longitude: 49.8671,
  employeeCommissionEnabled: false,
  posServiceFeeEnabled: false,
  posSendToProductionEnabled: false,
};

/**
 * Returns mock API JSON for demo preview GET requests.
 * Mutations throw so UI guards stay in place.
 */
export function resolveDemoApiResponse(path: string, method: string): unknown {
  if (method !== "GET") {
    throw new ApiError(403, "Demo mode — sign in to save changes.");
  }

  const [pathname, params] = parsePath(path);

  // Dashboard
  if (pathname === "/tenant/dashboard/summary") {
    const period = (params.get("period") ?? "1M") as "1D" | "1W" | "1M" | "1Y";
    return ok(buildDemoDashboardSummary(period));
  }

  // Inventory
  if (pathname === "/tenant/inventory/categories") return ok(DEMO_CATEGORIES);
  if (pathname === "/tenant/inventory/sub-categories") return ok(DEMO_SUBCATEGORIES);
  if (pathname === "/tenant/inventory/brands") return ok(DEMO_BRANDS);
  if (pathname === "/tenant/inventory/units") return ok(DEMO_UNITS);
  if (pathname === "/tenant/inventory/variant-attributes") return ok(DEMO_VARIANTS);
  if (pathname === "/tenant/inventory/products/low-stock") {
    const low = productListItems().filter((p) => p.quantity < 200);
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(low, page, pageSize));
  }
  if (pathname === "/tenant/inventory/products/expired") {
    const expired = productListItems().slice(0, 2).map((p) => ({ ...p, expiryDate: "2026-01-01" }));
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(expired, page, pageSize));
  }
  if (pathname === "/tenant/inventory/products") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(productListItems(), page, pageSize));
  }
  const productMatch = pathname.match(/^\/tenant\/inventory\/products\/([^/]+)$/);
  if (productMatch) return ok(productDetail(productMatch[1]));

  // Sales
  if (pathname === "/tenant/sales/billers") return ok(DEMO_BILLERS);
  if (pathname === "/tenant/sales/pos-orders") {
    const customerId = params.get("customerId");
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? params.get("limit") ?? 10);
    const rows = customerId
      ? DEMO_POS_ORDERS.filter((o) => o.customerId === customerId)
      : DEMO_POS_ORDERS;
    return ok(paged(rows, page, pageSize));
  }
  const posMatch = pathname.match(/^\/tenant\/sales\/pos-orders\/([^/]+)$/);
  if (posMatch) return ok(posOrderDetail(posMatch[1]));
  if (pathname === "/tenant/sales/invoices") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? params.get("limit") ?? 10);
    return ok(paged(DEMO_INVOICES, page, pageSize));
  }
  const invMatch = pathname.match(/^\/tenant\/sales\/invoices\/([^/]+)$/);
  if (invMatch) return ok(invoiceDetail(invMatch[1]));
  if (pathname === "/tenant/sales/returns") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? params.get("limit") ?? 10);
    return ok(
      paged(
        [
          {
            id: "sr-1",
            productIcon: "🎧",
            productName: "Beats Pro",
            date: NOW,
            customerAvatar: "",
            customerName: "Carl Evans",
            status: "Completed",
            total: 160,
            paid: 160,
            due: 0,
            paymentStatus: "Paid",
            storeId: DEMO_STORE_ID,
            posOrderReference: "POS-1001",
            restocked: true,
          },
        ],
        page,
        pageSize,
      ),
    );
  }
  const srMatch = pathname.match(/^\/tenant\/sales\/returns\/([^/]+)$/);
  if (srMatch) {
    return ok({
      id: srMatch[1],
      reference: "SR-001",
      documentNo: "SR-001",
      date: NOW,
      customerId: "cust-1",
      customerName: "Carl Evans",
      storeId: DEMO_STORE_ID,
      status: "COMPLETED",
      statusLabel: "Completed",
      total: "160.00",
      paid: "160.00",
      due: "0",
      paymentStatus: "Paid",
      posOrderId: "pos-1",
      posOrderReference: "POS-1001",
      restocked: true,
      payments: [],
      items: [
        {
          id: "sri-1",
          productId: "2",
          productName: "Beats Pro",
          sku: "PT002",
          quantity: 1,
          unitPrice: "160.00",
          discount: null,
          taxPercent: null,
        },
      ],
    });
  }
  if (pathname === "/tenant/sales/reports/sales-report") return ok(salesReportResult());
  if (pathname === "/tenant/sales/reports/biller-report") return ok(billerReportResult());

  // Purchases
  if (pathname === "/tenant/purchases") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? params.get("limit") ?? 10);
    return ok(paged(DEMO_PURCHASES, page, pageSize));
  }
  const purMatch = pathname.match(/^\/tenant\/purchases\/([^/]+)$/);
  if (purMatch && purMatch[1] !== "returns" && purMatch[1] !== "order-stats") {
    return ok(purchaseDetail(purMatch[1]));
  }
  if (pathname === "/tenant/purchases/returns") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? params.get("limit") ?? 10);
    return ok(
      paged(
        [
          {
            id: "pr-1",
            productIcon: "📦",
            productName: "Brake pads (set)",
            date: NOW,
            supplierName: "AutoParts Supply Co.",
            reference: "PR-001",
            status: "Completed",
            total: 120,
            paid: 120,
            due: 0,
            paymentStatus: "Paid",
            storeId: DEMO_STORE_ID,
            stockDeducted: true,
            purchaseId: "pur-1",
            purchaseReference: "PUR-2001",
          },
        ],
        page,
        pageSize,
      ),
    );
  }
  const prMatch = pathname.match(/^\/tenant\/purchases\/returns\/([^/]+)$/);
  if (prMatch) {
    const base = purchaseDetail("pur-1");
    return ok({
      ...base,
      id: prMatch[1],
      stockDeductedAt: NOW,
      purchaseId: "pur-1",
      purchaseReference: "PUR-2001",
    });
  }
  if (pathname === "/tenant/purchases/returns/quantity-limits") return ok([]);
  if (pathname === "/tenant/purchases/order-stats") {
    return ok(
      productListItems().slice(0, 4).map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        image: p.image,
        orderedQty: 20,
        receivedQty: 18,
        pendingQty: 2,
      })),
    );
  }

  // Finance
  if (pathname === "/tenant/finance/expense-categories") return ok(DEMO_EXPENSE_CATEGORIES);
  if (pathname === "/tenant/finance/income-categories") return ok(DEMO_INCOME_CATEGORIES);
  if (pathname === "/tenant/finance/bank-accounts") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(DEMO_BANK_ACCOUNTS, page, pageSize));
  }
  if (pathname === "/tenant/finance/expenses") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(DEMO_EXPENSES, page, pageSize));
  }
  if (pathname === "/tenant/finance/incomes") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(DEMO_INCOMES, page, pageSize));
  }
  if (pathname === "/tenant/finance/reports/trial-balance") {
    return ok({
      dateFrom: params.get("dateFrom") ?? "2026-01-01",
      dateTo: params.get("dateTo") ?? DATE,
      totalDebit: "18400.00",
      totalCredit: "18400.00",
      items: [
        { accountId: "ba-1", code: "1000", name: "Cash & Bank", type: "ASSET", debit: "12480.00", credit: "0" },
        { accountId: "ba-2", code: "1100", name: "Petty Cash", type: "ASSET", debit: "4320.00", credit: "0" },
        { accountId: "rev-1", code: "4000", name: "Revenue", type: "INCOME", debit: "0", credit: "15200.00" },
        { accountId: "exp-1", code: "5000", name: "Expenses", type: "EXPENSE", debit: "6840.00", credit: "0" },
        { accountId: "eq-1", code: "3000", name: "Equity", type: "EQUITY", debit: "0", credit: "3640.00" },
      ],
    });
  }
  if (pathname === "/tenant/finance/reports/profit-loss") return ok(profitLossResult());
  if (pathname === "/tenant/finance/reports/expense") {
    return ok({
      dateFrom: "2026-06-01",
      dateTo: DATE,
      items: DEMO_EXPENSE_REPORT_ITEMS,
    });
  }
  if (pathname === "/tenant/finance/reports/annual") {
    const year = Number(params.get("year") ?? 2026);
    return ok(annualReportResult(year));
  }

  // Stock
  if (pathname === "/tenant/stock/levels") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(DEMO_STOCK_LEVELS, page, pageSize));
  }
  if (pathname === "/tenant/stock/adjustments") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(DEMO_ADJUSTMENTS, page, pageSize));
  }
  if (pathname === "/tenant/stock/transfers") {
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 10);
    return ok(paged(DEMO_TRANSFERS, page, pageSize));
  }
  const trfDetail = pathname.match(/^\/tenant\/stock\/transfers\/([^/]+)\/detail$/);
  if (trfDetail) return ok(transferDetail(trfDetail[1]));
  if (pathname === "/tenant/stock/reports/products") return ok(productReportResult());
  if (pathname === "/tenant/stock/reports/product-quantity-alert") {
    return ok({
      items: productListItems()
        .filter((p) => p.quantity < 200)
        .slice(0, 5)
        .map((p) => ({
          productId: p.id,
          sku: p.sku,
          productName: p.name,
          totalQuantity: p.quantity,
          alertQuantity: p.quantityAlert ?? 15,
        })),
    });
  }

  // People
  if (pathname === "/tenant/people/customers") return ok(filterDemoCustomers(params));
  if (pathname === "/tenant/people/suppliers") return ok(DEMO_SUPPLIERS);
  if (pathname === "/tenant/people/billers") return ok(DEMO_BILLERS);
  const vehMatch = pathname.match(/^\/tenant\/people\/customers\/([^/]+)\/vehicles$/);
  if (vehMatch) return ok(DEMO_VEHICLES.map((v) => ({ ...v, customerId: vehMatch[1] })));

  // Stores & warehouses
  if (pathname === "/tenant/stores") return ok(DEMO_STORES);
  if (pathname === "/tenant/branch-quota") return ok({ used: 2, maxBranches: 5, canAdd: true });
  if (pathname === "/tenant/branch-manager-candidates/new-store") return ok([]);
  if (pathname === "/tenant/warehouses") return ok(DEMO_WAREHOUSES);

  // Reservations & settings
  if (pathname === "/tenant/settings") return ok(DEMO_TENANT_SETTINGS);
  if (pathname === "/tenant/settings/reservations") {
    return ok({
      slotIntervalMinutes: 30,
      capacityPerSlot: 2,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      workingDays: [1, 2, 3, 4, 5, 6],
      serviceTypes: [
        { value: "oil_change", label: "Oil Change" },
        { value: "brake_service", label: "Brake Service" },
        { value: "diagnostics", label: "Diagnostics" },
      ],
    });
  }
  if (pathname === "/tenant/reservations") return ok(DEMO_RESERVATIONS);
  if (pathname === "/tenant/reservations/pending-count") return ok({ count: 1 });

  // User management
  if (pathname === "/tenant/users") return ok(DEMO_USERS);
  const userCommissionMatch = pathname.match(/^\/tenant\/users\/([^/]+)\/commission$/);
  if (userCommissionMatch) {
    const isFrancis = userCommissionMatch[1].includes("2") || userCommissionMatch[1].includes("francis");
    return ok({
      hasCommission: isFrancis,
      employeeCommissionEnabled: true,
      biller: isFrancis
        ? {
            id: "bill-2",
            code: "BL002",
            name: "Francis Chang",
            commissionType: "PERCENT",
            commissionValue: "10",
          }
        : null,
      totals: isFrancis
        ? { saleCount: 1, totalCommission: "86.00", totalSales: "860.00" }
        : { saleCount: 0, totalCommission: "0", totalSales: "0" },
      records: isFrancis
        ? [
            {
              posOrderId: "pos-2",
              reference: "POS-1002",
              date: "2026-06-15T14:30:00.000Z",
              customerName: "Minerva Rameriz",
              grandTotal: "860",
              commissionEnabled: true,
              commissionType: "PERCENT",
              commissionValue: "10",
              commissionAmount: "86.00",
            },
          ]
        : [],
    });
  }
  if (pathname === "/tenant/roles") return ok(DEMO_ROLES);

  throw new ApiError(404, `Demo preview: no mock for ${method} ${pathname}`);
}
