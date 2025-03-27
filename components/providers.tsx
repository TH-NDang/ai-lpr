import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ReactQueryProvider } from './query-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ReactQueryProvider>
        <NuqsAdapter>{children}</NuqsAdapter>
      </ReactQueryProvider>
    </ThemeProvider>
  )
}
