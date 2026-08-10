/**
 * Formats a number as Azerbaijani Manat currency
 * Symbol (₼) is placed on the right side of the amount
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${formatted} ₼`;
}

/**
 * Formats a number as Azerbaijani Manat currency without decimals
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrencyWhole(amount: number): string {
  return formatCurrency(amount, 0);
}
