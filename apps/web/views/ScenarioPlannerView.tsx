import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, Check, ArrowLeft, X, BarChart2, Zap, ArrowRightLeft } from 'lucide-react';
import { Language, Currency } from '@parity/core';
import { getTranslation } from '@parity/i18n';

type EventColor = 'green' | 'red' | 'orange';
type EventType = 'income' | 'expense' | 'rate_shift';

interface ScenarioEvent {
  id: string;
  name: string;
  amount: number;
  type: EventType;
  enabled: boolean;
  color: EventColor;
  rateShift?: number;
}

interface NamedScenario {
  id: string;
  name: string;
  events: ScenarioEvent[];
}

interface ScenarioPlannerViewProps {
  onBack: () => void;
  lang: Language;
  exchangeRate: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  totalBalanceUSD: number;
  onApplyToReality?: (event: ScenarioEvent) => void;
}

interface AddEventForm {
  name: string;
  amount: string;
  type: EventType;
  color: EventColor;
  rateShift: string;
}

const EMPTY_FORM: AddEventForm = { name: '', amount: '', type: 'income', color: 'green', rateShift: '' };
const MAX_SCENARIOS = 5;
const LS_KEY = 'parity_scenarios';

function loadScenarios(): NamedScenario[] {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}

export const ScenarioPlannerView: React.FC<ScenarioPlannerViewProps> = ({
  onBack, lang, exchangeRate, isBalanceVisible, totalBalanceUSD, onApplyToReality,
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const [scenarios, setScenarios] = useState<NamedScenario[]>(loadScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(() => loadScenarios()[0]?.id || null);
  const [simulatedRate, setSimulatedRate] = useState(String(exchangeRate || ''));
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddEventForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || null;
  const events = activeScenario?.events || [];

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(scenarios)); } catch {}
  }, [scenarios]);

  const updateEvents = (updater: (evs: ScenarioEvent[]) => ScenarioEvent[]) => {
    if (!activeScenarioId) return;
    setScenarios(prev => prev.map(s => s.id === activeScenarioId ? { ...s, events: updater(s.events) } : s));
  };

  const toggleEvent = (id: string) => updateEvents(evs => evs.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  const deleteEvent = (id: string) => updateEvents(evs => evs.filter(e => e.id !== id));

  const createScenario = () => {
    const name = newScenarioName.trim() || `${t('newScenario')} ${scenarios.length + 1}`;
    const ns: NamedScenario = { id: Date.now().toString(), name, events: [] };
    const updated = [...scenarios, ns];
    setScenarios(updated);
    setActiveScenarioId(ns.id);
    setShowNewScenario(false);
    setNewScenarioName('');
  };

  const deleteScenario = (id: string) => {
    const updated = scenarios.filter(s => s.id !== id);
    setScenarios(updated);
    setActiveScenarioId(updated[0]?.id || null);
  };

  const openAdd = () => { setForm(EMPTY_FORM); setFormError(''); setShowAdd(true); };
  const closeAdd = () => setShowAdd(false);

  const saveEvent = () => {
    if (!form.name.trim()) { setFormError(`${t('name')} ${t('fieldRequired')}`); return; }
    if (form.type !== 'rate_shift') {
      const amount = parseFloat(form.amount) || 0;
      if (amount <= 0) { setFormError(`${t('amount')} ${t('mustBePositive')}`); return; }
    }
    const amount = form.type === 'rate_shift' ? 0 : parseFloat(form.amount) || 0;
    const finalAmount = form.type === 'income' ? amount : form.type === 'expense' ? -amount : 0;
    const color: EventColor = form.type === 'income' ? 'green' : form.type === 'rate_shift' ? 'orange' : form.color;
    updateEvents(evs => [...evs, {
      id: Date.now().toString(),
      name: form.name.trim(),
      amount: finalAmount,
      type: form.type,
      enabled: true,
      color,
      rateShift: form.type === 'rate_shift' ? parseFloat(form.rateShift) || 0 : undefined,
    }]);
    closeAdd();
  };

  const scenarioImpact = useMemo(() =>
    events.filter(e => e.enabled && e.type !== 'rate_shift').reduce((sum, e) => sum + e.amount, 0),
    [events]
  );
  const projectedBalance = totalBalanceUSD + scenarioImpact;
  const projectedPct = totalBalanceUSD > 0 ? ((projectedBalance - totalBalanceUSD) / totalBalanceUSD) * 100 : 0;
  const simRate = parseFloat(simulatedRate) || 0;
  const baseRate = exchangeRate || 0;
  const rateImpactUSD = simRate > 0 ? (simRate - baseRate) * (totalBalanceUSD / (simRate || 1)) * -1 : 0;
  const rateImpactVES = simRate > 0 ? rateImpactUSD * simRate * -1 : 0;
  const rateDeltaPct = simRate > 0 && baseRate > 0 ? ((simRate - baseRate) / baseRate) * 100 : 0;

  const fmt = (n: number) => isBalanceVisible ? `$${Math.abs(n).toFixed(2)}` : '••••••';
  const fmtSigned = (n: number) => isBalanceVisible ? `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}` : '••••';

  const colorMap = {
    green: { dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(62,180,137,0.5)]', icon: 'bg-emerald-500/10 text-emerald-400', amount: 'text-emerald-400' },
    red: { dot: 'bg-red-400 shadow-[0_0_10px_rgba(255,100,100,0.5)]', icon: 'bg-red-500/10 text-red-400', amount: 'text-red-400' },
    orange: { dot: 'bg-orange-400 shadow-[0_0_10px_rgba(255,127,80,0.5)]', icon: 'bg-orange-500/10 text-orange-400', amount: 'text-orange-400' },
  };

  const chartMonths = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return d.toLocaleString(lang === 'es' ? 'es' : lang === 'pt' ? 'pt' : 'en', { month: 'short' });
    });
  }, [lang]);

  const compareData = useMemo(() => scenarios.map(s => ({
    id: s.id,
    name: s.name,
    impact: s.events.filter(e => e.enabled && e.type !== 'rate_shift').reduce((sum, e) => sum + e.amount, 0),
    eventCount: s.events.length,
  })).sort((a, b) => b.impact - a.impact), [scenarios]);

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
          <h1 className="text-xl font-bold text-theme-primary">{t('scenarioPlanner')}</h1>
          <p className="text-sm text-theme-secondary opacity-60">{t('scenarioPlannerSubtitle')}</p>
        </div>
        {scenarios.length > 1 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCompare(c => !c)}
            className={`w-10 h-10 rounded-2xl border border-white/5 flex items-center justify-center transition-all ${showCompare ? 'bg-theme-brand text-white' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
          >
            <BarChart2 size={16} />
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => activeScenario ? openAdd() : setShowNewScenario(true)}
          className="w-12 h-12 bg-theme-brand rounded-2xl text-white shadow-lg shadow-brand/20 flex items-center justify-center"
        >
          <Plus size={22} />
        </motion.button>
      </div>

      {/* Scenario Selector Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2 pb-8 mb-4">
        {scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveScenarioId(s.id)}
            className={`flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-black whitespace-nowrap transition-all border ${activeScenarioId === s.id ? 'bg-theme-surface text-theme-primary border-white/20 shadow-inner' : 'bg-transparent text-theme-secondary border-transparent hover:border-white/10 hover:bg-theme-surface/50'}`}
          >
            {s.name}
            {s.events.length > 0 && <span className="opacity-50 text-[10px]">{s.events.length}</span>}
          </button>
        ))}
        {scenarios.length < MAX_SCENARIOS && (
          <button
            onClick={() => setShowNewScenario(true)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-black whitespace-nowrap text-theme-secondary border border-dashed border-white/15 hover:border-white/30 transition-all"
          >
            <Plus size={11} /> {t('newScenario')}
          </button>
        )}
        {scenarios.length >= MAX_SCENARIOS && (
          <span className="flex items-center px-3 py-2 text-[10px] text-theme-secondary opacity-50 whitespace-nowrap">{t('maxScenariosReached')}</span>
        )}
      </div>

      {/* Compare Panel */}
      <AnimatePresence>
        {showCompare && scenarios.length > 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
              <h3 className="text-sm font-black text-theme-primary mb-3">{t('compareScenarios')}</h3>
              <div className="space-y-0.5">
                {compareData.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-theme-secondary w-4 font-bold">{i + 1}</span>
                      <span className="text-sm font-bold text-theme-primary">{s.name}</span>
                      <span className="text-[10px] text-theme-secondary">{s.eventCount} {t('eventCount')}</span>
                    </div>
                    <span className={`text-sm font-black ${s.impact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isBalanceVisible ? `${s.impact >= 0 ? '+' : ''}$${s.impact.toFixed(2)}` : '••••'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State — no scenarios at all */}
      {scenarios.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center">
            <TrendingUp size={28} className="text-theme-secondary opacity-40" />
          </div>
          <div>
            <p className="text-sm font-bold text-theme-primary mb-1">{t('noScenarios')}</p>
            <p className="text-xs text-theme-secondary opacity-60 mb-4">{t('createFirstScenario')}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowNewScenario(true)}
              className="px-5 py-2.5 bg-theme-brand text-white rounded-2xl text-sm font-black inline-flex items-center gap-2"
            >
              <Plus size={14} /> {t('newScenario')}
            </motion.button>
          </div>
        </div>
      ) : !activeScenario ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-theme-secondary opacity-60">{t('noScenarios')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Projected Balance Chart */}
          <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-base font-black text-theme-primary">{t('projectedBalance')}</h2>
                <p className="text-[11px] text-theme-secondary">{activeScenario.name}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-theme-brand leading-none">{fmt(projectedBalance)}</div>
                <div className={`text-sm font-bold ${projectedPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtSigned(projectedPct).replace('$', '')}% {t('vsCurrentBalance')}
                </div>
              </div>
            </div>

            {/* Dynamic SVG Chart */}
            <div className="w-full h-40 relative bg-theme-surface rounded-xl border border-white/5 overflow-hidden">
              <svg className="absolute inset-0" width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <path d="M 0 170 Q 200 165 400 140 T 800 100 T 1000 80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                {(() => {
                  const startY = 170;
                  const clampedPct = Math.max(-1, Math.min(1, projectedPct / 100));
                  const endY = Math.max(20, Math.min(190, startY - clampedPct * 120));
                  const midY = startY - (startY - endY) * 0.5;
                  return (
                    <>
                      <path
                        d={`M 0 ${startY} Q 250 ${startY - (startY - endY) * 0.2} 500 ${midY} T 1000 ${endY}`}
                        fill="none" stroke="#2b6cee" strokeDasharray="10 5" strokeWidth="3"
                      />
                      <path
                        d={`M 0 ${startY} Q 250 ${startY - (startY - endY) * 0.2} 500 ${midY} T 1000 ${endY} L 1000 200 L 0 200 Z`}
                        fill="url(#scenGrad)" opacity="0.15"
                      />
                    </>
                  );
                })()}
                <defs>
                  <linearGradient id="scenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2b6cee" stopOpacity="1" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-2 left-0 w-full flex justify-between px-3">
                {chartMonths.map(m => <span key={m} className="text-[9px] text-theme-secondary font-bold">{m}</span>)}
              </div>
            </div>
          </div>

          {/* Rate Shock Simulator */}
          <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-theme-primary">{t('rateShockSimulator')}</h2>
                <p className="text-[11px] text-theme-secondary mt-0.5">{t('rateShockDesc')}</p>
              </div>
              {simulatedRate && (
                <button
                  onClick={() => setSimulatedRate('')}
                  className="shrink-0 text-[10px] font-bold text-theme-secondary hover:text-red-400 transition-colors px-2.5 py-1 rounded-lg border border-white/10 hover:border-red-500/30"
                >
                  {t('resetSimulation')}
                </button>
              )}
            </div>

            {/* Two-field layout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-theme-surface/50 border border-white/5 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-wide block">{t('currentRateLabel')}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-theme-primary">{baseRate > 0 ? baseRate.toFixed(2) : '—'}</span>
                  <span className="text-[10px] text-theme-secondary font-semibold">{t('bsPerDollar')}</span>
                </div>
              </div>
              <div className={`rounded-xl p-4 space-y-1 border transition-colors ${simulatedRate && simRate !== baseRate ? 'bg-orange-500/10 border-orange-500/30' : 'bg-theme-surface/50 border-white/5'}`}>
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide block">{t('simulatedRateLabel')}</span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={simulatedRate}
                    onChange={e => setSimulatedRate(e.target.value)}
                    placeholder={baseRate > 0 ? baseRate.toFixed(2) : '0.00'}
                    className="bg-transparent text-xl font-black text-orange-400 outline-none w-full placeholder:text-theme-secondary/40"
                  />
                  <span className="text-[10px] text-theme-secondary font-semibold shrink-0">{t('bsPerDollar')}</span>
                </div>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-wide">{t('quickAdjustments')}</span>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 20, 30, 50].map(pct => {
                  const target = parseFloat((baseRate * (1 + pct / 100)).toFixed(2));
                  const isActive = simRate === target;
                  return (
                    <button
                      key={pct}
                      onClick={() => setSimulatedRate(isActive ? '' : String(target))}
                      className={`text-[11px] font-black px-3 py-1.5 rounded-full border transition-all ${
                        isActive
                          ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                          : 'bg-theme-surface/50 border-white/10 text-theme-secondary hover:border-orange-500/40 hover:text-orange-400'
                      }`}
                    >
                      +{pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impact cards */}
            {simRate > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {/* USD impact */}
                <div className={`rounded-xl p-4 border space-y-2 ${rateImpactUSD < 0 ? 'bg-red-500/5 border-red-500/20' : rateImpactUSD > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-theme-surface/50 border-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-wide">{t('impactInUSD')}</span>
                    {rateDeltaPct !== 0 && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${rateDeltaPct > 0 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                        {rateDeltaPct > 0 ? '+' : ''}{rateDeltaPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <span className={`text-lg font-black block ${rateImpactUSD < 0 ? 'text-red-400' : rateImpactUSD > 0 ? 'text-emerald-400' : 'text-theme-secondary'}`}>
                    {simRate === baseRate ? '—' : isBalanceVisible ? `${rateImpactUSD >= 0 ? '+' : ''}$${rateImpactUSD.toFixed(2)}` : '••••'}
                  </span>
                  <p className="text-[10px] text-theme-secondary leading-tight">
                    {simRate === baseRate ? t('noRateChange') : rateImpactUSD < 0 ? t('rateChangeLossUSD') : t('rateChangeGainUSD')}
                  </p>
                </div>
                {/* VES impact */}
                <div className={`rounded-xl p-4 border space-y-2 ${rateImpactVES < 0 ? 'bg-red-500/5 border-red-500/20' : rateImpactVES > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-theme-surface/50 border-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-wide">{t('impactInVES')}</span>
                  </div>
                  <span className={`text-lg font-black block ${rateImpactVES < 0 ? 'text-red-400' : rateImpactVES > 0 ? 'text-emerald-400' : 'text-theme-secondary'}`}>
                    {simRate === baseRate ? '—' : isBalanceVisible ? `${rateImpactVES >= 0 ? '+' : ''}Bs ${rateImpactVES.toFixed(2)}` : '••••'}
                  </span>
                  <p className="text-[10px] text-theme-secondary leading-tight">
                    {simRate === baseRate ? t('noRateChange') : rateImpactVES < 0 ? t('rateChangeLossVES') : t('rateChangeGainVES')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Scenario Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-black text-theme-primary">{t('scenarioBuilder')}</h2>
                <p className="text-[11px] text-theme-secondary">{t('hypotheticalEvents')}</p>
              </div>
              <button
                onClick={() => deleteScenario(activeScenario.id)}
                className="text-[10px] text-theme-secondary hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
              >
                {t('delete')}
              </button>
            </div>

            <div className="relative pl-5 space-y-3 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-white/10">
              {events.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center">
                    <TrendingUp size={24} className="text-theme-secondary opacity-40" />
                  </div>
                  <p className="text-xs text-theme-secondary opacity-60">{t('noScenarioEvents')}</p>
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
                          {event.type === 'income' ? <TrendingUp size={16} /> : event.type === 'rate_shift' ? <Zap size={16} /> : <TrendingDown size={16} />}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-theme-primary">{event.name}</h3>
                          {event.type === 'rate_shift' ? (
                            <p className={`text-[11px] font-black ${colors.amount}`}>
                              +{event.rateShift?.toFixed(2)} Bs/$ {t('rateShift')}
                            </p>
                          ) : (
                            <p className={`text-[11px] font-black ${colors.amount}`}>
                              {event.amount >= 0 ? '+' : '-'}${Math.abs(event.amount).toFixed(2)}
                            </p>
                          )}
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
                        {onApplyToReality && event.type !== 'rate_shift' && (
                          <button
                            onClick={() => onApplyToReality(event)}
                            title={t('applyToReality')}
                            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 text-theme-secondary hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all"
                          >
                            <ArrowRightLeft size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 text-theme-secondary hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Event inline button */}
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
      )}

      {/* New Scenario Modal */}
      <AnimatePresence>
        {showNewScenario && (
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
                <h3 className="text-base font-black text-theme-primary">{t('newScenario')}</h3>
                <button onClick={() => setShowNewScenario(false)} className="w-8 h-8 rounded-full bg-theme-bg border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary">
                  <X size={16} />
                </button>
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('scenarioName')}</label>
                <input
                  autoFocus
                  value={newScenarioName}
                  onChange={e => setNewScenarioName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createScenario()}
                  placeholder={`${t('newScenario')}…`}
                  className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowNewScenario(false)} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
                  {t('cancel')}
                </button>
                <button onClick={createScenario} className="flex-1 py-3 rounded-2xl bg-theme-brand text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all">
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Scenario Event Modal */}
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
              className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
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
                    placeholder={`${t('income')}, ${t('expense')}…`}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('type')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['income', 'expense', 'rate_shift'] as EventType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setForm(f => ({
                          ...f, type,
                          color: type === 'income' ? 'green' : type === 'rate_shift' ? 'orange' : 'red',
                        }))}
                        className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl border text-[10px] font-black transition-all ${
                          form.type === type
                            ? type === 'income' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                              : type === 'rate_shift' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                              : 'bg-red-500/10 border-red-500/40 text-red-400'
                            : 'border-white/10 text-theme-secondary hover:border-white/20'
                        }`}
                      >
                        {type === 'income' ? <TrendingUp size={13} /> : type === 'rate_shift' ? <Zap size={13} /> : <TrendingDown size={13} />}
                        {type === 'income' ? t('income') : type === 'rate_shift' ? t('rateShift') : t('expense')}
                      </button>
                    ))}
                  </div>
                </div>

                {form.type !== 'rate_shift' ? (
                  <div>
                    <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('amount')} (USD)</label>
                    <input
                      type="number" min="0.01" step="0.01"
                      value={form.amount}
                      onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setFormError(''); }}
                      placeholder="0.00"
                      className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('rateShift')} (Bs/$)</label>
                    <input
                      type="number" min="0" step="0.1"
                      value={form.rateShift}
                      onChange={e => { setForm(f => ({ ...f, rateShift: e.target.value })); setFormError(''); }}
                      placeholder="+5.00"
                      className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                    />
                  </div>
                )}

                {form.type === 'expense' && (
                  <div>
                    <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('urgency')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setForm(f => ({ ...f, color: 'red' }))}
                        className={`py-2 rounded-2xl border text-xs font-black transition-all ${form.color === 'red' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                      >
                        {t('critical')}
                      </button>
                      <button
                        onClick={() => setForm(f => ({ ...f, color: 'orange' }))}
                        className={`py-2 rounded-2xl border text-xs font-black transition-all ${form.color === 'orange' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                      >
                        {t('moderate')}
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
