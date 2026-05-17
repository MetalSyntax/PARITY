import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Transaction, UserProfile, Currency } from '@parity/core';
import { mobileDbService } from '../services/db';

interface DataContextType {
  accounts: Account[];
  transactions: Transaction[];
  userProfile: UserProfile | null;
  exchangeRate: number;
  euroRate?: number;
  euroRateParallel?: number;
  usdRateParallel?: number;
  isBalanceVisible: boolean;
  displayCurrency: Currency;
  toggleBalanceVisibility: () => void;
  toggleDisplayCurrency: () => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [exchangeRate, setExchangeRate] = useState(35.5);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(Currency.USD);

  const refreshData = async () => {
    const data = await mobileDbService.read();
    if (data) {
      setAccounts(data.accounts);
      setTransactions(data.transactions);
      setUserProfile(data.userProfile);
      setExchangeRate(data.exchangeRate);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleBalanceVisibility = () => setIsBalanceVisible(!isBalanceVisible);

  const toggleDisplayCurrency = () => {
    const next: Record<Currency, Currency> = {
      [Currency.USD]: Currency.VES,
      [Currency.VES]: Currency.EUR,
      [Currency.EUR]: Currency.USDT,
      [Currency.USDT]: Currency.USD,
    };
    setDisplayCurrency(next[displayCurrency]);
  };

  return (
    <DataContext.Provider value={{
      accounts,
      transactions,
      userProfile,
      exchangeRate,
      isBalanceVisible,
      displayCurrency,
      toggleBalanceVisibility,
      toggleDisplayCurrency,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
