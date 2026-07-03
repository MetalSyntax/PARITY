import React from 'react';
import { 
  Lock, 
  Sprout, 
  Landmark, 
  Smartphone, 
  Trophy, 
  Award, 
  Package, 
  Sparkles, 
  Swords, 
  Flame, 
  Gem, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Globe, 
  Zap, 
  CreditCard, 
  PenTool, 
  Cpu, 
  HelpCircle 
} from 'lucide-react';
import { BADGE_DEFINITIONS } from '@parity/core';
import type { EarnedBadge, BadgeFamily } from '@parity/core';

interface BadgeGridProps {
  earnedBadges: EarnedBadge[];
  t: (key: string) => string;
}

const IconMap: Record<string, React.ComponentType<any>> = {
  Sprout,
  Landmark,
  Lock,
  Smartphone,
  Trophy,
  Award,
  Package,
  Sparkles,
  Swords,
  Flame,
  Gem,
  Calendar,
  TrendingUp,
  Activity,
  Globe,
  Zap,
  CreditCard,
  PenTool,
  Cpu,
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
              {t(`gamification_family_${family}`)}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {badges.map(badge => {
                const earned = earnedIds.has(badge.id);
                const BadgeIcon = IconMap[badge.icon] || HelpCircle;

                return (
                  <div
                    key={badge.id}
                    title={earned ? t(badge.nameKey) : t('gamification_badge_locked')}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl bg-theme-card border transition-all ${
                      earned ? 'border-theme-brand/30 opacity-100' : 'border-theme opacity-40 grayscale'
                    }`}
                  >
                    <div className="text-theme-brand">
                      <BadgeIcon size={20} />
                    </div>
                    <span className="text-center text-[10px] text-theme-primary font-bold leading-tight line-clamp-1 mt-1 w-full">
                      {t(badge.nameKey)}
                    </span>
                    <span className="text-center text-[8px] text-theme-secondary leading-tight line-clamp-2 mt-0.5 opacity-80 h-6">
                      {t(badge.descriptionKey)}
                    </span>
                    {!earned && (
                      <div className="absolute top-1.5 right-1.5">
                        <Lock size={10} className="text-theme-secondary/60" />
                      </div>
                    )}
                    {earned && (
                      <span className="text-[9px] font-bold text-theme-brand mt-1 bg-theme-brand/10 px-1.5 py-0.5 rounded-full">
                        +{badge.xp} XP
                      </span>
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
