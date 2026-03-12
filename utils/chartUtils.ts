export const tailwindToHex = (colorClass: string) => {
  if (!colorClass) return "#888888";
  if (colorClass.includes("orange-400")) return "#fb923c";
  if (colorClass.includes("blue-400")) return "#60a5fa";
  if (colorClass.includes("amber-500")) return "#f59e0b";
  if (colorClass.includes("indigo-400")) return "#818cf8";
  if (colorClass.includes("yellow-400")) return "#facc15";
  if (colorClass.includes("red-400")) return "#f87171";
  if (colorClass.includes("purple-400")) return "#c084fc";
  if (colorClass.includes("sky-400")) return "#38bdf8";
  if (colorClass.includes("pink-400")) return "#f472b6";
  if (colorClass.includes("emerald-400")) return "#34d399";
  if (colorClass.includes("rose-400")) return "#fb7185";
  if (colorClass.includes("green-400")) return "#4ade80";
  if (colorClass.includes("amber-400")) return "#fbbf24";
  if (colorClass.includes("blue-300")) return "#93c5fd";
  if (colorClass.includes("gray-400")) return "#9ca3af";
  if (colorClass.includes("cyan-400")) return "#22d3ee";
  if (colorClass.includes("zinc-300")) return "#d4d4d8";
  if (colorClass.includes("violet-400")) return "#a78bfa";
  if (colorClass.includes("slate-400")) return "#94a3b8";
  if (colorClass.includes("teal-400")) return "#2dd4bf";
  if (colorClass.includes("rose-300")) return "#fda4af";
  if (colorClass.includes("slate-300")) return "#cbd5e1";
  if (colorClass.includes("indigo-300")) return "#a5b4fc";
  if (colorClass.includes("gray-300")) return "#d1d5db";
  if (colorClass.includes("zinc-500")) return "#71717a";
  return "#888888";
};

export const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1500,
    easing: 'easeInOutQuart' as const,
    delay: (context: any) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
            delay = context.dataIndex * 100 + context.datasetIndex * 100;
        }
        return delay;
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(24, 24, 27, 0.9)",
      titleColor: "#ffffff",
      bodyColor: "#e4e4e7",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      cornerRadius: 12,
      titleFont: { size: 14, weight: 'bold' as const },
      bodyFont: { size: 13 },
      usePointStyle: true,
    },
  },
  scales: {
    x: { 
        display: false,
        border: { display: false },
        grid: { display: false }
    },
    y: { 
        display: false,
        border: { display: false },
        grid: { display: false }
    },
  },
  interaction: {
    intersect: false,
    mode: "index" as const,
  },
};
