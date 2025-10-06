import { ReactNode } from 'react'
import { ThemeProvider } from '../features/storytime/contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  )
}
