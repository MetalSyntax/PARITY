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
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('original');

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('app_theme') as ThemeName;
    if (saved && themeData.themes[saved]) {
      setCurrentTheme(saved);
    }
  }, []);

  useEffect(() => {
    // Apply theme variables
    const theme = themeData.themes[currentTheme];
    const colors = theme.colors as Record<string, string>;
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

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
