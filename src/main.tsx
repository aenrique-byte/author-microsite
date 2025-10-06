import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Providers } from './app/providers'
import { Router } from './app/router'
import './styles/tailwind.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Providers>
          <Router />
        </Providers>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
