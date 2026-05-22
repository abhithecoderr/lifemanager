import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/base.css'
import './css/layout.css'
import './css/components/buttons.css'
import './css/components/modals.css'
import './css/components/cards.css'
import './css/components/common.css'
import './css/views/day.css'
import './css/views/calendar.css'
import './css/components/settings.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
