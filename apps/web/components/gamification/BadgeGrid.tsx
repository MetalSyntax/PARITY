import React from 'react';
import { Lock } from 'lucide-react';
import { BADGE_DEFINITIONS } from '@parity/core';
import type { EarnedBadge, BadgeFamily } from '@parity/core';

interface BadgeGridProps {
  earnedBadges: EarnedBadge[];
  t: (key: string) => string;
}

const FAMILY_LABELS: Record<BadgeFamily, string> = {
  first_steps: 'Primeros pasos',
  planner: 'Planificador',
  consistency: 'Consistencia',
  multicurrency: 'Multicurrency',
  builder: 'Creador',
};

export const BadgeGrid: React.FC<BadgeGridProps> = ({ earnedBadges, t }) => {
  const earnedIds = new Set(earnedBadges.map(b => b.badgeId));

  const families: BadgeFamily[] = ['first_steps', 'planner', 'consistency', 'multicurrency', 'builder'];

  return (
    <div className="space-y-5">
      {families.map(family => {
        const badges = BADGE_DEFINITIONS.filter(b => b.family === family);
        return (
          <div key={family}>
            <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-3">
              {FAMILY_LABELS[family]}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {badges.map(badge => {
                const earned = earnedIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    title={earned ? t(badge.nameKey) : t('gamification_badge_locked')}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-theme-card border transition-all ${
                      earned ? 'border-theme-brand/30 opacity-100' : 'border-theme opacity-40 grayscale'
                    }`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-center text-xs text-theme-secondary leading-tight line-clamp-2">
                      {t(badge.nameKey)}
                    </span>
                    {!earned && (
                      <div className="absolute top-1.5 right-1.5">
                        <Lock size={10} className="text-theme-secondary/60" />
                      </div>
                    )}
                    {earned && (
                      <span className="text-xs font-bold text-theme-brand">+{badge.xp}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
