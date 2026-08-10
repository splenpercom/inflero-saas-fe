import { getStorageItem } from "../lib/storageMigration";

const KEY = "inflero_res_new_count";
const LAST_PLAYED_KEY = "inflero_res_last_played";

export function incrementNewReservation(): void {
  const current = getNewCount();
  localStorage.setItem(KEY, String(current + 1));
  localStorage.setItem(LAST_PLAYED_KEY, String(Date.now()));
}

export function getNewCount(): number {
  return parseInt(getStorageItem(localStorage, KEY) || "0", 10);
}

export function clearNewCount(): void {
  localStorage.setItem(KEY, "0");
}

export function playNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number, vol = 0.28) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    const t = ctx.currentTime;
    // Pleasant ascending chime: C5 → E5 → G5
    playTone(523.25, t,        0.22);
    playTone(659.25, t + 0.18, 0.22);
    playTone(783.99, t + 0.36, 0.45);
  } catch (_) {
    // AudioContext blocked or unavailable — silently ignore
  }
}
