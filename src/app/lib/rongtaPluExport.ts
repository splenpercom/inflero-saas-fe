/**
 * Rongta RLS1000 / RTPLU PLU download helpers.
 *
 * Modern PLU manager (File → Open) uses TAB-separated `.txp` (see C:\\RLS1000\\rtplu_cn.txp),
 * not the older Appendix I fixed-width layout.
 */

export type RongtaPluExportRow = {
  hotkey: number;
  name: string;
  lfCode: string;
  code: string;
  barcodeType: number;
  unitPrice: number;
  weightUnit: number;
  quantityType: number;
  department: number;
  tare: number;
  shelfTime: number;
  packageType: number;
  packageWeight: number;
  tolerance: number;
  message1: number;
  message2: number;
  label: number;
  discount: number;
  nutrition: number;
};

function truncatePluName(name: string, max = 36): string {
  const chars = [...String(name ?? "").trim()];
  return chars.slice(0, max).join("").replace(/\t/g, " ");
}

/** Match demo tare / package-weight cells: leading space + 3 dp. */
function decimalCell(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return ` ${v.toFixed(3)}`;
}

/**
 * One TXP line — tab-separated, CRLF (matches rtplu_cn.txp / RTPLU File→Open).
 * Unit price is non-decimal minor units: 12.34 → 1234.
 */
export function buildTxpLine(row: RongtaPluExportRow): string {
  const priceMinor = Math.round(Number(row.unitPrice) * 100);
  const lf = String(row.lfCode).replace(/\D/g, "") || "0";
  const code = String(row.code).replace(/\D/g, "") || "0";
  const cols = [
    String(row.hotkey),
    truncatePluName(row.name),
    lf,
    code,
    String(row.barcodeType),
    String(priceMinor),
    String(row.weightUnit),
    String(row.department),
    decimalCell(row.tare),
    String(row.shelfTime),
    String(row.packageType),
    decimalCell(row.packageWeight),
    String(row.tolerance),
    String(row.message1),
    String(row.message2),
    "0", // Account
    String(row.label),
    String(row.discount),
    String(row.quantityType),
    "", // reserved (empty in demo)
    String(row.nutrition ?? 0),
  ];
  return cols.join("\t") + "\r\n";
}

export function buildTxpFile(rows: RongtaPluExportRow[]): string {
  return rows.map(buildTxpLine).join("");
}

/** Download .txp for PLU manager File → Open, then Upload PLU to the scale. */
export function downloadRongtaPluTxp(
  rows: RongtaPluExportRow[],
  filename = "PLU.txp",
): void {
  const content = buildTxpFile(rows);
  // ASCII/Latin-1 friendly; avoid UTF-8 BOM which can shift column 0.
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.toLowerCase().endsWith(".txp") ? filename : `${filename}.txp`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
