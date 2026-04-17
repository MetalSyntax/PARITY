import React from 'react';
import { Bar } from 'react-chartjs-2';
import { TransactionType, Currency } from '../../types';
import { getTranslation } from '../../i18n';
import { commonOptions } from '../../utils/chartUtils';
import { formatAmount } from '../../utils/formatUtils';
import { ChartProps } from './chartSetup';
import './chartSetup';

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
