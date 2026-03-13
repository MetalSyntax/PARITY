import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, X, Edit2, Trash2, Wallet, TrendingUp, TrendingDown, Layers, Calendar, ChevronDown, Coins, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Account, Language, Currency, Transaction, TransactionType, ScheduledPayment, ConfirmConfig } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';
import { renderAccountIcon, ACCOUNT_ICONS } from '../utils/iconUtils';


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
    euroRate
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
  const [activeTab, setActiveTab] = useState<'INCOME' | 'WALLETS'>('INCOME');
  
  React.useEffect(() => {
    onToggleBottomNav(!isEditing);
  }, [isEditing, onToggleBottomNav]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
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

  // Mocking "Savings" and "Commissions" logic for now as they aren't explicit types yet
  // We can try to infer from categories if they exist, or just show 0 / Mock for visuals if requested "Justo como en la imagen"
  // Assuming 'savings' is a category, and 'fees' is commission.
  const savings = monthlyTransactions
      .filter(t => t.type === TransactionType.EXPENSE && (t.category === 'savings' || t.category === 'invest')) // Mock IDs
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
  
  // Commissions usually expenses? Or Income deductions? Let's assume expenses for 'fees'
  const commissions = monthlyTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category === 'fees')
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);

  // Safe Conversions
  const safeRate = exchangeRate;

  const formatAmount = (usd: number) => {
    if (!isBalanceVisible) return '******';
    let val = usd;
    let symbol = '$';
    
    if (displayCurrency === Currency.VES) {
      val = usd * exchangeRate;
      symbol = 'Bs.';
    } else if (displayCurrency === Currency.EUR) {
      val = (usd * exchangeRate) / (euroRate || 1);
      symbol = '€';
    }
    
    return `${symbol}${val?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSecondary = (usd: number) => {
    if (!isBalanceVisible) return '';
    let val: number;
    let symbol: string;

    if (displayCurrency === Currency.USD) {
      val = usd * exchangeRate;
      symbol = 'Bs.';
    } else {
      val = usd;
      symbol = '$';
    }
    
    return `${symbol} ${val?.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

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
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-1 group relative w-fit">
                    <p className="text-[10px] text-theme-brand font-bold uppercase tracking-widest">{currentMonthName}</p>
                    <ChevronDown size={10} className="text-theme-brand" />
                    <select
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        value={selectedMonth}
                    >
                        {(() => {
                            const months = new Set<string>();
                            const current = new Date().toISOString().slice(0, 7);
                            months.add(current);
                            transactions.forEach(t => months.add(t.date.slice(0, 7)));
                            return Array.from(months).sort().reverse().map(m => (
                                <option key={m} value={m}>{m}</option>
                            ));
                        })()}
                    </select>
                </div>
             </div>
        </div>
        <div className="flex items-center gap-2">
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleDisplayCurrency}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 transition-all font-black text-[10px] ${displayCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
            >
                {displayCurrency === Currency.VES ? <Coins size={14} /> : <DollarSign size={14} />}
                <span className="hidden sm:inline">{displayCurrency === Currency.VES ? 'Bs.' : displayCurrency}</span>
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

      {/* Tabs */}
      <div className="flex p-1 bg-theme-surface rounded-2xl border border-white/5 mb-8 flex-shrink-0">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('INCOME')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'INCOME' ? 'bg-theme-bg text-theme-primary shadow-lg border border-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
              <TrendingUp size={16} className={activeTab === 'INCOME' ? 'text-theme-brand' : ''} />
              {t('income')}
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('WALLETS')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'WALLETS' ? 'bg-theme-bg text-theme-primary shadow-lg border border-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
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
                                <div key={source.id} className="min-w-[140px] bg-theme-surface border border-white/5 p-4 rounded-3xl flex flex-col gap-3 group hover:border-theme-soft/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-2xl filter drop-shadow-lg">{source.icon}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${source.color.includes('green') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                                            {Math.round((source.total / totalIncome) * 100)}%
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-theme-primary font-bold text-lg leading-none mb-1">{formatAmount(source.total)}</p>
                                        <p className="text-[10px] text-emerald-400 font-bold mb-1 opacity-70">
                                            {formatSecondary(source.total)}
                                        </p>
                                        <p className="text-theme-secondary text-[10px] uppercase font-bold tracking-tight truncate">{t(source.name)}</p>
                                    </div>
                                </div>
                            ))}
                          </div>
                      ) : (
                          <div className="p-8 border border-dashed border-white/10 rounded-3xl text-center text-sm text-theme-secondary bg-theme-surface/30">
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
                                    <div key={income.id} className="min-w-[140px] bg-theme-surface/50 border border-white/5 p-4 rounded-3xl flex flex-col gap-3 border-l-4 border-l-emerald-500 shadow-xl shadow-black/20 relative group">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-theme-primary truncate max-w-[100px]">{income.name}</span>
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                {CATEGORIES.find(c => c.id === income.category)?.icon || <Calendar size={12} className="text-emerald-400" />}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-emerald-400 font-bold text-lg leading-none mb-1">
                                                {formatAmount(income.currency === Currency.USD ? income.amount : income.amount / exchangeRate)}
                                            </p>
                                            <p className="text-[9px] text-theme-secondary font-bold uppercase tracking-tight">
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
                      {/* Total Income Resume */}
                      <div className="bg-theme-surface p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                              <TrendingUp size={120} />
                          </div>
                          <p className="text-xs text-theme-secondary uppercase tracking-wider mb-2 font-bold">{t('totalMonthlyIncome')}</p>
                          <div className="mb-6">
                              <h3 className="text-2xl font-black text-emerald-400">{formatAmount(totalIncome)}</h3>
                              {isBalanceVisible && <p className="text-xs text-emerald-400/60 font-mono font-bold">≈ {formatSecondary(totalIncome)}</p>}
                          </div>
                          
                          <div className="space-y-3">
                                  <div className="flex justify-between text-xs">
                                  <span className="text-theme-secondary font-medium">{t('savingsEst')}</span>
                                  <span className="text-theme-primary font-bold">{isBalanceVisible ? `$${savings?.toLocaleString()}` : '******'}</span>
                              </div>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 w-[20%] rounded-full" /> 
                              </div>
                              <div className="flex justify-between text-xs">
                                  <span className="text-theme-secondary font-medium">{t('commissions')}</span>
                                  <span className="text-red-400 font-bold">{isBalanceVisible ? `-$${commissions?.toLocaleString()}` : '******'}</span>
                              </div>
                          </div>
                      </div>

                      {/* Net Monthly */}
                      <div className="bg-gradient-to-br from-theme-surface to-black p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col justify-between group">
                          <div className="absolute bottom-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                              <Wallet size={120} />
                          </div>
                          <div>
                            <p className="text-xs text-theme-secondary uppercase tracking-wider mb-1 font-bold">{t('totalNetMonthly')}</p>
                            <p className="text-[10px] text-zinc-500 leading-tight font-medium">{t('incomeExpenseDiff')}</p>
                          </div>
                          <div className="mt-8">
                              <h3 className="text-3xl font-black text-theme-primary">{formatAmount(netMonthly)}</h3>
                              {isBalanceVisible && <p className="text-xs text-theme-secondary font-mono font-bold">≈ {formatSecondary(netMonthly)}</p>}
                          </div>
                          <div className={`text-[10px] font-black mt-4 px-3 py-1.5 rounded-full w-fit uppercase tracking-wider ${netMonthly >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {netMonthly >= 0 ? `+ ${t('positiveFlow')}` : `- ${t('negativeFlow')}`}
                          </div>
                      </div>
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
                        <div className="text-center py-16 px-8 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center gap-6 bg-theme-surface/20">
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
                      return (
                      <motion.div 
                        layout
                        key={acc.id} 
                        className="bg-theme-surface p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all flex-shrink-0 shadow-xl hover:shadow-black/40"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${stripClass}`} />
                        
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <motion.div 
                                    whileHover={{ rotate: 10 }}
                                    className="w-14 h-14 rounded-[1.25rem] bg-theme-bg flex items-center justify-center text-theme-brand border border-white/5 shadow-inner"
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
                                    className="p-2.5 bg-theme-bg border border-white/5 rounded-xl text-theme-secondary hover:text-theme-brand transition-colors"
                                >
                                    <Edit2 size={18} />
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(acc.id)} 
                                    className="p-2.5 bg-theme-bg border border-white/5 rounded-xl text-red-400 hover:text-white hover:bg-red-500 transition-all"
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="flex flex-col gap-2">
                                <span className="text-theme-secondary text-[10px] font-bold uppercase tracking-widest opacity-60">{t('availableBalance')}</span>
                                <span className="bg-theme-bg px-3 py-1 rounded-lg text-[10px] font-black font-mono text-zinc-400 border border-white/5 w-fit shadow-inner">{acc.currency === Currency.VES ? 'Bs.' : acc.currency}</span>
                            </div>
                            <h3 className="text-4xl font-black text-theme-primary tracking-tighter">
                                <span className="text-2xl text-theme-secondary opacity-40 mr-1">
                                  {displayCurrency === Currency.USD ? '$' : displayCurrency === Currency.EUR ? '€' : 'Bs.'}
                                </span>
                                {(() => {
                                    if (!isBalanceVisible) return '******';
                                    const amountUSD = acc.currency === Currency.USD || acc.currency === Currency.USDT ? acc.balance : (acc.currency === Currency.EUR ? (acc.balance * (euroRate || 0)) / exchangeRate : acc.balance / exchangeRate);
                                    
                                    if (displayCurrency === Currency.USD) return amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    if (displayCurrency === Currency.EUR) return ((amountUSD * exchangeRate) / (euroRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    return (amountUSD * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                })()}
                            </h3>
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
                    className="bg-theme-surface w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] border border-theme-soft overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 border-b border-theme-soft flex justify-between items-center bg-theme-surface/50 shrink-0">
                        <h2 className="text-xl font-black text-theme-primary tracking-tight">{editingId ? t('editWallet') : t('newWallet')}</h2>
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
                            <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('currency') || 'Currency'}</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[Currency.USD, Currency.EUR, Currency.VES, Currency.USDT].map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => setCurrency(c)} 
                                        className={`py-3 rounded-xl border text-xs font-black transition-all ${currency === c ? 'bg-theme-brand border-theme-soft text-white shadow-lg shadow-theme-brand/20' : 'bg-theme-bg border-white/10 text-theme-secondary hover:bg-theme-soft'}`}
                                    >
                                        {c === Currency.VES ? 'Bs.' : c}
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
                            <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">Icon</label>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {Object.keys(ACCOUNT_ICONS).map(key => (
                                    <button 
                                        key={key} 
                                        onClick={() => setIcon(key)} 
                                        className={`p-4 rounded-xl transition-all border shrink-0 ${icon === key ? 'bg-theme-brand border-theme-soft text-white shadow-lg' : 'bg-theme-bg border-white/10 text-theme-secondary hover:bg-theme-soft'}`}
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