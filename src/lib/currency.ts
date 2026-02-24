export type CurrencyCode = "EUR" | "USD" | "GBP" | "AUD" | "CAD" | "CHF" | "JPY" | "NZD";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "EUR", symbol: "\u20ac", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "JPY", symbol: "\u00a5", name: "Japanese Yen" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
];

// Approximate conversion rates FROM EUR (as of early 2026)
const EUR_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  AUD: 1.65,
  CAD: 1.47,
  CHF: 0.97,
  JPY: 162,
  NZD: 1.78,
};

export function convertFromEur(amountEur: number, currency: CurrencyCode): number {
  return Math.round(amountEur * EUR_RATES[currency]);
}

export function getCurrencySymbol(code: CurrencyCode): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatPrice(amountEur: number | undefined | null, currency: CurrencyCode): string {
  if (amountEur == null) return "";
  const converted = convertFromEur(amountEur, currency);
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${converted.toLocaleString()}`;
}

export function isValidCurrency(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code);
}

export const CURRENCY_STORAGE_KEY = "rough-idea-currency";
