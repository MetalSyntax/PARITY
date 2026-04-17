import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { TransactionType, Currency } from '../../types';
import { CATEGORIES } from '../../constants';
import { getTranslation } from '../../i18n';
import { commonOptions, tailwindToHex } from '../../utils/chartUtils';
import { formatAmount } from '../../utils/formatUtils';
import { ChartProps } from './chartSetup';
import './chartSetup';

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
