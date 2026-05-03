import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, Check, Wallet, ArrowLeft, X } from 'lucide-react';
import { Language, Currency } from '../types';
import { getTranslation } from '../i18n';

interface ScenarioEvent {
  id: string;
  name: string;
  amount: number;
  icon: React.ReactNode;
  enabled: boolean;
  color: 'green' | 'red' | 'orange';
}

interface ScenarioPlannerViewProps {
  onBack: () => void;
  lang: Language;
  exchangeRate: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  totalBalanceUSD: number;
}

interface AddEventForm {
  name: string;
  amount: string;
  isIncome: boolean;
  color: 'green' | 'red' | 'orange';
}

const EMPTY_FORM: AddEventForm = { name: '', amount: '', isIncome: true, color: 'green' };

const RATE_BASELINE = 34.0;
const RATE_MAX = 45.0;

export const ScenarioPlannerView: React.FC<ScenarioPlannerViewProps> = ({
  onBack,
  lang,
  exchangeRate,
  displayCurrency,
  isBalanceVisible,
  totalBalanceUSD,
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const [rateSlider, setRateSlider] = useState(exchangeRate || RATE_BASELINE);
  const [events, setEvents] = useState<ScenarioEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddEventForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const toggleEvent = (id: string) => setEvents(evs => evs.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));

  const openAdd = () => { setForm(EMPTY_FORM); setFormError(''); setShowAdd(true); };
  const closeAdd = () => setShowAdd(false);

  const saveEvent = () => {
    if (!form.name.trim()) { setFormError(t('name') + ' is required'); return; }
    const amount = parseFloat(form.amount) || 0;
    if (amount <= 0) { setFormError(t('amount') + ' must be greater than 0'); return; }
    const finalAmount = form.isIncome ? amount : -amount;
    const color = form.isIncome ? 'green' : form.color === 'orange' ? 'orange' : 'red';
    setEvents(prev => [...prev, {
      id: Date.now().toString(),
      name: form.name.trim(),
      amount: finalAmount,
      icon: finalAmount >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
      enabled: true,
      color,
    }]);
    closeAdd();
  };

  const scenarioImpact = useMemo(() => {
    return events.filter(e => e.enabled).reduce((sum, e) => sum + e.amount, 0);
  }, [events]);

  const projectedBalance = totalBalanceUSD + scenarioImpact;
  const projectedPct = totalBalanceUSD > 0 ? ((projectedBalance - totalBalanceUSD) / totalBalanceUSD) * 100 : 0;

  const rateImpactUSD = (rateSlider - (exchangeRate || RATE_BASELINE)) * (totalBalanceUSD / (rateSlider || 1)) * -1;
  const rateImpactVES = rateImpactUSD * rateSlider * -1;

  const fmt = (n: number) => isBalanceVisible ? `$${Math.abs(n).toFixed(2)}` : '••••••';
  const fmtSigned = (n: number) => {
    if (!isBalanceVisible) return '••••';
    return `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`;
  };

  const sliderPct = Math.min(100, Math.max(0, ((rateSlider - RATE_BASELINE) / (RATE_MAX - RATE_BASELINE)) * 100));

  const colorMap = {
    green: { dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(62,180,137,0.5)]', icon: 'bg-emerald-500/10 text-emerald-400', amount: 'text-emerald-400' },
    red: { dot: 'bg-red-400 shadow-[0_0_10px_rgba(255,100,100,0.5)]', icon: 'bg-red-500/10 text-red-400', amount: 'text-red-400' },
    orange: { dot: 'bg-orange-400 shadow-[0_0_10px_rgba(255,127,80,0.5)]', icon: 'bg-orange-500/10 text-orange-400', amount: 'text-orange-400' },
  };

  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

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
            <h1 className="text-xl font-bold text-theme-primary">{t('scenarioPlanner')}</h1>
            <p className="text-sm text-theme-secondary opacity-60">{t('scenarioPlannerSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Wallet size={16} className="text-theme-brand" />
          <button
            onClick={openAdd}
            className="text-theme-brand font-black text-sm px-3 py-1.5 rounded-full hover:bg-theme-brand/10 transition-colors"
          >
            {t('add') || 'New'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Projected Balance Chart */}
        <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-base font-black text-theme-primary">{t('projectedBalance')}</h2>
              <p className="text-[11px] text-theme-secondary">{t('sixMonthTrajectory')}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-theme-brand leading-none">{fmt(projectedBalance)}</div>
              <div className={`text-sm font-bold ${projectedPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtSigned(projectedPct).replace('$', '')}% {t('vsCurrentBalance')}
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full h-40 relative bg-theme-surface rounded-xl border border-white/5 overflow-hidden flex items-end px-3 pb-3">
            <svg className="absolute inset-0" width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
              {/* Base trajectory */}
              <path d="M 0 170 Q 200 165 400 140 T 800 100 T 1000 80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              {/* Scenario trajectory */}
              <path d="M 0 170 Q 200 155 400 110 T 800 55 T 1000 30" fill="none" stroke="#2b6cee" strokeDasharray="10 5" strokeWidth="3" />
              <path d="M 0 170 Q 200 155 400 110 T 800 55 T 1000 30 L 1000 200 L 0 200 Z" fill="url(#scenGrad)" opacity="0.15" />
              <defs>
                <linearGradient id="scenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2b6cee" stopOpacity="1" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            {/* X labels */}
            <div className="absolute bottom-2 left-0 w-full flex justify-between px-3">
              {months.map(m => (
                <span key={m} className="text-[9px] text-theme-secondary font-bold">{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Rate Shock Simulator */}
        <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
          <div>
            <h2 className="text-base font-black text-theme-primary">{t('rateShockSimulator')}</h2>
            <p className="text-[11px] text-theme-secondary">{t('rateShockDesc')}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-theme-primary">{t('exchangeRateVES')}</span>
              <span className="text-sm font-black text-orange-400">{rateSlider.toFixed(2)}</span>
            </div>
            {/* Slider */}
            <div className="relative w-full h-2 bg-theme-surface rounded-full overflow-visible flex items-center">
              <div className="absolute h-full bg-orange-400 rounded-full" style={{ width: `${sliderPct}%` }} />
              <div
                className="absolute w-6 h-6 bg-theme-bg border-2 border-orange-400 rounded-full shadow-[0_0_15px_rgba(255,127,80,0.5)] cursor-pointer transition-transform hover:scale-110"
                style={{ left: `calc(${sliderPct}% - 12px)` }}
              />
              <input
                type="range"
                min={RATE_BASELINE}
                max={RATE_MAX}
                step={0.1}
                value={rateSlider}
                onChange={e => setRateSlider(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] text-theme-secondary font-bold">
              <span>{t('baseline')} ({RATE_BASELINE.toFixed(2)})</span>
              <span>{t('shock')} ({RATE_MAX.toFixed(2)})</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-theme-surface/50 border border-white/5 p-4 rounded-xl">
              <span className="text-[11px] text-theme-secondary font-semibold mb-1 block">{t('impactNetWorthUSD')}</span>
              <span className={`text-base font-black ${rateImpactUSD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {isBalanceVisible ? `${rateImpactUSD >= 0 ? '+' : '-'}$${Math.abs(rateImpactUSD).toFixed(2)}` : '••••'}
              </span>
            </div>
            <div className="bg-theme-surface/50 border border-white/5 p-4 rounded-xl">
              <span className="text-[11px] text-theme-secondary font-semibold mb-1 block">{t('impactNetWorthVES')}</span>
              <span className={`text-base font-black ${rateImpactVES >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {isBalanceVisible ? `${rateImpactVES >= 0 ? '+' : '-'}Bs ${Math.abs(rateImpactVES).toFixed(2)}` : '••••'}
              </span>
            </div>
          </div>
        </div>

        {/* Scenario Builder */}
        <div>
          <div className="mb-3">
            <h2 className="text-base font-black text-theme-primary">{t('scenarioBuilder')}</h2>
            <p className="text-[11px] text-theme-secondary">{t('hypotheticalEvents')}</p>
          </div>

          <div className="relative pl-5 space-y-3 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-white/10">
            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center">
                  <TrendingUp size={24} className="text-theme-secondary opacity-40" />
                </div>
                <p className="text-xs text-theme-secondary opacity-60">{t('noScenarioEvents') || 'No events yet — tap + to add one'}</p>
              </div>
            )}

            {events.map((event) => {
              const colors = colorMap[event.color];
              return (
                <div key={event.id} className="relative">
                  <div className={`absolute -left-[5px] top-4 w-3 h-3 rounded-full ${colors.dot} z-10`} />
                  <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-theme-surface/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.icon}`}>
                        {event.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-theme-primary">{event.name}</h3>
                        <p className={`text-[11px] font-black ${colors.amount}`}>
                          {event.amount >= 0 ? '+' : '-'}${Math.abs(event.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleEvent(event.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${event.enabled ? 'bg-theme-brand/20 border-theme-brand/30 text-theme-brand shadow-[0_0_10px_rgba(43,108,238,0.3)]' : 'bg-theme-surface border-white/10 text-theme-secondary hover:text-theme-primary'}`}
                      >
                        <Check size={14} />
                      </motion.button>
                      <button
                        onClick={() => setEvents(prev => prev.filter(e => e.id !== event.id))}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 text-theme-secondary hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Event */}
            <div className="relative">
              <div className="absolute -left-[5px] top-4 w-3 h-3 rounded-full bg-theme-surface border border-white/20 z-10" />
              <button
                onClick={openAdd}
                className="w-full bg-theme-surface/30 border border-dashed border-white/10 rounded-xl p-4 flex items-center justify-center gap-2 text-theme-secondary hover:text-theme-primary hover:border-white/20 transition-all text-sm font-bold"
              >
                <Plus size={14} /> {t('addScenarioEvent')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Scenario Event Modal */}
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
                <h3 className="text-base font-black text-theme-primary">{t('addScenarioEvent')}</h3>
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
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError(''); }}
                    placeholder="Bonus, New car, Rent hike…"
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
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">Impact</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setForm(f => ({ ...f, isIncome: true, color: 'green' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${form.isIncome ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <TrendingUp size={14} /> {t('income') || 'Income'}
                    </button>
                    <button
                      onClick={() => setForm(f => ({ ...f, isIncome: false, color: 'red' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${!form.isIncome ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <TrendingDown size={14} /> {t('expense') || 'Expense'}
                    </button>
                  </div>
                </div>

                {!form.isIncome && (
                  <div>
                    <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">Urgency</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setForm(f => ({ ...f, color: 'red' }))}
                        className={`py-2 rounded-2xl border text-xs font-black transition-all ${form.color === 'red' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                      >
                        Critical
                      </button>
                      <button
                        onClick={() => setForm(f => ({ ...f, color: 'orange' }))}
                        className={`py-2 rounded-2xl border text-xs font-black transition-all ${form.color === 'orange' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                      >
                        Moderate
                      </button>
                    </div>
                  </div>
                )}

                {formError && <p className="text-xs text-red-400 font-bold">{formError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeAdd} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
                  {t('cancel')}
                </button>
                <button onClick={saveEvent} className="flex-1 py-3 rounded-2xl bg-theme-brand text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all">
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
