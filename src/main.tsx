import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

// Both typefaces are bundled with the app, so the demo also works offline.
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-400-italic.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-700.css'
import '@fontsource/stix-two-text/latin-400.css'
import '@fontsource/stix-two-text/latin-500.css'
import '@fontsource/stix-two-text/latin-600.css'
import './index.css'

import App from './App.tsx'
import { DemoProvider } from './lib/DemoProvider.tsx'

// Hash routing needs no server rewrites, so the static build runs on any host.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <DemoProvider>
        <App />
      </DemoProvider>
    </HashRouter>
  </StrictMode>,
)
