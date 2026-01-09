import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  ArrowUpRight,
  Plus,
  Calendar
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
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  accounts, 
  transactions, 
  exchangeRate, 
  onOpenSettings,
  onNavigate,
  userProfile
}) => {
  const [primaryCurrency, setPrimaryCurrency] = useState<Currency>(Currency.USD);
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

  const toggleCurrency = () => {
    setPrimaryCurrency(prev => prev === Currency.USD ? Currency.VES : Currency.USD);
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

  // Chart Logic: 7 Day Trend (Mocked relative to balance for visuals)
  const trendPoints = useMemo(() => {
      const points = [totalBalanceUSD * 0.9, totalBalanceUSD * 0.92, totalBalanceUSD * 0.88, totalBalanceUSD * 0.95, totalBalanceUSD * 0.98, totalBalanceUSD];
      const min = Math.min(...points);
      const max = Math.max(...points);
      const height = 40;
      const width = 100;
      return points.map((p, i) => {
          const x = (i / (points.length - 1)) * width;
          const y = height - ((p - min) / (max - min || 1)) * height;
          return `${x},${y}`;
      }).join(' ');
  }, [totalBalanceUSD]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-background">
      
      {/* Desktop Wrapper */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full max-w-7xl mx-auto md:px-8">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center px-6 md:px-0 pt-12 pb-4 flex-shrink-0">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('PROFILE')}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 flex items-center justify-center text-sm font-bold text-white shadow-lg">
              {userProfile.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-zinc-400">{t('welcome')},</p>
              <p className="text-sm font-semibold text-white">{userProfile.name}</p>
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
                onClick={toggleCurrency}
                className="glass-card rounded-3xl p-8 relative overflow-hidden active:scale-[0.98] transition-transform duration-200 cursor-pointer group shadow-2xl shadow-black/50 bg-gradient-to-br from-[#1a1a1a] to-black"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ArrowRightLeft size={16} className="text-white/50" />
                </div>
                
                <p className="text-zinc-400 text-sm font-medium mb-2">{t('totalBalance')}</p>
                
                <div className="flex flex-col gap-2 relative z-10">
                  <h1 className="text-5xl font-bold tracking-tight text-white">
                    <span className="text-3xl align-top opacity-60 mr-1">{symbolMain}</span>
                    {displayMain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h1>
                  <p className="text-zinc-500 font-mono text-sm">
                    ≈ {symbolSecondary} {displaySecondary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Balance Trend Line Chart */}
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                        <polyline
                            points={trendPoints}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-indigo-500"
                        />
                         <polygon
                            points={`${trendPoints} 100,40 0,40`}
                            fill="currentColor"
                            className="text-indigo-500 opacity-20"
                        />
                    </svg>
                </div>
              </div>
            </div>

            {/* Wallets Strip */}
            <div className="px-4 md:px-0">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('wallet')}</h3>
                 <button onClick={() => onNavigate('WALLET')} className="text-indigo-400 text-xs font-bold">Manage</button>
               </div>
               <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {accounts.map(acc => (
                    <div key={acc.id} className="min-w-[140px] bg-[#121212] border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                       <div className="flex justify-between items-start">
                          <span className="text-xl">{acc.icon}</span>
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">{acc.currency}</span>
                       </div>
                       <div>
                          <p className="text-white font-bold text-sm">{acc.balance.toLocaleString()}</p>
                          <p className="text-zinc-500 text-xs truncate">{acc.name}</p>
                       </div>
                    </div>
                  ))}
                  <button onClick={() => onNavigate('WALLET')} className="min-w-[50px] bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-colors">
                     <Plus size={20} />
                  </button>
               </div>
            </div>

            {/* Action Buttons (Replaced Transfer with Scheduled) */}
            <div className="flex justify-between px-6 md:px-0 gap-4">
              {[
                { id: 'BUDGET', label: t('budget'), icon: <PieChart size={20} />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                { id: 'SCHEDULED', label: t('scheduled'), icon: <Calendar size={20} />, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                { id: 'ANALYSIS', label: t('analysis'), icon: <ArrowUpRight size={20} />, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
              ].map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => onNavigate(action.id)}
                  className="flex flex-col items-center gap-2 group w-full bg-[#121212] py-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl ${action.color} border flex items-center justify-center shadow-lg`}>
                    {action.icon}
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (Transactions & Expense Structure) */}
          <div className="md:col-span-7 lg:col-span-8 px-4 md:px-0 flex flex-col gap-6">
            
            {/* Simple Expense Structure Donut (Visual only for now) */}
            <div className="bg-[#121212] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">{t('structure')}</h3>
                    <p className="text-xs text-zinc-500">Last 30 days</p>
                </div>
                <div className="flex gap-2">
                    {/* Mock Donut segments */}
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-r-transparent border-b-emerald-500 border-l-orange-500 rotate-45"></div>
                </div>
            </div>

            <div className="bg-[#121212]/50 md:bg-[#121212] rounded-3xl md:p-6 md:border border-white/5 min-h-[500px]">
              <h2 className="text-sm font-semibold text-zinc-400 mb-6 px-2 md:px-0 uppercase tracking-wider">{t('recentTransactions')}</h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-20 text-zinc-600 text-sm">
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
                        {groupedTransactions[date].sort((a,b) => b.id.localeCompare(a.id)).map(transaction => {
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
                            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category.color} bg-opacity-20`}>
                                  {category.icon}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-white">{transaction.note || category.name}</p>
                                  <p className="text-xs text-zinc-500 capitalize">{t(category.name.toLowerCase()) || category.name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-sm ${isExpense ? 'text-white' : 'text-income'}`}>
                                  {isExpense ? '-' : '+'}{mainSymbol}{mainAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-zinc-600 font-mono group-hover:text-zinc-500 transition-colors">
                                  ~{symbolSecondary} {secondaryAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </p>
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
    </div>
  );
};