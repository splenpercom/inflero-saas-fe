/**
 * Low-level OmniCashier HTTP client (LAN :8989/v2).
 * All ops are HTTP POST + application/json;charset=UTF-8.
 */

import { loadOmnicashierSettings, omnicashierBaseUrl, type OmnicashierSettings } from "../omnicashierSettings";

export type OmnicashierFiscalResult = {
  document_number: number;
  long_id: string;
  short_id: string;
  shift_document_number: number;
};

export type OmnicashierGetInfoData = {
  cashbox_factory_number?: string;
  cashbox_tax_number?: string;
  cashregister_factory_number?: string;
  cashregister_model?: string;
  company_name?: string;
  firmware_version?: string;
  last_doc_number?: number;
  state?: string;
};

export class OmnicashierError extends Error {
  code: number;
  info?: string;

  constructor(code: number, message: string, info?: string) {
    super(message || `OmniCashier error ${code}`);
    this.name = "OmnicashierError";
    this.code = code;
    this.info = info;
  }
}

type Json = Record<string, unknown>;

const DEFAULT_TIMEOUT_MS = 90_000;

async function postOmni(
  body: Json,
  opts?: { settings?: OmnicashierSettings; timeoutMs?: number },
): Promise<Json> {
  const settings = opts?.settings ?? loadOmnicashierSettings();
  const url = omnicashierBaseUrl(settings);
  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let json: Json;
    try {
      json = (await res.json()) as Json;
    } catch {
      throw new OmnicashierError(-1, `OmniCashier HTTP ${res.status}: invalid JSON response`);
    }
    const code = typeof json.code === "number" ? json.code : -1;
    if (code !== 0) {
      throw new OmnicashierError(
        code,
        typeof json.message === "string" ? json.message : `OmniCashier error ${code}`,
        typeof json.info === "string" ? json.info : undefined,
      );
    }
    return json;
  } catch (err) {
    if (err instanceof OmnicashierError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new OmnicashierError(-2, "OmniCashier request timed out");
    }
    const msg = err instanceof Error ? err.message : String(err);
    // Mixed content / CORS / network
    throw new OmnicashierError(-3, msg || "OmniCashier network error");
  } finally {
    clearTimeout(timer);
  }
}

function asFiscalResult(json: Json): OmnicashierFiscalResult {
  return {
    document_number: Number(json.document_number ?? 0),
    long_id: String(json.long_id ?? ""),
    short_id: String(json.short_id ?? ""),
    shift_document_number: Number(json.shift_document_number ?? 0),
  };
}

export async function omniLogin(
  settings?: OmnicashierSettings,
): Promise<string> {
  const s = settings ?? loadOmnicashierSettings();
  const json = await postOmni(
    {
      requestData: {
        checkData: { check_type: 40 },
        name: s.username,
        password: s.password,
      },
    },
    { settings: s },
  );
  const token = json.access_token;
  if (typeof token !== "string" || !token) {
    throw new OmnicashierError(-4, "OmniCashier login did not return access_token");
  }
  return token;
}

export async function omniGetInfo(
  accessToken: string,
  settings?: OmnicashierSettings,
): Promise<OmnicashierGetInfoData> {
  const json = await postOmni(
    {
      requestData: {
        checkData: { check_type: 41 },
        access_token: accessToken,
      },
    },
    { settings },
  );
  return (json.data as OmnicashierGetInfoData) ?? {};
}

export async function omniShiftStatus(
  accessToken: string,
  settings?: OmnicashierSettings,
): Promise<{ shiftStatus: boolean; desc?: string; serial?: string }> {
  const json = await postOmni(
    {
      requestData: {
        checkData: { check_type: 14 },
        access_token: accessToken,
      },
    },
    { settings },
  );
  return {
    shiftStatus: json.shiftStatus === true,
    desc: typeof json.desc === "string" ? json.desc : undefined,
    serial: typeof json.serial === "string" ? json.serial : undefined,
  };
}

export async function omniOpenShift(
  accessToken: string,
  settings?: OmnicashierSettings,
): Promise<void> {
  await postOmni(
    {
      requestData: {
        checkData: { check_type: 15 },
        access_token: accessToken,
      },
    },
    { settings },
  );
}

export async function omniCreateSale(
  accessToken: string,
  payload: {
    int_ref?: string;
    prev_doc_number?: number;
    data: Json;
    receiptDetails?: Json[];
  },
  settings?: OmnicashierSettings,
): Promise<OmnicashierFiscalResult> {
  const body: Json = {
    requestData: {
      access_token: accessToken,
      pos_status: "false",
      ...(payload.int_ref ? { int_ref: payload.int_ref } : {}),
      tokenData: {
        parameters: {
          doc_type: "sale",
          ...(payload.prev_doc_number != null ? { prev_doc_number: payload.prev_doc_number } : {}),
          data: payload.data,
        },
        operationId: "createDocument",
        version: 1,
      },
      checkData: { check_type: 1 },
    },
  };
  if (payload.receiptDetails?.length) {
    body.receiptDetails = payload.receiptDetails;
  }
  const json = await postOmni(body, { settings });
  return asFiscalResult(json);
}

export async function omniMoneyBack(
  accessToken: string,
  payload: {
    prev_doc_number?: number;
    data: Json;
  },
  settings?: OmnicashierSettings,
): Promise<OmnicashierFiscalResult> {
  const json = await postOmni(
    {
      requestData: {
        access_token: accessToken,
        tokenData: {
          parameters: {
            doc_type: "money_back",
            ...(payload.prev_doc_number != null ? { prev_doc_number: payload.prev_doc_number } : {}),
            data: payload.data,
          },
          version: 1,
        },
        checkData: { check_type: 100 },
      },
    },
    { settings },
  );
  return asFiscalResult(json);
}

export async function omniGetLastDocument(
  accessToken: string,
  settings?: OmnicashierSettings,
): Promise<OmnicashierFiscalResult> {
  const json = await postOmni(
    {
      requestData: {
        access_token: accessToken,
        checkData: { check_type: 37 },
      },
    },
    { settings },
  );
  return asFiscalResult(json);
}
