import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2, Edit2, TrendingUp, TrendingDown, ChevronDown, X, Check, Coins, DollarSign, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, Currency, ScheduledPayment, TransactionType, ConfirmConfig } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';

interface ScheduledPaymentViewProps {
  onBack: () => void;
  lang: Language;
  scheduledPayments: ScheduledPayment[];
  onUpdateScheduledPayments: (payments: ScheduledPayment[]) => void;
  onConfirmPayment: (payment: ScheduledPayment) => void;
  onToggleBottomNav: (show: boolean) => void;
  showConfirm: (config: ConfirmConfig) => void;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  onToggleDisplayCurrency: () => void;
  isBalanceVisible: boolean;
}

export const ScheduledPaymentView: React.FC<ScheduledPaymentViewProps> = ({ 
  onBack, 
  lang, 
  scheduledPayments, 
  onUpdateScheduledPayments, 
  onConfirmPayment,
  onToggleBottomNav,
  showConfirm,
  exchangeRate,
  euroRate,
  displayCurrency,
  onToggleDisplayCurrency,
  isBalanceVisible
}) => {
  const t = (key: any) => getTranslation(lang, key);
  


  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New Payment Form State
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [newFrequency, setNewFrequency] = useState<'Monthly' | 'Weekly' | 'Yearly' | 'Bi-weekly' | 'One-Time'>('Monthly');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0].id);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  useEffect(() => {
    onToggleBottomNav(!isAdding);
  }, [isAdding, onToggleBottomNav]);

  // Load data for editing
  useEffect(() => {
    if (editingId) {
      const payment = scheduledPayments.find(p => p.id === editingId);
      if (payment) {
        setNewName(payment.name);
        setNewAmount(payment.amount.toString());
        setNewDate(payment.date);
        setNewType(payment.type || TransactionType.EXPENSE);
        setNewFrequency(payment.frequency);
        setNewCategory(payment.category || (payment.type === TransactionType.INCOME ? 'income' : CATEGORIES[0].id));
        setIsAdding(true);
      }
    }
  }, [editingId, scheduledPayments]);

  const handleAdd = () => {
      if(!newName || !newAmount || !newDate) return;
      
      const paymentData: ScheduledPayment = {
          id: editingId || Math.random().toString(36).substr(2, 9),
          name: newName,
          amount: parseFloat(newAmount),
          currency: Currency.USD,
          date: newDate,
          frequency: newFrequency,
          type: newType,
          category: newCategory
      };

      if (editingId) {
          onUpdateScheduledPayments(scheduledPayments.map(p => p.id === editingId ? paymentData : p));
      } else {
          onUpdateScheduledPayments([...scheduledPayments, paymentData]);
      }

      resetForm();
  };

  const resetForm = () => {
      setIsAdding(false);
      setEditingId(null);
      setNewName('');
      setNewAmount('');
      setNewDate('');
      setNewType(TransactionType.EXPENSE);
      setNewFrequency('Monthly');
      setNewCategory(CATEGORIES[0].id);
  };

  const handleDelete = (id: string) => {
      showConfirm({
          message: t('deleteScheduledConfirm'),
          onConfirm: () => {
              onUpdateScheduledPayments(scheduledPayments.filter(p => p.id !== id));
          }
      });
  };

  const handleEdit = (payment: ScheduledPayment) => {
      setEditingId(payment.id);
  };

  const incomeSchedules = scheduledPayments.filter(p => p.type === TransactionType.INCOME);
  const expenseSchedules = scheduledPayments.filter(p => p.type !== TransactionType.INCOME);

  return (
    <div className="h-full flex flex-col p-6 pb-32 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto bg-theme-bg">
      <div className="flex items-center justify-between mb-8">
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
               <h1 className="text-xl font-bold text-theme-primary">{t('scheduled')}</h1>
               <p className="text-xs text-theme-secondary font-medium">{t('manageSubscriptions')}</p>
             </div>
        </div>
        <div className="flex items-center gap-2">
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleDisplayCurrency}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 transition-all font-black text-[10px] ${displayCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
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
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAdding(true)} 
                className="w-12 h-12 bg-theme-brand rounded-2xl text-white shadow-lg shadow-brand/20 flex items-center justify-center"
            >
                <Plus size={24} />
            </motion.button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
          {/* Income Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-emerald-400" />
              <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-widest">{t('incomeSchedules')}</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {incomeSchedules.map(p => (
                <ScheduledItem key={p.id} p={p} t={t} onEdit={handleEdit} onDelete={handleDelete} onConfirm={onConfirmPayment} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} />
              ))}
              {incomeSchedules.length === 0 && (
                <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center text-xs text-theme-secondary">
                  {t('noIncomeScheduled')}
                </div>
              )}
            </div>
          </div>

          {/* Expense Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={14} className="text-red-400" />
              <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-widest">{t('expenseSchedules')}</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {expenseSchedules.map(p => (
                <ScheduledItem key={p.id} p={p} t={t} onEdit={handleEdit} onDelete={handleDelete} onConfirm={onConfirmPayment} exchangeRate={exchangeRate} euroRate={euroRate} displayCurrency={displayCurrency} isBalanceVisible={isBalanceVisible} />
              ))}
              {expenseSchedules.length === 0 && (
                <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center text-xs text-theme-secondary">
                  {t('noExpensesScheduled')}
                </div>
              )}
            </div>
          </div>

          {scheduledPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-theme-secondary mt-10">
              <div className="w-20 h-20 rounded-full bg-theme-surface flex items-center justify-center mb-6">
                <Calendar size={32} />
              </div>
              <p className="text-center font-medium opacity-50">{t('noPaymentsScheduled')}</p>
            </div>
          )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
          {isAdding && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4"
              >
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="bg-theme-surface w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] border border-theme-soft overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                  >
                      <div className="p-6 border-b border-theme-soft flex justify-between items-center bg-theme-surface/50 shrink-0">
                          <h2 className="text-xl font-black text-theme-primary tracking-tight">
                              {editingId ? t('editScheduled') : t('addScheduled')}
                          </h2>
                          <button onClick={resetForm} className="p-2 hover:bg-theme-soft rounded-full transition-colors">
                              <X size={20} className="text-theme-secondary" />
                          </button>
                      </div>

                      <div className="p-6 overflow-y-auto no-scrollbar space-y-6 flex-1">
                          {/* Type Toggle */}
                          <div className="flex p-1 bg-theme-bg rounded-2xl border border-white/5">
                            <button
                                onClick={() => setNewType(TransactionType.EXPENSE)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${newType === TransactionType.EXPENSE ? 'bg-theme-surface text-theme-primary shadow-lg border border-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                            >
                                <TrendingDown size={18} className="text-red-400" />
                                {t('expense')}
                            </button>
                            <button
                                onClick={() => setNewType(TransactionType.INCOME)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${newType === TransactionType.INCOME ? 'bg-theme-surface text-theme-primary shadow-lg border border-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                            >
                                <TrendingUp size={18} className="text-emerald-400" />
                                {t('income')}
                            </button>
                          </div>

                          <div>
                              <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-3 block">{t('category')}</label>
                              <button 
                                  onClick={() => setShowCategoryModal(true)}
                                  className="w-full bg-theme-bg border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-theme-soft/30 transition-colors"
                              >
                                 <div className="flex items-center gap-3">
                                     <div className={`p-2 rounded-xl ${CATEGORIES.find(c => c.id === newCategory)?.color || 'bg-white/5 text-theme-primary'} bg-opacity-20`}>
                                         {CATEGORIES.find(c => c.id === newCategory)?.icon}
                                     </div>
                                     <span className="font-bold text-theme-primary">
                                         {t(CATEGORIES.find(c => c.id === newCategory)?.name) || CATEGORIES.find(c => c.id === newCategory)?.name}
                                     </span>
                                 </div>
                                 <ChevronDown size={18} className="text-theme-secondary group-hover:text-theme-primary" />
                              </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('name')}</label>
                              <input 
                                className="w-full bg-theme-bg border border-white/5 p-4 rounded-2xl text-theme-primary outline-none focus:border-theme-soft/30 transition-colors" 
                                placeholder={t('paymentNamePlaceholder')} 
                                value={newName} 
                                onChange={e => setNewName(e.target.value)} 
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('amount')}</label>
                                <input 
                                  className="w-full bg-theme-bg border border-white/5 p-4 rounded-2xl text-theme-primary outline-none focus:border-theme-soft/30 transition-colors" 
                                  type="number" 
                                  placeholder="0.00"
                                  value={newAmount} 
                                  onChange={e => setNewAmount(e.target.value)} 
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('frequency')}</label>
                                <div className="relative">
                                    <select 
                                      className="w-full bg-theme-bg border border-white/5 p-4 rounded-2xl text-theme-primary outline-none focus:border-theme-soft/30 transition-colors appearance-none"
                                      value={newFrequency}
                                      onChange={e => setNewFrequency(e.target.value as any)}
                                    >
                                      <option value="Weekly">{t('weekly')}</option>
                                      <option value="Bi-weekly">{t('biweekly')}</option>
                                      <option value="Monthly">{t('monthly')}</option>
                                      <option value="Yearly">{t('yearly')}</option>
                                      <option value="One-Time">{t('oneTime')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none" size={16} />
                                </div>
                              </div>
                            </div>

                            <div>
                               <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('startDate')}</label>
                               <div className="relative">
                                   <input 
                                    className="w-full bg-theme-bg border border-white/5 p-4 pl-12 rounded-2xl text-theme-primary outline-none focus:border-theme-soft/30 transition-colors" 
                                    type="date" 
                                    value={newDate} 
                                    onChange={e => setNewDate(e.target.value)} 
                                   />
                                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                                       <Calendar size={18} />
                                   </div>
                               </div>
                            </div>
                          </div>
                      </div>

                      <div className="p-6 bg-theme-surface shrink-0">
                          <button 
                            onClick={handleAdd} 
                            className="w-full bg-theme-brand p-5 rounded-2xl font-bold text-white shadow-xl shadow-brand/20 hover:brightness-110 active:scale-[0.98] transition-all"
                          >
                            {editingId ? t('update') : t('save')}
                          </button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
          {showCategoryModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-end justify-center sm:items-center p-0 sm:p-4"
              >
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="bg-theme-surface w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] border border-theme-soft overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                  >
                        <div className="p-6 border-b border-theme-soft flex justify-between items-center bg-theme-surface/50 shrink-0">
                            <h2 className="text-lg font-bold text-theme-primary">{t('selectCategory')}</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-theme-soft rounded-full transition-colors">
                                <X size={20} className="text-theme-secondary" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 flex-1 no-scrollbar space-y-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setNewCategory(cat.id);
                                        if (!newName || CATEGORIES.some(c => t(c.name) === newName)) {
                                            setNewName(t(cat.name));
                                        }
                                        setShowCategoryModal(false);
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${newCategory === cat.id ? 'bg-theme-brand/10 border-theme-soft' : 'bg-theme-bg border-white/5 hover:bg-white/5'}`}
                                >
                                    <div className={`p-3 rounded-xl ${cat.color} bg-opacity-20`}>
                                        {cat.icon}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-theme-primary">{t(cat.name)}</p>
                                    </div>
                                    {newCategory === cat.id && <Check size={20} className="text-theme-brand" />}
                                </button>
                            ))}
                        </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

interface ScheduledItemProps {
  p: ScheduledPayment;
  t: (key: any) => any;
  onEdit: (p: ScheduledPayment) => void;
  onDelete: (id: string) => void;
  onConfirm: (payment: ScheduledPayment) => void; // Added onConfirm which was missing in original interface
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
}

const ScheduledItem: React.FC<ScheduledItemProps> = ({ p, t, onEdit, onDelete, onConfirm, exchangeRate, euroRate, displayCurrency, isBalanceVisible }) => {
  const isIncome = p.type === TransactionType.INCOME;
  
  return (
    <motion.div 
      layout
      className="bg-theme-surface p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors"
    >
      <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className={`w-12 h-12 ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'} rounded-xl flex items-center justify-center relative`}
          >
            {CATEGORIES.find(c => c.id === p.category)?.icon || (isIncome ? <TrendingUp size={20} /> : <Calendar size={20} />)}
            <motion.button 
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={(e) => { e.stopPropagation(); onConfirm(p); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform z-10"
                title={t('confirm')}
            >
                <Plus size={14} />
            </motion.button>
          </motion.div>
          <div>
              <h4 className="font-bold text-sm text-theme-primary">{p.name}</h4>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                {new Date(p.date.split('T')[0] + 'T12:00:00')?.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} • {t(p.frequency === 'Bi-weekly' ? 'biweekly' : p.frequency === 'One-Time' ? 'oneTime' : p.frequency.toLowerCase()) || p.frequency}
              </p>
          </div>
      </div>
      <div className="text-right flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className={`font-black text-sm ${isIncome ? 'text-emerald-400' : 'text-theme-primary'}`}>
              {isBalanceVisible ? (
                  <>
                    {displayCurrency === Currency.USD ? '$' : displayCurrency === Currency.EUR ? '€' : 'Bs'}
                    {(() => {
                        const amountUSD = p.currency === Currency.USD || p.currency === Currency.USDT ? p.amount : (p.currency === Currency.EUR ? (p.amount * (euroRate || 0)) / exchangeRate : p.amount / exchangeRate);
                        if (displayCurrency === Currency.USD) return amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        if (displayCurrency === Currency.EUR) return ((amountUSD * exchangeRate) / (euroRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        return (amountUSD * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </>
              ) : '******'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {isBalanceVisible ? (
                  <>
                  ~{displayCurrency === Currency.USD ? 'Bs' : '$'} {(() => {
                        const amountUSD = p.currency === Currency.USD || p.currency === Currency.USDT ? p.amount : (p.currency === Currency.EUR ? (p.amount * (euroRate || 0)) / exchangeRate : p.amount / exchangeRate);
                        if (displayCurrency === Currency.USD) return (amountUSD * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 });
                        return amountUSD.toLocaleString(undefined, { maximumFractionDigits: 0 });
                    })()}
                  </>
              ) : '******'}
            </span>
          </div>
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(p)} 
              className="p-1.5 bg-theme-bg border border-white/5 rounded-lg text-theme-brand hover:bg-theme-brand hover:text-white transition-colors"
            >
              <Edit2 size={12} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(p.id)} 
              className="p-1.5 bg-theme-bg border border-white/5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
            >
              <Trash2 size={12} />
            </motion.button>
          </div>
      </div>
    </motion.div>
  )
};