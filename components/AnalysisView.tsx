import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { Transaction, TransactionType, Language } from '../types';
import { getTranslation } from '../i18n';

interface AnalysisViewProps {
  onBack: () => void;
  transactions: Transaction[];
  lang: Language;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ onBack, transactions, lang }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [showDetails, setShowDetails] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  
  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

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

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto bg-black">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold">{t('analysis')}</h1>
        </div>
        <div className="text-xs bg-white/5 px-3 py-1 rounded-full border border-white/10 font-mono">{today}</div>
      </div>

      <div className="mb-6">
          <p className="text-zinc-500 text-sm">{t('netCashFlow')}</p>
          <h2 className={`text-4xl font-bold flex items-center gap-2 ${netCashFlow >= 0 ? 'text-white' : 'text-red-400'}`}>
            {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toFixed(2)}
          </h2>
      </div>

      {/* Main Chart Card */}
      <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-6 relative overflow-hidden mb-6 transition-all">
         <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="font-bold text-lg">{t('incomeVsExpenses')}</h3>
            <button onClick={() => setShowDetails(!showDetails)} className="text-indigo-400 text-xs font-bold flex items-center gap-1">
                {t('viewDetails')} {showDetails ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
         </div>

         {/* Sankey / Chart */}
         <div className="relative h-[300px] w-full flex">
             <div className="flex flex-col justify-center h-full w-1/4">
                <div className="h-[60%] w-3 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full relative group">
                    <div className="absolute top-full mt-2 left-0 text-emerald-400 font-bold text-sm">{t('income')}</div>
                    <div className="absolute top-full mt-6 left-0 text-white font-bold text-lg">${totalIncome.toFixed(0)}</div>
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
                             <div className="text-[10px] text-zinc-400 uppercase">{cat.name}</div>
                             <div className="text-sm font-bold">${cat.total.toFixed(0)}</div>
                         </div>
                         <div className={`w-2 h-8 rounded-full ${cat.id === 'food' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                     </div>
                 ))}
             </div>
         </div>
         
         {/* Details Expansion */}
         {showDetails && (
             <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-2">
                 <div className="flex justify-between text-sm text-zinc-400 mb-2">
                     <span>Total Income</span>
                     <span className="text-emerald-400">${totalIncome.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm text-zinc-400">
                     <span>Total Expenses</span>
                     <span className="text-red-400">-${totalSpent.toFixed(2)}</span>
                 </div>
             </div>
         )}
      </div>

      <div className="mb-4 flex justify-between items-center px-1">
        <h3 className="font-bold text-lg">{t('upcomingSubscriptions')}</h3>
        <button onClick={() => setShowSubs(!showSubs)} className="text-blue-500 text-sm">{showSubs ? t('viewLess') : t('viewMore')}</button>
      </div>
      
      {/* Mock Subs */}
      <div className="flex flex-col gap-3">
         <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
             <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold">N</div>
             <div className="flex-1">
                 <h4 className="font-bold text-sm">Netflix Standard</h4>
                 <p className="text-zinc-500 text-xs">$15.99 / mo</p>
             </div>
             <div className="text-right">
                 <div className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full mb-1 inline-block">2 {t('daysLeft')}</div>
                 <div className="font-bold">$15.99</div>
             </div>
         </div>
         {showSubs && (
             <>
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center font-bold">S</div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">Spotify</h4>
                        <p className="text-zinc-500 text-xs">$9.99 / mo</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] bg-zinc-500/20 text-zinc-400 px-2 py-0.5 rounded-full mb-1 inline-block">14 {t('daysLeft')}</div>
                        <div className="font-bold">$9.99</div>
                    </div>
                </div>
             </>
         )}
      </div>

    </div>
  );
};