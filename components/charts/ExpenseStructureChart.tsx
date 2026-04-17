import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { TransactionType } from '../../types';
import { CATEGORIES } from '../../constants';
import { getTranslation } from '../../i18n';
import { commonOptions, tailwindToHex } from '../../utils/chartUtils';
import { formatAmount } from '../../utils/formatUtils';
import { ChartProps } from './chartSetup';
import './chartSetup';

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
