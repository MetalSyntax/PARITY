import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { TransactionType } from '../../types';
import { CATEGORIES } from '../../constants';
import { getTranslation } from '../../i18n';
import { commonOptions, tailwindToHex } from '../../utils/chartUtils';
import { formatAmount } from '../../utils/formatUtils';
import { ChartProps } from './chartSetup';
import './chartSetup';

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
