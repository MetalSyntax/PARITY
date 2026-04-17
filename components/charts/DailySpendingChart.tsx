import React from 'react';
import { Line } from 'react-chartjs-2';
import { TransactionType } from '../../types';
import { getTranslation } from '../../i18n';
import { commonOptions } from '../../utils/chartUtils';
import { formatAmount } from '../../utils/formatUtils';
import { ChartProps } from './chartSetup';
import './chartSetup';

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
