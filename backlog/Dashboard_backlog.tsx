/**
 * BACKLOG - Dashboard Unused Code
 * 
 * This file contains React state, references, and helper functions that were previously 
 * inside `views/Dashboard.tsx` but are currently unused. They are preserved here for 
 * future features (like interactive charts or custom currency formatting on the dashboard).
 */

// 1. Chart Interaction State & Refs
// These hooks were used to track hovering over the balance chart to show a specific point's data.

const [hoveredPoint, setHoveredPoint] = useState<{
  timestamp: number;
  balance: number;
} | null>(null);

const chartRef = useRef<HTMLDivElement>(null);


// 2. Chart Interaction Handler
// This function calculates the closest data point on the chart based on the user's touch/mouse position.

const handleChartInteraction = (e: React.MouseEvent | React.TouchEvent) => {
  if (!balanceHistory.history.length || !chartRef.current) return;

  // Check if we are interacting with the chart area
  const rect = chartRef.current.getBoundingClientRect();
  let clientX;

  if ("touches" in e) {
    clientX = e.touches[0].clientX;
  } else {
    clientX = (e as React.MouseEvent).clientX;
  }

  const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
  const width = rect.width;
  const xPercent = (x / width) * 100;

  const targetTs =
    (xPercent / 100) * balanceHistory.timeRange + balanceHistory.startTime;

  // Find closest point
  let closest = balanceHistory.history[0];
  let minDiff = Math.abs(targetTs - closest.timestamp);

  for (let i = 1; i < balanceHistory.history.length; i++) {
    const diff = Math.abs(targetTs - balanceHistory.history[i].timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = balanceHistory.history[i];
    }
  }
  setHoveredPoint(closest);
};


// 3. Currency Formatting Helpers
// These functions were intended to format chart values depending on the currently selected currency.

const formatChartValue = (usd: number) => {
  if (displayCurrency === Currency.VES) return usd * exchangeRate;
  if (displayCurrency === Currency.EUR) return (usd * exchangeRate) / (euroRate || 1);
  return usd;
};

const getSymbol = () => {
  if (displayCurrency === Currency.VES) return "Bs";
  if (displayCurrency === Currency.EUR) return "€";
  return "$";
};

const formatChartAmount = (usd: number) => {
  if (!isBalanceVisible) return '******';
  return formatAmount(usd, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate);
};