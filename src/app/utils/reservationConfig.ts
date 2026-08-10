export interface ReservationConfig {
  slotIntervalMinutes: number;
  capacityPerSlot: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  workingDays: number[];
  bookingPageMode?: import("../lib/branchBooking").BookingPageMode;
  branchPages?: Record<string, import("../lib/branchBooking").BranchLandingPage>;
}

export const DEFAULT_CONFIG: ReservationConfig = {
  slotIntervalMinutes: 30,
  capacityPerSlot: 3,
  startHour: 8,
  startMinute: 0,
  endHour: 18,
  endMinute: 0,
  workingDays: [1, 2, 3, 4, 5, 6],
};

import { getStorageItem } from "../lib/storageMigration";

const KEY = "inflero_res_config";

export function loadConfig(): ReservationConfig {
  try {
    const raw = getStorageItem(localStorage, KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(cfg: ReservationConfig): void {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

export function generateTimeSlots(cfg: ReservationConfig): string[] {
  const slots: string[] = [];
  let h = cfg.startHour;
  let m = cfg.startMinute;
  const endTotal = cfg.endHour * 60 + cfg.endMinute;
  while (true) {
    const total = h * 60 + m;
    if (total >= endTotal) break;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += cfg.slotIntervalMinutes;
    while (m >= 60) { m -= 60; h++; }
  }
  return slots;
}
