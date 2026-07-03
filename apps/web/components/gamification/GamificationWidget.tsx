import React from 'react';
import { Flame, ChevronRight, Heart, Coins, Bot, Sparkles, UserCheck } from 'lucide-react';
import { getLevel, getLevelProgress, getXPToNextLevel, CHALLENGE_TEMPLATES, getDailyGoalProgress, computeBudgetHealth } from '@parity/core';
import type { GamificationProfile } from '@parity/core';

interface GamificationWidgetProps {
  profile: GamificationProfile | null;
  onNavigate: (view: 'ACADEMY') => void;
  context?: any;
  t: (key: string) => string;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({ profile, onNavigate, context, t }) => {
  if (!profile) return null;

  const levelDef = getLevel(profile.level);
  const progress = getLevelProgress(profile.xp);
  const xpToNext = getXPToNextLevel(profile.xp);
  
  const today = new Date().toISOString().slice(0, 10);
  
  // Calculate daily goal progress
  const dailyGoalStatus = getDailyGoalProgress(profile.xpLog, today, profile.dailyGoal);
  
  // Calculate budget health hearts
  const health = context 
    ? computeBudgetHealth(context, today) 
    : { hearts: 5, reasons: [] };

  // Calculate circular SVG progress ring parameters
  const radius = 26;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - dailyGoalStatus.progress * circumference;

  const activeChallengeId = Object.keys(profile.challengeProgress).find(id => {
    const cp = profile.challengeProgress[id];
    return !cp.completed && new Date(cp.expiresAt) > new Date();
  });
  const activeChallengeTemplate = activeChallengeId
    ? CHALLENGE_TEMPLATES.find(c => c.id === activeChallengeId)
    : CHALLENGE_TEMPLATES[0];
  const activeChallenge = activeChallengeId ? profile.challengeProgress[activeChallengeId] : null;

  // Mascot "Cheque" helper icon component (no emojis, no owl)
  const getChequeIcon = () => {
    if (profile.mascotOutfit === 'mascot_outfit_sombrero') {
      return <Sparkles size={20} className="text-yellow-400" />;
    }
    if (profile.mascotOutfit === 'mascot_outfit_liqui_liqui') {
      return <UserCheck size={20} className="text-emerald-400" />;
    }
    return <Bot size={20} className="text-theme-brand" />; // Clean financial assistant bot icon
  };

  return (
    <div
      className="bg-theme-surface border border-theme rounded-2xl p-4 cursor-pointer hover:border-theme-brand/40 transition-all space-y-3"
      onClick={() => onNavigate('ACADEMY')}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Progress Ring around Mascot */}
          <div className="relative flex items-center justify-center w-[52px] h-[52px]">
            <svg height={radius * 2} width={radius * 2} className="absolute transform -rotate-90">
              <circle
                stroke="var(--theme-border)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="opacity-20"
              />
              <circle
                stroke="var(--primary)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-500"
              />
            </svg>
            <div className="z-10 flex items-center justify-center w-9 h-9 rounded-full bg-theme-surface border border-theme shadow-sm">
              {getChequeIcon()}
            </div>
          </div>

          <div>
            <p className="text-xs text-theme-secondary">{t('gamification_level_label')}</p>
            <p className="text-sm font-bold text-theme-primary">{t(levelDef.nameKey)}</p>
            
            {/* Hearts Row */}
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  size={12}
                  className={i < health.hearts ? 'fill-rose-500 text-rose-500' : 'text-theme/20'}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak indicator */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10">
            <Flame size={12} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-400">{profile.streak.currentDays}</span>
          </div>
          {/* Coins indicator */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 font-bold text-xs">
            <Coins size={12} className="fill-yellow-500 text-yellow-500" />
            <span>{profile.coins.balance}</span>
          </div>
          <ChevronRight size={16} className="text-theme-secondary" />
        </div>
      </div>

      {/* Budget Health Diagnostics if flags exist */}
      {health.reasons.length > 0 && (
        <div className="text-[10px] text-rose-400 bg-rose-400/5 border border-rose-400/10 rounded-xl px-2.5 py-1.5 space-y-0.5">
          <p className="font-extrabold uppercase tracking-wider">Health Alert:</p>
          {health.reasons.slice(0, 2).map((reason: any, idx: number) => (
            <p key={idx} className="opacity-95">
              • {reason.type === 'envelope_over_pace' 
                  ? `${reason.categoryName} is ${reason.percentOver}% over pace`
                  : reason.type === 'no_transactions_logged_3_days'
                    ? 'No transactions logged in 3 days'
                    : 'Savings rate is currently negative'}
            </p>
          ))}
        </div>
      )}

      {/* XP Bar */}
      <div>
        <div className="flex justify-between text-xs text-theme-secondary mb-1">
          <span>{profile.xp} XP</span>
          <span>{xpToNext !== null ? `${xpToNext} ${t('gamification_challenge_remaining')}` : t('gamification_challenge_max')}</span>
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
