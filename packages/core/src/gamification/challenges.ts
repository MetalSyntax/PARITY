import type { GamificationProfile, ChallengeProgress } from './schema';

export interface ChallengeTemplate {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  horizon: 'daily' | 'weekly' | 'monthly';
  xpReward: number;
  target: ChallengeTarget;
  assignWhen?: ChallengeAssignCondition;
}

export type ChallengeTarget =
  | { type: 'transaction_count'; count: number }
  | { type: 'category_spend_limit'; category: string; limit: number; currency: 'USD' | 'VES' }
  | { type: 'savings_amount'; amount: number; currency: 'USD' | 'VES' }
  | { type: 'budget_adherence'; envelopeCount: number }
  | { type: 'streak_days'; days: number }
  | { type: 'goal_progress'; progressPercent: number }
  | { type: 'debt_payment'; count: number }
  | { type: 'rate_checks'; count: number };

export type ChallengeAssignCondition =
  | { type: 'always' }
  | { type: 'has_active_goal' }
  | { type: 'has_active_budget' }
  | { type: 'has_active_debt' }
  | { type: 'exceeded_category_last_month'; category: string }
  | { type: 'savings_rate_below'; rate: number };

export interface FinancialContext {
  hasActiveGoal: boolean;
  hasActiveBudget: boolean;
  hasActiveDebt: boolean;
  exceededCategories: string[];
  currentSavingsRate: number;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // Daily
  {
    id: 'daily_log_today',
    titleKey: 'challenge_daily_log_today_title',
    descriptionKey: 'challenge_daily_log_today_desc',
    icon: '📝',
    horizon: 'daily',
    xpReward: 10,
    target: { type: 'transaction_count', count: 1 },
    assignWhen: { type: 'always' },
  },
  {
    id: 'daily_check_rate',
    titleKey: 'challenge_daily_check_rate_title',
    descriptionKey: 'challenge_daily_check_rate_desc',
    icon: '💱',
    horizon: 'daily',
    xpReward: 5,
    target: { type: 'rate_checks', count: 1 },
    assignWhen: { type: 'always' },
  },
  // Weekly
  {
    id: 'weekly_no_gaps',
    titleKey: 'challenge_weekly_no_gaps_title',
    descriptionKey: 'challenge_weekly_no_gaps_desc',
    icon: '📊',
    horizon: 'weekly',
    xpReward: 30,
    target: { type: 'transaction_count', count: 7 },
    assignWhen: { type: 'always' },
  },
  {
    id: 'weekly_save_25',
    titleKey: 'challenge_weekly_save_25_title',
    descriptionKey: 'challenge_weekly_save_25_desc',
    icon: '💰',
    horizon: 'weekly',
    xpReward: 40,
    target: { type: 'savings_amount', amount: 25, currency: 'USD' },
    assignWhen: { type: 'has_active_goal' },
  },
  {
    id: 'weekly_control_food',
    titleKey: 'challenge_weekly_control_food_title',
    descriptionKey: 'challenge_weekly_control_food_desc',
    icon: '🍔',
    horizon: 'weekly',
    xpReward: 50,
    target: { type: 'category_spend_limit', category: 'food', limit: 50, currency: 'USD' },
    assignWhen: { type: 'exceeded_category_last_month', category: 'food' },
  },
  {
    id: 'weekly_streak_7',
    titleKey: 'challenge_weekly_streak_7_title',
    descriptionKey: 'challenge_weekly_streak_7_desc',
    icon: '🔥',
    horizon: 'weekly',
    xpReward: 45,
    target: { type: 'streak_days', days: 7 },
    assignWhen: { type: 'always' },
  },
  {
    id: 'weekly_settle_debt',
    titleKey: 'challenge_weekly_settle_debt_title',
    descriptionKey: 'challenge_weekly_settle_debt_desc',
    icon: '🤝',
    horizon: 'weekly',
    xpReward: 60,
    target: { type: 'debt_payment', count: 1 },
    assignWhen: { type: 'has_active_debt' },
  },
  // Monthly
  {
    id: 'monthly_all_green',
    titleKey: 'challenge_monthly_all_green_title',
    descriptionKey: 'challenge_monthly_all_green_desc',
    icon: '🏆',
    horizon: 'monthly',
    xpReward: 120,
    target: { type: 'budget_adherence', envelopeCount: 3 },
    assignWhen: { type: 'has_active_budget' },
  },
  {
    id: 'monthly_savings_rate',
    titleKey: 'challenge_monthly_savings_rate_title',
    descriptionKey: 'challenge_monthly_savings_rate_desc',
    icon: '📈',
    horizon: 'monthly',
    xpReward: 100,
    target: { type: 'savings_amount', amount: 0, currency: 'USD' },
    assignWhen: { type: 'savings_rate_below', rate: 0.2 },
  },
  {
    id: 'monthly_goal_progress',
    titleKey: 'challenge_monthly_goal_progress_title',
    descriptionKey: 'challenge_monthly_goal_progress_desc',
    icon: '🎯',
    horizon: 'monthly',
    xpReward: 80,
    target: { type: 'goal_progress', progressPercent: 50 },
    assignWhen: { type: 'has_active_goal' },
  },
];

function daysSince(isoDate: string, today: string): number {
  const a = new Date(isoDate).getTime();
  const b = new Date(today).getTime();
  return Math.floor((b - a) / 86_400_000);
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function evaluateAssignCondition(
  cond: ChallengeAssignCondition,
  ctx: FinancialContext,
): boolean {
  switch (cond.type) {
    case 'always': return true;
    case 'has_active_goal': return ctx.hasActiveGoal;
    case 'has_active_budget': return ctx.hasActiveBudget;
    case 'has_active_debt': return ctx.hasActiveDebt;
    case 'exceeded_category_last_month': return ctx.exceededCategories.includes(cond.category);
    case 'savings_rate_below': return ctx.currentSavingsRate < cond.rate;
    default: return false;
  }
}

export function generateChallenges(
  profile: GamificationProfile,
  financialContext: FinancialContext,
  today: string,
): ChallengeTemplate[] {
  const eligible = CHALLENGE_TEMPLATES.filter(t => {
    const existing = profile.challengeProgress[t.id];
    if (existing && !existing.completed) return false;
    if (existing?.completedAt && daysSince(existing.completedAt, today) < 7) return false;
    return evaluateAssignCondition(t.assignWhen ?? { type: 'always' }, financialContext);
  });

  return [
    ...pickN(eligible.filter(t => t.horizon === 'daily'), 1),
    ...pickN(eligible.filter(t => t.horizon === 'weekly'), 2),
    ...pickN(eligible.filter(t => t.horizon === 'monthly'), 1),
  ];
}
