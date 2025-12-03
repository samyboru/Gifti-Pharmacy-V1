// File Location: client/src/context/ThemeContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

// --- CHANGE: Added 'oceanic' back to the Theme type ---
export type Theme = 'light' | 'dark' | 'gopharma-blue' | 'oceanic';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// --- CHANGE: Added 'oceanic' back to the validation array ---
const VALID_THEMES: Theme[] = ['light', 'dark', 'gopharma-blue', 'oceanic'];

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('app-theme');
    
    if (storedTheme && VALID_THEMES.includes(storedTheme as Theme)) {
      return storedTheme as Theme;
    }
    
    // The default remains our flagship theme
    return 'gopharma-blue'; 
  });

  useEffect(() => {
    document.body.className = `${theme}-theme`;
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
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