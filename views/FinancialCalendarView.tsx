import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Car, Wifi, Calendar, Plus, ArrowLeft } from 'lucide-react';
import { Transaction, ScheduledPayment, Language, Currency } from '../types';
import { getTranslation } from '../i18n';

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

const ICON_MAP: Record<string, React.ReactNode> = {
  car: <Car size={16} />,
  wifi: <Wifi size={16} />,
  default: <Calendar size={16} />,
};

export const FinancialCalendarView: React.FC<FinancialCalendarViewProps> = ({
  onBack,
  scheduledPayments,
  lang,
  exchangeRate,
  displayCurrency,
  isBalanceVisible,
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const monthName = new Date(viewYear, viewMonth).toLocaleString(lang === 'es' ? 'es' : 'en', { month: 'long' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const calendarDays = useMemo((): CalendarDay[] => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDay; i++) days.push({ day: null, type: 'EMPTY' });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const isToday = date.toDateString() === today.toDateString();
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const scheduled = scheduledPayments.filter(sp => {
        if (!sp.nextDueDate) return false;
        return sp.nextDueDate.startsWith(dateStr.slice(0, 7)) && new Date(sp.nextDueDate).getDate() === d;
      });

      let type: DayType = isToday ? 'TODAY' : 'NORMAL';
      let label: string | undefined;

      if (scheduled.length > 0) {
        const hasIncome = scheduled.some(sp => sp.amount > 0);
        const hasExpense = scheduled.some(sp => sp.amount < 0);
        type = hasExpense ? 'OUTFLOW' : hasIncome ? 'INCOME' : type;
        label = scheduled[0].name;
      }

      days.push({ day: d, type, label });
    }

    return days;
  }, [viewYear, viewMonth, scheduledPayments]);

  const selectedDayPayments = useMemo(() => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return scheduledPayments.filter(sp => {
      if (!sp.nextDueDate) return false;
      return sp.nextDueDate.startsWith(dateStr.slice(0, 7)) && new Date(sp.nextDueDate).getDate() === selectedDay;
    });
  }, [selectedDay, viewYear, viewMonth, scheduledPayments]);

  const projectedNetFlow = useMemo(() => {
    return scheduledPayments
      .filter(sp => {
        if (!sp.nextDueDate) return false;
        const d = new Date(sp.nextDueDate);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })
      .reduce((sum, sp) => sum + (sp.amount || 0), 0);
  }, [scheduledPayments, viewYear, viewMonth]);

  const formatAmt = (n: number) => {
    const prefix = n >= 0 ? '+' : '-';
    return `${prefix}$${Math.abs(n).toFixed(2)}`;
  };

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

  return (
    <div className="h-full flex flex-col bg-theme-bg overflow-y-auto no-scrollbar px-6 py-6 pb-24 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
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
            <h1 className="text-xl font-bold text-theme-primary">{t('financialCalendar')}</h1>
            <p className="text-sm text-theme-secondary opacity-60 capitalize">{monthName} {viewYear} — {t('projectionMode')}</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-theme-brand to-blue-400 text-white text-[11px] font-black shadow-lg">
          <Plus size={12} /> {t('newProjection')}
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
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] text-theme-secondary font-black py-1">{d}</div>
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
            {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString(lang === 'es' ? 'es' : 'en', { month: 'long', day: 'numeric' })}
          </h3>
          <p className="text-[11px] text-theme-secondary mb-4">{selectedDayPayments.length} {t('scheduledEventsLabel')}</p>

          {selectedDayPayments.length === 0 ? (
            <div className="text-center py-8 text-theme-secondary text-sm">{t('noScheduledPayments')}</div>
          ) : (
            <div className="space-y-2">
              {selectedDayPayments.map((sp, i) => (
                <div key={i} className="bg-theme-surface/50 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-theme-surface transition-colors cursor-pointer active:scale-[0.98]">
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
            </div>
          )}

          <button className="w-full mt-4 py-3 rounded-full border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
            {t('viewFullDay')}
          </button>
        </div>
      </div>
    </div>
  );
};
