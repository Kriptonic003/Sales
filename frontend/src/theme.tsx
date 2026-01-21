import { createContext, useContext } from "react";
import { useDarkMode } from "./hooks/useDarkMode";

type ThemeCtx = { dark: boolean; toggle: () => void };

const ThemeContext = createContext<ThemeCtx>({ dark: true, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useDarkMode();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

