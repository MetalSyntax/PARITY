import React from 'react';
import { ArrowLeft, Trophy, Zap, Sprout, BarChart2, Landmark, Layers, Receipt, Target, Swords, CheckCircle2 } from 'lucide-react';
import { getLevel, getLevelProgress, getXPToNextLevel, CHALLENGE_TEMPLATES, LEVELS } from '@parity/core';
import type { GamificationProfile, LevelId } from '@parity/core';
import { StreakCalendar } from '../components/gamification/StreakCalendar';
import { ChallengeCard } from '../components/gamification/ChallengeCard';
import { BadgeGrid } from '../components/gamification/BadgeGrid';

const LEVEL_ICONS: Record<LevelId, React.ReactNode> = {
  novice:     <Sprout   size={40} className="text-zinc-400" />,
  analyst:    <BarChart2 size={40} className="text-sky-400" />,
  strategist: <Landmark  size={40} className="text-emerald-400" />,
  architect:  <Layers    size={40} className="text-amber-400" />,
  cfo:        <Trophy    size={40} className="text-yellow-400" />,
};

interface AcademyViewProps {
  profile: GamificationProfile | null;
  onBack: () => void;
  t: (key: string) => string;
}

// Custom SVG XP sparkline (no Chart.js)
const XPSparkline: React.FC<{ xpLog: GamificationProfile['xpLog'] }> = ({ xpLog }) => {
  const today = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const data = days.map(date => xpLog.find(e => e.date === date)?.xp ?? 0);
  const max = Math.max(...data, 1);
  const width = 280;
  const height = 56;
  const barW = Math.floor((width - 12 * 6) / 7);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {data.map((v, i) => {
        const barH = Math.max(4, (v / max) * (height - 8));
        const x = i * (barW + 12);
        const y = height - barH;
        const isToday = i === 6;
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barW} height={barH}
              rx={3}
              fill={isToday ? 'var(--primary)' : 'var(--primary)'}
              opacity={isToday ? 1 : 0.35}
            />
            {v > 0 && (
              <text
                x={x + barW / 2} y={y - 3}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-secondary)"
              >
                {v}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const AcademyView: React.FC<AcademyViewProps> = ({ profile, onBack, t }) => {
  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center text-theme-secondary">
        <p>{t('loading')}</p>
      </div>
    );
  }

  const levelDef = getLevel(profile.level);
  const progress = getLevelProgress(profile.xp);
  const xpToNext = getXPToNextLevel(profile.xp);
  const currentLevelIndex = LEVELS.findIndex(l => l.id === profile.level);

  const activeTemplates = CHALLENGE_TEMPLATES.filter(t_ => {
    const cp = profile.challengeProgress[t_.id];
    if (!cp) return true;
    if (cp.completed) return false;
    return new Date(cp.expiresAt) > new Date();
  }).slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-theme-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-theme-surface border border-theme text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-theme-primary">{t('gamification_academy_title')}</h1>
          <p className="text-xs text-theme-secondary">{profile.xp} XP total</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-5">
        {/* Level Card */}
        <div className="bg-theme-surface border border-theme rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-theme-card flex items-center justify-center flex-shrink-0">
              {LEVEL_ICONS[profile.level]}
            </div>
            <div className="flex-1">
              <p className="text-xs text-theme-secondary mb-0.5">{t('gamification_level_label')}</p>
              <p className="text-xl font-bold text-theme-primary">{t(levelDef.nameKey)}</p>
              <p className="text-xs text-theme-secondary mt-0.5">
                {xpToNext !== null ? `${xpToNext} XP para ${t(LEVELS[currentLevelIndex + 1]?.nameKey ?? '')}` : t('gamification_max_level')}
              </p>
            </div>
          </div>
          {/* Level progress bar */}
          <div className="h-3 bg-theme-card rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-theme-brand rounded-full transition-all duration-700"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-theme-secondary">
            <span>{levelDef.minXP} XP</span>
            <span className="font-semibold text-theme-primary">{profile.xp} XP</span>
            <span>{levelDef.maxXP !== null ? `${levelDef.maxXP} XP` : '∞'}</span>
          </div>
        </div>

        {/* Streak Card */}
        <StreakCalendar
          currentDays={profile.streak.currentDays}
          longestDays={profile.streak.longestDays}
          lastActivityDate={profile.streak.lastActivityDate}
          t={t}
        />

        {/* Active Challenges */}
        {activeTemplates.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-theme-primary mb-3">
              {t('gamification_academy_activeChallenges')}
            </p>
            <div className="space-y-2">
              {activeTemplates.map(tmpl => (
                <ChallengeCard
                  key={tmpl.id}
                  template={tmpl}
                  progress={profile.challengeProgress[tmpl.id]}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {/* XP History Sparkline */}
        <div className="bg-theme-surface border border-theme rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-theme-brand" />
            <p className="text-sm font-semibold text-theme-primary">{t('gamification_academy_xpHistory')}</p>
          </div>
          <XPSparkline xpLog={profile.xpLog} />
        </div>

        {/* Badge Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-theme-brand" />
            <p className="text-sm font-semibold text-theme-primary">{t('gamification_academy_badges')}</p>
            <span className="ml-auto text-xs text-theme-secondary">
              {profile.badges.length}/{19}
            </span>
          </div>
          <BadgeGrid earnedBadges={profile.badges} t={t} />
        </div>

        {/* Lifetime Stats */}
        <div>
          <p className="text-sm font-semibold text-theme-primary mb-3">
            {t('gamification_academy_lifetimeStats')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('gamification_stat_transactions'), value: profile.stats.totalTransactionsLogged, Icon: Receipt,      color: 'text-sky-400',     bg: 'bg-sky-400/10' },
              { label: t('gamification_stat_goals'),        value: profile.stats.totalGoalsCompleted,     Icon: Target,       color: 'text-amber-400',   bg: 'bg-amber-400/10' },
              { label: t('gamification_stat_debts'),        value: profile.stats.totalDebtsSettled,       Icon: Swords,       color: 'text-rose-400',    bg: 'bg-rose-400/10' },
              { label: t('gamification_stat_green_months'), value: profile.stats.totalBudgetMonthsInGreen, Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map(({ label, value, Icon, color, bg }) => (
              <div key={label} className="bg-theme-card rounded-xl p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className="text-xl font-bold text-theme-primary">{value}</p>
                  <p className="text-xs text-theme-secondary">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
