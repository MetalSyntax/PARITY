import { Currency } from "../types";

export const formatAmount = (
  usd: number, 
  exchangeRate: number, 
  displayCurrency: Currency, 
  isBalanceVisible: boolean = true,
  decimals: number = 2,
  euroRate?: number
) => {
  if (!isBalanceVisible) return "******";
  let val = usd;
  let symbol = '$';

  if (displayCurrency === Currency.VES) {
    val = usd * exchangeRate;
    symbol = 'Bs';
  } else if (displayCurrency === Currency.EUR && euroRate) {
    val = usd * (exchangeRate / euroRate);
    symbol = '€';
  }

  return `${symbol}${val?.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}`;
};

export const formatSecondaryAmount = (
  usd: number, 
  exchangeRate: number, 
  displayCurrency: Currency, 
  isBalanceVisible: boolean = true,
  decimals: number = 0,
  euroRate?: number
) => {
  if (!isBalanceVisible) return "";
  
  // Secondary is usually the complement. 
  // If display is USD, secondary is VES
  // If display is VES, secondary is USD
  // If display is EUR, secondary is VES (or USD? let's stick to VES as default secondary for USD/EUR)
  
  let val = usd * exchangeRate;
  let symbol = 'Bs';

  if (displayCurrency === Currency.VES) {
    val = usd;
    symbol = '$';
  } else if (displayCurrency === Currency.EUR && euroRate) {
    val = usd * exchangeRate; // Show VES as secondary for EUR too
    symbol = 'Bs';
  }

  return `${symbol} ${val?.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals 
  })}`;
};
