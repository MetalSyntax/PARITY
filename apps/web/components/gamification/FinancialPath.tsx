import React from 'react';
import { getLevelProgress, LEVELS, LevelId } from '@parity/core';
import type { GamificationProfile } from '@parity/core';
import { 
  Sprout, 
  Footprints, 
  BarChart2, 
  Calendar, 
  Landmark, 
  Flame, 
  Layers, 
  Hammer, 
  Trophy, 
  Bot, 
  Sparkles, 
  UserCheck 
} from 'lucide-react';

interface FinancialPathProps {
  profile: GamificationProfile;
  t: (key: string) => string;
}

const IconMap: Record<string, React.ComponentType<any>> = {
  Sprout,
  Footprints,
  BarChart2,
  Calendar,
  Landmark,
  Flame,
  Layers,
  Hammer,
  Trophy,
};

export const FinancialPath: React.FC<FinancialPathProps> = ({ profile, t }) => {
  // Define 9 nodes: alternating Levels and Badge Families using translation keys
  const nodes = [
    { type: 'level', id: 'novice', labelKey: 'gamification_level_novice', xp: 0, icon: 'Sprout' },
    { type: 'family', id: 'first_steps', labelKey: 'gamification_family_first_steps', xp: 200, icon: 'Footprints' },
    { type: 'level', id: 'analyst', labelKey: 'gamification_level_analyst', xp: 500, icon: 'BarChart2' },
    { type: 'family', id: 'planner', labelKey: 'gamification_family_planner', xp: 1200, icon: 'Calendar' },
    { type: 'level', id: 'strategist', labelKey: 'gamification_level_strategist', xp: 2000, icon: 'Landmark' },
    { type: 'family', id: 'consistency', labelKey: 'gamification_family_consistency', xp: 3500, icon: 'Flame' },
    { type: 'level', id: 'architect', labelKey: 'gamification_level_architect', xp: 5000, icon: 'Layers' },
    { type: 'family', id: 'builder', labelKey: 'gamification_family_builder', xp: 7500, icon: 'Hammer' },
    { type: 'level', id: 'cfo', labelKey: 'gamification_level_cfo', xp: 10000, icon: 'Trophy' },
  ];

  // Helper to determine if node is active (where Cheque currently is)
  const getCurrentNodeIndex = () => {
    let activeIdx = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (profile.xp >= nodes[i].xp) {
        activeIdx = i;
      }
    }
    return activeIdx;
  };

  const currentNodeIdx = getCurrentNodeIndex();

  // Mascot "Cheque" helper icon component (vector icons, no emojis, no owl)
  const getChequeIcon = () => {
    if (profile.mascotOutfit === 'mascot_outfit_sombrero') {
      return <Sparkles size={24} className="text-yellow-400" />;
    }
    if (profile.mascotOutfit === 'mascot_outfit_liqui_liqui') {
      return <UserCheck size={24} className="text-emerald-400" />;
    }
    return <Bot size={24} className="text-white" />; // Clean financial assistant bot, no owl
  };

  return (
    <div className="relative flex flex-col items-center py-10 w-full select-none">
      {/* Path Line */}
      <div className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-theme-brand/20 via-theme-brand to-theme-brand/20 rounded-full" />

      {/* Nodes */}
      <div className="flex flex-col gap-12 w-full relative z-10">
        {nodes.map((node, index) => {
          const isUnlocked = profile.xp >= node.xp;
          const isCurrent = index === currentNodeIdx;
          const offsetClass = index % 2 === 0 
            ? 'translate-x-[-30px] md:translate-x-[-50px]' 
            : 'translate-x-[30px] md:translate-x-[50px]';

          const NodeIcon = IconMap[node.icon] || Bot;

          return (
            <div 
              key={node.id} 
              className={`flex items-center justify-center w-full transition-all duration-300 ${offsetClass}`}
            >
              <div className="relative group flex flex-col items-center">
                {/* Current Mascot Indicator (Cheque) */}
                {isCurrent && (
                  <div className="absolute top-[-44px] animate-bounce z-20 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-theme-brand border-2 border-white flex items-center justify-center shadow-lg">
                      {getChequeIcon()}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider bg-theme-brand text-white px-1.5 py-0.5 rounded-full shadow-md mt-0.5">
                      Cheque
                    </span>
                  </div>
                )}

                {/* Node Button */}
                <button
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-xl transition-all ${
                    isCurrent 
                      ? 'bg-theme-brand border-white scale-110 shadow-theme-brand/35 ring-4 ring-theme-brand/20 text-white' 
                      : isUnlocked 
                        ? 'bg-theme-surface border-theme-brand text-theme-brand hover:scale-105' 
                        : 'bg-theme-card border-theme/40 text-theme-secondary opacity-60'
                  }`}
                  title={`${t(node.labelKey)} (${node.xp} XP)`}
                >
                  <NodeIcon size={26} />
                </button>

                {/* Tooltip / Info */}
                <div className="absolute top-18 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-theme-surface border border-theme text-theme-primary text-xs px-3 py-1.5 rounded-xl shadow-2xl text-center min-w-[120px] z-30">
                  <p className="font-extrabold uppercase tracking-wider">{t(node.labelKey)}</p>
                  <p className="text-[10px] text-theme-secondary">{node.xp} XP</p>
                  {!isUnlocked && <p className="text-[9px] text-rose-400 font-bold uppercase mt-1">{t('gamification_badge_locked')}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
