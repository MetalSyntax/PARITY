import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Filter, Plus, ArrowLeft, Receipt } from 'lucide-react';
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

export const DebtSplitTrackerView: React.FC<DebtSplitTrackerViewProps> = ({ lang, onBack }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [splits] = useState<Split[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalOwedToYou = splits.filter(s => s.direction === 'OWED_TO_YOU').reduce((sum, s) => sum + s.remaining, 0);
  const totalYouOwe = splits.filter(s => s.direction === 'YOU_OWE').reduce((sum, s) => sum + s.remaining, 0);
  const overdueAlerts = splits.filter(s => s.remaining > 0);

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
                <p className="text-xl font-black text-theme-primary">0%</p>
                <p className="text-[11px] text-theme-secondary mb-0.5">{t('ofSplitsSettled')}</p>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-theme-surface border-t-theme-brand flex items-center justify-center rotate-45 flex-shrink-0">
              <div className="w-10 h-10 rounded-full border-4 border-theme-surface border-b-emerald-500 -rotate-45" />
            </div>
          </div>
        </div>

        {/* Active Splits */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-black text-theme-primary">{t('activeSplits')}</h3>
            <button className="flex items-center gap-1 text-theme-brand text-sm font-black">
              <Filter size={13} /> {t('filter') || 'Filter'}
            </button>
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
                        <div className="w-10 h-10 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center text-theme-secondary">{split.icon}</div>
                        <div>
                          <p className="text-sm font-black text-theme-primary">{split.category}</p>
                          <p className="text-[11px] text-theme-secondary">{split.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-black ${split.direction === 'OWED_TO_YOU' ? 'text-theme-brand' : 'text-red-400'}`}>
                          ${split.remaining.toFixed(2)}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-theme-secondary font-black">{t('remaining')}</p>
                      </div>
                    </div>
                  </button>
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
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-theme-brand flex items-center justify-center shadow-[0_0_20px_rgba(43,108,238,0.4)] z-40"
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </div>
  );
};
