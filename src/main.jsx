import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { supabaseClient } from './App.jsx'
import ClientErrorBoundary from './components/ClientErrorBoundary.jsx'
import { installClientErrorLogging } from './utils/clientErrorLogger.js'

installClientErrorLogging(supabaseClient)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClientErrorBoundary>
      <App />
    </ClientErrorBoundary>
  </StrictMode>,
)
