import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { BadgeDefinition } from '@parity/core';

interface BadgeEarnedSheetProps {
  badges: BadgeDefinition[];
  onDismiss: () => void;
  t: (key: string) => string;
}

export const BadgeEarnedSheet: React.FC<BadgeEarnedSheetProps> = ({ badges, onDismiss, t }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  if (badges.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      >
        <motion.div
          className="bg-theme-surface border border-theme rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm mx-0 sm:mx-4"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-theme-primary">{t('gamification_badge_earned')}</h3>
            <button onClick={onDismiss} className="p-1 rounded-lg bg-theme-card text-theme-secondary hover:text-theme-primary transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {badges.map(badge => (
              <div key={badge.id} className="flex items-center gap-4 p-3 bg-theme-card rounded-xl">
                <span className="text-3xl">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-theme-primary text-sm">{t(badge.nameKey)}</p>
                  <p className="text-xs text-theme-secondary truncate">{t(badge.descriptionKey)}</p>
                </div>
                <span className="text-xs font-bold text-theme-brand flex-shrink-0">+{badge.xp} XP</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
