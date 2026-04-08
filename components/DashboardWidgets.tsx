import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Settings, Eye, EyeOff, DollarSign, Euro, ArrowUpRight, TrendingDown, Activity, Plus, PieChart, TrendingUp, Receipt, ArrowRightLeft, ChartArea, CalendarRange, ShoppingCart, Image as ImageIcon, User, Trophy, Calendar1, FileText } from 'lucide-react';
import { Currency, Transaction, Account, TransactionType, UserProfile, WidgetId, Language } from '../types';
import { CurrencyAmount } from './CurrencyAmount';
import { formatSecondaryAmount } from '../utils/formatUtils';
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
        onPointerDown={onDragStart}
        className={`absolute top-2 right-2 transition-opacity z-50 cursor-grab active:cursor-grabbing p-2.5 bg-theme-surface/90 backdrop-blur-md rounded-xl border border-theme-soft text-theme-secondary flex touch-none shadow-xl ${touched ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
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
          <span className="text-[10px] font-bold text-theme-secondary px-2 py-1 bg-theme-soft rounded-2xl">7D</span>
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
            <p className="text-[10px] text-theme-secondary font-bold">YTD {new Date().getFullYear()}</p>
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
}> = ({ transactions, groupedTransactions, accounts, userProfile, isBalanceVisible, displayCurrency, onNavigate, onEditTransaction, onDeleteTransaction, setSelectedTx, t }) => (
  <div className="bg-theme-surface/50 md:bg-theme-surface rounded-2xl md:p-6 md:border border-theme-soft min-h-[500px]">
    <h2 className="text-sm font-semibold text-theme-secondary mb-6 px-2 md:px-0 uppercase tracking-wider">{t("recentTransactions")}</h2>
    {transactions.length === 0 ? (
      <div className="text-center py-20 text-theme-secondary text-sm">{t("noTransactions")}</div>
    ) : (
      <div className="flex flex-col gap-6">
        {(() => {
          let count = 0;
          const MAX_ITEMS = userProfile.dashboardTxLimit || 5;
          const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          return (
            <>
              {sortedDates.map(date => {
                if (count >= MAX_ITEMS) return null;
                const dayTransactions = groupedTransactions[date].sort((a, b) => (b.id || '').localeCompare(a.id || ''));
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
);

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
            <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-wider">{t('noActiveGoals') || 'No tienes metas activas'}</p>
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
                + {goals.length - 3} {t('moreGoals') || 'more goals'}
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
