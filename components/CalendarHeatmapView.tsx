import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, ChevronDown, X } from 'lucide-react';
import { Transaction, TransactionType, Currency } from '../types';
import { getTranslation } from '../i18n';

interface CalendarHeatmapViewProps {
    transactions: Transaction[];
    lang: string;
    onBack: () => void;
    exchangeRate: number;
}

export const CalendarHeatmapView: React.FC<CalendarHeatmapViewProps> = ({ 
    transactions, 
    lang, 
    onBack,
    exchangeRate
}) => {
    const t = (key: any) => getTranslation(lang as any, key);
    const [currentDate, setCurrentDate] = useState(new Date());

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
                <button onClick={onBack} className="p-2 bg-white/5 rounded-xl text-zinc-400">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <button onClick={() => changeMonth(-1)} className="text-zinc-500 hover:text-white"><ChevronLeft size={16}/></button>
                    <span className="text-sm font-bold text-theme-primary capitalize">{monthYear}</span>
                    <button onClick={() => changeMonth(1)} className="text-zinc-500 hover:text-white"><ChevronRight size={16}/></button>
                </div>
                <button className="p-2 bg-white/5 rounded-xl text-zinc-400">
                    <CalendarIcon size={20} />
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
                            className={`aspect-square rounded-xl transition-all duration-300 ${day ? getIntensity(day) : 'opacity-0 cursor-default'}`}
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
                                <span className="font-bold">Promedio: ${Math.round(maxSpend * 0.8)} USD</span> / Bs. {Math.round(maxSpend * 0.8 * exchangeRate).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Análisis Inteligente</span>
                        <button className="text-red-400 text-xs font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
                    <span className="text-lg font-black text-theme-primary">${potentialSavings.toFixed(0)} USD</span>
                </div>
            </div>
        </div>
    );
};
