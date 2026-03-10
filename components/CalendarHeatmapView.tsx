import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, ChevronDown, X, Coins, DollarSign, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, TransactionType, Currency } from '../types';
import { getTranslation } from '../i18n';

interface CalendarHeatmapViewProps {
    transactions: Transaction[];
    lang: string;
    onBack: () => void;
    exchangeRate: number;
    displayInVES: boolean;
    onToggleDisplayCurrency: () => void;
    isBalanceVisible: boolean;
}

export const CalendarHeatmapView: React.FC<CalendarHeatmapViewProps> = ({ 
    transactions, 
    lang, 
    onBack,
    exchangeRate,
    displayInVES,
    onToggleDisplayCurrency,
    isBalanceVisible
}) => {
    const t = (key: any) => getTranslation(lang as any, key);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ date: Date, txs: Transaction[] } | null>(null);
    const [showPatternDetails, setShowPatternDetails] = useState(false);

    const formatAmount = (usd: number) => {
        if (!isBalanceVisible) return '******';
        const val = displayInVES ? usd * exchangeRate : usd;
        const symbol = displayInVES ? 'Bs. ' : '$';
        return `${symbol}${val?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const monthYear = currentDate?.toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' });
    
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        
        // Add empty slots for the beginning of the week
        const firstDay = date.getDay();
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const dailySpending = useMemo(() => {
        const spending: Record<string, number> = {};
        transactions
            .filter(tx => tx.type === TransactionType.EXPENSE)
            .forEach(tx => {
                const dateKey = tx.date.split('T')[0];
                spending[dateKey] = (spending[dateKey] || 0) + tx.normalizedAmountUSD;
            });
        return spending;
    }, [transactions]);

    const maxSpend = useMemo(() => {
        const values = Object.values(dailySpending) as number[];
        return values.length > 0 ? Math.max(...values) : 0;
    }, [dailySpending]);

    const getIntensity = (date: Date) => {
        const key = date.toISOString().split('T')[0];
        const amount = dailySpending[key] || 0;
        if (amount === 0) return 'bg-zinc-800/50';
        if (amount < maxSpend * 0.4) return 'bg-orange-400/40';
        if (amount < maxSpend * 0.7) return 'bg-orange-500/70';
        return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    // Calculate potential savings (Mock logic: 15% of total income - total expenses)
    const totalIncomeUSD = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((a, b) => a + b.normalizedAmountUSD, 0);
    const totalExpenseUSD = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((a, b) => a + b.normalizedAmountUSD, 0);
    
    const potentialSavings = Math.max(0, (totalIncomeUSD * 0.2) - (totalExpenseUSD * 0.05));

    return (
        <div className="flex flex-col h-full bg-theme-bg animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-6 flex items-center justify-between sticky top-0 bg-theme-bg/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-2">
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack} 
                        className="p-2 bg-white/5 rounded-xl text-zinc-400"
                    >
                        <ChevronLeft size={20} />
                    </motion.button>
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => changeMonth(-1)} 
                            className="text-zinc-500 hover:text-white"
                        >
                            <ChevronLeft size={16}/>
                        </motion.button>
                        <span className="text-sm font-bold text-theme-primary capitalize">{monthYear}</span>
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => changeMonth(1)} 
                            className="text-zinc-500 hover:text-white"
                        >
                            <ChevronRight size={16}/>
                        </motion.button>
                    </div>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleDisplayCurrency}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 transition-all font-black text-[10px] ${displayInVES ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
                >
                    {displayInVES ? <Coins size={14} /> : <DollarSign size={14} />}
                    <span className="hidden sm:inline">{displayInVES ? 'Bs.' : 'USD'}</span>
                </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
                <div className="mb-8 mt-2">
                    <h1 className="text-3xl font-black text-theme-primary mb-1">{t('heatmap')}</h1>
                    <p className="text-sm text-theme-secondary opacity-70">{t('heatmapDesc')}</p>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-3 mb-8">
                    {[t('day_sun'), t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat')].map(day => (
                        <div key={day} className="text-[10px] font-black text-zinc-600 text-center mb-2">{day}</div>
                    ))}
                    {daysInMonth.map((day, idx) => (
                        <motion.div 
                            key={idx} 
                            whileHover={day ? { scale: 1.1, zIndex: 10 } : {}}
                            whileTap={day ? { scale: 0.9 } : {}}
                            onClick={() => {
                                if (day) {
                                    const key = day.toISOString().split('T')[0];
                                    const txs = transactions.filter(t => t.date.split('T')[0] === key && t.type === TransactionType.EXPENSE);
                                    setSelectedDay({ date: day, txs });
                                }
                            }}
                            className={`aspect-square rounded-xl transition-all duration-300 cursor-pointer ${day ? getIntensity(day) : 'opacity-0 cursor-default'}`}
                        />
                    ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mb-12">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-800/50" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{t('noExpense')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-400/60" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{t('low')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{t('high')}</span>
                    </div>
                </div>

                {/* Spending Pattern Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-theme-surface to-zinc-900 p-6 rounded-[2.5rem] border border-white/5 mb-6 relative overflow-hidden group"
                >
                    <div className="flex items-start gap-4">
                        <motion.div 
                            whileHover={{ rotate: 10 }}
                            className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"
                        >
                            <TrendingUp size={24} />
                        </motion.div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg text-theme-primary mb-1">{t('spendingPattern')}</h3>
                            <p className="text-xs text-theme-secondary leading-relaxed opacity-80">
                                {t('spendingPatternDesc')} <br/>
                                <span className="font-bold">{t('average')}: {formatAmount(maxSpend * 0.8)}</span> {isBalanceVisible && `/ ${displayInVES ? '$' : 'Bs.'} ${Math.round(displayInVES ? maxSpend * 0.8 : maxSpend * 0.8 * exchangeRate)?.toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('smartAnalysis')}</span>
                        <motion.button 
                            whileHover={{ scale: 1.05, x: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPatternDetails(true)}
                            className="text-red-400 text-xs font-black flex items-center gap-1 transition-transform"
                        >
                            {t('viewDetails')} <TrendingUp size={14} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Potential Savings */}
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-theme-brand/20 flex items-center justify-center text-theme-brand">
                            <TrendingUp size={16} className="rotate-45" />
                        </div>
                        <span className="text-xs font-bold text-theme-secondary opacity-80">{t('potentialSavingsMonth')}</span>
                    </div>
                    <span className="text-lg font-black text-theme-primary">{formatAmount(potentialSavings)}</span>
                </div>
            </div>

            <AnimatePresence>
            {selectedDay && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 -z-10"
                        onClick={() => setSelectedDay(null)}
                    />
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-theme-surface w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-1">{selectedDay.date.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { weekday: 'long' })}</h3>
                                <h2 className="text-xl font-black text-theme-primary">{selectedDay.date.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</h2>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedDay(null)} 
                                className="p-3 bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </motion.button>
                        </div>
                        <div className="p-8 max-h-[50vh] overflow-y-auto no-scrollbar">
                            {selectedDay.txs.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedDay.txs.map(tx => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={tx.id} 
                                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-theme-bg flex items-center justify-center text-xl">
                                                    {tx.category === 'food' ? '🍔' : tx.category === 'transport' ? '🚗' : '💸' }
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-theme-primary">{tx.note || tx.category}</p>
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase">{tx.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-red-400">-{formatAmount(tx.normalizedAmountUSD)}</p>
                                                {isBalanceVisible && (
                                                    <p className="text-[10px] font-bold text-zinc-500">~{displayInVES ? '$' : 'Bs.'} {(displayInVES ? (tx.originalCurrency === Currency.USD ? tx.amount : tx.amount / exchangeRate) : (tx.originalCurrency === Currency.USD ? tx.amount * exchangeRate : tx.amount))?.toLocaleString()}</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-xs font-black text-zinc-500 uppercase">{t('dailyTotal')}</span>
                                        <span className="text-lg font-black text-theme-primary">{formatAmount(selectedDay.txs.reduce((a,b) => a + b.normalizedAmountUSD, 0))}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                                        <CalendarIcon size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-zinc-500">{t('noExpensesDay')}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>

            {/* Pattern Details Modal */}
            {showPatternDetails && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
                    <div className="bg-theme-surface w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-400">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-500/10 to-transparent">
                            <div>
                                <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-1">{t('patternAnalysis')}</h3>
                                <h2 className="text-xl font-black text-theme-primary">{t('spendingDetails')}</h2>
                            </div>
                            <button onClick={() => setShowPatternDetails(false)} className="p-3 bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-xs font-bold text-zinc-400">{t('highestSpendingDay')}</span>
                                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">{t('friday')}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-xs font-bold text-zinc-400">{t('dominantCategory')}</span>
                                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">{t('entertainment')}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-xs font-bold text-zinc-400">{t('criticalFrequency')}</span>
                                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">{t('biweeklyPattern')}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">{t('recommendation')}</h4>
                                <p className="text-sm text-theme-secondary leading-relaxed font-medium">
                                    {t('recommendationDesc')}
                                </p>
                            </div>

                            <button 
                                onClick={() => setShowPatternDetails(false)}
                                className="w-full py-4 bg-theme-primary text-theme-bg font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
                            >
                                {t('understood')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
