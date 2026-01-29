import React, { useMemo } from 'react';
import { ChevronLeft, Shield, TrendingUp, TrendingDown, Clock, CheckCircle2, LineChart, Activity } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Transaction, Currency, TransactionType } from '../types';
import { getTranslation } from '../i18n';

interface CurrencyPerformanceViewProps {
    transactions: Transaction[];
    exchangeRate: number;
    lang: string;
    onBack: () => void;
    isBalanceVisible: boolean;
}

export const CurrencyPerformanceView: React.FC<CurrencyPerformanceViewProps> = ({
    transactions,
    exchangeRate,
    lang,
    onBack,
    isBalanceVisible
}) => {
    const t = (key: any) => getTranslation(lang as any, key);

    const formatAmount = (usd: number) => {
        if (!isBalanceVisible) return '******';
        const val = usd; // This view doesn't use displayInVES
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    const volatilityData = {
        labels: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'],
        datasets: [{
            data: [
                exchangeRate * 0.95, 
                exchangeRate * 0.96, 
                exchangeRate * 0.955, 
                exchangeRate * 0.97, 
                exchangeRate * 0.98,
                exchangeRate * 0.99,
                exchangeRate
            ],
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
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }]
    };

    return (
        <div className="flex flex-col h-full bg-black text-white animate-in slide-in-from-right duration-500 overflow-hidden">
            {/* Header */}
            <div className="p-6 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-10 font-bold">
                <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-lg font-black tracking-tight">{t('currencyPerformance') || 'Rendimiento de Moneda'}</h2>
                <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-32">
                {/* Inflation Shield Card */}
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 mb-8 mt-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <Shield size={20} />
                            </div>
                            <h3 className="font-extrabold text-theme-primary text-xl">Escudo de Inflación</h3>
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full text-[10px] font-black border border-blue-500/20">
                            {isBalanceVisible ? `+${rateDiff.toFixed(1)}% vs IPC` : '******'}
                        </span>
                    </div>

                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Distribución de Impacto</p>
                    
                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden flex mb-6 shadow-inner">
                        <div className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all duration-1000" style={{ width: `${shieldStats.saved}%` }} />
                        <div className="h-full bg-rose-500" style={{ width: `${shieldStats.loss}%` }} />
                    </div>

                    <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-xs font-bold text-zinc-400">Ahorro por cambio <span className="text-white ml-2">{shieldStats.saved}%</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-400"><span className="text-white mr-2">{shieldStats.loss}%</span> Pérdida</span>
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                        </div>
                    </div>
                </div>

                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-1">Análisis de Mercado</p>

                {/* Market Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-500 p-6 rounded-[2rem] shadow-lg shadow-blue-500/20">
                        <p className="text-[10px] font-black text-blue-100/70 uppercase mb-2">Tu Tasa Promedio</p>
                        <div className="flex items-end gap-1 mb-3">
                            <span className="text-3xl font-black text-white">{formatAmount(avgUserRate)}</span>
                            <span className="text-xs font-bold text-blue-200 mb-1.5">Bs/$</span>
                        </div>
                        <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg text-[10px] font-black text-white">
                            <TrendingDown size={12} />
                            -2.8%
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem]">
                        <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Tasa Mercado</p>
                        <div className="flex items-end gap-1 mb-3">
                            <span className="text-3xl font-black text-white">{formatAmount(exchangeRate)}</span>
                            <span className="text-xs font-bold text-zinc-500 mb-1.5">Bs/$</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold">Hace 10min</span>
                        </div>
                    </div>
                </div>

                {/* Volatility Chart */}
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-theme-primary">Volatilidad (Spread)</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Últimos 7 días</p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-400 font-black">{isBalanceVisible ? '+1.50 Bs' : '******'}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Ganancia/Dólar</p>
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
                    <h4 className="text-2xl font-black text-white mb-2">¡Bien jugado!</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-bold">
                        Gastaste cuando el <span className="text-theme-brand">dólar estaba barato</span>. <br/>
                        Tu estrategia de cambio ahorró <span className="text-emerald-400">{isBalanceVisible ? 'Bs. 3,450' : '******'}</span> este mes.
                    </p>
                </div>
            </div>
        </div>
    );
};
