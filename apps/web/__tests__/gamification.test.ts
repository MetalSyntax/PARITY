import { 
  createDefaultProfile, 
  processEvent, 
  evaluateBadges, 
  CHALLENGE_TEMPLATES, 
  BADGE_DEFINITIONS,
  GamificationProfile
} from '@parity/core';
import type { GamificationEvent } from '@parity/core';

describe('Gamification Engine — Automated Badges & Challenges Tests', () => {
  let profile: GamificationProfile;
  const today = '2026-07-02';

  beforeEach(() => {
    profile = createDefaultProfile();
  });

  describe('Badge Attainment Conditions', () => {
    it('should award first_dollar badge on transaction_created event', () => {
      const event: GamificationEvent = {
        type: 'transaction_created',
        timestamp: new Date().toISOString(),
      };
      const earned = evaluateBadges(profile, event, []);
      const badge = earned.find(b => b.id === 'first_dollar');
      expect(badge).toBeDefined();
      expect(badge?.xp).toBe(25);
    });

    it('should award multi_wallet badge when wallet currency count is three_or_more', () => {
      const event: GamificationEvent = {
        type: 'transaction_created',
        timestamp: new Date().toISOString(),
        payload: { walletCount: 3, currency: 'three_or_more' }
      };
      const earned = evaluateBadges(profile, event, []);
      const badge = earned.find(b => b.id === 'multi_wallet');
      expect(badge).toBeDefined();
    });

    it('should award digital_fortress badge when composite drive sync and PWA installs are met', () => {
      const event1: GamificationEvent = {
        type: 'pwa_installed',
        timestamp: new Date().toISOString(),
      };
      const result = processEvent(profile, event1, [], today);
      
      const event2: GamificationEvent = {
        type: 'drive_sync_enabled',
        timestamp: new Date().toISOString(),
      };
      const result2 = processEvent(result.updatedProfile, event2, [], today);
      const earned = result2.newBadges.find(b => b.id === 'digital_fortress');
      expect(earned).toBeDefined();
    });

    it('should award goal_crusher badge when completed goals is at least 1', () => {
      profile.stats.totalGoalsCompleted = 1;
      const event: GamificationEvent = {
        type: 'transaction_created',
        timestamp: new Date().toISOString(),
      };
      const earned = evaluateBadges(profile, event, []);
      expect(earned.find(b => b.id === 'goal_crusher')).toBeDefined();
    });

    it('should award debt_slayer badge when debt payments completed is at least 1', () => {
      profile.stats.totalDebtsSettled = 1;
      const event: GamificationEvent = {
        type: 'transaction_created',
        timestamp: new Date().toISOString(),
      };
      const earned = evaluateBadges(profile, event, []);
      expect(earned.find(b => b.id === 'debt_slayer')).toBeDefined();
    });

    it('should award on_fire badge when streak is at least 7 days', () => {
      profile.streak.currentDays = 7;
      const event: GamificationEvent = {
        type: 'transaction_created',
        timestamp: new Date().toISOString(),
      };
      const earned = evaluateBadges(profile, event, []);
      expect(earned.find(b => b.id === 'on_fire')).toBeDefined();
    });

    it('should award rate_watcher badge on rate_watch_7_days event', () => {
      const event: GamificationEvent = {
        type: 'rate_watch_7_days',
        timestamp: new Date().toISOString(),
      };
      const earned = evaluateBadges(profile, event, []);
      expect(earned.find(b => b.id === 'rate_watcher')).toBeDefined();
    });
  });

  describe('Challenge Progression & Completion Loops', () => {
    it('should progress daily_log_today challenge and complete it on reaching target', () => {
      const template = CHALLENGE_TEMPLATES.find(c => c.id === 'daily_log_today')!;
      profile.challengeProgress['daily_log_today'] = {
        challengeId: 'daily_log_today',
        assignedAt: '2026-07-02T00:00:00.000Z',
        expiresAt: '2026-07-02T23:59:59.999Z',
        current: 0,
        target: 1,
        completed: false,
        completedAt: null,
        xpClaimed: false,
      };

      const event: GamificationEvent = {
        type: 'transaction_created',
        timestamp: new Date().toISOString(),
      };

      const result = processEvent(profile, event, [], today);
      const cp = result.updatedProfile.challengeProgress['daily_log_today'];
      expect(cp.current).toBe(1);
      expect(cp.completed).toBe(true);
      expect(result.xpGained).toBeGreaterThanOrEqual(template.xpReward);
    });

    it('should progress weekly_streak_7 challenge on active days', () => {
      profile.challengeProgress['weekly_streak_7'] = {
        challengeId: 'weekly_streak_7',
        assignedAt: '2026-07-02T00:00:00.000Z',
        expiresAt: '2026-07-09T23:59:59.999Z',
        current: 0,
        target: 7,
        completed: false,
        completedAt: null,
        xpClaimed: false,
      };

      profile.streak.currentDays = 7;

      const event: GamificationEvent = {
        type: 'daily_streak',
        timestamp: new Date().toISOString(),
      };

      const result = processEvent(profile, event, [], today);
      const cp = result.updatedProfile.challengeProgress['weekly_streak_7'];
      expect(cp.current).toBe(7);
      expect(cp.completed).toBe(true);
    });
  });
});
