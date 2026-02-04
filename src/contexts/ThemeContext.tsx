import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type AppTheme = 'classic' | 'rainbow' | 'dark' | 'missendo';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'missendo-app-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && ['classic', 'rainbow', 'dark', 'missendo'].includes(stored)) {
        return stored as AppTheme;
      }
    }
    return 'classic';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove('theme-classic', 'theme-rainbow', 'theme-dark', 'theme-missendo');
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
