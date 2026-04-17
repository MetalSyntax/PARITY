import React from 'react';
import { Line } from 'react-chartjs-2';
import { commonOptions } from '../../utils/chartUtils';
import './chartSetup';

export const MarketVolatilityChart: React.FC<{
    history: { date: string, rate: number }[];
    lang: string;
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
