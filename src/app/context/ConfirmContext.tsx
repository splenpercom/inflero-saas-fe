import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { cn } from "../components/ui/utils";
import { useLanguage } from "../i18n/LanguageContext";
import { pickLang } from "../i18n/pickLang";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

export type ConfirmWithReasonOptions = ConfirmOptions & {
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  reasonMaxLength?: number;
};

export type ConfirmWithReasonResult =
  | { confirmed: false; reason: "" }
  | { confirmed: true; reason: string };

type PendingConfirm = ConfirmOptions & {
  mode: "confirm";
  resolve: (value: boolean) => void;
};

type PendingReason = ConfirmWithReasonOptions & {
  mode: "reason";
  resolve: (value: ConfirmWithReasonResult) => void;
};

type Pending = PendingConfirm | PendingReason;

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmWithReason: (options: ConfirmWithReasonOptions) => Promise<ConfirmWithReasonResult>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [pending, setPending] = useState<Pending | null>(null);
  const [reasonDraft, setReasonDraft] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const settledRef = useRef(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      settledRef.current = false;
      setReasonDraft("");
      setReasonError(false);
      setPending({ ...options, mode: "confirm", resolve });
    });
  }, []);

  const confirmWithReason = useCallback((options: ConfirmWithReasonOptions) => {
    return new Promise<ConfirmWithReasonResult>((resolve) => {
      settledRef.current = false;
      setReasonDraft("");
      setReasonError(false);
      setPending({ ...options, mode: "reason", resolve });
    });
  }, []);

  const closeConfirm = useCallback((result: boolean) => {
    setPending((current) => {
      if (current?.mode === "confirm" && !settledRef.current) {
        settledRef.current = true;
        current.resolve(result);
      }
      return null;
    });
  }, []);

  const closeReason = useCallback((result: ConfirmWithReasonResult) => {
    setPending((current) => {
      if (current?.mode === "reason" && !settledRef.current) {
        settledRef.current = true;
        current.resolve(result);
      }
      return null;
    });
    setReasonDraft("");
    setReasonError(false);
  }, []);

  const value = useMemo(
    () => ({ confirm, confirmWithReason }),
    [confirm, confirmWithReason],
  );

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const variant = pending?.variant ?? "default";
  const title = pending?.title ?? tr("Təsdiq", "Confirm", "Подтверждение");
  const confirmLabel =
    pending?.confirmLabel ??
    (variant === "danger"
      ? tr("Sil", "Delete", "Удалить")
      : tr("Təsdiq", "Confirm", "Подтвердить"));
  const cancelLabel = pending?.cancelLabel ?? tr("Ləğv et", "Cancel", "Отмена");
  const isReason = pending?.mode === "reason";
  const reasonRequired = isReason ? pending.reasonRequired !== false : false;
  const reasonMax = isReason ? pending.reasonMaxLength ?? 1000 : 1000;
  const reasonLabel =
    (isReason && pending.reasonLabel) ||
    tr("Silinmə səbəbi", "Deletion reason", "Причина удаления");
  const reasonPlaceholder =
    (isReason && pending.reasonPlaceholder) ||
    tr("Səbəbi daxil edin…", "Enter the reason…", "Укажите причину…");

  const onConfirmClick = () => {
    if (!pending) return;
    if (pending.mode === "confirm") {
      closeConfirm(true);
      return;
    }
    const trimmed = reasonDraft.trim();
    if (reasonRequired && !trimmed) {
      setReasonError(true);
      return;
    }
    closeReason({ confirmed: true, reason: trimmed });
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialog
        open={pending != null}
        onOpenChange={(open) => {
          if (!open) {
            if (pending?.mode === "reason") closeReason({ confirmed: false, reason: "" });
            else closeConfirm(false);
          }
        }}
      >
        <AlertDialogContent className="z-[100] border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              {pending?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isReason ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {reasonLabel}
                {reasonRequired ? <span className="text-red-500"> *</span> : null}
              </label>
              <textarea
                value={reasonDraft}
                onChange={(e) => {
                  setReasonDraft(e.target.value.slice(0, reasonMax));
                  if (reasonError) setReasonError(false);
                }}
                rows={3}
                maxLength={reasonMax}
                placeholder={reasonPlaceholder}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 resize-y min-h-[72px]",
                  reasonError
                    ? "border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700",
                )}
              />
              {reasonError ? (
                <p className="text-[11px] text-red-500">
                  {tr("Səbəb mütləqdir", "Reason is required", "Укажите причину")}
                </p>
              ) : null}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (pending?.mode === "reason") closeReason({ confirmed: false, reason: "" });
                else closeConfirm(false);
              }}
              className="border-gray-300 dark:border-gray-700"
            >
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep dialog open until validation passes (reason mode).
                if (isReason && reasonRequired && !reasonDraft.trim()) {
                  e.preventDefault();
                  setReasonError(true);
                  return;
                }
                // Resolve before Radix unmounts so callers always get an answer.
                onConfirmClick();
              }}
              className={cn(
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-[#14b8a6] hover:bg-[#0d9488] text-white",
              )}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx.confirm;
}

export function useConfirmWithReason() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirmWithReason must be used within ConfirmProvider");
  }
  return ctx.confirmWithReason;
}
