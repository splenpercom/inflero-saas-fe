export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface WebOrder {
  id: string;
  reference: string;
  date: string;
  status: "pending" | "confirmed" | "shipped" | "completed" | "cancelled";
  paymentStatus: "paid" | "unpaid" | "refunded";
  paymentMethod: "epoint" | "cod";
  grandTotal: number;
  customer: { name: string; email: string; phone: string };
  shipping: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    notes?: string;
  };
  items: OrderItem[];
}
