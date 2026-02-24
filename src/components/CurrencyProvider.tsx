"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { type CurrencyCode, CURRENCY_STORAGE_KEY, isValidCurrency } from "@/lib/currency";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "EUR",
  setCurrency: () => {},
  isLoading: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  const [isLoading, setIsLoading] = useState(true);

  // Load currency preference on mount
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      // Authenticated: load from server
      fetch("/api/user/preferences")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.currency && isValidCurrency(data.currency)) {
            setCurrencyState(data.currency);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      // Unauthenticated: load from localStorage
      try {
        const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
        if (stored && isValidCurrency(stored)) {
          setCurrencyState(stored);
        }
      } catch {}
      setIsLoading(false);
    }
  }, [session?.user, status]);

  const setCurrency = useCallback(
    (code: CurrencyCode) => {
      setCurrencyState(code);

      // Persist to localStorage immediately
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, code);
      } catch {}

      // If authenticated, also persist to server
      if (session?.user) {
        fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency: code }),
        }).catch(() => {});
      }
    },
    [session?.user]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
