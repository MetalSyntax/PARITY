import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, PieChart, BarChart, Settings, Activity, TrendingUp, X } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { Transaction, TransactionType, Language, ScheduledPayment } from '../types';
import { getTranslation } from '../i18n';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler);

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#e4e4e7',
            bodyColor: '#e4e4e7',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
        }
    },
    scales: { x: { display: false }, y: { display: false } },
    interaction: { intersect: false, mode: 'index' as const },
};

const tailwindToHex = (colorClass: string) => {
    if (!colorClass) return '#888888';
    if (colorClass.includes('orange-400')) return '#fb923c';
    if (colorClass.includes('blue-400')) return '#60a5fa';
    if (colorClass.includes('amber-500')) return '#f59e0b';
    if (colorClass.includes('indigo-400')) return '#818cf8';
    if (colorClass.includes('yellow-400')) return '#facc15';
    if (colorClass.includes('red-400')) return '#f87171';
    if (colorClass.includes('purple-400')) return '#c084fc';
    if (colorClass.includes('sky-400')) return '#38bdf8';
    if (colorClass.includes('pink-400')) return '#f472b6';
    if (colorClass.includes('emerald-400')) return '#34d399';
    if (colorClass.includes('rose-400')) return '#fb7185';
    if (colorClass.includes('green-400')) return '#4ade80';
    if (colorClass.includes('amber-400')) return '#fbbf24';
    if (colorClass.includes('blue-300')) return '#93c5fd';
    if (colorClass.includes('gray-400')) return '#9ca3af';
    if (colorClass.includes('cyan-400')) return '#22d3ee';
    if (colorClass.includes('zinc-300')) return '#d4d4d8';
    if (colorClass.includes('violet-400')) return '#a78bfa';
    if (colorClass.includes('slate-400')) return '#94a3b8';
    if (colorClass.includes('teal-400')) return '#2dd4bf';
    if (colorClass.includes('rose-300')) return '#fda4af';
    if (colorClass.includes('slate-300')) return '#cbd5e1';
    if (colorClass.includes('indigo-300')) return '#a5b4fc';
    if (colorClass.includes('gray-300')) return '#d1d5db';
    if (colorClass.includes('zinc-500')) return '#71717a';
    return '#888888';
};

interface AnalysisViewProps {
  onBack: () => void;
  transactions: Transaction[];
  lang: Language;
  scheduledPayments: ScheduledPayment[];
  exchangeRate: number;
  isBalanceVisible: boolean;
  onToggleBottomNav: (visible: boolean) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ onBack, transactions, lang, scheduledPayments, exchangeRate, isBalanceVisible, onToggleBottomNav }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'INCOME'>('OVERVIEW');
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
  const [showCatTrendC, setShowCatTrendC] = useState(() => {
    const saved = localStorage.getItem("analysis_show_cat_trend");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showIncomeDistC, setShowIncomeDistC] = useState(() => {
    const saved = localStorage.getItem("analysis_show_income_dist");
    return saved !== null ? JSON.parse(saved) : false;
  });

  React.useEffect(() => {
      onToggleBottomNav(!showAnalysisCustomizer);
  }, [showAnalysisCustomizer, onToggleBottomNav]);

  // Data helpers for charts
  const monthKeys = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort().slice(-6);
  const netFlowData = {
      labels: monthKeys,
      datasets: [{
          label: 'Net Flow',
          data: monthKeys.map(m => {
              const monthT = transactions.filter(t => t.date.startsWith(m));
              const inc = monthT.filter(t => t.type === TransactionType.INCOME).reduce((a,c) => a+c.normalizedAmountUSD,0);
              const exp = monthT.filter(t => t.type === TransactionType.EXPENSE).reduce((a,c) => a+c.normalizedAmountUSD,0);
              return inc - exp;
          }),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          tension: 0.4,
          fill: true
      }]
  };

  const displayedSubs = scheduledPayments;

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto bg-theme-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-theme-primary">{t('analysis')}</h1>
        </div>
        <div className="flex items-center gap-3">
        <div className="relative">
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="bg-theme-surface border border-white/5 text-xs font-bold text-theme-secondary rounded-xl px-3 py-2 outline-none focus:border-theme-brand/50 transition-all cursor-pointer hover:text-theme-primary flex items-center gap-2 min-w-[100px] justify-between relative"
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
          <>
            <div className="mb-6">
                <p className="text-theme-secondary text-sm">{t('netCashFlow')}</p>
                <div className="flex flex-col">
                    <h2 className={`text-4xl font-bold flex items-center gap-2 ${netCashFlow >= 0 ? 'text-theme-primary' : 'text-red-400'}`}>
                        {netCashFlow >= 0 ? '+' : '-'}{isBalanceVisible ? `$${Math.abs(netCashFlow).toFixed(2)}` : '******'}
                    </h2>
                    {isBalanceVisible && (
                        <span className="text-sm font-mono text-theme-secondary mt-1">
                            ≈ Bs. {(Math.abs(netCashFlow) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    )}
                </div>
            </div>

            {/* Income vs Expenses Chart */}
            {showIncomeVsExpenseC && (
                <div className="bg-theme-surface rounded-3xl border border-white/10 p-6 relative mb-6 transition-all">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <h3 className="font-bold text-lg text-theme-primary">{t('incomeVsExpenses')}</h3>
                        <button onClick={() => setShowDetails(!showDetails)} className="text-theme-brand text-xs font-bold flex items-center gap-1">
                            {t('viewDetails')} {showDetails ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        </button>
                    </div>

                    <div className="relative h-[300px] w-full flex">
                        <div className="flex flex-col justify-center h-full w-1/4">
                            <div className="h-[60%] w-3 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full relative group">
                                <div className="absolute top-full mt-2 left-0 text-emerald-400 font-bold text-sm">{t('income')}</div>
                                <div className="absolute top-full mt-6 left-0">
                                    <div className="text-theme-primary font-bold text-lg">{isBalanceVisible ? `$${totalIncome.toFixed(0)}` : '******'}</div>
                                    {isBalanceVisible && <div className="text-theme-secondary text-[10px]">Bs.{(totalIncome * exchangeRate).toLocaleString(undefined, {notation: 'compact'})}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 relative h-full">
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                <defs>
                                    {sortedCategories.map(cat => (
                                        <linearGradient key={`grad-${cat.id}`} id={`grad-${cat.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" style={{stopColor:'#34d399', stopOpacity:0.5}} />
                                            <stop offset="100%" style={{stopColor: tailwindToHex(cat.color), stopOpacity:0.5}} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                {sortedCategories.map((cat, i) => {
                                    const yStart = 150; 
                                    const yEnd = 40 + (i * 60);
                                    return (
                                        <path 
                                            key={cat.id}
                                            d={`M 0 ${yStart} C 50 ${yStart}, 50 ${yEnd}, 100 ${yEnd}`}
                                            stroke={`url(#grad-${cat.id})`}
                                            strokeWidth={Math.max(cat.total / 10, 5)} 
                                            fill="none"
                                            className="opacity-60"
                                        />
                                    );
                                })}
                            </svg>
                        </div>

                        <div className="flex flex-col justify-start gap-6 h-full w-1/4 pt-8">
                            {sortedCategories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-end gap-2 relative">
                                    <div className="text-right">
                                        <div className="text-[10px] text-theme-secondary uppercase">{t(cat.name)}</div>
                                        <div className="text-sm font-bold text-theme-primary">{isBalanceVisible ? `$${cat.total.toFixed(0)}` : '******'}</div>
                                        {isBalanceVisible && <div className="text-[10px] text-zinc-500">Bs.{(cat.total * exchangeRate).toLocaleString(undefined, {notation: 'compact'})}</div>}
                                    </div>
                                    <div className={`w-2 h-8 rounded-full ${cat.color.replace('text-', 'bg-').split(' ')[0]}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {showDetails && (
                        <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-2">
                            <div className="flex justify-between text-sm text-theme-secondary mb-2">
                                <span>{t('totalIncomeLabel')}</span>
                                <div className="text-right">
                                    <span className="text-emerald-400 block">{isBalanceVisible ? `$${totalIncome.toFixed(2)}` : '******'}</span>
                                    {isBalanceVisible && <span className="text-emerald-600 text-xs">Bs. {(totalIncome * exchangeRate).toLocaleString()}</span>}
                                </div>
                            </div>
                            <div className="flex justify-between text-sm text-theme-secondary mb-2">
                                <span>{t('totalExpensesLabel')}</span>
                                <div className="text-right">
                                    <span className="text-rose-400 block">{isBalanceVisible ? `-$${totalSpent.toFixed(2)}` : '******'}</span>
                                    {isBalanceVisible && <span className="text-rose-600 text-xs">Bs. {(totalSpent * exchangeRate).toLocaleString()}</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mb-4 flex justify-between items-center px-1">
                <h3 className="font-bold text-lg text-theme-primary">{t('upcomingSubscriptions')}</h3>
            </div>
            
            {/* Scheduled Payments List */}
            <div className="flex flex-col gap-3">
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
                                <p className="text-theme-secondary text-xs">{isBalanceVisible ? `$${sub.amount}` : '******'} / {sub.frequency}</p>
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

            {/* Extra Charts Section */}
            <div className="flex flex-col gap-6 mt-6">
                {showNetFlowC && (
                    <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl">
                          <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-4">{t('monthlyNetFlow')}</h3>
                          <div className="h-48">
                              <Line data={netFlowData} options={{...commonOptions, scales: { y: { display: true, ticks: { color: '#71717a'} } }}} />
                          </div>
                      </div>
                )}
                {showCatTrendC && (
                      <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl">
                          <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-4">{t('topSpendingCategories')}</h3>
                          <div className="h-48">
                              <Bar 
                                  data={{
                                      labels: sortedCategories.map(c => t(c.name)),
                                      datasets: [{
                                          data: sortedCategories.map(c => c.total),
                                          backgroundColor: sortedCategories.map(c => tailwindToHex(c.color)),
                                          borderRadius: 6
                                      }]
                                  }}
                                  options={commonOptions}
                              />
                          </div>
                      </div>
                )}
                {showIncomeDistC && (
                      <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl">
                          <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-4">{t('incomeDistribution')}</h3>
                          <div className="h-48 flex justify-center">
                              <div className="w-48 h-48">
                                  <Doughnut 
                                      data={{
                                          labels: incomeCategories.map(c => t(c.name)),
                                          datasets: [{
                                              data: incomeCategories.map(c => c.total),
                                              backgroundColor: incomeCategories.map(c => tailwindToHex(c.color)),
                                              borderWidth: 0
                                          }]
                                      }}
                                      options={commonOptions}
                                  />
                              </div>
                          </div>
                      </div>
                )}
            </div>
          </>
      ) : (
          <div className="animate-in slide-in-from-right duration-300">
              <h2 className="text-2xl font-bold mb-6 text-theme-primary">{t('incomeSources')}</h2>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                  {incomeCategories.map(cat => (
                      <div key={cat.id} className="bg-theme-surface p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                          <div className={`absolute left-0 top-0 bottom-0 w-2 ${cat.color.replace('text-', 'bg-').split(' ')[0] || 'bg-theme-brand'}`} />
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
                             <span className="text-theme-brand text-sm font-bold">{((cat.total / totalIncome) * 100).toFixed(1)}%</span>
                          </div>
                          
                          <div className="mt-4 h-2 w-full bg-theme-bg rounded-full overflow-hidden">
                              <div className={`h-full ${cat.color.replace('text-', 'bg-').split(' ')[0] || 'bg-theme-brand'}`} style={{ width: `${(cat.total / totalIncome) * 100}%` }} />
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
        {showAnalysisCustomizer && (
            <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-400">
                   <div className="flex justify-between items-center mb-8">
                       <div>
                           <h3 className="text-xl font-black text-theme-primary">{t('customizeAnalysis')}</h3>
                           <p className="text-xs text-theme-secondary font-bold uppercase tracking-widest mt-1 opacity-60">Visual Settings</p>
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
                </div>
            </div>
        )}
    </div>
  );
};