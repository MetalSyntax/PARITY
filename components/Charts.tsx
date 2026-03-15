import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Transaction, TransactionType, Language, Currency } from '../types';
import { CATEGORIES } from '../constants';
import { getTranslation } from '../i18n';
import { commonOptions, tailwindToHex } from '../utils/chartUtils';
import { formatAmount } from '../utils/formatUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler);

interface ChartProps {
    transactions: Transaction[];
    lang: Language;
    exchangeRate: number;
    euroRate?: number;
    displayCurrency: Currency;
    isBalanceVisible: boolean;
}

// 1. Income vs Expenses Chart (Bar/Line)
export const IncomeVsExpenseChart: React.FC<ChartProps & { type?: 'BAR' | 'LINE', mode?: 'BREAKDOWN' | 'SUMMARY', months?: number }> = ({
    transactions,
    lang,
    exchangeRate,
    euroRate,
    displayCurrency,
    isBalanceVisible,
    type = 'BAR',
    mode = 'BREAKDOWN',
    months = 6
}) => {
    const t = (key: any) => getTranslation(lang, key);
    const monthKeys = Array.from(new Set(transactions.map(tx => tx.date.slice(0, 7)))).sort().slice(-months);

    const totalIncome = transactions.reduce((acc, tx) => tx.type === TransactionType.INCOME ? acc + tx.normalizedAmountUSD : acc, 0);
    const totalSpent = transactions.reduce((acc, tx) => tx.type === TransactionType.EXPENSE ? acc + tx.normalizedAmountUSD : acc, 0);
    const netFlow = totalIncome - totalSpent;

    if (type === 'BAR') {
        if (mode === 'SUMMARY') {
            return (
                <Bar
                    data={{
                        labels: [t("income"), t("expense"), t("netCashFlow") || 'Net'],
                        datasets: [{
                            data: [totalIncome, totalSpent, netFlow],
                            backgroundColor: ['rgba(52, 211, 153, 0.7)', 'rgba(248, 113, 113, 0.7)', 'rgba(96, 165, 250, 0.7)'],
                            borderRadius: 12,
                            barThickness: 30,
                        }]
                    }}
                    options={{
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            tooltip: {
                                ...commonOptions.plugins.tooltip,
                                callbacks: { label: (context: any) => `${context.label}: ${formatAmount(context.raw, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}` }
                            }
                        },
                        scales: {
                            x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                            y: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } }
                        }
                    }}
                />
            );
        }

        const sortedCategories = CATEGORIES.map(cat => {
            const total = transactions
                .filter(tx => tx.category === cat.id && tx.type === TransactionType.EXPENSE)
                .reduce((acc, tx) => acc + tx.normalizedAmountUSD, 0);
            return { ...cat, total };
        }).sort((a, b) => b.total - a.total).filter(c => c.total > 0).slice(0, 4);

        return (
            <Bar
                data={{
                    labels: [t('income'), t('expenses')],
                    datasets: [
                        {
                            label: t('income'),
                            data: [totalIncome, 0],
                            backgroundColor: 'rgba(52, 211, 153, 0.8)',
                            borderRadius: 12,
                            barThickness: 40,
                        },
                        ...sortedCategories.map((cat, idx) => ({
                            label: t(cat.name as any),
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
                                label: (context: any) => {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.x !== undefined) {
                                        label += formatAmount(context.parsed.x, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate);
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
                            ticks: {
                                color: '#71717a', font: { size: 10 }, callback: (vPro: any) => {
                                    const v = Number(vPro);
                                    if (displayCurrency === Currency.VES) return `${(v * exchangeRate / 1000).toFixed(0)}k Bs.`;
                                    if (displayCurrency === Currency.EUR) return `€${(v * exchangeRate / (euroRate || 1)).toFixed(0)}`;
                                    return `$${v}`;
                                }
                            }
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
        );
    }

    return (
        <Line
            data={{
                labels: monthKeys,
                datasets: [
                    {
                        label: t('income'),
                        data: monthKeys.map(m => transactions.filter(tx => tx.date.startsWith(m) && tx.type === TransactionType.INCOME).reduce((a, c) => a + c.normalizedAmountUSD, 0)),
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
                        data: monthKeys.map(m => transactions.filter(tx => tx.date.startsWith(m) && tx.type === TransactionType.EXPENSE).reduce((a, c) => a + c.normalizedAmountUSD, 0)),
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
                            label: (context: any) => `${context.dataset.label}: ${formatAmount(context.parsed.y, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}`
                        }
                    }
                },
                scales: {
                    x: { display: true, grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } },
                    y: {
                        display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: {
                            color: '#71717a', font: { size: 10 }, callback: (vPro: any) => {
                                const v = Number(vPro);
                                if (displayCurrency === Currency.VES) return `${(v * exchangeRate / 1000).toFixed(0)}k Bs.`;
                                if (displayCurrency === Currency.EUR) return `€${(v * exchangeRate / (euroRate || 1)).toFixed(0)}`;
                                return `$${v}`;
                            }
                        }
                    }
                }
            }}
        />
    );
};

// 2. Expense Structure Chart (Doughnut/Bar)
export const ExpenseStructureChart: React.FC<ChartProps & { type?: 'DOUGHNUT' | 'BAR', selectedCategoryId?: string | null, onCategoryClick?: (id: string | null) => void }> = ({
    transactions,
    lang,
    exchangeRate,
    euroRate,
    displayCurrency,
    isBalanceVisible,
    type = 'DOUGHNUT',
    selectedCategoryId,
    onCategoryClick
}) => {
    const t = (key: any) => getTranslation(lang, key);
    const expenseTransactions = transactions.filter(tx => tx.type === TransactionType.EXPENSE);
    const totalSpent = expenseTransactions.reduce((acc, tx) => acc + tx.normalizedAmountUSD, 0);

    const structure = CATEGORIES.map(cat => {
        const amount = expenseTransactions
            .filter(tx => tx.category === cat.id)
            .reduce((acc, tx) => acc + tx.normalizedAmountUSD, 0);
        return {
            ...cat,
            amount,
            percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
        };
    }).filter(s => s.amount > 0).sort((a, b) => b.amount - a.amount);

    if (type === 'DOUGHNUT') {
        return (
            <div className="relative h-full w-full flex items-center justify-center">
                <Doughnut
                    data={{
                        labels: structure.map(s => t(s.name as any)),
                        datasets: [{
                            data: structure.map(s => s.amount),
                            backgroundColor: structure.map(s => {
                                const baseColor = tailwindToHex(s.color);
                                return (selectedCategoryId && selectedCategoryId !== s.id) ? baseColor + '40' : baseColor;
                            }),
                            borderWidth: 0,
                            hoverOffset: 10
                        }]
                    }}
                    options={{
                        ...commonOptions,
                        cutout: '80%',
                        onClick: (_, elements) => {
                            if (onCategoryClick) {
                                if (elements.length > 0) {
                                    const index = elements[0].index;
                                    const catId = structure[index].id;
                                    onCategoryClick(selectedCategoryId === catId ? null : catId);
                                } else {
                                    onCategoryClick(null);
                                }
                            }
                        },
                        plugins: {
                            ...commonOptions.plugins,
                            tooltip: {
                                ...commonOptions.plugins.tooltip,
                                callbacks: {
                                    label: (context: any) => `${context.label}: ${formatAmount(context.raw, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}`
                                }
                            }
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <Bar
            data={{
                labels: structure.slice(0, 5).map(s => t(s.name as any)),
                datasets: [{
                    data: structure.slice(0, 5).map(s => s.amount),
                    backgroundColor: structure.slice(0, 5).map(s => tailwindToHex(s.color)),
                    borderRadius: 6,
                }]
            }}
            options={{
                ...commonOptions,
                indexAxis: 'y' as const,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: { label: (context: any) => `${context.label}: ${formatAmount(context.parsed.x, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}` }
                    }
                },
                scales: {
                    x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                    y: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#e4e4e7", font: { size: 10 } } }
                }
            }}
        />
    );
};

// 3. Monthly Net Flow Chart
export const MonthlyNetFlowChart: React.FC<ChartProps & { months?: number }> = ({
    transactions,
    lang,
    exchangeRate,
    euroRate,
    displayCurrency,
    isBalanceVisible,
    months = 6
}) => {
    const t = (key: any) => getTranslation(lang, key);
    const monthKeys = Array.from(new Set(transactions.map(tx => tx.date.slice(0, 7)))).sort().slice(-months);

    return (
        <Bar
            data={{
                labels: monthKeys,
                datasets: [{
                    label: t('netFlow'),
                    data: monthKeys.map(m => {
                        const monthT = transactions.filter(tx => tx.date.startsWith(m));
                        const inc = monthT.filter(tx => tx.type === TransactionType.INCOME).reduce((a, c) => a + c.normalizedAmountUSD, 0);
                        const exp = monthT.filter(tx => tx.type === TransactionType.EXPENSE).reduce((a, c) => a + c.normalizedAmountUSD, 0);
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
                            label: (context: any) => `${context.dataset.label}: ${formatAmount(context.parsed.y, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}`
                        }
                    }
                },
                scales: {
                    y: {
                        display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: {
                            color: '#71717a', font: { size: 10 }, callback: (vPro: any) => {
                                const v = Number(vPro);
                                if (displayCurrency === Currency.VES) return `${(v * exchangeRate / 1000).toFixed(0)}k Bs.`;
                                if (displayCurrency === Currency.EUR) return `€${(v * exchangeRate / (euroRate || 1)).toFixed(0)}`;
                                return `$${v}`;
                            }
                        }
                    },
                    x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } }
                }
            }} />
    );
};

// 4. Daily Spending Chart (Last 7 days)
export const DailySpendingChart: React.FC<ChartProps> = ({
    transactions,
    lang,
    exchangeRate,
    euroRate,
    displayCurrency,
    isBalanceVisible
}) => {
    const t = (key: any) => getTranslation(lang, key);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    return (
        <Line
            data={{
                labels: last7Days.map(date => {
                    const d = new Date(date + 'T12:00:00');
                    return d.toLocaleDateString(undefined, { weekday: 'short' });
                }),
                datasets: [{
                    label: t('dailySpending'),
                    data: last7Days.map(date => transactions.filter(tx => tx.date.startsWith(date) && tx.type === TransactionType.EXPENSE).reduce((a, c) => a + c.normalizedAmountUSD, 0)),
                    borderColor: "#fb923c",
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, "rgba(251,146,60, 0.3)");
                        gradient.addColorStop(1, "rgba(251,146,60, 0)");
                        return gradient;
                    },
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: "#fb923c",
                }]
            }}
            options={{
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: { label: (context: any) => `${context.dataset.label}: ${formatAmount(context.raw, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}` }
                    }
                },
                scales: {
                    x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                    y: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } }
                }
            }}
        />
    );
};

// 5. Income Distribution Chart
export const IncomeDistributionChart: React.FC<ChartProps> = ({
    transactions,
    lang,
    exchangeRate,
    euroRate,
    displayCurrency,
    isBalanceVisible
}) => {
    const t = (key: any) => getTranslation(lang, key);
    const incomeTransactions = transactions.filter(tx => tx.type === TransactionType.INCOME);
    const incomeCategories = CATEGORIES.map(cat => {
        const total = incomeTransactions
            .filter(tx => tx.category === cat.id)
            .reduce((acc, tx) => acc + tx.normalizedAmountUSD, 0);
        return { ...cat, total };
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    return (
        <Doughnut
            data={{
                labels: incomeCategories.map(c => t(c.name as any)),
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
                            label: (context: any) => `${context.label}: ${formatAmount(context.raw, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate)}`
                        }
                    }
                }
            }}
        />
    );
};

// 6. Balance History Chart (Last 7 Days)
export const BalanceHistoryChart: React.FC<ChartProps & { type?: 'LINE' | 'BAR', history: { timestamp: number, balance: number }[] }> = ({
    lang,
    exchangeRate,
    euroRate,
    displayCurrency,
    isBalanceVisible,
    type = 'LINE',
    history
}) => {
    return (
        <div className="h-full w-full">
            {type === 'LINE' ? (
                <Line
                    data={{
                        labels: history.map((h) => new Date(h.timestamp).toLocaleDateString(undefined, { weekday: "short" })),
                        datasets: [{
                            data: history.map((h) => h.balance),
                            borderColor: "#6366f1",
                            backgroundColor: (context) => {
                                const ctx = context.chart.ctx;
                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                gradient.addColorStop(0, "rgba(99,102,241, 0.4)");
                                gradient.addColorStop(1, "rgba(99,102,241, 0)");
                                return gradient;
                            },
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0
                        }]
                    }}
                    options={{
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            tooltip: {
                                ...commonOptions.plugins.tooltip,
                                callbacks: { label: (context) => formatAmount(context.raw as number, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate) }
                            }
                        },
                        scales: {
                            x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                            y: { display: false }
                        }
                    }}
                />
            ) : (
                <Bar
                    data={{
                        labels: history.map((h) => new Date(h.timestamp).toLocaleDateString(undefined, { weekday: "short" })),
                        datasets: [{
                            data: history.map((h) => h.balance),
                            backgroundColor: 'rgba(99, 102, 241, 0.6)',
                            borderRadius: 4
                        }]
                    }}
                    options={{
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            tooltip: {
                                ...commonOptions.plugins.tooltip,
                                callbacks: { label: (context) => formatAmount(context.parsed.y, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate) }
                            }
                        },
                        scales: {
                            x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: "#71717a", font: { size: 10 } } },
                            y: { display: false }
                        }
                    }}
                />
            )}
        </div>
    );
};

// 7. Market Volatility Chart
export const MarketVolatilityChart: React.FC<{
    history: { date: string, rate: number }[],
    lang: string
}> = ({ history, lang }) => {
    return (
        <Line 
            data={{
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
            }} 
            options={{
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false },
                    tooltip: { enabled: true }
                },
                scales: {
                    x: { display: true, grid: { display: false }, border: { display: false }, ticks: { color: '#52525b', font: { size: 9 } } },
                    y: { display: false, border: { display: false } }
                }
            } as any}
        />
    );
};
