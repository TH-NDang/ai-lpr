import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { NuqsAdapter } from "nuqs/adapters/next/app";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <NuqsAdapter>
        {children}
      </NuqsAdapter>
    </ThemeProvider>
  );
}
