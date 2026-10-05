import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { DigitKeypad } from "../ui/DigitKeypad";
import { pickLang } from "../../i18n/pickLang";
import { useLanguage } from "../../i18n/LanguageContext";

type PosStaffPasscodeOverlayProps = {
  open: boolean;
  staffName: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (passcode: string) => void | Promise<void>;
};

/** Full-viewport 4-digit staff PIN entry with touch digit keypad. */
export function PosStaffPasscodeOverlay({
  open,
  staffName,
  busy = false,
  error = null,
  onCancel,
  onConfirm,
}: PosStaffPasscodeOverlayProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => pickLang(language, az, en);
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!open) {
      setPin("");
      return;
    }
    setPin("");
  }, [open]);

  const submit = useCallback(() => {
    if (busy || pin.length !== 4) return;
    void onConfirm(pin);
  }, [busy, onConfirm, pin]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!busy) onCancel();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        setPin((p) => (p.length >= 4 ? p : p + e.key));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel, open, submit]);

  useEffect(() => {
    if (error) setPin("");
  }, [error]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-gray-950/95 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-white/50">
            {tr("İşçi kodu", "Staff passcode")}
          </p>
          <p className="text-base font-semibold truncate">{staffName}</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="p-2 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-50"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 pb-8">
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                i < pin.length
                  ? "bg-[#14b8a6] border-[#14b8a6]"
                  : "border-white/40 bg-transparent"
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="text-sm text-red-400 text-center max-w-sm">{error}</p>
        ) : (
          <p className="text-sm text-white/60 text-center">
            {tr("4 rəqəmli kodu daxil edin", "Enter the 4-digit passcode")}
          </p>
        )}

        <div className="w-full max-w-xs">
          <DigitKeypad value={pin} onChange={setPin} maxLength={4} size="lg" />
        </div>

        <div className="flex gap-3 w-full max-w-xs">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border border-white/20 text-sm font-medium disabled:opacity-50"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            disabled={busy || pin.length !== 4}
            onClick={submit}
            className="flex-1 h-12 rounded-xl bg-[#14b8a6] text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? tr("Yoxlanır…", "Checking…") : tr("Təsdiq et", "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
