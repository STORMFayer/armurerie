import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import CleanApp from './CleanApp'
import './clean.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CleanApp />
    <Toaster position="bottom-center" theme="dark" toastOptions={{ style: { borderRadius: 18, backdropFilter: 'blur(16px)', background: 'rgba(20,24,34,.85)', border: '1px solid rgba(255,255,255,.1)' } }} />
  </StrictMode>,
)
