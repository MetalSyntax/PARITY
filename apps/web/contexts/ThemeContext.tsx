import React, { createContext, useContext, useState, useEffect } from 'react';
import themeData from '../themes.json';

type ThemeName = keyof typeof themeData.themes;

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  availableThemes: { id: string; name: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('app_theme') as ThemeName;
    return (saved && themeData.themes[saved]) ? saved : 'original';
  });

  useEffect(() => {
    // Apply theme variables
    const theme = themeData.themes[currentTheme];
    const colors = theme.colors as Record<string, string>;
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Sync Chart.js defaults if Chart is available globally
    if ((window as any).Chart) {
      const Chart = (window as any).Chart;
      Chart.defaults.color = colors['--chart-text'];
      Chart.defaults.borderColor = colors['--chart-grid'];
      Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
      Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
      Chart.defaults.plugins.tooltip.bodyColor = '#a1a1aa';
      Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
      Chart.defaults.plugins.tooltip.borderWidth = 1;
      
      // Force refresh charts
      Object.values(Chart.instances).forEach((chart: any) => chart.update());
    }

    // Update meta theme-color for mobile browsers (Android & iOS)
    // Using --bg-primary to match the main app background for a seamless status bar
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor && colors['--bg-primary']) {
      metaThemeColor.setAttribute("content", colors['--bg-primary']);
    }

    localStorage.setItem('app_theme', currentTheme);
  }, [currentTheme]);

  const availableThemes = Object.entries(themeData.themes).map(([key, val]) => ({
    id: key,
    name: val.name
  }));

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: setCurrentTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
