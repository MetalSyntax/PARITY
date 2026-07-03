import React from 'react';
import type { ChallengeTemplate } from '@parity/core';
import type { ChallengeProgress } from '@parity/core';
import { 
  CheckCircle2, 
  FileText, 
  TrendingUp, 
  Activity, 
  PiggyBank, 
  Utensils, 
  Flame, 
  Handshake, 
  Award, 
  Percent, 
  Target, 
  HelpCircle,
  RotateCw,
  Coins
} from 'lucide-react';

interface ChallengeCardProps {
  template: ChallengeTemplate;
  progress: ChallengeProgress | undefined;
  onReroll?: () => void;
  t: (key: string) => string;
}

const HORIZON_COLORS = {
  daily: 'text-sky-400 bg-sky-400/10',
  weekly: 'text-violet-400 bg-violet-400/10',
  monthly: 'text-amber-400 bg-amber-400/10',
};

const IconMap: Record<string, React.ComponentType<any>> = {
  FileText,
  TrendingUp,
  Activity,
  PiggyBank,
  Utensils,
  Flame,
  Handshake,
  Award,
  Percent,
  Target,
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ template, progress, onReroll, t }) => {
  const current = progress?.current ?? 0;
  const target = getTargetCount(template);
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const completed = progress?.completed ?? false;

  const ChallengeIcon = IconMap[template.icon] || HelpCircle;

  return (
    <div className={`p-4 rounded-xl bg-theme-card border ${completed ? 'border-green-500/30' : 'border-theme'}`}>
      <div className="flex items-start gap-3 mb-3">
        <span className="p-2 rounded-xl bg-theme-surface border border-theme text-theme-brand flex-shrink-0">
          <ChallengeIcon size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-theme-primary truncate">{t(template.titleKey)}</p>
            {completed && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-theme-secondary">{t(template.descriptionKey)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${HORIZON_COLORS[template.horizon]}`}>
            {t(`challenge_horizon_${template.horizon}`)}
          </span>
          <span className="text-xs font-bold text-theme-brand">+{template.xpReward} XP</span>
          
          {/* Swap Reroll Button */}
          {!completed && onReroll && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReroll();
              }}
              title="Swap challenge (10 Coins)"
              className="mt-1 p-1 px-1.5 rounded-lg bg-theme-surface border border-theme text-theme-secondary hover:text-theme-primary hover:border-theme-brand/40 transition-colors flex items-center gap-1 text-[9px] font-bold"
            >
              <RotateCw size={10} />
              <Coins size={10} className="fill-yellow-500/10 text-yellow-500" />
              <span>10</span>
            </button>
          )}
        </div>
      </div>

      {!completed && target > 0 && (
        <>
          <div className="h-1.5 bg-theme-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-theme-brand rounded-full transition-all duration-500"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-theme-secondary">{current}/{target}</span>
            <span className="text-xs text-theme-secondary">{Math.round(pct * 100)}%</span>
          </div>
        </>
      )}

      {completed && (
        <p className="text-xs text-green-400 font-medium">{t('challenge_completed')}</p>
      )}
    </div>
  );
};

function getTargetCount(template: ChallengeTemplate): number {
  switch (template.target.type) {
    case 'transaction_count': return template.target.count;
    case 'streak_days': return template.target.days;
    case 'debt_payment': return template.target.count;
    case 'rate_checks': return template.target.count;
    case 'budget_adherence': return template.target.envelopeCount;
    case 'goal_progress': return template.target.progressPercent;
    case 'savings_amount': return template.target.amount;
    case 'category_spend_limit': return template.target.limit;
    default: return 1;
  }
}
