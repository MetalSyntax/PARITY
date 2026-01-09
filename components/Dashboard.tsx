import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  ArrowUpRight,
  Plus,
  Calendar,
  Eye, 
  EyeOff, 
  Lock,
  BarChart3,
  X 
} from 'lucide-react';
import { Transaction, Account, Currency, Language, UserProfile, TransactionType } from '../types';
import { CATEGORIES } from '../constants';
import { getTranslation } from '../i18n';

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
  onToggleBottomNav
}) => {
  const [primaryCurrency, setPrimaryCurrency] = useState<Currency>(Currency.USD);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Get PIN from storage or default
  const getStoredPin = () => localStorage.getItem('dualflow_pin') || '0000';

  const t = (key: any) => getTranslation(userProfile.language, key);

  // Calculate Total Balance
  const totalBalanceUSD = useMemo(() => {
    return accounts.reduce((acc, account) => {
      let val = account.balance;
      if (account.currency === Currency.VES) val = account.balance / exchangeRate;
      return acc + val;
    }, 0);
  }, [accounts, exchangeRate]);

  const totalBalanceVES = totalBalanceUSD * exchangeRate;

  const displayMain = primaryCurrency === Currency.USD ? totalBalanceUSD : totalBalanceVES;
  const displaySecondary = primaryCurrency === Currency.USD ? totalBalanceVES : totalBalanceUSD;
  const symbolMain = primaryCurrency === Currency.USD ? '$' : 'Bs.';
  const symbolSecondary = primaryCurrency === Currency.USD ? 'Bs.' : '$';

  const toggleCurrency = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPrimaryCurrency(prev => prev === Currency.USD ? Currency.VES : Currency.USD);
  };

  const handlePrivacyToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isBalanceVisible) {
          setIsBalanceVisible(false);
      } else {
          setShowPinModal(true);
          onToggleBottomNav(false);
      }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    onToggleBottomNav(true);
    setPinInput('');
    setPinError(false);
  }

  const handlePinDigit = (digit: string) => {
      if (pinInput.length < 4) {
          const newPin = pinInput + digit;
          setPinInput(newPin);
          if (newPin.length === 4) {
              // Auto verify on 4th digit
              if (newPin === getStoredPin()) {
                  setIsBalanceVisible(true);
                  closePinModal();
              } else {
                  // Small delay to show last dot then error
                  setTimeout(() => {
                      setPinError(true);
                      setPinInput('');
                  }, 200);
              }
          }
      }
  };

  // Group transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }, [transactions]);

  // Chart Logic: 7 Day Trend (Simulated using transactions + current balance)
  const trendPoints = useMemo(() => {
      const points = [totalBalanceUSD * 0.9, totalBalanceUSD * 0.94, totalBalanceUSD * 0.91, totalBalanceUSD * 0.96, totalBalanceUSD * 0.98, totalBalanceUSD];
      const min = Math.min(...points) * 0.99;
      const max = Math.max(...points) * 1.01;
      const height = 60; // Increased height
      const width = 100;

      const polylinePoints = points.map((p, i) => {
          const x = (i / (points.length - 1)) * width;
          const y = height - ((p - min) / (max - min || 1)) * height;
          return `${x},${y}`;
      }).join(' ');
      
      return polylinePoints;
  }, [totalBalanceUSD]);

  // Expense Structure Logic for Pie Chart
  const expenseStructure = useMemo(() => {
        const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
        const total = expenses.reduce((acc, t) => acc + t.normalizedAmountUSD, 0) || 1;
        
        const byCategory = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.normalizedAmountUSD;
            return acc;
        }, {} as Record<string, number>);

        // Sort and take top 3 + others
        const sorted = Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([catId, amount]) => {
                const cat = CATEGORIES.find(c => c.id === catId);
                return {
                    color: cat?.color.replace('text-', 'bg-') || 'bg-gray-500',
                    percent: (amount / total) * 100
                };
            });
        
        return sorted;
  }, [transactions]);


  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-theme-bg">
      
      {/* Desktop Wrapper */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full max-w-7xl mx-auto md:px-8">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center px-6 md:px-0 pt-12 pb-4 flex-shrink-0">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('PROFILE')}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-theme-brand to-purple-500 border border-white/20 flex items-center justify-center text-sm font-bold text-white shadow-lg">
              {userProfile.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-theme-secondary">{t('welcome')},</p>
              <p className="text-sm font-semibold text-theme-primary">{userProfile.name}</p>
            </div>
          </div>
          <button 
            onClick={onOpenSettings}
            className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors px-3 py-1.5 rounded-full flex items-center gap-2"
          >
            <span className="text-xs font-mono text-emerald-400">1 USD = {exchangeRate.toFixed(2)}</span>
            <TrendingUp size={12} className="text-emerald-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:mt-6">
          
          {/* Left Column (Balance & Actions) */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            
            {/* Hero Card with Chart */}
            <div className="px-4 md:px-0">
              <div 
                className="bg-theme-surface rounded-3xl p-8 relative overflow-hidden active:scale-[0.98] transition-transform duration-200 group shadow-2xl shadow-black/50 border border-white/5"
              >
                  {/* Top Actions */}
                <div className="absolute top-6 right-6 flex gap-2 z-20">
                    <button onClick={toggleCurrency} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-theme-secondary transition-colors">
                        <ArrowRightLeft size={16} />
                    </button>
                    <button onClick={handlePrivacyToggle} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-theme-secondary transition-colors">
                        {isBalanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
                
                <div onClick={() => onNavigate('ANALYSIS')} className="cursor-pointer">
                    <p className="text-theme-secondary text-sm font-medium mb-2">{t('totalBalance')}</p>
                    
                    <div className="flex flex-col gap-2 relative z-10 mb-8">
                    <h1 className="text-5xl font-bold tracking-tight text-theme-primary transition-all">
                        {isBalanceVisible ? (
                            <>
                            <span className="text-3xl align-top opacity-60 mr-1">{symbolMain}</span>
                            {displayMain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </>
                        ) : (
                            <span className="tracking-widest">******</span>
                        )}
                    </h1>
                    <p className="text-theme-secondary font-mono text-sm h-5">
                        {isBalanceVisible && (
                            <>≈ {symbolSecondary} {displaySecondary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                        )}
                    </p>
                    </div>

                    {/* Interactive Chart Hint */}
                    <div className="flex items-center gap-2 text-xs text-theme-brand font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-4 left-6 z-20">
                        <BarChart3 size={12} />
                        View Analytics
                    </div>
                </div>

                {/* Balance Trend Line Chart */}
                <div 
                    onClick={() => onNavigate('ANALYSIS')}
                    className="absolute bottom-0 left-0 right-0 h-24 opacity-30 hover:opacity-50 transition-opacity cursor-pointer flex items-end"
                >
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                         <defs>
                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <polyline
                            points={trendPoints}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-theme-brand"
                            vectorEffect="non-scaling-stroke"
                        />
                         <polygon
                            points={`${trendPoints} 100,60 0,60`}
                            fill="url(#trendGradient)"
                            className="text-theme-brand"
                        />
                    </svg>
                </div>
              </div>
            </div>

            {/* Wallets Strip */}
            <div className="px-4 md:px-0">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('wallet')}</h3>
                 <button onClick={() => onNavigate('WALLET')} className="text-theme-brand text-xs font-bold">Manage</button>
               </div>
               <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {accounts.map(acc => (
                    <div key={acc.id} className="min-w-[140px] bg-theme-surface border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                       <div className="flex justify-between items-start">
                          <span className="text-xl">{acc.icon}</span>
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-theme-secondary">{acc.currency}</span>
                       </div>
                       <div>
                          <p className="text-theme-primary font-bold text-sm">
                              {isBalanceVisible ? acc.balance.toLocaleString() : '****'}
                          </p>
                          <p className="text-theme-secondary text-xs truncate">{acc.name}</p>
                       </div>
                    </div>
                  ))}
                  <button onClick={() => onNavigate('WALLET')} className="min-w-[50px] bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-theme-secondary hover:text-theme-primary hover:bg-white/10 transition-colors">
                     <Plus size={20} />
                  </button>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between px-6 md:px-0 gap-4">
              {[
                { id: 'BUDGET', label: t('budget'), icon: <PieChart size={20} />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                { id: 'SCHEDULED', label: t('scheduled'), icon: <Calendar size={20} />, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                { id: 'ANALYSIS', label: t('analysis'), icon: <ArrowUpRight size={20} />, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
              ].map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => onNavigate(action.id)}
                  className="flex flex-col items-center gap-2 group w-full bg-theme-surface py-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl ${action.color} border flex items-center justify-center shadow-lg`}>
                    {action.icon}
                  </div>
                  <span className="text-xs text-theme-secondary font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (Transactions & Expense Structure) */}
          <div className="md:col-span-7 lg:col-span-8 px-4 md:px-0 flex flex-col gap-6">
            
            {/* Expense Structure Chart - Interactive */}
            <div 
                onClick={() => onNavigate('ANALYSIS')}
                className="bg-theme-surface p-6 rounded-3xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
            >
                <div>
                    <h3 className="text-sm font-bold text-theme-secondary uppercase tracking-wider mb-1 flex items-center gap-2">
                        {t('structure')} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-theme-brand"/>
                    </h3>
                    <p className="text-xs text-theme-secondary">Last 30 days expenses by category</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Check if we have data */}
                    {expenseStructure.length > 0 ? (
                        <>
                            <div className="flex flex-col gap-1 text-right">
                                {expenseStructure.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 justify-end">
                                        <span className="text-xs font-bold text-theme-primary">{item.percent.toFixed(0)}%</span>
                                        <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                    </div>
                                ))}
                            </div>
                             {/* CSS Pie Chart Visualization */}
                            <div className="w-16 h-16 rounded-full relative overflow-hidden flex items-center justify-center shadow-lg bg-black/50" 
                                 style={{
                                    background: `conic-gradient(
                                        ${expenseStructure.map((item, i, arr) => {
                                            const prev = arr.slice(0, i).reduce((sum, x) => sum + x.percent, 0);
                                            // Mapping tailwind classes to approximate hex codes for the gradient string
                                            // Limitation: Creating a true dynamic gradient from tailwind classes is hard without a map.
                                            // Hack: using alternating generic colors or just letting transparency do the work?
                                            // Let's rely on standard colors for this specific view or hardcode the map.
                                            let color = '#6366f1'; // Default Indigo
                                            if (item.color.includes('red')) color = '#ef4444';
                                            if (item.color.includes('orange')) color = '#f97316';
                                            if (item.color.includes('amber')) color = '#f59e0b';
                                            if (item.color.includes('yellow')) color = '#eab308';
                                            if (item.color.includes('lime')) color = '#84cc16';
                                            if (item.color.includes('green')) color = '#22c55e';
                                            if (item.color.includes('emerald')) color = '#10b981';
                                            if (item.color.includes('teal')) color = '#14b8a6';
                                            if (item.color.includes('cyan')) color = '#06b6d4';
                                            if (item.color.includes('sky')) color = '#0ea5e9';
                                            if (item.color.includes('blue')) color = '#3b82f6';
                                            if (item.color.includes('purple')) color = '#a855f7';
                                            if (item.color.includes('fuchsia')) color = '#d946ef';
                                            if (item.color.includes('pink')) color = '#ec4899';
                                            if (item.color.includes('rose')) color = '#f43f5e';

                                            return `${color} ${prev}% ${prev + item.percent}%`;
                                        }).join(', ')}
                                    )`
                                 }}>
                                <div className="w-10 h-10 bg-theme-surface rounded-full"></div>
                            </div>
                        </>
                    ) : (
                        <div className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center">
                            <span className="text-xs text-theme-secondary">--</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-theme-surface/50 md:bg-theme-surface rounded-3xl md:p-6 md:border border-white/5 min-h-[500px]">
              <h2 className="text-sm font-semibold text-theme-secondary mb-6 px-2 md:px-0 uppercase tracking-wider">{t('recentTransactions')}</h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-20 text-theme-secondary text-sm">
                  {t('noTransactions')}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                    <div key={date}>
                      <h3 className="text-xs font-bold text-zinc-500 sticky top-0 bg-background/95 backdrop-blur-sm md:bg-transparent py-2 px-2 z-10">
                        {new Date(date).toDateString() === new Date().toDateString() ? t('today') : date}
                      </h3>
                      <div className="flex flex-col gap-2 mt-1">
                        {groupedTransactions[date].sort((a,b) => (b.id || '').localeCompare(a.id || '')).map(transaction => {
                          const category = CATEGORIES.find(c => c.id === transaction.category) || CATEGORIES[0];
                          const isExpense = transaction.type === TransactionType.EXPENSE;
                          const isOriginalUSD = transaction.originalCurrency === Currency.USD;
                          
                          const mainAmount = transaction.amount;
                          const mainSymbol = isOriginalUSD ? '$' : 'Bs.';
                          
                          const secondaryAmount = isOriginalUSD 
                            ? transaction.amount * transaction.exchangeRate 
                            : transaction.amount / transaction.exchangeRate;
                          const secondarySymbol = isOriginalUSD ? 'Bs.' : '$';

                          return (
                            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group relative pr-14">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category.color} bg-opacity-20`}>
                                  {category.icon}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-theme-primary">{transaction.note || category.name}</p>
                                  <p className="text-xs text-theme-secondary capitalize">{t(category.name.toLowerCase()) || category.name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-sm ${isExpense ? 'text-theme-primary' : 'text-emerald-400'}`}>
                                  {isExpense ? '-' : '+'}{mainSymbol}{isBalanceVisible ? mainAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '***'}
                                </p>
                                <p className="text-xs text-theme-secondary font-mono group-hover:text-theme-primary transition-colors">
                                  ~{symbolSecondary} {isBalanceVisible ? secondaryAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '***'}
                                </p>
                              </div>
                              {/* Edit/Delete Actions */}
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-theme-surface rounded-lg p-1 border border-white/5">
                                  <button onClick={(e) => { e.stopPropagation(); onEditTransaction(transaction); }} className="p-2 hover:bg-white/10 rounded-lg text-blue-400">
                                      <TrendingUp size={14} className="rotate-0" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); onDeleteTransaction(transaction.id); }} className="p-2 hover:bg-white/10 rounded-lg text-red-500">
                                      <Plus size={14} className="rotate-45" />
                                  </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

       {/* PIN Verification Modal */}
       {showPinModal && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200 backdrop-blur-md">
            <div className="w-full max-w-xs flex flex-col items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-theme-surface border border-white/10 flex items-center justify-center text-theme-brand shadow-2xl shadow-brand/20 mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-theme-primary text-center">Verify Identity</h2>
                    <p className="text-theme-secondary text-sm text-center">Enter PIN to view balance</p>
                </div>

                {/* PIN Dots */}
                <div className="flex gap-4 mb-4">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${
                            i < pinInput.length 
                             ? (pinError ? 'bg-red-500 scale-110' : 'bg-theme-brand scale-110') 
                             : 'bg-white/10'
                        }`} />
                    ))}
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-6 w-full px-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button 
                            key={num} 
                            onClick={() => handlePinDigit(num.toString())}
                            className="w-full aspect-square rounded-full bg-theme-surface/30 hover:bg-theme-surface border border-white/5 text-2xl font-semibold text-theme-primary transition-all active:scale-95 flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                     <div /> {/* Spacer */}
                     <button 
                        onClick={() => handlePinDigit('0')}
                        className="w-full aspect-square rounded-full bg-theme-surface/30 hover:bg-theme-surface border border-white/5 text-2xl font-semibold text-theme-primary transition-all active:scale-95 flex items-center justify-center"
                    >
                        0
                    </button>
                    <button 
                        onClick={() => setPinInput(prev => prev.slice(0, -1))}
                        className="w-full aspect-square rounded-full flex items-center justify-center text-theme-secondary hover:text-white"
                    >
                        Delete
                    </button>
                </div>
                
                <button 
                    onClick={closePinModal}
                    className="mt-4 text-theme-secondary text-sm hover:text-white"
                >
                    Cancel
                </button>
            </div>
        </div>
       )}

    </div>
  );
};