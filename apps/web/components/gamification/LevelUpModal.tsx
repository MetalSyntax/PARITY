import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { getLevel } from '@parity/core';
import type { LevelId } from '@parity/core';

interface LevelUpModalProps {
  newLevel: LevelId;
  onDismiss: () => void;
  onViewAcademy: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ newLevel, onDismiss, onViewAcademy }) => {
  const def = getLevel(newLevel);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.querySelectorAll('.confetti-piece').forEach(piece => {
      (piece as HTMLElement).style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
      (piece as HTMLElement).style.setProperty('--r', `${Math.random() * 720}deg`);
    });
  }, []);

  const confettiColors = ['#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      >
        <motion.div
          ref={containerRef}
          className="relative bg-theme-surface border border-theme rounded-2xl p-8 max-w-sm w-full mx-4 text-center overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Confetti pieces */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece absolute w-2 h-2 rounded-sm opacity-0"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 30}%`,
                backgroundColor: confettiColors[i % confettiColors.length],
                animation: `confetti-fall 1.2s ${Math.random() * 0.4}s ease-out forwards`,
              }}
            />
          ))}

          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 rounded-lg bg-theme-card text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <X size={16} />
          </button>

          <div className="text-6xl mb-4">{def.icon}</div>
          <h2 className="text-xl font-bold text-theme-primary mb-1">¡Subiste de nivel!</h2>
          <p className="text-theme-brand font-semibold text-lg mb-4">{def.nameKey}</p>

          {def.unlockedFeatures.length > 0 && (
            <div className="bg-theme-card rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">Funciones desbloqueadas</p>
              <ul className="space-y-1">
                {def.unlockedFeatures.slice(0, 3).map(f => (
                  <li key={f} className="text-sm text-theme-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-theme-brand flex-shrink-0" />
                    {f.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => { onDismiss(); onViewAcademy(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-theme-brand text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Ver mi progreso
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
