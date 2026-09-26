import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#eadfc4',
          color: '#1a130d',
          border: '1px solid #6b5238',
          borderRadius: 2,
          fontFamily: '"IM Fell English", Georgia, serif',
          fontSize: 16,
        },
      }}
    />
  </StrictMode>,
)
