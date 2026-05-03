import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Filter, Plus, ArrowLeft, Receipt, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n';

interface Split {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  amount: number;
  remaining: number;
  direction: 'OWED_TO_YOU' | 'YOU_OWE';
  timeline: { label: string; date: string; amount: number; type: 'credit' | 'debit' }[];
}

interface DebtSplitTrackerViewProps {
  onBack: () => void;
  lang: Language;
}

interface AddSplitForm {
  name: string;
  category: string;
  amount: string;
  direction: 'OWED_TO_YOU' | 'YOU_OWE';
}

const EMPTY_FORM: AddSplitForm = { name: '', category: '', amount: '', direction: 'OWED_TO_YOU' };

export const DebtSplitTrackerView: React.FC<DebtSplitTrackerViewProps> = ({ lang, onBack }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [splits, setSplits] = useState<Split[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddSplitForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const totalOwedToYou = splits.filter(s => s.direction === 'OWED_TO_YOU').reduce((sum, s) => sum + s.remaining, 0);
  const totalYouOwe = splits.filter(s => s.direction === 'YOU_OWE').reduce((sum, s) => sum + s.remaining, 0);
  const settledCount = splits.filter(s => s.remaining === 0).length;
  const recoveryRate = splits.length > 0 ? Math.round((settledCount / splits.length) * 100) : 0;

  const openAdd = () => { setForm(EMPTY_FORM); setFormError(''); setShowAdd(true); };
  const closeAdd = () => setShowAdd(false);

  const saveSplit = () => {
    if (!form.name.trim()) { setFormError(t('name') + ' is required'); return; }
    const amount = parseFloat(form.amount) || 0;
    if (amount <= 0) { setFormError(t('amount') + ' must be greater than 0'); return; }
    setSplits(prev => [...prev, {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category.trim() || 'General',
      icon: <Receipt size={16} />,
      amount,
      remaining: amount,
      direction: form.direction,
      timeline: [],
    }]);
    closeAdd();
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
        <div>
          <h1 className="text-xl font-bold text-theme-primary">{t('debtTracker')}</h1>
          <p className="text-sm text-theme-secondary opacity-60">{t('debtTrackerSubtitle')}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Bento Grid Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-theme-surface/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between aspect-square">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-theme-brand/10 border border-theme-brand/20 flex items-center justify-center text-theme-brand">
                <ArrowDownLeft size={18} />
              </div>
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

        {/* Active Splits */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-black text-theme-primary">{t('activeSplits')}</h3>
          </div>

          {splits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center">
                <Receipt size={28} className="text-theme-secondary opacity-40" />
              </div>
              <div>
                <p className="text-sm font-bold text-theme-primary mb-1">{t('noActiveSplits') || 'No active splits'}</p>
                <p className="text-xs text-theme-secondary opacity-60">{t('addSplitHint') || 'Tap + to track a new expense split'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {splits.map((split) => (
                <motion.div key={split.id} layout className="bg-theme-surface/50 border border-white/5 rounded-2xl overflow-hidden">
                  <button className="w-full p-4 text-left" onClick={() => setExpandedId(expandedId === split.id ? null : split.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${split.direction === 'OWED_TO_YOU' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {split.direction === 'OWED_TO_YOU' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-theme-primary">{split.category}</p>
                          <p className="text-[11px] text-theme-secondary">{split.name}</p>
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
                          <div className="flex gap-2 mt-3">
                            <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">Total</p>
                              <p className="text-sm font-black text-theme-primary">${split.amount.toFixed(2)}</p>
                            </div>
                            <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">{t('remaining')}</p>
                              <p className={`text-sm font-black ${split.direction === 'OWED_TO_YOU' ? 'text-emerald-400' : 'text-red-400'}`}>${split.remaining.toFixed(2)}</p>
                            </div>
                            <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">Paid</p>
                              <p className="text-sm font-black text-theme-primary">${(split.amount - split.remaining).toFixed(2)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSplits(prev => prev.map(s => s.id === split.id ? { ...s, remaining: 0 } : s))}
                            disabled={split.remaining === 0}
                            className="w-full mt-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-black hover:bg-emerald-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {split.remaining === 0 ? t('settled') : `Mark as ${t('settled')}`}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openAdd}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-theme-brand flex items-center justify-center shadow-[0_0_20px_rgba(43,108,238,0.4)] z-40"
      >
        <Plus size={24} className="text-white" />
      </motion.button>

      {/* Add Split Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black text-theme-primary">{t('add')} Split</h3>
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
                    placeholder="Dinner, Trip, etc."
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">Category</label>
                  <input
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="Food, Travel, Bills…"
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
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('direction') || 'Direction'}</label>
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
    </div>
  );
};
