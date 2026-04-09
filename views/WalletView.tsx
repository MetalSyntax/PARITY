import React, { useState, useMemo } from 'react';
import { ArrowLeft, Wallet, TrendingUp, Filter, Search, Plus, DollarSign, ChevronDown, Edit2, Trash2, X, RefreshCw, Coins, Layers, Calendar, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Account, Language, Currency, Transaction, TransactionType, ScheduledPayment, ConfirmConfig } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';
import { renderAccountIcon, ACCOUNT_ICONS } from '../utils/iconUtils';
import { CurrencyAmount } from '../components/CurrencyAmount';
import { TransactionItem } from '../components/TransactionItem';
import { formatAmount } from '../utils/formatUtils';


interface WalletViewProps {
  onBack: () => void;
  accounts: Account[];
  onUpdateAccounts: (accounts: Account[]) => void;
  lang: Language;
  transactions: Transaction[];
  exchangeRate: number;
  scheduledPayments: ScheduledPayment[];
  isBalanceVisible: boolean;
  onToggleBottomNav: (show: boolean) => void;
  showConfirm: (config: ConfirmConfig) => void;
  onConfirmPayment: (payment: ScheduledPayment) => void;
  displayCurrency: Currency;
  onToggleDisplayCurrency: () => void;
  euroRate?: number;
  initialTab?: 'INCOME' | 'WALLETS';
}

export const WalletView: React.FC<WalletViewProps> = ({ 
    onBack, 
    accounts, 
    onUpdateAccounts, 
    lang, 
    transactions, 
    exchangeRate, 
    scheduledPayments, 
    isBalanceVisible, 
    onToggleBottomNav,
    showConfirm,
    onConfirmPayment,
    displayCurrency,
    onToggleDisplayCurrency,
    euroRate,
    initialTab = 'INCOME'
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('wallet');
  const [payrollClient, setPayrollClient] = useState('');
  const [activeTab, setActiveTab] = useState<'INCOME' | 'WALLETS'>(initialTab);
  
  React.useEffect(() => {
    onToggleBottomNav(!isEditing);
  }, [isEditing, onToggleBottomNav]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const currentMonth = selectedMonth; 

  // Parse YYYY-MM to Date object correctly for local time
  const [year, month] = currentMonth.split('-').map(Number);
  const dateObj = new Date(year, month - 1);
  const currentMonthName = dateObj.toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' });

  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const totalIncome = monthlyTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);

  const totalExpense = monthlyTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);

  const netMonthly = totalIncome - totalExpense;
  
  const incomeTransactions = useMemo(() => {
    return monthlyTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthlyTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    incomeTransactions.forEach((tx) => {
      const date = tx.date.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    });
    return groups;
  }, [incomeTransactions]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedTransactions).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedTransactions]);

  const scheduledIncomes = scheduledPayments.filter(p => p.type === TransactionType.INCOME);

  const activeSources = CATEGORIES
      .map(cat => {
          const realizedIncome = monthlyTransactions
              .filter(t => t.type === TransactionType.INCOME && t.category === cat.id)
              .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
          
          const projectedIncome = scheduledIncomes
              .filter(p => p.category === cat.id && p.date.startsWith(currentMonth))
              .reduce((acc, p) => acc + (p.currency === Currency.USD ? p.amount : p.amount / exchangeRate), 0);

          return { ...cat, total: realizedIncome + projectedIncome };
      })
      .filter(cat => cat.total > 0)
      .sort((a,b) => b.total - a.total);
  const totalScheduledIncome = scheduledIncomes
    .filter(p => p.date.startsWith(currentMonth))
    .reduce((acc, p) => acc + (p.currency === Currency.USD ? p.amount : p.amount / exchangeRate), 0);

  const startEdit = (acc?: Account) => {
      if (acc) {
          setEditingId(acc.id);
          setName(acc.name);
          setCurrency(acc.currency);
          setBalance(acc.balance.toString());
          setIcon(acc.icon);
          setPayrollClient(acc.payrollClient || '');
      } else {
          setEditingId(null);
          setName('');
          setCurrency(Currency.USD);
          setBalance('0');
          setIcon('wallet');
          setPayrollClient('');
      }
      setIsEditing(true);
  };

  const handleSave = () => {
      if (!name) return;
      
      const newAccount: Account = {
          id: editingId || Math.random().toString(36).substr(2, 9),
          name,
          currency,
          balance: parseFloat(balance) || 0,
          icon,
          payrollClient,
          // Assign random gradient color if new
          color: editingId ? (accounts.find(a => a.id === editingId)?.color) : 'from-indigo-500 to-purple-600'
      };

      if (editingId) {
          onUpdateAccounts(accounts.map(a => a.id === editingId ? newAccount : a));
      } else {
          onUpdateAccounts([...accounts, newAccount]);
      }
      setIsEditing(false);
  };

  const handleDelete = (id: string) => {
      showConfirm({
          message: t('deleteWalletConfirm'),
          onConfirm: () => {
              onUpdateAccounts(accounts.filter(a => a.id !== id));
          }
      });
  };


  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto bg-theme-bg overflow-hidden">
      
      {/* Utility Bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
         <div className="relative">
            <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="bg-theme-surface border border-white/5 text-xs font-bold text-theme-secondary rounded-2xl px-4 py-2 outline-none focus:border-theme-soft/50 transition-all cursor-pointer hover:text-theme-primary flex items-center gap-2 min-w-[140px] justify-between"
            >
                <span>{currentMonthName}</span>
                <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-200 ${showMonthPicker ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {showMonthPicker && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowMonthPicker(false)} />
                    <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full mt-2 left-0 w-48 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                    >
                    <div className="max-h-[320px] overflow-y-auto no-scrollbar py-2">
                        {(() => {
                            const months = new Set<string>();
                            const current = new Date().toISOString().slice(0, 7);
                            months.add(current);
                            transactions.forEach(t => months.add(t.date.slice(0, 7)));
                            return Array.from(months).sort().reverse().map(m => {
                                const [y, mon] = m.split('-').map(Number);
                                const dObj = new Date(y, mon - 1);
                                const mName = dObj.toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' });
                                
                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            setSelectedMonth(m);
                                            setShowMonthPicker(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-xs font-black transition-colors hover:bg-white/5 ${selectedMonth === m ? 'text-theme-brand bg-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                                    >
                                        {mName}
                                    </button>
                                );
                            });
                        })()}
                    </div>
                    </motion.div>
                </>
                )}
            </AnimatePresence>
         </div>
         <div className="flex items-center gap-2">
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleDisplayCurrency}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/5 transition-all font-black text-[10px] ${displayCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
            >
                <div className="w-4 h-4 flex items-center justify-center">
                    {displayCurrency === Currency.VES ? (
                        <span className="text-[9px] font-black leading-none">Bs</span>
                    ) : displayCurrency === Currency.EUR ? (
                        <Euro size={14} />
                    ) : (
                        <DollarSign size={14} />
                    )}
                </div>
                <span className="hidden sm:inline">{displayCurrency}</span>
            </motion.button>
            {activeTab === 'WALLETS' && (
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit()} 
                    className="p-2 bg-theme-brand rounded-full text-white shadow-lg shadow-brand/20"
                >
                    <Plus size={20} />
                </motion.button>
            )}
         </div>
      </div>

      {/* Main Header */}
      <div className="flex items-center gap-4 mb-6">
           <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack} 
              className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
           >
              <ArrowLeft size={20} />
           </motion.button>
           <div>
              <h1 className="text-xl font-bold text-theme-primary">{t('wallet')} & {t('income')}</h1>
              <p className="text-xs text-theme-secondary font-medium">{t('walletSubtitle')}</p>
           </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-theme-surface rounded-2xl mb-8 flex-shrink-0">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('INCOME')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'INCOME' ? 'bg-theme-bg text-theme-primary shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
              <TrendingUp size={16} className={activeTab === 'INCOME' ? 'text-theme-brand' : ''} />
              {t('income')}
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('WALLETS')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'WALLETS' ? 'bg-theme-bg text-theme-primary shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
              <Wallet size={16} className={activeTab === 'WALLETS' ? 'text-theme-brand' : ''} />
              {t('wallet')}
          </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
          {activeTab === 'INCOME' ? (
              <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Active Sources Section */}
                  <div>
                      <div className="flex items-center gap-2 mb-4 px-1">
                          <Layers size={14} className="text-theme-secondary" />
                          <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('activeSources')} ({activeSources.length})</span>
                      </div>
                      
                      {activeSources.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-2">
                            {activeSources.map(source => (
                                <div key={source.id} className="min-w-[140px] bg-theme-surface border border-white/5 p-4 rounded-2xl flex flex-col gap-3 group hover:border-theme-soft/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-2xl filter drop-shadow-lg">{source.icon}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${source.color.includes('green') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                                            {totalIncome > 0 ? Math.round((source.total / totalIncome) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div>
                                        <CurrencyAmount
                                          amount={source.total}
                                          exchangeRate={exchangeRate}
                                          euroRate={euroRate}
                                          displayCurrency={displayCurrency}
                                          isBalanceVisible={isBalanceVisible}
                                          showSecondary={true}
                                          size="sm"
                                          weight="bold"
                                          className="items-start"
                                          secondaryClassName="items-start"
                                          showPlusMinus={false}
                                        />
                                        <p className="text-theme-secondary text-[10px] uppercase font-bold tracking-tight truncate mt-1">{t(source.name)}</p>
                                    </div>
                                </div>
                            ))}
                          </div>
                      ) : (
                          <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-sm text-theme-secondary bg-theme-surface/30">
                              {t('noActiveSources')}
                          </div>
                      )}

                      {/* Scheduled Incomes Strip */}
                      {scheduledIncomes.length > 0 && (
                          <div className="mt-6">
                              <div className="flex items-center gap-2 mb-4 px-1">
                                  <Calendar size={14} className="text-emerald-400" />
                                  <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('scheduledIncome')}</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-2">
                                {scheduledIncomes.map(income => (
                                    <div key={income.id} className="min-w-[140px] bg-theme-surface/50 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 border-l-4 border-l-emerald-500 shadow-xl shadow-black/20 relative group">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-theme-primary truncate max-w-[100px]">{income.name}</span>
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                {CATEGORIES.find(c => c.id === income.category)?.icon || <Calendar size={12} className="text-emerald-400" />}
                                            </div>
                                        </div>
                                        <div>
                                            <CurrencyAmount
                                              amount={income.currency === Currency.USD ? income.amount : income.amount / exchangeRate}
                                              exchangeRate={exchangeRate}
                                              euroRate={euroRate}
                                              displayCurrency={displayCurrency}
                                              isBalanceVisible={isBalanceVisible}
                                              size="sm"
                                              weight="bold"
                                              className="items-start text-emerald-400"
                                              showPlusMinus={false}
                                            />
                                            <p className="text-[9px] text-theme-secondary font-bold uppercase tracking-tight mt-1">
                                              {new Date(income.date.split('T')[0] + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {t(income.frequency === 'Bi-weekly' ? 'biweekly' : income.frequency === 'One-Time' ? 'oneTime' : income.frequency.toLowerCase()) || income.frequency}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Stats Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {/* Total Incomes */}
                       <div className="bg-theme-surface p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                           <div className="absolute bottom-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                               <TrendingUp size={120} className="text-emerald-500" />
                           </div>
                           <p className="text-xs text-theme-secondary uppercase tracking-wider mb-2 font-bold">{t('totalMonthlyIncome')}</p>
                           <div className="mb-6">
                               <CurrencyAmount
                                 amount={totalIncome}
                                 exchangeRate={exchangeRate}
                                 euroRate={euroRate}
                                 displayCurrency={displayCurrency}
                                 isBalanceVisible={isBalanceVisible}
                                 showSecondary={true}
                                 size="2xl"
                                 weight="black"
                                 className="items-start"
                                 type="income"
                                />
                           </div>
                           
                           <div className="space-y-3">
                               <div className="flex justify-between text-xs">
                                   <span className="text-theme-secondary font-medium">{t('realizedIncome')}</span>
                                   <span className="text-theme-primary font-bold">{formatAmount(totalIncome - totalScheduledIncome, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}</span>
                               </div>
                               <div className="flex justify-between text-xs">
                                   <span className="text-theme-secondary font-medium">{t('pendingPayments')}</span>
                                   <span className="text-amber-400 font-bold">{formatAmount(totalScheduledIncome, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}</span>
                               </div>
                           </div>
                       </div>

                       {/* Net Monthly */}
                       <div className="bg-gradient-to-br from-theme-surface to-black p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between group">
                           <div className="absolute bottom-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                               <Wallet size={120} />
                           </div>
                           <div>
                             <p className="text-xs text-theme-secondary uppercase tracking-wider mb-1 font-bold">{t('totalNetMonthly')}</p>
                             <p className="text-[10px] text-zinc-500 leading-tight font-medium">{t('incomeExpenseDiff')}</p>
                           </div>
                           <div className="mt-8">
                               <CurrencyAmount
                                 amount={netMonthly}
                                 exchangeRate={exchangeRate}
                                 euroRate={euroRate}
                                 displayCurrency={displayCurrency}
                                 isBalanceVisible={isBalanceVisible}
                                 showSecondary={true}
                                 size="2xl"
                                 weight="black"
                                 className="items-start"
                                 type={netMonthly >= 0 ? 'income' : 'expense'}
                               />
                           </div>
                           <div className={`text-[10px] font-black mt-4 px-3 py-1.5 rounded-full w-fit uppercase tracking-wider ${netMonthly >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                               {netMonthly >= 0 ? `+ ${t('positiveFlow')}` : `- ${t('negativeFlow')}`}
                           </div>
                       </div>
                  </div>

                  {/* Realized Income List */}
                  <div className="mt-8">
                      <div className="flex items-center gap-2 mb-6 px-1">
                          <TrendingUp size={14} className="text-theme-brand" />
                          <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('realizedIncomeHistory')}</span>
                      </div>

                      {sortedDates.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-theme-surface/10">
                              <p className="text-xs text-theme-secondary font-bold uppercase tracking-widest opacity-40">{t('noTransactionsFound')}</p>
                          </div>
                      ) : (
                          <div className="flex flex-col gap-6">
                              {sortedDates.map((date) => (
                                  <div key={date}>
                                      <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] mb-4 sticky top-0 bg-theme-bg/95 backdrop-blur-md py-2 z-10">
                                          {(() => {
                                              const dateObj = new Date(`${date}T12:00:00`);
                                              const todayStr = new Date().toISOString().split('T')[0];
                                              const yesterday = new Date();
                                              yesterday.setDate(yesterday.getDate() - 1);
                                              const yesterdayStr = yesterday.toISOString().split('T')[0];
                                              
                                              if (date === todayStr) return t('today');
                                              if (date === yesterdayStr) return t('yesterday');
                                              return dateObj.toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'long' });
                                          })()}
                                      </h3>
                                      <div className="flex flex-col gap-3">
                                          {groupedTransactions[date].map((tx) => (
                                              <TransactionItem
                                                  key={tx.id}
                                                  transaction={tx}
                                                  accounts={accounts}
                                                  lang={lang}
                                                  displayCurrency={displayCurrency}
                                                  exchangeRate={exchangeRate}
                                                  euroRate={euroRate}
                                                  isBalanceVisible={isBalanceVisible}
                                                  onClick={() => {}}
                                              />
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          ) : (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-theme-secondary" />
                        <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('yourWallets')} ({accounts.length})</span>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.length === 0 && (
                        <div className="text-center py-16 px-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-6 bg-theme-surface/20">
                            <div className="w-20 h-20 rounded-full bg-theme-surface flex items-center justify-center text-4xl shadow-xl border border-white/5 animate-bounce">
                                <Wallet size={24} className="text-theme-secondary" />
                            </div>
                             <div>
                                 <h3 className="text-theme-primary font-black text-xl mb-2">{t('noWallets')}</h3>
                                 <p className="text-theme-secondary text-sm max-w-[240px] mx-auto leading-relaxed">{t('createFirstWallet')}</p>
                             </div>
                             <button onClick={() => startEdit()} className="px-8 py-4 bg-theme-brand text-white font-bold rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 transition-all mt-2">{t('createWallet')}</button>
                        </div>
                    )}
                    {accounts.map(acc => {
                      const stripClass = acc.color ? `bg-gradient-to-b ${acc.color}` : 'bg-theme-brand';
                      const amountUSD = acc.currency === Currency.USD || acc.currency === Currency.USDT ? acc.balance : (acc.currency === Currency.EUR ? (acc.balance * (euroRate || 0)) / exchangeRate : acc.balance / exchangeRate);

                      return (
                      <motion.div 
                        layout
                        key={acc.id} 
                        className="bg-theme-surface p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all flex-shrink-0 shadow-xl hover:shadow-black/40"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${stripClass}`} />
                        
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <motion.div 
                                    whileHover={{ rotate: 10 }}
                                    className="w-14 h-14 rounded-2xl bg-theme-bg flex items-center justify-center text-theme-brand border border-white/5 shadow-inner"
                                >
                                    {renderAccountIcon(acc.icon, 28)}
                                </motion.div>
                                <div>
                                    <h3 className="font-black text-xl text-theme-primary">{acc.name}</h3>
                                    {acc.payrollClient && (
                                        <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-emerald-500/10 rounded-full w-fit">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{acc.payrollClient}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => startEdit(acc)} 
                                    className="p-2.5 bg-theme-bg border border-white/5 rounded-2xl text-theme-secondary hover:text-theme-brand transition-colors"
                                >
                                    <Edit2 size={18} />
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(acc.id)} 
                                    className="p-2.5 bg-theme-bg border border-white/5 rounded-2xl text-red-400 hover:text-white hover:bg-red-500 transition-all"
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="flex flex-col gap-2">
                                <span className="text-theme-secondary text-[10px] font-bold uppercase tracking-widest opacity-60">{t('availableBalance')}</span>
                                <span className="bg-theme-bg px-3 py-1 rounded-lg text-[10px] font-black font-mono text-zinc-400 border border-white/5 w-fit shadow-inner">{acc.currency === Currency.VES ? 'Bs' : acc.currency}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <CurrencyAmount
                                  amount={amountUSD}
                                  exchangeRate={exchangeRate}
                                  euroRate={euroRate}
                                  displayCurrency={displayCurrency}
                                  isBalanceVisible={isBalanceVisible}
                                  size="2xl"
                                  weight="black"
                                  className="items-end"
                                />
                            </div>
                        </div>
                      </motion.div>
                    )})}
                  </div>
              </div>
          )}
      </div>

      {/* Wallet Edit Modal */}
      <AnimatePresence>
        {isEditing && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4"
            >
                <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="bg-theme-surface w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-theme-soft overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 border-b border-theme-soft flex justify-between items-center bg-theme-surface/50 shrink-0">
                        <h2 className="text-xl font-black text-theme-primary tracking-tight">{editingId ? t('editAccount') : t('newAccount')}</h2>
                        <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-theme-soft rounded-full transition-colors">
                            <X size={20} className="text-theme-secondary" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto no-scrollbar space-y-6 flex-1">
                        <div>
                            <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('name')}</label>
                            <input 
                                className="w-full bg-theme-bg border border-white/10 rounded-2xl p-4 text-theme-primary outline-none focus:border-theme-soft transition-colors" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder={t('walletNamePlaceholder')} 
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('currency')}</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[Currency.USD, Currency.EUR, Currency.VES, Currency.USDT].map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => setCurrency(c)} 
                                        className={`py-3 rounded-2xl border text-xs font-black transition-all ${currency === c ? 'bg-theme-brand border-theme-soft text-white shadow-lg shadow-theme-brand/20' : 'bg-theme-bg border-white/10 text-theme-secondary hover:bg-theme-soft'}`}
                                    >
                                        {c === Currency.VES ? 'Bs' : c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('initialBalance')}</label>
                            <input 
                                type="number" 
                                className="w-full bg-theme-bg border border-white/10 rounded-2xl p-4 text-theme-primary outline-none focus:border-theme-soft transition-colors" 
                                value={balance} 
                                onChange={e => setBalance(e.target.value)} 
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('icon')}</label>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {Object.keys(ACCOUNT_ICONS).map(key => (
                                    <button 
                                        key={key} 
                                        onClick={() => setIcon(key)} 
                                        className={`p-4 rounded-2xl transition-all border shrink-0 ${icon === key ? 'bg-theme-brand border-theme-soft text-white shadow-lg' : 'bg-theme-bg border-white/10 text-theme-secondary hover:bg-theme-soft'}`}
                                    >
                                        {renderAccountIcon(key, 22)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('payrollClient')} {t('optional')}</label>
                            <input 
                                className="w-full bg-theme-bg border border-white/10 rounded-2xl p-4 text-theme-primary outline-none focus:border-theme-soft transition-colors" 
                                value={payrollClient} 
                                onChange={e => setPayrollClient(e.target.value)} 
                                placeholder={t('examplePayroll')} 
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-theme-surface shrink-0">
                        <button 
                            onClick={handleSave} 
                            className="w-full bg-theme-brand text-white font-black py-4 rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                            {t('saveWallet')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};