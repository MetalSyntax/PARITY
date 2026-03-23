import React from "react";
import { X, Activity, PieChart, BarChart, TrendingUp } from "lucide-react";
import { Language, UserProfile } from "../types";
import { getTranslation } from "../i18n";

interface DashboardCustomizerProps {
  lang: Language;
  showBalanceChart: boolean;
  showExpenseStructure: boolean;
  showIncomeVsExpense: boolean;
  showDailySpending: boolean;
  showCategoryBreakdown: boolean;
  toggleWidget: (widget: "balance" | "expense" | "incomeVs" | "category" | "daily") => void;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  isDevMode: boolean;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  lang,
  showBalanceChart,
  showExpenseStructure,
  showIncomeVsExpense,
  showDailySpending,
  showCategoryBreakdown,
  toggleWidget,
  onClose,
  userProfile,
  onUpdateProfile,
  isDevMode
}) => {
  const t = (key: any) => getTranslation(lang, key);

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-black text-theme-primary tracking-tight">
            {t("customizeDashboard")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-theme-bg rounded-xl text-theme-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] mb-4 opacity-50 px-2">{t('widgets')}</h4>
          <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-theme-brand" />
              <span className="text-sm font-bold text-theme-primary">
                {t("showBalanceChart")}
              </span>
            </div>
            <button
              onClick={() => toggleWidget("balance")}
              className={`w-12 h-6 rounded-full transition-all relative ${showBalanceChart ? "bg-theme-brand" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showBalanceChart ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
            <div className="flex items-center gap-3">
              <PieChart size={18} className="text-theme-brand" />
              <span className="text-sm font-bold text-theme-primary">
                {t("showExpenseStructure")}
              </span>
            </div>
            <button
              onClick={() => toggleWidget("expense")}
              className={`w-12 h-6 rounded-full transition-all relative ${showExpenseStructure ? "bg-theme-brand" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showExpenseStructure ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
            <div className="flex items-center gap-3">
              <BarChart size={18} className="text-theme-brand" />
              <span className="text-sm font-bold text-theme-primary">
                {t("incomeVsExpenses")}
              </span>
            </div>
            <button
              onClick={() => toggleWidget("incomeVs")}
              className={`w-12 h-6 rounded-full transition-all relative ${showIncomeVsExpense ? "bg-theme-brand" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showIncomeVsExpense ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-theme-brand" />
              <span className="text-sm font-bold text-theme-primary">
                {t("dailySpending")}
              </span>
            </div>
            <button
              onClick={() => toggleWidget("daily")}
              className={`w-12 h-6 rounded-full transition-all relative ${showDailySpending ? "bg-theme-brand" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showDailySpending ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
            <div className="flex items-center gap-3">
              <BarChart size={18} className="text-theme-brand rotate-90" />
              <span className="text-sm font-bold text-theme-primary">
                {t("categoryBreakdown")}
              </span>
            </div>
            <button
              onClick={() => toggleWidget("category")}
              className={`w-12 h-6 rounded-full transition-all relative ${showCategoryBreakdown ? "bg-theme-brand" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showCategoryBreakdown ? "left-7" : "left-1"}`}
              />
            </button>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
            <h4 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] mb-4 opacity-50 px-2">{t('privacy')}</h4>
            
            <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
              <span className="text-sm font-bold text-theme-primary">{t('hideWelcome')}</span>
              <button 
                  onClick={() => onUpdateProfile({...userProfile, hideWelcome: !userProfile.hideWelcome})}
                  className={`w-12 h-6 rounded-full transition-all relative ${userProfile.hideWelcome ? "bg-theme-brand" : "bg-white/10"}`}
              >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.hideWelcome ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {isDevMode && (
              <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
                <span className="text-sm font-bold text-theme-primary">{t('hideDevMode')}</span>
                <button 
                    onClick={() => onUpdateProfile({...userProfile, hideDevMode: !userProfile.hideDevMode})}
                    className={`w-12 h-6 rounded-full transition-all relative ${userProfile.hideDevMode ? "bg-theme-brand" : "bg-white/10"}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.hideDevMode ? "left-7" : "left-1"}`} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
              <span className="text-sm font-bold text-theme-primary">{t('hideName')}</span>
              <button 
                  onClick={() => onUpdateProfile({...userProfile, hideName: !userProfile.hideName})}
                  className={`w-12 h-6 rounded-full transition-all relative ${userProfile.hideName ? "bg-theme-brand" : "bg-white/10"}`}
              >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.hideName ? "left-7" : "left-1"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
                <span className="text-sm font-bold text-theme-primary">{t('dashboardTxLimit')}</span>
                <input 
                    type="number" 
                    value={userProfile.dashboardTxLimit} 
                    onChange={(e) => onUpdateProfile({...userProfile, dashboardTxLimit: parseInt(e.target.value) || 0})}
                    className="w-16 bg-theme-bg border border-theme-soft rounded-lg px-2 py-1 text-sm font-black text-theme-brand outline-none text-center"
                    min="1"
                    max="50"
                />
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-theme-brand text-white font-black py-4 rounded-2xl mt-8 shadow-xl hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {t("done")}
        </button>
      </div>
    </div>
  );
};
