import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2, Edit2, TrendingUp, TrendingDown, ChevronDown, X, Check } from 'lucide-react';
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
}

export const ScheduledPaymentView: React.FC<ScheduledPaymentViewProps> = ({ 
  onBack, 
  lang, 
  scheduledPayments, 
  onUpdateScheduledPayments, 
  onConfirmPayment,
  onToggleBottomNav,
  showConfirm,
  exchangeRate
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

  if (isAdding) {
      return (
          <div className="h-full flex flex-col p-6 pb-32 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto bg-theme-bg overflow-y-auto no-scrollbar">
              <div className="flex items-center gap-4 mb-8">
                  <button onClick={resetForm} className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors">
                      <ArrowLeft size={20} />
                  </button>
                  <h1 className="text-xl font-bold text-theme-primary">
                    {editingId ? t('editScheduled') || 'Edit Scheduled' : t('addScheduled') || 'Add Scheduled'}
                  </h1>
              </div>
              <div className="flex flex-col gap-6 pb-10">
                  {/* Type Toggle */}
                  <div className="flex p-1 bg-theme-surface rounded-2xl border border-white/5">
                    <button
                        onClick={() => setNewType(TransactionType.EXPENSE)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${newType === TransactionType.EXPENSE ? 'bg-theme-bg text-theme-primary shadow-lg border border-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                    >
                        <TrendingDown size={18} className="text-red-400" />
                        {t('expense')}
                    </button>
                    <button
                        onClick={() => setNewType(TransactionType.INCOME)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${newType === TransactionType.INCOME ? 'bg-theme-bg text-theme-primary shadow-lg border border-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                    >
                        <TrendingUp size={18} className="text-emerald-400" />
                        {t('income')}
                    </button>
                  </div>

                   <div>
                       <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-3 block">{t('category')}</label>
                       <button 
                           onClick={() => setShowCategoryModal(true)}
                           className="w-full bg-theme-surface border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-theme-brand/30 transition-colors"
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
                        className="w-full bg-theme-surface border border-white/5 p-4 rounded-2xl text-theme-primary outline-none focus:border-theme-brand/30 transition-colors" 
                        placeholder={t('paymentNamePlaceholder')} 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('amount')}</label>
                        <input 
                          className="w-full bg-theme-surface border border-white/5 p-4 rounded-2xl text-theme-primary outline-none focus:border-theme-brand/30 transition-colors" 
                          type="number" 
                          placeholder="0.00"
                          value={newAmount} 
                          onChange={e => setNewAmount(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('frequency')}</label>
                        <select 
                          className="w-full bg-theme-surface border border-white/5 p-4 rounded-2xl text-theme-primary outline-none focus:border-theme-brand/30 transition-colors appearance-none"
                          value={newFrequency}
                          onChange={e => setNewFrequency(e.target.value as any)}
                        >
                          <option value="Weekly">{t('weekly')}</option>
                          <option value="Bi-weekly">{t('biweekly')}</option>
                          <option value="Monthly">{t('monthly')}</option>
                          <option value="Yearly">{t('yearly')}</option>
                          <option value="One-Time">{t('oneTime')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                       <label className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 block">{t('startDate') || 'Start Date'}</label>
                       <input 
                        className="w-full bg-theme-surface border border-white/5 p-4 rounded-2xl text-theme-primary outline-none focus:border-theme-brand/30 transition-colors" 
                        type="date" 
                        value={newDate} 
                        onChange={e => setNewDate(e.target.value)} 
                       />
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleAdd} 
                    className="bg-theme-brand p-5 rounded-2xl font-bold text-white shadow-xl shadow-brand/20 hover:brightness-110 active:scale-[0.98] transition-all mt-4"
                  >
                    {editingId ? t('update') || 'Update' : t('save')}
                  </button>
              </div>

              {/* Category Modal Integration */}
              {showCategoryModal && (
                <div className="fixed inset-0 bg-theme-bg z-[70] flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-theme-surface">
                        <h2 className="text-lg font-bold text-theme-primary">{t('selectCategory')}</h2>
                        <button onClick={() => setShowCategoryModal(false)} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-4 flex-1 no-scrollbar">
                        <div className="grid grid-cols-1 gap-3 pb-20">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setNewCategory(cat.id);
                                        // Auto-prefill name if empty or still a category name
                                        if (!newName || CATEGORIES.some(c => t(c.name) === newName)) {
                                            setNewName(t(cat.name));
                                        }
                                        setShowCategoryModal(false);
                                    }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${newCategory === cat.id ? 'bg-theme-brand/10 border-theme-brand' : 'bg-theme-surface border-white/5 hover:bg-white/5'}`}
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
                    </div>
                </div>
               )}
          </div>
      );
  }

  const incomeSchedules = scheduledPayments.filter(p => p.type === TransactionType.INCOME);
  const expenseSchedules = scheduledPayments.filter(p => p.type !== TransactionType.INCOME);

  return (
    <div className="h-full flex flex-col p-6 pb-32 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto bg-theme-bg">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-theme-primary">{t('scheduled')}</h1>
              <p className="text-xs text-theme-secondary font-medium">{t('manageSubscriptions') || 'Manage repeating transfers'}</p>
            </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="w-12 h-12 bg-theme-brand rounded-2xl text-white shadow-lg shadow-brand/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </div>

      <div className="flex flex-col gap-8">
          {/* Income Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-emerald-400" />
              <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-widest">{t('incomeSchedules') || 'Income Schedules'}</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {incomeSchedules.map(p => (
                <ScheduledItem key={p.id} p={p} t={t} onEdit={handleEdit} onDelete={handleDelete} onConfirm={onConfirmPayment} exchangeRate={exchangeRate} />
              ))}
              {incomeSchedules.length === 0 && (
                <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center text-xs text-theme-secondary">
                  {t('noIncomeScheduled') || 'No income schedules found'}
                </div>
              )}
            </div>
          </div>

          {/* Expense Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={14} className="text-red-400" />
              <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-widest">{t('expenseSchedules') || 'Expense Schedules'}</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {expenseSchedules.map(p => (
                <ScheduledItem key={p.id} p={p} t={t} onEdit={handleEdit} onDelete={handleDelete} onConfirm={onConfirmPayment} exchangeRate={exchangeRate} />
              ))}
              {expenseSchedules.length === 0 && (
                <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center text-xs text-theme-secondary">
                  {t('noExpensesScheduled') || 'No expense schedules found'}
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
    </div>
  );
};

interface ScheduledItemProps {
  p: ScheduledPayment;
  t: (key: any) => any;
  onEdit: (p: ScheduledPayment) => void;
  onDelete: (id: string) => void;
  onConfirm: (p: ScheduledPayment) => void;
  exchangeRate: number;
}

const ScheduledItem: React.FC<ScheduledItemProps> = ({ p, t, onEdit, onDelete, onConfirm, exchangeRate }) => {
  const isIncome = p.type === TransactionType.INCOME;
  
  return (
    <div className="bg-theme-surface p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'} rounded-xl flex items-center justify-center relative`}>
            {CATEGORIES.find(c => c.id === p.category)?.icon || (isIncome ? <TrendingUp size={20} /> : <Calendar size={20} />)}
            <button 
                onClick={(e) => { e.stopPropagation(); onConfirm(p); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform z-10"
                title={t('confirm')}
            >
                <Plus size={14} />
            </button>
          </div>
          <div>
              <h4 className="font-bold text-sm text-theme-primary">{p.name}</h4>
              <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-tight">
                {new Date(p.date.split('T')[0] + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} • {t(p.frequency === 'Bi-weekly' ? 'biweekly' : p.frequency === 'One-Time' ? 'oneTime' : p.frequency.toLowerCase()) || p.frequency}
              </p>
          </div>
      </div>
      <div className="text-right flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className={`font-black text-sm ${isIncome ? 'text-emerald-400' : 'text-theme-primary'}`}>
              {isIncome ? '+' : '-'}${p.amount.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Bs. {(p.amount * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] text-theme-secondary font-bold uppercase">{t(p.frequency === 'Bi-weekly' ? 'biweekly' : p.frequency === 'One-Time' ? 'oneTime' : p.frequency.toLowerCase()) || p.frequency}</span>
          </div>
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(p)} 
              className="p-1.5 bg-theme-bg border border-white/5 rounded-lg text-theme-brand hover:bg-theme-brand hover:text-white transition-colors"
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={() => onDelete(p.id)} 
              className="p-1.5 bg-theme-bg border border-white/5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
      </div>
    </div>
  )
};