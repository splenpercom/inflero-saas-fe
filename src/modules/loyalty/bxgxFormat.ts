/** Display helpers for Buy-Get Free quantities / money (API sends fixed decimals). */

/** "5.000" → "5", "2.500" → "2.5" */
export function formatBxgxQty(value: string | number | null | undefined): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0";
  const fixed = (Math.round(n * 1000) / 1000).toFixed(3);
  return fixed.replace(/\.?0+$/, "");
}

export function formatBxgxAmount(
  value: string | number | null | undefined,
  metric: "QUANTITY" | "MONEY" = "QUANTITY",
): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return metric === "MONEY" ? "0.00" : "0";
  if (metric === "MONEY") return n.toFixed(2);
  return formatBxgxQty(n);
}

export function bxgxProgressLabel(
  progressValue: string,
  buyThreshold: string,
  buyMetric: "QUANTITY" | "MONEY",
): string {
  const cur = formatBxgxAmount(progressValue, buyMetric);
  const max = formatBxgxAmount(buyThreshold, buyMetric);
  return buyMetric === "MONEY" ? `${cur}₼ / ${max}₼` : `${cur} / ${max}`;
}
