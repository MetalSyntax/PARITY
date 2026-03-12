import { Currency } from "../types";

export const formatAmount = (
  usd: number, 
  exchangeRate: number, 
  displayInVES: boolean, 
  isBalanceVisible: boolean = true,
  decimals: number = 2
) => {
  if (!isBalanceVisible) return "******";
  const val = displayInVES ? usd * exchangeRate : usd;
  const symbol = displayInVES ? 'Bs.' : '$';
  return `${symbol}${val?.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}`;
};

export const formatSecondaryAmount = (
  usd: number, 
  exchangeRate: number, 
  displayInVES: boolean, 
  isBalanceVisible: boolean = true,
  decimals: number = 0
) => {
  if (!isBalanceVisible) return "";
  const val = displayInVES ? usd : usd * exchangeRate;
  const symbol = displayInVES ? "$" : "Bs.";
  return `${val?.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals 
  })} ${symbol}`;
};
