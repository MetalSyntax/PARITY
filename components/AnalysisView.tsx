import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, PieChart, BarChart } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { Transaction, TransactionType, Language, ScheduledPayment } from '../types';
import { getTranslation } from '../i18n';

interface AnalysisViewProps {
  onBack: () => void;
  transactions: Transaction[];
  lang: Language;
  scheduledPayments: ScheduledPayment[];
  exchangeRate: number;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ onBack, transactions, lang, scheduledPayments, exchangeRate }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'INCOME'>('OVERVIEW');
  const [showDetails, setShowDetails] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  
  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

  // ... Logic
  const totalSpent = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
    
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);

  const netCashFlow = totalIncome - totalSpent;

  // Sorted categories for the graph
  const sortedCategories = CATEGORIES.map(cat => {
    const total = transactions
      .filter(t => t.category === cat.id && t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
    return { ...cat, total };
  }).sort((a,b) => b.total - a.total).filter(c => c.total > 0).slice(0, 4); 

  // Income Data by Category (Platform)
  const incomeCategories = CATEGORIES.map(cat => {
      const total = transactions
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

  const displayedSubs = scheduledPayments;

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto bg-theme-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-theme-primary">{t('analysis')}</h1>
        </div>
      </div>

      {viewMode === 'OVERVIEW' ? (
          <>
            <div className="mb-6">
                <p className="text-theme-secondary text-sm">{t('netCashFlow')}</p>
                <div className="flex flex-col">
                    <h2 className={`text-4xl font-bold flex items-center gap-2 ${netCashFlow >= 0 ? 'text-theme-primary' : 'text-red-400'}`}>
                        {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toFixed(2)}
                    </h2>
                    <span className="text-sm font-mono text-theme-secondary mt-1">≈ Bs. {(Math.abs(netCashFlow) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            {/* Main Chart Card */}
            <div className="bg-theme-surface rounded-3xl border border-white/10 p-6 relative mb-6 transition-all">
                <div className="flex justify-between items-center mb-10 relative z-10">
                    <h3 className="font-bold text-lg text-theme-primary">{t('incomeVsExpenses')}</h3>
                    <button onClick={() => setShowDetails(!showDetails)} className="text-theme-brand text-xs font-bold flex items-center gap-1">
                        {t('viewDetails')} {showDetails ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                    </button>
                </div>

                {/* Sankey / Chart */}
                <div className="relative h-[300px] w-full flex">
                    <div className="flex flex-col justify-center h-full w-1/4">
                        <div className="h-[60%] w-3 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full relative group">
                            <div className="absolute top-full mt-2 left-0 text-emerald-400 font-bold text-sm">{t('income')}</div>
                            <div className="absolute top-full mt-6 left-0">
                                <div className="text-theme-primary font-bold text-lg">${totalIncome.toFixed(0)}</div>
                                <div className="text-theme-secondary text-[10px]">Bs.{(totalIncome * exchangeRate).toLocaleString(undefined, {notation: 'compact'})}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 relative h-full">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{stopColor:'#34d399', stopOpacity:0.5}} />
                                    <stop offset="100%" style={{stopColor:'#fb7185', stopOpacity:0.5}} />
                                </linearGradient>
                            </defs>
                            {sortedCategories.map((cat, i) => {
                                const yStart = 150; 
                                const yEnd = 40 + (i * 60);
                                return (
                                    <path 
                                        key={cat.id}
                                        d={`M 0 ${yStart} C 50 ${yStart}, 50 ${yEnd}, 100 ${yEnd}`}
                                        stroke={`url(#grad1)`}
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
                                    <div className="text-sm font-bold text-theme-primary">${cat.total.toFixed(0)}</div>
                                    <div className="text-[10px] text-zinc-500">Bs.{(cat.total * exchangeRate).toLocaleString(undefined, {notation: 'compact'})}</div>
                                </div>
                                <div className={`w-2 h-8 rounded-full ${cat.id === 'food' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Details Expansion */}
                {showDetails && (
                    <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-2">
                        <div className="flex justify-between text-sm text-theme-secondary mb-2">
                            <span>{t('totalIncomeLabel')}</span>
                            <div className="text-right">
                                <span className="text-emerald-400 block">${totalIncome.toFixed(2)}</span>
                                <span className="text-emerald-600 text-xs">Bs. {(totalIncome * exchangeRate).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm text-theme-secondary">
                            <span>{t('totalExpensesLabel')}</span>
                            <div className="text-right">
                                <span className="text-red-400 block">-${totalSpent.toFixed(2)}</span>
                                <span className="text-red-600 text-xs">Bs. {(totalSpent * exchangeRate).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
                                <p className="text-theme-secondary text-xs">${sub.amount} / {sub.frequency}</p>
                            </div>
                            <div className="text-right">
                                <div className={`text-[10px] ${badgeColor} px-2 py-0.5 rounded-full mb-1 inline-block`}>
                                    {days < 0 ? `${Math.abs(days)} ${t('daysAgo')}` : days === 0 ? t('today') : `${days} ${t('daysLeft')}`}
                                </div>
                                <div className="font-bold text-theme-primary">${sub.amount}</div>
                            </div>
                        </div>
                    );
                })}
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
                             <span className="text-2xl font-bold text-theme-primary">${cat.total.toLocaleString()}</span>
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

    </div>
  );
};