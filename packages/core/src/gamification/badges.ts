import type { BadgeDefinition, BadgeCondition, GamificationProfile, EarnedBadge, LifetimeStats } from './schema';
import type { GamificationEvent } from './events';
import { LEVELS } from './levels';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // --- First Steps ---
  {
    id: 'first_dollar',
    nameKey: 'gamification_badge_first_dollar_name',
    descriptionKey: 'gamification_badge_first_dollar_desc',
    icon: '🌱',
    family: 'first_steps',
    xp: 25,
    condition: { type: 'event_occurred', eventType: 'transaction_created' },
  },
  {
    id: 'multi_wallet',
    nameKey: 'gamification_badge_multi_wallet_name',
    descriptionKey: 'gamification_badge_multi_wallet_desc',
    icon: '🏦',
    family: 'first_steps',
    xp: 30,
    condition: { type: 'wallet_currency', currency: 'three_or_more' },
  },
  {
    id: 'digital_fortress',
    nameKey: 'gamification_badge_digital_fortress_name',
    descriptionKey: 'gamification_badge_digital_fortress_desc',
    icon: '🔐',
    family: 'first_steps',
    xp: 50,
    condition: {
      type: 'composite',
      all: [
        { type: 'event_occurred', eventType: 'drive_sync_enabled' },
        { type: 'event_occurred', eventType: 'pwa_installed' },
      ],
    },
  },
  {
    id: 'native_soul',
    nameKey: 'gamification_badge_native_soul_name',
    descriptionKey: 'gamification_badge_native_soul_desc',
    icon: '📲',
    family: 'first_steps',
    xp: 25,
    condition: { type: 'event_occurred', eventType: 'pwa_installed' },
  },
  // --- Planner ---
  {
    id: 'goal_crusher',
    nameKey: 'gamification_badge_goal_crusher_name',
    descriptionKey: 'gamification_badge_goal_crusher_desc',
    icon: '🏆',
    family: 'planner',
    xp: 100,
    condition: { type: 'stat_gte', stat: 'totalGoalsCompleted', value: 1 },
  },
  {
    id: 'triple_crown',
    nameKey: 'gamification_badge_triple_crown_name',
    descriptionKey: 'gamification_badge_triple_crown_desc',
    icon: '🏅',
    family: 'planner',
    xp: 200,
    condition: { type: 'stat_gte', stat: 'totalGoalsCompleted', value: 3 },
  },
  {
    id: 'envelope_master',
    nameKey: 'gamification_badge_envelope_master_name',
    descriptionKey: 'gamification_badge_envelope_master_desc',
    icon: '📦',
    family: 'planner',
    xp: 60,
    condition: { type: 'stat_gte', stat: 'totalBudgetMonthsInGreen', value: 1 },
  },
  {
    id: 'visionary',
    nameKey: 'gamification_badge_visionary_name',
    descriptionKey: 'gamification_badge_visionary_desc',
    icon: '🔮',
    family: 'planner',
    xp: 75,
    condition: { type: 'event_occurred', eventType: 'scenario_created' },
  },
  {
    id: 'debt_slayer',
    nameKey: 'gamification_badge_debt_slayer_name',
    descriptionKey: 'gamification_badge_debt_slayer_desc',
    icon: '⚔️',
    family: 'planner',
    xp: 80,
    condition: { type: 'stat_gte', stat: 'totalDebtsSettled', value: 1 },
  },
  // --- Consistency ---
  {
    id: 'on_fire',
    nameKey: 'gamification_badge_on_fire_name',
    descriptionKey: 'gamification_badge_on_fire_desc',
    icon: '🔥',
    family: 'consistency',
    xp: 50,
    condition: { type: 'streak_days', days: 7 },
  },
  {
    id: 'diamond',
    nameKey: 'gamification_badge_diamond_name',
    descriptionKey: 'gamification_badge_diamond_desc',
    icon: '💎',
    family: 'consistency',
    xp: 300,
    condition: { type: 'streak_days', days: 90 },
  },
  {
    id: 'perfect_month',
    nameKey: 'gamification_badge_perfect_month_name',
    descriptionKey: 'gamification_badge_perfect_month_desc',
    icon: '📅',
    family: 'consistency',
    xp: 100,
    condition: { type: 'stat_gte', stat: 'totalBudgetMonthsInGreen', value: 1 },
  },
  {
    id: 'inflation_fighter',
    nameKey: 'gamification_badge_inflation_fighter_name',
    descriptionKey: 'gamification_badge_inflation_fighter_desc',
    icon: '📈',
    family: 'consistency',
    xp: 150,
    condition: { type: 'savings_rate', rate: 0.2, months: 3 },
  },
  // --- Multi-currency ---
  {
    id: 'rate_watcher',
    nameKey: 'gamification_badge_rate_watcher_name',
    descriptionKey: 'gamification_badge_rate_watcher_desc',
    icon: '💱',
    family: 'multicurrency',
    xp: 30,
    condition: { type: 'event_occurred', eventType: 'rate_watch_7_days' },
  },
  {
    id: 'polyglot_wallet',
    nameKey: 'gamification_badge_polyglot_wallet_name',
    descriptionKey: 'gamification_badge_polyglot_wallet_desc',
    icon: '🌐',
    family: 'multicurrency',
    xp: 60,
    condition: { type: 'wallet_currency', currency: 'three_or_more' },
  },
  {
    id: 'usdt_trader',
    nameKey: 'gamification_badge_usdt_trader_name',
    descriptionKey: 'gamification_badge_usdt_trader_desc',
    icon: '⚡',
    family: 'multicurrency',
    xp: 50,
    condition: { type: 'wallet_currency', currency: 'USDT' },
  },
  {
    id: 'euro_pocket',
    nameKey: 'gamification_badge_euro_pocket_name',
    descriptionKey: 'gamification_badge_euro_pocket_desc',
    icon: '🇪🇺',
    family: 'multicurrency',
    xp: 50,
    condition: { type: 'wallet_currency', currency: 'EUR' },
  },
  // --- Builder ---
  {
    id: 'script_author',
    nameKey: 'gamification_badge_script_author_name',
    descriptionKey: 'gamification_badge_script_author_desc',
    icon: '✍️',
    family: 'builder',
    xp: 200,
    condition: { type: 'event_occurred', eventType: 'tutorial_completed' },
  },
  {
    id: 'automator',
    nameKey: 'gamification_badge_automator_name',
    descriptionKey: 'gamification_badge_automator_desc',
    icon: '🤖',
    family: 'builder',
    xp: 80,
    condition: { type: 'stat_gte', stat: 'totalTransactionsLogged', value: 100 },
  },
];

export function evaluateBadges(
  profile: GamificationProfile,
  event: GamificationEvent,
  alreadyEarned: EarnedBadge[],
): BadgeDefinition[] {
  const earnedIds = new Set(alreadyEarned.map(b => b.badgeId));
  return BADGE_DEFINITIONS.filter(badge => {
    if (earnedIds.has(badge.id)) return false;
    return evaluateCondition(badge.condition, profile, event);
  });
}

function evaluateCondition(
  condition: BadgeCondition,
  profile: GamificationProfile,
  event: GamificationEvent,
): boolean {
  switch (condition.type) {
    case 'stat_gte':
      return profile.stats[condition.stat] >= condition.value;
    case 'level_reached':
      return LEVELS.findIndex(l => l.id === profile.level)
           >= LEVELS.findIndex(l => l.id === condition.level);
    case 'streak_days':
      return profile.streak.currentDays >= condition.days;
    case 'event_occurred':
      return event.type === condition.eventType;
    case 'badges_earned':
      return profile.badges.length >= condition.count;
    case 'wallet_currency':
      return !!(
        event.payload?.currency === condition.currency ||
        (condition.currency === 'three_or_more' && (event.payload?.walletCount as number) >= 3)
      );
    case 'month_in_green':
      return profile.stats.totalBudgetMonthsInGreen >= condition.months;
    case 'savings_rate':
      return (
        Number(event.payload?.savingsRateMonths ?? 0) >= condition.months &&
        Number(event.payload?.savingsRate ?? 0) >= condition.rate
      );
    case 'composite':
      return condition.all.every(c => evaluateCondition(c, profile, event));
    default:
      return false;
  }
}
