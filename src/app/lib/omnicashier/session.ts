/**
 * OmniCashier session: cached access_token, ensure open shift, prev_doc_number.
 */

import { loadOmnicashierSettings, type OmnicashierSettings } from "../omnicashierSettings";
import {
  OmnicashierError,
  omniGetInfo,
  omniLogin,
  omniOpenShift,
  omniShiftStatus,
} from "./client";

type SessionState = {
  token: string;
  lastDocNumber: number | null;
  obtainedAt: number;
};

let session: SessionState | null = null;

export function clearOmnicashierSession(): void {
  session = null;
}

export async function ensureOmnicashierSession(
  settings?: OmnicashierSettings,
): Promise<{ token: string; prevDocNumber: number | null }> {
  const s = settings ?? loadOmnicashierSettings();

  const loginFresh = async () => {
    const token = await omniLogin(s);
    let lastDocNumber: number | null = null;
    try {
      const info = await omniGetInfo(token, s);
      if (typeof info.last_doc_number === "number") lastDocNumber = info.last_doc_number;
    } catch {
      // Get Info optional for login path
    }
    try {
      const st = await omniShiftStatus(token, s);
      if (!st.shiftStatus) {
        await omniOpenShift(token, s);
      }
    } catch (err) {
      // If shift status fails with 401, rethrow; otherwise try open shift
      if (err instanceof OmnicashierError && err.code === 401) throw err;
      try {
        await omniOpenShift(token, s);
      } catch {
        // leave for sale to fail clearly
      }
    }
    session = { token, lastDocNumber, obtainedAt: Date.now() };
    return session;
  };

  if (!session?.token) {
    await loginFresh();
  } else {
    // Refresh shift / last doc; re-login on 401
    try {
      const info = await omniGetInfo(session.token, s);
      if (typeof info.last_doc_number === "number") {
        session.lastDocNumber = info.last_doc_number;
      }
      const st = await omniShiftStatus(session.token, s);
      if (!st.shiftStatus) await omniOpenShift(session.token, s);
    } catch (err) {
      if (err instanceof OmnicashierError && (err.code === 401 || err.code === -3)) {
        clearOmnicashierSession();
        await loginFresh();
      } else {
        throw err;
      }
    }
  }

  return {
    token: session!.token,
    prevDocNumber: session!.lastDocNumber,
  };
}

export function rememberLastDocNumber(n: number): void {
  if (session) session.lastDocNumber = n;
}
