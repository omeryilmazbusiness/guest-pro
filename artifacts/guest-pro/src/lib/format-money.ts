/**
 * Format monetary amounts for guest-facing UI.
 */
export function formatMoney(
  amount: string | number,
  currency: string,
  locale = "en",
): string {
  const n = typeof amount === "number" ? amount : parseFloat(amount);
  if (!Number.isFinite(n)) return String(amount);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    const symbol = currency === "TRY" ? "₺" : currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
    return symbol ? `${symbol}${n.toFixed(2)}` : `${currency} ${n.toFixed(2)}`;
  }
}

export function parseMoney(amount: string): number {
  const n = parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}
