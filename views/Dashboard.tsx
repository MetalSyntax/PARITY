import React, { useState, useMemo, useEffect } from "react";
import { ArrowRightLeft, TrendingUp, PieChart, ArrowUpRight, Plus, Calendar1, CalendarRange, ChartArea, Eye, EyeOff, Settings, ChartCandlestick, User, Activity, TrendingDown, Receipt, Wallet, GripVertical, DollarSign, RefreshCw, ArrowDownToLine, ShoppingCart, Euro, Image as ImageIcon, Trophy, FileText, Cloud, CloudOff } from "lucide-react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Transaction, Account, Currency, UserProfile, TransactionType } from "../types";
import { CATEGORIES } from "../constants";
import { getTranslation } from "../i18n";
import { TransactionDetailModal } from "../components/TransactionDetailModal";
import { PinModal } from "../components/PinModal";
import { TransactionItem } from "../components/TransactionItem";
import { CurrencyConverter } from "../components/CurrencyConverter";
import { DashboardCustomizer } from "../components/DashboardCustomizer";
import { CurrencyAmount } from "../components/CurrencyAmount";
import { formatSecondaryAmount } from "../utils/formatUtils";
import { IncomeVsExpenseChart, ExpenseStructureChart, DailySpendingChart, BalanceHistoryChart } from "../components/Charts";
import { renderAccountIcon } from "../utils/iconUtils";
import { projectMonthEndSpending, calculateRunway } from "../utils/forecast";
import { 
  WidgetWrapper, 
  BalanceCardWidget, 
  BalanceChartWidget, 
  WalletsWidget, 
  ExpenseStructureWidget, 
  ForecastWidget, 
  FiscalSummaryWidget, 
  TransactionsWidget, 
  IncomeVsExpenseWidget, 
  DailySpendingWidget, 
  CategoryBreakdownWidget 
} from "../components/DashboardWidgets";
import { WIDGET_REGISTRY, DEFAULT_LEFT_COLUMN, DEFAULT_RIGHT_COLUMN } from "../utils/widgetRegistry";
import { WidgetId } from "../types";


interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  exchangeRate: number;
  onOpenSettings: () => void;
  onNavigate: (view: any) => void;
  userProfile: UserProfile;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (t: Transaction) => void;
  onToggleBottomNav: (visible: boolean) => void;
  isBalanceVisible: boolean;
  setIsBalanceVisible: (visible: boolean) => void;
  isDevMode: boolean;
  onDevModeTrigger: () => void;
  displayCurrency: Currency;
  onToggleDisplayCurrency: () => void;
  needUpdate: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  onCheckUpdate: () => void;
  biometricsEnabled?: boolean;
  onVerifyBiometrics?: () => Promise<boolean>;
  euroRate?: number;
  euroRateParallel?: number;
  onUpdateTransaction: (t: Transaction) => void;
  hasFetchedRates: boolean;
  onUpdateProfile: (p: UserProfile) => void;
  syncPendingCount: number;
  isSyncing?: boolean;
  onSync?: () => void;
  goals: any[];
}


export const Dashboard: React.FC<DashboardProps> = ({
  accounts,
  transactions,
  exchangeRate,
  onOpenSettings,
  onNavigate,
  userProfile,
  onDeleteTransaction,
  onEditTransaction,
  onToggleBottomNav,
  isBalanceVisible,
  setIsBalanceVisible,
  isDevMode,
  onDevModeTrigger,
  displayCurrency,
  onToggleDisplayCurrency,
  needUpdate,
  updateServiceWorker,
  onCheckUpdate,
  biometricsEnabled,
  onVerifyBiometrics,
  euroRate,
  euroRateParallel,
  onUpdateTransaction,
  hasFetchedRates,
  onUpdateProfile,
  syncPendingCount,
  isSyncing,
  onSync,
  goals
}) => {

  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [balanceChartType, setBalanceChartType] = useState<'LINE' | 'BAR'>('LINE');
  const [expenseChartType, setExpenseChartType] = useState<'DOUGHNUT' | 'BAR'>('DOUGHNUT');



  // Widget Visibility
  const [showBalanceChart, setShowBalanceChart] = useState(() => {
    const saved = localStorage.getItem("dash_show_balance_chart");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showExpenseStructure, setShowExpenseStructure] = useState(() => {
    const saved = localStorage.getItem("dash_show_expense_structure");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [showIncomeVsExpense, setShowIncomeVsExpense] = useState(() => {
    const saved = localStorage.getItem("dash_show_income_expense");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(() => {
    const saved = localStorage.getItem("dash_show_category_breakdown");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showDailySpending, setShowDailySpending] = useState(() => {
    const saved = localStorage.getItem("dash_show_daily_spending");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [showForecastCard, setShowForecastCard] = useState(() => {
    const saved = localStorage.getItem("dash_show_forecast_card");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [showFiscalSummary, setShowFiscalSummary] = useState(() => {
    const saved = localStorage.getItem("dash_show_fiscal_summary");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showGoals, setShowGoals] = useState(() => {
    const saved = localStorage.getItem("dash_show_goals");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Widget Order persistence
  const [leftOrder, setLeftOrder] = useState<string[]>(() => {
    if (userProfile.dashboardLayout?.leftColumn) return userProfile.dashboardLayout.leftColumn;
    const saved = localStorage.getItem("dash_left_order");
    const parsed = saved ? JSON.parse(saved) : DEFAULT_LEFT_COLUMN;
    return parsed;
  });

  const [rightOrder, setRightOrder] = useState<string[]>(() => {
    if (userProfile.dashboardLayout?.rightColumn) return userProfile.dashboardLayout.rightColumn;
    const saved = localStorage.getItem("dash_right_order");
    const parsed = saved ? JSON.parse(saved) : DEFAULT_RIGHT_COLUMN;
    return parsed;
  });

  const [touchedWidget, setTouchedWidget] = useState<string | null>(null);

  const leftControls = leftOrder.map(() => useDragControls());
  const rightControls = rightOrder.map(() => useDragControls());

  useEffect(() => {
    localStorage.setItem("dash_left_order", JSON.stringify(leftOrder));
    if (JSON.stringify(userProfile.dashboardLayout?.leftColumn) !== JSON.stringify(leftOrder)) {
      onUpdateProfile({
        ...userProfile,
        dashboardLayout: {
          leftColumn: leftOrder as WidgetId[],
          rightColumn: rightOrder as WidgetId[],
          widgets: userProfile.dashboardLayout?.widgets || []
        }
      });
    }
  }, [leftOrder]);

  useEffect(() => {
    localStorage.setItem("dash_right_order", JSON.stringify(rightOrder));
    if (JSON.stringify(userProfile.dashboardLayout?.rightColumn) !== JSON.stringify(rightOrder)) {
      onUpdateProfile({
        ...userProfile,
        dashboardLayout: {
          leftColumn: leftOrder as WidgetId[],
          rightColumn: rightOrder as WidgetId[],
          widgets: userProfile.dashboardLayout?.widgets || []
        }
      });
    }
  }, [rightOrder]);

  const toggleWidget = (
    widget: "balance" | "expense" | "incomeVs" | "category" | "daily" | "forecast" | "fiscalSummary" | "goals",
  ) => {
    if (widget === "balance") {
      const next = !showBalanceChart;
      setShowBalanceChart(next);
      localStorage.setItem("dash_show_balance_chart", JSON.stringify(next));
    } else if (widget === "expense") {
      const next = !showExpenseStructure;
      setShowExpenseStructure(next);
      localStorage.setItem("dash_show_expense_structure", JSON.stringify(next));
    } else if (widget === "incomeVs") {
      const next = !showIncomeVsExpense;
      setShowIncomeVsExpense(next);
      localStorage.setItem("dash_show_income_expense", JSON.stringify(next));
    } else if (widget === "category") {
      const next = !showCategoryBreakdown;
      setShowCategoryBreakdown(next);
      localStorage.setItem(
        "dash_show_category_breakdown",
        JSON.stringify(next),
      );
    } else if (widget === "daily") {
      const next = !showDailySpending;
      setShowDailySpending(next);
      localStorage.setItem("dash_show_daily_spending", JSON.stringify(next));
    } else if (widget === "forecast") {
      const next = !showForecastCard;
      setShowForecastCard(next);
      localStorage.setItem("dash_show_forecast_card", JSON.stringify(next));
    } else if (widget === "fiscalSummary") {
      const next = !showFiscalSummary;
      setShowFiscalSummary(next);
      localStorage.setItem("dash_show_fiscal_summary", JSON.stringify(next));
    } else if (widget === "goals") {
      const next = !showGoals;
      setShowGoals(next);
      localStorage.setItem("dash_show_goals", JSON.stringify(next));
    }
  };

  // Get PIN from storage or default
  const getStoredPin = () => localStorage.getItem("parity_pin") || "0000";

  const t = (key: any) => getTranslation(userProfile.language, key);

  const totalBalanceUSD = useMemo(() => {
    return accounts.reduce((acc, account) => {
      let val = account.balance;
      if (account.currency === Currency.VES)
        val = account.balance / exchangeRate;
      else if (account.currency === Currency.EUR)
        val = (account.balance * (euroRate || exchangeRate)) / exchangeRate;
      else if (account.currency === Currency.USDT)
        val = account.balance;
      return acc + val;
    }, 0);
  }, [accounts, exchangeRate, euroRate]);

  const totalBalanceVES = totalBalanceUSD * exchangeRate;
  const totalBalanceEUR = totalBalanceVES / (euroRate || 1);

  const forecast = useMemo(() => projectMonthEndSpending(transactions), [transactions]);
  const runwayDays = useMemo(() => calculateRunway(totalBalanceUSD, transactions), [totalBalanceUSD, transactions]);

  const fiscalMetrics = useMemo(() => {
    let taxableIncome = 0;
    let deductibleExpense = 0;
    const currentYear = new Date().getFullYear();

    transactions.forEach(t => {
       const d = new Date(t.date);
       if (d.getFullYear() === currentYear) {
          if (t.fiscalTag === 'TAXABLE_INCOME') taxableIncome += t.normalizedAmountUSD;
          else if (t.fiscalTag === 'DEDUCTIBLE_EXPENSE') deductibleExpense += t.normalizedAmountUSD;
       }
    });

    let netTaxable = taxableIncome - deductibleExpense;
    return { taxableIncome, deductibleExpense, netTaxable };
  }, [transactions]);



  useEffect(() => {
    onToggleBottomNav(!(showPinModal || showCustomizer));
  }, [showPinModal, showCustomizer, onToggleBottomNav]);


  const handlePrivacyToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBalanceVisible) {
      setIsBalanceVisible(false);
      localStorage.setItem("isBalanceVisible", "false");
    } else {
      if (biometricsEnabled && onVerifyBiometrics) {
        const success = await onVerifyBiometrics();
        if (success) {
          setIsBalanceVisible(true);
          localStorage.setItem("isBalanceVisible", "true");
          return;
        }
      }
      setShowPinModal(true);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
  };

  // Group transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((t) => {
      const date = t.date.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }, [transactions]);

  // Historical Balance Calculation (Last 7 Days)
  const balanceHistory = useMemo(() => {
    const txnPoints: { timestamp: number; balance: number }[] = [];
    let currentBal = totalBalanceUSD;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startTime = sevenDaysAgo.getTime();
    const endTime = now.getTime();
    const timeRange = endTime - startTime || 1;

    // Filter and sort transactions NEWEST first
    const recentTxns = transactions
      .filter(
        (t) =>
          new Date(t.date) >= sevenDaysAgo &&
          t.type !== TransactionType.TRANSFER,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Scale helpers
    const getX = (ts: number) => ((ts - startTime) / timeRange) * 100;
    const getY = (bal: number, min: number, range: number) =>
      60 - ((bal - min) / range) * 60;

    // Temporary array to store raw points to find min/max first
    const rawHistory = [{ timestamp: now.getTime(), balance: currentBal }];
    let tempBal = currentBal;
    recentTxns.forEach((t) => {
      const txnTime = new Date(t.date).getTime();
      rawHistory.push({ timestamp: txnTime, balance: tempBal });
      if (t.type === TransactionType.INCOME) tempBal -= t.normalizedAmountUSD;
      if (t.type === TransactionType.EXPENSE) tempBal += t.normalizedAmountUSD;
      rawHistory.push({ timestamp: txnTime, balance: tempBal });
    });
    rawHistory.push({ timestamp: sevenDaysAgo.getTime(), balance: tempBal });

    // Build the smooth line and capture transaction points
    let b = totalBalanceUSD;
    const pts: { x: number; y: number; timestamp: number; balance: number }[] =
      [];

    // Add current point
    // Note: We calculate X but defer Y until we have the full range
    const tempPts: { timestamp: number; balance: number }[] = [];
    tempPts.push({ timestamp: now.getTime(), balance: b });

    recentTxns.forEach((t) => {
      const txnTime = new Date(t.date).getTime();
      if (t.type === TransactionType.INCOME) b -= t.normalizedAmountUSD;
      if (t.type === TransactionType.EXPENSE) b += t.normalizedAmountUSD;

      tempPts.push({ timestamp: txnTime, balance: b });
      txnPoints.push({ timestamp: txnTime, balance: b });
    });

    // Add 7 days ago point
    tempPts.push({ timestamp: sevenDaysAgo.getTime(), balance: b });

    // Filter rawHistory to calculate min/max correctly based on the actual visible points
    const values = tempPts.map((h) => h.balance);
    // Add 20% padding to top/bottom to make the curve more subtle
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Ensure we have a minimum visual range so flat lines don't look weird
    // and small changes don't look huge
    const minRange = max * 0.1 || 100; // Minimum 10% variation or 100 units
    if (max - min < minRange) {
      const diff = minRange - (max - min);
      min -= diff / 2;
      max += diff / 2;
    } else {
      min *= 0.95;
      max *= 1.05;
    }

    // Don't go below zero unless user actually has negative balance
    if (min < 0 && Math.min(...values) >= 0) min = 0;

    const range = max - min || 1;

    // Now generate the Scaled Points
    tempPts.forEach((p) => {
      pts.push({
        x: getX(p.timestamp),
        y: getY(p.balance, min, range),
        timestamp: p.timestamp,
        balance: p.balance,
      });
    });

    // Sort chronologically for path
    const ptsSorted = pts.sort((a, b) => a.timestamp - b.timestamp);
    const linePoints = ptsSorted.map((p) => ({ x: p.x, y: p.y }));

    // Trend percentage
    const first = b; // balance 7 days ago
    const last = totalBalanceUSD;
    const trendPercent = first !== 0 ? ((last - first) / first) * 100 : 0;

    // Simplified Bezier Curve Generator (Catmull-Rom approximation)
    const getCurvePath = (pts: { x: number; y: number }[]) => {
      if (pts.length < 2) return "";
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const curr = pts[i];
        const next = pts[i + 1];
        const cp1x = curr.x + (next.x - curr.x) * 0.5;
        const cp1y = curr.y;
        const cp2x = curr.x + (next.x - curr.x) * 0.5;
        const cp2y = next.y;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
      }
      return d;
    };

    const pointsStr = getCurvePath(linePoints);
    const areaStr =
      ptsSorted.length > 0
        ? `${getCurvePath(ptsSorted)} L 100,60 L 0,60 Z`
        : "";

    return {
      points: pointsStr,
      area: areaStr,
      trendPercent,
      min,
      max,
      history: ptsSorted, // Return all points for interaction
      startTime,
      timeRange,
      range,
    };
  }, [totalBalanceUSD, transactions]);

  // Expense Structure Logic for Pie Chart
  const expenseSummary = useMemo(() => {
    const expenses = transactions.filter(
      (t) => t.type === TransactionType.EXPENSE,
    );
    const totalUSD = expenses.reduce(
      (acc, t) => acc + t.normalizedAmountUSD,
      0,
    );

    const byCategory = expenses.reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.normalizedAmountUSD;
        return acc;
      },
      {} as Record<string, number>,
    );

    const structure = Object.entries(byCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([catId, amount]) => {
        const cat = CATEGORIES.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || "Other",
          icon: cat?.icon,
          color: cat?.color || "text-gray-500",
          bg: cat?.color ? cat.color.replace("text-", "bg-") : "bg-gray-500",
          amount,
          percent: totalUSD > 0 ? ((amount as number) / totalUSD) * 100 : 0,
        };
      });

    return { structure, totalUSD };
  }, [transactions]);

  const getWidgetProps = (id: WidgetId) => {
    switch (id) {
       case 'balanceCard':
         return {
           totalBalanceUSD,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           trendPercent: balanceHistory.trendPercent,
           points: balanceHistory.points,
           area: balanceHistory.area,
           onToggleDisplayCurrency,
           onTogglePrivacy: handlePrivacyToggle,
           t
         };
       case 'converter':
         return {
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           lang: userProfile.language,
           onToggleBottomNav
         };
       case 'balanceChart':
         return {
           type: balanceChartType,
           setType: setBalanceChartType,
           history: balanceHistory.history,
           lang: userProfile.language,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           t
         };
       case 'wallets':
         return {
           accounts,
           isBalanceVisible,
           onNavigate,
           t
         };
       case 'expenses':
         return {
           type: expenseChartType,
           setType: setExpenseChartType,
           transactions,
           expenseSummary,
           selectedCategory,
           setSelectedCategory,
           lang: userProfile.language,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           onNavigate,
           t
         };
       case 'forecastCard':
         return {
           forecast,
           runwayDays,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           t
         };
       case 'transactions':
         return {
           transactions,
           groupedTransactions,
           accounts,
           userProfile,
           isBalanceVisible,
           displayCurrency,
           onNavigate,
           onEditTransaction,
           onDeleteTransaction,
           setSelectedTx,
           t
         };
       case 'fiscalSummary':
         return {
           fiscalMetrics,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           onNavigate,
           t
         };
       case 'incomeVsExpense':
         return {
           transactions,
           lang: userProfile.language,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           onNavigate,
           t
         };
       case 'dailySpending':
         return {
           transactions,
           lang: userProfile.language,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           t
         };
       case 'categoryBreakdown':
         return {
           transactions,
           lang: userProfile.language,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           t
         };
       case 'goals':
         return {
           goals: goals,
           exchangeRate,
           euroRate: userProfile.rateType === 'PARALLEL' ? (euroRateParallel || euroRate) : euroRate,
           displayCurrency,
           isBalanceVisible,
           onNavigate,
           t
         };
       default:
         return {};
    }
  };

  const getWidgetEnabled = (id: WidgetId) => {
    switch (id) {
       case 'balanceChart': return showBalanceChart;
       case 'expenses': return showExpenseStructure;
       case 'incomeVsExpense': return showIncomeVsExpense;
       case 'dailySpending': return showDailySpending;
       case 'categoryBreakdown': return showCategoryBreakdown;
       case 'forecastCard': return showForecastCard;
       case 'fiscalSummary': return showFiscalSummary;
       case 'goals': return showGoals;
       default: return true;
    }
  };



  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-theme-bg">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full max-w-7xl mx-auto md:px-8 overscroll-y-auto">
        <div className="flex justify-between items-center px-6 md:px-0 pt-12 pb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("PROFILE")}
              className="w-14 h-14 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center text-lg font-black text-theme-primary shadow-2xl cursor-pointer overflow-hidden"
            >
              {userProfile.profileImage ? (
                <img src={userProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userProfile.name.slice(0, 2).toUpperCase()
              )}
            </motion.div>
            <div className="flex flex-col">
              {isDevMode && !userProfile.hideDevMode && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="px-1.5 py-0.5 rounded-2xl bg-theme-brand/20 border border-theme-soft text-[8px] font-black text-theme-brand uppercase tracking-tighter animate-pulse">
                    {t('devMode') || 'DEV'}
                  </span>
                </div>
              )}
              {!userProfile.hideWelcome && (
                <p className="text-[10px] text-theme-secondary uppercase tracking-[0.15em] font-black opacity-60 mb-0.5">
                  {t("welcome_back") || "WELCOME BACK,"}
                </p>
              )}
              {!userProfile.hideName && (
                <p className="text-sm font-black text-theme-primary tracking-tight">
                  {userProfile.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse items-end gap-3">
            <div className="flex items-center gap-2">
              <motion.button
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
                 onClick={() => {
                   if (navigator.onLine && onSync) onSync();
                 }}
                 className={`w-10 h-10 rounded-full transition-all flex items-center justify-center relative bg-theme-surface border border-white/5 text-theme-secondary hover:text-theme-primary shadow-lg ${isSyncing ? 'animate-spin' : ''}`}
              >
                 {navigator.onLine ? <Cloud size={18} /> : <CloudOff size={18} className="opacity-50" />}
                 {syncPendingCount > 0 && (
                   <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 bg-orange-500 border border-theme-bg rounded-full text-[8px] font-black text-white flex items-center justify-center shadow-lg">
                     {syncPendingCount}
                   </span>
                 )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCustomizer(true)}
                className="w-10 h-10 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-all flex items-center justify-center shadow-lg"
              >
                <Settings size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCheckUpdate}
                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center relative bg-theme-surface border border-white/5 text-theme-secondary hover:text-theme-primary shadow-lg ${needUpdate ? 'bg-theme-brand/20 text-theme-brand border-theme-brand/30' : ''}`}
              >
                {needUpdate ? <ArrowDownToLine size={18} /> : <RefreshCw size={18} />}
                {needUpdate && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-theme-bg rounded-full" />
                )}
              </motion.button>
            </div>

            <button
              onClick={onOpenSettings}
              className="bg-theme-surface/50 backdrop-blur-md border border-white/5 hover:border-theme-brand/20 transition-all px-5 py-3 rounded-2xl flex flex-col items-end gap-0.5 shadow-xl group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-emerald-400">
                    USD: {exchangeRate?.toFixed(2)} Bs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-blue-400">
                    EUR: {euroRate?.toFixed(2)} Bs
                </span>
              </div>
            </button>
          </div>
        </div>
        {/* Quick Actions Horizontal List */}
        <div className="px-6 md:px-0 mb-6 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] opacity-50">{t("quickActions") || "Acciones Rápidas"}</h3>
            <span className="text-[10px] text-theme-brand font-black uppercase tracking-tighter opacity-40">Slide →</span>
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x">
            {[
              { id: "TRANSACTIONS", label: t("transactions"), icon: <Receipt size={28} />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
              { id: "BUDGET", label: t("budget"), icon: <PieChart size={28} />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              { id: "SCHEDULED", label: t("scheduled"), icon: <Calendar1 size={28} />, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
              { id: "FISCAL_REPORT", label: t("fiscalReport"), icon: <FileText size={28} />, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
              { id: "ANALYSIS", label: t("analysis"), icon: <ChartArea size={28} />, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
              { id: "WALLET", label: t("wallet"), icon: <Wallet size={28} />, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
              { id: "GOALS", label: t("goals"), icon: <Trophy size={28} />, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
              { id: "INCOME", label: t("incomeView"), icon: <TrendingUp size={28} />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              { id: "CURRENCY_PERF", label: t("currency_perf"), icon: <ChartCandlestick size={28} />, color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
              { id: "HEATMAP", label: t("heatmap"), icon: <CalendarRange size={28} />, color: "bg-red-500/10 text-red-400 border-red-500/20" },
              { id: "SHOPPING_LIST", label: t("shoppingList"), icon: <ShoppingCart size={28} />, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
              { id: "INVOICES", label: t("invoices"), icon: <ImageIcon size={28} />, color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
              { id: "PROFILE", label: t("profile"), icon: <User size={28} />, color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => onNavigate(action.id as any)} 
                className="flex flex-col items-center gap-1.5 min-w-[95px] bg-theme-surface/50 backdrop-blur-sm p-2.5 hover:border-theme-brand/50 transition-all hover:bg-theme-surface active:scale-95 snap-start shadow-xl group"
              >
                <div className={`w-16 h-16 rounded-2xl ${action.color} border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>
                <span className="text-[9px] text-theme-secondary font-black uppercase tracking-tight text-center whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:mt-2">
          <Reorder.Group
            axis="y"
            values={leftOrder}
            onReorder={setLeftOrder}
            className="md:col-span-6 lg:col-span-5 flex flex-col gap-6"
          >
            {leftOrder.map((id, index) => {
              if (!getWidgetEnabled(id as WidgetId) || !WIDGET_REGISTRY[id as WidgetId]) return null;
              return (
                <Reorder.Item
                  key={id}
                  value={id}
                  dragListener={false}
                  dragControls={leftControls[index]}
                >
                  <WidgetWrapper
                    id={id as WidgetId}
                    onDragStart={(e) => leftControls[index].start(e)}
                    onSettingsClick={['balanceChart', 'expenses', 'incomeVsExpense', 'dailySpending', 'categoryBreakdown'].includes(id) ? () => setShowCustomizer(true) : undefined}
                    touched={touchedWidget === id}
                    onSelect={() => {
                        if (window.matchMedia("(max-width: 768px)").matches) {
                          setTouchedWidget(touchedWidget === id ? null : id);
                        }
                    }}
                  >
                    {WIDGET_REGISTRY[id as WidgetId](getWidgetProps(id as WidgetId))}
                  </WidgetWrapper>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>

          <Reorder.Group
            axis="y"
            values={rightOrder}
            onReorder={setRightOrder}
            className="md:col-span-6 lg:col-span-7 px-4 md:px-0 flex flex-col gap-6"
          >
            {rightOrder.map((id, index) => {
              if (!getWidgetEnabled(id as WidgetId) || !WIDGET_REGISTRY[id as WidgetId]) return null;
              return (
                <Reorder.Item
                  key={id}
                  value={id}
                  dragListener={false}
                  dragControls={rightControls[index]}
                >
                  <WidgetWrapper
                    id={id as WidgetId}
                    onDragStart={(e) => rightControls[index].start(e)}
                    onSettingsClick={['balanceChart', 'expenses', 'incomeVsExpense', 'dailySpending', 'categoryBreakdown'].includes(id) ? () => setShowCustomizer(true) : undefined}
                    touched={touchedWidget === id}
                    onSelect={() => {
                        if (window.matchMedia("(max-width: 768px)").matches) {
                          setTouchedWidget(touchedWidget === id ? null : id);
                        }
                    }}
                  >
                    {WIDGET_REGISTRY[id as WidgetId](getWidgetProps(id as WidgetId))}
                  </WidgetWrapper>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>
      </div>

      {showCustomizer && (
        <DashboardCustomizer
          lang={userProfile.language}
          showBalanceChart={showBalanceChart}
          showExpenseStructure={showExpenseStructure}
          showIncomeVsExpense={showIncomeVsExpense}
          showDailySpending={showDailySpending}
          showCategoryBreakdown={showCategoryBreakdown}
          showForecastCard={showForecastCard}
          showFiscalSummary={showFiscalSummary}
          showGoals={showGoals}
          toggleWidget={toggleWidget}
          onClose={() => setShowCustomizer(false)}
          userProfile={userProfile}
          onUpdateProfile={onUpdateProfile}
          isDevMode={isDevMode}
        />
      )}

      {showPinModal && (
        <PinModal
          lang={userProfile.language}
          biometricsEnabled={biometricsEnabled}
          onVerifyBiometrics={onVerifyBiometrics}
          onSuccess={() => {
            setIsBalanceVisible(true);
            localStorage.setItem("isBalanceVisible", "true");
            closePinModal();
          }}
          onCancel={closePinModal}
        />
      )}

      <TransactionDetailModal
        transaction={selectedTx!}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={onEditTransaction}
        onUpdateTransaction={onUpdateTransaction}
        language={userProfile.language}
        exchangeRate={exchangeRate}
        displayCurrency={displayCurrency}
      />
    </div>
  );
};
