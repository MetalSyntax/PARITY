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

import { INITIAL_RATE, MOCK_ACCOUNTS } from './constants';
import { Transaction, Account, Currency, TransactionType, ViewState, UserProfile } from './types';

const STORAGE_KEY = 'dualflow_data_v3';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Application State
  const [exchangeRate, setExchangeRate] = useState(INITIAL_RATE);
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      userProfile
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [exchangeRate, accounts, transactions, userProfile, isLoaded]);

  const handleUpdateAccounts = (newAccounts: Account[]) => {
      setAccounts(newAccounts);
  };

  const handleSaveTransaction = (data: Omit<Transaction, 'id' | 'normalizedAmountUSD'>) => {
    const normalizedUSD = data.originalCurrency === Currency.USD 
      ? data.amount 
      : data.amount / data.exchangeRate;

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      normalizedAmountUSD: normalizedUSD
    };

    setTransactions(prev => [newTransaction, ...prev]);

    // Update Account Balance
    setAccounts(prev => prev.map(acc => {
      // Deduct from Source
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
      
      // Add to Destination (if Transfer)
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
  };

  if (!isLoaded) return null;

  return (
    <div className="h-screen w-full bg-background text-white font-sans flex flex-col items-center justify-center overflow-hidden">
      {/* Wrapper */}
      <div className="w-full h-full bg-background relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Main Content Router */}
        <div className="flex-1 relative z-0 overflow-hidden flex flex-col">
          {currentView === 'DASHBOARD' && (
            <Dashboard 
              accounts={accounts}
              transactions={transactions}
              exchangeRate={exchangeRate}
              onOpenSettings={() => setShowSettings(true)}
              onNavigate={setCurrentView}
              userProfile={userProfile}
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
               lang={userProfile.language}
             />
          )}
          {currentView === 'WALLET' && (
             <WalletView 
               onBack={() => setCurrentView('DASHBOARD')}
               accounts={accounts}
               onUpdateAccounts={handleUpdateAccounts}
               lang={userProfile.language}
             />
          )}
          {currentView === 'PROFILE' && (
             <ProfileView 
               onBack={() => setCurrentView('DASHBOARD')}
               profile={userProfile}
               onUpdateProfile={setUserProfile}
               transactions={transactions}
               accounts={accounts}
             />
          )}
        </div>

        {/* Bottom Nav (Only visible on Dashboard) */}
        {currentView === 'DASHBOARD' && (
          <div className="h-20 bg-[#050505]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-12 px-2 relative z-10 pb-2 flex-shrink-0 w-full">
             <button onClick={() => setCurrentView('DASHBOARD')} className="p-3 text-white"><Home size={24} /></button>
             <button onClick={() => setCurrentView('WALLET')} className="p-3 text-zinc-500 hover:text-white transition-colors"><Wallet size={24} /></button>
             
             {/* FAB container */}
             <div className="relative -top-6">
                <button 
                  onClick={() => setShowAdd(true)}
                  className="w-16 h-16 rounded-full bg-blue-600 shadow-lg shadow-blue-900/50 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform border-4 border-[#050505]"
                >
                  <Plus size={32} />
                </button>
             </div>

             <button onClick={() => setCurrentView('ANALYSIS')} className="p-3 text-zinc-500 hover:text-white transition-colors"><Target size={24} /></button>
             <button onClick={() => setCurrentView('PROFILE')} className="p-3 text-zinc-500 hover:text-white transition-colors"><User size={24} /></button>
          </div>
        )}

        {/* Modals */}
        {showAdd && (
          <AddTransaction 
            onClose={() => setShowAdd(false)} 
            onSave={handleSaveTransaction}
            exchangeRate={exchangeRate}
            accounts={accounts}
            lang={userProfile.language}
          />
        )}

        {showSettings && (
          <SettingsModal 
             currentRate={exchangeRate}
             onClose={() => setShowSettings(false)}
             onUpdateRate={setExchangeRate}
          />
        )}
      </div>
    </div>
  );
}