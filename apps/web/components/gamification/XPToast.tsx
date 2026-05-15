import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface XPToastProps {
  xp: number;
  label: string;
  onDismiss: () => void;
}

export const XPToast: React.FC<XPToastProps> = ({ xp, label, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-surface border border-theme shadow-theme pointer-events-auto"
    >
      <Sparkles size={14} className="text-theme-brand flex-shrink-0" />
      <span className="text-sm font-semibold text-theme-brand">+{xp} XP</span>
      <span className="text-sm text-theme-secondary">· {label}</span>
    </motion.div>
  );
};

interface XPToastContainerProps {
  rewards: { xpGained: number; label: string }[];
  onDismiss: (index: number) => void;
}

export const XPToastContainer: React.FC<XPToastContainerProps> = ({ rewards, onDismiss }) => (
  <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
    <AnimatePresence>
      {rewards.map((r, i) => (
        <XPToast key={i} xp={r.xpGained} label={r.label} onDismiss={() => onDismiss(i)} />
      ))}
    </AnimatePresence>
  </div>
);
