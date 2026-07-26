import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'royal' | 'ocean' | 'emerald' | 'sunset' | 'midnight';

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  badge: string;
  primary: string;
  gradient: string;
  heroGradient: string;
  cardStyle: string;
  accentColor: string;
  bgSoft: string;
  sidebarActiveBg: string;
  isDark?: boolean;
}

export const THEME_CONFIGS: Record<ThemeName, ThemeConfig> = {
  royal: {
    id: 'royal',
    name: 'Electric Royal',
    badge: '⚡ Electric Blue',
    primary: '#3B66F5',
    gradient: 'from-[#3B66F5] via-[#2563EB] to-[#1D4ED8]',
    heroGradient: 'bg-gradient-to-br from-[#3B66F5] via-[#2563EB] to-[#1D4ED8]',
    cardStyle: 'bg-gradient-to-br from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white shadow-xl shadow-[#3B66F5]/20 border border-white/10',
    accentColor: '#38BDF8',
    bgSoft: '#F0F5FF',
    sidebarActiveBg: 'bg-[#3B66F5] text-white font-bold shadow-md shadow-[#3B66F5]/25 rounded-2xl'
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Sapphire',
    badge: '🌊 Ocean',
    primary: '#2563EB',
    gradient: 'from-blue-600 via-cyan-600 to-indigo-800',
    heroGradient: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-800',
    cardStyle: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-800 text-white shadow-xl shadow-blue-600/20',
    accentColor: '#38BDF8',
    bgSoft: '#EFF6FF',
    sidebarActiveBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Teal',
    badge: '🌿 Emerald',
    primary: '#059669',
    gradient: 'from-emerald-600 via-teal-600 to-indigo-800',
    heroGradient: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-800',
    cardStyle: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-800 text-white shadow-xl shadow-emerald-600/20',
    accentColor: '#34D399',
    bgSoft: '#F0FDF4',
    sidebarActiveBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Coral',
    badge: '🌅 Sunset',
    primary: '#EA580C',
    gradient: 'from-amber-500 via-orange-500 to-rose-700',
    heroGradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-700',
    cardStyle: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-700 text-white shadow-xl shadow-orange-600/20',
    accentColor: '#FB923C',
    bgSoft: '#FFF1F2',
    sidebarActiveBg: 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
  },
  midnight: {
    id: 'midnight',
    name: 'Cyber Midnight',
    badge: '🌙 Midnight',
    primary: '#6366F1',
    gradient: 'from-slate-900 via-indigo-950 to-purple-950',
    heroGradient: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950',
    cardStyle: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white shadow-xl shadow-indigo-950/40 border border-white/10',
    accentColor: '#A5B4FC',
    bgSoft: '#0F172A',
    sidebarActiveBg: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
    isDark: true
  }
};

interface ThemeContextType {
  currentTheme: ThemeName;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeName) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeName>('royal');

  useEffect(() => {
    const savedTheme = localStorage.getItem('eduverse_portal_theme') as ThemeName;
    if (savedTheme && THEME_CONFIGS[savedTheme]) {
      setCurrentThemeState(savedTheme);
    }
  }, []);

  const setTheme = (theme: ThemeName) => {
    if (THEME_CONFIGS[theme]) {
      setCurrentThemeState(theme);
      localStorage.setItem('eduverse_portal_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider 
      value={{
        currentTheme,
        themeConfig: THEME_CONFIGS[currentTheme],
        setTheme,
        availableThemes: Object.values(THEME_CONFIGS)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
