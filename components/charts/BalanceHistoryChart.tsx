import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Language, Currency } from '../../types';
import { commonOptions } from '../../utils/chartUtils';
import { formatAmount } from '../../utils/formatUtils';
import './chartSetup';

export const BalanceHistoryChart: React.FC<{
    lang: Language;
    exchangeRate: number;
    euroRate?: number;
    displayCurrency: Currency;
    isBalanceVisible: boolean;
    type?: 'LINE' | 'BAR';
    history: { timestamp: number, balance: number }[];
}> = ({
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
