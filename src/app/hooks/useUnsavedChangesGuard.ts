import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useConfirm } from "../context/ConfirmContext";
import { useLanguage } from "../i18n/LanguageContext";
import { pickLang } from "../i18n/pickLang";

type GuardMessages = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

function sameAppPath(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    const next = `${url.pathname}${url.search}${url.hash}`;
    const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next === cur) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/**
 * Warn before leaving a guarded page (BrowserRouter-safe; no useBlocker).
 * - confirmLeave() for Back / Cancel
 * - in-app <a>/<Link> clicks
 * - browser back (popstate)
 * - tab close / refresh (beforeunload)
 *
 * Call allowNextNavigation() before intentional leave (e.g. after save).
 */
export function useUnsavedChangesGuard(enabled: boolean, messages?: GuardMessages) {
  const askConfirm = useConfirm();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const allowNextRef = useRef(false);
  const promptOpenRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const title =
    messages?.title ??
    tr("Saxlanmamış dəyişikliklər", "Unsaved changes", "Несохранённые изменения");
  const message =
    messages?.message ??
    tr(
      "Redaktə səhifəsindən saxlamadan çıxmaq üzrəsiniz. Dəyişikliklər itə bilər.",
      "You are about to leave the edit page without saving. Your changes may be lost.",
      "Вы собираетесь покинуть страницу редактирования без сохранения. Изменения могут быть потеряны.",
    );
  const confirmLabel = messages?.confirmLabel ?? tr("Çıx", "Leave", "Уйти");
  const cancelLabel = messages?.cancelLabel ?? tr("Qal", "Stay", "Остаться");

  const confirmLeave = useCallback(async () => {
    if (!enabledRef.current || allowNextRef.current) return true;
    if (promptOpenRef.current) return false;
    promptOpenRef.current = true;
    try {
      return await askConfirm({
        title,
        message,
        variant: "danger",
        confirmLabel,
        cancelLabel,
      });
    } finally {
      promptOpenRef.current = false;
    }
  }, [askConfirm, cancelLabel, confirmLabel, message, title]);

  const allowNextNavigation = useCallback(() => {
    allowNextRef.current = true;
  }, []);

  useEffect(() => {
    if (!enabled) {
      allowNextRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowNextRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled]);

  // Trap browser Back while on this page.
  useEffect(() => {
    if (!enabled) return;
    window.history.pushState({ __unsavedGuard: true }, "");
    const onPopState = () => {
      if (allowNextRef.current || promptOpenRef.current) return;
      void (async () => {
        const ok = await confirmLeave();
        if (!ok) {
          window.history.pushState({ __unsavedGuard: true }, "");
          return;
        }
        allowNextRef.current = true;
        window.history.back();
      })();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [confirmLeave, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onClickCapture = (e: MouseEvent) => {
      if (allowNextRef.current || promptOpenRef.current) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const el = e.target;
      if (!(el instanceof Element)) return;
      const anchor = el.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "" && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const hrefAttr = anchor.getAttribute("href");
      if (
        !hrefAttr ||
        hrefAttr.startsWith("#") ||
        hrefAttr.startsWith("mailto:") ||
        hrefAttr.startsWith("tel:")
      ) {
        return;
      }

      const nextPath = sameAppPath(anchor.href);
      if (!nextPath) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      void (async () => {
        const ok = await confirmLeave();
        if (!ok) return;
        allowNextRef.current = true;
        navigate(nextPath);
      })();
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [confirmLeave, enabled, navigate]);

  return { confirmLeave, allowNextNavigation };
}
