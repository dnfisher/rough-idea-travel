"use client";

import { useCurrency } from "./CurrencyProvider";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/currency";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      className="appearance-none px-3 py-1.5 pr-6 rounded-full border border-border text-sm font-medium bg-transparent hover:bg-muted transition-colors cursor-pointer outline-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
      title="Display currency"
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {getCurrencySymbol(c.code)} {c.code}
        </option>
      ))}
    </select>
  );
}
