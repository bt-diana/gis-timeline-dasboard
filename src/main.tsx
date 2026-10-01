import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

async function startDevMocks() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./shared/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

function renderApp(container: HTMLElement) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void startDevMocks()
  .catch((error: unknown) => {
    console.error('Dev API mocks failed to start; the app runs without them.', error)
  })
  .then(() => {
    renderApp(root)
  })
