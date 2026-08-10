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
  if (error instanceof ApiError) {
    toast.error(error.message);
    return;
  }
  if (error instanceof Error && error.message) {
    toast.error(error.message);
    return;
  }
  toast.error(fallback);
}
