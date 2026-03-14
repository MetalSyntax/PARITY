import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowRightLeft, TrendingUp, PieChart, ArrowUpRight, Plus, Calendar1, CalendarRange, ChartArea, Eye, EyeOff, Lock, X, Settings, ChartCandlestick, User, Activity, ChevronRight, TrendingDown, Layout, Receipt, BarChart, Shield, Wallet, GripVertical, Coins, DollarSign, RefreshCw, ArrowDownToLine, Fingerprint, Delete } from "lucide-react";
import { motion, Reorder, useDragControls, AnimatePresence } from "framer-motion";
import { Transaction, Account, Currency, UserProfile, TransactionType } from "../types";
import { CATEGORIES } from "../constants";
import { getTranslation } from "../i18n";
import { TransactionDetailModal } from "../components/TransactionDetailModal";
import { PinModal } from "../components/PinModal";
import { TransactionItem } from "../components/TransactionItem";
import { CurrencyConverter } from "../components/CurrencyConverter";
import { DashboardCustomizer } from "../components/DashboardCustomizer";
import { CurrencyAmount } from "../components/CurrencyAmount";
import { formatAmount, formatSecondaryAmount } from "../utils/formatUtils";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler } from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { tailwindToHex, commonOptions } from "../utils/chartUtils";
import { renderAccountIcon } from "../utils/iconUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
);


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
  euroRateParallel
}) => {

  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [balanceChartType, setBalanceChartType] = useState<'LINE' | 'BAR'>('LINE');
  const [expenseChartType, setExpenseChartType] = useState<'DOUGHNUT' | 'BAR'>('DOUGHNUT');
  const [hoveredPoint, setHoveredPoint] = useState<{
    timestamp: number;
    balance: number;
  } | null>(null);


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

  // Widget Order persistence
  const [leftOrder, setLeftOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("dash_left_order");
    const parsed = saved ? JSON.parse(saved) : ["balanceCard", "converter", "balanceChart", "wallets", "actions", "expenses"];
    if (!parsed.includes('converter')) {
        parsed.splice(1, 0, 'converter');
    }
    return parsed;
  });

  const [rightOrder, setRightOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("dash_right_order");
    return saved ? JSON.parse(saved) : ["transactions", "incomeVsExpense", "dailySpending", "categoryBreakdown"];
  });

  const [touchedWidget, setTouchedWidget] = useState<string | null>(null);

  const leftControls = leftOrder.map(() => useDragControls());
  const rightControls = rightOrder.map(() => useDragControls());

  useEffect(() => {
    localStorage.setItem("dash_left_order", JSON.stringify(leftOrder));
  }, [leftOrder]);

  useEffect(() => {
    localStorage.setItem("dash_right_order", JSON.stringify(rightOrder));
  }, [rightOrder]);

  const toggleWidget = (
    widget: "balance" | "expense" | "incomeVs" | "category" | "daily",
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

  const formatChartValue = (usd: number) => {
    if (displayCurrency === Currency.VES) return usd * exchangeRate;
    if (displayCurrency === Currency.EUR) return (usd * exchangeRate) / (euroRate || 1);
    return usd;
  };

  const getSymbol = () => {
    if (displayCurrency === Currency.VES) return "Bs.";
    if (displayCurrency === Currency.EUR) return "€";
    return "$";
  };

  const formatChartAmount = (usd: number) => {
    if (!isBalanceVisible) return '******';
    return formatAmount(usd, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate);
  };

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

  const chartRef = useRef<HTMLDivElement>(null);

  const handleChartInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!balanceHistory.history.length || !chartRef.current) return;

    // Check if we are interacting with the chart area
    const rect = chartRef.current.getBoundingClientRect();
    let clientX;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const width = rect.width;
    const xPercent = (x / width) * 100;

    const targetTs =
      (xPercent / 100) * balanceHistory.timeRange + balanceHistory.startTime;

    // Find closest point
    let closest = balanceHistory.history[0];
    let minDiff = Math.abs(targetTs - closest.timestamp);

    for (let i = 1; i < balanceHistory.history.length; i++) {
      const diff = Math.abs(targetTs - balanceHistory.history[i].timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = balanceHistory.history[i];
      }
    }
    setHoveredPoint(closest);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-theme-bg">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full max-w-7xl mx-auto md:px-8 overscroll-y-auto">
        <div className="flex justify-between items-center px-6 md:px-0 pt-12 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex wrap items-center gap-3 group relative">
              <div 
                onClick={() => onNavigate("PROFILE")}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-theme-brand to-purple-500 border border-white/20 flex items-center justify-center text-sm font-bold text-white shadow-lg cursor-pointer hover:scale-105 transition-transform overflow-hidden"
              >
                {userProfile.profileImage ? (
                  <img src={userProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userProfile.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                {isDevMode && !userProfile.hideDevMode && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-theme-brand/20 border border-theme-soft text-[8px] font-black text-theme-brand uppercase tracking-tighter animate-pulse">
                      {t('devMode')}
                    </span>
                  </div>
                )}
                {!userProfile.hideWelcome && (
                  <p className="text-[10px] text-theme-secondary uppercase tracking-widest font-bold">
                    {t("welcome")}{(!userProfile.hideName && userProfile.name) ? `,` : ''}
                  </p>
                )}
                {!userProfile.hideName && (
                  <p className="text-sm font-black text-theme-primary">
                    {userProfile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
            onClick={() => setShowCustomizer(true)}
            className="p-2 bg-theme-soft rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <Settings size={20} />
          </button>
          
          <button
            onClick={onCheckUpdate}
            className={`p-2 rounded-full transition-all flex items-center justify-center relative ${needUpdate ? 'bg-theme-brand text-white shadow-lg shadow-theme-brand/20 animate-pulse' : 'bg-theme-soft text-theme-secondary hover:text-theme-primary'}`}
            title={needUpdate ? t('updateAvailable') : t('checkUpdates')}
          >
            {needUpdate ? <ArrowDownToLine size={20} /> : <RefreshCw size={20} />}
            {needUpdate && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-theme-bg rounded-full" />
            )}
          </button>
            <button
              onClick={onOpenSettings}
              className="bg-theme-soft border border-theme-soft hover:bg-theme-soft transition-colors px-4 py-2 rounded-2xl flex items-center gap-3"
            >
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-emerald-500 leading-tight">USD: {exchangeRate?.toFixed(2)}</span>
                <span className="text-[10px] font-black text-blue-400 leading-tight">EUR: {euroRate?.toFixed(2)}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-theme-brand/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-theme-brand" />
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:mt-6">
          <Reorder.Group
            axis="y"
            values={leftOrder}
            onReorder={setLeftOrder}
            className="md:col-span-6 lg:col-span-5 flex flex-col gap-6"
          >
            {leftOrder.map((id, index) => (
              <Reorder.Item
                key={id}
                value={id}
                dragListener={false}
                dragControls={leftControls[index]}
                className="relative group focus:outline-none"
                onClick={() => {
                  if (window.matchMedia("(max-width: 768px)").matches) {
                    setTouchedWidget(touchedWidget === id ? null : id);
                  }
                }}
              >
                <div 
                  onPointerDown={(e) => leftControls[index].start(e)}
                  className={`absolute top-2 right-2 transition-opacity z-50 cursor-grab active:cursor-grabbing p-2.5 bg-theme-surface/90 backdrop-blur-md rounded-xl border border-theme-soft text-theme-secondary flex touch-none shadow-xl ${touchedWidget === id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
                >
                  <GripVertical size={20} />
                </div>
                {['balanceChart', 'expenses', 'incomeVsExpense', 'dailySpending', 'categoryBreakdown'].includes(id) && (
                  <button 
                    onClick={() => setShowCustomizer(true)}
                    className={`absolute bottom-2 right-2 transition-opacity z-50 p-2.5 bg-theme-surface/90 backdrop-blur-md rounded-xl border border-theme-soft text-theme-secondary flex touch-none shadow-xl ${touchedWidget === id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
                  >
                    <Settings size={20} />
                  </button>
                )}
                {id === "balanceCard" && (
                  <div className="px-4 md:px-0">
                    <div className="bg-theme-surface rounded-[2.5rem] p-8 relative overflow-hidden active:scale-[0.99] transition-all duration-300 shadow-theme border border-theme-soft bg-gradient-to-br from-theme-surface to-theme-bg group">
                      <div className="absolute top-8 right-8 flex gap-3 z-20">
                         <button
                          onClick={(e) => { e.stopPropagation(); onToggleDisplayCurrency(); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-theme-soft transition-all font-black text-[10px] ${displayCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-bg text-theme-secondary hover:text-theme-primary'}`}
                        >
                          {displayCurrency === Currency.VES ? <Coins size={14} /> : displayCurrency === Currency.EUR ? <RefreshCw size={14} /> : <DollarSign size={14} />}
                          <span className="hidden sm:inline">{displayCurrency}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrivacyToggle(e); }}
                          className="p-2.5 rounded-xl bg-theme-bg border border-theme-soft text-theme-secondary hover:text-theme-brand transition-all shadow-sm"
                        >
                          {isBalanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>

                      {/* Chart Background */}
                      <div className="absolute inset-x-0 bottom-0 h-32 opacity-20 pointer-events-none">
                        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                          <defs>
                            <linearGradient id="cardTrendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor={balanceHistory.trendPercent >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.4" />
                              <stop offset="100%" stopColor={balanceHistory.trendPercent >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <motion.path
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            d={balanceHistory.points}
                            fill="none"
                            stroke={balanceHistory.trendPercent >= 0 ? '#10b981' : '#f43f5e'}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <motion.path
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            d={balanceHistory.area}
                            fill="url(#cardTrendGradient)"
                          />
                        </svg>
                      </div>

                      <div className="cursor-pointer relative z-10">
                        <p className="text-xs text-theme-secondary font-black uppercase tracking-widest mb-2 opacity-60">
                          {t("totalBalance")}
                        </p>
                        <div className="flex flex-col gap-1 mb-2">
                          <h1 className="text-5xl font-black tracking-tighter text-theme-primary leading-tight">
                            <CurrencyAmount
                                    amount={totalBalanceUSD}
                                    exchangeRate={exchangeRate}
                                    euroRate={euroRate}
                                    displayCurrency={displayCurrency}
                                    isBalanceVisible={isBalanceVisible}
                                    size="2xl"
                                    weight="black"
                                    className="items-start"
                                />
                          </h1>
                          <div className="flex items-center gap-3">
                             <span className="text-theme-secondary font-mono text-xs font-bold px-2 py-1 bg-theme-soft rounded-lg border border-theme-soft">
                              <CurrencyAmount
                                amount={totalBalanceUSD}
                                exchangeRate={exchangeRate}
                                euroRate={euroRate}
                                displayCurrency={displayCurrency}
                                isBalanceVisible={isBalanceVisible}
                                showSecondary={true}
                                size="xs"
                                weight="bold"
                                className="items-start"
                              />
                            </span>
                            {isBalanceVisible && (
                              <div className={`p-1 flex items-center gap-1 rounded-full text-[10px] font-black ${balanceHistory.trendPercent >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                                {balanceHistory.trendPercent >= 0 ? <ArrowUpRight size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(balanceHistory.trendPercent || 0)?.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {id === "balanceChart" && showBalanceChart && (
                  <div className="px-4 md:px-0">
                    <div className="bg-theme-surface p-6 rounded-[2rem] border border-theme-soft shadow-theme relative overflow-hidden group">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Activity size={14} className="text-theme-brand" />
                            <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("balanceHistory")}</h3>
                          </div>
                          <div className="flex bg-theme-soft p-1 mr-5 rounded-lg border border-theme-soft">
                            <button onClick={() => setBalanceChartType('LINE')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${balanceChartType === 'LINE' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary'}`}>{t('line')}</button>
                            <button onClick={() => setBalanceChartType('BAR')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${balanceChartType === 'BAR' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary'}`}>{t('bar')}</button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-theme-secondary px-2 py-1 bg-theme-soft rounded-lg">7D</span>
                        </div>
                      </div>
                      <div className="h-48 w-full">
                        {balanceChartType === 'LINE' ? (
                          <Line data={{ labels: balanceHistory.history.map((h) => new Date(h.timestamp).toLocaleDateString(undefined, { weekday: "short" })), datasets: [{ data: balanceHistory.history.map((h) => h.balance), borderColor: "#6366f1", backgroundColor: (context) => { const ctx = context.chart.ctx; const gradient = ctx.createLinearGradient(0, 0, 0, 300); gradient.addColorStop(0, "rgba(99,102,241, 0.4)"); gradient.addColorStop(1, "rgba(99,102,241, 0)"); return gradient; }, fill: true, tension: 0.4, pointRadius: 0 }] }} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, tooltip: { ...commonOptions.plugins.tooltip, callbacks: { label: (context) => formatAmount(context.raw as number, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate) } } }, scales: { x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } }, y: { display: false } } }} />
                        ) : (
                          <Bar data={{ labels: balanceHistory.history.map((h) => new Date(h.timestamp).toLocaleDateString(undefined, { weekday: "short" })), datasets: [{ data: balanceHistory.history.map((h) => formatChartValue(h.balance)), backgroundColor: 'rgba(99, 102, 241, 0.6)', borderRadius: 4 }] }} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, tooltip: { ...commonOptions.plugins.tooltip, callbacks: { label: (context) => formatAmount(context.parsed.y, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate) } } }, scales: { x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } }, y: { display: false } } }} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {id === "converter" && (
                  <div className="px-4 md:px-0">
                    <CurrencyConverter 
                      exchangeRate={exchangeRate} 
                      euroRate={euroRate}
                      lang={userProfile.language} 
                      onToggleBottomNav={onToggleBottomNav} 
                    />
                  </div>
                )}

                {id === "wallets" && (
                  <div className="px-4 md:px-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t("wallet")}</h3>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {accounts.map((acc) => (
                        <div key={acc.id} className="min-w-[140px] bg-theme-surface border border-theme-soft p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="text-xl text-theme-primary">{renderAccountIcon(acc.icon, 20)}</div>
                            <span className="text-[10px] bg-theme-soft px-1.5 py-0.5 rounded text-theme-secondary">{acc.currency}</span>
                          </div>
                          <div>
                            <p className="text-theme-primary font-bold text-sm">{isBalanceVisible ? acc.balance?.toLocaleString() : "****"}</p>
                            <p className="text-theme-secondary text-xs truncate">{acc.name}</p>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => onNavigate("WALLET")} className="min-w-[50px] bg-theme-soft border border-theme-soft rounded-xl flex items-center justify-center text-theme-secondary hover:text-theme-primary hover:shadow-md transition-colors"><Plus size={20} /></button>
                    </div>
                  </div>
                )}

                {id === "actions" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-6 md:px-0">
                    {[
                      { id: "TRANSACTIONS", label: t("transactions"), icon: <Receipt size={20} />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                      { id: "BUDGET", label: t("budget"), icon: <PieChart size={20} />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                      { id: "SCHEDULED", label: t("scheduled"), icon: <Calendar1 size={20} />, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
                      { id: "ANALYSIS", label: t("analysis"), icon: <ChartArea size={20} />, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
                      { id: "WALLET", label: t("wallet"), icon: <Wallet size={20} />, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
                      { id: "CURRENCY_PERF", label: t("currency_perf"), icon: <ChartCandlestick size={20} />, color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
                      { id: "HEATMAP", label: t("heatmap"), icon: <CalendarRange size={20} />, color: "bg-red-500/10 text-red-400 border-red-500/20" },
                      { id: "PROFILE", label: t("profile"), icon: <User size={20} />, color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
                    ].map((action, i) => (
                      <button key={i} onClick={() => onNavigate(action.id as any)} className="flex flex-col items-center gap-2 group w-full bg-theme-surface py-4 rounded-2xl border border-theme-soft hover:border-theme-soft transition-all hover:shadow-theme active:scale-95 shadow-sm">
                        <div className={`w-12 h-12 rounded-xl ${action.color} border flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>{action.icon}</div>
                        <span className="text-xs text-theme-secondary font-medium">{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {id === "expenses" && showExpenseStructure && (
                  <div className="bg-theme-surface p-8 mx-6 rounded-[2rem] border border-theme-soft shadow-theme animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden relative">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <div className="flex items-center gap-4 mb-1">
                          <div className="flex items-center gap-2">
                            <PieChart size={14} className="text-theme-brand" />
                            <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("structure")}</h3>
                          </div>
                          <div className="flex bg-theme-soft p-1 mr-5 rounded-lg border border-theme-soft">
                            <button onClick={() => setExpenseChartType('DOUGHNUT')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${expenseChartType === 'DOUGHNUT' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary'}`}>{t('pie')}</button>
                            <button onClick={() => setExpenseChartType('BAR')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${expenseChartType === 'BAR' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary'}`}>{t('bar')}</button>
                          </div>
                        </div>
                        <h2 className="text-2xl font-black text-theme-primary">
                          {isBalanceVisible ? (
                            <>
                              <CurrencyAmount
                                amount={expenseSummary.totalUSD}
                                exchangeRate={exchangeRate}
                                euroRate={euroRate}
                                displayCurrency={displayCurrency}
                                isBalanceVisible={isBalanceVisible}
                                showSecondary={true}
                                size="lg"
                                weight="black"
                                className="items-start"
                              />
                            </>
                          ) : "******"}
                          <span className="text-xs text-theme-secondary ml-2 font-bold uppercase tracking-widest opacity-40">{t("totalExpenses")}</span>
                        </h2>
                      </div>
                      <button onClick={() => onNavigate("ANALYSIS")} className="bg-theme-soft p-2 rounded-xl text-theme-secondary hover:text-theme-brand transition-all border border-theme-soft">
                        <ArrowUpRight size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="flex justify-center relative group h-48 w-48 mx-auto xl:mx-0">
                        {expenseChartType === 'DOUGHNUT' ? (
                          <Doughnut 
                            data={{
                              labels: expenseSummary.structure.map(s => t(s.name)),
                              datasets: [{
                                data: expenseSummary.structure.map(s => formatChartValue(s.amount)),
                                backgroundColor: expenseSummary.structure.map(s => {
                                  const baseColor = tailwindToHex(s.color);
                                  return (selectedCategory && selectedCategory !== s.id) ? baseColor + '40' : baseColor;
                                }),
                                borderWidth: 0,
                                hoverOffset: 10
                              }]
                            }}
                            options={{
                              ...commonOptions,
                              cutout: '80%',
                              onClick: (_, elements) => {
                                if (elements.length > 0) {
                                  const index = elements[0].index;
                                  const catId = expenseSummary.structure[index].id;
                                  setSelectedCategory(prev => prev === catId ? null : catId);
                                } else {
                                  setSelectedCategory(null);
                                }
                              },
                              plugins: {
                                ...commonOptions.plugins,
                                tooltip: {
                                  ...commonOptions.plugins.tooltip,
                                  callbacks: {
                                    label: (context: any) => `${context.label}: ${formatAmount(context.raw, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}`
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Bar 
                            data={{
                                labels: expenseSummary.structure.slice(0, 5).map(s => t(s.name)),
                                datasets: [{
                                    data: expenseSummary.structure.slice(0, 5).map(s => formatChartValue(s.amount)),
                                    backgroundColor: expenseSummary.structure.slice(0, 5).map(s => tailwindToHex(s.color)),
                                    borderRadius: 6,
                                }]
                            }}
                            options={{
                                ...commonOptions,
                                indexAxis: 'y' as const,
                                plugins: {
                                    ...commonOptions.plugins,
                                    tooltip: {
                                        ...commonOptions.plugins.tooltip,
                                         callbacks: { label: (context: any) => `${context.label}: ${formatAmount(context.parsed.x, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}` }
                                    }
                                },
                                scales: {
                                    x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                                    y: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#e4e4e7", font: { size: 10 } } }
                                }
                            }}
                          />
                        )}
                        {expenseChartType === 'DOUGHNUT' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-center">
                              <p className="text-xs font-black text-theme-secondary uppercase tracking-widest opacity-40">{t("topSpend")}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-3">
                        {expenseSummary.structure.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedCategory === item.id ? 'bg-theme-bg border-theme-soft shadow-lg ' + item.color : 'bg-theme-soft border-theme-soft hover:border-theme-soft text-theme-secondary'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                                {item.icon}
                              </div>
                              <span className="text-xs font-bold">{t(item.name as any)}</span>
                            </div>
                             <div className="text-right">
                               <CurrencyAmount
                                 amount={item.amount}
                                 exchangeRate={exchangeRate}
                                 euroRate={euroRate}
                                 displayCurrency={displayCurrency}
                                 isBalanceVisible={isBalanceVisible}
                                 size="xs"
                                 weight="black"
                               />
                               <p className="text-[9px] font-bold opacity-40">{item.percent?.toFixed(1)}%</p>
                             </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <Reorder.Group
            axis="y"
            values={rightOrder}
            onReorder={setRightOrder}
            className="md:col-span-6 lg:col-span-7 px-4 md:px-0 flex flex-col gap-6"
          >
            {rightOrder.map((id, index) => (
              <Reorder.Item
                key={id}
                value={id}
                dragListener={false}
                dragControls={rightControls[index]}
                className="relative group focus:outline-none"
                onClick={() => {
                  if (window.matchMedia("(max-width: 768px)").matches) {
                    setTouchedWidget(touchedWidget === id ? null : id);
                  }
                }}
              >
                <div 
                  onPointerDown={(e) => rightControls[index].start(e)}
                  className={`absolute top-2 right-2 transition-opacity z-50 cursor-grab active:cursor-grabbing p-2.5 bg-theme-bg/90 rounded-xl border border-theme-soft text-theme-secondary flex touch-none ${touchedWidget === id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
                >
                  <GripVertical size={20} />
                </div>
                {['balanceChart', 'expenses', 'incomeVsExpense', 'dailySpending', 'categoryBreakdown'].includes(id) && (
                  <button 
                    onClick={() => setShowCustomizer(true)}
                    className={`absolute bottom-2 right-2 transition-opacity z-50 p-2.5 bg-theme-bg/90 rounded-xl border border-theme-soft text-theme-secondary flex touch-none ${touchedWidget === id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
                  >
                    <Settings size={20} />
                  </button>
                )}

                {id === "transactions" && (
                  <div className="bg-theme-surface/50 md:bg-theme-surface rounded-3xl md:p-6 md:border border-theme-soft min-h-[500px]">
                    <h2 className="text-sm font-semibold text-theme-secondary mb-6 px-2 md:px-0 uppercase tracking-wider">{t("recentTransactions")}</h2>
                    {transactions.length === 0 ? (
                      <div className="text-center py-20 text-theme-secondary text-sm">{t("noTransactions")}</div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {(() => {
                          let count = 0;
                          const MAX_ITEMS = userProfile.dashboardTxLimit || 5;
                          const sortedDates = Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
                          return (
                            <>
                              {sortedDates.map(date => {
                                if (count >= MAX_ITEMS) return null;
                                const dayTransactions = groupedTransactions[date].sort((a,b) => (b.id || '').localeCompare(a.id || ''));
                                const itemsToRender = [];
                                for (const t of dayTransactions) {
                                  if (count < MAX_ITEMS) { itemsToRender.push(t); count++; }
                                }
                                if (itemsToRender.length === 0) return null;
                                return (
                                  <div key={date}>
                                    <h3 className="text-xs font-bold text-zinc-500 sticky top-0 bg-background/95 backdrop-blur-sm bg-transparent py-2 px-2 z-10">
                                      {(() => {
                                        const dateObj = new Date(`${date}T12:00:00`);
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        return date === todayStr ? t('today') : dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                                      })()}
                                    </h3>
                                    <div className="flex flex-col gap-2 mt-1">
                                      {itemsToRender.map(transaction => (
                                        <TransactionItem 
                                          key={transaction.id}
                                          transaction={transaction}
                                          accounts={accounts}
                                          lang={userProfile.language}
                                          isBalanceVisible={isBalanceVisible}
                                          displayCurrency={displayCurrency}
                                          onSelect={setSelectedTx}
                                          onEdit={onEditTransaction}
                                          onDelete={onDeleteTransaction}
                                          compact={true}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                              {transactions.length > (userProfile.dashboardTxLimit || 5) && (
                                <button onClick={() => onNavigate('TRANSACTIONS')} className="w-full py-4 text-center text-sm font-bold text-theme-brand hover:text-theme-primary transition-colors border-t border-theme-soft mt-2">{t('viewMore')}</button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
                {id === "incomeVsExpense" && showIncomeVsExpense && (
                  <div className="bg-theme-surface/50 md:bg-theme-surface rounded-3xl md:p-6 md:border border-theme-soft min-h-[500px]">
                    <div className="flex items-center justify-between mb-6 px-4 md:px-0">
                      <h3 className="text-sm font-black text-theme-primary uppercase tracking-widest flex items-center gap-3">
                        <ArrowRightLeft size={16} className="text-theme-brand" /> {t('incomeVsExpenses')}
                      </h3>
                      <button onClick={() => onNavigate('TRANSACTIONS')} className="p-2 bg-theme-soft rounded-lg text-theme-secondary hover:text-theme-brand transition-all">
                        <Settings size={14} />
                      </button>
                    </div>
                    <div className="h-48">
                      <Bar 
                        data={{
                          labels: [t("income"), t("expense"), t("netCashFlow")],
                          datasets: [{
                            data: [
                              transactions.filter(t => t.type === TransactionType.INCOME).reduce((a,c) => a+formatChartValue(c.normalizedAmountUSD),0),
                              transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a,c) => a+formatChartValue(c.normalizedAmountUSD),0),
                              transactions.reduce((a,c) => a + (c.type === TransactionType.INCOME ? formatChartValue(c.normalizedAmountUSD) : -formatChartValue(c.normalizedAmountUSD)), 0)
                            ],
                            backgroundColor: ['rgba(52, 211, 153, 0.7)', 'rgba(248, 113, 113, 0.7)', 'rgba(96, 165, 250, 0.7)'],
                            borderRadius: 12,
                            barThickness: 30,
                          }]
                        }} 
                        options={{
                          ...commonOptions,
                          plugins: {
                              ...commonOptions.plugins,
                              tooltip: {
                                  ...commonOptions.plugins.tooltip,
                                  callbacks: { label: (context: any) => `${context.label}: ${getSymbol()}${context.raw?.toLocaleString()}` }
                              }
                          },
                          scales: {
                              x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                              y: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } }
                          }
                        }} 
                      />
                    </div>
                  </div>
                )}

                {id === "dailySpending" && showDailySpending && (
                  <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl group relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t("dailySpending")}</h3>
                    </div>
                    <div className="h-48">
                      <Line 
                        data={{
                          labels: Array.from({length: 7}, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6-i));
                            return d.toLocaleDateString(undefined, { weekday: 'short' });
                          }),
                          datasets: [{
                            label: t('dailySpending'),
                            data: Array.from({length: 7}, (_, i) => {
                                const d = new Date();
                                d.setDate(d.getDate() - (6-i));
                                const dateStr = d.toISOString().split('T')[0];
                                return transactions.filter(t => t.date.startsWith(dateStr) && t.type === TransactionType.EXPENSE).reduce((a,c) => a + formatChartValue(c.normalizedAmountUSD), 0);
                            }),
                            borderColor: "#fb923c",
                            backgroundColor: (context) => {
                                const ctx = context.chart.ctx;
                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                gradient.addColorStop(0, "rgba(251,146,60, 0.3)");
                                gradient.addColorStop(1, "rgba(251,146,60, 0)");
                                return gradient;
                            },
                            tension: 0.4,
                            fill: true,
                            pointRadius: 4,
                            pointBackgroundColor: "#fb923c",
                          }]
                        }} 
                        options={{
                          ...commonOptions,
                          plugins: {
                              ...commonOptions.plugins,
                              tooltip: {
                                  ...commonOptions.plugins.tooltip,
                                   callbacks: { label: (context: any) => `${context.dataset.label}: ${formatAmount(context.raw, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}` }
                              }
                          },
                          scales: {
                              x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                              y: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } }
                          }
                        }} 
                      />
                    </div>
                  </div>
                )}

                {id === "categoryBreakdown" && showCategoryBreakdown && (
                  <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl group relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t("categoryBreakdown")}</h3>
                    </div>
                    <div className="h-48">
                      <Bar 
                        data={{
                          labels: expenseSummary.structure.slice(0, 5).map(s => t(s.name)),
                          datasets: [{
                            data: expenseSummary.structure.slice(0, 5).map(s => formatChartValue(s.amount)),
                            backgroundColor: expenseSummary.structure.slice(0, 5).map(s => tailwindToHex(s.color) + 'CC'),
                            borderRadius: 8,
                          }]
                        }} 
                        options={{
                          ...commonOptions,
                          indexAxis: 'y' as const,
                          plugins: {
                              ...commonOptions.plugins,
                              tooltip: {
                                  ...commonOptions.plugins.tooltip,
                                  callbacks: { label: (context: any) => `${context.label}: ${getSymbol()}${context.raw?.toLocaleString()}` }
                              }
                          },
                          scales: {
                              x: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                              y: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#e4e4e7", font: { size: 10 } } }
                          }
                        }} 
                      />
                    </div>
                  </div>
                )}
              </Reorder.Item>
            ))}
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
          toggleWidget={toggleWidget}
          onClose={() => setShowCustomizer(false)}
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
        language={userProfile.language}
        exchangeRate={exchangeRate}
        displayCurrency={displayCurrency}
      />
    </div>
  );
};
