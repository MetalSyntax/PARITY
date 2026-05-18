import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Plus, ArrowLeft, Receipt, X, ChevronDown, ChevronUp, DollarSign, AlertCircle } from 'lucide-react';
import { Language } from '@parity/core';
import { getTranslation } from '@parity/i18n';

interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

interface Split {
  id: string;
  name: string;
  category: string;
  amount: number;
  remaining: number;
  amountAtRateUSD: number;
  direction: 'OWED_TO_YOU' | 'YOU_OWE';
  status: 'active' | 'partial' | 'settled';
  dueDate?: string;
  payments: Payment[];
  createdAt: string;
}

interface DebtSplitTrackerViewProps {
  onBack: () => void;
  lang: Language;
  exchangeRate?: number;
  debts?: Split[];
  onUpdateDebts?: (debts: Split[]) => void;
}

interface AddSplitForm {
  name: string;
  category: string;
  amount: string;
  direction: 'OWED_TO_YOU' | 'YOU_OWE';
  dueDate: string;
}

interface AddPaymentForm {
  amount: string;
  note: string;
}

type SectionTab = 'OWED_TO_YOU' | 'YOU_OWE';

const EMPTY_FORM: AddSplitForm = { name: '', category: '', amount: '', direction: 'OWED_TO_YOU', dueDate: '' };
const EMPTY_PAYMENT: AddPaymentForm = { amount: '', note: '' };

export const DebtSplitTrackerView: React.FC<DebtSplitTrackerViewProps> = ({ lang, onBack, exchangeRate = 1, debts: externalDebts, onUpdateDebts }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [localSplits, setLocalSplits] = useState<Split[]>([]);
  const splits = externalDebts ?? localSplits;
  const setSplits = (updater: Split[] | ((prev: Split[]) => Split[])) => {
    const next = typeof updater === 'function' ? updater(splits) : updater;
    if (onUpdateDebts) onUpdateDebts(next);
    else setLocalSplits(next);
  };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddSplitForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [sectionTab, setSectionTab] = useState<SectionTab>('OWED_TO_YOU');
  const [paymentSplitId, setPaymentSplitId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<AddPaymentForm>(EMPTY_PAYMENT);
  const [paymentError, setPaymentError] = useState('');

  const totalOwedToYou = splits.filter(s => s.direction === 'OWED_TO_YOU' && s.status !== 'settled').reduce((sum, s) => sum + s.remaining, 0);
  const totalYouOwe = splits.filter(s => s.direction === 'YOU_OWE' && s.status !== 'settled').reduce((sum, s) => sum + s.remaining, 0);
  const settledCount = splits.filter(s => s.status === 'settled').length;
  const recoveryRate = splits.length > 0 ? Math.round((settledCount / splits.length) * 100) : 0;

  const visibleSplits = splits.filter(s => s.direction === sectionTab);

  const getDueDateBadge = (split: Split) => {
    if (!split.dueDate || split.status === 'settled') return null;
    const daysLeft = Math.ceil((new Date(split.dueDate).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return { label: t('overdue'), color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    if (daysLeft === 0) return { label: t('today'), color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { label: `${t('dueIn')} ${daysLeft}d`, color: 'text-theme-secondary bg-theme-surface/50 border-white/10' };
  };

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, direction: sectionTab });
    setFormError('');
    setShowAdd(true);
  };
  const closeAdd = () => setShowAdd(false);

  const saveSplit = () => {
    if (!form.name.trim()) { setFormError(`${t('description')} ${t('fieldRequired')}`); return; }
    const amount = parseFloat(form.amount) || 0;
    if (amount <= 0) { setFormError(`${t('amount')} ${t('mustBePositive')}`); return; }
    setSplits((prev: Split[]) => [...prev, {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category.trim() || t('general'),
      amount,
      remaining: amount,
      amountAtRateUSD: amount, // USD at creation rate
      direction: form.direction,
      status: 'active',
      dueDate: form.dueDate || undefined,
      payments: [],
      createdAt: new Date().toISOString(),
    }]);
    closeAdd();
  };

  const openPayment = (splitId: string) => {
    setPaymentSplitId(splitId);
    setPaymentForm(EMPTY_PAYMENT);
    setPaymentError('');
  };

  const savePayment = () => {
    if (!paymentSplitId) return;
    const amount = parseFloat(paymentForm.amount) || 0;
    if (amount <= 0) { setPaymentError(`${t('amount')} ${t('mustBePositive')}`); return; }
    setSplits(prev => prev.map(s => {
      if (s.id !== paymentSplitId) return s;
      const newRemaining = Math.max(0, s.remaining - amount);
      const payment: Payment = { id: Date.now().toString(), amount, date: new Date().toISOString(), note: paymentForm.note };
      return {
        ...s,
        remaining: newRemaining,
        payments: [...s.payments, payment],
        status: newRemaining === 0 ? 'settled' : 'partial',
      };
    }));
    setPaymentSplitId(null);
  };

  const markSettled = (id: string) => {
    setSplits(prev => prev.map(s => s.id === id ? { ...s, remaining: 0, status: 'settled' } : s));
  };

  const deleteSplit = (id: string) => {
    setSplits(prev => prev.filter(s => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="h-full flex flex-col bg-theme-bg overflow-y-auto no-scrollbar px-6 py-6 pb-24 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-theme-primary">{t('debtTracker')}</h1>
          <p className="text-sm text-theme-secondary opacity-60">{t('debtTrackerSubtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={openAdd}
          className="w-12 h-12 bg-theme-brand rounded-2xl text-white shadow-lg shadow-brand/20 flex items-center justify-center"
        >
          <Plus size={22} />
        </motion.button>
      </div>

      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-theme-surface/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between aspect-square">
            <div className="w-10 h-10 rounded-full bg-theme-brand/10 border border-theme-brand/20 flex items-center justify-center text-theme-brand">
              <ArrowDownLeft size={18} />
            </div>
            <div>
              <p className="text-theme-secondary text-[11px] font-semibold mb-1">{t('totalOwedToYou')}</p>
              <p className="text-xl font-black text-theme-primary">${totalOwedToYou.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-theme-surface/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between aspect-square">
            <div className="w-10 h-10 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center text-theme-secondary">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <p className="text-theme-secondary text-[11px] font-semibold mb-1">{t('totalYouOwe')}</p>
              <p className="text-xl font-black text-theme-primary">${totalYouOwe.toFixed(2)}</p>
            </div>
          </div>
          <div className="col-span-2 bg-theme-surface/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-theme-secondary text-[11px] font-semibold mb-1">{t('monthlyRecoveryRate')}</p>
              <div className="flex items-end gap-2">
                <p className="text-xl font-black text-theme-primary">{recoveryRate}%</p>
                <p className="text-[11px] text-theme-secondary mb-0.5">{t('ofSplitsSettled')}</p>
              </div>
            </div>
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke="rgb(43,108,238)" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - recoveryRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 bg-theme-surface rounded-2xl p-1 border border-white/5">
          {(['OWED_TO_YOU', 'YOU_OWE'] as SectionTab[]).map(tab => {
            const count = splits.filter(s => s.direction === tab && s.status !== 'settled').length;
            const isActive = sectionTab === tab;
            const isOwed = tab === 'OWED_TO_YOU';
            return (
              <button
                key={tab}
                onClick={() => setSectionTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${isActive ? 'bg-theme-bg text-theme-primary shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
              >
                {isOwed ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                {isOwed ? t('theyOweMe') : t('iOwe')}
                {count > 0 && (
                  <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${isOwed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Splits List */}
        <div>
          {visibleSplits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center">
                <Receipt size={28} className="text-theme-secondary opacity-40" />
              </div>
              <div>
                <p className="text-sm font-bold text-theme-primary mb-1">{t('noActiveSplits')}</p>
                <p className="text-xs text-theme-secondary opacity-60">{t('addSplitHint')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleSplits.map((split) => {
                const badge = getDueDateBadge(split);
                const paidPct = split.amount > 0 ? ((split.amount - split.remaining) / split.amount) * 100 : 0;
                return (
                  <motion.div key={split.id} layout className="bg-theme-surface/50 border border-white/5 rounded-2xl overflow-hidden">
                    <button className="w-full p-4 text-left" onClick={() => setExpandedId(expandedId === split.id ? null : split.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${split.direction === 'OWED_TO_YOU' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {split.direction === 'OWED_TO_YOU' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-theme-primary">{split.name}</p>
                              {split.status === 'partial' && (
                                <span className="px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black">{t('partial')}</span>
                              )}
                              {split.status === 'settled' && (
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black">{t('settled')}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] text-theme-secondary">{split.category}</p>
                              {badge && (
                                <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-black ${badge.color}`}>{badge.label}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-base font-black ${split.direction === 'OWED_TO_YOU' ? 'text-theme-brand' : 'text-red-400'}`}>
                              ${split.remaining.toFixed(2)}
                            </p>
                            <p className="text-[10px] uppercase tracking-widest text-theme-secondary font-black">{t('remaining')}</p>
                          </div>
                          {expandedId === split.id ? <ChevronUp size={14} className="text-theme-secondary" /> : <ChevronDown size={14} className="text-theme-secondary" />}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {split.status !== 'settled' && paidPct > 0 && (
                        <div className="mt-3 w-full bg-theme-surface/50 h-1 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${paidPct}%` }}
                            className={`h-full rounded-full ${split.direction === 'OWED_TO_YOU' ? 'bg-emerald-500' : 'bg-red-400'}`}
                          />
                        </div>
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedId === split.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-white/5">
                            {/* Stats row */}
                            <div className="flex gap-2 mt-3">
                              <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                                <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">{t('total')}</p>
                                <p className="text-sm font-black text-theme-primary">${split.amount.toFixed(2)}</p>
                              </div>
                              <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                                <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">{t('remaining')}</p>
                                <p className={`text-sm font-black ${split.direction === 'OWED_TO_YOU' ? 'text-emerald-400' : 'text-red-400'}`}>${split.remaining.toFixed(2)}</p>
                              </div>
                              <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                                <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">{t('paid')}</p>
                                <p className="text-sm font-black text-theme-primary">${(split.amount - split.remaining).toFixed(2)}</p>
                              </div>
                            </div>

                            {/* Inflation Guard */}
                            {exchangeRate > 1 && split.status !== 'settled' && (
                              <div className="mt-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/15 flex items-start gap-2">
                                <AlertCircle size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] font-black text-orange-400">{t('inflationGuard')}</p>
                                  <p className="text-[10px] text-theme-secondary">
                                    {t('originalValue')}: ${split.amountAtRateUSD.toFixed(2)} ≈ Bs {(split.amountAtRateUSD * exchangeRate).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Payment History */}
                            {split.payments.length > 0 && (
                              <div className="mt-3">
                                <p className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-2">{t('paymentHistory')}</p>
                                <div className="space-y-1.5">
                                  {split.payments.map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-[11px] py-1.5 px-3 bg-theme-bg/30 rounded-lg">
                                      <span className="text-theme-secondary">{new Date(p.date).toLocaleDateString()}{p.note ? ` — ${p.note}` : ''}</span>
                                      <span className="font-black text-emerald-400">−${p.amount.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-3">
                              {split.status !== 'settled' && (
                                <button
                                  onClick={() => openPayment(split.id)}
                                  className="flex-1 py-2 rounded-xl border border-theme-brand/30 text-theme-brand text-xs font-black hover:bg-theme-brand/10 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <DollarSign size={12} /> {t('addPayment')}
                                </button>
                              )}
                              {split.status !== 'settled' && (
                                <button
                                  onClick={() => markSettled(split.id)}
                                  className="flex-1 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-black hover:bg-emerald-500/10 transition-colors"
                                >
                                  {t('markAsSettled')}
                                </button>
                              )}
                              <button
                                onClick={() => deleteSplit(split.id)}
                                className="px-3 py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-black hover:bg-red-500/10 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Split Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black text-theme-primary">{t('newSplit')}</h3>
                <button onClick={closeAdd} className="w-8 h-8 rounded-full bg-theme-bg border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('description')}</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError(''); }}
                    placeholder="Cena, Viaje, Servicio…"
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('category')}</label>
                  <input
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder={`${t('food')}, ${t('general')}…`}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('amount')} (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setFormError(''); }}
                    placeholder="0.00"
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('dueDate')} {t('optional')}</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-secondary outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('direction')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setForm(f => ({ ...f, direction: 'OWED_TO_YOU' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${form.direction === 'OWED_TO_YOU' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <ArrowDownLeft size={14} /> {t('owedToYou')}
                    </button>
                    <button
                      onClick={() => setForm(f => ({ ...f, direction: 'YOU_OWE' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${form.direction === 'YOU_OWE' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <ArrowUpRight size={14} /> {t('youOwe')}
                    </button>
                  </div>
                </div>

                {formError && <p className="text-xs text-red-400 font-bold">{formError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeAdd} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
                  {t('cancel')}
                </button>
                <button onClick={saveSplit} className="flex-1 py-3 rounded-2xl bg-theme-brand text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all">
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {paymentSplitId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-black text-theme-primary">{t('addPayment')}</h3>
                <button onClick={() => setPaymentSplitId(null)} className="w-8 h-8 rounded-full bg-theme-bg border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('amount')} (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    autoFocus
                    value={paymentForm.amount}
                    onChange={e => { setPaymentForm(f => ({ ...f, amount: e.target.value })); setPaymentError(''); }}
                    placeholder="0.00"
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('note')} {t('optional')}</label>
                  <input
                    value={paymentForm.note}
                    onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))}
                    placeholder={t('notePlaceholder')}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>
                {paymentError && <p className="text-xs text-red-400 font-bold">{paymentError}</p>}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setPaymentSplitId(null)} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
                  {t('cancel')}
                </button>
                <button onClick={savePayment} className="flex-1 py-3 rounded-2xl bg-theme-brand text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all">
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
