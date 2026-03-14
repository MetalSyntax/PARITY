import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Shield, TrendingUp, TrendingDown, Clock, CheckCircle2, LineChart, Activity, DollarSign, Euro } from 'lucide-react';
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

    const [historicalUsd, setHistoricalUsd] = useState<{date: string, rate: number}[]>([]);
    const [historicalEur, setHistoricalEur] = useState<{date: string, rate: number}[]>([]);
    const [activeTab, setActiveTab] = useState<'USD' | 'EUR'>('USD');
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [showAllHistory, setShowAllHistory] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const [usdRes, eurRes] = await Promise.all([
                    fetch('https://ve.dolarapi.com/v1/historicos/dolares'),
                    fetch('https://ve.dolarapi.com/v1/historicos/euros')
                ]);
                
                if (usdRes.ok) {
                    const data = await usdRes.json();
                    if (Array.isArray(data)) {
                        const officialUsd = data.filter((d: any) => d.fuente === 'oficial').map((d: any) => ({
                            date: d.fecha,
                            rate: Number(d.promedio)
                        })).sort((a: any, b: any) => a.date.localeCompare(b.date));
                        setHistoricalUsd(officialUsd);
                    }
                }
                
                if (eurRes.ok) {
                    const data = await eurRes.json();
                    if (Array.isArray(data)) {
                        const officialEur = data.filter((d: any) => d.fuente === 'oficial').map((d: any) => ({
                            date: d.fecha,
                            rate: Number(d.promedio)
                        })).sort((a: any, b: any) => a.date.localeCompare(b.date));
                        setHistoricalEur(officialEur);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch historical rates", e);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    const activeHistory = activeTab === 'USD' ? historicalUsd : historicalEur;

    const periodVariation = useMemo(() => {
        if (!historicalUsd || historicalUsd.length < 2) return 0;
        const start = historicalUsd[0].rate;
        const end = historicalUsd[historicalUsd.length - 1].rate;
        return ((end - start) / start) * 100;
    }, [historicalUsd]);
    
    // Inflation Shield Distribution
    const shieldStats = useMemo(() => {
        const variation = periodVariation;
        const saved = Math.min(95, Math.max(20, 70 + (variation * 2)));
        return {
            saved: Math.round(saved),
            loss: 100 - Math.round(saved),
            variation
        };
    }, [periodVariation]);

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
        const history = activeHistory.length > 0 ? activeHistory : [];

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
    }, [activeHistory, lang]);

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
                            {isBalanceVisible ? `${periodVariation >= 0 ? '+' : ''}${periodVariation?.toFixed(1)}% ${t('vsIPC')}` : '******'}
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

                {/* Market Grid - Now static at top of Analysis */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center text-center justify-center"
                    >
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{t('dollarBCV')}</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-xl font-black text-white">{exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs font-bold text-zinc-500">Bs/$</span>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center text-center justify-center"
                    >
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{t('euroBCV')}</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-xl font-black text-white">{(euroRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs font-bold text-zinc-500">Bs/€</span>
                        </div>
                    </motion.div>
                </div>

                <div className="flex items-center justify-between mb-6 px-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('marketAnalysis')}</p>
                    <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('USD')} 
                            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${activeTab === 'USD' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}
                        >
                            <DollarSign size={14} /> {activeTab === 'USD' ? 'USD' : 'USD'}
                        </button>
                        <button 
                            onClick={() => setActiveTab('EUR')} 
                            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${activeTab === 'EUR' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}
                        >
                            <Euro size={14} /> {activeTab === 'EUR' ? 'EURO' : 'EURO'}
                        </button>
                    </div>
                </div>

                {/* Volatility Chart */}
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-theme-primary">{t('volatilitySpread')}</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">
                                {activeTab === 'USD' ? t('dollarBCV') : t('euroBCV')}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`font-black ${ (activeHistory && activeHistory.length > 1 && (activeHistory[activeHistory.length-1].rate - activeHistory[0].rate)) >= 0 ? 'text-emerald-400' : 'text-rose-400' }`}>
                                {isBalanceVisible ? 
                                    (isLoadingHistory 
                                        ? '...'
                                        : ((activeHistory && activeHistory.length > 1) 
                                            ? `${(activeHistory[activeHistory.length-1].rate - activeHistory[0].rate) >= 0 ? '+' : ''}${(activeHistory[activeHistory.length-1].rate - activeHistory[0].rate).toFixed(2)} Bs.`
                                            : '0.00 Bs.'))
                                    : '******'}
                            </p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{t('profitPerDollar')} {activeTab}</p>
                        </div>
                    </div>
                    <div className="h-40 w-full mb-2">
                        {isLoadingHistory ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <Activity className="animate-spin text-blue-500" size={24} />
                            </div>
                        ) : (
                            <Line data={volatilityData} options={commonOptions as any} />
                        )}
                    </div>
                </div>

                {/* Historical Table */}
                <div className="mt-4 mb-20 px-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('historicalData')} {activeTab === 'USD' ? 'USD' : 'EURO'}</h3>
                        <div className="flex items-center gap-2">
                            <Clock size={12} className="text-zinc-500" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{t('updatedToday')}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {isLoadingHistory ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl animate-pulse h-16" />
                            ))
                        ) : activeHistory.length === 0 ? (
                            <div className="p-8 text-center text-zinc-600 text-sm border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                {t('noData')}
                            </div>
                        ) : (
                            <>
                                {[...activeHistory].reverse().slice(0, showAllHistory ? activeHistory.length : 7).map((item, index, arr) => {
                                    // Notice: we need to find the variation with the item after it in the OVERALL reversed list
                                    // The overall reversed list is [...activeHistory].reverse()
                                    const fullReversed = [...activeHistory].reverse();
                                    const nextItem = fullReversed[index + 1];
                                    let variation = 0;
                                    if (nextItem) {
                                        variation = ((item.rate - nextItem.rate) / nextItem.rate) * 100;
                                    }

                                    return (
                                        <div key={item.date} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    {activeTab === 'USD' ? <DollarSign size={18} /> : <Euro size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white capitalize">
                                                        {new Date(item.date + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', { 
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
                                                        {t('officialRate')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-white">
                                                    {item.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} 
                                                    <span className="text-[10px] text-zinc-500 ml-1">Bs.</span>
                                                </p>
                                                {index < fullReversed.length - 1 && (
                                                    <div className={`flex items-center justify-end gap-1 text-[10px] font-black ${variation >= 0 ? (variation === 0 ? 'text-zinc-500' : 'text-emerald-400') : 'text-rose-400'}`}>
                                                        {variation > 0 ? <TrendingUp size={10} /> : variation < 0 ? <TrendingDown size={10} /> : <Activity size={10} />}
                                                        {variation === 0 ? '0.00%' : `${variation > 0 ? '+' : ''}${variation.toFixed(2)}%`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {activeHistory.length > 7 && (
                                    <button 
                                        onClick={() => setShowAllHistory(!showAllHistory)}
                                        className="mt-2 w-full py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10"
                                    >
                                        {showAllHistory ? t('showLess') : t('showMore')}
                                    </button>
                                )}
                            </>
                        )}
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
