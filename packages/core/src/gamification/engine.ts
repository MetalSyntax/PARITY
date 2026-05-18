import type { GamificationProfile, GamificationResult, XPAuditEntry, XPLogEntry, LifetimeStats } from './schema';
import type { GamificationEvent, GamificationEventType } from './events';
import { XP_VALUES, DAILY_XP_CAPS } from './events';
import { evaluateBadges } from './badges';
import { getLevelForXP } from './levels';

export function processEvent(
  profile: GamificationProfile,
  event: GamificationEvent,
  auditLog: XPAuditEntry[],
  today: string,
): GamificationResult {
  if (isDuplicate(event, auditLog)) {
    return noChange(profile);
  }

  const dayStart = startOfDay(today);
  const xpTodayForType = auditLog
    .filter(e => e.eventType === event.type && e.timestamp > dayStart)
    .reduce((sum, e) => sum + e.xpGranted, 0);

  const cap = DAILY_XP_CAPS[event.type] ?? Infinity;
  const baseXP = XP_VALUES[event.type] ?? 0;
  const xpGained = Math.max(0, Math.min(baseXP, cap - xpTodayForType));

  const { streak, streakBroken, streakMilestone } = processStreak(profile.streak, today, event);

  const streakBonus = xpGained > 0 ? calculateStreakBonus(streak.currentDays) : 0;
  const totalXP = xpGained + streakBonus;

  const newXP = profile.xp + totalXP;
  const previousLevel = profile.level;
  const newLevel = getLevelForXP(newXP);

  const stats = updateStats(profile.stats, event);

  const updatedProfile: GamificationProfile = {
    ...profile,
    xp: newXP,
    level: newLevel,
    streak,
    stats,
    updatedAt: new Date().toISOString(),
  };

  const newBadges = evaluateBadges(updatedProfile, event, profile.badges);
  const xpFromBadges = newBadges.reduce((sum, b) => sum + b.xp, 0);

  const finalXP = newXP + xpFromBadges;
  const finalLevel = getLevelForXP(finalXP);

  const finalProfile: GamificationProfile = {
    ...updatedProfile,
    xp: finalXP,
    level: finalLevel,
    badges: [
      ...profile.badges,
      ...newBadges.map(b => ({
        badgeId: b.id,
        earnedAt: new Date().toISOString(),
        xpGranted: b.xp,
      })),
    ],
    xpLog: appendXPLog(profile.xpLog, today, totalXP + xpFromBadges, event.type),
  };

  const leveledUp = finalProfile.level !== previousLevel;

  return {
    updatedProfile: finalProfile,
    xpGained: totalXP + xpFromBadges,
    newBadges,
    leveledUp,
    previousLevel: leveledUp ? previousLevel : null,
    newLevel: leveledUp ? finalProfile.level : null,
    streakBroken,
    streakMilestone,
  };
}

function isDuplicate(event: GamificationEvent, auditLog: XPAuditEntry[]): boolean {
  if (!event.entityId) return false;
  const cutoff = Date.now() - 60_000;
  return auditLog.some(
    e => e.entityId === event.entityId &&
         e.eventType === event.type &&
         e.timestamp > cutoff,
  );
}

function calculateStreakBonus(currentDays: number): number {
  if (currentDays >= 90) return 100;
  if (currentDays >= 30) return 40;
  if (currentDays >= 7)  return 15;
  if (currentDays >= 3)  return 5;
  return 0;
}

function processStreak(
  streak: GamificationProfile['streak'],
  today: string,
  event: GamificationEvent,
): { streak: GamificationProfile['streak']; streakBroken: boolean; streakMilestone: number | null } {
  const STREAK_EVENTS: GamificationEventType[] = [
    'transaction_created',
    'transaction_with_receipt',
    'transaction_ocr_used',
    'transfer_completed',
  ];

  if (!STREAK_EVENTS.includes(event.type)) {
    return { streak, streakBroken: false, streakMilestone: null };
  }

  const last = streak.lastActivityDate;

  if (last === today) {
    return { streak, streakBroken: false, streakMilestone: null };
  }

  const yesterday = offsetDate(today, -1);
  const isFrozen = streak.frozenUntil !== null && streak.frozenUntil >= today;
  const streakBroken = last !== null && last !== yesterday && !isFrozen;

  if (streakBroken) {
    return {
      streak: { currentDays: 1, longestDays: streak.longestDays, lastActivityDate: today, frozenUntil: null },
      streakBroken: true,
      streakMilestone: null,
    };
  }

  const newDays = last === yesterday ? streak.currentDays + 1 : 1;
  const MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];
  const streakMilestone = MILESTONES.includes(newDays) ? newDays : null;

  return {
    streak: {
      currentDays: newDays,
      longestDays: Math.max(streak.longestDays, newDays),
      lastActivityDate: today,
      frozenUntil: null,
    },
    streakBroken: false,
    streakMilestone,
  };
}

function updateStats(stats: LifetimeStats, event: GamificationEvent): LifetimeStats {
  const updated = { ...stats };
  switch (event.type) {
    case 'transaction_created':
    case 'transaction_with_receipt':
    case 'transaction_ocr_used':
      updated.totalTransactionsLogged += 1;
      break;
    case 'goal_completed':
      updated.totalGoalsCompleted += 1;
      break;
    case 'debt_settled':
      updated.totalDebtsSettled += 1;
      break;
    case 'month_all_budgets_green':
      updated.totalBudgetMonthsInGreen += 1;
      break;
    case 'first_export':
      updated.totalExportsGenerated += 1;
      break;
  }
  return updated;
}

function appendXPLog(
  log: XPLogEntry[],
  today: string,
  xp: number,
  source: GamificationEventType,
): XPLogEntry[] {
  const cutoff = nDaysAgo(today, 90);
  const recent = log.filter(e => e.date >= cutoff);
  const todayEntry = recent.find(e => e.date === today);
  if (todayEntry) {
    return recent.map(e => e.date === today ? { ...e, xp: e.xp + xp } : e);
  }
  return [...recent, { date: today, xp, source }];
}

function noChange(profile: GamificationProfile): GamificationResult {
  return {
    updatedProfile: profile,
    xpGained: 0,
    newBadges: [],
    leveledUp: false,
    previousLevel: null,
    newLevel: null,
    streakBroken: false,
    streakMilestone: null,
  };
}

export function offsetDate(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfDay(isoDate: string): number {
  return new Date(isoDate + 'T00:00:00.000Z').getTime();
}

function nDaysAgo(isoDate: string, n: number): string {
  return offsetDate(isoDate, -n);
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
