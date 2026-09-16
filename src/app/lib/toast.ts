import { toast } from "sonner";
import { ApiError } from "../api/client";

export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyError(message: string) {
  toast.error(message);
}

export function notifyInfo(message: string) {
  toast.info(message);
}

export function notifyWarning(message: string) {
  toast.warning(message);
}

export function notifyFromError(error: unknown, fallback = "Something went wrong") {
  if (isAbortError(error)) return;
  if (error instanceof ApiError) {
    toast.error(error.message);
    return;
  }
  if (isNetworkError(error)) {
    toast.error(
      fallback === "Something went wrong"
        ? "Network error — check connection and try again"
        : fallback,
    );
    return;
  }
  if (error instanceof Error && error.message) {
    toast.error(error.message);
    return;
  }
  toast.error(fallback);
}

/** Fetch aborted (stale barcode lookup) — ignore. */
export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  if (name === "AbortError") return true;
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  return false;
}

/** Browser "Failed to fetch" / offline / DNS. */
export function isNetworkError(error: unknown): boolean {
  if (isAbortError(error)) return false;
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    return /failed to fetch|networkerror|load failed|network request failed|econnrefused|enotfound/i.test(
      error.message,
    );
  }
  return false;
}
