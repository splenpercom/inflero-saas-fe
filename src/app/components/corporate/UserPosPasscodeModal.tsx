import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DigitKeypad } from "../ui/DigitKeypad";
import { pickLang } from "../../i18n/pickLang";
import { useLanguage } from "../../i18n/LanguageContext";

type UserPosPasscodeModalProps = {
  open: boolean;
  staffName: string;
  hasPasscode: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (passcode: string) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
};

/** Set / confirm / clear 4-digit POS staff passcode in User Management. */
export function UserPosPasscodeModal({
  open,
  staffName,
  hasPasscode,
  saving = false,
  onClose,
  onSave,
  onClear,
}: UserPosPasscodeModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => pickLang(language, az, en);
  const [activeField, setActiveField] = useState<"pin" | "confirm">("pin");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setConfirm("");
    setActiveField("pin");
    setError(null);
  }, [open]);

  if (!open) return null;

  const setActiveValue = (next: string) => {
    setError(null);
    if (activeField === "pin") setPin(next);
    else setConfirm(next);
  };

  const activeValue = activeField === "pin" ? pin : confirm;

  const handleSave = () => {
    if (pin.length !== 4 || confirm.length !== 4) {
      setError(tr("Hər iki sahə 4 rəqəm olmalıdır", "Both fields must be 4 digits"));
      return;
    }
    if (pin !== confirm) {
      setError(tr("Kodlar uyğun gəlmir", "Passcodes do not match"));
      return;
    }
    void onSave(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {hasPasscode
                ? tr("Kodu yenilə", "Edit passcode")
                : tr("Kod yarat", "Create passcode")}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{staffName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveField("pin")}
              className={`rounded-lg border px-2 py-2 text-left ${
                activeField === "pin"
                  ? "border-[#14b8a6] bg-[#14b8a6]/5"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="text-[10px] text-gray-500 uppercase">{tr("Kod", "PIN")}</p>
              <p className="text-sm font-mono tracking-widest text-gray-900 dark:text-white">
                {pin ? "•".repeat(pin.length) : "————"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveField("confirm")}
              className={`rounded-lg border px-2 py-2 text-left ${
                activeField === "confirm"
                  ? "border-[#14b8a6] bg-[#14b8a6]/5"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="text-[10px] text-gray-500 uppercase">{tr("Təsdiq", "Confirm")}</p>
              <p className="text-sm font-mono tracking-widest text-gray-900 dark:text-white">
                {confirm ? "•".repeat(confirm.length) : "————"}
              </p>
            </button>
          </div>

          {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}

          <DigitKeypad value={activeValue} onChange={setActiveValue} maxLength={4} />

          <div className="flex gap-2 pt-1">
            {hasPasscode && onClear ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void onClear()}
                className="flex-1 h-10 rounded-lg border border-red-200 dark:border-red-900/40 text-xs font-medium text-red-600 dark:text-red-400 disabled:opacity-50"
              >
                {tr("Sil", "Clear")}
              </button>
            ) : null}
            <button
              type="button"
              disabled={saving || pin.length !== 4 || confirm.length !== 4}
              onClick={handleSave}
              className="flex-1 h-10 rounded-lg bg-[#14b8a6] text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? tr("Saxlanılır…", "Saving…") : tr("Saxla", "Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
