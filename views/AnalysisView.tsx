import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, PieChart, BarChart, Settings, Activity, TrendingUp, X, ShieldAlert, Zap, AlertCircle, Coins, DollarSign, Shield, GripVertical, CalendarRange, ChartCandlestick, RefreshCw, Euro } from 'lucide-react';
import { motion, Reorder, useDragControls, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../constants';
import { Transaction, TransactionType, Language, ScheduledPayment, Currency } from '../types';
import { getTranslation } from '../i18n';
import { CurrencyAmount } from '../components/CurrencyAmount';
import { formatAmount } from '../utils/formatUtils';

import { IncomeVsExpenseChart, ExpenseStructureChart, MonthlyNetFlowChart, IncomeDistributionChart } from '../components/Charts';


interface AnalysisViewProps {
  onBack: () => void;
  transactions: Transaction[];
  lang: Language;
  scheduledPayments: ScheduledPayment[];
  exchangeRate: number;
  euroRate?: number;
  isBalanceVisible: boolean;
  onToggleBottomNav: (visible: boolean) => void;
  onNavigate: (view: any) => void;
  displayCurrency: Currency;
  onToggleDisplayCurrency: () => void;
  initialViewMode?: 'OVERVIEW' | 'INCOME';
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ 
    onBack, 
    transactions, 
    lang, 
    scheduledPayments, 
    exchangeRate, 
    euroRate,
    isBalanceVisible, 
    onToggleBottomNav, 
    onNavigate,
    displayCurrency,
    onToggleDisplayCurrency,
    initialViewMode = 'OVERVIEW'
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'INCOME'>(initialViewMode);
  const [mainChartType, setMainChartType] = useState<'BAR' | 'LINE'>('BAR');
  const [showDetails, setShowDetails] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

  // Filter transactions by selected month
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  const totalSpent = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
    
  const totalIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);

  const netCashFlow = totalIncome - totalSpent;

  // Sorted categories for the graph
  const sortedCategories = CATEGORIES.map(cat => {
    const total = monthlyTransactions
      .filter(t => t.category === cat.id && t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
    return { ...cat, total };
  }).sort((a,b) => b.total - a.total).filter(c => c.total > 0).slice(0, 4); 

  // Income Data by Category (Platform)
  const incomeCategories = CATEGORIES.map(cat => {
      const total = monthlyTransactions
        .filter(t => t.category === cat.id && t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
      return { ...cat, total };
  }).filter(c => c.total > 0).sort((a,b) => b.total - a.total);


  // Helper to get relative time text
  const getDaysDiff = (dateStr: string) => {
      const todayDate = new Date();
      const targetDate = new Date(dateStr);
      const diffTime = targetDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays;
  };

  const [showAnalysisCustomizer, setShowAnalysisCustomizer] = useState(false);
  const [showIncomeVsExpenseC, setShowIncomeVsExpenseC] = useState(() => {
    const saved = localStorage.getItem("analysis_show_income_vs_expense");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showNetFlowC, setShowNetFlowC] = useState(() => {
    const saved = localStorage.getItem("analysis_show_net_flow");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [touchedWidget, setTouchedWidget] = useState<string | null>(null);
  const [showCatTrendC, setShowCatTrendC] = useState(() => {
    const saved = localStorage.getItem("analysis_show_cat_trend");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showIncomeDistC, setShowIncomeDistC] = useState(() => {
    const saved = localStorage.getItem("analysis_show_income_dist");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [analysisOrder, setAnalysisOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("analysis_widget_order");
    return saved ? JSON.parse(saved) : ["incomeVsExpenses", "extraCharts", "leakDetector", "subscriptions"];
  });

  const analysisControls = analysisOrder.map(() => useDragControls());

  React.useEffect(() => {
    localStorage.setItem("analysis_widget_order", JSON.stringify(analysisOrder));
  }, [analysisOrder]);

  React.useEffect(() => {
      onToggleBottomNav(!showAnalysisCustomizer);
  }, [showAnalysisCustomizer, onToggleBottomNav]);

  // Data helpers for charts
  const monthKeys = React.useMemo(() => Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort().slice(-6), [transactions]);
  
  const displayedSubs = scheduledPayments;

  // Money Leak Detector Logic
  const leaks = React.useMemo(() => {
    const results: { type: 'impulse' | 'overspend' | 'recurrent'; title: string; category: string; amount: number; description: string }[] = [];
    
    // 1. Group by category
    const catTotals: Record<string, { total: number, count: number, name: string }> = {};
    monthlyTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
        const cat = CATEGORIES.find(c => c.id === t.category);
        if (!catTotals[t.category]) catTotals[t.category] = { total: 0, count: 0, name: cat?.name || t.category };
        catTotals[t.category].total += t.normalizedAmountUSD;
        catTotals[t.category].count += 1;
    });

    // Overspending (> 35% of total income)
    Object.entries(catTotals).forEach(([id, data]) => {
        if (totalIncome > 0 && data.total > totalIncome * 0.35) {
            results.push({
                type: 'overspend',
                title: t('overspending'),
                category: data.name,
                amount: data.total,
                description: `${((data.total/totalIncome)*100).toFixed(0)}% ${t('ofIncomeGoesHere')}`
            });
        }
        // Impulse buys: many small transactions
        if (data.count > 6 && data.total / data.count < 15) {
            results.push({
                type: 'impulse',
                title: t('minorLeakage'),
                category: data.name,
                amount: data.total,
                description: `${data.count} ${t('smallExpensesWarning')}`
            });
        }
    });

    return results;
  }, [monthlyTransactions, totalIncome]);



  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto bg-theme-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onBack} 
                className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"
            >
                <ArrowLeft size={20} />
            </motion.button>
            <h1 className="text-xl font-bold text-theme-primary">{t('analysis')}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleDisplayCurrency}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 transition-all font-black text-[10px] ${displayCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
            >
                <div className="w-4 h-4 flex items-center justify-center">
                    {displayCurrency === Currency.VES ? (
                        <span className="text-[9px] font-black leading-none">Bs</span>
                    ) : displayCurrency === Currency.EUR ? (
                        <Euro size={14} />
                    ) : (
                        <DollarSign size={14} />
                    )}
                </div>
                <span className="hidden sm:inline">{displayCurrency}</span>
            </motion.button>

            <div className="relative">
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="bg-theme-surface border border-white/5 text-xs font-bold text-theme-secondary rounded-xl px-3 py-2 outline-none focus:border-theme-soft/50 transition-all cursor-pointer hover:text-theme-primary flex items-center gap-2 min-w-[90px] sm:min-w-[100px] justify-between relative"
              >
                <span>{selectedMonth}</span>
                <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-200 ${showMonthPicker ? 'rotate-180' : ''}`} />
              </button>

              {showMonthPicker && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowMonthPicker(false)} />
                  <div className="absolute top-full mt-2 right-0 w-40 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[240px] overflow-y-auto no-scrollbar py-2 text-left">
                       {(() => {
                           const months = new Set<string>();
                           const current = new Date().toISOString().slice(0, 7);
                           months.add(current);
                           transactions.forEach(t => months.add(t.date.slice(0, 7)));
                           return Array.from(months).sort().reverse().map(m => (
                               <button
                                 key={m}
                                 onClick={() => {
                                   setSelectedMonth(m);
                                   setShowMonthPicker(false);
                                 }}
                                 className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-white/5 ${selectedMonth === m ? 'text-theme-brand bg-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                               >
                                 {m}
                               </button>
                           ));
                       })()}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
                onClick={() => setShowAnalysisCustomizer(true)}
                className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-white transition-colors"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>



      {viewMode === 'OVERVIEW' ? (
          <Reorder.Group 
            axis="y" 
            values={analysisOrder} 
            onReorder={setAnalysisOrder}
            className="flex flex-col gap-6"
          >
            <div className="mb-6">
                <p className="text-theme-secondary text-sm">{t('netCashFlow')}</p>
                <div className="flex flex-col">
                    <h2 className={`text-4xl font-bold flex items-center gap-2 ${netCashFlow >= 0 ? 'text-theme-primary' : 'text-red-400'}`}>
                      <CurrencyAmount
                        amount={Math.abs(netCashFlow)}
                        exchangeRate={exchangeRate}
                        euroRate={euroRate}
                        displayCurrency={displayCurrency}
                        isBalanceVisible={isBalanceVisible}
                        showPlusMinus={false}
                        weight="black"
                        className="items-start"
                        prefix={netCashFlow >= 0 ? '+' : '-'}
                      />
                    </h2>
                    {isBalanceVisible && (
                        <span className="text-sm font-mono text-theme-secondary mt-1">
                            {displayCurrency === Currency.USD ? `≈ Bs ${(Math.abs(netCashFlow) * exchangeRate)?.toLocaleString()}` : 
                             displayCurrency === Currency.EUR ? `≈ $${Math.abs(netCashFlow)?.toFixed(2)}` :
                             `≈ $${Math.abs(netCashFlow)?.toFixed(2)}`}
                        </span>
                    )}
                </div>
            </div>

            {analysisOrder.map((id, index) => (
              <Reorder.Item
                key={id}
                value={id}
                dragListener={false}
                dragControls={analysisControls[index]}
                className="relative group focus:outline-none"
                onClick={() => {
                  if (window.matchMedia("(max-width: 768px)").matches) {
                    setTouchedWidget(touchedWidget === id ? null : id);
                  }
                }}
              >
                <motion.div 
                  onPointerDown={(e) => analysisControls[index].start(e)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9, cursor: 'grabbing' }}
                  className={`absolute top-2 right-2 transition-opacity z-50 cursor-grab active:cursor-grabbing p-2.5 bg-theme-bg/90 rounded-xl border border-white/10 text-theme-secondary flex touch-none ${touchedWidget === id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
                >
                  <GripVertical size={20} />
                </motion.div>
                <motion.button 
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAnalysisCustomizer(true)}
                  className={`absolute bottom-2 right-2 transition-opacity z-50 p-2.5 bg-theme-bg/90 rounded-xl border border-white/10 text-theme-secondary flex touch-none ${touchedWidget === id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
                >
                  <Settings size={20} />
                </motion.button>

                {id === "incomeVsExpenses" && showIncomeVsExpenseC && (
                  <div className="bg-theme-surface rounded-3xl border border-white/10 p-6 relative transition-all">
                      <div className="flex justify-between items-center mb-10 relative z-10">
                          <div className="flex items-center gap-4">
                              <h3 className="font-bold text-lg text-theme-primary">{t('incomeVsExpenses')}</h3>
                              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                  <motion.button 
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => setMainChartType('BAR')}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${mainChartType === 'BAR' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
                                  >
                                      {t('bar')}
                                  </motion.button>
                                  <motion.button 
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => setMainChartType('LINE')}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${mainChartType === 'LINE' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
                                  >
                                      {t('line')}
                                  </motion.button>
                              </div>
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDetails(!showDetails)} 
                            className="text-theme-brand text-xs font-bold flex items-center gap-1"
                          >
                              {t('viewDetails')} {showDetails ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                          </motion.button>
                      </div>

                      <div className="relative h-[300px] w-full mt-4">
                          <IncomeVsExpenseChart 
                            type={mainChartType}
                            transactions={monthlyTransactions}
                            lang={lang}
                            exchangeRate={exchangeRate}
                            euroRate={euroRate}
                            displayCurrency={displayCurrency}
                            isBalanceVisible={isBalanceVisible}
                          />
                      </div>
                      
                      {showDetails && (
                          <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-2">
                              <div className="flex justify-between text-sm text-theme-secondary mb-2">
                                  <span>{t('totalIncomeLabel')}</span>
                                  <div className="text-right">
                                      <span className="text-emerald-400 block">{isBalanceVisible ? `$${totalIncome?.toFixed(2)}` : '******'}</span>
                                      {isBalanceVisible && <span className="text-emerald-600 text-xs">Bs {(totalIncome * exchangeRate).toLocaleString()}</span>}
                                  </div>
                              </div>
                              <div className="flex justify-between text-sm text-theme-secondary mb-2">
                                  <span>{t('totalExpensesLabel')}</span>
                                  <div className="text-right">
                                      <span className="text-rose-400 block">{isBalanceVisible ? `-$${totalSpent?.toFixed(2)}` : '******'}</span>
                                      {isBalanceVisible && <span className="text-rose-600 text-xs">Bs {(totalSpent * exchangeRate).toLocaleString()}</span>}
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
                )}

                {id === "extraCharts" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {showNetFlowC && (
                          <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl group">
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('monthlyNetFlow')}</h3>
                                </div>
                                <div className="h-48">
                                    <MonthlyNetFlowChart 
                                        transactions={transactions}
                                        lang={lang}
                                        exchangeRate={exchangeRate}
                                        euroRate={euroRate}
                                        displayCurrency={displayCurrency}
                                        isBalanceVisible={isBalanceVisible}
                                    />
                                </div>
                            </div>
                      )}
                      {showCatTrendC && (
                             <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl group"
                            >
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('topSpendingCategories')}</h3>
                                </div>
                                <div className="h-48">
                                    <ExpenseStructureChart 
                                        type="BAR"
                                        transactions={monthlyTransactions}
                                        lang={lang}
                                        exchangeRate={exchangeRate}
                                        euroRate={euroRate}
                                        displayCurrency={displayCurrency}
                                        isBalanceVisible={isBalanceVisible}
                                    />
                                </div>
                            </motion.div>
                      )}
                      {showIncomeDistC && (
                            <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl group">
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('incomeDistribution')}</h3>
                                </div>
                                <div className="h-48 flex justify-center">
                                    <div className="w-48 h-48">
                                        <IncomeDistributionChart 
                                            transactions={monthlyTransactions}
                                            lang={lang}
                                            exchangeRate={exchangeRate}
                                            euroRate={euroRate}
                                            displayCurrency={displayCurrency}
                                            isBalanceVisible={isBalanceVisible}
                                        />
                                    </div>
                                </div>
                            </div>
                      )}
                  </div>
                )}

                {id === "leakDetector" && (
                  <div className="mt-8 mb-8">
                      <div className="flex items-center gap-3 mb-6 px-1">
                          <ShieldAlert size={20} className="text-theme-brand" />
                          <h3 className="font-bold text-lg text-theme-primary">{t('leakDetector')}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {leaks.length > 0 ? leaks.map((leak, idx) => (
                              <div key={idx} className="bg-theme-surface p-5 rounded-3xl border border-white/5 hover:border-theme-soft/30 transition-all flex items-start gap-4 group">
                                  <div className={`p-3 rounded-2xl ${leak.type === 'overspend' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'} border border-white/5`}>
                                      {leak.type === 'overspend' ? <Zap size={20} /> : <AlertCircle size={20} />}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start mb-1">
                                          <h4 className="font-bold text-theme-primary">{t(leak.category)}</h4>
                                          <CurrencyAmount
                                            amount={leak.amount}
                                            exchangeRate={exchangeRate}
                                            euroRate={euroRate}
                                            displayCurrency={displayCurrency}
                                            isBalanceVisible={isBalanceVisible}
                                            size="sm"
                                            weight="bold"
                                            className="text-rose-400"
                                          />
                                      </div>
                                      <p className="text-xs text-theme-secondary opacity-70 leading-relaxed font-bold uppercase tracking-tight">{leak.description}</p>
                                  </div>
                              </div>
                          )) : (
                              <div className="col-span-full py-8 px-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 flex items-center gap-4">
                                   <TrendingUp size={24} className="text-emerald-400" />
                                   <div>
                                       <p className="text-sm font-bold text-emerald-400">{t('noLeaksDetected')}</p>
                                       <p className="text-xs text-theme-secondary">{t('healthySpendingDesc')}</p>
                                   </div>
                              </div>
                          )}
                      </div>
                  </div>
                )}

                {id === "subscriptions" && (
                  <>
                    <div className="mb-6 flex justify-between items-center px-1 mt-6">
                        <h3 className="font-bold text-lg text-theme-primary">{t('upcomingSubscriptions')}</h3>
                    </div>
                    
                    {/* Scheduled Payments List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {scheduledPayments.length === 0 && (
                            <p className="text-theme-secondary text-sm ml-2">{t('noSubscriptions')}</p>
                        )}
                        {displayedSubs.map(sub => {
                            const days = getDaysDiff(sub.date);
                            const badgeColor = days < 0 ? 'bg-red-500/20 text-red-400' : days <= 7 ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-500/20 text-zinc-400';
                            
                            return (
                                <div key={sub.id} className="bg-theme-surface p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-900/50 text-indigo-400 rounded-lg flex items-center justify-center font-bold uppercase">
                                        {sub.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-theme-primary">{sub.name}</h4>
                                        <p className="text-theme-secondary text-xs">{isBalanceVisible ? `$${sub.amount}` : '******'} / {t(sub.frequency === 'Bi-weekly' ? 'biweekly' : sub.frequency === 'One-Time' ? 'oneTime' : sub.frequency.toLowerCase()) || sub.frequency}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[10px] ${badgeColor} px-2 py-0.5 rounded-full mb-1 inline-block`}>
                                            {days < 0 ? `${Math.abs(days)} ${t('daysAgo')}` : days === 0 ? t('today') : `${days} ${t('daysLeft')}`}
                                        </div>
                                        <div className="font-bold text-theme-primary">{isBalanceVisible ? `$${sub.amount}` : '******'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
      ) : (
          <div className="animate-in slide-in-from-right duration-300">
              <h2 className="text-2xl font-bold mb-6 text-theme-primary">{t('incomeSources')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {incomeCategories.map(cat => (
                      <div key={cat.id} className="bg-theme-surface p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                          <div className={`absolute left-0 top-0 bottom-0 w-2 ${cat.color}`} />
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                                     {cat.icon}
                                 </div>
                                 <h3 className="font-bold text-lg text-theme-primary">{t(cat.name)}</h3>
                             </div>
                             <span className="text-2xl font-bold text-theme-primary">{isBalanceVisible ? `$${cat.total.toLocaleString()}` : '******'}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                             <span className="text-theme-secondary text-sm">{t('platformTotal')}</span>
                             <span className="text-theme-brand text-sm font-bold">{((cat.total / totalIncome) * 100)?.toFixed(1)}%</span>
                          </div>
                          
                          <div className="mt-4 h-2 w-full bg-theme-bg rounded-full overflow-hidden">
                              <div className={`h-full ${cat.color}`} style={{ width: `${(cat.total / totalIncome) * 100}%` }} />
                          </div>
                      </div>
                  ))}
                  {incomeCategories.length === 0 && (
                      <div className="text-center py-20 text-theme-secondary border-2 border-dashed border-white/10 rounded-3xl">
                          {t('noIncomeSources')}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Customizer Modal */}
      <AnimatePresence>
        {showAnalysisCustomizer && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
                >
                   <div className="flex justify-between items-center mb-8">
                       <div>
                           <h3 className="text-xl font-black text-theme-primary">{t('customizeAnalysis')}</h3>
                           <p className="text-xs text-theme-secondary font-bold uppercase tracking-widest mt-1 opacity-60">{t('visualSettings')}</p>
                       </div>
                       <button onClick={() => setShowAnalysisCustomizer(false)} className="p-3 bg-white/5 rounded-2xl text-theme-secondary hover:text-theme-brand transition-all">
                           <X size={20} />
                       </button>
                   </div>

                   <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <BarChart size={18} className="text-theme-brand" />
                              <span className="text-sm font-bold text-theme-primary">{t('incomeVsExpenses')}</span>
                          </div>
                          <button onClick={() => {
                              const next = !showIncomeVsExpenseC;
                              setShowIncomeVsExpenseC(next);
                              localStorage.setItem("analysis_show_income_vs_expense", JSON.stringify(next));
                          }} className={`w-12 h-6 rounded-full transition-all relative ${showIncomeVsExpenseC ? 'bg-theme-brand' : 'bg-white/10'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showIncomeVsExpenseC ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>

                       <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <Activity size={18} className="text-theme-brand" />
                              <span className="text-sm font-bold text-theme-primary">{t('netFlowTrend')}</span>
                          </div>
                          <button onClick={() => {
                              const next = !showNetFlowC;
                              setShowNetFlowC(next);
                              localStorage.setItem("analysis_show_net_flow", JSON.stringify(next));
                          }} className={`w-12 h-6 rounded-full transition-all relative ${showNetFlowC ? 'bg-theme-brand' : 'bg-white/10'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showNetFlowC ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <BarChart size={18} className="text-theme-brand" />
                              <span className="text-sm font-bold text-theme-primary">{t('categoryBar')}</span>
                          </div>
                          <button onClick={() => {
                              const next = !showCatTrendC;
                              setShowCatTrendC(next);
                              localStorage.setItem("analysis_show_cat_trend", JSON.stringify(next));
                          }} className={`w-12 h-6 rounded-full transition-all relative ${showCatTrendC ? 'bg-theme-brand' : 'bg-white/10'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showCatTrendC ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-theme-bg/50 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <PieChart size={18} className="text-theme-brand" />
                              <span className="text-sm font-bold text-theme-primary">{t('incomeDist')}</span>
                          </div>
                          <button onClick={() => {
                              const next = !showIncomeDistC;
                              setShowIncomeDistC(next);
                              localStorage.setItem("analysis_show_income_dist", JSON.stringify(next));
                          }} className={`w-12 h-6 rounded-full transition-all relative ${showIncomeDistC ? 'bg-theme-brand' : 'bg-white/10'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showIncomeDistC ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>
                   </div>

                   <button onClick={() => setShowAnalysisCustomizer(false)} className="w-full py-4 mt-8 bg-theme-brand text-white font-black rounded-2xl shadow-lg shadow-brand/20 active:scale-[0.98] transition-all">
                       {t('done')}
                   </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};