import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Providers } from './providers'
import { Router } from './router'
import '../styles/tailwind.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <Router />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
)
