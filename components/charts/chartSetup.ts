import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler } from 'chart.js';
import { Transaction, Language, Currency } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler);

export interface ChartProps {
    transactions: Transaction[];
    lang: Language;
    exchangeRate: number;
    euroRate?: number;
    displayCurrency: Currency;
    isBalanceVisible: boolean;
}
