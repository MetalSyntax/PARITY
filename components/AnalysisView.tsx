import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, PieChart, BarChart, Settings, Activity, TrendingUp, X, ShieldAlert, Zap, AlertCircle, Coins, DollarSign, Shield } from 'lucide-react';
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
    animation: {
        duration: 1200,
        easing: 'easeInOutQuart' as const,
        delay: (context: any) => {
            let delay = 0;
            if (context.type === 'data' && context.mode === 'default') {
                delay = context.dataIndex * 150 + context.datasetIndex * 100;
            }
            return delay;
        }
    },
    plugins: {
        legend: { 
            display: false,
            labels: {
                color: '#a1a1aa',
                font: { size: 12 },
                usePointStyle: true,
                padding: 15
            }
        },
        tooltip: {
            backgroundColor: 'rgba(24, 24, 27, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#e4e4e7',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            cornerRadius: 12,
            titleFont: { size: 14, weight: 'bold' as const },
            bodyFont: { size: 13 },
            usePointStyle: true,
        }
    },
    scales: { 
        x: { 
            display: false,
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#71717a' }
        }, 
        y: { 
            display: false,
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#71717a' }
        } 
    },
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
  onNavigate: (view: any) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ onBack, transactions, lang, scheduledPayments, exchangeRate, isBalanceVisible, onToggleBottomNav, onNavigate }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'INCOME'>('OVERVIEW');
  const [mainChartType, setMainChartType] = useState<'BAR' | 'LINE'>('BAR');
  const [displayInVES, setDisplayInVES] = useState(false);
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
                description: `${((data.total/totalIncome)*100).toFixed(0)}% ${t('ofIncomeGoesHere') || 'de tus ingresos van aquí.'}`
            });
        }
        // Impulse buys: many small transactions
        if (data.count > 6 && data.total / data.count < 15) {
            results.push({
                type: 'impulse',
                title: t('minorLeakage'),
                category: data.name,
                amount: data.total,
                description: `${data.count} ${t('smallExpensesWarning') || 'gastos pequeños acumulados silenciosamente.'}`
            });
        }
    });

    return results;
  }, [monthlyTransactions, totalIncome]);

  const formatAmount = (usd: number) => {
    if (!isBalanceVisible) return '******';
    const val = displayInVES ? usd * exchangeRate : usd;
    const symbol = displayInVES ? 'Bs. ' : '$';
    return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto bg-theme-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-theme-primary">{t('analysis')}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
            <button 
                onClick={() => setDisplayInVES(!displayInVES)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 transition-all font-black text-[10px] ${displayInVES ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
            >
                {displayInVES ? <Coins size={14} /> : <DollarSign size={14} />}
                <span className="hidden sm:inline">{displayInVES ? 'VES' : 'USD'}</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="bg-theme-surface border border-white/5 text-xs font-bold text-theme-secondary rounded-xl px-3 py-2 outline-none focus:border-theme-brand/50 transition-all cursor-pointer hover:text-theme-primary flex items-center gap-2 min-w-[90px] sm:min-w-[100px] justify-between relative"
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
                        {netCashFlow >= 0 ? '+' : '-'}{formatAmount(Math.abs(netCashFlow))}
                    </h2>
                    {isBalanceVisible && (
                        <span className="text-sm font-mono text-theme-secondary mt-1">
                            {displayInVES ? `≈ $${Math.abs(netCashFlow).toFixed(2)}` : `≈ Bs. ${(Math.abs(netCashFlow) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Income vs Expenses Chart */}
            {showIncomeVsExpenseC && (
                <div className="bg-theme-surface rounded-3xl border border-white/10 p-6 mb-6 relative transition-all">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-lg text-theme-primary">{t('incomeVsExpenses')}</h3>
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                <button 
                                    onClick={() => setMainChartType('BAR')}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${mainChartType === 'BAR' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
                                >
                                    {t('bar')}
                                </button>
                                <button 
                                    onClick={() => setMainChartType('LINE')}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${mainChartType === 'LINE' ? 'bg-theme-brand text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
                                >
                                    {t('line')}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setShowDetails(!showDetails)} className="text-theme-brand text-xs font-bold flex items-center gap-1">
                            {t('viewDetails')} {showDetails ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        </button>
                    </div>

                    <div className="relative h-[300px] w-full mt-4">
                        {mainChartType === 'BAR' ? (
                            <Bar 
                                data={{
                                    labels: [t('income'), t('expenses')],
                                    datasets: [
                                        {
                                            label: t('income'),
                                            data: [totalIncome, 0],
                                            backgroundColor: 'rgba(52, 211, 153, 0.8)', // emerald-400
                                            borderRadius: 12,
                                            barThickness: 40,
                                        },
                                        ...sortedCategories.map((cat, idx) => ({
                                            label: t(cat.name),
                                            data: [0, cat.total],
                                            backgroundColor: tailwindToHex(cat.color) + 'CC',
                                            borderRadius: idx === 0 ? { topLeft: 12, bottomLeft: 12 } : idx === sortedCategories.length - 1 ? { topRight: 12, bottomRight: 12 } : 0,
                                            barThickness: 40,
                                        }))
                                    ]
                                }}
                                options={{
                                    ...commonOptions,
                                    indexAxis: 'y' as const,
                                    plugins: {
                                        ...commonOptions.plugins,
                                        legend: { 
                                            display: true, 
                                            position: 'bottom' as const,
                                            labels: {
                                                color: '#a1a1aa',
                                                usePointStyle: true,
                                                padding: 20,
                                                font: { size: 10 }
                                            }
                                        },
                                        tooltip: {
                                            ...commonOptions.plugins.tooltip,
                                            callbacks: {
                                                label: function(context: any) {
                                                    let label = context.dataset.label || '';
                                                    if (label) label += ': ';
                                                    if (context.parsed.x !== undefined) {
                                                        label += formatAmount(context.parsed.x);
                                                    }
                                                    return label;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: { 
                                            stacked: true,
                                            display: true, 
                                            grid: { color: 'rgba(255,255,255,0.05)' },
                                            border: { display: false },
                                            ticks: { color: '#71717a', font: { size: 10 }, callback: (v: any) => displayInVES ? `${v/1000}k` : `$${v}` }
                                        },
                                        y: { 
                                            stacked: true,
                                            display: true, 
                                            grid: { display: false },
                                            border: { display: false },
                                            ticks: { color: '#e4e4e7', font: { size: 12, weight: 'bold' } }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <Line 
                                data={{
                                    labels: monthKeys,
                                    datasets: [
                                        {
                                            label: t('income'),
                                            data: monthKeys.map(m => transactions.filter(t => t.date.startsWith(m) && t.type === TransactionType.INCOME).reduce((a,c) => a+c.normalizedAmountUSD, 0)),
                                            borderColor: '#34d399',
                                            backgroundColor: (context: any) => {
                                                const ctx = context.chart.ctx;
                                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                                gradient.addColorStop(0, 'rgba(52, 211, 153, 0.3)');
                                                gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
                                                return gradient;
                                            },
                                            tension: 0.4,
                                            fill: true,
                                            pointRadius: 4,
                                            pointBackgroundColor: '#34d399',
                                        },
                                        {
                                            label: t('expenses'),
                                            data: monthKeys.map(m => transactions.filter(t => t.date.startsWith(m) && t.type === TransactionType.EXPENSE).reduce((a,c) => a+c.normalizedAmountUSD, 0)),
                                            borderColor: '#f87171',
                                            backgroundColor: (context: any) => {
                                                const ctx = context.chart.ctx;
                                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                                gradient.addColorStop(0, 'rgba(248, 113, 113, 0.2)');
                                                gradient.addColorStop(1, 'rgba(248, 113, 113, 0)');
                                                return gradient;
                                            },
                                            tension: 0.4,
                                            fill: true,
                                            pointRadius: 4,
                                            pointBackgroundColor: '#f87171',
                                        }
                                    ]
                                }}
                                options={{
                                    ...commonOptions,
                                    plugins: {
                                        ...commonOptions.plugins,
                                        legend: { display: true, position: 'bottom' as const, labels: { color: '#a1a1aa', font: { size: 10 } } },
                                        tooltip: {
                                            ...commonOptions.plugins.tooltip,
                                            callbacks: {
                                                label: (context: any) => `${context.dataset.label}: ${formatAmount(context.parsed.y)}`
                                            }
                                        }
                                    },
                                    scales: {
                                        x: { display: true, grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } },
                                        y: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: '#71717a', font: { size: 10 }, callback: (value: any) => displayInVES ? `Bs.${value/1000}k` : `$${value}` } }
                                    }
                                }}
                            />
                        )}
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

            {/* Extra Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {showNetFlowC && (
                    <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl group">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('monthlyNetFlow')}</h3>
                            <button 
                                onClick={() => {
                                    setShowNetFlowC(false);
                                    localStorage.setItem("analysis_show_net_flow", "false");
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-lg text-zinc-500 transition-all"
                            >
                                <X size={14} />
                            </button>
                          </div>
                          <div className="h-48">
                              <Bar 
                                data={{
                                    labels: monthKeys,
                                    datasets: [{
                                        label: t('netFlow'),
                                        data: monthKeys.map(m => {
                                            const monthT = transactions.filter(t => t.date.startsWith(m));
                                            const inc = monthT.filter(t => t.type === TransactionType.INCOME).reduce((a,c) => a+c.normalizedAmountUSD,0);
                                            const exp = monthT.filter(t => t.type === TransactionType.EXPENSE).reduce((a,c) => a+c.normalizedAmountUSD,0);
                                            return inc - exp;
                                        }),
                                        backgroundColor: (context: any) => context.raw >= 0 ? 'rgba(52, 211, 153, 0.7)' : 'rgba(248, 113, 113, 0.7)',
                                        borderRadius: 8
                                    }]
                                }} 
                                options={{
                                    ...commonOptions, 
                                    plugins: {
                                        ...commonOptions.plugins,
                                        tooltip: {
                                            ...commonOptions.plugins.tooltip,
                                            callbacks: {
                                                label: (context: any) => `${context.dataset.label}: ${formatAmount(context.parsed.y)}`
                                            }
                                        }
                                    },
                                    scales: { 
                                        y: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: '#71717a', font: { size: 10 }, callback: (v: any) => displayInVES ? `${v/1000}k` : `$${v}` } },
                                        x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } }
                                    } 
                                }} />
                          </div>
                      </div>
                )}
                {showCatTrendC && (
                      <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl group">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('topSpendingCategories')}</h3>
                            <button 
                                onClick={() => {
                                    setShowCatTrendC(false);
                                    localStorage.setItem("analysis_show_cat_trend", "false");
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-lg text-zinc-500 transition-all"
                            >
                                <X size={14} />
                            </button>
                          </div>
                          <div className="h-48">
                              <Bar 
                                  data={{
                                      labels: sortedCategories.map(c => t(c.name)),
                                      datasets: [{
                                          label: t('amount'),
                                          data: sortedCategories.map(c => c.total),
                                          backgroundColor: sortedCategories.map(c => {
                                              const hex = tailwindToHex(c.color);
                                              return hex + 'B3'; // 70% opacity
                                          }),
                                          borderRadius: 8,
                                          barThickness: 25
                                      }]
                                  }}
                                  options={{
                                      ...commonOptions,
                                      plugins: {
                                          ...commonOptions.plugins,
                                          tooltip: {
                                              ...commonOptions.plugins.tooltip,
                                              callbacks: {
                                                  label: (context: any) => `${context.label}: ${formatAmount(context.parsed.y)}`
                                              }
                                          }
                                      },
                                      scales: {
                                          y: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: '#71717a', font: { size: 9 }, callback: (v: any) => displayInVES ? `${v/1000}k` : `$${v}` } },
                                          x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: '#71717a', font: { size: 9 }, maxRotation: 45, minRotation: 45 } }
                                      }
                                  }}
                              />
                          </div>
                      </div>
                )}
                {showIncomeDistC && (
                      <div className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl group">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">{t('incomeDistribution')}</h3>
                            <button 
                                onClick={() => {
                                    setShowIncomeDistC(false);
                                    localStorage.setItem("analysis_show_income_dist", "false");
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-lg text-zinc-500 transition-all"
                            >
                                <X size={14} />
                            </button>
                          </div>
                          <div className="h-48 flex justify-center">
                              <div className="w-48 h-48">
                                  <Doughnut 
                                      data={{
                                          labels: incomeCategories.map(c => t(c.name)),
                                          datasets: [{
                                              data: incomeCategories.map(c => c.total),
                                              backgroundColor: incomeCategories.map(c => tailwindToHex(c.color) + 'CC'),
                                              borderWidth: 0,
                                              hoverOffset: 15
                                          }]
                                      }}
                                      options={{
                                          ...commonOptions,
                                          cutout: '70%',
                                          plugins: {
                                              ...commonOptions.plugins,
                                              tooltip: {
                                                  ...commonOptions.plugins.tooltip,
                                                  callbacks: {
                                                      label: (context: any) => `${context.label}: ${formatAmount(context.raw)}`
                                                  }
                                              }
                                          }
                                      }}
                                  />
                              </div>
                          </div>
                      </div>
                )}
            </div>

            {/* Money Leak Detector Section */}
            <div className="mt-8 mb-8">
                <div className="flex items-center gap-3 mb-6 px-1">
                    <ShieldAlert size={20} className="text-theme-brand" />
                    <h3 className="font-bold text-lg text-theme-primary">{t('leakDetector')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leaks.length > 0 ? leaks.map((leak, idx) => (
                        <div key={idx} className="bg-theme-surface p-5 rounded-3xl border border-white/5 hover:border-theme-brand/30 transition-all flex items-start gap-4 group">
                            <div className={`p-3 rounded-2xl ${leak.type === 'overspend' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'} border border-white/5`}>
                                {leak.type === 'overspend' ? <Zap size={20} /> : <AlertCircle size={20} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-theme-primary">{t(leak.category)}</h4>
                                    <span className="font-mono text-sm font-bold text-rose-400">{formatAmount(leak.amount)}</span>
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
          </>
      ) : (
          <div className="animate-in slide-in-from-right duration-300">
              <h2 className="text-2xl font-bold mb-6 text-theme-primary">{t('incomeSources')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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