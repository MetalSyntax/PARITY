import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Car, Wifi, Calendar, Plus, ArrowLeft, X } from 'lucide-react';
import { Transaction, ScheduledPayment, Language, Currency } from '@parity/core';
import { getTranslation } from '@parity/i18n';

interface FinancialCalendarViewProps {
  onBack: () => void;
  transactions: Transaction[];
  scheduledPayments: ScheduledPayment[];
  lang: Language;
  exchangeRate: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
}

type DayType = 'OUTFLOW' | 'INCOME' | 'TODAY' | 'NORMAL' | 'EMPTY';

interface CalendarDay {
  day: number | null;
  type: DayType;
  label?: string;
}

interface LocalProjection {
  id: string;
  name: string;
  amount: number;
  day: number;
  month: number;
  year: number;
}

interface AddProjectionForm {
  name: string;
  amount: string;
  isExpense: boolean;
  day: string;
}

const EMPTY_FORM: AddProjectionForm = { name: '', amount: '', isExpense: true, day: '' };

const ICON_MAP: Record<string, React.ReactNode> = {
  car: <Car size={16} />,
  wifi: <Wifi size={16} />,
  default: <Calendar size={16} />,
};

export const FinancialCalendarView: React.FC<FinancialCalendarViewProps> = ({
  onBack,
  transactions,
  scheduledPayments,
  lang,
  exchangeRate,
  isBalanceVisible,
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [localProjections, setLocalProjections] = useState<LocalProjection[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddProjectionForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const monthName = new Date(viewYear, viewMonth).toLocaleString(lang === 'es' ? 'es' : lang === 'pt' ? 'pt' : 'en', { month: 'long' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, day: String(selectedDay) });
    setFormError('');
    setShowAdd(true);
  };
  const closeAdd = () => setShowAdd(false);

  const saveProjection = () => {
    if (!form.name.trim()) { setFormError(`${t('name')} ${t('fieldRequired')}`); return; }
    const amount = parseFloat(form.amount) || 0;
    if (amount <= 0) { setFormError(`${t('amount')} ${t('mustBePositive')}`); return; }
    const day = parseInt(form.day) || selectedDay;
    setLocalProjections((prev: LocalProjection[]) => [...prev, {
      id: Date.now().toString(),
      name: form.name.trim(),
      amount: form.isExpense ? -amount : amount,
      day: Math.min(Math.max(day, 1), 31),
      month: viewMonth,
      year: viewYear,
    }]);
    closeAdd();
  };

  const calendarDays = useMemo((): CalendarDay[] => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: CalendarDay[] = [];
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

    for (let i = 0; i < firstDay; i++) days.push({ day: null, type: 'EMPTY' });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const isToday = date.toDateString() === today.toDateString();
      const dayStr = `${monthStr}-${String(d).padStart(2, '0')}`;

      // Real transactions for this day
      const dayTxs = transactions.filter(tx => tx.date.startsWith(dayStr));
      const dayIncome = dayTxs.filter(tx => tx.type === 'INCOME').reduce((s, tx) => s + tx.normalizedAmountUSD, 0);
      const dayExpense = dayTxs.filter(tx => tx.type === 'EXPENSE').reduce((s, tx) => s + tx.normalizedAmountUSD, 0);
      const dayNet = dayIncome - dayExpense;

      const scheduled = scheduledPayments.filter(sp => {
        if (!(sp as any).nextDueDate) return false;
        return (sp as any).nextDueDate.startsWith(monthStr) && new Date((sp as any).nextDueDate).getDate() === d;
      });
      const projections = localProjections.filter(p => p.year === viewYear && p.month === viewMonth && p.day === d);

      let type: DayType = isToday ? 'TODAY' : 'NORMAL';
      let label: string | undefined;

      // Priority: real transactions → scheduled → projections
      if (dayTxs.length > 0) {
        type = dayNet < 0 ? 'OUTFLOW' : 'INCOME';
        label = dayTxs[0].note || undefined;
      } else if (scheduled.length > 0) {
        type = 'OUTFLOW';
        label = scheduled[0].name;
      } else if (projections.length > 0) {
        type = projections.some(p => p.amount < 0) ? 'OUTFLOW' : 'INCOME';
        label = projections[0].name;
      }

      if (isToday && dayTxs.length === 0 && scheduled.length === 0) type = 'TODAY';
      days.push({ day: d, type, label });
    }

    return days;
  }, [viewYear, viewMonth, scheduledPayments, localProjections, transactions]);

  const selectedDayPayments = useMemo(() => {
    return scheduledPayments.filter(sp => {
      if (!(sp as any).nextDueDate) return false;
      return (sp as any).nextDueDate.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`) && new Date((sp as any).nextDueDate).getDate() === selectedDay;
    });
  }, [selectedDay, viewYear, viewMonth, scheduledPayments]);

  const selectedDayTransactions = useMemo(() => {
    const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return transactions.filter(tx => tx.date.startsWith(dayStr));
  }, [selectedDay, viewYear, viewMonth, transactions]);

  const selectedDayProjections = useMemo(() => {
    return localProjections.filter(p => p.year === viewYear && p.month === viewMonth && p.day === selectedDay);
  }, [selectedDay, viewYear, viewMonth, localProjections]);

  const projectedNetFlow = useMemo(() => {
    const fromScheduled = scheduledPayments
      .filter(sp => {
        if (!(sp as any).nextDueDate) return false;
        const d = new Date((sp as any).nextDueDate);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })
      .reduce((sum, sp) => sum + (sp.amount || 0), 0);
    const fromProjections = localProjections
      .filter(p => p.year === viewYear && p.month === viewMonth)
      .reduce((sum, p) => sum + p.amount, 0);
    return fromScheduled + fromProjections;
  }, [scheduledPayments, localProjections, viewYear, viewMonth]);

  const formatAmt = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`;

  const dayClasses: Record<DayType, string> = {
    OUTFLOW: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
    INCOME: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
    TODAY: 'bg-theme-brand/20 border-theme-brand/40 shadow-[inset_0_0_15px_rgba(43,108,238,0.2)]',
    NORMAL: 'bg-theme-surface/50 border-white/5 hover:bg-theme-surface',
    EMPTY: 'bg-transparent border-transparent',
  };
  const dayTextClasses: Record<DayType, string> = {
    OUTFLOW: 'text-white',
    INCOME: 'text-white',
    TODAY: 'text-theme-brand font-black drop-shadow-[0_0_5px_rgba(43,108,238,0.8)]',
    NORMAL: 'text-theme-secondary hover:text-theme-primary',
    EMPTY: '',
  };

  const totalEvents = selectedDayPayments.length + selectedDayProjections.length;

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
          <h1 className="text-xl font-bold text-theme-primary">{t('financialCalendar')}</h1>
          <p className="text-sm text-theme-secondary opacity-60 capitalize">{monthName} {viewYear} — {t('projectionMode')}</p>
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

      <div className="space-y-4">
        {/* Calendar Card */}
        <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-theme-brand/5 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2" />

          {/* Month Nav */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-theme-surface border border-white/5 flex items-center justify-center text-theme-primary hover:bg-theme-surface/80 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <h3 className="text-base font-black text-theme-primary capitalize">{monthName}</h3>
              <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-theme-surface border border-white/5 flex items-center justify-center text-theme-primary hover:bg-theme-surface/80 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black border border-orange-500/20">{t('highOutflow')}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20">{t('income')}</span>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(2024, 0, i); // Jan 2024: starts on Mon, index 0=Sun
              return d.toLocaleString(lang === 'es' ? 'es' : lang === 'pt' ? 'pt' : 'en', { weekday: 'short' }).slice(0, 3);
            }).map((d, i) => (
              <div key={i} className="text-center text-[10px] text-theme-secondary font-black py-1">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => (
              <button
                key={i}
                onClick={() => cell.day && setSelectedDay(cell.day)}
                disabled={!cell.day}
                className={`aspect-square rounded-xl border flex flex-col p-1.5 transition-colors cursor-pointer ${dayClasses[cell.type]} ${selectedDay === cell.day && cell.type !== 'TODAY' ? 'ring-1 ring-theme-brand/50' : ''}`}
              >
                {cell.day && (
                  <>
                    <span className={`text-xs font-bold ${dayTextClasses[cell.type]}`}>{cell.day}</span>
                    {cell.label && (
                      <div className="mt-auto space-y-0.5">
                        <div className={`h-0.5 w-full rounded-full ${cell.type === 'OUTFLOW' ? 'bg-orange-500/50' : 'bg-emerald-500/50'}`} />
                        <div className={`text-[7px] font-black truncate ${cell.type === 'OUTFLOW' ? 'text-orange-400' : 'text-emerald-400'}`}>{cell.label}</div>
                      </div>
                    )}
                    {cell.type === 'TODAY' && !cell.label && (
                      <div className="mt-auto flex justify-center">
                        <div className="w-1 h-1 rounded-full bg-theme-brand shadow-[0_0_8px_rgba(43,108,238,0.8)]" />
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Projected Net Flow Ticker */}
        <div className="bg-theme-surface/40 backdrop-blur-sm border border-white/5 rounded-full p-2 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3 px-3">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-theme-primary">{t('projectedNetFlow')}</span>
          </div>
          <div className="bg-theme-surface px-5 py-2 rounded-full border border-white/10">
            <span className={`font-black font-mono text-sm ${projectedNetFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {isBalanceVisible ? formatAmt(projectedNetFlow) : '••••'}
            </span>
          </div>
        </div>

        {/* Selected Day Detail */}
        <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-base font-black text-theme-primary mb-0.5">
            {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString(lang === 'es' ? 'es' : lang === 'pt' ? 'pt' : 'en', { month: 'long', day: 'numeric' })}
          </h3>
          <p className="text-[11px] text-theme-secondary mb-4">{totalEvents + selectedDayTransactions.length} {t('scheduledEventsLabel')}</p>

          {totalEvents === 0 && selectedDayTransactions.length === 0 ? (
            <div className="text-center py-8 text-theme-secondary text-sm">{t('noScheduledPayments')}</div>
          ) : (
            <div className="space-y-2">
              {/* Real transactions for this day */}
              {selectedDayTransactions.map((tx, i) => (
                <div key={`tx-${i}`} className="bg-theme-surface/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${tx.type === 'EXPENSE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-theme-surface text-theme-secondary border-white/10'}`}>
                      {tx.type === 'INCOME' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-theme-primary">{tx.note || tx.category}</p>
                      <p className="text-[11px] text-theme-secondary">{tx.category}</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm font-mono ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isBalanceVisible ? `${tx.type === 'INCOME' ? '+' : '-'}$${tx.normalizedAmountUSD.toFixed(2)}` : '••••'}
                  </span>
                </div>
              ))}
              {selectedDayPayments.map((sp, i) => (
                <div key={`sp-${i}`} className="bg-theme-surface/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${(sp.amount || 0) < 0 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-theme-surface text-theme-secondary border-white/10'}`}>
                      {ICON_MAP.default}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-theme-primary">{sp.name}</p>
                      <p className="text-[11px] text-theme-secondary">{sp.category}</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm font-mono ${(sp.amount || 0) < 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {isBalanceVisible ? formatAmt(sp.amount || 0) : '••••'}
                  </span>
                </div>
              ))}
              {selectedDayProjections.map((proj) => (
                <div key={proj.id} className="bg-theme-surface/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${proj.amount < 0 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {proj.amount < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-theme-primary">{proj.name}</p>
                      <p className="text-[11px] text-theme-secondary opacity-60">{t('newProjection')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-sm font-mono ${proj.amount < 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {isBalanceVisible ? formatAmt(proj.amount) : '••••'}
                    </span>
                    <button
                      onClick={() => setLocalProjections((prev: LocalProjection[]) => prev.filter(p => p.id !== proj.id))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-theme-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={openAdd}
            className="w-full mt-4 py-3 rounded-full border border-dashed border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 hover:border-theme-brand/30 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} /> {t('newProjection')}
          </button>
        </div>
      </div>

      {/* Add Projection Modal */}
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
                <h3 className="text-base font-black text-theme-primary">{t('newProjection')}</h3>
                <button onClick={closeAdd} className="w-8 h-8 rounded-full bg-theme-bg border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('name')}</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => { setForm((f: AddProjectionForm) => ({ ...f, name: e.target.value })); setFormError(''); }}
                    placeholder={`${t('income')}, ${t('expense')}…`}
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
                    onChange={e => { setForm((f: AddProjectionForm) => ({ ...f, amount: e.target.value })); setFormError(''); }}
                    placeholder="0.00"
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('dayOfMonth')}</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.day}
                    onChange={e => setForm((f: AddProjectionForm) => ({ ...f, day: e.target.value }))}
                    placeholder={String(selectedDay)}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('type')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setForm((f: AddProjectionForm) => ({ ...f, isExpense: true }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${form.isExpense ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <TrendingDown size={14} /> {t('expense')}
                    </button>
                    <button
                      onClick={() => setForm((f: AddProjectionForm) => ({ ...f, isExpense: false }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${!form.isExpense ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <TrendingUp size={14} /> {t('income')}
                    </button>
                  </div>
                </div>

                {formError && <p className="text-xs text-red-400 font-bold">{formError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeAdd} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
                  {t('cancel')}
                </button>
                <button onClick={saveProjection} className="flex-1 py-3 rounded-2xl bg-theme-brand text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all">
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
