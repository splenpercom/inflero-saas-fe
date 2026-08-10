export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  vin?: string;
  lastMileage?: number;
}

export interface PurchaseHistoryItem {
  id: string;
  date: string;
  orderNo: string;
  car: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  employee: string;
  mileage: number;
  paymentMethod: string;
}

export interface CRMCustomer {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "Active" | "Inactive";
  joinDate: string;
  cars: Car[];
  history: PurchaseHistoryItem[];
}

export const CRM_CUSTOMERS: CRMCustomer[] = [
  {
    id: "c1",
    code: "CU001",
    name: "Anar Həsənov",
    email: "anar.h@example.com",
    phone: "+994 50 123 45 67",
    address: "Nizami küç. 12, Bakı",
    status: "Active",
    joinDate: "2023-03-14",
    cars: [
      { id: "car1a", make: "Toyota", model: "Camry", year: 2020, plate: "77-AB-001", color: "Ağ", lastMileage: 54200 },
      { id: "car1b", make: "BMW", model: "X5", year: 2022, plate: "10-BC-555", color: "Qara", lastMileage: 18900 },
    ],
    history: [
      {
        id: "h1",
        date: "2025-04-10",
        orderNo: "POS-2025-041",
        car: "Toyota Camry (77-AB-001)",
        items: [{ name: "Mühərrik yağı 5W-30", qty: 4, price: 28 }, { name: "Yağ filteri", qty: 1, price: 15 }],
        total: 127,
        employee: "Kamran Babayev",
        mileage: 54200,
        paymentMethod: "Nağd",
      },
      {
        id: "h2",
        date: "2025-01-22",
        orderNo: "POS-2025-009",
        car: "BMW X5 (10-BC-555)",
        items: [{ name: "Əyləc diski (ön)", qty: 2, price: 95 }, { name: "Əyləc yastığı", qty: 4, price: 35 }],
        total: 330,
        employee: "Sevinc Nəcəfova",
        mileage: 18900,
        paymentMethod: "Kart",
      },
    ],
  },
  {
    id: "c2",
    code: "CU002",
    name: "Leyla Əliyeva",
    email: "leyla.a@example.com",
    phone: "+994 55 987 65 43",
    address: "İstiqlaliyyət küç. 5, Bakı",
    status: "Active",
    joinDate: "2023-07-28",
    cars: [
      { id: "car2a", make: "Mercedes", model: "C200", year: 2021, plate: "90-LC-212", color: "Gümüşü", lastMileage: 32100 },
    ],
    history: [
      {
        id: "h3",
        date: "2025-03-05",
        orderNo: "POS-2025-028",
        car: "Mercedes C200 (90-LC-212)",
        items: [{ name: "Hava filteri", qty: 1, price: 22 }, { name: "Şamlar dəsti", qty: 4, price: 18 }],
        total: 94,
        employee: "Tural İsmayılov",
        mileage: 32100,
        paymentMethod: "Bank Transferi",
      },
    ],
  },
  {
    id: "c3",
    code: "CU003",
    name: "Rauf Quliyev",
    email: "rauf.q@example.com",
    phone: "+994 70 456 78 90",
    address: "Rəşid Behbudov küç. 3, Bakı",
    status: "Active",
    joinDate: "2022-11-01",
    cars: [
      { id: "car3a", make: "Hyundai", model: "Tucson", year: 2019, plate: "55-RQ-777", color: "Göy", lastMileage: 78500 },
      { id: "car3b", make: "Kia", model: "Sportage", year: 2023, plate: "30-KS-400", color: "Qırmızı", lastMileage: 9800 },
    ],
    history: [
      {
        id: "h4",
        date: "2025-05-01",
        orderNo: "POS-2025-054",
        car: "Hyundai Tucson (55-RQ-777)",
        items: [{ name: "Əl freni kabeli", qty: 1, price: 45 }, { name: "İşçi haqqı", qty: 1, price: 30 }],
        total: 75,
        employee: "Kamran Babayev",
        mileage: 78500,
        paymentMethod: "Nağd",
      },
    ],
  },
  {
    id: "c4",
    code: "CU004",
    name: "Nigar Hüseynova",
    email: "nigar.h@example.com",
    phone: "+994 77 321 09 87",
    address: "Hüsü Hacıyev küç. 8, Bakı",
    status: "Active",
    joinDate: "2024-01-15",
    cars: [
      { id: "car4a", make: "Volkswagen", model: "Passat", year: 2018, plate: "40-NH-320", color: "Tünd göy", lastMileage: 105000 },
    ],
    history: [],
  },
  {
    id: "c5",
    code: "CU005",
    name: "Elşən Məmmədov",
    email: "elsen.m@example.com",
    phone: "+994 51 654 32 10",
    address: "Bakıxanov küç. 19, Bakı",
    status: "Active",
    joinDate: "2023-09-20",
    cars: [
      { id: "car5a", make: "Chevrolet", model: "Malibu", year: 2020, plate: "99-EM-001", color: "Ağ", lastMileage: 61300 },
      { id: "car5b", make: "Ford", model: "Kuga", year: 2021, plate: "99-EM-002", color: "Qara", lastMileage: 29700 },
      { id: "car5c", make: "Nissan", model: "Qashqai", year: 2022, plate: "99-EM-003", color: "Gümüşü", lastMileage: 15200 },
    ],
    history: [
      {
        id: "h5",
        date: "2025-02-18",
        orderNo: "POS-2025-019",
        car: "Chevrolet Malibu (99-EM-001)",
        items: [{ name: "Transmissiya yağı", qty: 2, price: 55 }, { name: "Kəmər", qty: 1, price: 40 }],
        total: 150,
        employee: "Günay Rəhimova",
        mileage: 61300,
        paymentMethod: "Kart",
      },
    ],
  },
];
