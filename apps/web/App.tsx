import React, { Suspense, lazy, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExchangeRates } from './hooks/useExchangeRates';
import { Plus, Wallet, Home, ChartArea, User, Lock, Calendar as CalendarIcon, PieChart, Receipt, Activity, TrendingUp, ChartCandlestick, CalendarRange, Calendar1, Fingerprint, ShoppingCart, Target, FileText, Users, Scale, CalendarDays, FlaskConical, GraduationCap, WifiOff } from 'lucide-react';
import { Dashboard } from './views/Dashboard';
import { LegalBanner } from './components/LegalBanner';
import { PinModal } from './components/PinModal';
import { TutorialSystem } from './components/TutorialSystem';

// Lazy-loaded: only Dashboard (the default view) and the always-on-screen shell components
// above are in the initial bundle. Every other view is its own chunk, fetched the moment the
// user actually navigates there — this is what makes the PWA's first paint fast regardless of
// how many features/views the app has grown to.
const AddTransaction = lazy(() => import('./views/AddTransaction').then(m => ({ default: m.AddTransaction })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const TransferView = lazy(() => import('./views/TransferView').then(m => ({ default: m.TransferView })));
const BudgetView = lazy(() => import('./views/BudgetView').then(m => ({ default: m.BudgetView })));
const AnalysisView = lazy(() => import('./views/AnalysisView').then(m => ({ default: m.AnalysisView })));
const FiscalReportView = lazy(() => import('./views/FiscalReportView').then(m => ({ default: m.FiscalReportView })));
const WalletView = lazy(() => import('./views/WalletView').then(m => ({ default: m.WalletView })));
const ProfileView = lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));
const Onboarding = lazy(() => import('./views/Onboarding').then(m => ({ default: m.Onboarding })));
const ScheduledPaymentView = lazy(() => import('./views/ScheduledPaymentView').then(m => ({ default: m.ScheduledPaymentView })));
const TransactionsListView = lazy(() => import('./views/TransactionsListView').then(m => ({ default: m.TransactionsListView })));
const CalendarHeatmapView = lazy(() => import('./views/CalendarHeatmapView').then(m => ({ default: m.CalendarHeatmapView })));
const CurrencyPerformanceView = lazy(() => import('./views/CurrencyPerformanceView').then(m => ({ default: m.CurrencyPerformanceView })));
const InvoiceDigitizeView = lazy(() => import('./views/settings/InvoiceDigitizeView').then(m => ({ default: m.InvoiceDigitizeView })));
const ScheduledNotificationsView = lazy(() => import('./views/ScheduledNotificationsView').then(m => ({ default: m.ScheduledNotificationsView })));
const ShoppingListView = lazy(() => import('./views/ShoppingListView').then(m => ({ default: m.ShoppingListView })));
const PeopleView = lazy(() => import('./views/PeopleView').then(m => ({ default: m.PeopleView })));
const DataPortabilityView = lazy(() => import('./views/DataPortabilityView').then(m => ({ default: m.DataPortabilityView })));
const FinancialCalendarView = lazy(() => import('./views/FinancialCalendarView').then(m => ({ default: m.FinancialCalendarView })));
const ScenarioPlannerView = lazy(() => import('./views/ScenarioPlannerView').then(m => ({ default: m.ScenarioPlannerView })));
const AcademyView = lazy(() => import('./views/AcademyView').then(m => ({ default: m.AcademyView })));
import { useGamification } from './hooks/useGamification';
import { XPToastContainer } from './components/gamification/XPToast';
import { LevelUpModal } from './components/gamification/LevelUpModal';
import { BadgeEarnedSheet } from './components/gamification/BadgeEarnedSheet';
import { ThemeProvider } from './contexts/ThemeContext';
import type { BadgeDefinition, LevelId, GamificationProfile, DailyGoalTier } from '@parity/core';
import { createDefaultProfile, toISODate, CHALLENGE_TEMPLATES, offsetDate } from '@parity/core';
import { getTranslation } from '@parity/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

import { INITIAL_RATE, INITIAL_USD_RATE_PARALLEL, INITIAL_EURO_RATE, INITIAL_EURO_RATE_PARALLEL, MOCK_ACCOUNTS, CATEGORIES } from './constants';
import { formatAmount } from '@parity/core';
import { projectMonthEndSpending, calculateRunway, checkBudgetForecasts } from '@parity/core';
import { Transaction, Account, Currency, TransactionType, ViewState, UserProfile, ScheduledPayment, Budget, Goal, ConfirmConfig, RateType, ShoppingItem, ShoppingList, EntityType, Contact, Debt, convertCurrency } from '@parity/core';
import { idbService, StorageType, AppData } from '@parity/core';
import { buildMinimalSyncPayload } from '@parity/core';
import type { TransactionTombstone } from '@parity/core';
import { encryptData, decryptData, setWebCryptoSecrets } from '@parity/core';
import { useGoogleDriveSync } from './hooks/useGoogleDriveSync';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { syncService } from '@parity/core';

// Bootstrap web crypto secrets from Vite env vars before any encrypt/decrypt call.
// import.meta.env is Vite-only — must not appear in packages/core.
setWebCryptoSecrets(
  import.meta.env.VITE_APP_ENCRYPTION_SECRET ?? 'fallback_secret',
  import.meta.env.VITE_APP_ENCRYPTION_SALT   ?? 'fallback_salt',
);

const queryClient = new QueryClient();

// Shown for the brief moment a lazy-loaded view's chunk is still being fetched.
const ViewLoadingFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center py-24">
    <div className="w-8 h-8 border-2 border-theme-brand/30 border-t-theme-brand rounded-full animate-spin" />
  </div>
);

// In the native wrapper, __PARITY_MOBILE_CONFIG__ is injected before this module runs.
// Falls back to the Vite env var for web/Vercel deployments.
const GOOGLE_CLIENT_ID =
  (window as any).__PARITY_MOBILE_CONFIG__?.googleClientId ||
  import.meta.env.VITE_GOOGLE_CLIENT_ID;

const STORAGE_KEY = 'parity_data_v3';
const MINIMAL_BACKUP_PREFIX = 'parity_sync_';
const LAST_CLOUD_SYNC_KEY = 'parity_last_cloud_sync_at';
const OFFLINE_READY_AT_KEY = 'parity_offline_ready_at';
// Ids of deleted transactions (+ when), so the minimal sync can propagate deletions and a minimal
// restore doesn't resurrect them. Only opaque ids/timestamps, so it lives with the UI prefs.
const TX_TOMBSTONES_KEY = 'parity_tx_tombstones';
const TOMBSTONE_TTL_MS = 180 * 86_400_000;

const readTombstones = (): TransactionTombstone[] => {
  try {
    return JSON.parse(localStorage.getItem(TX_TOMBSTONES_KEY) || '[]');
  } catch {
    return [];
  }
};

const recordTombstone = (id: string) => {
  const cutoff = new Date(Date.now() - TOMBSTONE_TTL_MS).toISOString();
  const kept = readTombstones().filter(d => d.id !== id && d.deletedAt > cutoff);
  try {
    localStorage.setItem(TX_TOMBSTONES_KEY, JSON.stringify([...kept, { id, deletedAt: new Date().toISOString() }]));
  } catch (e) {
    console.error('[PARITY] Failed to record deletion', e);
  }
};

// Any local change to a transaction must bump updatedAt, or the minimal sync never uploads it.
const touch = <T extends object>(tx: T): T => ({ ...tx, updatedAt: new Date().toISOString() });

/**
 * Main application component that wraps the application with necessary providers.
 * Initializes the ThemeProvider for dark/light mode support.
 * @returns {JSX.Element} The rendered application wrapped in a ThemeProvider.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
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
  const [showTutorials, setShowTutorials] = useState(false);

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
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      swRegistrationRef.current = r || null;
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("displayCurrency");
    return saved ? (saved as Currency) : Currency.USD;
  });
  const [navbarFavorites, setNavbarFavorites] = useState<ViewState[]>(() => {
    const saved = localStorage.getItem("navbarFavorites");
    if (saved) {
      const parsed = JSON.parse(saved) as ViewState[];
      if (!parsed.includes('DASHBOARD')) {
        return ['DASHBOARD', ...parsed].slice(0, 4);
      }
      return parsed;
    }
    return ['DASHBOARD', 'WALLET', 'ANALYSIS', 'PROFILE'];
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

  // react-query powered rate fetching — placed after isLoaded declaration to avoid TDZ
  const { data: ratesData, refetch: fetchAllRates } = useExchangeRates(isLoaded);

  // Gamification engine
  const { profile: gamProfile, dispatchEvent: dispatchGamEvent, pendingRewards, clearRewards, buyShopItem, equipOutfit, rerollChallenge, updateDailyGoal } = useGamification();
  const [xpToasts, setXpToasts] = useState<{ xpGained: number; label: string }[]>([]);
  const [levelUpLevel, setLevelUpLevel] = useState<LevelId | null>(null);
  const [badgesToShow, setBadgesToShow] = useState<BadgeDefinition[]>([]);

  useEffect(() => {
    if (pendingRewards.length === 0) return;
    const latest = pendingRewards[pendingRewards.length - 1];
    if (latest.xpGained > 0) {
      setXpToasts(prev => [...prev, { xpGained: latest.xpGained, label: 'XP' }]);
    }
    if (latest.leveledUp && latest.newLevel) {
      setLevelUpLevel(latest.newLevel);
    }
    if (latest.newBadges.length > 0) {
      setBadgesToShow(prev => [...prev, ...latest.newBadges]);
    }
    clearRewards();
  }, [pendingRewards, clearRewards]);
  useEffect(() => {
    if (!ratesData) return;
    if (ratesData.exchangeRate !== null) setExchangeRate(ratesData.exchangeRate);
    if (ratesData.usdRateParallel !== null) setUsdRateParallel(ratesData.usdRateParallel);
    if (ratesData.euroRate !== null) setEuroRate(ratesData.euroRate);
    if (ratesData.euroRateParallel !== null) setEuroRateParallel(ratesData.euroRateParallel);
    if (ratesData.rateEntries.length > 0) {
      setRateHistory(prev => {
        const history = [...prev];
        for (const entry of ratesData.rateEntries) {
          const idx = history.findIndex(h => h.date === entry.date && h.currency === entry.currency);
          if (idx >= 0) history[idx].rate = entry.rate;
          else history.push(entry);
        }
        return history.sort((a, b) => a.date.localeCompare(b.date)).slice(-60);
      });
    }
    setHasFetchedRates(true);
  }, [ratesData]);

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

  // Offline/online status — everything data-related already works offline (local-first
  // IndexedDB), this just surfaces that fact to the user instead of leaving them guessing
  // whether a sudden disconnect broke something.
  const { isOnline, reconnectedAt } = useOnlineStatus();
  useEffect(() => {
    if (reconnectedAt !== null) showAlert('alert_connectionRestored', 'success');
    // Only reconnect events (not every showAlert identity change) should trigger this toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnectedAt]);

  // "Download for 100% offline" (ProfileView Danger-Zone-adjacent card). Local-first storage
  // already means transactions/budgets/etc. survive a dropped connection with zero extra work;
  // what this button adds is: (1) make sure the service worker has the latest app shell fully
  // precached rather than a stale/partial one, and (2) refresh + persist exchange rates one
  // more time right before the user expects to go offline, with an explicit confirmation.
  const [isPreparingOffline, setIsPreparingOffline] = useState(false);
  const [offlineReadySince, setOfflineReadySince] = useState<string | null>(
    () => localStorage.getItem(OFFLINE_READY_AT_KEY)
  );

  const handlePrepareOffline = useCallback(async () => {
    setIsPreparingOffline(true);
    try {
      if (needRefresh) {
        // A newer app shell is already precached — switch to it now so what's "ready for
        // offline" is the latest version, not the one currently running. This reloads the page.
        await updateServiceWorker(true);
        return;
      }
      await swRegistrationRef.current?.update();
      await fetchAllRates();
      const readyAt = new Date().toISOString();
      localStorage.setItem(OFFLINE_READY_AT_KEY, readyAt);
      setOfflineReadySince(readyAt);
      showAlert('alert_offlineDownloadSuccess', 'success');
    } catch (err) {
      console.error('Prepare offline failed', err);
      showAlert('alert_offlineDownloadError', 'error');
    } finally {
      setIsPreparingOffline(false);
    }
  }, [needRefresh, updateServiceWorker, fetchAllRates, showAlert]);

  const sendPushNotification = async (title: string, body: string, tag: string) => {
      if (!('Notification' in window)) return;
      let permission = Notification.permission;
      if (permission === 'default') {
          permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') return;
      try {
          if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              await reg.showNotification(title, { body, tag, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png', renotify: true });
          } else {
              new Notification(title, { body, tag, icon: '/pwa-192x192.png' });
          }
      } catch {
          new Notification(title, { body, tag });
      }
  };

  const showConfirm = (config: ConfirmConfig) => {
      setConfirmConfig(config);
  };

  const {
    handleLogin, exportToCloud, importFromCloud, listCloudBackups,
    uploadJson, listFilesByPrefix, fetchFileContent, deleteFile,
    isSyncing, isAuthenticated
  } = useGoogleDriveSync({
    fileName: `parity_backup_${new Date().toISOString().split('T')[0]}.json`,
    localData: {
        userId: userProfile.name, // Extra metadata
        lastBackup: new Date().toISOString(),
        exchangeRate, accounts, transactions, scheduledPayments, userProfile, budgets, goals, shoppingItems, shoppingLists, syncQueue: [] // We don't backup the queue itself in the target file
    },
    setLocalData: (data: any) => {
        if (data.userProfile) handleImportData(data, true);
    },
    googleClientId: GOOGLE_CLIENT_ID,
    onSyncSuccess: () => {
        syncService.markQueueAsSynced().then(() => {
            syncService.getPendingCount().then(c => setSyncPendingCount(c));
        });
        setLastCloudSyncAt(new Date().toISOString());
        showAlert('alert_syncSuccess', 'success');
    },
    onSyncError: (e) => showAlert('alert_syncError', 'error'),
    onLoginError: (msg) => {
        setAlertConfig({ message: msg, type: 'error' });
        setTimeout(() => setAlertConfig(null), 3000);
    }
  });

  // Watermark used by the minimal ("sync") backup to know what changed since the last
  // successful cloud operation (full or minimal alike). UI preference, not encrypted —
  // same tier as displayCurrency/isBalanceVisible/etc.
  const [lastCloudSyncAt, setLastCloudSyncAtState] = useState<string | null>(() =>
    localStorage.getItem(LAST_CLOUD_SYNC_KEY)
  );
  const setLastCloudSyncAt = useCallback((iso: string) => {
    localStorage.setItem(LAST_CLOUD_SYNC_KEY, iso);
    setLastCloudSyncAtState(iso);
  }, []);

  // 1. MINIMAL BACKUP — uploads only transactions changed since lastCloudSyncAt, plus a full
  // snapshot of the smaller entity collections (accounts, budgets, goals, scheduledPayments,
  // shoppingLists) so a restore-mínimo on another device stays internally consistent.
  //
  // buildMinimalSyncPayload strips `receipt` (a full-resolution base64 photo, often 1-5MB
  // apiece) from every transaction — that field alone was what ballooned this "minimal" file
  // into the megabytes. Receipt images still travel via the full backup.
  // `silent` is used by the automatic sync below: no toasts, the queue/watermark still update.
  const handleMinimalBackup = useCallback(async (silent?: boolean) => {
    if (!isAuthenticated) return;
    const startedAt = Date.now();
    const syncedAt = new Date(startedAt).toISOString();
    const day = syncedAt.split('T')[0];
    // The file is one-per-day and overwritten on each sync, so it must hold every change since
    // the start of that day — not just since the previous sync — or same-day syncs erase each other.
    const dayStart = `${day}T00:00:00.000Z`;
    const since = lastCloudSyncAt ? (lastCloudSyncAt < dayStart ? lastCloudSyncAt : dayStart) : null;
    const payload = buildMinimalSyncPayload({
      since, syncedAt, transactions, accounts, scheduledPayments, budgets, goals, shoppingLists, userProfile,
      deletedTransactions: readTombstones(),
    });
    const fileName = `${MINIMAL_BACKUP_PREFIX}${day}.json`;
    try {
      await uploadJson(fileName, payload);
      setLastCloudSyncAt(syncedAt);
      await syncService.markQueueAsSynced(startedAt);
      setSyncPendingCount(await syncService.getPendingCount());
      if (silent !== true) showAlert('alert_syncSuccess', 'success');
    } catch (err) {
      console.error('Minimal backup failed', err);
      if (silent !== true) showAlert('alert_syncError', 'error');
    }
  }, [isAuthenticated, lastCloudSyncAt, transactions, accounts, scheduledPayments, budgets, goals, shoppingLists, userProfile, uploadJson, showAlert]);

  // Applies (sign=1) or reverts (sign=-1) a single transaction's balance effect on `accountsList`.
  // Mirrors the currency-conversion math in handleSaveTransaction so merged transactions during a
  // minimal restore land on the same balances as if they'd been entered locally.
  const applyTransactionDelta = useCallback((accountsList: Account[], tx: Transaction, sign: 1 | -1): Account[] => {
    const isUSDType = (c: Currency) => c === Currency.USD || c === Currency.USDT;
    const txRate = tx.exchangeRate;
    const txEuroRate = tx.euroRate || tx.exchangeRate;

    return accountsList.map(acc => {
      if (tx.skipBalanceUpdate) return acc;

      if (acc.id === tx.accountId) {
        let deduction = tx.amount;
        if ((tx.type === TransactionType.EXPENSE || tx.type === TransactionType.TRANSFER) && (tx.fee || 0) > 0) {
          deduction += tx.fee!;
        }
        if (acc.currency !== tx.originalCurrency) {
          if (isUSDType(acc.currency)) {
            if (tx.originalCurrency === Currency.VES) deduction = deduction / txRate;
            else if (tx.originalCurrency === Currency.EUR) deduction = deduction * (txEuroRate / txRate);
          } else if (acc.currency === Currency.VES) {
            if (isUSDType(tx.originalCurrency)) deduction = deduction * txRate;
            else if (tx.originalCurrency === Currency.EUR) deduction = deduction * txEuroRate;
          } else if (acc.currency === Currency.EUR) {
            if (isUSDType(tx.originalCurrency)) deduction = deduction * (txRate / txEuroRate);
            else if (tx.originalCurrency === Currency.VES) deduction = deduction / txEuroRate;
          }
        }
        const modifier = tx.type === TransactionType.INCOME ? 1 : -1;
        return { ...acc, balance: acc.balance + (deduction * modifier * sign) };
      }

      if (tx.type === TransactionType.TRANSFER && tx.toAccountId && acc.id === tx.toAccountId) {
        let addition = tx.amount;
        if (tx.originalCurrency !== acc.currency) {
          if (acc.currency === Currency.VES) {
            if (isUSDType(tx.originalCurrency)) addition = tx.amount * txRate;
            else if (tx.originalCurrency === Currency.EUR) addition = tx.amount * txEuroRate;
          } else if (acc.currency === Currency.EUR) {
            if (isUSDType(tx.originalCurrency)) addition = tx.amount * (txRate / txEuroRate);
            else if (tx.originalCurrency === Currency.VES) addition = tx.amount / txEuroRate;
          } else if (isUSDType(acc.currency)) {
            if (tx.originalCurrency === Currency.VES) addition = tx.amount / txRate;
            else if (tx.originalCurrency === Currency.EUR) addition = tx.amount * (txEuroRate / txRate);
          }
        }
        return { ...acc, balance: acc.balance + (addition * sign) };
      }

      return acc;
    });
  }, []);

  // Generic "add new / newest-updatedAt-wins" merge for the small entity collections. Never used
  // for accounts (balance needs the transaction-aware merge above) or transactions (handled inline
  // in handleMinimalRestore so it can also patch account balances as it goes).
  const mergeByIdNewestWins = useCallback(<T extends { id: string; updatedAt?: string; createdAt?: string }>(
    local: T[], incoming: T[]
  ): T[] => {
    let result = [...local];
    incoming.forEach(item => {
      const idx = result.findIndex(r => r.id === item.id);
      if (idx === -1) {
        result = [...result, item];
      } else {
        const localTime = result[idx].updatedAt || result[idx].createdAt || '';
        const incomingTime = item.updatedAt || item.createdAt || '';
        if (incomingTime > localTime) {
          result = result.map((r, i) => (i === idx ? item : r));
        }
      }
    });
    return result;
  }, []);

  // 2. MINIMAL RESTORE — additive merge, never a full replace. New records are added; records that
  // exist on both sides keep whichever version has the newer updatedAt.
  const handleMinimalRestore = useCallback(async (fileId: string) => {
    try {
      const data = await fetchFileContent(fileId);
      if (!data) throw new Error('Empty minimal backup');

      let mergedAccounts = [...accounts];
      let mergedTransactions = [...transactions];
      const localDeletedAt = new Map(readTombstones().map(d => [d.id, d.deletedAt]));

      // Deletions made on the other device: drop the local copy unless it was edited afterwards.
      (data.deletedTransactions || []).forEach((del: TransactionTombstone) => {
        const localTx = mergedTransactions.find(t => t.id === del.id);
        if (localTx && (localTx.updatedAt || '') <= del.deletedAt) {
          mergedAccounts = applyTransactionDelta(mergedAccounts, localTx, -1);
          mergedTransactions = mergedTransactions.filter(t => t.id !== del.id);
          recordTombstone(del.id);
        }
      });

      (data.transactions || []).forEach((incomingTx: Transaction) => {
        // Deleted here after the backup's version was written: don't bring it back.
        const deletedAt = localDeletedAt.get(incomingTx.id);
        if (deletedAt && deletedAt >= (incomingTx.updatedAt || '')) return;
        const idx = mergedTransactions.findIndex(t => t.id === incomingTx.id);
        if (idx === -1) {
          mergedTransactions = [incomingTx, ...mergedTransactions];
          mergedAccounts = applyTransactionDelta(mergedAccounts, incomingTx, 1);
        } else {
          const localTx = mergedTransactions[idx];
          const incomingTime = incomingTx.updatedAt || '';
          const localTime = localTx.updatedAt || '';
          if (incomingTime > localTime) {
            mergedAccounts = applyTransactionDelta(mergedAccounts, localTx, -1);
            mergedAccounts = applyTransactionDelta(mergedAccounts, incomingTx, 1);
            mergedTransactions = mergedTransactions.map((t, i) => (i === idx ? incomingTx : t));
          }
        }
      });

      // Account metadata (name/icon/color/currency) merges newest-wins; balance is left alone here —
      // it's already been kept consistent via applyTransactionDelta above.
      (data.accounts || []).forEach((incomingAcc: Account) => {
        const idx = mergedAccounts.findIndex(a => a.id === incomingAcc.id);
        if (idx === -1) {
          mergedAccounts = [...mergedAccounts, incomingAcc];
        } else {
          const localAcc = mergedAccounts[idx];
          const incomingTime = incomingAcc.updatedAt || '';
          const localTime = localAcc.updatedAt || '';
          if (incomingTime > localTime) {
            mergedAccounts = mergedAccounts.map((a, i) => (i === idx ? { ...incomingAcc, balance: a.balance } : a));
          }
        }
      });

      const mergedBudgets = mergeByIdNewestWins(budgets, data.budgets || []);
      const mergedGoals = mergeByIdNewestWins(goals, data.goals || []);
      const mergedScheduled = mergeByIdNewestWins(scheduledPayments, data.scheduledPayments || []);
      const mergedShoppingLists = mergeByIdNewestWins(shoppingLists, data.shoppingLists || []);

      setAccounts(mergedAccounts);
      setTransactions(mergedTransactions);
      setBudgets(mergedBudgets);
      setGoals(mergedGoals);
      setScheduledPayments(mergedScheduled);
      setShoppingLists(mergedShoppingLists);

      const newAppData: AppData = {
        exchangeRate, usdRateParallel, euroRate, euroRateParallel,
        accounts: mergedAccounts,
        transactions: mergedTransactions,
        scheduledPayments: mergedScheduled,
        userProfile,
        budgets: mergedBudgets,
        goals: mergedGoals,
        rateHistory,
        shoppingItems,
        shoppingLists: mergedShoppingLists,
        profiles,
        activeProfileId,
        contacts,
        debts,
      };
      if (storageType === 'INDEXED_DB') {
        await idbService.save(newAppData);
      } else {
        const encrypted = await encryptData(newAppData);
        localStorage.setItem(STORAGE_KEY, encrypted);
      }

      // Don't move the upload watermark here: a restore uploads nothing, and advancing it to the
      // backup's syncedAt would make local changes older than that never reach the cloud.
      showAlert('alert_importSuccess', 'success');
    } catch (err) {
      console.error('Minimal restore failed', err);
      showAlert('alert_importError', 'error');
    }
  }, [accounts, transactions, budgets, goals, scheduledPayments, shoppingLists, userProfile, exchangeRate, usdRateParallel, euroRate, euroRateParallel, rateHistory, shoppingItems, profiles, activeProfileId, contacts, debts, storageType, fetchFileContent, applyTransactionDelta, mergeByIdNewestWins, showAlert]);

  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    if (isAuthenticated && pendingSync) {
      setPendingSync(false);
      handleMinimalBackup();
    }
  }, [isAuthenticated, pendingSync, handleMinimalBackup]);

  // Dashboard cloud icon: by default runs the minimal backup (upload-only). Full backup/restore
  // and minimal restore live in ProfileView, where the user explicitly chooses Full vs Mínimo.
  const handleDashboardSync = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingSync(true);
      handleLogin();
    } else {
      await handleMinimalBackup();
    }
  }, [isAuthenticated, handleLogin, handleMinimalBackup]);

  // Automatic minimal sync while signed in to Drive: debounced after any data change, and flushed
  // right away when the app is backgrounded (phones often kill the PWA soon after). Also runs once
  // after load/login so anything left unsynced by a previous session gets uploaded.
  const minimalBackupRef = useRef(handleMinimalBackup);
  minimalBackupRef.current = handleMinimalBackup;
  const autoSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSyncInFlightRef = useRef<Promise<void> | null>(null);

  const runAutoSync = useCallback(() => {
    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = null;
    if (!navigator.onLine) return;
    // Chain behind an in-flight sync so changes made during the upload aren't skipped.
    const prev = autoSyncInFlightRef.current ?? Promise.resolve();
    const run = prev.then(() => minimalBackupRef.current(true));
    autoSyncInFlightRef.current = run.finally(() => {
      if (autoSyncInFlightRef.current === run) autoSyncInFlightRef.current = null;
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isLoaded) return;
    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = setTimeout(runAutoSync, 5000);
    // uploadJson is a dep so the sync re-arms once the Drive client finishes initializing.
  }, [isAuthenticated, isLoaded, transactions, accounts, scheduledPayments, budgets, goals, shoppingLists, uploadJson, runAutoSync]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const flush = () => {
      if (document.visibilityState === 'hidden' && autoSyncTimerRef.current) runAutoSync();
    };
    const onOnline = () => runAutoSync();
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('online', onOnline);
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    };
  }, [isAuthenticated, runAutoSync]);



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
            setContacts(loadedData.contacts || []);
            setDebts(loadedData.debts || []);
            setIsFirstTime(false);
        } else {
            setIsFirstTime(true);
        }
        setIsLoaded(true);
    };
    load();
  }, [storageType]);


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
        if (currentProfile.smartAlertsEnabled !== false) {
            const overBudgetCategories = checkBudgetForecasts(currentTransactions, currentBudgets, now);
            
            overBudgetCategories.forEach(categoryId => {
                const budget = currentBudgets.find(b => b.categoryId === categoryId);
                if (!budget) return;
                const categoryObj = CATEGORIES.find(c => c.id === categoryId);
                const categoryName = categoryObj ? t(categoryObj.name as any) : (budget.customName || categoryId);
                
                const alertKey = `parity_budget_alert_${categoryId}_${todayStr}`;
                if (!localStorage.getItem(alertKey)) {
                    const msgTmp = t('budgetAlertBody') === 'budgetAlertBody' ? `You are on track to exceed your budget for ${categoryName}.` : t('budgetAlertBody');
                    const titleTmp = t('budgetAlertTitle') === 'budgetAlertTitle' ? 'Smart Alert: Budget Risk' : t('budgetAlertTitle');
                    const msg = msgTmp.replace('{category}', categoryName as string);
                    const title = (titleTmp as string).replace('{category}', categoryName as string);

                    sendPushNotification(title, msg, `budget-${categoryId}-${todayStr}`);
                    showAlert(msg, 'error');
                    localStorage.setItem(alertKey, 'true');
                }
            });
        }

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
                const title = t('notificationTitle') || 'Scheduled Payment';

                sendPushNotification(title, msg, `payment-${p.id}-${todayStr}`);
                showAlert(msg, 'info');
                newPayments[idx] = { ...p, lastNotified: todayStr };
                updated = true;
            }
        });

        if (updated) {
            setScheduledPayments(newPayments);
        }

        // Debt overdue alerts
        const currentDebts = debtsRef.current;
        currentDebts.forEach(debt => {
            if (debt.status === 'settled' || !debt.dueDate) return;
            const dueDate = new Date(debt.dueDate);
            if (dueDate < now) {
                const alertKey = `parity_debt_overdue_${debt.id}_${todayStr}`;
                if (!localStorage.getItem(alertKey)) {
                    const title = t('debtOverdueTitle') === 'debtOverdueTitle' ? 'Overdue Debt' : t('debtOverdueTitle');
                    const personName = debt.counterpartyName || (debt as any).name || '—';
                    const currency = debt.currency || 'USD';
                    const body = `${personName} — $${debt.amount.toFixed(2)} ${currency}`;
                    sendPushNotification(title as string, body, `debt-overdue-${debt.id}-${todayStr}`);
                    localStorage.setItem(alertKey, 'true');
                }
            }
        });
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
    const debtsRef = useRef(debts);

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
        debtsRef.current = debts;
    }, [scheduledPayments, userProfile, exchangeRate, euroRate, budgets, transactions, accounts, usdRateParallel, euroRateParallel, activeProfileId, debts]);

    useEffect(() => {
        if (!isLoaded) return;
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
        // Rate refetch handled by react-query refetchOnWindowFocus
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
    // Rate refetch on reconnect handled by react-query refetchOnReconnect
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    showAlert(type === 'OFFICIAL' ? t('rateOfficialActivated') : t('rateParallelActivated'), 'success');
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
      contacts,
      debts,
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
  }, [exchangeRate, usdRateParallel, euroRate, euroRateParallel, accounts, transactions, scheduledPayments, userProfile, budgets, goals, rateHistory, shoppingItems, shoppingLists, isLoaded, storageType, profiles, activeProfileId, contacts, debts]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("navbarFavorites", JSON.stringify(navbarFavorites));
  }, [navbarFavorites, isLoaded]);

  useEffect(() => {
    if (userProfile.name && window.location.protocol === 'https:' && window.location.hostname === 'parity-finance.vercel.app') {
      // @ts-ignore
      window.OneSignalDeferred?.push(async function(OneSignal) {
        try {
          await OneSignal.login(userProfile.name);
        } catch (e) {
          console.warn('OneSignal login error:', e);
        }
      });
    }
  }, [userProfile.name]);


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
    // Detect newly completed goals for gamification
    const currentCompleted = new Set(filteredGoals.filter(g => g.completed).map(g => g.id));
    newActiveGoals
      .filter(g => g.completed && !currentCompleted.has(g.id))
      .forEach(g => dispatchGamEvent({ type: 'goal_completed', entityId: g.id, timestamp: Date.now() }));

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
            // Source lost `amount + fee` (fee always charged to source), so restore both
            let amount = tx.amount + (tx.fee || 0);

            if (acc.currency !== tx.originalCurrency) {
              const isUSDType = (c: Currency) => c === Currency.USD || c === Currency.USDT;

              if (isUSDType(acc.currency) && tx.originalCurrency === Currency.VES) {
                amount = (tx.amount + (tx.fee || 0)) / tx.exchangeRate;
              } else if (acc.currency === Currency.VES && isUSDType(tx.originalCurrency)) {
                amount = (tx.amount + (tx.fee || 0)) * tx.exchangeRate;
              }
            }

            const modifier = tx.type === TransactionType.INCOME ? -1 : 1;
            return { ...acc, balance: acc.balance + (amount * modifier) };
          }

          if (tx.type === TransactionType.TRANSFER && tx.toAccountId && acc.id === tx.toAccountId) {
            // Destination received full `amount`, so reverse exactly that
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
            recordTombstone(id);
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
                recordTombstone(id);
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

    const normalizedUSD = convertCurrency(
      totalAmountForStats,
      data.originalCurrency,
      Currency.USD,
      { usdToVes: data.exchangeRate || currentUSDRes, eurToVes: data.euroRate || currentEuroRate },
      (userProfile.usdtSpread || 0) / 100
    );

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
        // Fee always comes from source (both EXPENSE and TRANSFER)
        let deduction = data.amount;
        if ((data.type === TransactionType.EXPENSE || data.type === TransactionType.TRANSFER) && (data.fee || 0) > 0) {
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
        // Destination receives the full amount; fee was already charged to source
        let addition = data.amount;

        if (data.originalCurrency !== acc.currency) {
          if (acc.currency === Currency.VES) {
             if (isUSDType(data.originalCurrency)) addition = data.amount * txRate;
             else if (data.originalCurrency === Currency.EUR) addition = data.amount * txEuroRate;
          } else if (acc.currency === Currency.EUR) {
             if (isUSDType(data.originalCurrency)) addition = data.amount * (txRate / txEuroRate);
             else if (data.originalCurrency === Currency.VES) addition = data.amount / txEuroRate;
          } else if (isUSDType(acc.currency)) {
             if (data.originalCurrency === Currency.VES) addition = data.amount / txRate;
             else if (data.originalCurrency === Currency.EUR) addition = data.amount * (txEuroRate / txRate);
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
      contacts,
      debts,
      syncQueue: []
    }).catch(e => console.error('[PARITY] Immediate save failed:', e));

    // Update React state (also triggers the useEffect save as a backup)
    setTransactions(finalTransactions);
    setAccounts(finalAccounts);

    // Gamification events — only for new transactions (not edits)
    if (!data.id) {
      if (data.type === TransactionType.TRANSFER) {
        dispatchGamEvent({ type: 'transfer_completed', entityId: newTransaction.id, timestamp: Date.now() });
      } else {
        dispatchGamEvent({ type: 'transaction_created', entityId: newTransaction.id, timestamp: Date.now() });
        if (data.receipt) {
          dispatchGamEvent({ type: 'transaction_with_receipt', entityId: newTransaction.id, timestamp: Date.now() });
        }
      }
    }

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
        setShoppingLists(data.shoppingLists || []);
        setUserProfile(data.userProfile);

        const newData: AppData = {
            exchangeRate: data.exchangeRate || exchangeRate,
            accounts: data.accounts || [],
            transactions: data.transactions || [],
            scheduledPayments: data.scheduledPayments || [],
            userProfile: data.userProfile,
            budgets: data.budgets || [],
            goals: data.goals || [],
            shoppingItems: data.shoppingItems || [],
            shoppingLists: data.shoppingLists || []
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

  const handleStartFresh = (data: { 
    profile: Partial<UserProfile>; 
    displayCurrency: Currency; 
    isBalanceVisible: boolean; 
    navbarFavorites: string[];
    dailyGoal: DailyGoalTier;
    hasDebtsSeed: boolean;
    attentionGoal: 'saving' | 'budgeting' | 'logging';
  }) => {
    setUserProfile(prev => ({ ...prev, ...data.profile }));
    setDisplayCurrency(data.displayCurrency);
    localStorage.setItem("displayCurrency", data.displayCurrency);
    setIsBalanceVisible(data.isBalanceVisible);
    localStorage.setItem("isBalanceVisible", JSON.stringify(data.isBalanceVisible));
    
    const favs = data.navbarFavorites.includes('DASHBOARD') 
      ? data.navbarFavorites 
      : ['DASHBOARD', ...data.navbarFavorites].slice(0, 4);
    
    setNavbarFavorites(favs as ViewState[]);
    localStorage.setItem("navbarFavorites", JSON.stringify(favs));
    const initialWallet: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.profile.name || 'Wallet',
      currency: data.displayCurrency === Currency.VES ? Currency.VES : data.displayCurrency === Currency.EUR ? Currency.EUR : Currency.USD,
      balance: 0,
      icon: 'wallet',
    };
    setAccounts([initialWallet]);

    // Create customized initial gamification profile
    const initialGamProfile = createDefaultProfile();
    initialGamProfile.dailyGoal = data.dailyGoal;
    initialGamProfile.placementCompletedAt = new Date().toISOString();
    
    // Seed initial challenges based on attentionGoal and hasDebtsSeed
    const today = toISODate(new Date());
    const matchedTemplates: string[] = [];
    if (data.attentionGoal === 'saving') {
      matchedTemplates.push('daily_log_today', 'weekly_save_25', 'monthly_goal_progress');
    } else if (data.attentionGoal === 'budgeting') {
      matchedTemplates.push('daily_log_today', 'weekly_control_food', 'monthly_all_green');
    } else {
      matchedTemplates.push('daily_log_today', 'weekly_no_gaps', 'monthly_goal_progress');
    }
    
    if (data.hasDebtsSeed) {
      matchedTemplates.push('weekly_settle_debt');
    }
    
    for (const tid of matchedTemplates) {
      const temp = CHALLENGE_TEMPLATES.find(t => t.id === tid);
      if (temp) {
        let targetVal = 1;
        const target = temp.target;
        if (target) {
          if ('count' in target) targetVal = target.count;
          else if ('amount' in target) targetVal = target.amount;
          else if ('limit' in target) targetVal = target.limit;
          else if ('envelopeCount' in target) targetVal = target.envelopeCount;
          else if ('days' in target) targetVal = target.days;
          else if ('progressPercent' in target) targetVal = target.progressPercent;
        }

        const expiresAt = temp.horizon === 'daily' 
          ? today + 'T23:59:59.999Z'
          : temp.horizon === 'weekly'
            ? offsetDate(today, 7) + 'T23:59:59.999Z'
            : offsetDate(today, 30) + 'T23:59:59.999Z';

        initialGamProfile.challengeProgress[temp.id] = {
          challengeId: temp.id,
          assignedAt: today + 'T00:00:00.000Z',
          expiresAt,
          current: 0,
          target: targetVal,
          completed: false,
          completedAt: null,
          xpClaimed: false,
        };
      }
    }
    
    idbService.saveGamificationProfile(initialGamProfile);
    setIsFirstTime(false);
  };

  const handleResetAppData = () => {
    localStorage.clear();
    indexedDB.deleteDatabase('parity_db');
    window.location.reload();
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
          <Suspense fallback={<ViewLoadingFallback />}>
            <Onboarding
              lang={userProfile.language}
              onStartFresh={handleStartFresh}
              onSyncFromCloud={handleOnboardingCloudSync}
              isSyncing={isSyncing}
              isDevMode={isDevMode}
            />
          </Suspense>
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
          className="flex-1 relative z-0 overflow-y-auto overflow-x-hidden flex flex-col mb-0"
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.16, ease: 'easeInOut' }}
              className="flex-1 flex flex-col min-h-full"
            >
          <Suspense fallback={<ViewLoadingFallback />}>
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
                      showAlert(t('checkingUpdates'), 'info');
                    });
                  });
                }
              }}
              biometricsEnabled={biometricsEnabled}
              onVerifyBiometrics={verifyBiometrics}
               euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
              euroRateParallel={euroRateParallel}
              usdRateParallel={usdRateParallel}
              onUpdateTransaction={(tx) => setTransactions(prev => prev.map(t => t.id === tx.id ? touch(tx) : t))}
              hasFetchedRates={hasFetchedRates}
              onUpdateProfile={handleUpdateProfile}
              syncPendingCount={syncPendingCount}
              isSyncing={isSyncing}
              onSync={handleDashboardSync}
              goals={goals}
              onOpenTutorials={() => setShowTutorials(true)}
              gamProfile={gamProfile}
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
              euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
              usdtSpread={userProfile.usdtSpread}
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
              euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
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
              euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
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
              onExportMinimal={handleMinimalBackup}
              onImportMinimal={handleMinimalRestore}
              listMinimalBackups={() => listFilesByPrefix(MINIMAL_BACKUP_PREFIX)}
              onDeleteBackup={deleteFile}
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
              onResetAppData={handleResetAppData}
              onPrepareOffline={handlePrepareOffline}
              isPreparingOffline={isPreparingOffline}
              offlineReadySince={offlineReadySince}
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
              onUpdateTransaction={(tx) => setTransactions(prev => prev.map(t => t.id === tx.id ? touch(tx) : t))}
              initialViewMode={currentView === 'INVOICES' ? 'INVOICES' : 'LIST'}
              showConfirm={showConfirm}
              userProfile={userProfile}
              isDevMode={isDevMode}
              showAlert={showAlert}
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
          {currentView === 'INVOICE_DIGITIZE' && (
            <InvoiceDigitizeView
              onBack={() => setCurrentView('PROFILE')}
              transactions={filteredTransactions}
              onUpdateTransaction={(tx) => setTransactions(prev => prev.map(t => t.id === tx.id ? touch(tx) : t))}
              userProfile={userProfile}
              showAlert={showAlert}
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
          {(currentView === 'CONTACTS' || currentView === 'DEBT_TRACKER') && (
            <PeopleView
              onBack={() => setCurrentView('DASHBOARD')}
              lang={userProfile.language}
              contacts={contacts.filter(c => c.profileId === activeProfileId || (!c.profileId && activeProfileId === 'default')) as any}
              onUpdateContacts={(updated) => setContacts(prev => [
                ...prev.filter(c => c.profileId !== activeProfileId && (c.profileId || activeProfileId !== 'default')),
                ...updated.map((c: any) => ({ ...c, profileId: c.profileId || activeProfileId }))
              ])}
              debts={debts.filter(d => d.profileId === activeProfileId || (!d.profileId && activeProfileId === 'default')) as any}
              onUpdateDebts={(updated) => setDebts(prev => [
                ...prev.filter(d => d.profileId !== activeProfileId && (d.profileId || activeProfileId !== 'default')),
                ...updated.map((d: any) => ({ ...d, profileId: d.profileId || activeProfileId }))
              ])}
              transactions={filteredTransactions}
              exchangeRate={exchangeRate}
              accounts={accounts.filter(a => a.profileId === activeProfileId || (!a.profileId && activeProfileId === 'default'))}
              onQuickTransfer={() => setCurrentView('TRANSFER')}
              onAddPaymentTransaction={(prefilled) => {
                setEditingTransaction(prefilled as Transaction);
                setShowAdd(true);
              }}
              onCreateDirectTransaction={(tx) => {
                setTransactions(prev => [touch({ ...tx, id: tx.id || Date.now().toString(), profileId: activeProfileId } as Transaction), ...prev]);
              }}
              initialTab={currentView === 'DEBT_TRACKER' ? 'DEBTS' : 'CONTACTS'}
            />
          )}
          {(currentView === 'EXPORT' || currentView === 'IMPORT' || currentView === 'PDF_REPORT') && (
            <DataPortabilityView
              key={currentView}
              initialTab={currentView === 'IMPORT' ? 'IMPORT' : currentView === 'PDF_REPORT' ? 'REPORT' : 'EXPORT'}
              transactions={filteredTransactions}
              accounts={filteredAccounts}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              euroRate={userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate}
              displayCurrency={displayCurrency}
              isBalanceVisible={isBalanceVisible}
              profile={userProfile}
              onImportData={handleImportData}
              onImportTransactions={(txs) => {
                setTransactions(prev => [...(txs as Transaction[]).map(touch), ...prev]);
              }}
              onBack={() => setCurrentView('DASHBOARD')}
            />
          )}
          {currentView === 'FIN_CALENDAR' && (
            <FinancialCalendarView
              onBack={() => setCurrentView('DASHBOARD')}
              transactions={filteredTransactions}
              scheduledPayments={filteredScheduledPayments}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              displayCurrency={displayCurrency}
              isBalanceVisible={isBalanceVisible}
            />
          )}
          {currentView === 'ACADEMY' && (
            <AcademyView
              profile={gamProfile}
              onBack={() => setCurrentView('DASHBOARD')}
              onBuyItem={buyShopItem}
              onEquipOutfit={equipOutfit}
              onRerollChallenge={rerollChallenge}
              onUpdateDailyGoal={updateDailyGoal}
              t={t}
            />
          )}
          {currentView === 'SCENARIO_PLANNER' && (
            <ScenarioPlannerView
              onBack={() => setCurrentView('DASHBOARD')}
              lang={userProfile.language}
              exchangeRate={exchangeRate}
              displayCurrency={displayCurrency}
              isBalanceVisible={isBalanceVisible}
              totalBalanceUSD={filteredAccounts.reduce((acc, a) => {
                let v = a.balance;
                if (a.currency === Currency.VES) v = a.balance / exchangeRate;
                else if (a.currency === Currency.EUR) v = (a.balance * (euroRate || exchangeRate)) / exchangeRate;
                return acc + v;
              }, 0)}
              onApplyToReality={(event) => {
                const prefilled: Partial<Transaction> = {
                  amount: Math.abs(event.amount),
                  originalCurrency: Currency.USD,
                  exchangeRate,
                  normalizedAmountUSD: Math.abs(event.amount),
                  type: event.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                  note: event.name,
                  date: new Date().toISOString(),
                  category: event.amount >= 0 ? 'income' : 'OTHER',
                  accountId: filteredAccounts[0]?.id || '',
                };
                setEditingTransaction(prefilled as Transaction);
                setShowAdd(true);
                setCurrentView('DASHBOARD');
              }}
            />
          )}
          </Suspense>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Bottom Nav (Only visible on Dashboard and Wallet/Profile root) */}
        {['DASHBOARD', 'WALLET', 'PROFILE', 'ANALYSIS', 'TRANSACTIONS', 'BUDGET', 'SCHEDULED', 'HEATMAP', 'CURRENCY_PERF', 'SHOPPING_LIST', 'CONTACTS', 'DEBT_TRACKER', 'EXPORT', 'FIN_CALENDAR', 'IMPORT', 'PDF_REPORT', 'SCENARIO_PLANNER'].includes(currentView) && isNavVisible && !showAdd && !showSettings && (
          <div className="h-20 bg-theme-surface/95 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-0 md:gap-24 px-2 relative z-10 pb-2 flex-shrink-0 w-full transition-all duration-300 animate-in slide-in-from-bottom-full">
            {(() => {
              const NAV_ICON_MAP: Record<string, React.ReactNode> = {
                DASHBOARD: <Home size={24} />,
                WALLET: <Wallet size={24} />,
                ANALYSIS: <ChartArea size={24} />,
                PROFILE: <User size={24} />,
                BUDGET: <PieChart size={24} />,
                SCHEDULED: <Calendar1 size={24} />,
                TRANSACTIONS: <Receipt size={24} />,
                HEATMAP: <CalendarRange size={24} />,
                CURRENCY_PERF: <ChartCandlestick size={24} />,
                SHOPPING_LIST: <ShoppingCart size={24} />,
                GOALS: <Target size={24} />,
                FISCAL_REPORT: <FileText size={24} />,
                INCOME: <TrendingUp size={24} />,
                CONTACTS: <Users size={24} />,
                DEBT_TRACKER: <Scale size={24} />,
                FIN_CALENDAR: <CalendarDays size={24} />,
                SCENARIO_PLANNER: <FlaskConical size={24} />,
                ACADEMY: <GraduationCap size={24} />,
              };
              const NAV_LABEL_MAP: Record<string, string> = {
                DASHBOARD: t('dashboard'),
                WALLET: t('wallet'),
                ANALYSIS: t('analysis'),
                PROFILE: t('profile'),
                BUDGET: t('envelopes'),
                SCHEDULED: t('scheduled'),
                TRANSACTIONS: t('transactions'),
                HEATMAP: t('heatmap'),
                CURRENCY_PERF: t('currencyPerformance'),
                SHOPPING_LIST: t('shoppingList'),
                GOALS: t('goals'),
                FISCAL_REPORT: t('fiscalReport'),
                INCOME: t('incomeView'),
                CONTACTS: t('people') || 'People',
                DEBT_TRACKER: t('debts') || 'Debts',
                FIN_CALENDAR: t('financialCalendar') || 'Calendar',
                SCENARIO_PLANNER: t('scenarioPlanner') || 'Scenarios',
                ACADEMY: t('academy') || 'Academy',
              };
              const validFavs = navbarFavorites.filter(v => v in NAV_ICON_MAP);
              const leftItems = validFavs.slice(0, 2);
              const rightItems = validFavs.slice(2, 4);
              const renderBtn = (view: string) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view as ViewState)}
                  className={`flex flex-col items-center gap-0.5 p-3 transition-colors ${currentView === view ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}`}
                >
                  {NAV_ICON_MAP[view]}
                  <span className="text-[9px] font-black uppercase tracking-tight leading-none">{NAV_LABEL_MAP[view]}</span>
                </button>
              );
              return (
                <>
                  {leftItems.map(renderBtn)}
                  {/* FAB container */}
                  <div className="relative -top-6">
                    <button
                      data-tutorial="fab-add"
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
                      aria-label="Nueva transacción"
                    >
                      <Plus size={32} />
                    </button>
                  </div>
                  {rightItems.map(renderBtn)}
                </>
              );
            })()}
          </div>
        )}

        {/* Modals */}
        {showAdd && (
          <Suspense fallback={<ViewLoadingFallback />}>
          <AddTransaction
            onClose={() => {
                setShowAdd(false);
                setEditingTransaction(null);
                setShoppingItemToConvert(null);
            }}
            onSave={handleSaveTransaction}
            exchangeRate={userProfile.rateType === 'PARALLEL' ? (usdRateParallel || exchangeRate) : exchangeRate}
            usdRateParallel={usdRateParallel}
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
            contacts={contacts}
            isDevMode={isDevMode}
            userProfile={userProfile}
          />
          </Suspense>
        )}

        {showSettings && (
          <Suspense fallback={<ViewLoadingFallback />}>
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
          </Suspense>
        )}

        {/* Persistent offline indicator — stays up the whole time the connection is down,
            whether the app opened offline or lost it mid-session. */}
        {!isOnline && (
          <div className="fixed top-0 inset-x-0 z-[90] bg-amber-500 text-black text-center text-[11px] font-black uppercase tracking-wide py-1.5 flex items-center justify-center gap-1.5 shadow-lg">
            <WifiOff size={12} strokeWidth={3} /> {t('workingOffline') || 'Trabajando sin conexión'}
          </div>
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

        {/* Gamification Overlays */}
        <XPToastContainer
          rewards={xpToasts}
          onDismiss={(i) => setXpToasts(prev => prev.filter((_, idx) => idx !== i))}
        />
        {levelUpLevel && (
          <LevelUpModal
            newLevel={levelUpLevel}
            onDismiss={() => setLevelUpLevel(null)}
            onViewAcademy={() => { setLevelUpLevel(null); setCurrentView('ACADEMY'); }}
          />
        )}
        {badgesToShow.length > 0 && (
          <BadgeEarnedSheet
            badges={badgesToShow}
            onDismiss={() => setBadgesToShow([])}
            t={t}
          />
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

        {/* Tutorial System — mounted at app level so it persists across view changes */}
        {showTutorials && (
          <TutorialSystem
            onClose={() => setShowTutorials(false)}
            onNavigate={(view) => setCurrentView(view as ViewState)}
            lang={userProfile.language}
          />
        )}
      </div>
    </div>
  );
}