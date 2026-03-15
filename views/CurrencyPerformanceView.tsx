import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Shield, TrendingUp, TrendingDown, Clock, CheckCircle2, LineChart, Activity, DollarSign, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketVolatilityChart } from '../components/Charts';
import { Transaction, Currency, TransactionType, RateHistoryItem } from '../types';
import { getTranslation } from '../i18n';

interface CurrencyPerformanceViewProps {
    transactions: Transaction[];
    exchangeRate: number;
    lang: string;
    onBack: () => void;
    isBalanceVisible: boolean;
    rateHistory: RateHistoryItem[];
    euroRate?: number;
    euroRateParallel?: number;
    usdRateParallel?: number;
    isDevMode?: boolean;
}

export const CurrencyPerformanceView: React.FC<CurrencyPerformanceViewProps> = ({
    transactions,
    exchangeRate,
    lang,
    onBack,
    isBalanceVisible,
    rateHistory,
    euroRate,
    euroRateParallel,
    usdRateParallel,
    isDevMode
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
    const last7DaysHistory = useMemo(() => activeHistory.slice(-7), [activeHistory]);

    const periodVariation = useMemo(() => {
        if (!historicalUsd || historicalUsd.length < 2) return 0;
        const last30 = historicalUsd.slice(-30);
        const start = last30[0].rate;
        const end = last30[last30.length - 1].rate;
        return ((end - start) / start) * 100;
    }, [historicalUsd]);
    
    // Inflation Shield Distribution
    const shieldStats = useMemo(() => {
        const variation = periodVariation;
        // Shielded is the % of value protected from devaluation
        const saved = Math.min(100, Math.max(0, variation));
        return {
            saved: Number(saved.toFixed(1)),
            loss: Number((100 - saved).toFixed(1)),
            variation
        };
    }, [periodVariation]);

    const [currentSlide, setCurrentSlide] = useState(0);

    const achievementSlides = useMemo(() => {
        const expensesThisMonth = transactions.filter(tx => 
            tx.type === TransactionType.EXPENSE && 
            new Date(tx.date).getMonth() === new Date().getMonth()
        );
        const avgRate = expensesThisMonth.length > 0 
            ? expensesThisMonth.reduce((acc, tx) => acc + tx.exchangeRate, 0) / expensesThisMonth.length
            : exchangeRate;
        const spendDiff = ((exchangeRate - avgRate) / exchangeRate) * 100;

        return [
            {
                title: t('achievement_market_title'),
                desc: t('achievement_market_desc').replace('{percent}', shieldStats.variation.toFixed(1)),
                icon: <Shield size={32} />,
                color: 'text-blue-400',
                bg: 'bg-blue-500/20'
            },
            {
                title: t('achievement_spend_title'),
                desc: t('achievement_spend_desc').replace('{percent}', Math.abs(spendDiff).toFixed(1)),
                icon: <TrendingDown size={32} />,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/20'
            },
            {
                title: t('achievement_goals_title'),
                desc: t('achievement_goals_desc'),
                icon: <CheckCircle2 size={32} />,
                color: 'text-amber-400',
                bg: 'bg-amber-500/20'
            }
        ];
    }, [shieldStats, transactions, exchangeRate, lang]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % achievementSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [achievementSlides.length]);


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

                {/* Developer Mode Gap Card */}
                {isDevMode && usdRateParallel && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-amber-500/20 p-6 rounded-[2rem] mb-8 relative overflow-hidden group"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-amber-500/10 transition-colors" />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-amber-500 text-sm uppercase tracking-wider">{t('devMode')}</h3>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase">{t('marketAnalysis')}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black border border-amber-500/20">
                                GAP ANALYSIS
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Brecha en Bs</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-white">
                                        {(usdRateParallel - exchangeRate).toFixed(2)}
                                    </span>
                                    <span className="text-xs font-bold text-zinc-500">Bs</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Porcentaje de Brecha</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-amber-400">
                                        {(((usdRateParallel - exchangeRate) / exchangeRate) * 100).toFixed(2)}%
                                    </span>
                                    <TrendingUp size={14} className="text-amber-500" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Oficial (BCV)</span>
                                <span className="text-sm font-bold text-zinc-300">{exchangeRate.toFixed(2)}</span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Paralelo</span>
                                <span className="text-sm font-bold text-zinc-300">{usdRateParallel.toFixed(2)}</span>
                            </div>
                        </div>
                    </motion.div>
                )}

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
                            <p className={`font-black ${ (last7DaysHistory && last7DaysHistory.length > 1 && (last7DaysHistory[last7DaysHistory.length-1].rate - last7DaysHistory[0].rate)) >= 0 ? 'text-emerald-400' : 'text-rose-400' }`}>
                                {isBalanceVisible ? 
                                    (isLoadingHistory 
                                        ? '...'
                                        : ((last7DaysHistory && last7DaysHistory.length > 1) 
                                            ? `${(last7DaysHistory[last7DaysHistory.length-1].rate - last7DaysHistory[0].rate) >= 0 ? '+' : ''}${(last7DaysHistory[last7DaysHistory.length-1].rate - last7DaysHistory[0].rate).toFixed(2)} Bs`
                                            : '0.00 Bs'))
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
                            <MarketVolatilityChart 
                                history={last7DaysHistory}
                                lang={lang}
                            />
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
                                                    <span className="text-[10px] text-zinc-500 ml-1">Bs</span>
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

                {/* Achievement Slider Card */}
                <div className="relative h-64 mb-8">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentSlide}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 bg-zinc-900/80 p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center justify-center"
                        >
                            <div className={`w-16 h-16 rounded-full ${achievementSlides[currentSlide].bg} flex items-center justify-center ${achievementSlides[currentSlide].color} mb-6 shadow-lg`}>
                                {achievementSlides[currentSlide].icon}
                            </div>
                            <h4 className="text-2xl font-black text-white mb-2">{achievementSlides[currentSlide].title}</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed font-bold">
                                {achievementSlides[currentSlide].desc}
                            </p>
                            
                            {/* Dots */}
                            <div className="flex gap-2 mt-6">
                                {achievementSlides.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentSlide ? 'bg-blue-500 w-4' : 'bg-zinc-700'}`} 
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
