import { apiGet } from "./client";

export interface WarehouseRecord {
  id: string;
  name: string;
  code: string;
  address: string | null;
  status: string;
}

export async function fetchWarehouses() {
  const res = await apiGet<{ success: boolean; data: WarehouseRecord[] }>("/tenant/warehouses");
  return res.data;
}
