import React from "react";
import { X, Activity, PieChart, BarChart, TrendingUp, Trophy } from "lucide-react";
import { Language, UserProfile } from "../types";
import { getTranslation } from "../i18n";

interface DashboardCustomizerProps {
  lang: Language;
  showBalanceChart: boolean;
  showExpenseStructure: boolean;
  showIncomeVsExpense: boolean;
  showDailySpending: boolean;
  showCategoryBreakdown: boolean;
  showForecastCard: boolean;
  showFiscalSummary: boolean;
  showGoals: boolean;
  toggleWidget: (widget: "balance" | "expense" | "incomeVs" | "category" | "daily" | "forecast" | "fiscalSummary" | "goals") => void;
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
  showForecastCard,
  showFiscalSummary,
  showGoals,
  toggleWidget,
  onClose,
  userProfile,
  onUpdateProfile,
  isDevMode
}) => {
  const t = (key: any) => getTranslation(lang, key);

  const WidgetToggle = ({ icon: Icon, label, isActive, onToggle, rotateIcon = false }: any) => (
    <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm hover:border-theme-brand/30 transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={18} className={`text-theme-brand ${rotateIcon ? 'rotate-90' : ''}`} />
        <span className="text-sm font-bold text-theme-primary">
          {label}
        </span>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${isActive ? "bg-theme-brand" : "bg-white/10"}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? "left-7" : "left-1"}`}
        />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm sm:max-w-5xl bg-theme-surface border border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-black text-theme-primary tracking-tight">
              {t("customizeDashboard")}
            </h3>
            <p className="text-xs text-theme-secondary opacity-50 font-bold mt-1 uppercase tracking-widest">{t('layoutControl')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-theme-bg rounded-2xl text-theme-secondary hover:text-white transition-colors border border-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-10">
          <section>
            <h4 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.3em] mb-4 opacity-50 px-2">{t('widgets')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <WidgetToggle icon={Activity} label={t("showBalanceChart")} isActive={showBalanceChart} onToggle={() => toggleWidget("balance")} />
              <WidgetToggle icon={PieChart} label={t("showExpenseStructure")} isActive={showExpenseStructure} onToggle={() => toggleWidget("expense")} />
              <WidgetToggle icon={BarChart} label={t("incomeVsExpenses")} isActive={showIncomeVsExpense} onToggle={() => toggleWidget("incomeVs")} />
              <WidgetToggle icon={TrendingUp} label={t("dailySpending")} isActive={showDailySpending} onToggle={() => toggleWidget("daily")} />
              <WidgetToggle icon={BarChart} label={t("categoryBreakdown")} isActive={showCategoryBreakdown} onToggle={() => toggleWidget("category")} rotateIcon={true} />
              <WidgetToggle icon={TrendingUp} label={t("showForecastCard") || "Show Forecast"} isActive={showForecastCard} onToggle={() => toggleWidget("forecast")} />
              <WidgetToggle icon={Activity} label={t("showFiscalSummary") || "Show Fiscal Summary"} isActive={showFiscalSummary} onToggle={() => toggleWidget("fiscalSummary")} rotateIcon={true} />
              <WidgetToggle icon={Trophy} label={t("goals")} isActive={showGoals} onToggle={() => toggleWidget("goals")} />
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.3em] mb-4 opacity-50 px-2">{t('privacy')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
                <span className="text-sm font-bold text-theme-primary">{t('hideWelcome')}</span>
                <button 
                    onClick={() => onUpdateProfile({...userProfile, hideWelcome: !userProfile.hideWelcome})}
                    className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${userProfile.hideWelcome ? "bg-theme-brand" : "bg-white/10"}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.hideWelcome ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {isDevMode && (
                <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
                  <span className="text-sm font-bold text-theme-primary">{t('hideDevMode')}</span>
                  <button 
                      onClick={() => onUpdateProfile({...userProfile, hideDevMode: !userProfile.hideDevMode})}
                      className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${userProfile.hideDevMode ? "bg-theme-brand" : "bg-white/10"}`}
                  >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.hideDevMode ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-theme-soft shadow-sm">
                <span className="text-sm font-bold text-theme-primary">{t('hideName')}</span>
                <button 
                    onClick={() => onUpdateProfile({...userProfile, hideName: !userProfile.hideName})}
                    className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${userProfile.hideName ? "bg-theme-brand" : "bg-white/10"}`}
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
          </section>
        </div>

        <div className="mt-12 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-theme-primary text-theme-bg font-black py-4 rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
          >
            {t("done")}
          </button>
        </div>
      </div>
    </div>
  );
};
