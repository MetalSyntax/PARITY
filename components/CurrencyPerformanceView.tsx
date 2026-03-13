import React, { useMemo } from 'react';
import { ChevronLeft, Shield, TrendingUp, TrendingDown, Clock, CheckCircle2, LineChart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Transaction, Currency, TransactionType, RateHistoryItem } from '../types';
import { getTranslation } from '../i18n';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface CurrencyPerformanceViewProps {
    transactions: Transaction[];
    exchangeRate: number;
    lang: string;
    onBack: () => void;
    isBalanceVisible: boolean;
    rateHistory: RateHistoryItem[];
    euroRate?: number;
    euroRateParallel?: number;
}

export const CurrencyPerformanceView: React.FC<CurrencyPerformanceViewProps> = ({
    transactions,
    exchangeRate,
    lang,
    onBack,
    isBalanceVisible,
    rateHistory,
    euroRate,
    euroRateParallel
}) => {
    const t = (key: any) => getTranslation(lang as any, key);

    const formatAmount = (usd: number) => {
        if (!isBalanceVisible) return '******';
        const val = usd; // This view doesn't use displayInVES
        return `$${val?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Calculate Average User Purchase Rate
    const avgUserRate = useMemo(() => {
        const incomeTx = transactions.filter(t => t.type === TransactionType.INCOME && t.originalCurrency === Currency.USD);
        if (incomeTx.length === 0) return exchangeRate * 0.98; // Fallback
        const totalUSD = incomeTx.reduce((a, b) => a + b.amount, 0);
        const weightedRate = incomeTx.reduce((a, b) => a + (b.amount * b.exchangeRate), 0);
        return weightedRate / totalUSD;
    }, [transactions, exchangeRate]);

    const rateDiff = ((exchangeRate - avgUserRate) / avgUserRate) * 100;
    
    // Inflation Shield Distribution (Mock based on transactions)
    const shieldStats = useMemo(() => {
        const saved = Math.min(95, Math.max(20, 70 + (rateDiff * 2)));
        return {
            saved: Math.round(saved),
            loss: 100 - Math.round(saved)
        };
    }, [rateDiff]);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
        },
        scales: {
            x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: '#52525b', font: { size: 9 } } },
            y: { display: false, border: { display: false } }
        }
    };

    const volatilityData = useMemo(() => {
        // Use real history or mock if empty
        const usdHistory = rateHistory?.filter(h => !h.currency || h.currency === Currency.USD) || [];
        const history = usdHistory.length > 0 ? usdHistory : [
            { date: '2026-03-05', rate: exchangeRate * 0.95 },
            { date: '2026-03-06', rate: exchangeRate * 0.96 },
            { date: '2026-03-07', rate: exchangeRate * 0.955 },
            { date: '2026-03-08', rate: exchangeRate * 0.97 },
            { date: '2026-03-09', rate: exchangeRate * 0.98 },
            { date: '2026-03-10', rate: exchangeRate * 0.99 },
            { date: new Date().toISOString().split('T')[0], rate: exchangeRate }
        ];

        return {
            labels: history.map(h => {
                const date = new Date(h.date + 'T12:00:00');
                return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'short' }).toUpperCase();
            }),
            datasets: [{
                data: history.map(h => h.rate),
                borderColor: '#3b82f6',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: history.length > 15 ? 0 : 4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        };
    }, [rateHistory, exchangeRate, lang]);

    return (
        <div className="flex flex-col h-full bg-black text-white animate-in slide-in-from-right duration-500 overflow-hidden">
            {/* Header */}
            <div className="p-6 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-10 font-bold">
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack} 
                    className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-colors"
                >
                    <ChevronLeft size={24} />
                </motion.button>
                <h2 className="text-sm font-black tracking-tight truncate max-w-[200px]">{t('currencyPerformance')}</h2>
                <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
                {/* Inflation Shield Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 mb-8 mt-4"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <motion.div 
                                whileHover={{ rotate: 10 }}
                                className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20"
                            >
                                <Shield size={20} />
                            </motion.div>
                            <h3 className="font-extrabold text-theme-primary text-xl">{t('inflationShield')}</h3>
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full text-[10px] font-black border border-blue-500/20">
                            {isBalanceVisible ? `+${rateDiff?.toFixed(1)}% vs IPC` : '******'}
                        </span>
                    </div>

                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{t('impactDistribution')}</p>
                    
                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden flex mb-6 shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${shieldStats.saved}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" 
                        />
                        <div className="h-full bg-rose-500" style={{ width: `${shieldStats.loss}%` }} />
                    </div>

                    <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-xs font-bold text-zinc-400">{t('savingsFromRate')} <span className="text-white ml-2">{shieldStats.saved}%</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-400"><span className="text-white mr-2">{shieldStats.loss}%</span> {t('loss')}</span>
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                        </div>
                    </div>
                </motion.div>

                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-1">{t('marketAnalysis')}</p>

                {/* Market Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-blue-600 p-6 rounded-[2rem] shadow-xl shadow-blue-500/10 flex flex-col justify-between"
                    >
                        <p className="text-[10px] font-black text-blue-100/70 uppercase tracking-widest mb-4">{t('yourAvgRate')}</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-3xl font-black text-white">{formatAmount(avgUserRate)}</span>
                            <span className="text-xs font-bold text-blue-200">Bs/$</span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-lg text-[10px] font-black text-white ${rateDiff >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {rateDiff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {rateDiff >= 0 ? '+' : ''}{rateDiff?.toFixed(1)}%
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-between"
                    >
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{t('marketRateBCV')}</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-3xl font-black text-white">{formatAmount(exchangeRate)}</span>
                            <span className="text-xs font-bold text-zinc-500">Bs/$</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold">{t('updatedToday')}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Euro Market Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-zinc-900 border border-white/5 p-5 rounded-[2rem] flex flex-col items-center text-center"
                    >
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Euro Oficial</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white">{(euroRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] font-bold text-zinc-500">Bs/€</span>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-zinc-900 border border-white/5 p-5 rounded-[2rem] flex flex-col items-center text-center"
                    >
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Euro Binance</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white">{(euroRateParallel || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] font-bold text-zinc-500">Bs/€</span>
                        </div>
                    </motion.div>
                </div>

                {/* Volatility Chart */}
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-theme-primary">{t('volatilitySpread')}</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">{t('last7Days')}</p>
                        </div>
                        <div className="text-right">
                            <p className={`font-black ${ (rateHistory && rateHistory.length > 1 && (rateHistory[rateHistory.length-1].rate - rateHistory[0].rate)) >= 0 ? 'text-emerald-400' : 'text-rose-400' }`}>
                                {isBalanceVisible ? 
                                    ((rateHistory && rateHistory.length > 1) 
                                        ? `${(rateHistory[rateHistory.length-1].rate - rateHistory[0].rate) >= 0 ? '+' : ''}${(rateHistory[rateHistory.length-1].rate - rateHistory[0].rate).toFixed(2)} Bs.`
                                        : '+1.50 Bs.') // Fallback
                                    : '******'}
                            </p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{t('profitPerDollar')}</p>
                        </div>
                    </div>
                    <div className="h-40 w-full mb-2">
                        <Line data={volatilityData} options={commonOptions as any} />
                    </div>
                </div>

                {/* Achievement Card */}
                <div className="bg-zinc-900/80 p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-2xl font-black text-white mb-2">{t('wellPlayed')}</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-bold">
                        {t('wellPlayedDesc').replace('{amount}', isBalanceVisible ? 'Bs. 3,450' : '******')}
                    </p>
                </div>
            </div>
        </div>
    );
};
