import React from 'react';
import { ArrowLeft, Trophy, Calendar, Heart, Coins, BarChart2, Flame } from 'lucide-react';
import { GamificationProfile, computeBudgetHealth, idbService, SHOP_CATALOG } from '@parity/core';
import { Card } from '@parity/ui';

interface WeeklyRecapViewProps {
  profile: GamificationProfile;
  onBack: () => void;
  t: (key: string) => string;
}

export const WeeklyRecapView: React.FC<WeeklyRecapViewProps> = ({ profile, onBack, t }) => {
  // 1. Calculate perfect days count in the last 7 days
  const perfectDaysCount = profile.xpLog.filter(entry => {
    return entry.source === 'perfect_day' as any;
  }).length;

  // 2. Budget Health Trend (Hearts)
  const [currentHealth, setCurrentHealth] = React.useState({ hearts: 5, reasons: [] as any[] });
  React.useEffect(() => {
    idbService.read().then(data => {
      if (data) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const health = computeBudgetHealth(data, todayStr);
        setCurrentHealth(health);
      }
    });
  }, []);

  // 3. Newly affordable shop items
  const affordableItems = SHOP_CATALOG.filter(
    item => !profile.ownedShopItems.includes(item.id) && profile.coins.balance >= item.cost
  );

  return (
    <div className="flex flex-col h-full bg-theme-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4 border-b border-theme/10 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-theme-surface border border-theme text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm font-black text-theme-primary">{t('gamification_recap_title')}</span>
        <div className="w-9 h-9" /> {/* Spacer */}
      </div>

      {/* Recap Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Intro */}
        <div className="text-center py-6 bg-gradient-to-br from-theme-brand/10 to-violet-500/10 rounded-3xl border border-theme flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-theme-brand/10 border border-theme-brand/20 flex items-center justify-center text-theme-brand">
            <BarChart2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">{t('gamification_recap_weekly_walk')}</h2>
            <p className="text-xs text-theme-secondary">{t('gamification_recap_subtitle')}</p>
          </div>
        </div>

        {/* Section 1: XP & Personal League */}
        <Card className="p-4 border-theme space-y-3">
          <div className="flex items-center gap-2 text-theme-brand">
            <Trophy size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">{t('gamification_recap_personal_league')}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-theme-secondary">{t('gamification_recap_current_league')}</p>
              <p className="text-lg font-black text-theme-primary capitalize">{profile.personalLeague.currentTier}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-theme-secondary">{t('gamification_recap_xp_this_week')}</p>
              <p className="text-lg font-black text-theme-primary">{profile.personalLeague.weekXP} XP</p>
            </div>
          </div>
          <p className="text-xs text-theme-secondary">
            {t('gamification_recap_league_desc')}
          </p>
        </Card>

        {/* Section 2: Perfect Days */}
        <Card className="p-4 border-theme space-y-3">
          <div className="flex items-center gap-2 text-orange-400">
            <Calendar size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">{t('gamification_recap_perfect_days')}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-theme-secondary">{t('gamification_recap_completed_everything')}</p>
              <p className="text-lg font-black text-theme-primary">{perfectDaysCount} / 7 days</p>
            </div>
            <Flame size={28} className="text-orange-400" />
          </div>
          <p className="text-xs text-theme-secondary">
            {t('gamification_recap_perfect_days_desc')}
          </p>
        </Card>

        {/* Section 3: Budget Health */}
        <Card className="p-4 border-theme space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <Heart size={18} className="fill-rose-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">{t('gamification_recap_budget_health')}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-theme-secondary">{t('gamification_recap_indicators')}</p>
              <p className="text-lg font-black text-theme-primary">{currentHealth.hearts} / 5 Hearts</p>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  size={16}
                  className={i < currentHealth.hearts ? 'fill-rose-500 text-rose-500' : 'text-theme/20'}
                />
              ))}
            </div>
          </div>
          {currentHealth.reasons.length > 0 ? (
            <p className="text-xs text-theme-secondary">
              {t('gamification_recap_health_warn')}
            </p>
          ) : (
            <p className="text-xs text-theme-secondary">
              {t('gamification_recap_health_ok')}
            </p>
          )}
        </Card>

        {/* Section 4: Coins & Shop */}
        <Card className="p-4 border-theme space-y-3">
          <div className="flex items-center gap-2 text-yellow-500">
            <Coins size={18} className="fill-yellow-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">{t('gamification_recap_shop_highlights')}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-theme-secondary">{t('gamification_recap_spendable_balance')}</p>
              <p className="text-lg font-black text-theme-primary">{profile.coins.balance} {t('gamification_shop_coins')}</p>
            </div>
            {affordableItems.length > 0 && (
              <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-extrabold px-2 py-0.5 rounded-full">
                {t('gamification_recap_affordable_alert')}
              </span>
            )}
          </div>
          <p className="text-xs text-theme-secondary">
            {t('gamification_recap_shop_desc')}
          </p>
        </Card>
      </div>
    </div>
  );
};
