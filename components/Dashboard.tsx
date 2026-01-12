import React, { useState, useMemo } from "react";
import {
  ArrowRightLeft,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  Plus,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  X,
  Settings,
  Activity,
  ChevronRight,
  TrendingDown,
  Layout,
  Receipt
} from "lucide-react";
import {
  Transaction,
  Account,
  Currency,
  UserProfile,
  TransactionType,
} from "../types";
import { CATEGORIES } from "../constants";
import { getTranslation } from "../i18n";
import {
  FaWallet,
  FaBuildingColumns,
  FaCreditCard,
  FaMoneyBillWave,
  FaBitcoin,
  FaPaypal,
  FaCcVisa,
  FaCcMastercard,
  FaMobileScreen,
  FaPiggyBank,
} from "react-icons/fa6";

// Icon Map for Financial Services
const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  wallet: FaWallet,
  bank: FaBuildingColumns,
  card: FaCreditCard,
  visa: FaCcVisa,
  mastercard: FaCcMastercard,
  cash: FaMoneyBillWave,
  crypto: FaBitcoin,
  paypal: FaPaypal,
  mobile: FaMobileScreen,
  savings: FaPiggyBank,
};

// Helper to render icon safely
const renderAccountIcon = (iconKey: string, size: number = 24) => {
  const IconComponent = ACCOUNT_ICONS[iconKey];
  if (IconComponent) return <IconComponent size={size} />;
  return <span style={{ fontSize: size }}>{iconKey}</span>;
};

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  exchangeRate: number;
  onOpenSettings: () => void;
  onNavigate: (view: any) => void;
  userProfile: UserProfile;
  onEditTransaction: (t: Transaction) => void;
  onToggleBottomNav: (visible: boolean) => void;
  isBalanceVisible: boolean;
  setIsBalanceVisible: (visible: boolean) => void;
  onDeleteTransaction: (id: string) => void;
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
}) => {
  const [primaryCurrency, setPrimaryCurrency] = useState<Currency>(
    Currency.USD
  );
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  // Widget Visibility
  const [showBalanceChart, setShowBalanceChart] = useState(() => {
    const saved = localStorage.getItem("dash_show_balance_chart");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showExpenseStructure, setShowExpenseStructure] = useState(() => {
    const saved = localStorage.getItem("dash_show_expense_structure");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleWidget = (widget: 'balance' | 'expense') => {
    if (widget === 'balance') {
      const next = !showBalanceChart;
      setShowBalanceChart(next);
      localStorage.setItem("dash_show_balance_chart", JSON.stringify(next));
    } else {
      const next = !showExpenseStructure;
      setShowExpenseStructure(next);
      localStorage.setItem("dash_show_expense_structure", JSON.stringify(next));
    }
  };

  // Get PIN from storage or default
  const getStoredPin = () => localStorage.getItem("dualflow_pin") || "0000";

  const t = (key: any) => getTranslation(userProfile.language, key);

  // Calculate Total Balance
  const totalBalanceUSD = useMemo(() => {
    return accounts.reduce((acc, account) => {
      let val = account.balance;
      if (account.currency === Currency.VES)
        val = account.balance / exchangeRate;
      return acc + val;
    }, 0);
  }, [accounts, exchangeRate]);

  const totalBalanceVES = totalBalanceUSD * exchangeRate;

  const displayMain =
    primaryCurrency === Currency.USD ? totalBalanceUSD : totalBalanceVES;
  const displaySecondary =
    primaryCurrency === Currency.USD ? totalBalanceVES : totalBalanceUSD;
  const symbolMain = primaryCurrency === Currency.USD ? "$" : "Bs.";
  const symbolSecondary = primaryCurrency === Currency.USD ? "Bs." : "$";

  const toggleCurrency = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPrimaryCurrency((prev) =>
      prev === Currency.USD ? Currency.VES : Currency.USD
    );
  };

  const handlePrivacyToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBalanceVisible) {
      setIsBalanceVisible(false);
      localStorage.setItem("isBalanceVisible", "false");
    } else {
      setShowPinModal(true);
      onToggleBottomNav(false);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    onToggleBottomNav(true);
    setPinInput("");
    setPinError(false);
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        // Auto verify on 4th digit
        if (newPin === getStoredPin()) {
          setIsBalanceVisible(true);
          localStorage.setItem("isBalanceVisible", "true");
          closePinModal();
        } else {
          // Small delay to show last dot then error
          setTimeout(() => {
            setPinError(true);
            setPinInput("");
          }, 200);
        }
      }
    }
  };

  // Group transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((t) => {
      const date = t.date.split('T')[0]; // Use stable ISO date string YYYY-MM-DD
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }, [transactions]);

  // Historical Balance Calculation (Last 7 Days)
  const balanceHistory = useMemo(() => {
    const days = 7;
    const history = [];
    let currentBal = totalBalanceUSD;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];
        
        history.unshift({
            date: isoDate,
            balance: currentBal
        });

        // For next iteration (going back in time):
        // Subtract income from that day, add expenses from that day
        const dayT = transactions.filter(t => t.date.startsWith(isoDate));
        dayT.forEach(t => {
            if (t.type === TransactionType.INCOME) currentBal -= t.normalizedAmountUSD;
            if (t.type === TransactionType.EXPENSE) currentBal += t.normalizedAmountUSD;
        });
    }

    const values = history.map(h => h.balance);
    const min = Math.min(...values) * 0.95;
    const max = Math.max(...values) * 1.05;
    const range = max - min || 1;
    
    // Trend percentage
    const first = values[0];
    const last = values[values.length - 1];
    const trendPercent = first !== 0 ? ((last - first) / first) * 100 : 0;

    const points = history.map((h, i) => {
        const x = (i / (days - 1)) * 100;
        const y = 60 - ((h.balance - min) / range) * 60;
        return `${x},${y}`;
    }).join(" ");

    return { points, trendPercent, min, max, history };
  }, [totalBalanceUSD, transactions]);

  // Expense Structure Logic for Pie Chart
  const expenseSummary = useMemo(() => {
    const expenses = transactions.filter(
      (t) => t.type === TransactionType.EXPENSE
    );
    const totalUSD = expenses.reduce((acc, t) => acc + t.normalizedAmountUSD, 0);

    const byCategory = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.normalizedAmountUSD;
      return acc;
    }, {} as Record<string, number>);

    const structure = Object.entries(byCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([catId, amount]) => {
        const cat = CATEGORIES.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || "Other",
          icon: cat?.icon,
          color: cat?.color || "text-gray-500",
          bg: cat?.color.replace("text-", "bg-") || "bg-gray-500",
          amount,
          percent: totalUSD > 0 ? ((amount as number) / totalUSD) * 100 : 0,
        };
      });

    return { structure, totalUSD };
  }, [transactions]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-theme-bg">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full max-w-7xl mx-auto md:px-8">
        <div className="flex justify-between items-center px-6 md:px-0 pt-12 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div
                className="flex wrap items-center gap-3 cursor-pointer group"
                onClick={() => onNavigate("PROFILE")}
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-theme-brand to-purple-500 border border-white/20 flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
                {userProfile.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                <p className="text-[10px] text-theme-secondary uppercase tracking-widest font-bold">{t("welcome")}</p>
                <p className="text-sm font-black text-theme-primary">
                    {userProfile.name}
                </p>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
                onClick={() => setShowCustomizer(true)}
                className="p-2.5 bg-theme-surface border border-white/5 rounded-xl text-theme-secondary hover:text-theme-brand transition-all"
            >
                <Layout size={18} />
            </button>
            <button
                onClick={onOpenSettings}
                className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors px-3 py-1.5 rounded-full flex items-center gap-2"
            >
                <span className="text-xs font-mono text-emerald-400">
                1 USD = {exchangeRate.toFixed(2)}
                </span>
                <TrendingUp size={12} className="text-emerald-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:mt-6">
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            <div className="px-4 md:px-0">
              <div className="bg-theme-surface rounded-[2.5rem] p-8 relative overflow-hidden active:scale-[0.99] transition-all duration-300 group shadow-2xl shadow-black/50 border border-white/5 bg-gradient-to-br from-theme-surface to-black/30">
                <div className="absolute top-8 right-8 flex gap-3 z-20">
                  <button
                    onClick={toggleCurrency}
                    className="p-2.5 rounded-xl bg-theme-bg border border-white/5 text-theme-secondary hover:text-theme-brand transition-all"
                  >
                    <ArrowRightLeft size={16} />
                  </button>
                  <button
                    onClick={handlePrivacyToggle}
                    className="p-2.5 rounded-xl bg-theme-bg border border-white/5 text-theme-secondary hover:text-theme-brand transition-all"
                  >
                    {isBalanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                <div className="cursor-pointer relative z-10">
                  <p className="text-xs text-theme-secondary font-black uppercase tracking-widest mb-2 opacity-60">
                    {t("totalBalance")}
                  </p>

                  <div className="flex flex-col gap-1 mb-2">
                    <h1 className="text-5xl font-black tracking-tighter text-theme-primary leading-tight">
                      {isBalanceVisible ? (
                        <>
                          <span className="text-2xl text-theme-secondary opacity-40 mr-1">
                            {symbolMain}
                          </span>
                          {displayMain.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </>
                      ) : (
                        <span className="tracking-widest">******</span>
                      )}
                    </h1>
                    <div className="flex items-center gap-3">
                        <p className="text-theme-secondary font-mono text-xs font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                        {isBalanceVisible ? (
                            <>
                            ≈ {symbolSecondary}{" "}
                            {displaySecondary.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                            </>
                        ) : '******'}
                        </p>
                        {isBalanceVisible && (
                             <div className={`p-1 flex items-center gap-1 rounded-full text-[10px] font-black ${balanceHistory.trendPercent >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                             {balanceHistory.trendPercent >= 0 ? <ArrowUpRight size={10} /> : <TrendingDown size={10} />}
                             {Math.abs(balanceHistory.trendPercent).toFixed(1)}%
                           </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {showBalanceChart && (
                <div className="px-4 md:px-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-theme-brand" />
                                <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("balanceHistory")}</h3>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 px-2 py-1 bg-white/5 rounded-lg">7D</span>
                        </div>

                        <div className="h-32 w-full relative group/chart">
                            <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                                <defs>
                                <linearGradient id="balanceTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                </linearGradient>
                                </defs>
                                <polyline
                                points={balanceHistory.points}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                className="text-theme-brand"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                />
                                <polygon
                                points={`${balanceHistory.points} 100,60 0,60`}
                                fill="url(#balanceTrendGrad)"
                                className="text-theme-brand"
                                />
                                <circle cx="100" cy={balanceHistory.points.split(' ').pop()?.split(',')[1]} r="3" className="fill-theme-brand" />
                            </svg>
                            {isBalanceVisible && (
                                <div className="absolute top-0 right-0 pointer-events-none opacity-0 group-hover/chart:opacity-100 transition-opacity">
                                    <div className="bg-theme-bg/80 backdrop-blur border border-white/10 p-2 rounded-lg text-right">
                                        <p className="text-[8px] text-theme-secondary uppercase font-bold">{t("today")}</p>
                                        <p className="text-xs font-black text-theme-primary">
                                            {isBalanceVisible ? `$${totalBalanceUSD.toLocaleString()}` : '******'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between mt-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase">{t("available")}</span>
                                <span className="text-xs font-black text-theme-primary">
                                    {isBalanceVisible ? `$${totalBalanceUSD.toLocaleString()}` : '******'}
                                </span>
                            </div>
                            <div className="text-right flex flex-col">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase">{t("trend")}</span>
                                <div className={`flex items-center justify-end gap-1 text-xs font-black ${balanceHistory.trendPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {balanceHistory.trendPercent >= 0 ? "+" : ""}{balanceHistory.trendPercent.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 md:px-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t("wallet")}</h3>
                <button onClick={() => onNavigate("WALLET")} className="text-theme-brand text-xs font-bold">{t("manage")}</button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {accounts.map((acc) => (
                  <div key={acc.id} className="min-w-[140px] bg-theme-surface border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xl text-theme-primary">{renderAccountIcon(acc.icon, 20)}</div>
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-theme-secondary">{acc.currency}</span>
                    </div>
                    <div>
                      <p className="text-theme-primary font-bold text-sm">{isBalanceVisible ? acc.balance.toLocaleString() : "****"}</p>
                      <p className="text-theme-secondary text-xs truncate">{acc.name}</p>
                    </div>
                  </div>
                ))}
                <button onClick={() => onNavigate("WALLET")} className="min-w-[50px] bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-theme-secondary hover:text-theme-primary hover:bg-white/10 transition-colors">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 md:px-0">
              {[
                { id: "TRANSACTIONS", label: t("transactions"), icon: <Receipt size={20} />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                { id: "BUDGET", label: t("budget"), icon: <PieChart size={20} />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                { id: "SCHEDULED", label: t("scheduled"), icon: <Calendar size={20} />, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
                { id: "ANALYSIS", label: t("analysis"), icon: <ArrowUpRight size={20} />, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
              ].map((action, i) => (
                <button key={i} onClick={() => onNavigate(action.id)} className="flex flex-col items-center gap-2 group w-full bg-theme-surface py-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className={`w-12 h-12 rounded-xl ${action.color} border flex items-center justify-center shadow-lg`}>{action.icon}</div>
                  <span className="text-xs text-theme-secondary font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8 px-4 md:px-0 flex flex-col gap-6">
            {showExpenseStructure && (
                <div className="bg-theme-surface p-8 rounded-[2rem] border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden relative">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <PieChart size={14} className="text-theme-brand" />
                                <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("structure")}</h3>
                            </div>
                            <h2 className="text-2xl font-black text-theme-primary">
                                {isBalanceVisible ? (
                                    <>
                                        {`$${expenseSummary.totalUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                        <span className="text-sm font-normal text-theme-secondary ml-2">/ {(expenseSummary.totalUSD * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} Bs.</span>
                                    </>
                                ) : '******'}
                                <span className="text-xs text-theme-secondary ml-2 font-bold uppercase tracking-widest opacity-40">{t("totalExpenses")}</span>
                            </h2>
                        </div>
                        <button onClick={() => onNavigate("ANALYSIS")} className="bg-white/5 p-2 rounded-xl text-theme-secondary hover:text-theme-brand transition-all border border-white/5">
                            <ArrowUpRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex justify-center relative group">
                            <svg className="w-48 h-48 -rotate-90 filter drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                {(() => {
                                    let accumulatedPercent = 0;
                                    const hexColors: Record<string, string> = {
                                        'text-red-400': '#f87171', 'text-blue-400': '#60a5fa', 'text-green-400': '#4ade80',
                                        'text-yellow-400': '#facc15', 'text-purple-400': '#c084fc', 'text-orange-400': '#fb923c',
                                        'text-emerald-400': '#34d399', 'text-pink-400': '#f472b6', 'text-cyan-400': '#22d3ee',
                                        'text-amber-500': '#f59e0b', 'text-indigo-400': '#818cf8', 'text-sky-400': '#38bdf8',
                                        'text-rose-400': '#fb7185', 'text-amber-400': '#fbbf24', 'text-blue-300': '#93c5fd',
                                        'text-gray-400': '#9ca3af', 'text-zinc-300': '#d4d4d8', 'text-violet-400': '#a78bfa',
                                        'text-slate-400': '#94a3b8', 'text-teal-400': '#2dd4bf', 'text-rose-300': '#fda4af',
                                        'text-slate-300': '#cbd5e1', 'text-indigo-300': '#a5b4fc', 'text-gray-300': '#d1d5db',
                                        'text-amber-700': '#b45309', 'text-indigo-700': '#4338ca', 'text-zinc-500': '#71717a',
                                        'text-emerald-600': '#059669', 'text-slate-600': '#475569', 'text-blue-600': '#2563eb',
                                        'text-gray-500': '#6b7280', 'text-zinc-400': '#a1a1aa', 'text-emerald-500': '#10b981',
                                        'text-indigo-500': '#6366f1', 'text-purple-500': '#a855f7', 'text-pink-500': '#ec4899',
                                        'text-rose-500': '#f43f5e', 'text-orange-500': '#f97316', 'text-amber-600': '#d97706'
                                    };

                                    return expenseSummary.structure.map((item) => {
                                        const radius = 80;
                                        const circumference = 2 * Math.PI * radius;
                                        const offset = circumference - (item.percent / 100) * circumference;
                                        const rotation = (accumulatedPercent / 100) * 360;
                                        accumulatedPercent += item.percent;
                                        
                                        const textColorMatch = item.color.match(/text-[a-z0-9-]+(\/[0-9]+)?/);
                                        const textColorClass = textColorMatch ? textColorMatch[0].split('/')[0] : 'text-gray-500';
                                        const strokeColor = hexColors[textColorClass] || '#6366f1';
                                        const isSelected = selectedCategory === item.id;
                                        return (
                                            <circle
                                                key={item.id} r={radius} cx="96" cy="96" fill="transparent" stroke={strokeColor}
                                                strokeWidth={isSelected ? "22" : "16"} strokeDasharray={circumference} strokeDashoffset={offset}
                                                strokeLinecap="round" transform={`rotate(${rotation} 96 96)`}
                                                className={`transition-all duration-500 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100 hover:stroke-[18px]'}`}
                                                onClick={() => setSelectedCategory(isSelected ? null : item.id)}
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                {selectedCategory ? (
                                    <div className="text-center animate-in zoom-in-50 duration-200">
                                        {(() => {
                                            const cat = expenseSummary.structure.find(s => s.id === selectedCategory);
                                            return (
                                                <>
                                                    <p className="text-2xl font-black text-theme-primary leading-none">
                                                        {isBalanceVisible ? `$${cat?.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '******'}
                                                    </p>
                                                    <p className="text-[9px] font-black uppercase text-theme-brand mt-1 tracking-widest">{t(cat?.name)}</p>
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-xs font-black text-theme-secondary uppercase tracking-widest opacity-40">{t("topSpend")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {expenseSummary.structure.slice(0, 4).map((item) => (
                                <button
                                    key={item.id} onClick={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
                                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedCategory === item.id ? 'bg-theme-bg border-theme-brand shadow-lg ' + item.color : 'bg-white/5 border-white/5 hover:border-white/10 text-theme-secondary'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl ${item.bg} bg-opacity-20 flex items-center justify-center ${item.color}`}>{item.icon}</div>
                                        <span className="text-xs font-bold truncate max-w-[80px]">{t(item.name)}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-theme-primary">
                                            {isBalanceVisible ? `$${item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '******'}
                                        </p>
                                        <p className="text-[9px] font-bold opacity-40">{item.percent.toFixed(1)}%</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-theme-surface/50 md:bg-theme-surface rounded-3xl md:p-6 md:border border-white/5 min-h-[500px]">
              <h2 className="text-sm font-semibold text-theme-secondary mb-6 px-2 md:px-0 uppercase tracking-wider">{t("recentTransactions")}</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-20 text-theme-secondary text-sm">{t("noTransactions")}</div>
              ) : (
                <div className="flex flex-col gap-6">
                  {(() => {
                    let count = 0;
                    const MAX_ITEMS = 5;
                    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                    return (
                      <>
                        {sortedDates.map((date) => {
                          if (count >= MAX_ITEMS) return null;
                          const dayTransactions = groupedTransactions[date].sort((a, b) => (b.id || "").localeCompare(a.id || ""));
                          const itemsToRender = [];
                          for (const t of dayTransactions) { if (count < MAX_ITEMS) { itemsToRender.push(t); count++; } }
                          if (itemsToRender.length === 0) return null;
                          return (
                            <div key={date}>
                              <h3 className="text-xs font-bold text-zinc-500 sticky top-0 bg-background/95 backdrop-blur-sm md:bg-transparent py-2 px-2 z-10">
                                {(() => {
                                  const dateObj = new Date(`${date}T12:00:00`);
                                  const todayStr = new Date().toISOString().split('T')[0];
                                  return date === todayStr ? t("today") : dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                                })()}
                              </h3>
                              <div className="flex flex-col gap-2 mt-1">
                                {itemsToRender.map((transaction) => {
                                  const category = CATEGORIES.find((c) => c.id === transaction.category) || CATEGORIES[0];
                                  const isExpense = transaction.type === TransactionType.EXPENSE;
                                  const isOriginalUSD = transaction.originalCurrency === Currency.USD;
                                  const mainAmount = transaction.amount;
                                  const mainSymbol = isOriginalUSD ? "$" : "Bs.";
                                  const secondaryAmount = isOriginalUSD ? transaction.amount * transaction.exchangeRate : transaction.amount / transaction.exchangeRate;
                                  const secondarySymbol = isOriginalUSD ? "Bs." : "$";
                                  return (
                                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group relative pr-14 bg-theme-surface">
                                      <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category.color} bg-opacity-20`}>{category.icon}</div>
                                        <div>
                                          <p className="font-medium text-sm text-theme-primary">{transaction.note || t(category.name)}</p>
                                          <p className="text-xs text-theme-secondary capitalize">{t(category.name.toLowerCase()) || category.name}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className={`font-bold text-sm ${isExpense ? "text-theme-primary" : "text-emerald-400"}`}>
                                          {isExpense ? "-" : "+"}{mainSymbol}{isBalanceVisible ? mainAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "***"}
                                        </p>
                                        <p className="text-xs text-theme-secondary font-mono group-hover:text-theme-primary transition-colors">
                                          ~{secondarySymbol} {isBalanceVisible ? secondaryAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "***"}
                                        </p>
                                      </div>
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-theme-surface rounded-lg p-1 border border-white/5">
                                        <button onClick={(e) => { e.stopPropagation(); onEditTransaction(transaction); }} className="p-2 hover:bg-white/10 rounded-lg text-blue-400"><TrendingUp size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteTransaction(transaction.id); }} className="p-2 hover:bg-white/10 rounded-lg text-red-500"><Plus size={14} className="rotate-45" /></button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {transactions.length > 5 && (
                          <button onClick={() => onNavigate("TRANSACTIONS")} className="w-full py-4 text-center text-sm font-bold text-theme-brand hover:text-theme-primary transition-colors border-t border-white/5 mt-2">{t('viewMore')}</button>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCustomizer && (
          <div className="fixed inset-0 bg-black/80 z-[70] backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-black text-theme-primary tracking-tight">{t("customizeDashboard")}</h3>
                      <button onClick={() => setShowCustomizer(false)} className="p-2 bg-theme-bg rounded-xl text-theme-secondary hover:text-white transition-colors"><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <Activity size={18} className="text-theme-brand" />
                              <span className="text-sm font-bold text-theme-primary">{t("showBalanceChart")}</span>
                          </div>
                          <button onClick={() => toggleWidget('balance')} className={`w-12 h-6 rounded-full transition-all relative ${showBalanceChart ? 'bg-theme-brand' : 'bg-white/10'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showBalanceChart ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <PieChart size={18} className="text-theme-brand" />
                              <span className="text-sm font-bold text-theme-primary">{t("showExpenseStructure")}</span>
                          </div>
                          <button onClick={() => toggleWidget('expense')} className={`w-12 h-6 rounded-full transition-all relative ${showExpenseStructure ? 'bg-theme-brand' : 'bg-white/10'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showExpenseStructure ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>
                  </div>
                  <button onClick={() => setShowCustomizer(false)} className="w-full bg-theme-brand text-white font-black py-4 rounded-2xl mt-8 shadow-xl hover:brightness-110 active:scale-[0.98] transition-all">{t("done")}</button>
              </div>
          </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200 backdrop-blur-md">
          <div className="w-full max-w-xs flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-theme-surface border border-white/10 flex items-center justify-center text-theme-brand shadow-2xl shadow-brand/20 mb-4"><Lock size={32} /></div>
              <h2 className="text-2xl font-bold text-theme-primary text-center">{t("verifyIdentity")}</h2>
              <p className="text-theme-secondary text-sm text-center">{t("enterPin")}</p>
            </div>
            <div className="flex gap-4 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pinInput.length ? pinError ? "bg-red-500 scale-110" : "bg-theme-brand scale-110" : "bg-white/10"}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6 w-full px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => handlePinDigit(num.toString())} className="w-full aspect-square rounded-full bg-theme-surface/30 hover:bg-theme-surface border border-white/5 text-2xl font-semibold text-theme-primary transition-all active:scale-95 flex items-center justify-center">{num}</button>
              ))}
              <div />
              <button key="0" onClick={() => handlePinDigit("0")} className="w-full aspect-square rounded-full bg-theme-surface/30 hover:bg-theme-surface border border-white/5 text-2xl font-semibold text-theme-primary transition-all active:scale-95 flex items-center justify-center">0</button>
              <button onClick={() => setPinInput((prev) => prev.slice(0, -1))} className="w-full aspect-square rounded-full flex items-center justify-center text-theme-secondary hover:text-white">{t("delete")}</button>
            </div>
            <button onClick={closePinModal} className="mt-4 text-theme-secondary text-sm hover:text-white">{t("cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
};
