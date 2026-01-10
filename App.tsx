import React, { useState, useEffect } from 'react';
import { Plus, Wallet, Home, Target, User } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { AddTransaction } from './components/AddTransaction';
import { SettingsModal } from './components/SettingsModal';
import { TransferView } from './components/TransferView';
import { BudgetView } from './components/BudgetView';
import { AnalysisView } from './components/AnalysisView';
import { WalletView } from './components/WalletView';
import { ProfileView } from './components/ProfileView';
import { ScheduledPaymentView } from './components/ScheduledPaymentView';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

import { INITIAL_RATE, MOCK_ACCOUNTS } from './constants';
import { Transaction, Account, Currency, TransactionType, ViewState, UserProfile, ScheduledPayment } from './types';

const STORAGE_KEY = 'dualflow_data_v3';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Application State
  const [exchangeRate, setExchangeRate] = useState(INITIAL_RATE);
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'John Doe', language: 'en' });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setExchangeRate(data.exchangeRate || INITIAL_RATE);
        setAccounts(data.accounts && data.accounts.length > 0 ? data.accounts : MOCK_ACCOUNTS);
        setTransactions(data.transactions || []);
        setScheduledPayments(data.scheduledPayments || []);
        setUserProfile(data.userProfile || { name: 'John Doe', language: 'en' });
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    const data = {
      exchangeRate,
      accounts,
      transactions,
      scheduledPayments,
      userProfile
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [exchangeRate, accounts, transactions, scheduledPayments, userProfile, isLoaded]);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleUpdateAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
  };

  const handleDeleteTransaction = (id: string, skipConfirm = false, skipStateUpdate = false): Account[] | null => {
    if (skipConfirm || confirm('Delete this transaction?')) {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        const updatedAccounts = accounts.map(acc => {
          if (acc.id === tx.accountId) {
            let amount = tx.amount;

            if (acc.currency !== tx.originalCurrency) {
              if (acc.currency === Currency.USD && tx.originalCurrency === Currency.VES) {
                amount = tx.amount / tx.exchangeRate;
              } else if (acc.currency === Currency.VES && tx.originalCurrency === Currency.USD) {
                amount = tx.amount * tx.exchangeRate;
              }
            }

            const modifier = tx.type === TransactionType.INCOME ? -1 : 1;
            return { ...acc, balance: acc.balance + (amount * modifier) };
          }

          if (tx.type === TransactionType.TRANSFER && tx.toAccountId && acc.id === tx.toAccountId) {
            let amount = tx.amount;

            if (tx.originalCurrency !== acc.currency) {
              if (tx.originalCurrency === Currency.USD && acc.currency === Currency.VES) {
                amount = tx.amount * tx.exchangeRate;
              } else if (tx.originalCurrency === Currency.VES && acc.currency === Currency.USD) {
                amount = tx.amount / tx.exchangeRate;
              }
            }

            return { ...acc, balance: acc.balance - amount };
          }

          return acc;
        });

        if (!skipStateUpdate) {
            setAccounts(updatedAccounts);
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
        return updatedAccounts;
      }
    }
    return null;
  };

  const handleSaveTransaction = (data: any) => {
    let currentAccounts = accounts;
    
    // If editing, first "revert" the effect of the old transaction on balances
    if (data.id) {
       const revertedAccounts = handleDeleteTransaction(data.id, true, true);
       if (revertedAccounts) currentAccounts = revertedAccounts;
    }

    const normalizedUSD = data.originalCurrency === Currency.USD
      ? data.amount
      : data.amount / data.exchangeRate;

    const newTransaction: Transaction = {
      ...data,
      id: data.id || Math.random().toString(36).substr(2, 9),
      normalizedAmountUSD: normalizedUSD
    };

    setTransactions(prev => {
        if (data.id) {
            return [newTransaction, ...prev.filter(t => t.id !== data.id)];
        }
        return [newTransaction, ...prev];
    });

    setAccounts(currentAccounts.map(acc => {
      if (acc.id === data.accountId) {
        let deduction = data.amount;
        if (acc.currency !== data.originalCurrency) {
          if (acc.currency === Currency.USD && data.originalCurrency === Currency.VES) {
            deduction = data.amount / data.exchangeRate;
          } else if (acc.currency === Currency.VES && data.originalCurrency === Currency.USD) {
            deduction = data.amount * data.exchangeRate;
          }
        }
        const modifier = data.type === TransactionType.INCOME ? 1 : -1;
        return { ...acc, balance: acc.balance + (deduction * modifier) };
      }

      if (data.type === TransactionType.TRANSFER && data.toAccountId && acc.id === data.toAccountId) {
        let addition = data.amount;

        if (data.originalCurrency !== acc.currency) {
          if (data.originalCurrency === Currency.USD) {
            if (acc.currency === Currency.VES) addition = data.amount * data.exchangeRate;
            else addition = data.amount;
          }
          else if (data.originalCurrency === Currency.VES) {
            if (acc.currency === Currency.USD) addition = data.amount / data.exchangeRate;
            else addition = data.amount / data.exchangeRate;
          }
          else {
            if (acc.currency === Currency.VES) addition = data.amount * data.exchangeRate;
            else addition = data.amount;
          }
        }
        return { ...acc, balance: acc.balance + addition };
      }

      return acc;
    }));

    setShowAdd(false);
    setEditingTransaction(null);
  };

  const handleImportData = (data: any) => {
    if (data.transactions && data.accounts) {
      setTransactions(data.transactions);
      setAccounts(data.accounts);
      if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      if (data.userProfile) setUserProfile(data.userProfile);
      if (data.scheduledPayments) setScheduledPayments(data.scheduledPayments);
      alert('Data imported successfully!');
    } else {
      alert('Invalid data file.');
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="h-screen w-full bg-theme-bg text-theme-primary font-sans flex flex-col items-center justify-center overflow-hidden">
      {/* Wrapper */}
      <div className="w-full h-full bg-theme-bg relative shadow-2xl overflow-hidden flex flex-col">

        {/* Main Content Router */}
        <div className="flex-1 relative z-0 overflow-y-auto flex flex-col">
          {currentView === 'DASHBOARD' && (
            <Dashboard
              accounts={accounts}
              transactions={transactions}
              exchangeRate={exchangeRate}
              onOpenSettings={() => setShowSettings(true)}
              onNavigate={setCurrentView}
              userProfile={userProfile}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => { setEditingTransaction(tx); setShowAdd(true); }}
              onToggleBottomNav={setIsNavVisible}
            />
          )}
          {currentView === 'TRANSFER' && (
            <TransferView
              accounts={accounts}
              onBack={() => setCurrentView('DASHBOARD')}
              onTransfer={handleSaveTransaction}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
            />
          )}
          {currentView === 'SCHEDULED' && (
            <ScheduledPaymentView
              onBack={() => setCurrentView('DASHBOARD')}
              lang={userProfile.language}
              scheduledPayments={scheduledPayments}
              onUpdateScheduledPayments={setScheduledPayments}
            />
          )}
          {currentView === 'BUDGET' && (
            <BudgetView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              lang={userProfile.language}
            />
          )}
          {currentView === 'ANALYSIS' && (
            <AnalysisView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              scheduledPayments={scheduledPayments}
              lang={userProfile.language}
            />
          )}
          {currentView === 'WALLET' && (
            <WalletView
              onBack={() => setCurrentView('DASHBOARD')}
              accounts={accounts}
              onUpdateAccounts={handleUpdateAccounts}
              lang={userProfile.language}
              transactions={transactions}
            />
          )}
          {currentView === 'PROFILE' && (
            <ProfileView
              onBack={() => setCurrentView('DASHBOARD')}
              profile={userProfile}
              onUpdateProfile={setUserProfile}
              transactions={transactions}
              accounts={accounts}
              onImportData={handleImportData}
            />
          )}
        </div>

        {/* Bottom Nav (Only visible on Dashboard and Wallet/Profile root) */}
        {['DASHBOARD', 'WALLET', 'PROFILE', 'ANALYSIS'].includes(currentView) && isNavVisible && (
          <div className="h-20 bg-theme-surface/95 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-8 md:gap-24 px-2 relative z-10 pb-2 flex-shrink-0 w-full transition-all duration-300 animate-in slide-in-from-bottom-full">
            <button
              onClick={() => setCurrentView('DASHBOARD')}
              className={`p-3 transition-colors ${currentView === 'DASHBOARD' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              <Home size={24} />
            </button>
            <button
              onClick={() => setCurrentView('WALLET')}
              className={`p-3 transition-colors ${currentView === 'WALLET' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              <Wallet size={24} />
            </button>

            {/* FAB container */}
            <div className="relative -top-6">
              <button
                onClick={() => {
                  if (accounts.length === 0) {
                    alert("Please create a wallet first!");
                    setCurrentView('WALLET');
                    return;
                  }
                  setEditingTransaction(null);
                  setShowAdd(true);
                }}
                className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform border-4 border-theme-bg ${accounts.length === 0 ? 'bg-zinc-600 shadow-zinc-900/50 grayscale' : 'bg-theme-brand shadow-brand/50'}`}
              >
                <Plus size={32} />
              </button>
            </div>

            <button
              onClick={() => setCurrentView('ANALYSIS')}
              className={`p-3 transition-colors ${currentView === 'ANALYSIS' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              <Target size={24} />
            </button>
            <button
              onClick={() => setCurrentView('PROFILE')}
              className={`p-3 transition-colors ${currentView === 'PROFILE' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              <User size={24} />
            </button>
          </div>
        )}

        {/* Modals */}
        {showAdd && (
          <AddTransaction
            onClose={() => { setShowAdd(false); setEditingTransaction(null); }}
            onSave={handleSaveTransaction}
            exchangeRate={exchangeRate}
            accounts={accounts}
            lang={userProfile.language}
            initialData={editingTransaction}
          />
        )}

        {showSettings && (
          <SettingsModal
            currentRate={exchangeRate}
            onClose={() => setShowSettings(false)}
            onUpdateRate={setExchangeRate}
            lang={userProfile.language}
          />
        )}
      </div>
    </div>
  );
}