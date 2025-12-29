import type { ReactNode } from "react";

import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["system", "light", "dark", "modern-minimal-light", "modern-minimal-dark"]}
    >
      {children}
    </NextThemesProvider>
  );
}
