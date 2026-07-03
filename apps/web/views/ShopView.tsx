import React from 'react';
import { ArrowLeft, Coins, Check, Snowflake, Sparkles, UserCheck, Palette, Gift } from 'lucide-react';
import { SHOP_CATALOG, ShopItem, GamificationProfile } from '@parity/core';
import { Button } from '@parity/ui';

interface ShopViewProps {
  profile: GamificationProfile;
  onBack: () => void;
  onBuyItem: (itemId: string) => Promise<boolean>;
  onEquipOutfit: (itemId: string | null) => Promise<void>;
  t: (key: string) => string;
}

export const ShopView: React.FC<ShopViewProps> = ({ profile, onBack, onBuyItem, onEquipOutfit, t }) => {
  const getMascotNameKey = (id: string) => {
    if (id === 'streak_freeze_token') return 'gamification_shop_item_freeze_name';
    if (id === 'mascot_outfit_sombrero') return 'gamification_shop_item_sombrero_name';
    if (id === 'mascot_outfit_liqui_liqui') return 'gamification_shop_item_liqui_liqui_name';
    if (id === 'theme_midnight_ocean_unlock_early') return 'gamification_shop_item_theme_ocean_name';
    if (id === 'widget_flair_confetti_gold') return 'gamification_shop_item_confetti_name';
    return id;
  };

  const getMascotDescKey = (id: string) => {
    if (id === 'streak_freeze_token') return 'gamification_shop_item_freeze_desc';
    if (id === 'mascot_outfit_sombrero') return 'gamification_shop_item_sombrero_desc';
    if (id === 'mascot_outfit_liqui_liqui') return 'gamification_shop_item_liqui_liqui_desc';
    if (id === 'theme_midnight_ocean_unlock_early') return 'gamification_shop_item_theme_ocean_desc';
    if (id === 'widget_flair_confetti_gold') return 'gamification_shop_item_confetti_desc';
    return '';
  };

  const getMascotIcon = (id: string) => {
    if (id === 'streak_freeze_token') return <Snowflake size={24} className="text-sky-400" />;
    if (id === 'mascot_outfit_sombrero') return <Sparkles size={24} className="text-yellow-400" />;
    if (id === 'mascot_outfit_liqui_liqui') return <UserCheck size={24} className="text-emerald-400" />;
    if (id === 'theme_midnight_ocean_unlock_early') return <Palette size={24} className="text-purple-400" />;
    if (id === 'widget_flair_confetti_gold') return <Sparkles size={24} className="text-amber-500" />;
    return <Gift size={24} className="text-theme-secondary" />;
  };

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
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
          <Coins size={16} className="fill-yellow-500" />
          <span className="text-sm font-black">{profile.coins.balance} {t('gamification_shop_coins')}</span>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h2 className="text-lg font-black text-theme-primary">{t('gamification_shop_mascot_title')}</h2>
          <p className="text-xs text-theme-secondary">{t('gamification_recap_shop_desc')}</p>
        </div>

        <div className="grid gap-3">
          {SHOP_CATALOG.map((item) => {
            const isOwned = profile.ownedShopItems.includes(item.id);
            const isEquipped = profile.mascotOutfit === item.id;
            const canAfford = profile.coins.balance >= item.cost;

            return (
              <div
                key={item.id}
                className="bg-theme-surface border border-theme rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-theme-card border border-theme flex items-center justify-center">
                    {getMascotIcon(item.id)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-theme-primary">{t(getMascotNameKey(item.id))}</h3>
                    <p className="text-[11px] text-theme-secondary opacity-80">{t(getMascotDescKey(item.id))}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {item.category === 'mascot_outfit' && isOwned ? (
                    <Button
                      size="sm"
                      variant={isEquipped ? 'primary' : 'secondary'}
                      className="px-4 py-1.5 h-8 rounded-xl font-bold text-xs uppercase"
                      onClick={() => onEquipOutfit(isEquipped ? null : item.id)}
                    >
                      {isEquipped ? t('gamification_shop_equipped') : t('gamification_shop_equip')}
                    </Button>
                  ) : isOwned && item.category !== 'streak_freeze' ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-xs">
                      <Check size={14} /> {t('gamification_shop_unlocked')}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!canAfford}
                      className="px-4 py-1.5 h-8 rounded-xl font-black text-xs bg-yellow-500 hover:bg-yellow-600 border-none text-black flex items-center gap-1.5"
                      onClick={() => onBuyItem(item.id)}
                    >
                      <Coins size={12} className="fill-black" /> {item.cost}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
