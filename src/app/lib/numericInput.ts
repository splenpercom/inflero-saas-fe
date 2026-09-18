/**
 * Helpers for clearable numeric text fields.
 * Prefer storing string (or number | "") in parent state so clearing does not snap back to 0.
 */

export type SanitizeNumericOpts = {
  allowDecimal?: boolean;
  allowNegative?: boolean;
};

/** Strip invalid chars and normalize leading zeros while typing. Empty string is allowed. */
export function sanitizeNumericTyping(
  raw: string,
  opts?: SanitizeNumericOpts,
): string {
  const allowDecimal = opts?.allowDecimal ?? true;
  const allowNegative = opts?.allowNegative ?? false;

  let out = "";
  let hasDot = false;
  let i = 0;

  if (allowNegative && raw[0] === "-") {
    out = "-";
    i = 1;
  }

  for (; i < raw.length; i++) {
    const c = raw[i];
    if (c >= "0" && c <= "9") {
      out += c;
    } else if (allowDecimal && c === "." && !hasDot) {
      out += ".";
      hasDot = true;
    }
  }

  const neg = out.startsWith("-");
  let body = neg ? out.slice(1) : out;

  if (body === "" && neg) return "-";
  if (body === "") return "";

  // Prevent ugly leading zeros: "025" → "25"; keep "0", "0.", "0.5"
  if (body.startsWith("0") && body !== "0" && !body.startsWith("0.")) {
    body = body.replace(/^0+/, "");
    if (body === "" || body.startsWith(".")) {
      body = `0${body}`;
    }
  }

  return neg ? `-${body}` : body;
}

/** Parse sanitized numeric text; empty / incomplete → fallback. */
export function parseNumericInput(raw: string, fallback = 0): number {
  const t = raw.trim();
  if (t === "" || t === "-" || t === "." || t === "-.") return fallback;
  const n = Number(t);
  return Number.isFinite(n) ? n : fallback;
}

/** For number | "" controlled state: empty → "", else finite number. */
export function numericOrEmptyFromEvent(raw: string): number | "" {
  if (raw.trim() === "") return "";
  const n = Number(raw);
  return Number.isFinite(n) ? n : "";
}

/**
 * Bind number | "" state to a clearable text input.
 * Prefer NumericInput + string state when building new fields.
 */
export function bindNumericState(
  value: number | "",
  setValue: (v: number | "") => void,
  opts?: SanitizeNumericOpts,
): {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
} {
  return {
    value: value === "" ? "" : String(value),
    onChange: (e) => {
      const s = sanitizeNumericTyping(e.target.value, opts);
      if (s === "" || s === "-" || s === "." || s === "-.") {
        setValue("");
        return;
      }
      setValue(numericOrEmptyFromEvent(s));
    },
  };
}

/** Coerce number | "" for math/API payloads. */
export function asNumber(v: number | "", fallback = 0): number {
  return v === "" || !Number.isFinite(v) ? fallback : v;
}
