import React from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import { getLevel, getLevelProgress, getXPToNextLevel, CHALLENGE_TEMPLATES } from '@parity/core';
import type { GamificationProfile } from '@parity/core';

interface GamificationWidgetProps {
  profile: GamificationProfile | null;
  onNavigate: (view: 'ACADEMY') => void;
  t: (key: string) => string;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({ profile, onNavigate, t }) => {
  if (!profile) return null;

  const levelDef = getLevel(profile.level);
  const progress = getLevelProgress(profile.xp);
  const xpToNext = getXPToNextLevel(profile.xp);

  const activeChallengeId = Object.keys(profile.challengeProgress).find(id => {
    const cp = profile.challengeProgress[id];
    return !cp.completed && new Date(cp.expiresAt) > new Date();
  });
  const activeChallengeTemplate = activeChallengeId
    ? CHALLENGE_TEMPLATES.find(c => c.id === activeChallengeId)
    : CHALLENGE_TEMPLATES[0];
  const activeChallenge = activeChallengeId ? profile.challengeProgress[activeChallengeId] : null;

  return (
    <div
      className="bg-theme-surface border border-theme rounded-2xl p-4 cursor-pointer hover:border-theme-brand/40 transition-all"
      onClick={() => onNavigate('ACADEMY')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelDef.icon}</span>
          <div>
            <p className="text-xs text-theme-secondary">{t('gamification_level_label')}</p>
            <p className="text-sm font-bold text-theme-primary">{t(levelDef.nameKey)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10">
            <Flame size={12} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-400">{profile.streak.currentDays}</span>
          </div>
          <ChevronRight size={16} className="text-theme-secondary" />
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-theme-secondary mb-1">
          <span>{profile.xp} XP</span>
          <span>{xpToNext !== null ? `${xpToNext} para el siguiente` : 'Nivel máximo'}</span>
        </div>
        <div className="h-2 bg-theme-card rounded-full overflow-hidden">
          <div
            className="h-full bg-theme-brand rounded-full transition-all duration-700"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Active Challenge */}
      {activeChallengeTemplate && (
        <div className="flex items-center gap-2 px-3 py-2 bg-theme-card rounded-xl">
          <span className="text-base">{activeChallengeTemplate.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-theme-secondary truncate">{t(activeChallengeTemplate.titleKey)}</p>
            {activeChallenge && (
              <div className="h-1 bg-theme-surface rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-theme-brand/60 rounded-full"
                  style={{
                    width: `${Math.min(100, (activeChallenge.current / Math.max(1, activeChallenge.target)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-theme-brand flex-shrink-0">
            +{activeChallengeTemplate.xpReward} XP
          </span>
        </div>
      )}
    </div>
  );
};
