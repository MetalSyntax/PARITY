import React from 'react';
import { Flame } from 'lucide-react';

interface StreakCalendarProps {
  currentDays: number;
  longestDays: number;
  lastActivityDate: string | null;
  t: (key: string) => string;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  currentDays,
  longestDays,
  lastActivityDate,
  t,
}) => {
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1);
    const isActive = lastActivityDate !== null && iso <= lastActivityDate &&
      iso >= new Date(new Date(lastActivityDate).getTime() - (currentDays - 1) * 86_400_000).toISOString().slice(0, 10);
    const isToday = iso === today.toISOString().slice(0, 10);
    return { iso, dayLabel, isActive, isToday };
  });

  return (
    <div className="bg-theme-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-400" />
          <span className="font-semibold text-theme-primary text-sm">
            {currentDays} {t('gamification_streak_days')}
          </span>
        </div>
        <span className="text-xs text-theme-secondary">
          {t('gamification_streak_longest')}: {longestDays}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ iso, dayLabel, isActive, isToday }) => (
          <div key={iso} className="flex flex-col items-center gap-1">
            <span className="text-xs text-theme-secondary">{dayLabel}</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-orange-500/80 text-white'
                  : isToday
                  ? 'border border-theme bg-theme-surface text-theme-secondary'
                  : 'bg-theme-surface text-theme-secondary/40'
              }`}
            >
              {isActive ? '🔥' : '·'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
