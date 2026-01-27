import React, { useState, useEffect } from 'react';
import { Plus, Wallet, Home, ChartArea, User, Lock, Calendar as CalendarIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { AddTransaction } from './components/AddTransaction';
import { SettingsModal } from './components/SettingsModal';
import { TransferView } from './components/TransferView';
import { BudgetView } from './components/BudgetView';
import { AnalysisView } from './components/AnalysisView';
import { WalletView } from './components/WalletView';
import { ProfileView } from './components/ProfileView';
import { Onboarding } from './components/Onboarding';
import { ScheduledPaymentView } from './components/ScheduledPaymentView';
import { TransactionsListView } from './components/TransactionsListView';
import { CalendarHeatmapView } from './components/CalendarHeatmapView';
import { CurrencyPerformanceView } from './components/CurrencyPerformanceView';
import { ThemeProvider } from './contexts/ThemeContext';
import { getTranslation } from './i18n';
import './index.css';

import { INITIAL_RATE, MOCK_ACCOUNTS, CATEGORIES } from './constants';
import { Transaction, Account, Currency, TransactionType, ViewState, UserProfile, ScheduledPayment, Budget, Goal, ConfirmConfig } from './types';
import { idbService, StorageType, AppData } from './services/db';
import { encryptData, decryptData } from './services/crypto';
import { useGoogleDriveSync } from './hooks/useGoogleDriveSync';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const STORAGE_KEY = 'parity_data_v3';

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
  const [isBalanceVisible, setIsBalanceVisible] = useState(() => {
    const saved = localStorage.getItem("isBalanceVisible");
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Storage Preference
  const [storageType] = useState<StorageType>('INDEXED_DB');

  // Application State
  const [exchangeRate, setExchangeRate] = useState(INITIAL_RATE);
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', language: 'en' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isDevMode, setIsDevMode] = useState(() => {
    const saved = localStorage.getItem("isDevMode");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [devModeClicks, setDevModeClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const [autoLockEnabled, setAutoLockEnabled] = useState(() => {
    const saved = localStorage.getItem("autoLockEnabled");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleDevModeTrigger = () => {
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      const newCount = devModeClicks + 1;
      setDevModeClicks(newCount);
      if (newCount >= 10) {
        const newState = !isDevMode;
        setIsDevMode(newState);
        localStorage.setItem("isDevMode", JSON.stringify(newState));
        setDevModeClicks(0);
      }
    } else {
      setDevModeClicks(1);
    }
    setLastClickTime(now);
  };

  // Popup Alert State
  const [alertConfig, setAlertConfig] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const t = (key: any) => getTranslation(userProfile.language, key);

  const showAlert = (messageKey: string, type: 'success' | 'error' | 'info' = 'info') => {
      setAlertConfig({ message: t(messageKey), type });
      setTimeout(() => setAlertConfig(null), 3000);
  };

  const showConfirm = (config: ConfirmConfig) => {
      setConfirmConfig(config);
  };

  const { handleLogin, exportToCloud, importFromCloud, isSyncing, isAuthenticated } = useGoogleDriveSync({
    fileName: 'parity_backup_v1.json',
    localData: {
        userId: userProfile.name, // Extra metadata
        lastBackup: new Date().toISOString(),
        exchangeRate, accounts, transactions, scheduledPayments, userProfile, budgets, goals
    },
    setLocalData: (data: any) => {
        if (data.userProfile) handleImportData(data, true); 
    },
    googleClientId: GOOGLE_CLIENT_ID,
    onSyncSuccess: () => showAlert('alert_syncSuccess', 'success'),
    onSyncError: (e) => showAlert('alert_syncError', 'error')
  });


  // Load Data
  useEffect(() => {
    const load = async () => {
        let loadedData: Partial<AppData> | null = null;
        
        if (storageType === 'INDEXED_DB') {
            try {
                loadedData = await idbService.read();
            } catch (e) {
                console.error("Failed to load from IDB", e);
            }
        } 
        
        // Fallback or explicit LocalStorage
        if (!loadedData && (storageType === 'LOCAL_STORAGE' || !loadedData)) {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    // Try to decrypt; if fails, maybe it's legacy plaintext
                    loadedData = await decryptData(saved);
                } catch (e) {
                    console.error("Decryption failed, trying plain JSON", e);
                    try {
                        loadedData = JSON.parse(saved);
                    } catch(e2) {
                        console.error("Plain JSON parse failed", e2);
                    }
                }
            }
        }

        if (loadedData) {
            setExchangeRate(loadedData.exchangeRate || INITIAL_RATE);
            setAccounts(loadedData.accounts && loadedData.accounts.length > 0 ? loadedData.accounts : MOCK_ACCOUNTS);
            setTransactions(loadedData.transactions || []);
            setScheduledPayments(loadedData.scheduledPayments || []);
            setBudgets(loadedData.budgets || []);
            setGoals(loadedData.goals || []);
            setUserProfile(loadedData.userProfile || { name: 'User', language: 'en' });
            setIsFirstTime(false);
        } else {
            setIsFirstTime(true);
        }
        setIsLoaded(true);
    };
    load();
  }, [storageType]);

  // PIN Lock initialization
  useEffect(() => {
    if (isLoaded && autoLockEnabled) {
      setIsAppLocked(true);
    }
  }, [isLoaded, autoLockEnabled]);

  // PIN Lock on Resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoLockEnabled) {
        setIsAppLocked(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoLockEnabled]);

  const handleToggleAutoLock = (enabled: boolean) => {
    setAutoLockEnabled(enabled);
    localStorage.setItem("autoLockEnabled", JSON.stringify(enabled));
  };

  const handleUnlock = (digit: string) => {
    const currentStored = localStorage.getItem('parity_pin') || '0000';
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        if (newPin === currentStored) {
          setIsAppLocked(false);
          setPinInput("");
          setPinError(false);
        } else {
          setTimeout(() => {
            setPinError(true);
            setPinInput("");
          }, 200);
        }
      }
    }
  };

  // Save logic
  useEffect(() => {
    if (!isLoaded) return;
    
    const data: AppData = {
      exchangeRate,
      accounts,
      transactions,
      scheduledPayments,
      userProfile,
      budgets,
      goals
    };

    const save = async () => {
        if (storageType === 'INDEXED_DB') {
            await idbService.save(data);
        } else {
             const encrypted = await encryptData(data); // Encrypt localStorage payload
             localStorage.setItem(STORAGE_KEY, encrypted);
        }
    };
    
    save();
  }, [exchangeRate, accounts, transactions, scheduledPayments, userProfile, budgets, goals, isLoaded, storageType]);



  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleUpdateAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
  };

  const performDeleteTransaction = (id: string): Account[] | null => {
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

        return updatedAccounts;
      }
      return null;
  };

  const handleDeleteTransaction = (id: string, skipConfirm = false, skipStateUpdate = false): Account[] | null => {
    if (skipConfirm) {
        const updated = performDeleteTransaction(id);
        if (updated && !skipStateUpdate) {
            setAccounts(updated);
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
        return updated;
    }

    showConfirm({
        message: t('deleteTransactionConfirm'),
        onConfirm: () => {
            const updated = performDeleteTransaction(id);
            if (updated) {
                setAccounts(updated);
                setTransactions(prev => prev.filter(t => t.id !== id));
            }
        }
    });
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
      normalizedAmountUSD: normalizedUSD,
      updatedAt: new Date().toISOString()
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

    // If this transaction came from a scheduled payment, update or remove it
    if (data.scheduledId) {
        setScheduledPayments(prev => {
            const scheduled = prev.find(p => p.id === data.scheduledId);
            if (!scheduled) return prev;

            if (scheduled.frequency === 'One-Time') {
                return prev.filter(p => p.id !== data.scheduledId);
            }

            return prev.map(p => {
                if (p.id === data.scheduledId) {
                    const nextDate = new Date(p.date);
                    switch (p.frequency) {
                        case 'Weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                        case 'Bi-weekly': nextDate.setDate(nextDate.getDate() + 14); break;
                        case 'Monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                        case 'Yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
                    }
                    return { ...p, date: nextDate.toISOString().split('T')[0] };
                }
                return p;
            });
        });
    }
  };

  const handleImportData = async (data: any, skipConfirm = false) => {
    if (!data.userProfile) {
        showAlert('alert_importError', 'error');
        return;
    }

    const performImport = async () => {
        setExchangeRate(data.exchangeRate || exchangeRate);
        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
        setScheduledPayments(data.scheduledPayments || []);
        setBudgets(data.budgets || []);
        setGoals(data.goals || []);
        setUserProfile(data.userProfile);
        
        const newData: AppData = {
            exchangeRate: data.exchangeRate || exchangeRate,
            accounts: data.accounts || [],
            transactions: data.transactions || [],
            scheduledPayments: data.scheduledPayments || [],
            userProfile: data.userProfile,
            budgets: data.budgets || [],
            goals: data.goals || []
        };

        if (storageType === 'INDEXED_DB') {
            await idbService.save(newData);
        } else {
            const encrypted = await encryptData(newData);
            localStorage.setItem(STORAGE_KEY, encrypted);
        }
        
        setIsFirstTime(false);
        showAlert('alert_importSuccess', 'success');
        setCurrentView('DASHBOARD');
    };

    if (skipConfirm || isFirstTime) {
        await performImport();
    } else {
        showConfirm({
            message: t('importConfirm'),
            confirmText: t('confirm'),
            onConfirm: performImport
        });
    }
  };

  const handleStartFresh = () => {
    setUserProfile({ name: 'User', language: 'en' });
    setIsFirstTime(false);
  };

  const [isCloudOnboarding, setIsCloudOnboarding] = useState(false);
  useEffect(() => {
      if (isAuthenticated && isCloudOnboarding) {
          importFromCloud();
          setIsCloudOnboarding(false);
      }
  }, [isAuthenticated, isCloudOnboarding]);

  const handleOnboardingCloudSync = () => {
      setIsCloudOnboarding(true);
      if (!isAuthenticated) {
          handleLogin();
      }
  };

  if (!isLoaded) return null;

  if (isFirstTime) {
      return (
          <Onboarding 
            lang={userProfile.language}
            onStartFresh={handleStartFresh}
            onSyncFromCloud={handleOnboardingCloudSync}
            isSyncing={isSyncing}
            isDevMode={isDevMode}
          />
      );
  }

  if (isAppLocked) {
    return (
      <div className="h-screen w-full bg-black/95 flex items-center justify-center p-6 backdrop-blur-md z-[200]">
        <div className="w-full max-w-xs flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-theme-surface border border-white/10 flex items-center justify-center text-theme-brand shadow-2xl shadow-brand/20 mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-theme-primary text-center">
              {t("verifyIdentity")}
            </h2>
            <p className="text-theme-secondary text-sm text-center">
              {t("enterPin")}
            </p>
          </div>
          <div className="flex gap-4 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pinInput.length ? (pinError ? "bg-red-500 scale-110" : "bg-theme-brand scale-110") : "bg-white/10"}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6 w-full px-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleUnlock(num.toString())}
                className="w-full aspect-square rounded-full bg-theme-surface/30 hover:bg-theme-surface border border-white/5 text-2xl font-semibold text-theme-primary transition-all active:scale-95 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleUnlock("0")}
              className="w-full aspect-square rounded-full bg-theme-surface/30 hover:bg-theme-surface border border-white/5 text-2xl font-semibold text-theme-primary transition-all active:scale-95 flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={() => setPinInput((prev) => prev.slice(0, -1))}
              className="w-full aspect-square rounded-full flex items-center justify-center text-theme-secondary hover:text-white"
            >
              <div className="text-xs font-bold uppercase">{t("delete")}</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirmScheduledPayment = (p: ScheduledPayment) => {
      setEditingTransaction({
          id: '',
          amount: p.amount,
          originalCurrency: p.currency,
          exchangeRate: exchangeRate,
          normalizedAmountUSD: p.currency === Currency.USD ? p.amount : p.amount / exchangeRate,
          type: p.type || TransactionType.EXPENSE,
          category: p.category || (p.type === TransactionType.INCOME ? 'income' : CATEGORIES[0].id),
          accountId: accounts[0]?.id || '',
          note: p.name,
          date: new Date().toISOString(),
          scheduledId: p.id
      });
      setShowAdd(true);
  };

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
              isBalanceVisible={isBalanceVisible}
              setIsBalanceVisible={setIsBalanceVisible}
              isDevMode={isDevMode}
              onDevModeTrigger={handleDevModeTrigger}
            />
          )}
          {currentView === 'TRANSFER' && (
            <TransferView
              accounts={accounts}
              transactions={transactions}
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
              onConfirmPayment={handleConfirmScheduledPayment}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              exchangeRate={exchangeRate}
            />
          )}
          {currentView === 'BUDGET' && (
            <BudgetView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              lang={userProfile.language}
              budgets={budgets}
              goals={goals}
              onUpdateBudgets={setBudgets}
              onUpdateGoals={setGoals}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              exchangeRate={exchangeRate}
            />
          )}
          {currentView === 'ANALYSIS' && (
            <AnalysisView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              scheduledPayments={scheduledPayments}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              isBalanceVisible={isBalanceVisible}
              onToggleBottomNav={setIsNavVisible}
              onNavigate={setCurrentView}
            />
          )}
          {currentView === 'WALLET' && (
            <WalletView
              onBack={() => setCurrentView('DASHBOARD')}
              accounts={accounts}
              onUpdateAccounts={handleUpdateAccounts}
              lang={userProfile.language}
              transactions={transactions}
              exchangeRate={exchangeRate}
              scheduledPayments={scheduledPayments}
              isBalanceVisible={isBalanceVisible}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              onConfirmPayment={handleConfirmScheduledPayment}
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
              storageType={storageType}
              showAlert={showAlert}
              isSyncing={isSyncing}
              isAuthenticated={isAuthenticated}
              onLogin={handleLogin}
              onExport={exportToCloud}
              onImport={importFromCloud}
              isDevMode={isDevMode}
              onDevModeTrigger={handleDevModeTrigger}
            />
          )}
          {currentView === 'TRANSACTIONS' && (
            <TransactionsListView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              lang={userProfile.language}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => { setEditingTransaction(tx); setShowAdd(true); }}
              isBalanceVisible={isBalanceVisible}
            />
          )}
          {currentView === 'HEATMAP' && (
            <CalendarHeatmapView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
            />
          )}
          {currentView === 'CURRENCY_PERF' && (
            <CurrencyPerformanceView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
            />
          )}
        </div>

        {/* Bottom Nav (Only visible on Dashboard and Wallet/Profile root) */}
        {['DASHBOARD', 'WALLET', 'PROFILE', 'ANALYSIS', 'TRANSACTIONS', 'BUDGET', 'SCHEDULED', 'HEATMAP', 'CURRENCY_PERF'].includes(currentView) && isNavVisible && !showAdd && !showSettings && (
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
                    showAlert('alert_walletFirst', 'error');
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
              <ChartArea size={24} />
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
            showAlert={showAlert}
          />
        )}

        {showSettings && (
          <SettingsModal 
            currentRate={exchangeRate}
            onClose={() => setShowSettings(false)}
            onUpdateRate={setExchangeRate}
            lang={userProfile.language}
            currentStorageType={storageType}
            showAlert={showAlert}
            autoLockEnabled={autoLockEnabled}
            onToggleAutoLock={handleToggleAutoLock}
          />
        )}

        {/* Global Popup Alert */}
        {alertConfig && (
            <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-full duration-300">
                <div className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
                    alertConfig.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                    alertConfig.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                    'bg-theme-surface/80 border-white/10 text-theme-primary'
                }`}>
                    <span className="text-sm font-bold tracking-tight">{alertConfig.message}</span>
                </div>
            </div>
        )}

        {/* Global Confirmation Modal */}
        {confirmConfig && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                    <h3 className="text-lg font-black text-theme-primary mb-2">{t('areYouSure')}</h3>
                    <p className="text-sm text-theme-secondary mb-8 leading-relaxed">{confirmConfig.message}</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                confirmConfig.onCancel?.();
                                setConfirmConfig(null);
                            }}
                            className="flex-1 py-4 rounded-2xl bg-white/5 text-theme-secondary font-bold hover:bg-white/10 transition-colors"
                        >
                            {confirmConfig.cancelText || t('cancel')}
                        </button>
                        <button 
                            onClick={() => {
                                confirmConfig.onConfirm();
                                setConfirmConfig(null);
                            }}
                            className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                            {confirmConfig.confirmText || t('delete')}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}