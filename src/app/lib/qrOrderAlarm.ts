/**
 * Noticeable but not harsh QR order ringtone (Web Audio).
 * Clear triple ding, repeats while pending QR orders remain.
 */

type AlarmController = {
  unlock: () => void;
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
};

export function createQrOrderAlarm(intervalMs = 2800): AlarmController {
  let ctx: AudioContext | null = null;
  let timer: number | null = null;
  let running = false;

  const ensureCtx = () => {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    return ctx;
  };

  /** Call after a user gesture so later auto-chimes are allowed by the browser. */
  const unlock = () => {
    const audio = ensureCtx();
    if (!audio) return;
    void audio.resume().catch(() => undefined);
  };

  const playChime = () => {
    const audio = ensureCtx();
    if (!audio) return;
    void audio.resume().catch(() => undefined);

    const now = audio.currentTime;
    const master = audio.createGain();
    // Audible on typical POS speakers / laptop (was ~0.06 — too quiet).
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.42, now + 0.02);
    master.gain.setValueAtTime(0.42, now + 0.9);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    master.connect(audio.destination);

    const tone = (freq: number, start: number, dur: number, type: OscillatorType = "triangle") => {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(1, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    };

    // Triple ding: A5 → C6 → E6 (clear doorbell-like pattern)
    tone(880, now, 0.22);
    tone(1046.5, now + 0.2, 0.22);
    tone(1318.5, now + 0.4, 0.35);
    // Light harmonic for presence on small speakers
    tone(1760, now + 0.4, 0.2, "sine");
  };

  return {
    unlock,
    start() {
      if (running) return;
      running = true;
      playChime();
      timer = window.setInterval(() => {
        if (running) playChime();
      }, intervalMs);
    },
    stop() {
      running = false;
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
    isRunning() {
      return running;
    },
  };
}
