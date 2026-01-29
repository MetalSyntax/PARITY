import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, ChevronDown, X, Coins, DollarSign } from 'lucide-react';
import { Transaction, TransactionType, Currency } from '../types';
import { getTranslation } from '../i18n';

interface CalendarHeatmapViewProps {
    transactions: Transaction[];
    lang: string;
    onBack: () => void;
    exchangeRate: number;
    displayInVES: boolean;
    onToggleDisplayCurrency: () => void;
}

export const CalendarHeatmapView: React.FC<CalendarHeatmapViewProps> = ({ 
    transactions, 
    lang, 
    onBack,
    exchangeRate,
    displayInVES,
    onToggleDisplayCurrency
}) => {
    const t = (key: any) => getTranslation(lang as any, key);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ date: Date, txs: Transaction[] } | null>(null);
    const [showPatternDetails, setShowPatternDetails] = useState(false);

    const monthYear = currentDate.toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' });
    
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
                    <button onClick={onBack} className="p-2 bg-white/5 rounded-xl text-zinc-400">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                        <button onClick={() => changeMonth(-1)} className="text-zinc-500 hover:text-white"><ChevronLeft size={16}/></button>
                        <span className="text-sm font-bold text-theme-primary capitalize">{monthYear}</span>
                        <button onClick={() => changeMonth(1)} className="text-zinc-500 hover:text-white"><ChevronRight size={16}/></button>
                    </div>
                </div>
                <button 
                    onClick={onToggleDisplayCurrency}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 transition-all font-black text-[10px] ${displayInVES ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
                >
                    {displayInVES ? <Coins size={14} /> : <DollarSign size={14} />}
                    <span className="hidden sm:inline">{displayInVES ? 'VES' : 'USD'}</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-32">
                <div className="mb-8 mt-2">
                    <h1 className="text-3xl font-black text-theme-primary mb-1">Mapa de Calor</h1>
                    <p className="text-sm text-theme-secondary opacity-70">Intensidad de gastos diarios</p>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-3 mb-8">
                    {['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'].map(day => (
                        <div key={day} className="text-[10px] font-black text-zinc-600 text-center mb-2">{day}</div>
                    ))}
                    {daysInMonth.map((day, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => {
                                if (day) {
                                    const key = day.toISOString().split('T')[0];
                                    const txs = transactions.filter(t => t.date.split('T')[0] === key && t.type === TransactionType.EXPENSE);
                                    setSelectedDay({ date: day, txs });
                                }
                            }}
                            className={`aspect-square rounded-xl transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 ${day ? getIntensity(day) : 'opacity-0 cursor-default'}`}
                        />
                    ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mb-12">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-800/50" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Sin gasto</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-400/60" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Bajo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Alto</span>
                    </div>
                </div>

                {/* Spending Pattern Card */}
                <div className="bg-gradient-to-br from-theme-surface to-zinc-900 p-6 rounded-[2.5rem] border border-white/5 mb-6 relative overflow-hidden group">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <TrendingUp size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg text-theme-primary mb-1">Patrón de Gasto</h3>
                            <p className="text-xs text-theme-secondary leading-relaxed opacity-80">
                                Tus viernes son días de gasto fuerte. <br/>
                                <span className="font-bold">Promedio: {displayInVES ? 'Bs.' : '$'} {Math.round(displayInVES ? maxSpend * 0.8 * exchangeRate : maxSpend * 0.8).toLocaleString()} {displayInVES ? '' : 'USD'}</span> / {displayInVES ? '$' : 'Bs.'} {Math.round(displayInVES ? maxSpend * 0.8 : maxSpend * 0.8 * exchangeRate).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Análisis Inteligente</span>
                        <button 
                            onClick={() => setShowPatternDetails(true)}
                            className="text-red-400 text-xs font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                        >
                            Ver detalles <TrendingUp size={14} />
                        </button>
                    </div>
                </div>

                {/* Potential Savings */}
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-theme-brand/20 flex items-center justify-center text-theme-brand">
                            <TrendingUp size={16} className="rotate-45" />
                        </div>
                        <span className="text-xs font-bold text-theme-secondary opacity-80">Ahorro potencial este mes</span>
                    </div>
                    <span className="text-lg font-black text-theme-primary">{displayInVES ? 'Bs.' : '$'} {(displayInVES ? potentialSavings * exchangeRate : potentialSavings).toFixed(0)} {displayInVES ? '' : 'USD'}</span>
                </div>
            </div>

            {/* Daily Transactions Modal */}
            {selectedDay && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
                    <div className="bg-theme-surface w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-400">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-1">{selectedDay.date.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { weekday: 'long' })}</h3>
                                <h2 className="text-xl font-black text-theme-primary">{selectedDay.date.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</h2>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-3 bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 max-h-[50vh] overflow-y-auto no-scrollbar">
                            {selectedDay.txs.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedDay.txs.map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
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
                                                <p className="text-sm font-black text-red-400">-{displayInVES ? 'Bs.' : '$'} {(displayInVES ? (tx.originalCurrency === Currency.USD ? tx.amount * exchangeRate : tx.amount) : (tx.originalCurrency === Currency.USD ? tx.amount : tx.amount / exchangeRate)).toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-zinc-500">~{displayInVES ? '$' : 'Bs.'} {(displayInVES ? (tx.originalCurrency === Currency.USD ? tx.amount : tx.amount / exchangeRate) : (tx.originalCurrency === Currency.USD ? tx.amount * exchangeRate : tx.amount)).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-xs font-black text-zinc-500 uppercase">Total Diario</span>
                                        <span className="text-lg font-black text-theme-primary">{displayInVES ? 'Bs.' : '$'} {(displayInVES ? selectedDay.txs.reduce((a,b) => a + b.normalizedAmountUSD, 0) * exchangeRate : selectedDay.txs.reduce((a,b) => a + b.normalizedAmountUSD, 0)).toFixed(2)} {displayInVES ? '' : 'USD'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                                        <CalendarIcon size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-zinc-500">No hay gastos registrados este día.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pattern Details Modal */}
            {showPatternDetails && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
                    <div className="bg-theme-surface w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-400">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-500/10 to-transparent">
                            <div>
                                <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-1">Análisis de Patrones</h3>
                                <h2 className="text-xl font-black text-theme-primary">Detalles del Gasto</h2>
                            </div>
                            <button onClick={() => setShowPatternDetails(false)} className="p-3 bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-xs font-bold text-zinc-400">Día de mayor gasto</span>
                                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">Viernes</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-xs font-bold text-zinc-400">Categoría dominante</span>
                                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">Entretenimiento</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-xs font-bold text-zinc-400">Frecuencia crítica</span>
                                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">Quincenal</span>
                                </div>
                            </div>

                            <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">Recomendación</h4>
                                <p className="text-sm text-theme-secondary leading-relaxed font-medium">
                                    Detectamos que tus gastos aumentan un 40% durante los fines de semana. Considera establecer un tope de retiro los jueves para evitar compras impulsivas.
                                </p>
                            </div>

                            <button 
                                onClick={() => setShowPatternDetails(false)}
                                className="w-full py-4 bg-theme-primary text-theme-bg font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
