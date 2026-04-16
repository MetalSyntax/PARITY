import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Wallet, Home, ChartArea, User, Lock, Calendar as CalendarIcon, PieChart, Receipt, Activity, TrendingUp, ChartCandlestick, CalendarRange, Calendar1, Fingerprint, ShoppingCart } from 'lucide-react';
import { Dashboard } from './views/Dashboard';
import { AddTransaction } from './views/AddTransaction';
import { SettingsModal } from './components/SettingsModal';
import { TransferView } from './views/TransferView';
import { BudgetView } from './views/BudgetView';
import { AnalysisView } from './views/AnalysisView';
import { FiscalReportView } from "./views/FiscalReportView";
import { WalletView } from './views/WalletView';
import { ProfileView } from './views/ProfileView';
import { Onboarding } from './views/Onboarding';
import { ScheduledPaymentView } from './views/ScheduledPaymentView';
import { TransactionsListView } from './views/TransactionsListView';
import { CalendarHeatmapView } from './views/CalendarHeatmapView';
import { CurrencyPerformanceView } from './views/CurrencyPerformanceView';
import { ScheduledNotificationsView } from './views/ScheduledNotificationsView';
import { ShoppingListView } from './views/ShoppingListView';
import { LegalBanner } from './components/LegalBanner';
import { PinModal } from './components/PinModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { getTranslation } from './i18n';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

import { INITIAL_RATE, INITIAL_USD_RATE_PARALLEL, INITIAL_EURO_RATE, INITIAL_EURO_RATE_PARALLEL, MOCK_ACCOUNTS, CATEGORIES } from './constants';
import { formatAmount } from './utils/formatUtils';
import { projectMonthEndSpending, calculateRunway, checkBudgetForecasts } from './utils/forecast';
import { Transaction, Account, Currency, TransactionType, ViewState, UserProfile, ScheduledPayment, Budget, Goal, ConfirmConfig, RateType, ShoppingItem, ShoppingList, EntityType } from './types';
import { idbService, StorageType, AppData } from './services/db';
import { encryptData, decryptData } from './services/crypto';
import { useGoogleDriveSync } from './hooks/useGoogleDriveSync';
import { syncService } from './services/sync';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const STORAGE_KEY = 'parity_data_v3';

/**
 * Main application component that wraps the application with necessary providers.
 * Initializes the ThemeProvider for dark/light mode support.
 * @returns {JSX.Element} The rendered application wrapped in a ThemeProvider.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

/**
 * Internal component containing the primary application state and layout logic.
 * Manages views, authentication, storage, transactions state, and offline PWA capabilities.
 * @returns {JSX.Element} The main layout of the application.
 */
function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [syncPendingCount, setSyncPendingCount] = useState(0);

  useEffect(() => {
    const handleSyncReset = async () => {
      const count = await syncService.getPendingCount();
      setSyncPendingCount(count);
    };
    handleSyncReset();

    const handleSyncReq = () => {
        // Queue processor logic
    };
    window.addEventListener('parity-sync-required', handleSyncReq);
    return () => window.removeEventListener('parity-sync-required', handleSyncReq);
  }, []);

  const pushToSyncQueue = async (type: EntityType, id: string, action: 'CREATE'|'UPDATE'|'DELETE', payload: any) => {
    await syncService.addToQueue(type, id, action, payload);
    const count = await syncService.getPendingCount();
    setSyncPendingCount(count);
  };
  
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
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("displayCurrency");
    return saved ? (saved as Currency) : Currency.USD;
  });
  const [navbarFavorites, setNavbarFavorites] = useState<ViewState[]>(() => {
    const saved = localStorage.getItem("navbarFavorites");
    return saved ? JSON.parse(saved) : ['WALLET', 'ANALYSIS', 'PROFILE'];
  });
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem("activeProfileId") || "";
  });

  const handleUpdateProfile = (p: UserProfile) => {
    setUserProfile(p);
    setProfiles(prev => prev.map(prof => prof.id === p.id ? p : prof));
  };

  const [hasFetchedRates, setHasFetchedRates] = useState(() => {
    return localStorage.getItem('last_bcv_update') !== null;
  });

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => a.profileId === activeProfileId || (!a.profileId && activeProfileId === 'default'));
  }, [accounts, activeProfileId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.profileId === activeProfileId || (!t.profileId && activeProfileId === 'default'));
  }, [transactions, activeProfileId]);

  const filteredScheduledPayments = useMemo(() => {
    return scheduledPayments.filter(p => p.profileId === activeProfileId || (!p.profileId && activeProfileId === 'default'));
  }, [scheduledPayments, activeProfileId]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => b.profileId === activeProfileId || (!b.profileId && activeProfileId === 'default'));
  }, [budgets, activeProfileId]);

  const filteredGoals = useMemo(() => {
    return goals.filter(g => g.profileId === activeProfileId || (!g.profileId && activeProfileId === 'default'));
  }, [goals, activeProfileId]);

  const filteredShoppingLists = useMemo(() => {
    return shoppingLists.filter(l => l.profileId === activeProfileId || (!l.profileId && activeProfileId === 'default'));
  }, [shoppingLists, activeProfileId]);

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
        exchangeRate, accounts, transactions, scheduledPayments, userProfile, budgets, goals, shoppingLists, syncQueue: [] // We don't backup the queue itself in the target file
    },
    setLocalData: (data: any) => {
        if (data.userProfile) handleImportData(data, true); 
    },
    googleClientId: GOOGLE_CLIENT_ID,
    onSyncSuccess: () => {
        syncService.markQueueAsSynced().then(() => {
            syncService.getPendingCount().then(c => setSyncPendingCount(c));
        });
        showAlert('alert_syncSuccess', 'success');
    },
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
            
            // Handle Multi-Profile initialization
            let currentProfiles = loadedData.profiles || [];
            let currentActiveId = loadedData.activeProfileId || localStorage.getItem("activeProfileId") || "";

            if (currentProfiles.length === 0) {
                // If no profiles, migrate the current userProfile into the profiles array
                const mainProfile: UserProfile = loadedData.userProfile || { id: 'default', name: 'User', language: 'en' };
                if (!mainProfile.id) mainProfile.id = 'default';
                currentProfiles = [mainProfile];
                currentActiveId = mainProfile.id;
            }

            setProfiles(currentProfiles);
            
            // Find the active profile to set the main userProfile state
            const active = currentProfiles.find(p => p.id === currentActiveId) || currentProfiles[0];
            setActiveProfileId(active.id);
            setUserProfile(active);
            localStorage.setItem("activeProfileId", active.id);

            if (loadedData.shoppingLists) {
                setShoppingLists(loadedData.shoppingLists);
                if (loadedData.shoppingLists.length > 0) {
                    setActiveListId(loadedData.shoppingLists[0].id);
                }
            } else if (loadedData.shoppingItems && loadedData.shoppingItems.length > 0) {
                const defaultList: ShoppingList = {
                    id: 'list_' + Date.now(),
                    name: 'My List',
                    items: loadedData.shoppingItems,
                    createdAt: new Date().toISOString()
                };
                setShoppingLists([defaultList]);
                setActiveListId(defaultList.id);
            }
            setShoppingItems(loadedData.shoppingItems || []);
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
             setHasFetchedRates(true);
             return true;
         } catch (e) {
             console.error("Fetch all rates failed", e);
             return false;
         }
    };

    const checkScheduledNotifications = () => {
        const currentProfile = userProfileRef.current;
        const currentPayments = scheduledPaymentsRef.current;
        const currentExchangeRate = exchangeRateRef.current;
        const currentEuroRate = euroRateRef.current;
        const currentBudgets = budgetsRef.current;
        const currentTransactions = transactionsRef.current;

        if (!currentProfile.notificationsEnabled) return;
        
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        // Smart Alerts: Check Budget Forecasts
        const overBudgetCategories = checkBudgetForecasts(currentTransactions, currentBudgets, now);
        
        overBudgetCategories.forEach(categoryId => {
            const budget = currentBudgets.find(b => b.categoryId === categoryId);
            if (!budget) return;
            const categoryObj = CATEGORIES.find(c => c.id === categoryId);
            const categoryName = categoryObj ? t(categoryObj.name as any) : (budget.customName || categoryId);
            
            const alertKey = `parity_budget_alert_${categoryId}_${todayStr}`;
            if (!localStorage.getItem(alertKey)) {
                // Fallback translations if i18n not yet updated
                const msgTmp = t('budgetAlertBody') === 'budgetAlertBody' ? `You are on track to exceed your budget for ${categoryName}.` : t('budgetAlertBody');
                const titleTmp = t('budgetAlertTitle') === 'budgetAlertTitle' ? 'Smart Alert: Budget Risk' : t('budgetAlertTitle');
                const msg = msgTmp.replace('{category}', categoryName as string);
                
                showAlert(msg, 'error');
                
                if (Notification.permission === 'granted') {
                    new Notification(titleTmp as string, {
                        body: msg,
                        icon: '/icon-192x192.png',
                        badge: '/icon-192x192.png'
                    });
                }
                localStorage.setItem(alertKey, 'true');
            }
        });

        if (!currentPayments.length) return;
        
        const leadDays = currentProfile.notificationLeadTime || 0;
        let updated = false;
        const newPayments = [...currentPayments];
        
        currentPayments.forEach((p, idx) => {
            if (p.notificationsEnabled === false) return;
            if (p.lastNotified === todayStr) return;
            
            const dueDate = new Date(p.date.split('T')[0] + 'T12:00:00');
            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays <= leadDays) {
                const amountStr = formatAmount(p.amount, currentExchangeRate, Currency.USD, true, 2, currentEuroRate);
                const msg = t('notificationBody')
                    .replace('{name}', p.name)
                    .replace('{amount}', amountStr)
                    .replace('{date}', dueDate.toLocaleDateString());
                
                showAlert(msg, 'info');

                if (Notification.permission === 'granted') {
                    new Notification(t('notificationTitle'), {
                        body: msg,
                        icon: '/icon-192x192.png',
                        badge: '/icon-192x192.png'
                    });
                }
                
                newPayments[idx] = { ...p, lastNotified: todayStr };
                updated = true;
            }
        });

        if (updated) {
            setScheduledPayments(newPayments);
        }
    };

    const scheduledPaymentsRef = useRef(scheduledPayments);
    const userProfileRef = useRef(userProfile);
    const exchangeRateRef = useRef(exchangeRate);
    const euroRateRef = useRef(euroRate);
    const budgetsRef = useRef(budgets);
    const transactionsRef = useRef(transactions);
    const accountsRef = useRef(accounts);
    const usdRateParallelRef = useRef(usdRateParallel);
    const euroRateParallelRef = useRef(euroRateParallel);
    const activeProfileIdRef = useRef(activeProfileId);

    useEffect(() => {
        scheduledPaymentsRef.current = scheduledPayments;
        userProfileRef.current = userProfile;
        exchangeRateRef.current = exchangeRate;
        euroRateRef.current = euroRate;
        budgetsRef.current = budgets;
        transactionsRef.current = transactions;
        accountsRef.current = accounts;
        usdRateParallelRef.current = usdRateParallel;
        euroRateParallelRef.current = euroRateParallel;
        activeProfileIdRef.current = activeProfileId;
    }, [scheduledPayments, userProfile, exchangeRate, euroRate, budgets, transactions, accounts, usdRateParallel, euroRateParallel, activeProfileId]);

    useEffect(() => {
        if (!isLoaded) return;
        fetchAllRates();
        checkScheduledNotifications();
        checkAutoPost();
    }, [isLoaded]);

    const checkAutoPost = () => {
        const currentPayments = scheduledPaymentsRef.current;
        const currentExchangeRate = exchangeRateRef.current;
        const currentEuroRate = euroRateRef.current;
        const currentRateType = userProfileRef.current.rateType;
        const currentUsdRateParallel = usdRateParallelRef.current;
        const currentEuroRateParallel = euroRateParallelRef.current;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        let paymentsUpdated = false;
        let accountsUpdated = false;
        const newPayments = [...currentPayments];
        const addedTransactions: Transaction[] = [];
        let runningAccounts = [...accountsRef.current];

        currentPayments.forEach((p, idx) => {
            if (!p.autoPost || !p.accountId) return;
            
            const dueDate = new Date(p.date.split('T')[0] + 'T00:00:00');
            if (dueDate <= now) {
                // Determine rate
                const rate = currentRateType === 'PARALLEL' ? (currentUsdRateParallel || currentExchangeRate) : currentExchangeRate;
                const eRate = currentRateType === 'PARALLEL' ? (currentEuroRateParallel || currentEuroRate) : currentEuroRate;

                // Create transaction
                const normalizedUSD = (p.currency === Currency.USD || p.currency === Currency.USDT) 
                  ? p.amount 
                  : p.currency === Currency.EUR 
                  ? (p.amount * eRate) / rate 
                  : p.amount / rate;

                const newTx: Transaction = {
                    id: 'recurring_' + Math.random().toString(36).substr(2, 9),
                    amount: p.amount,
                    originalCurrency: p.currency,
                    exchangeRate: rate,
                    euroRate: eRate,
                    normalizedAmountUSD: normalizedUSD,
                    type: p.type || TransactionType.EXPENSE,
                    category: p.category || 'OTHER',
                    accountId: p.accountId!,
                    note: `${p.name} (Auto)`,
                    date: p.date, 
                    updatedAt: new Date().toISOString(),
                    scheduledId: p.id,
                    isAutoPosted: true,
                    profileId: p.profileId || activeProfileIdRef.current
                };

                addedTransactions.push(newTx);

                // Update Account Balance
                runningAccounts = runningAccounts.map(acc => {
                   if (acc.id === p.accountId) {
                      let delta = p.amount;
                      if (acc.currency !== p.currency) {
                         if (acc.currency === Currency.USD) delta = normalizedUSD;
                         else if (acc.currency === Currency.VES) {
                            if (p.currency === Currency.USD) delta = p.amount * rate;
                            else if (p.currency === Currency.EUR) delta = p.amount * eRate;
                         } else if (acc.currency === Currency.EUR) {
                            if (p.currency === Currency.USD) delta = p.amount * (rate / eRate);
                            else if (p.currency === Currency.VES) delta = p.amount / eRate;
                         }
                      }
                      const modifier = p.type === TransactionType.INCOME ? 1 : -1;
                      return { ...acc , balance: acc.balance + (delta * modifier) };
                   }
                   return acc;
                });

                // Advance the scheduled payment
                if (p.frequency === 'One-Time') {
                    newPayments[idx] = { ...p, autoPost: false }; // Disable future auto-posts for one-time
                } else {
                    const nextDate = new Date(p.date);
                    switch (p.frequency) {
                        case 'Weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                        case 'Bi-weekly': nextDate.setDate(nextDate.getDate() + 14); break;
                        case 'Monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                        case 'Yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
                    }
                    newPayments[idx] = { ...p, date: nextDate.toISOString().split('T')[0] };
                }
                paymentsUpdated = true;
                accountsUpdated = true;
            }
        });

        if (addedTransactions.length > 0) {
            setTransactions(prev => [...addedTransactions, ...prev]);
            addedTransactions.forEach(tx => pushToSyncQueue('TRANSACTION', tx.id, 'CREATE', tx));
            showAlert('transactionsAutoPosted', 'success');
        }
        if (paymentsUpdated) {
            setScheduledPayments(newPayments);
            pushToSyncQueue('SCHEDULED_PAYMENT', 'batch', 'UPDATE', newPayments);
        }
        if (accountsUpdated) {
            setAccounts(runningAccounts);
            pushToSyncQueue('ACCOUNT', 'batch', 'UPDATE', runningAccounts);
        }
    };


  // PIN Lock initialization
  useEffect(() => {
    if (isLoaded && autoLockEnabled) {
      setIsAppLocked(true);
    }
  }, [isLoaded, autoLockEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setBackgroundTime(Date.now());
      } else if (document.visibilityState === 'visible') {
        fetchAllRates();
        checkScheduledNotifications();
        
        if (autoLockEnabled) {
          if (backgroundTime !== null) {
            const elapsed = (Date.now() - backgroundTime) / 1000;
            if (elapsed >= autoLockDelay) {
              setIsAppLocked(true);
            }
          } else {
            setIsAppLocked(true);
          }
        }
        setBackgroundTime(null);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', fetchAllRates);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', fetchAllRates);
    };
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
      rateHistory,
      shoppingItems,
      shoppingLists,
      profiles,
      activeProfileId,
      syncQueue: [] // syncQueue is managed separately by syncService
    };

    const save = async () => {
        try {
            if (storageType === 'INDEXED_DB') {
                await idbService.save(data);
            } else {
                const encrypted = await encryptData(data);
                localStorage.setItem(STORAGE_KEY, encrypted);
            }
        } catch (e) {
            console.error('[PARITY] Failed to persist data:', e);
        }
    };
    
    save();
  }, [exchangeRate, usdRateParallel, euroRate, euroRateParallel, accounts, transactions, scheduledPayments, userProfile, budgets, goals, rateHistory, shoppingItems, shoppingLists, isLoaded, storageType, profiles, activeProfileId]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("navbarFavorites", JSON.stringify(navbarFavorites));
  }, [navbarFavorites, isLoaded]);

  // --- Notification Logic ---
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  useEffect(() => {
    if (isLoaded && userProfile.notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [isLoaded, userProfile.notificationsEnabled]);


  useEffect(() => {
    if (!isLoaded) return;
    
    // Check every hour
    const interval = setInterval(checkScheduledNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoaded, scheduledPayments, userProfile.notificationsEnabled, userProfile.notificationLeadTime]);




  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [shoppingItemToConvert, setShoppingItemToConvert] = useState<ShoppingItem | null>(null);

  const handleUpdateAccounts = (newActiveAccounts: Account[]) => {
    setAccounts(prev => [
        ...prev.filter(a => a.profileId !== activeProfileId && (a.profileId || activeProfileId !== 'default')),
        ...newActiveAccounts.map(a => ({ ...a, profileId: a.profileId || activeProfileId }))
    ]);
  };

  const handleUpdateBudgets = (newActiveBudgets: Budget[]) => {
    setBudgets(prev => [
        ...prev.filter(b => b.profileId !== activeProfileId && (b.profileId || activeProfileId !== 'default')),
        ...newActiveBudgets.map(b => ({ ...b, profileId: b.profileId || activeProfileId }))
    ]);
  };

  const handleUpdateGoals = (newActiveGoals: Goal[]) => {
    setGoals(prev => [
        ...prev.filter(g => g.profileId !== activeProfileId && (g.profileId || activeProfileId !== 'default')),
        ...newActiveGoals.map(g => ({ ...g, profileId: g.profileId || activeProfileId }))
    ]);
  };

  const handleUpdateShoppingLists = (newActiveLists: ShoppingList[]) => {
    setShoppingLists(prev => [
        ...prev.filter(l => l.profileId !== activeProfileId && (l.profileId || activeProfileId !== 'default')),
        ...newActiveLists.map(l => ({ ...l, profileId: l.profileId || activeProfileId }))
    ]);
  };

  const handleUpdateScheduledPayments = (newActivePayments: ScheduledPayment[]) => {
    setScheduledPayments(prev => [
        ...prev.filter(p => p.profileId !== activeProfileId && (p.profileId || activeProfileId !== 'default')),
        ...newActivePayments.map(p => ({ ...p, profileId: p.profileId || activeProfileId }))
    ]);
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
            pushToSyncQueue('TRANSACTION', id, 'DELETE', null);
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
                pushToSyncQueue('TRANSACTION', id, 'DELETE', null);
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

    const totalAmountForStats = data.type === TransactionType.EXPENSE || data.type === TransactionType.TRANSFER 
      ? (data.amount + (data.fee || 0)) 
      : data.amount;

    const normalizedUSD = (data.originalCurrency === Currency.USD || data.originalCurrency === Currency.USDT)
      ? totalAmountForStats
      : data.originalCurrency === Currency.EUR
      ? (totalAmountForStats * (data.euroRate || currentEuroRate)) / (data.exchangeRate || currentUSDRes)
      : totalAmountForStats / (data.exchangeRate || currentUSDRes);

    const newTransaction: Transaction = {
      ...data,
      id: data.id || Math.random().toString(36).substr(2, 9),
      normalizedAmountUSD: normalizedUSD,
      updatedAt: new Date().toISOString(),
      profileId: data.profileId || activeProfileId
    };

    // Compute final transactions list
    const finalTransactions: Transaction[] = data.id
      ? [newTransaction, ...transactions.filter(t => t.id !== data.id)]
      : [newTransaction, ...transactions];

    // Compute final accounts list
    const isUSDType = (c: Currency) => c === Currency.USD || c === Currency.USDT;
    const txRate = data.exchangeRate || currentUSDRes;
    const txEuroRate = data.euroRate || currentEuroRate;

    const finalAccounts = currentAccounts.map(acc => {
      if (data.skipBalanceUpdate) return acc;

      if (acc.id === data.accountId) {
        let deduction = data.amount;
        if (data.type === TransactionType.EXPENSE && (data.fee || 0) > 0) {
            deduction += data.fee;
        }

        if (acc.currency !== data.originalCurrency) {
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
        let addition = data.amount - (data.fee || 0);

        if (data.originalCurrency !== acc.currency) {
          if (acc.currency === Currency.VES) {
             if (isUSDType(data.originalCurrency)) addition = (data.amount - (data.fee || 0)) * txRate;
             else if (data.originalCurrency === Currency.EUR) addition = (data.amount - (data.fee || 0)) * txEuroRate;
          } else if (acc.currency === Currency.EUR) {
             if (isUSDType(data.originalCurrency)) addition = (data.amount - (data.fee || 0)) * (txRate / txEuroRate);
             else if (data.originalCurrency === Currency.VES) addition = (data.amount - (data.fee || 0)) / txEuroRate;
          } else if (isUSDType(acc.currency)) {
             if (data.originalCurrency === Currency.VES) addition = (data.amount - (data.fee || 0)) / txRate;
             else if (data.originalCurrency === Currency.EUR) addition = (data.amount - (data.fee || 0)) * (txEuroRate / txRate);
          }
        }

        return { ...acc, balance: acc.balance + addition };
      }

      return acc;
    });

    // --- Immediate persistence: save to IDB synchronously with computed values ---
    // This guarantees data is written even if the user refreshes immediately.
    idbService.save({
      exchangeRate,
      usdRateParallel,
      euroRate,
      euroRateParallel,
      accounts: finalAccounts,
      transactions: finalTransactions,
      scheduledPayments,
      userProfile,
      budgets,
      goals,
      rateHistory,
      shoppingItems,
      shoppingLists,
      profiles,
      activeProfileId,
      syncQueue: []
    }).catch(e => console.error('[PARITY] Immediate save failed:', e));

    // Update React state (also triggers the useEffect save as a backup)
    setTransactions(finalTransactions);
    setAccounts(finalAccounts);

    pushToSyncQueue('TRANSACTION', newTransaction.id, data.id ? 'UPDATE' : 'CREATE', newTransaction);

    setShowAdd(false);
    if (shoppingItemToConvert) {
        setShoppingItems(prev => prev.map(item => 
          item.id === shoppingItemToConvert.id ? { ...item, completed: true } : item
        ));
    }
    setEditingTransaction(null);
    setShoppingItemToConvert(null);

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
        setShoppingItems(data.shoppingItems || []);
        setUserProfile(data.userProfile);
        
        const newData: AppData = {
            exchangeRate: data.exchangeRate || exchangeRate,
            accounts: data.accounts || [],
            transactions: data.transactions || [],
            scheduledPayments: data.scheduledPayments || [],
            userProfile: data.userProfile,
            budgets: data.budgets || [],
            goals: data.goals || [],
            shoppingItems: data.shoppingItems || []
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
              accounts={filteredAccounts}
              transactions={filteredTransactions}
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
              onUpdateTransaction={(tx) => setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t))}
              hasFetchedRates={hasFetchedRates}
              onUpdateProfile={handleUpdateProfile}
              syncPendingCount={syncPendingCount}
              isSyncing={isSyncing}
              onSync={exportToCloud}
              goals={goals}
            />
          )}
          {currentView === 'TRANSFER' && (
            <TransferView
              accounts={filteredAccounts}
              transactions={filteredTransactions}
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
              scheduledPayments={filteredScheduledPayments}
              onUpdateScheduledPayments={setScheduledPayments}
              onConfirmPayment={handleConfirmScheduledPayment}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              exchangeRate={exchangeRate}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              isBalanceVisible={isBalanceVisible}
              accounts={filteredAccounts}
            />
          )}


          {currentView === 'FISCAL_REPORT' && (
            <FiscalReportView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={filteredTransactions}
              accounts={filteredAccounts}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
              displayCurrency={displayCurrency}
              isBalanceVisible={isBalanceVisible}
            />
          )}
          {currentView === 'WALLET' && (
            <WalletView
              onBack={() => setCurrentView('DASHBOARD')}
              accounts={filteredAccounts}
              onUpdateAccounts={handleUpdateAccounts}
              lang={userProfile.language}
              transactions={filteredTransactions}
              exchangeRate={exchangeRate}
              scheduledPayments={filteredScheduledPayments}
              isBalanceVisible={isBalanceVisible}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              onConfirmPayment={handleConfirmScheduledPayment}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              initialTab="WALLETS"
            />
          )}
          {currentView === 'PROFILE' && (
            <ProfileView
              onBack={() => setCurrentView('DASHBOARD')}
              profile={userProfile}
              onUpdateProfile={(p) => {
                  setUserProfile(p);
                  setProfiles(prev => prev.map(prof => prof.id === p.id ? p : prof));
              }}
              transactions={filteredTransactions}
              accounts={filteredAccounts}
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
              onNavigate={(v) => setCurrentView(v)}
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSwitchProfile={(id) => {
                  const active = profiles.find(p => p.id === id);
                  if (active) {
                      setActiveProfileId(id);
                      setUserProfile(active);
                      localStorage.setItem("activeProfileId", id);
                      showAlert('profileSwitched', 'success');
                  }
              }}
              onCreateProfile={(name) => {
                  const newProfile: UserProfile = {
                      id: 'prof_' + Date.now(),
                      name,
                      language: userProfile.language,
                      updatedAt: new Date().toISOString()
                  };
                  setProfiles(prev => [...prev, newProfile]);
                  showAlert('profileCreated', 'success');
              }}
              onDeleteProfile={(id) => {
                  if (id === activeProfileId) return;
                  setProfiles(prev => prev.filter(p => p.id !== id));
                  showAlert('profileDeleted', 'success');
              }}
            />
          )}
          {currentView === 'BUDGET' && (
            <BudgetView 
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={filteredTransactions}
              lang={userProfile.language}
              budgets={filteredBudgets}
              goals={filteredGoals}
              accounts={filteredAccounts}
              onUpdateBudgets={handleUpdateBudgets}
              onUpdateGoals={handleUpdateGoals}
              onUpdateAccounts={handleUpdateAccounts}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              exchangeRate={exchangeRate}
              euroRate={euroRate}
              isBalanceVisible={isBalanceVisible}
              onSaveTransaction={handleSaveTransaction}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              initialTab="ENVELOPES"
            />
          )}
          {currentView === 'GOALS' && (
            <BudgetView 
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={filteredTransactions}
              lang={userProfile.language}
              budgets={filteredBudgets}
              goals={filteredGoals}
              accounts={filteredAccounts}
              onUpdateBudgets={handleUpdateBudgets}
              onUpdateGoals={handleUpdateGoals}
              onUpdateAccounts={handleUpdateAccounts}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              exchangeRate={exchangeRate}
              euroRate={euroRate}
              isBalanceVisible={isBalanceVisible}
              onSaveTransaction={handleSaveTransaction}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              initialTab="GOALS"
            />
          )}
          {currentView === 'ANALYSIS' && (
            <AnalysisView 
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={filteredTransactions}
              lang={userProfile.language}
              scheduledPayments={filteredScheduledPayments}
              exchangeRate={exchangeRate}
              euroRate={euroRate}
              isBalanceVisible={isBalanceVisible}
              onToggleBottomNav={setIsNavVisible}
              onNavigate={setCurrentView}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              initialViewMode="OVERVIEW"
              showConfirm={showConfirm}
            />
          )}
          {currentView === 'INCOME' && (
            <WalletView 
              onBack={() => setCurrentView('DASHBOARD')}
              accounts={filteredAccounts}
              onUpdateAccounts={handleUpdateAccounts}
              lang={userProfile.language}
              transactions={filteredTransactions}
              exchangeRate={exchangeRate}
              scheduledPayments={filteredScheduledPayments}
              isBalanceVisible={isBalanceVisible}
              onToggleBottomNav={setIsNavVisible}
              showConfirm={showConfirm}
              onConfirmPayment={handleConfirmScheduledPayment}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              initialTab="INCOME"
            />
          )}
          {(currentView === 'TRANSACTIONS' || currentView === 'INVOICES') && (
            <TransactionsListView
              key={currentView}
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={transactions}
              accounts={accounts}
              lang={userProfile.language}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => { setEditingTransaction(tx); setShowAdd(true); }}
              isBalanceVisible={isBalanceVisible}
              displayCurrency={displayCurrency}
              onToggleDisplayCurrency={toggleDisplayCurrency}
              onUpdateTransaction={(tx) => setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t))}
              initialViewMode={currentView === 'INVOICES' ? 'INVOICES' : 'LIST'}
              showConfirm={showConfirm}
            />
          )}
          {currentView === 'HEATMAP' && (
            <CalendarHeatmapView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={filteredTransactions}
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
              transactions={filteredTransactions}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              isBalanceVisible={isBalanceVisible}
              rateHistory={rateHistory}
               euroRate={euroRate}
              euroRateParallel={euroRateParallel}
              usdRateParallel={usdRateParallel}
              isDevMode={isDevMode}
            />
          )}
          {currentView === 'SCHEDULED_NOTIFICATIONS' && (
            <ScheduledNotificationsView
              onBack={() => setCurrentView('PROFILE')}
              lang={userProfile.language}
              scheduledPayments={filteredScheduledPayments}
              onUpdateScheduledPayments={handleUpdateScheduledPayments}
              notificationsEnabled={userProfile.notificationsEnabled || false}
              onToggleGlobalNotifications={(enabled) => {
                  handleUpdateProfile({ ...userProfile, notificationsEnabled: enabled });
              }}
            />
          )}
          {currentView === 'SHOPPING_LIST' && (
            <ShoppingListView
              onBack={() => setCurrentView('DASHBOARD')}
              lists={filteredShoppingLists}
              activeListId={activeListId}
              onUpdateLists={handleUpdateShoppingLists}
              onSetActiveListId={setActiveListId}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              displayCurrency={displayCurrency}
              euroRate={euroRate}
              onConvertToExpense={(item) => {
                setShoppingItemToConvert(item);
                setShowAdd(true);
              }}
              onShowConfirm={showConfirm}
            />
          )}
        </motion.div>

        {/* Bottom Nav (Only visible on Dashboard and Wallet/Profile root) */}
        {['DASHBOARD', 'WALLET', 'PROFILE', 'ANALYSIS', 'TRANSACTIONS', 'BUDGET', 'SCHEDULED', 'HEATMAP', 'CURRENCY_PERF', 'SHOPPING_LIST'].includes(currentView) && isNavVisible && !showAdd && !showSettings && (
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
                  {view === 'SHOPPING_LIST' && <ShoppingCart size={24} />}
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
                  {view === 'SHOPPING_LIST' && <ShoppingCart size={24} />}
                </button>
            ))}
          </div>
        )}

        {/* Modals */}
        {showAdd && (
          <AddTransaction
            onClose={() => { 
                setShowAdd(false); 
                setEditingTransaction(null); 
                setShoppingItemToConvert(null);
            }}
            onSave={handleSaveTransaction}
            exchangeRate={userProfile.rateType === 'PARALLEL' ? (usdRateParallel || exchangeRate) : exchangeRate}
            euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
            accounts={accounts}
            lang={userProfile.language}
            transactions={transactions}
            budgets={budgets}
            initialData={editingTransaction || (shoppingItemToConvert ? {
                id: '', 
                amount: shoppingItemToConvert.price || 0,
                originalCurrency: shoppingItemToConvert.currency || Currency.USD,
                exchangeRate: exchangeRate,
                euroRate: euroRate,
                normalizedAmountUSD: shoppingItemToConvert.currency === Currency.VES ? (shoppingItemToConvert.price || 0) / exchangeRate : shoppingItemToConvert.currency === Currency.EUR ? (shoppingItemToConvert.price || 0) * ((euroRate || exchangeRate) / exchangeRate) : (shoppingItemToConvert.price || 0),
                type: TransactionType.EXPENSE,
                category: shoppingItemToConvert.categoryId || CATEGORIES[1].id,
                accountId: accounts[0]?.id || '',
                note: shoppingItemToConvert.name,
                date: new Date().toISOString()
            } as Transaction : null)}
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
            hasFetchedRates={hasFetchedRates}
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

        {/* PIN Lock Overlay */}
        {isAppLocked && (
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
        )}

        <LegalBanner lang={userProfile.language} />
      </div>
    </div>
  );
}