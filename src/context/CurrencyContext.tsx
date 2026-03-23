// src/context/CurrencyContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Currency = "USD" | "PHP";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rate: number;
  loading: boolean;
  format: (amount: number) => string;
  convert: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  rate: 1,
  loading: false,
  format: (n) => `$${n.toFixed(2)}`,
  convert: (n) => n,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Initialize directly from localStorage to avoid a flash of the wrong currency
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "USD";
    const saved = localStorage.getItem("currency");
    return saved === "PHP" ? "PHP" : "USD";
  });
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch live USD → PHP rate whenever currency switches to PHP.
  // Because currency is initialized from localStorage above, this also
  // correctly fires on first load if the user previously selected PHP.
  useEffect(() => {
    if (currency !== "PHP") {
      setRate(1);
      return;
    }
    setLoading(true);
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates?.PHP) setRate(data.rates.PHP);
      })
      .catch(() => setRate(56)) // fallback rate
      .finally(() => setLoading(false));
  }, [currency]);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  }

  const convert = useCallback(
    (amount: number) => (currency === "PHP" ? amount * rate : amount),
    [currency, rate]
  );

  const format = useCallback(
    (amount: number) => {
      const converted = convert(amount);
      return new Intl.NumberFormat(currency === "PHP" ? "fil-PH" : "en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    },
    [currency, convert]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rate, loading, format, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}