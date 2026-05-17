import { Currency } from '../types';

export interface RateSnapshots {
  bcv: number;
  parallel: number;
  eur: number;
  eurParallel: number;
  usdt: number; // usually 1.0
  updatedAt: number;
}

/**
 * Chained rate calculation for any wallet → any wallet combination.
 * 
 * Logic based on spec:
 * EUR → VES:  amount × (EUR/USD) × (USD/VES)
 * USDT → VES: amount × (1 + userSpread) × (USD/VES)
 * EUR → USDT: amount × (EUR/USD) / (1 + userSpread)
 * 
 * @param amount Amount in source currency
 * @param from Source currency
 * @param to Target currency
 * @param rates Current rate snapshot
 * @param usdtSpread User configurable P2P spread (e.g. 0.015 for 1.5%)
 */
export const convertCurrency = (
  amount: number,
  from: Currency,
  to: Currency,
  rates: {
    usdToVes: number;
    eurToVes: number;
  },
  usdtSpread: number = 0
): number => {
  if (from === to) return amount;

  // Normalize all to USD first
  let amountInUSD = amount;

  switch (from) {
    case Currency.USD:
      amountInUSD = amount;
      break;
    case Currency.VES:
      amountInUSD = amount / rates.usdToVes;
      break;
    case Currency.EUR:
      // EUR to USD = EUR to VES / USD to VES
      amountInUSD = amount * (rates.eurToVes / rates.usdToVes);
      break;
    case Currency.USDT:
      // USDT is effectively USD (1:1) in Parity's core logic
      amountInUSD = amount;
      break;
  }

  // Convert from USD to target
  switch (to) {
    case Currency.USD:
      return amountInUSD;
    case Currency.VES:
      // If coming from USDT, apply spread
      if (from === Currency.USDT) {
        return amountInUSD * (1 + usdtSpread) * rates.usdToVes;
      }
      return amountInUSD * rates.usdToVes;
    case Currency.EUR:
      // USD to EUR = USD to VES / EUR to VES
      return amountInUSD * (rates.usdToVes / rates.eurToVes);
    case Currency.USDT:
      // If going to USDT, apply inverse spread if coming from something else?
      // Spec says: EUR → USDT: amount × (EUR/USD) / (1 + usdtSpread)
      if (from === Currency.EUR) {
        return (amount * (rates.eurToVes / rates.usdToVes)) / (1 + usdtSpread);
      }
      // General case: normalize amount to USD then divide by (1 + spread)
      return amountInUSD / (1 + usdtSpread);
    default:
      return amountInUSD;
  }
};

/**
 * Frankfurter API Client for EUR/USD rates
 */
export const fetchEurUsdRate = async (): Promise<number | null> => {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
    if (res.ok) {
      const data = await res.json();
      return data.rates.USD;
    }
  } catch (error) {
    console.error('Failed to fetch EUR rate from Frankfurter', error);
  }
  return null;
};
