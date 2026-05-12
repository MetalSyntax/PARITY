import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Settings, Eye, EyeOff, DollarSign, Euro, ArrowUpRight, TrendingDown, Activity, Plus, PieChart, TrendingUp, Receipt, ArrowRightLeft, ChartArea, CalendarRange, ShoppingCart, Image as ImageIcon, User, Trophy, Calendar1, FileText, SlidersHorizontal, Search, ChevronDown, X, Calendar } from 'lucide-react';
import { Currency, Transaction, Account, TransactionType, UserProfile, WidgetId, Language } from '../types';
import { CurrencyAmount } from './CurrencyAmount';
import { formatSecondaryAmount, formatMonth } from '../utils/formatUtils';
import { BalanceHistoryChart, IncomeVsExpenseChart, DailySpendingChart, ExpenseStructureChart } from './Charts';
import { renderAccountIcon } from '../utils/iconUtils';
import { TransactionItem } from './TransactionItem';
import { CATEGORIES } from '../constants';

interface WidgetWrapperProps {
  id: WidgetId;
  children: React.ReactNode;
  onDragStart?: (e: React.PointerEvent) => void;
  onSettingsClick?: () => void;
  touched?: boolean;
  onSelect?: () => void;
  className?: string;
  isDraggable?: boolean;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ 
  id, 
  children, 
  onDragStart, 
  onSettingsClick, 
  touched, 
  onSelect,
  className = "",
  isDraggable = true
}) => (
  <div 
    className={`relative group focus:outline-none ${className}`}
    onClick={onSelect}
  >
    {isDraggable && (
      <div
        className={`drag-handle absolute top-2 right-2 transition-opacity z-50 cursor-grab active:cursor-grabbing p-2.5 bg-theme-surface/90 backdrop-blur-md rounded-xl border border-theme-soft text-theme-secondary flex touch-none shadow-xl ${touched ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
      >
        <GripVertical size={20} />
      </div>
    )}
    {onSettingsClick && (
      <button
        onClick={(e) => { e.stopPropagation(); onSettingsClick(); }}
        className={`absolute bottom-2 right-2 transition-opacity z-50 p-2.5 bg-theme-surface/90 backdrop-blur-md rounded-xl border border-theme-soft text-theme-secondary flex touch-none shadow-xl ${touched ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
      >
        <Settings size={20} />
      </button>
    )}
    {children}
  </div>
);

// --- Individual Widgets ---

export const BalanceCardWidget: React.FC<{
  totalBalanceUSD: number;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  trendPercent: number;
  points: string;
  area: string;
  onToggleDisplayCurrency: () => void;
  onTogglePrivacy: (e: React.MouseEvent) => void;
  t: (key: string) => string;
}> = ({ totalBalanceUSD, exchangeRate, euroRate, displayCurrency, isBalanceVisible, trendPercent, points, area, onToggleDisplayCurrency, onTogglePrivacy, t }) => (
  <div className="px-4 md:px-0">
    <div className="bg-theme-surface rounded-2xl p-8 relative overflow-hidden active:scale-[0.99] transition-all duration-300 shadow-theme border border-theme-soft bg-gradient-to-br from-theme-surface to-theme-bg group">
      <div className="absolute top-8 right-8 flex gap-3 z-20">
        <button
          onClick={onToggleDisplayCurrency}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-theme-soft transition-all font-black text-[10px] ${displayCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-bg text-theme-secondary hover:text-theme-primary'}`}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {displayCurrency === Currency.VES ? <span className="text-[9px] font-black leading-none">Bs</span> : displayCurrency === Currency.EUR ? <Euro size={14} /> : <DollarSign size={14} />}
          </div>
          <span className="hidden sm:inline">{displayCurrency}</span>
        </button>
        <button
          onClick={onTogglePrivacy}
          className="p-2.5 rounded-2xl bg-theme-bg border border-theme-soft text-theme-secondary hover:text-theme-brand transition-all shadow-sm"
        >
          {isBalanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-32 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="cardTrendGradientWidget" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trendPercent >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.4" />
              <stop offset="100%" stopColor={trendPercent >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={points}
            fill="none"
            stroke={trendPercent >= 0 ? '#10b981' : '#f43f5e'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1, delay: 0.5 }}
            d={area}
            fill="url(#cardTrendGradientWidget)"
          />
        </svg>
      </div>

      <div className="cursor-pointer relative z-10">
        <p className="text-xs text-theme-secondary font-black uppercase tracking-widest mb-2 opacity-60">{t("totalBalance")}</p>
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
            <span className="text-theme-secondary font-mono text-xs font-bold px-2 py-1 bg-theme-soft rounded-2xl border border-theme-soft flex items-center gap-1">
              <span className="opacity-50 text-[10px] uppercase">≈</span>
              {formatSecondaryAmount(totalBalanceUSD, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}
            </span>
            {isBalanceVisible && (
              <div className={`p-1 flex items-center gap-1 rounded-full text-[10px] font-black ${trendPercent >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                {trendPercent >= 0 ? <ArrowUpRight size={10} /> : <TrendingDown size={10} />}
                {Math.abs(trendPercent || 0)?.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const BalanceChartWidget: React.FC<{
  type: 'LINE' | 'BAR';
  setType: (t: 'LINE' | 'BAR') => void;
  history: any[];
  lang: Language;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  t: (key: string) => string;
}> = ({ type, setType, history, lang, exchangeRate, euroRate, displayCurrency, isBalanceVisible, t }) => (
  <div className="px-4 md:px-0">
    <div className="bg-theme-surface p-6 rounded-2xl border border-theme-soft shadow-theme relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-theme-brand" />
            <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("balanceHistory")}</h3>
          </div>
          <div className="flex bg-theme-soft p-1 mr-5 rounded-2xl border border-theme-soft">
            <button onClick={() => setType('LINE')} className={`px-2 py-0.5 rounded-2xl text-[8px] font-black transition-all ${type === 'LINE' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary'}`}>{t('line')}</button>
            <button onClick={() => setType('BAR')} className={`px-2 py-0.5 rounded-2xl text-[8px] font-black transition-all ${type === 'BAR' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary'}`}>{t('bar')}</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-theme-secondary px-2 py-1 bg-theme-soft rounded-2xl">{t('last7DaysShort')}</span>
        </div>
      </div>
      <div className="h-48 w-full">
        <BalanceHistoryChart
          type={type}
          history={history}
          lang={lang}
          exchangeRate={exchangeRate}
          euroRate={euroRate}
          displayCurrency={displayCurrency}
          isBalanceVisible={isBalanceVisible}
        />
      </div>
    </div>
  </div>
);

export const WalletsWidget: React.FC<{
  accounts: Account[];
  isBalanceVisible: boolean;
  onNavigate: (view: any) => void;
  t: (key: string) => string;
}> = ({ accounts, isBalanceVisible, onNavigate, t }) => (
  <div className="px-4 md:px-0">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t("wallet")}</h3>
      <span className="text-[10px] text-theme-brand font-black uppercase tracking-tighter opacity-40">{t("slide_hint")}</span>
    </div>
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
      {accounts.map((acc) => (
        <div key={acc.id} className="min-w-[140px] bg-theme-surface border border-theme-soft p-3 rounded-2xl flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="text-xl text-theme-primary">{renderAccountIcon(acc.icon, 20)}</div>
            <span className="text-[10px] bg-theme-soft px-1.5 py-0.5 rounded-2xl text-theme-secondary">{acc.currency}</span>
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
);

export const ExpenseStructureWidget: React.FC<{
  type: 'DOUGHNUT' | 'BAR';
  setType: (t: 'DOUGHNUT' | 'BAR') => void;
  transactions: Transaction[];
  expenseSummary: any;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  lang: Language;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  onNavigate: (view: any) => void;
  t: (key: string) => string;
}> = ({ type, setType, transactions, expenseSummary, selectedCategory, setSelectedCategory, lang, exchangeRate, euroRate, displayCurrency, isBalanceVisible, onNavigate, t }) => (
  <div className="bg-theme-surface p-8 rounded-2xl border border-theme-soft shadow-theme overflow-hidden relative mx-4 sm:mx-0">
    <div className="flex justify-between items-start mb-8 relative z-10">
      <div>
        <div className="flex items-center gap-4 mb-1">
          <div className="flex items-center gap-2">
            <PieChart size={14} className="text-theme-brand" />
            <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("structure")}</h3>
          </div>
          <div className="flex bg-theme-soft p-1 mr-5 rounded-lg border border-theme-soft">
            <button onClick={() => setType('DOUGHNUT')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${type === 'DOUGHNUT' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary'}`}>{t('pie')}</button>
            <button onClick={() => setType('BAR')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${type === 'BAR' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary'}`}>{t('bar')}</button>
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
        <ExpenseStructureChart
          type={type}
          transactions={transactions}
          lang={lang}
          exchangeRate={exchangeRate}
          euroRate={euroRate}
          displayCurrency={displayCurrency}
          isBalanceVisible={isBalanceVisible}
          selectedCategoryId={selectedCategory}
          onCategoryClick={setSelectedCategory}
        />
        {type === 'DOUGHNUT' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs font-black text-theme-secondary uppercase tracking-widest opacity-40">{t("topSpend")}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {expenseSummary.structure.slice(0, 4).map((item: any) => (
          <button
            key={item.id}
            onClick={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedCategory === item.id ? 'bg-theme-bg border-theme-soft shadow-lg ' + item.color : 'bg-theme-soft border-theme-soft hover:border-theme-soft text-theme-secondary'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>{item.icon}</div>
              <span className="text-xs font-bold">{t(item.name as any)}</span>
            </div>
            <div className="text-right">
              <CurrencyAmount amount={item.amount} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} size="xs" weight="black" />
              <p className="text-[9px] font-bold opacity-40">{item.percent?.toFixed(1)}%</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const ForecastWidget: React.FC<{
  forecast: any;
  runwayDays: number;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  t: (key: string) => string;
}> = ({ forecast, runwayDays, exchangeRate, euroRate, displayCurrency, isBalanceVisible, t }) => (
  <div className="bg-theme-surface p-6 rounded-2xl border border-theme-soft shadow-theme overflow-hidden relative group">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-theme-brand" />
        <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("monthEndForecast")}</h3>
      </div>
    </div>
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-black text-theme-primary">
          <CurrencyAmount amount={forecast.base} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} size="xl" weight="black" />
        </p>
        <p className="text-xs text-theme-secondary font-medium">{t("baseProjectedSpend")}</p>
      </div>
      <div className="flex justify-between items-center bg-theme-bg p-3 rounded-xl border border-theme-soft">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-emerald-500 font-bold">{t("optimistic")}</span>
          <span className="text-xs text-theme-primary font-bold">{isBalanceVisible ? forecast.optimistic.toFixed(2) : "****"}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase text-red-500 font-bold">{t("pessimistic")}</span>
          <span className="text-xs text-theme-primary font-bold">{isBalanceVisible ? forecast.pessimistic.toFixed(2) : "****"}</span>
        </div>
      </div>
      <div className="mt-2 text-center text-xs font-bold text-theme-secondary">
        {t("runway")}: <span className="text-theme-primary">{runwayDays === Infinity ? '∞' : runwayDays} {t("days")}</span>
      </div>
    </div>
  </div>
);

export const FiscalSummaryWidget: React.FC<{
  fiscalMetrics: any;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  onNavigate: (view: any) => void;
  t: (key: string) => string;
}> = ({ fiscalMetrics, exchangeRate, euroRate, displayCurrency, isBalanceVisible, onNavigate, t }) => (
  <div className="bg-theme-surface p-6 rounded-2xl border border-white/5 shadow-xl group relative overflow-hidden">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
         <div className="bg-blue-500/20 text-blue-400 p-2 rounded-xl"><Receipt size={20} /></div>
         <div>
            <h3 className="text-sm font-black text-theme-primary uppercase tracking-widest">{t('fiscalReport')}</h3>
            <p className="text-[10px] text-theme-secondary font-bold">{t('ytd')} {new Date().getFullYear()}</p>
         </div>
      </div>
      <button onClick={() => onNavigate('FISCAL_REPORT')} className="p-2 bg-theme-soft rounded-lg text-theme-secondary hover:text-theme-brand transition-all shadow-sm">
         <ArrowUpRight size={14} />
      </button>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-theme-bg p-4 rounded-2xl border border-white/5 relative overflow-hidden">
           <p className="text-[10px] font-black text-theme-secondary opacity-60 uppercase mb-1">{t('taxableIncome')}</p>
           <CurrencyAmount amount={fiscalMetrics.taxableIncome} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} size="sm" weight="black" />
           <TrendingUp size={40} className="absolute -bottom-2 -right-2 text-emerald-500/5 opacity-50" />
        </div>
        <div className="bg-theme-bg p-4 rounded-2xl border border-white/5 relative overflow-hidden">
           <p className="text-[10px] font-black text-theme-secondary opacity-60 uppercase mb-1">{t('deductibleExpense')}</p>
           <CurrencyAmount amount={fiscalMetrics.deductibleExpense} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} size="sm" weight="black" />
           <TrendingDown size={40} className="absolute -bottom-2 -right-2 text-blue-500/5 opacity-50" />
        </div>
    </div>
  </div>
);

export const TransactionsWidget: React.FC<{
  transactions: Transaction[];
  groupedTransactions: Record<string, Transaction[]>;
  accounts: Account[];
  userProfile: UserProfile;
  isBalanceVisible: boolean;
  displayCurrency: Currency;
  onNavigate: (view: any) => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  setSelectedTx: (t: Transaction) => void;
  t: (key: string) => string;
}> = ({ transactions, accounts, userProfile, isBalanceVisible, displayCurrency, onNavigate, onEditTransaction, onDeleteTransaction, setSelectedTx, t }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openPopup, setOpenPopup] = useState<'month' | 'wallet' | 'type' | 'category' | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpenPopup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(tx => months.add(tx.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const activeFilterCount = [searchQuery, filterType !== 'ALL', selectedWalletId, selectedMonth !== 'ALL', selectedCategory !== 'ALL'].filter(Boolean).length;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const category = CATEGORIES.find(c => c.id === tx.category);
      const categoryName = category ? t(category.name.toLowerCase()) : '';
      const matchesSearch = !searchQuery ||
        (tx.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' || tx.type === filterType;
      const matchesWallet = !selectedWalletId || tx.accountId === selectedWalletId || tx.toAccountId === selectedWalletId;
      const matchesMonth = selectedMonth === 'ALL' || tx.date.startsWith(selectedMonth);
      const matchesCategory = selectedCategory === 'ALL' || tx.category === selectedCategory;
      return matchesSearch && matchesType && matchesWallet && matchesMonth && matchesCategory;
    });
  }, [transactions, searchQuery, filterType, selectedWalletId, selectedMonth, selectedCategory]);

  const filteredGrouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(tx => {
      const date = tx.date.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setSelectedWalletId(null);
    setSelectedMonth('ALL');
    setSelectedCategory('ALL');
    setOpenPopup(null);
  };

  const togglePopup = (name: typeof openPopup) => setOpenPopup(prev => prev === name ? null : name);

  const selectedWallet = accounts.find(a => a.id === selectedWalletId);
  const selectedCat = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="bg-theme-surface/50 md:bg-theme-surface rounded-2xl md:p-6 md:border border-theme-soft min-h-[500px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2 md:px-0">
        <h2 className="text-sm font-semibold text-theme-secondary uppercase tracking-wider">{t('recentTransactions')}</h2>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="flex items-center gap-1 text-[10px] font-black text-red-400 hover:text-red-300 transition-colors">
              <X size={11} /> {t('clearFilters')}
            </button>
          )}
          <button
            onClick={() => { setShowFilters(v => !v); setOpenPopup(null); }}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border ${
              showFilters || activeFilterCount > 0
                ? 'bg-theme-brand text-white border-theme-brand shadow-lg'
                : 'bg-theme-soft border-white/5 text-theme-secondary hover:text-theme-primary'
            }`}
          >
            <SlidersHorizontal size={12} />
            <span>{t('filter')}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-theme-brand rounded-full text-[9px] font-black flex items-center justify-center shadow">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-visible mb-4 px-2 md:px-0"
          >
            <div ref={popupRef} className="flex flex-col gap-3 pt-1 pb-3 border-b border-white/5">

              {/* Row 1: Search alone */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('searchTransactions')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-theme-bg border border-white/5 rounded-xl py-2.5 pl-8 pr-8 text-[11px] text-theme-primary placeholder:text-theme-secondary outline-none focus:border-theme-brand/40 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-secondary hover:text-theme-primary">
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Row 2: 4 filter buttons, icon + label, evenly distributed */}
              <div className="grid grid-cols-4 gap-2">

                {/* Month */}
                <div className="relative flex flex-col items-center">
                  <button onClick={() => togglePopup('month')} className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all border shadow-sm ${selectedMonth !== 'ALL' ? 'bg-theme-brand text-white border-theme-brand shadow-lg' : 'bg-theme-bg border-white/5 text-theme-secondary hover:text-theme-primary hover:border-white/10'}`}>
                    <Calendar size={15} />
                    <span className="text-[8px] font-black uppercase tracking-tight leading-none truncate max-w-full px-1">
                      {selectedMonth !== 'ALL' ? formatMonth(selectedMonth, 'MMM YY', userProfile.language) : t('allPeriods').split(' ')[0]}
                    </span>
                  </button>
                  <AnimatePresence>
                    {openPopup === 'month' && (
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }} transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-40 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="max-h-52 overflow-y-auto no-scrollbar py-1">
                          <button onClick={() => { setSelectedMonth('ALL'); setOpenPopup(null); }}
                            className={`w-full text-left px-4 py-2.5 text-[11px] font-black transition-colors hover:bg-white/5 ${selectedMonth === 'ALL' ? 'text-theme-brand' : 'text-theme-secondary'}`}>
                            {t('allPeriods')}
                          </button>
                          <div className="h-px bg-white/5 mx-3" />
                          {availableMonths.map(m => (
                            <button key={m} onClick={() => { setSelectedMonth(m); setOpenPopup(null); }}
                              className={`w-full text-left px-4 py-2.5 text-[11px] font-black transition-colors hover:bg-white/5 ${selectedMonth === m ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}>
                              {formatMonth(m, 'MMM YYYY', userProfile.language)}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Wallet */}
                <div className="relative flex flex-col items-center">
                  <button onClick={() => togglePopup('wallet')} className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all border shadow-sm ${selectedWalletId ? 'bg-theme-brand text-white border-theme-brand shadow-lg' : 'bg-theme-bg border-white/5 text-theme-secondary hover:text-theme-primary hover:border-white/10'}`}>
                    {selectedWallet ? renderAccountIcon(selectedWallet.icon, 15) : <Receipt size={15} />}
                    <span className="text-[8px] font-black uppercase tracking-tight leading-none truncate max-w-full px-1">
                      {selectedWallet ? selectedWallet.name : t('wallet')}
                    </span>
                  </button>
                  <AnimatePresence>
                    {openPopup === 'wallet' && (
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }} transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-44 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="max-h-52 overflow-y-auto no-scrollbar py-1">
                          <button onClick={() => { setSelectedWalletId(null); setOpenPopup(null); }}
                            className={`w-full text-left px-4 py-2.5 text-[11px] font-black transition-colors hover:bg-white/5 ${!selectedWalletId ? 'text-theme-brand' : 'text-theme-secondary'}`}>
                            {t('all')}
                          </button>
                          <div className="h-px bg-white/5 mx-3" />
                          {accounts.map(acc => (
                            <button key={acc.id} onClick={() => { setSelectedWalletId(acc.id); setOpenPopup(null); }}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-black transition-colors hover:bg-white/5 ${selectedWalletId === acc.id ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}>
                              <span className="flex-shrink-0">{renderAccountIcon(acc.icon, 13)}</span>
                              <span>{acc.name}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Type */}
                <div className="relative flex flex-col items-center">
                  <button onClick={() => togglePopup('type')} className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all border shadow-sm ${filterType !== 'ALL' ? 'bg-theme-brand text-white border-theme-brand shadow-lg' : 'bg-theme-bg border-white/5 text-theme-secondary hover:text-theme-primary hover:border-white/10'}`}>
                    <ArrowRightLeft size={15} />
                    <span className="text-[8px] font-black uppercase tracking-tight leading-none truncate max-w-full px-1">
                      {filterType === 'ALL' ? t('type') : t(filterType.toLowerCase())}
                    </span>
                  </button>
                  <AnimatePresence>
                    {openPopup === 'type' && (
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }} transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-36 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="py-1">
                          {(['ALL', TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER] as const).map(type => (
                            <button key={type} onClick={() => { setFilterType(type); setOpenPopup(null); }}
                              className={`w-full text-left px-4 py-2.5 text-[11px] font-black transition-colors hover:bg-white/5 ${filterType === type ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}>
                              {type === 'ALL' ? t('all') : t(type.toLowerCase())}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Category */}
                <div className="relative flex flex-col items-center">
                  <button onClick={() => togglePopup('category')} className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all border shadow-sm ${selectedCategory !== 'ALL' ? 'bg-theme-brand text-white border-theme-brand shadow-lg' : 'bg-theme-bg border-white/5 text-theme-secondary hover:text-theme-primary hover:border-white/10'}`}>
                    {selectedCat
                      ? <span className="flex items-center justify-center w-[15px] h-[15px] text-[13px] leading-none">{selectedCat.icon}</span>
                      : <PieChart size={15} />
                    }
                    <span className="text-[8px] font-black uppercase tracking-tight leading-none truncate max-w-full px-1">
                      {selectedCat ? t(selectedCat.name.toLowerCase()) : t('category')}
                    </span>
                  </button>
                  <AnimatePresence>
                    {openPopup === 'category' && (
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }} transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 w-48 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto no-scrollbar py-1">
                          <button onClick={() => { setSelectedCategory('ALL'); setOpenPopup(null); }}
                            className={`w-full text-left px-4 py-2.5 text-[11px] font-black transition-colors hover:bg-white/5 ${selectedCategory === 'ALL' ? 'text-theme-brand' : 'text-theme-secondary'}`}>
                            {t('all')}
                          </button>
                          <div className="h-px bg-white/5 mx-3" />
                          {CATEGORIES.map(cat => (
                            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setOpenPopup(null); }}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-black transition-colors hover:bg-white/5 ${selectedCategory === cat.id ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}>
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] flex-shrink-0 ${cat.color}`}>{cat.icon}</span>
                              <span className="truncate">{t(cat.name.toLowerCase())}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-20 text-theme-secondary text-sm">{t('noTransactions')}</div>
      ) : (
        <div className="flex flex-col gap-6">
          {(() => {
            let count = 0;
            const MAX_ITEMS = userProfile.dashboardTxLimit || 5;
            const sortedDates = Object.keys(filteredGrouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            return (
              <>
                {sortedDates.map(date => {
                  if (count >= MAX_ITEMS) return null;
                  const dayTxns = filteredGrouped[date].sort((a, b) => (b.id || '').localeCompare(a.id || ''));
                  const itemsToRender: Transaction[] = [];
                  for (const tx of dayTxns) {
                    if (count < MAX_ITEMS) { itemsToRender.push(tx); count++; }
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2 mt-1">
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
                {filteredTransactions.length > (userProfile.dashboardTxLimit || 5) && (
                  <button onClick={() => onNavigate('TRANSACTIONS')} className="w-full py-4 text-center text-sm font-bold text-theme-brand hover:text-theme-primary transition-colors border-t border-theme-soft mt-2">{t('viewMore')}</button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export const IncomeVsExpenseWidget: React.FC<{
  transactions: Transaction[];
  lang: Language;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  onNavigate: (view: any) => void;
  t: (key: string) => string;
}> = ({ transactions, lang, exchangeRate, euroRate, displayCurrency, isBalanceVisible, onNavigate, t }) => (
  <div className="bg-theme-surface p-8 rounded-2xl border border-theme-soft shadow-theme overflow-hidden relative">
    <div className="flex items-center justify-between mb-6 px-4 md:px-0">
      <h3 className="text-sm font-black text-theme-primary uppercase tracking-widest flex items-center gap-3">
        <ArrowRightLeft size={16} className="text-theme-brand" /> {t('incomeVsExpenses')}
      </h3>
      <button onClick={() => onNavigate('TRANSACTIONS')} className="p-2 bg-theme-soft rounded-lg text-theme-secondary hover:text-theme-brand transition-all font-bold">
        <Settings size={14} />
      </button>
    </div>
    <div className="h-48">
      <IncomeVsExpenseChart type="BAR" mode="SUMMARY" transactions={transactions} lang={lang} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} />
    </div>
  </div>
);

export const DailySpendingWidget: React.FC<{
  transactions: Transaction[];
  lang: Language;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  t: (key: string) => string;
}> = ({ transactions, lang, exchangeRate, euroRate, displayCurrency, isBalanceVisible, t }) => (
  <div className="bg-theme-surface p-6 rounded-2xl border border-white/5 shadow-xl group relative overflow-hidden">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t("dailySpending")}</h3>
    </div>
    <div className="h-48">
      <DailySpendingChart transactions={transactions} lang={lang} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} />
    </div>
  </div>
);

export const GoalsWidget: React.FC<{
  goals: any[];
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  onNavigate: (view: any, params?: any) => void;
  t: (key: string) => string;
}> = ({ goals = [], exchangeRate, euroRate, displayCurrency, isBalanceVisible, onNavigate, t }) => {
  const activeGoals = goals.filter(g => !g.completed);

  return (
    <div className="bg-theme-surface p-6 rounded-2xl border border-theme-soft shadow-theme relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-yellow-400" />
          <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("goals")}</h3>
        </div>
        <button onClick={() => onNavigate("BUDGET", { initialTab: 'GOALS' })} className="p-2 bg-theme-soft rounded-lg text-theme-secondary hover:text-theme-brand transition-all shadow-sm">
          <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {activeGoals.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3 opacity-50 border-2 border-dashed border-theme-soft rounded-2xl bg-theme-bg/30">
            <Trophy size={24} className="text-theme-secondary opacity-30" />
            <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-wider">{t('noActiveGoals')}</p>
            <button 
                onClick={() => onNavigate("BUDGET", { initialTab: 'GOALS' })}
                className="text-[10px] font-black text-theme-brand hover:scale-105 transition-transform"
            >
                + {t('addGoal')}
            </button>
          </div>
        ) : (
          <>
            {activeGoals.slice(0, 3).map((goal) => {
              const percent = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-theme-primary">{goal.name}</p>
                      <p className="text-[10px] text-theme-secondary opacity-60">
                        {t('deadline')}: {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <CurrencyAmount
                        amount={goal.savedAmount}
                        exchangeRate={exchangeRate}
                        euroRate={euroRate}
                        displayCurrency={displayCurrency}
                        isBalanceVisible={isBalanceVisible}
                        size="xs"
                        weight="bold"
                      />
                      <p className="text-[10px] text-theme-secondary">{percent.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-theme-bg rounded-full overflow-hidden border border-theme-soft">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full shadow-lg ${percent >= 100 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-yellow-400 shadow-yellow-400/20'}`}
                    />
                  </div>
                </div>
              );
            })}
            {goals.length > 3 && (
              <button onClick={() => onNavigate("BUDGET", { initialTab: 'GOALS' })} className="text-[10px] font-bold text-theme-brand uppercase hover:underline text-center mt-2">
                + {goals.length - 3} {t('moreGoals')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const CategoryBreakdownWidget: React.FC<{
  transactions: Transaction[];
  lang: Language;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  t: (key: string) => string;
}> = ({ transactions, lang, exchangeRate, euroRate, displayCurrency, isBalanceVisible, t }) => (
  <div className="bg-theme-surface p-6 rounded-2xl border border-white/5 shadow-xl group relative overflow-hidden">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t("categoryBreakdown")}</h3>
    </div>
    <div className="h-48">
      <ExpenseStructureChart type="BAR" transactions={transactions} lang={lang} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} />
    </div>
  </div>
);
