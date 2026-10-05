import { useCallback, useRef, useState } from "react";
import { ApiError } from "../api/client";

type GateSession = {
  staffName: string;
  error: string | null;
  busy: boolean;
};

export type StaffPasscodeEnsureOpts = {
  featureOn: boolean;
  hasPosPasscode: boolean;
  staffName: string;
  /** Runs the authenticated action with optional PIN. May throw ApiError. */
  run: (staffPasscode?: string) => Promise<void>;
  invalidPinMessage: string;
};

/**
 * Full-screen staff PIN gate state. Retries on INVALID_STAFF_PASSCODE; cancel aborts.
 * Render `PosStaffPasscodeOverlay` with the returned session handlers.
 */
export function usePosStaffPasscodeGate() {
  const [session, setSession] = useState<GateSession | null>(null);
  const runRef = useRef<((pin: string) => Promise<void>) | null>(null);
  const settleRef = useRef<((ok: boolean) => void) | null>(null);

  const closePasscode = useCallback(() => {
    setSession(null);
    runRef.current = null;
    const settle = settleRef.current;
    settleRef.current = null;
    settle?.(false);
  }, []);

  const confirmPasscode = useCallback(async (pin: string) => {
    await runRef.current?.(pin);
  }, []);

  const ensureWithPasscode = useCallback(async (opts: StaffPasscodeEnsureOpts): Promise<boolean> => {
    if (!opts.featureOn || !opts.hasPosPasscode) {
      await opts.run(undefined);
      return true;
    }

    return new Promise<boolean>((resolve) => {
      settleRef.current = resolve;
      runRef.current = async (pin: string) => {
        setSession((s) => (s ? { ...s, busy: true, error: null } : s));
        try {
          await opts.run(pin);
          setSession(null);
          runRef.current = null;
          const settle = settleRef.current;
          settleRef.current = null;
          settle?.(true);
        } catch (err) {
          const invalid =
            err instanceof ApiError &&
            (err.code === "INVALID_STAFF_PASSCODE" || err.code === "STAFF_PASSCODE_REQUIRED");
          if (invalid) {
            setSession((s) =>
              s ? { ...s, busy: false, error: opts.invalidPinMessage } : s,
            );
            return;
          }
          setSession(null);
          runRef.current = null;
          const settle = settleRef.current;
          settleRef.current = null;
          settle?.(false);
          throw err;
        }
      };
      setSession({ staffName: opts.staffName, error: null, busy: false });
    });
  }, []);

  return {
    ensureWithPasscode,
    passcodeSession: session,
    closePasscode,
    confirmPasscode,
  };
}
