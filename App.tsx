import React, { useState, useEffect } from 'react';
import { Plus, Wallet, Home, ChartArea, User, Lock, Calendar as CalendarIcon, PieChart, Receipt, Activity, TrendingUp, ChartCandlestick, CalendarRange, Calendar1, Fingerprint } from 'lucide-react';
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
import { LegalBanner } from './components/LegalBanner';
import { PinModal } from './components/PinModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { getTranslation } from './i18n';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

import { INITIAL_RATE, INITIAL_USD_RATE_PARALLEL, INITIAL_EURO_RATE, INITIAL_EURO_RATE_PARALLEL, MOCK_ACCOUNTS, CATEGORIES } from './constants';
import { Transaction, Account, Currency, TransactionType, ViewState, UserProfile, ScheduledPayment, Budget, Goal, ConfirmConfig, RateType } from './types';
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
  
  // PWA Registration with Prompt
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // Check for updates every hour
      r && setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [isBalanceVisible, setIsBalanceVisible] = useState(() => {
    const saved = localStorage.getItem("isBalanceVisible");
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Storage Preference
  const [storageType] = useState<StorageType>('INDEXED_DB');

  // Application State
  const [exchangeRate, setExchangeRate] = useState(INITIAL_RATE);
  const [usdRateParallel, setUsdRateParallel] = useState(INITIAL_USD_RATE_PARALLEL);
  const [euroRate, setEuroRate] = useState(INITIAL_EURO_RATE);
  const [euroRateParallel, setEuroRateParallel] = useState(INITIAL_EURO_RATE_PARALLEL);
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rateHistory, setRateHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', language: 'en' });
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("displayCurrency");
    return saved ? (saved as Currency) : Currency.USD;
  });
  const [navbarFavorites, setNavbarFavorites] = useState<ViewState[]>(() => {
    const saved = localStorage.getItem("navbarFavorites");
    return saved ? JSON.parse(saved) : ['WALLET', 'ANALYSIS', 'PROFILE'];
  });

  const toggleDisplayCurrency = () => {
    const rotation = [Currency.USD, Currency.VES, Currency.EUR];
    const currentIndex = rotation.indexOf(displayCurrency);
    const nextIndex = (currentIndex + 1) % rotation.length;
    const next = rotation[nextIndex];
    setDisplayCurrency(next);
    localStorage.setItem("displayCurrency", next);
  };

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
  const [autoLockDelay, setAutoLockDelay] = useState(() => {
    const saved = localStorage.getItem("autoLockDelay");
    return saved !== null ? JSON.parse(saved) : 0;
  });
  const [biometricsEnabled, setBiometricsEnabled] = useState(() => {
    const saved = localStorage.getItem("biometricsEnabled");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
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

  const { handleLogin, exportToCloud, importFromCloud, listCloudBackups, isSyncing, isAuthenticated } = useGoogleDriveSync({
    fileName: `parity_backup_${new Date().toISOString().split('T')[0]}.json`,
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
    onSyncError: (e) => showAlert('alert_syncError', 'error'),
    onLoginError: (msg) => {
        setAlertConfig({ message: msg, type: 'error' });
        setTimeout(() => setAlertConfig(null), 3000);
    }
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
            setUsdRateParallel(loadedData.usdRateParallel || INITIAL_USD_RATE_PARALLEL);
            setEuroRate(loadedData.euroRate || INITIAL_EURO_RATE);
            setEuroRateParallel(loadedData.euroRateParallel || INITIAL_EURO_RATE_PARALLEL);
            setAccounts(loadedData.accounts && loadedData.accounts.length > 0 ? loadedData.accounts : MOCK_ACCOUNTS);
            setTransactions(loadedData.transactions || []);
            setScheduledPayments(loadedData.scheduledPayments || []);
            setBudgets(loadedData.budgets || []);
            setGoals(loadedData.goals || []);
            setRateHistory(loadedData.rateHistory || []);
            setUserProfile(loadedData.userProfile || { name: 'User', language: 'en' });
            setIsFirstTime(false);
        } else {
            setIsFirstTime(true);
        }
        setIsLoaded(true);
    };
    load();
  }, [storageType]);

    const fetchAllRates = async () => {
         try {
             const [usdRes, eurRes] = await Promise.all([
                fetch('https://ve.dolarapi.com/v1/dolares'),
                fetch('https://ve.dolarapi.com/v1/euros')
             ]);

             if (usdRes.ok) {
                 const data = await usdRes.json();
                 if (Array.isArray(data)) {
                    const official = data.find(r => r.fuente === 'oficial');
                    const parallel = data.find(r => r.fuente === 'paralelo');
                    let newRate = exchangeRate;
                    if (official) {
                        newRate = Number(official.promedio);
                        setExchangeRate(newRate);
                        localStorage.setItem('last_bcv_update', Date.now().toString());
                    }
                    if (parallel) {
                        setUsdRateParallel(Number(parallel.promedio));
                    }

                    if (official) {
                        setRateHistory(prev => {
                            const today = new Date().toISOString().split('T')[0];
                            const history = [...prev];
                            const existingIdx = history.findIndex(h => h.date === today && h.currency === Currency.USD);
                            if (existingIdx >= 0) {
                                history[existingIdx].rate = newRate;
                            } else {
                                history.push({ date: today, rate: newRate, currency: Currency.USD });
                            }
                            return history.sort((a,b) => a.date.localeCompare(b.date)).slice(-60);
                        });
                    }
                 }
             }

             if (eurRes.ok) {
                const data = await eurRes.json();
                if (Array.isArray(data)) {
                    const official = data.find(r => r.fuente === 'oficial');
                    const parallel = data.find(r => r.fuente === 'paralelo');
                    if (official) setEuroRate(Number(official.promedio));
                    if (parallel) setEuroRateParallel(Number(parallel.promedio));

                    if (official) {
                        setRateHistory(prev => {
                            const today = new Date().toISOString().split('T')[0];
                            const history = [...prev];
                            const existingIdx = history.findIndex(h => h.date === today && h.currency === Currency.EUR);
                            if (existingIdx >= 0) {
                                history[existingIdx].rate = Number(official.promedio);
                            } else {
                                history.push({ date: today, rate: Number(official.promedio), currency: Currency.EUR });
                            }
                            return history.sort((a,b) => a.date.localeCompare(b.date)).slice(-60);
                        });
                    }
                }
             }
             return true;
         } catch (e) {
             console.error("Fetch all rates failed", e);
             return false;
         }
    };

    useEffect(() => {
        if (!isLoaded) return;
        
        const lastUpdate = localStorage.getItem('last_bcv_update');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!lastUpdate || (now - parseInt(lastUpdate)) > oneDay) {
            fetchAllRates();
        }
        
        (window as any).refreshAppRates = fetchAllRates;
    }, [isLoaded]);


  // PIN Lock initialization
  useEffect(() => {
    if (isLoaded && autoLockEnabled) {
      setIsAppLocked(true);
    }
  }, [isLoaded, autoLockEnabled]);

  // PIN Lock on Resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setBackgroundTime(Date.now());
      } else if (document.visibilityState === 'visible' && autoLockEnabled) {
        if (backgroundTime !== null) {
          const elapsed = (Date.now() - backgroundTime) / 1000;
          if (elapsed >= autoLockDelay) {
            setIsAppLocked(true);
          }
        } else {
           // Fallback for first time or if backgroundTime was lost
           setIsAppLocked(true);
        }
        setBackgroundTime(null);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoLockEnabled, autoLockDelay, backgroundTime]);

  const handleSetAutoLockDelay = (delay: number) => {
    setAutoLockDelay(delay);
    localStorage.setItem("autoLockDelay", JSON.stringify(delay));
  };

  const handleToggleAutoLock = (enabled: boolean) => {
    setAutoLockEnabled(enabled);
    localStorage.setItem("autoLockEnabled", JSON.stringify(enabled));
  };

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (enabled) {
      try {
        if (window.PublicKeyCredential) {
          const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (!isAvailable) {
            showAlert('biometricsNotSupported', 'error');
            return;
          }

          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);

          const options: any = {
            publicKey: {
              challenge,
              rp: { name: "Parity", id: window.location.hostname },
              user: {
                id: userId,
                name: userProfile.name || "User",
                displayName: userProfile.name || "User"
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
              authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                residentKey: 'required'
              },
              timeout: 60000
            }
          };

          const credential: any = await navigator.credentials.create(options);
          if (credential) {
            const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            localStorage.setItem("biometric_cred_id", credId);
            setBiometricsEnabled(true);
            localStorage.setItem("biometricsEnabled", JSON.stringify(true));
          }
        }
      } catch (e) {
        console.error("Failed to register biometrics", e);
      }
    } else {
      setBiometricsEnabled(false);
      localStorage.setItem("biometricsEnabled", JSON.stringify(false));
      localStorage.removeItem("biometric_cred_id");
    }
  };

  const verifyBiometrics = async (): Promise<boolean> => {
    if (!biometricsEnabled) return false;
    
    const credIdStr = localStorage.getItem("biometric_cred_id");
    
    try {
        if (window.PublicKeyCredential) {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const options: any = {
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: 'required',
                    allowCredentials: []
                }
            };

            if (credIdStr) {
                const credId = Uint8Array.from(atob(credIdStr), c => c.charCodeAt(0));
                options.publicKey.allowCredentials = [{
                    id: credId,
                    type: 'public-key'
                }];
            }
            
            await navigator.credentials.get(options);
            return true;
        }
    } catch (e) {
        console.error("Biometric authentication failed", e);
    }
    return false;
  };


  const handleUpdateRateType = (type: RateType) => {
    setUserProfile(prev => ({ ...prev, rateType: type }));
    showAlert(type === 'OFFICIAL' ? 'Tasas Oficiales (BCV) activadas' : 'Tasas Paralelas (Binance) activadas', 'success');
  };

  // Save logic
  useEffect(() => {
    if (!isLoaded) return;
    
    const data: AppData = {
      exchangeRate,
      usdRateParallel,
      euroRate,
      euroRateParallel,
      accounts,
      transactions,
      scheduledPayments,
      userProfile,
      budgets,
      goals,
      rateHistory
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
  }, [exchangeRate, usdRateParallel, euroRate, euroRateParallel, accounts, transactions, scheduledPayments, userProfile, budgets, goals, rateHistory, isLoaded, storageType]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("navbarFavorites", JSON.stringify(navbarFavorites));
  }, [navbarFavorites, isLoaded]);



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
            if (tx.type === TransactionType.TRANSFER && (tx.fee || 0) > 0) {
               amount += tx.fee;
            }

            if (acc.currency !== tx.originalCurrency) {
              const isUSDType = (c: Currency) => c === Currency.USD || c === Currency.USDT;
              
              if (isUSDType(acc.currency) && tx.originalCurrency === Currency.VES) {
                amount = tx.amount / tx.exchangeRate;
              } else if (acc.currency === Currency.VES && isUSDType(tx.originalCurrency)) {
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

    const currentEuroRate = userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate;
    const currentUSDRes = userProfile.rateType === 'PARALLEL' ? (usdRateParallel || exchangeRate) : exchangeRate;

    const normalizedUSD = (data.originalCurrency === Currency.USD || data.originalCurrency === Currency.USDT)
      ? data.amount
      : data.originalCurrency === Currency.EUR
      ? (data.amount * (data.euroRate || currentEuroRate)) / (data.exchangeRate || currentUSDRes)
      : data.amount / (data.exchangeRate || currentUSDRes);

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
        if (data.type === TransactionType.TRANSFER && (data.fee || 0) > 0) {
            deduction += data.fee;
        }

        if (acc.currency !== data.originalCurrency) {
          const isUSDType = (c: Currency) => c === Currency.USD || c === Currency.USDT;
          const txRate = data.exchangeRate || currentUSDRes;
          const txEuroRate = data.euroRate || currentEuroRate;

          if (isUSDType(acc.currency)) {
            if (data.originalCurrency === Currency.VES) deduction = deduction / txRate;
            else if (data.originalCurrency === Currency.EUR) deduction = deduction * (txEuroRate / txRate);
          } else if (acc.currency === Currency.VES) {
            if (isUSDType(data.originalCurrency)) deduction = deduction * txRate;
            else if (data.originalCurrency === Currency.EUR) deduction = deduction * txEuroRate;
          } else if (acc.currency === Currency.EUR) {
            if (isUSDType(data.originalCurrency)) deduction = deduction * (txRate / txEuroRate);
            else if (data.originalCurrency === Currency.VES) deduction = deduction / txEuroRate;
          }
        }
        const modifier = data.type === TransactionType.INCOME ? 1 : -1;
        return { ...acc, balance: acc.balance + (deduction * modifier) };
      }

      if (data.type === TransactionType.TRANSFER && data.toAccountId && acc.id === data.toAccountId) {
        let addition = data.amount;

        if (data.originalCurrency !== acc.currency) {
          const isUSDType = (c: Currency) => c === Currency.USD || c === Currency.USDT;
          const txRate = data.exchangeRate || currentUSDRes;
          const txEuroRate = data.euroRate || currentEuroRate;

          if (isUSDType(acc.currency)) {
             if (data.originalCurrency === Currency.VES) addition = data.amount / txRate;
             else if (data.originalCurrency === Currency.EUR) addition = data.amount * (txEuroRate / txRate);
          } else if (acc.currency === Currency.VES) {
             if (isUSDType(data.originalCurrency)) addition = data.amount * txRate;
             else if (data.originalCurrency === Currency.EUR) addition = data.amount * txEuroRate;
          } else if (acc.currency === Currency.EUR) {
             if (isUSDType(data.originalCurrency)) addition = data.amount * (txRate / txEuroRate);
             else if (data.originalCurrency === Currency.VES) addition = data.amount / txEuroRate;
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

  // --- Mobile Gesture & History Navigation ---
  useEffect(() => {
    if (!isLoaded) return;

    const handlePopState = (e: PopStateEvent) => {
      if (showAdd) {
        setShowAdd(false);
        setEditingTransaction(null);
        window.history.pushState(null, '');
      } else if (showSettings) {
        setShowSettings(false);
        window.history.pushState(null, '');
      } else if (currentView !== 'DASHBOARD') {
        setCurrentView('DASHBOARD');
        window.history.pushState(null, '');
      }
    };

    // Initialize history if needed
    if (window.history.state === null) {
      window.history.replaceState({ root: true }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoaded, currentView, showAdd, showSettings]);

  // Re-push state when moving away from dashboard to enable 'back'
  useEffect(() => {
    if (!isLoaded) return;
    if (currentView !== 'DASHBOARD' || showAdd || showSettings) {
      // Small delay to avoid accidental double push
      const timer = setTimeout(() => {
        if (window.history.state?.view !== currentView) {
          window.history.pushState({ view: currentView }, '');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentView, showAdd, showSettings, isLoaded]);

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
      <PinModal 
        lang={userProfile.language}
        onSuccess={() => {
            setIsAppLocked(false);
            setPinInput("");
            setPinError(false);
        }}
        biometricsEnabled={biometricsEnabled}
        onVerifyBiometrics={verifyBiometrics}
      />
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
        <motion.div 
          className="flex-1 relative z-0 overflow-y-auto flex flex-col mb-0"
          onPanEnd={(_, info) => {
            // Swipe right from left edge (approx)
            if (info.offset.x > 80 && Math.abs(info.offset.y) < 50) {
              if (showAdd) {
                setShowAdd(false);
                setEditingTransaction(null);
              } else if (showSettings) {
                setShowSettings(false);
              } else if (currentView !== 'DASHBOARD') {
                setCurrentView('DASHBOARD');
              }
            }
          }}
        >
          {currentView === 'DASHBOARD' && (
            <Dashboard
              accounts={accounts}
              transactions={transactions}
              exchangeRate={userProfile.rateType === 'PARALLEL' ? (usdRateParallel || exchangeRate) : exchangeRate}
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
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              needUpdate={needRefresh}
              updateServiceWorker={updateServiceWorker}
              onCheckUpdate={() => {
                // Manually trigger a check via the service worker registration
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then(registration => {
                    registration.update().then(() => {
                      showAlert('Buscando actualizaciones...', 'info');
                    });
                  });
                }
              }}
              biometricsEnabled={biometricsEnabled}
              onVerifyBiometrics={verifyBiometrics}
              euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
              euroRateParallel={euroRateParallel}
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
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
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
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              isBalanceVisible={isBalanceVisible}
            />
          )}
          {currentView === 'BUDGET' && (
            <BudgetView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              lang={userProfile.language}
              budgets={budgets}
              goals={goals}
              accounts={accounts}
              onUpdateBudgets={setBudgets}
              onUpdateGoals={setGoals}
              onUpdateAccounts={setAccounts}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              exchangeRate={exchangeRate}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              isBalanceVisible={isBalanceVisible}
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
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
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
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
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
              navbarFavorites={navbarFavorites}
              onUpdateNavbarFavorites={setNavbarFavorites}
              listCloudBackups={listCloudBackups}
            />
          )}
          {currentView === 'TRANSACTIONS' && (
            <TransactionsListView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              accounts={accounts}
              lang={userProfile.language}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => { setEditingTransaction(tx); setShowAdd(true); }}
              isBalanceVisible={isBalanceVisible}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
            />
          )}
          {currentView === 'HEATMAP' && (
            <CalendarHeatmapView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              isBalanceVisible={isBalanceVisible}
            />
          )}
          {currentView === 'CURRENCY_PERF' && (
            <CurrencyPerformanceView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              isBalanceVisible={isBalanceVisible}
              rateHistory={rateHistory}
              euroRate={euroRate}
              euroRateParallel={euroRateParallel}
            />
          )}
        </motion.div>

        {/* Bottom Nav (Only visible on Dashboard and Wallet/Profile root) */}
        {['DASHBOARD', 'WALLET', 'PROFILE', 'ANALYSIS', 'TRANSACTIONS', 'BUDGET', 'SCHEDULED', 'HEATMAP', 'CURRENCY_PERF'].includes(currentView) && isNavVisible && !showAdd && !showSettings && (
          <div className="h-20 bg-theme-surface/95 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-4 md:gap-24 px-2 relative z-10 pb-2 flex-shrink-0 w-full transition-all duration-300 animate-in slide-in-from-bottom-full">
            <button
              onClick={() => setCurrentView('DASHBOARD')}
              className={`p-3 transition-colors ${currentView === 'DASHBOARD' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              <Home size={24} />
            </button>
            {/* Dynamic favorites - First half */}
            {navbarFavorites.slice(0, 1).map(view => (
               <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`p-3 transition-colors ${currentView === view ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}`}
                >
                  {view === 'WALLET' && <Wallet size={24} />}
                  {view === 'ANALYSIS' && <ChartArea size={24} />}
                  {view === 'PROFILE' && <User size={24} />}
                  {view === 'BUDGET' && <PieChart size={24} />}
                  {view === 'SCHEDULED' && <Calendar1 size={24} />}
                  {view === 'TRANSACTIONS' && <Receipt size={24} />}
                  {view === 'HEATMAP' && <CalendarRange size={24} />}
                  {view === 'CURRENCY_PERF' && <ChartCandlestick size={24} />}
                </button>
            ))}

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

            {/* Dynamic favorites - Second half */}
            {navbarFavorites.slice(1).map(view => (
               <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`p-3 transition-colors ${currentView === view ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}`}
                >
                  {view === 'WALLET' && <Wallet size={24} />}
                  {view === 'ANALYSIS' && <ChartArea size={24} />}
                  {view === 'PROFILE' && <User size={24} />}
                  {view === 'BUDGET' && <PieChart size={24} />}
                  {view === 'SCHEDULED' && <CalendarIcon size={24} />}
                  {view === 'TRANSACTIONS' && <Receipt size={24} />}
                  {view === 'HEATMAP' && <Activity size={24} />}
                  {view === 'CURRENCY_PERF' && <TrendingUp size={24} />}
                </button>
            ))}
          </div>
        )}

        {/* Modals */}
        {showAdd && (
          <AddTransaction
            onClose={() => { setShowAdd(false); setEditingTransaction(null); }}
            onSave={handleSaveTransaction}
            exchangeRate={userProfile.rateType === 'PARALLEL' ? (usdRateParallel || exchangeRate) : exchangeRate}
            euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
            accounts={accounts}
            lang={userProfile.language}
            initialData={editingTransaction}
            showAlert={showAlert}
          />
        )}

        {showSettings && (
          <SettingsModal 
            currentRate={exchangeRate}
            usdRateParallel={usdRateParallel}
            euroRate={euroRate}
            euroRateParallel={euroRateParallel}
            rateType={userProfile.rateType || 'OFFICIAL'}
            onUpdateRateType={handleUpdateRateType}
            onClose={() => setShowSettings(false)}
            onUpdateRate={setExchangeRate}
            lang={userProfile.language}
            currentStorageType={storageType}
            showAlert={showAlert}
            autoLockEnabled={autoLockEnabled}
            onToggleAutoLock={handleToggleAutoLock}
            autoLockDelay={autoLockDelay}
            onSetAutoLockDelay={handleSetAutoLockDelay}
            biometricsEnabled={biometricsEnabled}
            onToggleBiometrics={handleToggleBiometrics}
            isDevMode={isDevMode}
            onRefreshRates={fetchAllRates}

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

        {/* PWA Update / Offline Toast */}
        {(needRefresh || offlineReady) && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-full duration-500 w-[90%] max-w-sm">
                <div className="bg-theme-surface/90 backdrop-blur-2xl border border-theme-soft/30 p-4 rounded-[2rem] shadow-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-theme-brand/20 flex items-center justify-center text-theme-brand">
                             <Plus className={`w-6 h-6 ${needRefresh ? 'rotate-45' : ''}`} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-theme-primary">
                                {needRefresh ? t('updateAvailable') || 'Nueva versión disponible' : t('appOfflineReady') || 'App lista para usar offline'}
                            </h4>
                            <p className="text-xs text-theme-secondary">
                                {needRefresh ? t('updateDesc') || 'Actualiza para disfrutar de las últimas mejoras.' : t('offlineDesc') || 'Puedes seguir usando Parity sin conexión.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setNeedRefresh(false); setOfflineReady(false); }}
                            className="flex-1 py-3 rounded-xl bg-white/5 text-theme-secondary text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                            {t('close') || 'Cerrar'}
                        </button>
                        {needRefresh && (
                            <button 
                                onClick={() => updateServiceWorker(true)}
                                className="flex-[2] py-3 rounded-xl bg-theme-brand text-white text-xs font-bold shadow-lg shadow-theme-brand/30 hover:brightness-110 active:scale-95 transition-all"
                            >
                                {t('updateNow') || 'Actualizar Ahora'}
                            </button>
                        )}
                    </div>
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

        <LegalBanner lang={userProfile.language} />
      </div>
    </div>
  );
}